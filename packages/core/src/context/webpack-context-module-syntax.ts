import { Configuration, Module, RuleSetRule } from "webpack";
import { WebpackContext } from "./webpack-context";
import { createArrayAccess, WebpackContextArrayAccess } from "./webpack-context-array-access";

/** Syntax for manipulating values of {@link Configuration.module} */
export class WebpackContextModuleSyntax {

  /** Syntax for manipulating values of {@link Module.rules} */
  readonly rule: WebpackContextArrayAccess<RuleSetRule>;

  constructor(context: WebpackContext) {
    this.rule = createArrayAccess(context, {
        getter: ({config}) => config.module.rules,
        setter: ({config}, value) => config.module.rules = value,
      },
    );
  }
}
