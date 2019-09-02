import { Configuration } from "webpack";

/**
 * Webpack options which describes the options passed to webpack.
 * @see https://webpack.js.org/api/cli/#config-options
 * @see https://webpack.js.org/configuration/configuration-types/#exporting-a-function
 */
export interface WebpackArgv {
  mode: Configuration["mode"],
  watch: Configuration["watch"],
  debug: Configuration["debug"],
  devtool: Configuration["devtool"],
  profile: Configuration["profile"],
}
