import { kebabCase } from "lodash";

const webpackLog = require("webpack-log");

export interface WebpackLogger {
  debug(...args: any[]): void;
  error(...args: any[]): void;
  info(...args: any[]): void;
  trace(...args: any[]): void;
  warn(...args: any[]): void;
}

export interface WebpackLoggerOptions {
  name: string;
  level?: string;
  timestamp?: boolean;
  unique?: boolean;
}

export function getLogger(type: Function): WebpackLogger;
export function getLogger(options: WebpackLoggerOptions): WebpackLogger;

export function getLogger(options: WebpackLoggerOptions | Function): WebpackLogger {
  if (typeof options === "function")
    options = {name: kebabCase(options.name)};

  return webpackLog(options);
}
