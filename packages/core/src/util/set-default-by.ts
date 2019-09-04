type With<K extends keyof any, T> = {
  [P in K]?: T;
}

export function setDefaultBy<T, K extends keyof any, P extends any[]>(object: With<K, T>, key: K,
                                                                      calculate: (...args: P) => T, ...args: P) {
  if (!object.hasOwnProperty(key)) {
    const value = calculate(...args);
    if (value !== void 0)
      object[key] = value;
  }
}
