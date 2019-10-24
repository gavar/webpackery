import { WebpackContext } from "./webpack-context";

export interface WebpackContextArrayAccess<T> {
  (...values: T[]): void;
  get(): T[];
  set(value: T[]): void;
  push(...items: T[]): void;
  unshift(...items: T[]): void;
}

export interface CreateArrayAccess<T> {
  getter(context: WebpackContext): T[],
  setter(context: WebpackContext, value: T[]): void,
}

export function createArrayAccess<T>(
  context: WebpackContext,
  props: CreateArrayAccess<T>,
): WebpackContextArrayAccess<T> {
  const {getter, setter} = props;
  function get() { return getter(context); }
  function set(values: T[]) { setter(context, values); }
  function push(...items: T[]) { getter(context).push(...items); }
  function unshift(...items: T[]) { getter(context).unshift(...items); }
  return Object.assign(push, {get, set, push, unshift});
}
