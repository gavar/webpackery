import { loadOptions, PluginItem, PluginObj, TransformOptions } from "@babel/core";
import { setDefaultBy, WebpackConfigurer, WebpackContext } from "@webpackery/core";
import { omit } from "lodash";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import { RuleSetCondition, RuleSetRule } from "webpack";
import { InjectEmptyExports } from "./inject-empty-exports";
import { findTsConfigFile, readTsConfigFile } from "./ts-utils";

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

    // load babel options
    const loaded = loadOptions({
      filename: __filename,
      ...props.options,
    }) as LoadedOptions;

    // dynamic defaults
    setDefaultBy(props, "useReact", isReact, loaded.plugins);
    setDefaultBy(props, "useTypesScript", isTypeScript, loaded.plugins);
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
      const ts = require("typescript");
      const tsconfigPath = props.tsconfigPath || findTsConfigFile(ts, context.config.context);
      if (tsconfigPath) {
        const tsconfig = readTsConfigFile(ts, tsconfigPath);
        const {compilerOptions} = tsconfig;
        const {paths, preserveConstEnums} = compilerOptions;

        // use tsconfig paths for resolution
        if (paths)
          context.resolve.plugin(new TsconfigPathsPlugin({
            extensions: props.extensions,
            configFile: tsconfigPath,
          }));

        // add common typescript plugins
        custom.plugins.push(
          constEnumPlugin(preserveConstEnums),
          InjectEmptyExports,
        );
      }
    }

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

function isReact(plugins: Plugin[]): boolean {
  return plugins.some(isReactPlugin);
}

function isTypeScript(plugins: Plugin[]): boolean {
  return plugins.some(isTypeScriptPlugin);
}

/** Whether plugin relates to TypeScript. */
function isTypeScriptPlugin(plugin: Plugin) {
  return plugin.key.startsWith("transform-typescript");
}

/** Whether plugin relates to React. */
function isReactPlugin(plugin: Plugin) {
  return plugin.key.startsWith("transform-react");
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
