import type {HfrPageMeta, PageData} from './types';

/** Metadata is source input, never inferred from whichever clip happens to play. */
export function assertHfrMetaMatchesData(meta: HfrPageMeta, data: PageData): void {
  const count = meta.progressTimeline === 0 ? data.root.frameCount :
    data.dictionary[meta.progressTimeline]?.kind === 'sprite' ? data.dictionary[meta.progressTimeline].frameCount : undefined;
  if (meta.key !== data.placement.animationId || meta.sourceSha256 !== data.source.sha256 || meta.compiler !== data.compiler ||
      meta.sourceRootFrameCount !== data.root.frameCount || count === undefined || meta.progressFrameCount > count ||
      meta.stage.width !== data.stage.width || meta.stage.height !== data.stage.height || meta.stage.fps !== data.stage.fps ||
      !Number.isSafeInteger(meta.sourceRootFrameCount) || meta.sourceRootFrameCount < 1 ||
      !Number.isSafeInteger(meta.progressFrameCount) || meta.progressFrameCount < 1 ||
      !Number.isSafeInteger(meta.progressTimeline) || meta.progressTimeline < 0) {
    throw new Error('HFR_SOURCE_RUNTIME_METADATA_MISMATCH');
  }
}
