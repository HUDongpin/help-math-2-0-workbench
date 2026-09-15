'use client';

import {assertNever, type AnimationLanguage, type PageInteractionSpec} from './contract';
import {KeyTermDragStage} from './KeyTermDragStage';
import {SelectableTargetStage} from './SelectableTargetStage';

export function PageInteractionStage({
  lang,
  onSolved,
  replayNonce,
  spec,
  stageTargetId
}: {
  lang: AnimationLanguage;
  onSolved?: () => void;
  replayNonce: number;
  spec: PageInteractionSpec;
  stageTargetId: string;
}) {
  switch (spec.kind) {
    case 'drag-drop-key-terms':
      return (
        <KeyTermDragStage
          lang={lang}
          onSolved={onSolved}
          replayNonce={replayNonce}
          spec={spec}
          stageTargetId={stageTargetId}
        />
      );
    case 'selectable-targets':
      return (
        <SelectableTargetStage
          lang={lang}
          onSolved={onSolved}
          replayNonce={replayNonce}
          spec={spec}
          stageTargetId={stageTargetId}
        />
      );
    default:
      return assertNever(spec.kind, `Unhandled page interaction kind: ${String(spec.kind)}`);
  }
}
