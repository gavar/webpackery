import { PartialConfig, TransformOptions } from "@babel/core";

/** Properties of this custom babel-loader. */
export interface LoaderProps extends TransformOptions {
  custom: TransformOptions;
}

/**
 * Custom properties provided for the loader.
 * Those values will be merged with root configuration.
 */
export interface LoaderCustomOptions extends TransformOptions {

}

export default require("babel-loader").custom(function () {
  return {
    customOptions,
    config,
  };
});

function customOptions({custom, ...loader}: LoaderProps) {
  return {custom, loader};
}

interface CustomConfigProps {
  customOptions: LoaderCustomOptions;
}

function config({options}: PartialConfig, {customOptions}: CustomConfigProps): TransformOptions {
  customOptions = {
    plugins: [],
    ...customOptions,
  };

  // merge
  return {
    ...customOptions,
    ...options,
    plugins: [
      ...customOptions.plugins,
      ...options.plugins,
    ],
  };
}


