import { PluginItem } from "@babel/core";
import { escapeRegExp } from "lodash";
import resolve, { SyncOpts } from "resolve";

interface ModuleResolverOptions {
  root: string;
  extensions: string[];
  resolvePath(specifier: string, importer: string, options: ModuleResolverOptions): string;
}

/**
 * Create plugin configuration entry that uses `paths` property from `tsconfig.json`.
 * @param root - paths base url.
 * @param paths - path patterns to check.
 * @param extensions - file extensions to use.
 */
export function moduleResolverByPaths(root: string, paths: Record<string, string[]>, extensions: string[]): PluginItem {
  const {resolvePath} = require("babel-plugin-module-resolver");
  const matchers = createMatchers(paths);
  const options: ModuleResolverOptions = {
    root,
    extensions,
    resolvePath(specifier: string, importer: string, options: ModuleResolverOptions): string {
      let path: string;
      for (let i = 0; !path && i < matchers.length; i++)
        path = tryMatcher(matchers[i], resolvePath, specifier, importer, options);
      return path || resolvePath(specifier, importer, options);
    },
  };
  return ["babel-plugin-module-resolver", options, "ts-config-paths-module-resolver"];
}

/**
 * Path matcher where:
 * 1st - is a regex testing import path.
 * 2nd - list of substitutions to try.
 */
type Matcher = [RegExp, string[]];

/** Function resolving import path. */
interface Resolver {
  (specifier: string, importer: string, options: ModuleResolverOptions): string | null;
}

/** Try to resolve path by using substitutions of the the matcher. */
function tryMatcher(matcher: Matcher, resolver: Resolver,
                    specifier: string, importer: string, options: ModuleResolverOptions): string {
  let path: string;
  const [regex, substitutions] = matcher;
  const [, value] = regex.exec(specifier) || [];
  if (value) {
    const context: SyncOpts = {
      basedir: options.root,
      extensions: options.extensions,
    };
    for (let i = 0; !path && i < substitutions.length; i++) {
      const name = substitutions[i].replace("*", value);
      path = tryResolve(name, context);
    }
  }
  return path;
}

/**
 * Create matchers for the mask defined by the paths keys.
 * @param paths - map of path substitutions.
 */
function createMatchers(paths: Record<string, string[]>): Array<[RegExp, string[]]> {
  const matchers: Array<[RegExp, string[]]> = [];
  for (const key of Object.keys(paths)) {
    const pattern = escapeRegExp(key).replace("\\*", "(.+)");
    const regex = new RegExp(pattern);
    const substitutions = paths[key];
    matchers.push([regex, substitutions]);
  }
  return matchers;
}

function tryResolve(name: string, options: SyncOpts): string {
  try {
    return resolve.sync(name, options);
  } catch (e) {

  }
}
