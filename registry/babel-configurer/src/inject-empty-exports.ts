import { NodePath, PluginObj } from "@babel/core";
import { TemplateBuilder } from "@babel/template";
import { ExportDeclaration, ExportNamedDeclaration, Program, Statement } from "@babel/types";

interface Babel {
  template: TemplateBuilder<Statement>;
}

interface State {
  filename: string;
}

/**
 * Adds stub `export { }` when module does not have any actual exports.
 */
export function InjectEmptyExports(babel: Babel): PluginObj<State> {
  const stub = babel.template("export { }")();
  return {
    visitor: {
      Program(root: NodePath<Program>, state: State) {
        const filename = state.filename.split("\\").join("/");
        if (filename.endsWith(".d.ts")) return;
        if (filename.includes("/node_modules/")) return;

        // check if any node is actual export declaration
        let empty = true;
        root.traverse({
          ExportDeclaration(path: NodePath<ExportDeclaration>) {
            if (empty)
              empty = isTypeDeclaration(path.node);
          },
        });

        // add empty exports definition
        if (empty)
          root.node.body.push(stub);
      },
    },
  };
}

function isTypeDeclaration(node: ExportDeclaration) {
  if (node.type === "ExportNamedDeclaration")
    switch (node.declaration.type) {
      case "TSTypeAliasDeclaration":
      case "TSInterfaceDeclaration":
        return true;
    }
}
