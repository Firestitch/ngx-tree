export function lower(
  array: any[],
  key: any,
  get: Function,
  isSame = true,
) {
  let lo = 0;
  let hi = array.length;
  let mid;

  while (lo < hi) {
    mid = (lo + hi) >> 1;
    if (
      (isSame && key <= get(array[mid]))
      || (!isSame && key < get(array[mid]))
    ) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return lo;
}


export function lookupNearPoint(
  array: any[],
  target: number,
  getFn: Function,
) {
  let lo = 0;
  let hi = array.length;
  let mid;

  while (lo < hi) {
    mid = (lo + hi) >> 1;

    const leftEl = array[mid - 1];
    const midEl = array[mid];
    const rightEl = array[mid + 1];

    let dL = Infinity;
    let dR = Infinity;
    let dM = Infinity;

    if (leftEl) {
      dL = Math.abs(target - getFn(leftEl));
    }

    dM = Math.abs(target - getFn(midEl));

    if (rightEl) {
      dR = Math.abs(target - getFn(rightEl));
    }

    if (dL <= dM && dM <= dR) {
      hi = mid - 1;
    } else if (dR <= dM && dM <= dL) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return lo;
}
