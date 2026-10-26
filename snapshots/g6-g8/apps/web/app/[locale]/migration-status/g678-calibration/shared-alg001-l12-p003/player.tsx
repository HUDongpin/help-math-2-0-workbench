'use client';

import {useEffect, useRef} from 'react';

import {DescriptorDrivenWholeLessonPlayer} from
  '@/components/descriptor-driven-whole-lesson-player';
import type {PageOnlyLessonPlayerDescriptor} from
  '@/lib/whole-lesson-player-descriptor';

const PAGE_ID = 'shared-alg001-l12-p003';
const HOST_GLOSSARY_IDS: Readonly<Record<string, string>> = Object.freeze({
  '150': 'graph',
  '151': 'relation',
  '156': 'function',
  '157': 'equation',
  '161': 'linear-equation',
  '162': 'linear-function',
});

export function AlgL12P003Player({descriptor, locale}: {
  descriptor: PageOnlyLessonPlayerDescriptor; locale: 'en' | 'es';
}) {
  const root = useRef<HTMLDivElement>(null);
  const pending = useRef<{
    trigger: HTMLButtonElement; entryId: string; opened: boolean;
  } | null>(null);
  useEffect(() => {
    const boundary = root.current;
    if (!boundary) return;
    const observer = new MutationObserver(() => {
      const saved = pending.current;
      if (!saved) return;
      const host = boundary.querySelector('[data-lesson-player]');
      if (host?.getAttribute('data-current-animation-id') !== PAGE_ID ||
          !saved.trigger.isConnected || !boundary.contains(saved.trigger)) {
        pending.current = null;
        return;
      }
      const open = Boolean(document.querySelector(
        `[role="dialog"][data-glossary-entry-id="${saved.entryId}"]`));
      if (open) saved.opened = true;
      else if (saved.opened && !saved.trigger.disabled) {
        pending.current = null;
        saved.trigger.focus({preventScroll: true});
      }
    });
    observer.observe(document.body, {childList: true, subtree: true, attributes: true,
      attributeFilter: ['data-current-animation-id', 'data-glossary-entry-id',
        'disabled']});
    return () => {observer.disconnect(); pending.current = null;};
  }, []);
  return <div ref={root} onClickCapture={event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest<HTMLButtonElement>(
      '[data-animation-id="shared-alg001-l12-p003"] button[data-source-character-id]');
    const entryId = trigger?.dataset.sourceCharacterId &&
      HOST_GLOSSARY_IDS[trigger.dataset.sourceCharacterId];
    if (trigger && !trigger.disabled && entryId) {
      pending.current = {trigger, entryId, opened: false};
    }
  }}>
    <DescriptorDrivenWholeLessonPlayer audioEnabled={false} candidateMode
      descriptor={descriptor} hostPresentation="modern-wide"
      initialPlacementId={PAGE_ID} locale={locale}
      releasePublished={false} reviewerMode strictCompleteMemberCount={0}/>
  </div>;
}
