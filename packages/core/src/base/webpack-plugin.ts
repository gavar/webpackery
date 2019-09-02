import { Tap } from "tapable";
import { Compiler, Plugin } from "webpack";

/** Base class for webpack plugins. */
export abstract class WebpackPlugin implements Plugin {

  /** Plugin tap info. */
  readonly tap: Tap = {
    name: this.constructor.name,
  } as Tap;

  /** @inheritDoc */
  abstract apply(compiler: Compiler): void;
}
