'use client';

import {useCallback, useSyncExternalStore, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

export function G4L12CalibrationCompanion({targetId, children}: {
  targetId?: string; children: ReactNode;
}) {
  const subscribe = useCallback((notify: () => void) => {
    if (!targetId) return () => {};
    const observer = new MutationObserver(notify);
    observer.observe(document.body, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [targetId]);
  const snapshot = useCallback(() => targetId ? document.getElementById(targetId) : null, [targetId]);
  const target = useSyncExternalStore(subscribe, snapshot, () => null);
  // A declared companion never falls back inside My Lesson's clipped stage.
  return targetId ? (target ? createPortal(children, target) : null) : children;
}
