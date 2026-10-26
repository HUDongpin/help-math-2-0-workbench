'use client';

import {useEffect, useRef} from 'react';

import {DescriptorDrivenWholeLessonPlayer} from
  '@/components/descriptor-driven-whole-lesson-player';
import type {PageOnlyLessonPlayerDescriptor} from
  '@/lib/whole-lesson-player-descriptor';

const GLOSSARY_PAGE = 'shared-alg001-l12-p011';

export function AlgL12P002Player({descriptor, locale}: {
  descriptor: PageOnlyLessonPlayerDescriptor; locale: 'en' | 'es';
}) {
  const root = useRef<HTMLDivElement>(null);
  const pending = useRef<{trigger: HTMLButtonElement; opened: boolean} | null>(null);
  useEffect(() => {
    const boundary = root.current;
    if (!boundary) return;
    const observer = new MutationObserver(() => {
      const saved = pending.current;
      if (!saved) return;
      const host = boundary.querySelector('[data-lesson-player]');
      if (host?.getAttribute('data-current-animation-id') !== GLOSSARY_PAGE ||
          !saved.trigger.isConnected || !boundary.contains(saved.trigger)) {
        pending.current = null;
        return;
      }
      const open = Boolean(boundary.querySelector(
        '[role="dialog"][data-glossary-entry-id]'));
      if (open) saved.opened = true;
      else if (saved.opened) {
        pending.current = null;
        saved.trigger.focus({preventScroll: true});
      }
    });
    observer.observe(boundary, {childList: true, subtree: true, attributes: true,
      attributeFilter: ['data-current-animation-id']});
    return () => {observer.disconnect(); pending.current = null;};
  }, []);
  return <div ref={root} onClickCapture={event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest<HTMLButtonElement>(
      '[data-page-interaction-companion-surface="shared-alg001-l12-p011-glossary"] button[data-source-character-id]');
    if (trigger && !trigger.disabled) pending.current = {trigger, opened: false};
  }}>
    <DescriptorDrivenWholeLessonPlayer audioEnabled={false} candidateMode
      descriptor={descriptor} hostPresentation="modern-wide"
      initialPlacementId="shared-alg001-l12-p002" locale={locale}
      releasePublished={false} reviewerMode strictCompleteMemberCount={0}/>
  </div>;
}
