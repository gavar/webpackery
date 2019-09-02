import { WebpackConfigurer, WebpackContext } from "@webpackery/core";
import HtmlWebpackPlugin from "html-webpack-plugin";

export namespace HtmlConfigurer {
  export interface Props extends HtmlWebpackPlugin.Options {

  }
}

export class HtmlConfigurer extends WebpackConfigurer<HtmlConfigurer.Props> {

  /** @inheritdoc */
  protected prepare(props: HtmlConfigurer.Props, context: WebpackContext): HtmlConfigurer.Props {
    return {
      inject: true,
      minify: context.production && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      ...props,
    };
  }

  /** @inheritdoc */
  protected configure(context: WebpackContext, props: HtmlConfigurer.Props): void {
    context.plugin(new HtmlWebpackPlugin(props));
  }
}
