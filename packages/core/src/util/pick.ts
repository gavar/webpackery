/**
 * From object pick properties with particular names.
 * @param object - object to pick properties from.
 * @param keys - name of properties to pick.
 * @param filter - predicate to match in order to pick property value; pick only truthy values by default.
 */
export function pick<T, K extends keyof T>(object: T, keys: K[], filter: (value: T[K]) => boolean = Boolean): Pick<T, K> {
  const output = {} as Pick<T, K>;
  for (const key of keys)
    if (filter(object[key]))
      output[key] = object[key];
  return output;
}
