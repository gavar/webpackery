import { Configuration } from "webpack";
import { WebpackArgv } from "./webpack-argv";
import { WebpackEnv } from "./webpack-env";

/**
 * Function that creates configuration object and is illegible to return as exports of 'webpack.config.ts'.
 * @param env - webpack environment options.
 * @param argv - webpack arguments.
 */
export interface WebpackFactory {
  (env: WebpackEnv, argv: WebpackArgv): Promise<Configuration>;
}
