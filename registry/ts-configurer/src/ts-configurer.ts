import { WebpackConfigurer, WebpackContext } from "@webpackery/core";
import { Options } from "ts-loader";
import { RuleSetLoader, RuleSetRule } from "webpack";

export namespace TsConfigurer {
  export interface Props extends Partial<Options> {
    hmr?: boolean;
    extensions?: string[];
  }
}

export class TsConfigurer extends WebpackConfigurer<TsConfigurer.Props> {

  /** @inheritdoc */
  protected prepare(props: TsConfigurer.Props, context: WebpackContext): TsConfigurer.Props {
    const {isDevServer, production} = context;
    props = {
      logLevel: "INFO",
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      hmr: !production && isDevServer,
      transpileOnly: true,
      compilerOptions: {
        ...props.compilerOptions,
      },
      ...props,
    };

    // transpileOnly + declarationMap produce an error
    // https://github.com/TypeStrong/ts-loader/issues/957
    if (props.transpileOnly)
      props.compilerOptions.declarationMap = false;

    return props;
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
