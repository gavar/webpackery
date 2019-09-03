import { WebpackConfigurer, WebpackContext } from "@webpackery/core";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { cssLoaderRule, CssLoaderRuleProps } from "./css-loader-rule";

export namespace CssConfigurer {
  export interface Props {
    output?: MiniCssExtractPlugin.PluginOptions;
    loader?: CssLoaderRuleProps;
  }
}

export class CssConfigurer<P extends CssConfigurer.Props = CssConfigurer.Props> extends WebpackConfigurer<P> {
  /** @inheritdoc */
  protected configure(context: WebpackContext, props: P): void {
    context.module.rule(cssLoaderRule(context, props.loader));
    context.plugin(new MiniCssExtractPlugin(props.output));
  }
}
