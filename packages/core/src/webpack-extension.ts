import { WebpackProvider } from ".";
import { WebpackContext } from "./context";

/**
 * Represents logical unit that configures webpack feature.
 * May be used to setup Babel, TypeScript, DevServer, etc.
 */
export interface WebpackExtension {
  /**
   * Configure provided configuration object.
   * @param context - webpack configuration context.
   */
  install(context: WebpackContext): void | Promise<void>;
}

export type WebpackExtensionOptions<T> =
  WebpackProvider<Partial<T>>
  | Partial<T>;
