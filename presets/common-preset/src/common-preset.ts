import { CleanConfigurer } from "@webpackery/clean-configurer";
import { WebpackConfigurer, WebpackContext } from "@webpackery/core";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { Configuration, EnvironmentPlugin } from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

/** {@link BundleAnalyzerPlugin} default options. */
export const BUNDLE_ANALYZER_DEFAULT_OPTIONS: BundleAnalyzerPlugin.Options = {
  openAnalyzer: false,
  analyzerMode: "static",
};

export namespace CommonPreset {
  export interface Props {
    /**
     * {@link CleanWebpackPlugin} configuration options.
     * @default true
     */
    clean?: boolean | CleanConfigurer.Props;

    /**
     * Environment variables to inline by {@link EnvironmentPlugin}.
     * @default {@link process.env}
     */
    envs?: false | string[] | Record<string, any>;

    /**
     * {@link BundleAnalyzerPlugin} options.
     * @default: {@link BUNDLE_ANALYZER_DEFAULT_OPTIONS} when {@link Configuration.profile}
     */
    profile?: boolean | BundleAnalyzerPlugin.Options
  }
}

/**
 * Preset which configures webpack config defaults and installs commonly used extensions and plugins:
 * - {@link EnvironmentPlugin}
 * - {@link CleanWebpackPlugin} via {@link CleanConfigurer}
 * - {@link BundleAnalyzerPlugin}
 */
export class CommonPreset extends WebpackConfigurer<CommonPreset.Props> {

  /** @inheritdoc */
  protected prepare(props: CommonPreset.Props, context: WebpackContext): CommonPreset.Props {
    const {profile} = context.config;

    return {
      envs: process.env,
      clean: true,
      profile: profile && BUNDLE_ANALYZER_DEFAULT_OPTIONS,
      ...props,
    };
  }

  /** @inheritdoc */
  protected configure(context: WebpackContext, props: CommonPreset.Props): void {
    if (props.clean)
      context.extension(CleanConfigurer, normalize(props.clean));
    if (props.envs)
      context.plugin(new EnvironmentPlugin(props.envs));
    if (props.profile)
      context.plugin(new BundleAnalyzerPlugin(normalize(props.profile)));
  }
}

function normalize<T>(value: boolean | T): T | undefined {
  if (value !== true)
    return value as T;
}
