import {
  CompilerOptions,
  Diagnostic,
  DiagnosticCategory,
  FormatDiagnosticsHost,
  ParsedCommandLine,
  PrinterOptions,
  System,
} from "typescript";

/**
 * TypeScript library type definitions, including some internal methods.
 * Defines return types for some methods as some editors (intelliJ IDEA) struggles to resolve it itself.
 */
export type TypeScript = typeof import("typescript") & {
  sys: System;
  getNewLineCharacter(options: CompilerOptions | PrinterOptions, getNewLine?: () => string): string;
}

export interface TypeScriptHost extends FormatDiagnosticsHost {
  ts: TypeScript;
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

export function readTsConfigFile(host: TypeScriptHost, configPath: string): TsConfigJson {
  const {ts} = host;
  const {error, config} = ts.readConfigFile(configPath, ts.sys.readFile);
  reportDiagnostic(host, [error]);
  return config;
}

export function parseJsonConfigFileContent(host: TypeScriptHost, json: TsConfigJson): ParsedCommandLine {
  const {ts} = host;
  const basePath = ts.sys.getCurrentDirectory();
  const pcl = ts.parseJsonConfigFileContent(json, ts.sys, basePath);
  reportDiagnostic(host, pcl.errors);
  return pcl;
}

export function createTypeScriptHost(ts: TypeScript, options: CompilerOptions = {}): TypeScriptHost {
  const newLine = ts.getNewLineCharacter(options);
  return {
    ts,
    getCanonicalFileName(fileName: string): string {
      return fileName.split("\\").join("/");
    },
    getCurrentDirectory(): string {
      return ts.sys.getCurrentDirectory();
    },
    getNewLine(): string {
      return newLine;
    },
  };
}

export function reportDiagnostic(host: TypeScriptHost, diagnostics: Diagnostic[]): void {
  if (diagnostics) diagnostics = diagnostics.filter(Boolean);
  if (diagnostics && diagnostics.length) {
    const category = Math.min(...diagnostics.map(x => x.category));
    const message = host.ts.formatDiagnosticsWithColorAndContext(diagnostics, host);
    reportToConsole(message, category);
  }
}

function reportToConsole(message: string, category: DiagnosticCategory) {
  if (category === 0) console.warn(message);
  else if (category === 1) console.error(message);
  else console.log(message);
  if (category === 1) throw message;
}
