import {
  ConfigItem,
  loadOptions,
  loadPartialConfig,
  PartialConfig,
  PluginItem,
  PluginObj,
  TransformOptions,
} from "@babel/core";
import { setDefaultBy, WebpackConfigurer, WebpackContext } from "@webpackery/core";
import { omit } from "lodash";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import { CompilerOptions } from "typescript";
import { RuleSetCondition, RuleSetRule } from "webpack";
import { InjectEmptyExports } from "./inject-empty-exports";
import { createTypeScriptHost, findTsConfigFile, parseJsonConfigFileContent, readTsConfigFile } from "./ts-utils";

export namespace BabelConfigurer {
  export interface Props extends RuleSetRule {
    /**
     * @see RuleSetRule#test.
     * @default regex from {@link extensions}.
     */
    test?: RuleSetCondition;

    /** Babel loader options. */
    options?: TransformOptions;

    /**
     * Extensions to register for webpack resolution.
     * @default
     * - includes `.ts` when `@babel/preset-typescript` preset
     * - includes `.[jt]sx` when `@babel/react` preset
     */
    extensions?: string[];

    /**
     * Whether to process React files.
     * Enabled by default when any React related plugin detected.
     */
    useReact?: boolean;

    /**
     * Whether to process TypeScript files.
     * Enabled by default when any TypeScript related plugin detected.
     */
    useTypesScript?: boolean;

    /**
     * Path to a tsconfig.json.
     * May define additional properties to use in babel / webpack.
     */
    tsconfigPath?: string;
  }
}

const omitKeys: Array<Exclude<keyof BabelConfigurer.Props, keyof RuleSetRule>> = [
  "extensions",
  "tsconfigPath",
  "useReact",
  "useTypesScript",
];

export class BabelConfigurer extends WebpackConfigurer<BabelConfigurer.Props> {

  /** @inheritdoc */
  protected prepare(props: BabelConfigurer.Props, context: WebpackContext): BabelConfigurer.Props {
    const {production} = context;

    // defaults
    props = {...props};
    props.options = {
      sourceMaps: production,
      envName: production ? "production" : "development",
      ...props.options,
    };

    const partial = loadPartialConfig({
      filename: __filename,
      ...props.options,
    });

    const loaded = loadOptions({
      filename: __filename,
      ...props.options,
    }) as LoadedOptions;

    // dynamic defaults
    setDefaultBy(props, "useReact", isReact, partial, loaded.plugins);
    setDefaultBy(props, "useTypesScript", isTypeScript, partial, loaded.plugins);
    setDefaultBy(props, "extensions", resolveDefaultExtensions, props);
    setDefaultBy(props, "test", extensionsToRegex, props.extensions);
    return props;
  }

  /** @inheritdoc */
  protected configure(context: WebpackContext, props: BabelConfigurer.Props): void {
    const custom: TransformOptions = {
      plugins: [],
    };

    // configure TypeScript
    if (props.useTypesScript) {
      const options: CompilerOptions = {
        preserveConstEnums: false,
        experimentalDecorators: false,
      };

      const ts = require("typescript");
      const tsconfigPath = props.tsconfigPath || findTsConfigFile(ts, context.config.context);
      if (tsconfigPath) {
        const host = createTypeScriptHost(ts);
        const json = readTsConfigFile(host, tsconfigPath);
        const tsconfig = parseJsonConfigFileContent(host, json);
        Object.assign(options, tsconfig.options);

        // use tsconfig paths for resolution
        if (options.paths)
          context.resolve.plugin(new TsconfigPathsPlugin({
            extensions: props.extensions,
            configFile: tsconfigPath,
          }));
      }

      // add plugins based on compiler options
      custom.plugins.push(
        options.experimentalDecorators && ["@babel/plugin-proposal-decorators", {legacy: true}],
        ["@babel/plugin-proposal-class-properties", {loose: true}],
        constEnumPlugin(options.preserveConstEnums),
        InjectEmptyExports,
      );
    }

    // filler out disabled plugins
    custom.plugins = custom.plugins.filter(Boolean);

    const rule: RuleSetRule = {
      loader: require.resolve("./babel-custom-loader"),
      ...omit(props, omitKeys),
      options: {custom, ...props.options},
    };

    context.module.rule(rule);
    context.resolve.extension(...props.extensions);
  }
}

function extensionsToRegex(extensions: string[]): RuleSetCondition {
  if (extensions && extensions.length) {
    const group = extensions.map(x => x.slice(1)).join("|");
    const pattern = `\.(${group})$`;
    return new RegExp(pattern);
  }
}

function resolveDefaultExtensions(props: BabelConfigurer.Props): string[] {
  const {useReact, useTypesScript} = props;
  return [
    ".js", ".es6", ".es", ".mjs",
    useReact && ".jsx",
    useTypesScript && [".ts", ".d.ts"],
    useTypesScript && useReact && ".tsx",
  ].filter(Boolean).flat();
}

function isReact(partial: PartialConfig, plugins: Plugin[]): boolean {
  return someRequestName(partial.options.presets, isTypeScriptName)
    || someRequestName(partial.options.plugins, isTypeScriptName)
    || somePluginName(plugins, isTypeScriptName);
}

function isTypeScript(partial: PartialConfig, plugins: Plugin[]): boolean {
  return someRequestName(partial.options.presets, isReactName)
    || someRequestName(partial.options.plugins, isReactName)
    || somePluginName(plugins, isReactName);
}

/** Whether plugin / preset name relates to TypeScript. */
function isTypeScriptName(name: string) {
  return name.includes("typescript");
}

/** Whether plugin / preset name relates to React. */
function isReactName(name: string) {
  return name.includes("react");
}

/** Create plugin configuration item for `babel-plugin-const-enum`. */
function constEnumPlugin(preserveConstEnums: boolean): PluginItem {
  const transform = preserveConstEnums ? "removeConst" : "constObject";
  return ["babel-plugin-const-enum", {transform}];
}

interface LoadedOptions extends TransformOptions {
  plugins: Plugin[];
}

interface Plugin<T = any> extends PluginObj<T> {
  name: never;
  key: string;
  options: object;
}

function somePluginName<T>(plugins: Plugin<T>[], predicate: (name: string) => boolean): boolean {
  if (plugins)
    for (const plugin of plugins)
      if (predicate(plugin.key))
        return true;
}

function someRequestName(items: PluginItem[], predicate: (name: string) => boolean): boolean {
  if (items)
    for (const item of items)
      if (predicate(requestOf(item)))
        return true;
}

function requestOf(item: PluginItem): string {
  if (item) {
    if (typeof item === "string") return item;
    if (Array.isArray(item)) return requestOf(item[0]);
    if ((item as ConfigItem).file) return (item as ConfigItem).file.request;
  }
}
