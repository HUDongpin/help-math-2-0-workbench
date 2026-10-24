import {P038_GRID_SOURCE as SOURCE} from './generated/nms-l02-p038-grid-source-v1';
/** Preserve source dwell/double-add frames, including267 and273. */
export function p038GridFrame(frame: number) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 467) throw Error('P038_MAIN_FRAME');
  const row = frame < SOURCE.firstFillFrame ? null
    : SOURCE.schedule[Math.min(frame, SOURCE.lastFillFrame) - SOURCE.firstFillFrame];
  return Object.freeze({visible: frame >= SOURCE.firstGridFrame, filled: row?.filledCells ?? 0,
    sourceCharacterId: row?.sourceCharacterId ?? null,
    cells: Object.freeze(Array.from({length: 100}, (_, index) => Object.freeze({
      row: Math.floor(index / 10), column: index % 10,
      filled: (index % 10) * 10 + Math.floor(index / 10) < (row?.filledCells ?? 0),
    }))),
  });
}
