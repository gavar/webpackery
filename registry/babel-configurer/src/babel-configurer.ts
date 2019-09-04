import { ConfigItem, loadPartialConfig, PartialConfig, TransformCaller, TransformOptions } from "@babel/core";
import { setDefaultBy, WebpackConfigurer, WebpackContext } from "@webpackery/core";
import { resolve } from "path";
import { RuleSetCondition } from "webpack";

export namespace BabelConfigurer {
  export interface Props {
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
    options?: TransformOptions;
  }
}

export class BabelConfigurer extends WebpackConfigurer<BabelConfigurer.Props> {

  /** @inheritdoc */
  protected prepare(props: BabelConfigurer.Props, context: WebpackContext): BabelConfigurer.Props {
    const {production} = context;
    props = {...props};
    props.options = {
      sourceMaps: production,
      envName: production ? "production" : "development",
      ...props.options,
    };

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
    return props;
  }

  /** @inheritdoc */
  protected configure(context: WebpackContext, props: BabelConfigurer.Props): void {
    context.module.rule({
      test: props.test,
      loader: "babel-loader",
      options: props.options,
    });
    context.resolve.extension(...props.extensions);
  }
}

function extensionsToRegex(extensions: string[]): RuleSetCondition {
  if (extensions && extensions.length) {
    const group = extensions.map(x => x.slice(1)).join("|");
    const pattern = `\\.(${group})$`;
    return new RegExp(pattern);
  }
}

function resolveDefaultExtensions(config: PartialConfig): string[] {
  const presets = config.options.presets as ConfigItem[];
  const react = hasFile(presets, "@babel/preset-react");
  const typescript = hasFile(presets, "@babel/preset-typescript");
  return [
    ".js", ".es6", ".es", ".mjs",
    react && ".jsx",
    typescript && ".ts",
    typescript && react && ".tsx",
  ].filter(Boolean);
}

function hasFile(items: ConfigItem[], preset: string) {
  if (items)
    return items.some(item => item.file && item.file.request === preset);
}
