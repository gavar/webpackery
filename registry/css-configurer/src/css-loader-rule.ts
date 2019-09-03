import { WebpackContext } from "@webpackery/core";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { RuleSetCondition, RuleSetLoader, RuleSetRule } from "webpack";
import { cssLoader, CssLoaderOptions } from "./css-loader";

export interface CssLoaderRuleProps extends RuleSetRule {
  /**
   * @inheritDoc
   * @default /\.css$/
   */
  test?: RuleSetCondition;

  /**
   * Loaders to apply before `css-loader`.
   * Note that loaders applied in reverse order, from bottom to top.
   */
  before?: string | RuleSetLoader | Array<string | RuleSetLoader>;

  /**
   * Loaders to apply before `css-loader`.
   * Note that loaders applied in reverse order, from bottom to top.
   * @default "style-loader" | "mini-css-extract-plugin".loader
   */
  after?: string | RuleSetLoader | Array<string | RuleSetLoader>;

  /** `css-loader` options. */
  options?: Partial<Omit<CssLoaderOptions, "importLoaders">>

  /** @inheritdoc */
  use: never;
}

export function cssLoaderRule(context: WebpackContext, props?: CssLoaderRuleProps): RuleSetRule {
  const {production} = context;
  props = {
    options: {},
    after: production ? "style-loader" : MiniCssExtractPlugin.loader,
    ...props,
  };

  const {before, after, options, ...rule} = props;
  const importLoaders = Array.isArray(before) ? before.length : before ? 1 : 0;
  const loader = cssLoader({
    sourceMap: production,
    ...options,
    importLoaders,
  });

  return {
    test: /\.css$/,
    // https://github.com/webpack/webpack/issues/6571
    sideEffects: !options.modules,
    ...rule,
    use: [after, loader, before].filter(Boolean).flat(),
  };
}
