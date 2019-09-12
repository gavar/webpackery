type With<K extends keyof any, T> = {
  [P in K]?: T;
}

/**
 * Set object property to a default value.
 * @param object - object whose value to set when it's missing.
 * @param key - name of the proper to check.
 * @param value - value to use by default.
 */
export function setDefaultTo<T, K extends keyof T>(object: T, key: K, value: T[K]) {
  if (object[key] === void 0)
    set(object, key, value);
}

/**
 * Set object property to a default value.
 * @param object - object whose value to set when it's missing.
 * @param key - name of the proper to check.
 * @param calculate - function to invoke for calculating default value.
 * @param args - arguments to pass into a function.
 */
export function setDefaultBy<T, K extends keyof T, P extends any[]>(object: T, key: K,
                                                                    calculate: (...args: P) => T[K],
                                                                    ...args: P): void {
  if (object[key] == null)
    set(object, key, calculate(...args));
}

/**
 * Set object property to a default value of the first source object containing property by the key.
 * @param object - object whose value to set when it's missing.
 * @param key - name of the proper to check.
 * @param sources - array of source to use as default value providers.
 */
export function setDefaultFrom<T, K extends keyof T>(object: T, key: K, ...sources: With<K, T[K]>[]): void {
  if (object[key] == null)
    for (const source of sources)
      if (source && set(object, key, source[key]))
        return;
}

function set<T, K extends keyof T>(object: T, key: K, value: T[K]): boolean {
  if (value != null) {
    object[key] = value;
    return true;
  }
}
