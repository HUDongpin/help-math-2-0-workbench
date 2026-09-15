import type {DragDropToken, DropTarget} from './contract';

export type DragDropState = Readonly<{
  selectedTokenId: string | null;
  placements: Readonly<Record<string, string | null>>;
  feedback: 'idle' | 'correct' | 'incorrect';
}>;

export function emptyPlacements(tokens: readonly DragDropToken[]): Record<string, string | null> {
  return Object.fromEntries(tokens.map((token) => [token.id, null]));
}

export function createDragDropState(tokens: readonly DragDropToken[]): DragDropState {
  return {selectedTokenId: null, placements: emptyPlacements(tokens), feedback: 'idle'};
}

export function tokenOccupyingTarget(
  placements: Readonly<Record<string, string | null>>,
  targetId: string
): string | undefined {
  return Object.entries(placements).find(([, placed]) => placed === targetId)?.[0];
}

export function selectToken(state: DragDropState, tokenId: string): DragDropState {
  if (!(tokenId in state.placements)) return state;
  return {
    ...state,
    selectedTokenId: state.selectedTokenId === tokenId ? null : tokenId,
    feedback: 'idle'
  };
}

export function placeTokenOnTarget(
  state: DragDropState,
  tokens: readonly DragDropToken[],
  tokenId: string,
  targetId: string
): DragDropState {
  if (!(tokenId in state.placements)) return state;
  const occupant = tokenOccupyingTarget(state.placements, targetId);
  const placements = {...state.placements};
  if (occupant && occupant !== tokenId) {
    placements[occupant] = state.placements[tokenId] ?? null;
  }
  placements[tokenId] = targetId;
  const next = {selectedTokenId: null, placements, feedback: 'idle' as const};
  return {...next, feedback: isDragDropSolved(next, tokens) ? 'correct' : 'idle'};
}

export function clearTarget(state: DragDropState, targetId: string): DragDropState {
  const occupant = tokenOccupyingTarget(state.placements, targetId);
  if (!occupant) return state;
  return {
    ...state,
    selectedTokenId: null,
    feedback: 'idle',
    placements: {...state.placements, [occupant]: null}
  };
}

export function isRequiredToken(token: DragDropToken): boolean {
  return token.correctTargetIds.length > 0;
}

export function isDragDropSolved(
  state: Pick<DragDropState, 'placements'>,
  tokens: readonly DragDropToken[]
): boolean {
  const required = tokens.filter(isRequiredToken);
  if (required.length === 0) return false;
  const usedTargets = new Set<string>();
  for (const token of tokens) {
    const targetId = state.placements[token.id];
    if (!isRequiredToken(token)) {
      if (targetId) return false;
      continue;
    }
    if (!targetId || !token.correctTargetIds.includes(targetId) || usedTargets.has(targetId)) {
      return false;
    }
    usedTargets.add(targetId);
  }
  return true;
}

export function targetAcceptsToken(
  tokens: readonly DragDropToken[],
  tokenId: string,
  targetId: string
): boolean {
  return Boolean(tokens.find((token) => token.id === tokenId)?.correctTargetIds.includes(targetId));
}

export function findDropTargetAtPoint(
  targets: readonly DropTarget[],
  x: number,
  y: number
): DropTarget | undefined {
  return targets.find(
    (target) =>
      x >= target.rect.x &&
      x <= target.rect.x + target.rect.width &&
      y >= target.rect.y &&
      y <= target.rect.y + target.rect.height
  );
}
