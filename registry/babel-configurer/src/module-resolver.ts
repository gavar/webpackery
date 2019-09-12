import { PluginItem } from "@babel/core";

/**
 * Create plugin configuration entry that uses `paths` property from `tsconfig.json`.
 * @param root - paths base url.
 * @param paths - path patterns to check.
 * @param extensions - file extensions to use.
 */
export function moduleResolverByPaths(root: string, paths: Record<string, string[]>, extensions: string[]): PluginItem {
  const {resolvePath} = require("babel-plugin-module-resolver");
  const matchers = createMatchers(paths);
  return [
    "babel-plugin-module-resolver",
    {
      root,
      extensions,
      resolvePath(specifier: string, importer: string, options: unknown): string {
        let path: string;
        for (let i = 0; !path && i < matchers.length; i++)
          path = tryMatcher(matchers[i], resolvePath, specifier, importer, options);
        return path || resolvePath(specifier, importer, options);
      },
    },
  ];
}

/**
 * Path matcher where:
 * 1st - is a regex testing import path.
 * 2nd - list of substitutions to try.
 */
type Matcher = [RegExp, string[]];

/** Function resolving import path. */
interface Resolver {
  (specifier: string, importer: string, options: unknown): string | null;
}

/** Try to resolve path by using substitutions of the the matcher. */
function tryMatcher(matcher: Matcher, resolver: Resolver,
                    specifier: string, importer: string, options: unknown): string {
  let path: string;
  const [regex, substitutions] = matcher;
  const [, value] = regex.exec(specifier) || [];
  if (value)
    for (let i = 0; !path && i < substitutions.length; i++) {
      specifier = substitutions[i].replace("*", value);
      path = resolver(specifier, importer, options);
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
    const pattern = key.replace("*", "(.+)");
    const regex = new RegExp(pattern);
    const substitutions = paths[key].map(toSubstitution);
    matchers.push([regex, substitutions]);
  }
  return matchers;
}

function toSubstitution(value: string): string {
  if (value.startsWith(".")) value = value.slice(1);
  if (value.startsWith("/")) value = value.slice(1);
  return value;
}
