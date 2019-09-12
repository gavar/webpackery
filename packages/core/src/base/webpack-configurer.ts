import { WebpackContext, WebpackProvider } from "../context";
import { WebpackExtension } from "../webpack-extension";
import { getLogger, WebpackLogger } from "../webpack-logger";

export abstract class WebpackConfigurer<T> implements WebpackExtension {

  /** Configurator options. */
  readonly input?: T | WebpackProvider<T>;

  /** Logger of this instance. */
  protected readonly logger: WebpackLogger;

  /**
   * Initialize new instance of the configurer.
   * @param provider - options provider that use webpack context to resolve options.
   */
  constructor(provider: (context: WebpackContext) => T);

  /**
   * Initialize new instance of the configurer.
   * @param input - input options to use while installing,
   */
  constructor(input?: T);

  /** @internal */
  constructor(input?: T | WebpackProvider<T>) {
    this.input = input;
    this.logger = getLogger(this.constructor);
  }

  /** @inheritdoc */
  async install(context: WebpackContext): Promise<void> {
    let options = context.options(this.input) || {} as T;
    if (this.prepare) options = await this.prepare(options, context) || options;
    return this.configure(context, options);
  }

  /**
   * Prepare options to use for installation.
   * May be used to set default values.
   * @param context - webpack configuration context running installation of this configurer.
   * @param props - props resolved from the {@link input}.
   * @return will use returned object as option if any, otherwise input options.
   */
  protected prepare?(props: T, context: WebpackContext): void | T | Promise<void | T>;

  /**
   * Apply configuration to the webpack context.
   * @param context - webpack configuration context running installation of this configurer.
   * @param props - props resolved from the {@link input} after {@link prepare}.
   */
  protected abstract configure(context: WebpackContext, props: T): void | Promise<void> ;
}
