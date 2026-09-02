/**
 * Pure, type-safe immutable cache helper functions for array state management.
 */

export function keyMatch<T>(item: T, key: keyof T | ((x: T) => any), value: any): boolean {
  if (typeof key === 'function') {
    return key(item) === value;
  }
  return item[key] === value;
}

/**
 * Append or replace item at the start of array immutably.
 */
export function appendItem<T>(
  list: T[],
  item: T,
  keyExtractor: keyof T | ((x: T) => any)
): T[] {
  const targetKey = typeof keyExtractor === 'function' ? keyExtractor(item) : item[keyExtractor];
  const filtered = list.filter((i) => !keyMatch(i, keyExtractor, targetKey));
  return [item, ...filtered];
}

/**
 * Update a specific item in array immutably.
 */
export function updateItem<T>(
  list: T[],
  keyValue: any,
  updates: Partial<T> | ((existing: T) => T),
  keyExtractor: keyof T | ((x: T) => any)
): T[] {
  return list.map((item) => {
    if (keyMatch(item, keyExtractor, keyValue)) {
      if (typeof updates === 'function') {
        return updates(item);
      }
      return { ...item, ...updates };
    }
    return item;
  });
}

/**
 * Upsert (update if exists, else prepend) item immutably.
 */
export function upsertItem<T>(
  list: T[],
  item: T,
  keyExtractor: keyof T | ((x: T) => any)
): T[] {
  const targetKey = typeof keyExtractor === 'function' ? keyExtractor(item) : item[keyExtractor];
  const exists = list.some((i) => keyMatch(i, keyExtractor, targetKey));
  if (exists) {
    return updateItem(list, targetKey, () => item, keyExtractor);
  }
  return [item, ...list];
}

/**
 * Remove an item from array by key immutably.
 */
export function removeItem<T>(
  list: T[],
  keyValue: any,
  keyExtractor: keyof T | ((x: T) => any)
): T[] {
  return list.filter((item) => !keyMatch(item, keyExtractor, keyValue));
}
