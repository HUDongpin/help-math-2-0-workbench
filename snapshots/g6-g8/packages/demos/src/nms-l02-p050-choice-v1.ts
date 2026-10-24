import {P050_ITEMS, type P050State, type P050Event} from './nms-l02-p050-practice-v1';
/** Both pointer and keyboard adapters use this guard; target identity stays in the reducer. */
export function p050CanSelect(state: P050State, item: number): boolean {
 return state.phase === 'ready' && !state.helpOpen && !state.solved.includes(item) && P050_ITEMS.some(value => value.id === item);
}
export function p050ChoiceDrop(state: P050State, item: number | null, target: number | null): P050Event | null {
 if (item === null || !p050CanSelect(state, item)) return null;
 return {type:'drop', item, target: P050_ITEMS.some(value => value.id === target) ? target : null};
}
