
export function getChildrenName(
  childrenName: string | ((level) => string),
  level: number,
): string {
  return childrenName instanceof Function ? childrenName(level) : childrenName;
}
