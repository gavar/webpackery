import { Configuration, Resolve, ResolvePlugin } from "webpack";
import { WebpackContext } from "./webpack-context";
import { createArrayAccess, WebpackContextArrayAccess } from "./webpack-context-array-access";

/** Syntax for manipulating values of {@link Configuration.resolve} */
export class WebpackContextResolveSyntax {

  /** Syntax for manipulating values of {@link Resolve.extensions} */
  readonly extension: WebpackContextArrayAccess<string>;

  /** Syntax for manipulating values of {@link Resolve.plugins} */
  readonly plugin: WebpackContextArrayAccess<ResolvePlugin>;

  constructor(context: WebpackContext) {
    this.extension = createArrayAccess(context, {
      getter: ({config}) => config.resolve.extensions,
      setter: ({config}, value) => config.resolve.extensions = value,
    });
    this.plugin = createArrayAccess(context, {
        getter: ({config}) => config.resolve.plugins,
        setter: ({config}, value) => config.resolve.plugins = value,
      },
    );
  }
}
