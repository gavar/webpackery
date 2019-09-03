import { RuleSetLoader } from "webpack";

export interface CssLoaderOptions {
  /**
   * `url` / `image-set` functions handling.
   * @see https://github.com/webpack-contrib/css-loader#url
   * @default true
   */
  url?: boolean | Function;

  /**
   * `@import` at-rules handling
   * @see https://github.com/webpack-contrib/css-loader#import
   * @default true
   */
  import?: boolean | Function;

  /**
   * CSS Modules and their configuration.
   * @see https://github.com/webpack-contrib/css-loader#modules
   * @default false
   */
  modules?: boolean | string | object;

  /**
   * Generation of source maps.
   * @see https://github.com/webpack-contrib/css-loader#sourcemap
   * @default false
   */
  sourceMap?: boolean;

  /**
   * Number of loaders applied before CSS loader.
   * @see https://github.com/webpack-contrib/css-loader#importloaders
   * @default 0
   */
  importLoaders?: number;

  /**
   * Style of exported class names.
   * @see https://github.com/webpack-contrib/css-loader#localsconvention
   * @default "asIs"
   */
  localsConvention?: "asIs" | "camelCase" | "camelCaseOnly" | "dashes" | "dashesOnly";

  /**
   * Export only locals.
   * @see https://github.com/webpack-contrib/css-loader#onlylocals
   * @default false.
   */
  onlyLocals?: boolean;
}

export function cssLoader(options?: CssLoaderOptions): RuleSetLoader {
  return {
    loader: "css-loader",
    options,
  };
}
