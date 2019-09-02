import { TypeDef } from "@emulsy/lang";
import { blue, cyan } from "ansi-colors";
import { Newable } from "tstt";
import { Configuration, Entry, Output, Plugin, ResolvePlugin, RuleSetRule } from "webpack";
import { isDevServer } from "./util";
import { WebpackArgv } from "./webpack-argv";
import { WebpackBoot } from "./webpack-boot";
import { WebpackEnv } from "./webpack-env";
import { WebpackExtension } from "./webpack-extension";
import { getLogger, WebpackLogger } from "./webpack-logger";

/**
 * Represents function that provides some value by evaluating webpack context.
 */
export interface WebpackProvider<T> {
  (context: WebpackContext): T;
}

export namespace WebpackContext {
  export interface Props {
    /** Webpack environment options. */
    env?: WebpackEnv;
    /** Webpack CLI arguments. */
    argv?: WebpackArgv;
    /** Webpack optimization mode. */
    mode?: Configuration["mode"];
    /** Webpack base configuration. */
    config?: Configuration;
  }
}

/**
 * Webpack configuration utility provide easy way to modularize webpack configuration process.
 */
export class WebpackContext {
  protected readonly boot: WebpackBoot;
  protected readonly logger: WebpackLogger = getLogger(this.constructor);
  protected readonly configurers: WebpackConfigurer[] = [];

  public env: WebpackEnv;
  public argv: WebpackArgv;
  public config: Configuration;
  public isDevServer: boolean;
  public plugins: PluginEntry[] = [];

  public readonly module: ModuleSyntax = new ModuleSyntax(this);
  public readonly resolve: ResolveSyntax = new ResolveSyntax(this);

  constructor(boot?: WebpackBoot) {
    this.boot = boot;
  }

  /** Whether configured to run in production mode. */
  get production() {
    return this.config.mode === "production";
  }

  /**
   * Sets value of {@link webpack#Configuration#entry}.
   * @param value - entry to use.
   */
  entry(value: string | Entry) {
    this.config.entry = value;
  }

  /**
   * Applies given value to existing {@link webpack#Configuration#output}.
   * @param value - output values to apply.
   */
  output(value: Partial<Output>) {
    if (value)
      this.config.output = Object.assign(this.config.output || {}, value);
  }

  /**
   * Adds a plugin to {@link webpack#Configuration#plugins}.
   * @param plugin - plugin to add.
   * @param order - order of the plugin within plugins list (less value -> closer to beginning).
   */
  plugin<T extends Plugin>(plugin: T, order: number = 0): T {
    if (plugin) {
      const index = this.plugins.length;
      const name = plugin.constructor.name;
      this.plugins.push({name, order, index, plugin});
    }
    return plugin;
  }

  /**
   * Resolve the option from the given object or provider.
   * @param value - object or provider to resolve to an actual options value.
   */
  options<T>(value: T | WebpackProvider<T>): T {
    return typeof value === "function"
      ? (value as WebpackProvider<T>)(this)
      : value
      ;
  }

  /**
   * Configure to use provided extension while configuring resulting configuration object.
   * @param extension - extension instance to install while configuration.
   */
  extension(extension: WebpackExtension): void;

  /**
   * Configure to use provided extension while configuring resulting configuration object.
   * @param type - type of the extension that will be lazily instantiate and install while configuration.
   * @param args - arguments to pass when instantiating extension.
   */
  extension<T extends new (...args: any) => WebpackExtension>(type: T, ...args: ConstructorParameters<T>): void;

  /** @private */
  extension(extension: WebpackExtension | Newable<WebpackExtension>, ...args: any[]): void {
    const configurer = new WebpackConfigurer(extension, args);
    this.configurers.push(configurer);
  }

  /**
   * Apply the given extension by calling {@link WebpackExtension#install} with this context.
   * @param extension - extension to apply.
   */
  install(extension: WebpackExtension): Promise<void>;

  /**
   * Apply an extension of the given type by calling {@link WebpackExtension#install} with this context.
   * @param type - type of the extension to install.
   * @param args - arguments to pass when instantiating extension.
   */
  install<T extends new (...args: any) => WebpackExtension>(type: T, ...args: ConstructorParameters<T>): Promise<void>;

  /** @private */
  async install(extension: WebpackExtension | Newable<WebpackExtension>, ...args: any[]): Promise<void> {
    const entry = new WebpackConfigurer(extension, args);
    await entry.resolve().install(this);
  }

  /**
   * Create configuration object by installing all extension.

   */
  async configure(props: WebpackContext.Props): Promise<Configuration> {
    try {
      this.logger.info("configuring webpack");
      this.initialize(props);
      if (this.boot) await this.boot(this);

      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < this.configurers.length; i++) {
        const entry = this.configurers[i];
        this.logger.info("installing webpack extension: '%s'", entry.name);
        const extension = entry.resolve();
        await extension.install(this);
      }

      this.plugins.sort(entryCompare);
      this.config.plugins.push(...this.plugins.map(x => x.plugin));
      this.logger.info(blue("########   Webpack Plugins   ########"));
      for (const entry of this.plugins)
        this.logger.info(cyan(entry.name));

      return this.config;
    } finally {
      this.finalize();
    }
  }

  private initialize(props: WebpackContext.Props): void {
    this.env = Object.assign({}, props.env);
    this.argv = Object.assign({}, props.argv);
    this.config = defaultConfig(props.config, props.mode || this.argv.mode);
    this.isDevServer = isDevServer();
  }

  private finalize(): void {
    this.env = null;
    this.argv = null;
    this.config = null;
    this.isDevServer = null;
  }
}

interface PluginEntry {
  name: string;
  index: number;
  order: number;
  plugin: Plugin;
}

class ModuleSyntax {
  public readonly context: WebpackContext;

  constructor(context: WebpackContext) {
    this.context = context;
  }

  rule(rule: RuleSetRule): void {
    this.context.config.module.rules.push(rule);
  }
}

class ResolveSyntax {
  public readonly context: WebpackContext;

  constructor(context: WebpackContext) {
    this.context = context;
  }

  extension(...extensions: string[]): void {
    const array = this.context.config.resolve.extensions;
    array.push.apply(array, extensions);
  }

  plugin(plugin: ResolvePlugin): void {
    const array = this.context.config.resolve.plugins;
    array.push(plugin);
  }
}

class WebpackConfigurer<T = any> {

  /** Name of the {@link type}. */
  name: string;
  type: TypeDef<WebpackExtension>;
  args: any[];
  extension: WebpackExtension;

  constructor(value: WebpackExtension | Newable<WebpackExtension>, args: any[]) {
    if (typeof value === "function") {
      this.type = value;
      this.args = args;
    } else {
      this.type = TypeDef.of(value);
      this.extension = value;
    }
    this.name = TypeDef.name(this.type);
  }

  resolve(): WebpackExtension {
    if (this.extension)
      return this.extension;

    this.extension = Reflect.construct(this.type as Function, this.args);
    return this.extension;
  }
}

function defaultConfig(config: Configuration, mode: Configuration["mode"]): Configuration {
  const {NODE_ENV} = process.env;
  const production = NODE_ENV === "production" || mode === "production";
  return {
    mode: production ? "production" : "development",
    plugins: [],
    module: {
      rules: [],
    },
    resolve: {
      extensions: [],
      plugins: [],
    },
    optimization: {},
    ...config,
  };
}

function entryCompare(a: PluginEntry, b: PluginEntry) {
  return a.order - b.order // explicit order
    || a.index - b.index // natural order
    ;
}
