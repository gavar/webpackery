import { defaults, isNil, omitBy, pick } from "lodash";
import { Configuration } from "webpack";

/**
 * Webpack options which describes the options passed to webpack.
 * @see https://webpack.js.org/api/cli/#config-options
 * @see https://webpack.js.org/configuration/configuration-types/#exporting-a-function
 */
export interface WebpackArgv {
  mode?: Configuration["mode"],
  context?: string,
  watch?: boolean,
  debug?: boolean,
  devtool?: string,
  profile?: string,
  [key: string]: unknown;
}

const primitiveKeys: Array<keyof WebpackArgv> = [
  "mode",
  "context",
  "watch",
  "debug",
  "devtool",
  "profile",
];

export function argvToConfig(argv: WebpackArgv, config?: Configuration): Configuration {
  argv = omitBy(argv, isNil);
  const primitives = pick(argv, primitiveKeys);
  config = defaults(config || {}, primitives);
  return config;
}
