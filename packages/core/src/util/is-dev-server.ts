/**
 * Detect if `webpack` is running through a `webpack-dev-server`.
 * @param argv - process arguments.
 */
export function isDevServer(argv: string[] = process.argv): boolean {
  return argv.some(x => x.includes("webpack-dev-server"));
}
