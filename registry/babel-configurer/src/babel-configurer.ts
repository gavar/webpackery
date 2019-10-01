import {
  ConfigItem,
  loadPartialConfig,
  PartialConfig,
  PluginItem,
  TransformCaller,
  TransformOptions,
} from "@babel/core";
import { setDefaultBy, WebpackConfigurer, WebpackContext } from "@webpackery/core";
import { resolve } from "path";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import { RuleSetCondition, RuleSetRule } from "webpack";
import { InjectEmptyExports } from "./inject-empty-exports";
import { findTsConfigFile, readTsConfigFile } from "./ts-utils";

export namespace BabelConfigurer {
  export interface LoaderOptions extends TransformOptions {
    overrides?: TransformOptions[];
  }

  export interface Props extends RuleSetRule {
    /**
     * @see RuleSetRule#test.
     * @default regex from {@link extensions}.
     */
    test?: RuleSetCondition;

    /**
     * Extensions to register for webpack resolution.
     * @default
     * - includes `.ts` when `@babel/preset-typescript` preset
     * - includes `.[jt]sx` when `@babel/react` preset
     */
    extensions?: string[];

    /** Babel loader options. */
    options?: LoaderOptions;
  }
}

export class BabelConfigurer extends WebpackConfigurer<BabelConfigurer.Props> {

  /** @inheritdoc */
  protected prepare(props: BabelConfigurer.Props, context: WebpackContext): BabelConfigurer.Props {
    const {production} = context;
    // defaults
    props = {...props};

    // default options
    props.options = {
      sourceMaps: production,
      envName: production ? "production" : "development",
      plugins: [],
      overrides: [],
      ...props.options,
    };

    // clone objects
    const plugins = props.options.plugins = Array.from(props.options.plugins);
    props.options.overrides = Array.from(props.options.overrides);

    const config = loadPartialConfig({
      filename: resolve("./any.js"),
      caller: {
        name: "@webpackery/babel-configurer",
        supportsStaticESM: true,
        supportsDynamicImport: true,
      } as TransformCaller,
      ...props.options,
    });

    setDefaultBy(props, "extensions", resolveDefaultExtensions, config);
    setDefaultBy(props, "test", extensionsToRegex, props.extensions);

    if (isTypeScript(config)) {
      const ts = require("typescript");
      const tsconfigPath = findTsConfigFile(ts, context.config.context);
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

        const transform = preserveConstEnums ? "removeConst" : "constObject";
        plugins.push(
          InjectEmptyExports,
          ["babel-plugin-const-enum", {transform}],
        );
      }
    }
    return props;
  }

  /** @inheritdoc */
  protected configure(context: WebpackContext, props: BabelConfigurer.Props): void {
    const {extensions, ...rule} = props;
    context.module.rule({loader: "babel-loader", ...rule});
    context.resolve.extension(...extensions);
  }
}

function extensionsToRegex(extensions: string[]): RuleSetCondition {
  if (extensions && extensions.length) {
    const group = extensions.map(x => x.slice(1)).join("|");
    const pattern = `\.(${group})$`;
    return new RegExp(pattern);
  }
}

function resolveDefaultExtensions(config: PartialConfig): string[] {
  const react = isReact(config);
  const typescript = isTypeScript(config);
  return [
    ".js", ".es6", ".es", ".mjs",
    react && ".jsx",
    typescript && [".ts", ".d.ts"],
    typescript && react && ".tsx",
  ].filter(Boolean).flat();
}

function isReact(config: PartialConfig): boolean {
  return hasFile(config, "@babel/preset-react");
}

function isTypeScript(config: PartialConfig): boolean {
  return hasFile(config, "@babel/preset-typescript");
}

function hasFile(config: PartialConfig, preset: string): boolean {
  const items = config.options.presets;
  return containsFileRequest(items, preset);
}

function containsFileRequest(items: PluginItem[], preset: string) {
  if (items)
    return items.some(item => requestOf(item) === preset);
}

function requestOf(item: PluginItem) {
  if (item) {
    if (typeof item === "string") return item;
    if (Array.isArray(item)) return item[0];
    if ((item as ConfigItem).file) return (item as ConfigItem).file.request;
  }
}
