import { Configuration } from "webpack";
import { WebpackArgv } from "./webpack-argv";
import { WebpackContext } from "./webpack-context";
import { WebpackEnv } from "./webpack-env";
import { WebpackFactory } from "./webpack-factory";

/**
 * Configuration hook provided by {@link WebpackContext#boot} to easily setup webpack.
 */
export interface WebpackBoot {
  (context: WebpackContext): void | Promise<void>;
}

/**
 * Create function that should be execute by webpack.
 * @param setup - function providing possibility to install extensions into a configurer.
 * @returns function to return as webpack configuration result.
 */
export function boot(setup: WebpackBoot): WebpackFactory {
  return async function (env: WebpackEnv, argv: WebpackArgv): Promise<Configuration> {
    const context = new WebpackContext(setup);
    return context.configure(env, argv);
  };
}
