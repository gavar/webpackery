import { ConfigItem, loadPartialConfig, PartialConfig, TransformCaller, TransformOptions } from "@babel/core";
import { setDefaultBy, WebpackConfigurer, WebpackContext } from "@webpackery/core";
import { resolve } from "path";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import { RuleSetCondition, RuleSetRule } from "webpack";
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
      overrides: [],
      ...props.options,
    };

    // clone objects
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
        if (tsconfig.compilerOptions.paths) {
          context.resolve.plugin(new TsconfigPathsPlugin({
            extensions: props.extensions,
            configFile: tsconfigPath,
          }));
        }
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
  return hasFile(config, "@babel/preset-typescript");
}

function isTypeScript(config: PartialConfig): boolean {
  return hasFile(config, "@babel/preset-typescript");
}

function hasFile(config: PartialConfig, preset: string): boolean {
  const items = config.options.presets as ConfigItem[];
  return containsFileRequest(items, preset);
}

function containsFileRequest(items: ConfigItem[], preset: string) {
  if (items)
    return items.some(item => item.file && item.file.request === preset);
}
