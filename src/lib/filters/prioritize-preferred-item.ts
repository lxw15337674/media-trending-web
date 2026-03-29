export function prioritizePreferredItem<T>(
  items: readonly T[],
  getValue: (item: T) => string,
  preferredValue: string | null | undefined,
) {
  const normalizedPreferred = preferredValue?.trim().toLowerCase() ?? '';
  if (!normalizedPreferred) {
    return [...items];
  }

  const targetIndex = items.findIndex((item) => getValue(item).trim().toLowerCase() === normalizedPreferred);
  if (targetIndex <= 0) {
    return [...items];
  }

  return [items[targetIndex], ...items.slice(0, targetIndex), ...items.slice(targetIndex + 1)];
}
