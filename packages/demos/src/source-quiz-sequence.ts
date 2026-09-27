/** Source selection semantics, with a reproducible test seed (not AVM1 RNG parity). */
export function sourceQuizOrder(numbers: readonly number[], count: number, random: boolean, seed: number) {
  if (count < 1 || count > numbers.length || new Set(numbers).size !== numbers.length)
    throw new Error('Invalid source question sequence');
  const pool = [...numbers], order: number[] = [];
  let state = seed >>> 0;
  while (order.length < count) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const index = random ? Math.floor(state / 4294967296 * pool.length) : 0;
    order.push(pool.splice(index, 1)[0]);
  }
  return order;
}
