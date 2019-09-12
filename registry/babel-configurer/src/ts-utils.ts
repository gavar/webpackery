import { CompilerOptions, System } from "typescript";

/**
 * TypeScript library type definitions, including some internal methods.
 * Defines return types for some methods as some editors (intelliJ IDEA) struggles to resolve it itself.
 */
export type TypeScript = typeof import("typescript") & {
  sys: System;
}

export interface TsConfigJson {
  extends?: string;
  files?: string[];
  include?: string[];
  exclude?: string[];
  compilerOptions?: CompilerOptions;
}

export function findTsConfigFile(ts: TypeScript, currentDirectory: string, configName?: string): string {
  return ts.findConfigFile(currentDirectory, ts.sys.fileExists, configName);
}

export function readTsConfigFile(ts: TypeScript, configPath: string): TsConfigJson {
  const {error, config} = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) throw error;
  return config;
}
