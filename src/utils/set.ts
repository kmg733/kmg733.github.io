/**
 * 불변 Set 토글: 항목이 있으면 제거, 없으면 추가
 */
export function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) {
    next.delete(item);
  } else {
    next.add(item);
  }
  return next;
}
