import { Configuration } from "webpack";
import { WebpackContext } from "./context";
import { WebpackArgv } from "./webpack-argv";
import { WebpackEnv } from "./webpack-env";
import { WebpackFactory } from "./webpack-factory";

/**
 * Configuration hook provided by {@link WebpackContext#boot} to easily setup webpack.
 */
export interface WebpackBoot {
  (context: WebpackContext): void | Promise<void>;
}

/**
 * Create function for execution by webpack.
 * @param setup - function providing possibility to install extensions into a configurer.
 * @returns function to return as webpack configuration entry point.
 */
export function boot(setup: WebpackBoot): WebpackFactory {
  return async function (env: WebpackEnv, argv: WebpackArgv): Promise<Configuration> {
    const context = new WebpackContext(setup);
    const config = await context.configure({env, argv});
    return config;
  };
}

export namespace boot {

  export interface StorybookProps {
    config: Configuration;
    mode: Configuration["mode"];
  }

  /**
   * Create function for execution by storybook.
   * @param setup - function providing possibility to install extensions into a configurer.
   * @returns function to return as storybook configuration entry point.
   */
  export function storybook(setup: WebpackBoot) {
    return async function ({config, mode}: StorybookProps): Promise<Configuration> {
      const context = new WebpackContext(setup);
      config = await context.configure({config, argv: {mode}});
      return config;
    };
  }
}
