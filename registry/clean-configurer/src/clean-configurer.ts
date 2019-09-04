import { WebpackConfigurer, WebpackContext } from "@webpackery/core";
import { CleanWebpackPlugin, Options } from "clean-webpack-plugin";

export namespace CleanConfigurer {
  export interface Props extends Options {

  }
}

/** Configures `clean-webpack-plugin`. */
export class CleanConfigurer extends WebpackConfigurer<CleanConfigurer.Props> {

  /** @inheritdoc */
  protected prepare(props: CleanConfigurer.Props, context: WebpackContext): CleanConfigurer.Props {
    return {
      verbose: true,
      ...props,
    };
  }

  /** @inheritdoc */
  protected configure(context: WebpackContext, props: CleanConfigurer.Props): void {
    const plugin = new CleanWebpackPlugin(props);
    context.plugin(plugin);
  }
}
