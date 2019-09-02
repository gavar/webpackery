import { Options } from "ts-loader";
import { WebpackConfigurer, WebpackContext } from "@webpackery/core";
import { RuleSetLoader, RuleSetRule } from "webpack";

export namespace TsConfigurer {
  export interface Props extends Options {
    hmr?: boolean;
    extensions?: string[];
  }
}

export class TsConfigurer extends WebpackConfigurer<TsConfigurer.Props> {

  /** @inheritdoc */
  protected prepare(props: TsConfigurer.Props, context: WebpackContext): TsConfigurer.Props {
    const {isDevServer, production} = context;
    return {
      logLevel: "INFO",
      transpileOnly: true,
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      hmr: !production && isDevServer,
      ...props,
    };
  }

  /** @inheritdoc */
  protected configure(context: WebpackContext, props: TsConfigurer.Props): void {
    context.module.rule(createLoader(props));
    context.resolve.extension(...props.extensions);
    return undefined;
  }
}

function createLoader(props: TsConfigurer.Props): RuleSetRule {
  const {hmr, extensions, ...options} = props;

  // ts-loader
  const tsLoader: RuleSetLoader = {
    loader: "ts-loader",
    options,
  };

  return {
    use: [tsLoader],
    test: /\.(jsx?|tsx?)$/,
    exclude: /node_modules/,
  };
}
