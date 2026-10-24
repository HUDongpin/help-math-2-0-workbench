/** A quiz state transition owns one focus reveal, never a scrolling loop. */
export function focusAndRevealQuizControl(control: HTMLElement | null): () => void {
  if (!control) return () => {};
  const document = control.ownerDocument;
  const view = document.defaultView;
  if (!view) return () => {};
  control.focus({preventScroll: true});
  const frame = view.requestAnimationFrame(() => {
    revealActiveQuizControl(control);
  });
  return () => view.cancelAnimationFrame(frame);
}

/** Visibility only: never changes which element owns focus. */
function revealActiveQuizControl(control: HTMLElement): void {
  const document = control.ownerDocument, view = document.defaultView;
  if (!view) return;
    if (!control.isConnected || document.activeElement !== control) return;
    const box = control.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    const viewport = view.visualViewport;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;
    const right = left + (viewport?.width ?? view.innerWidth);
    const bottom = top + (viewport?.height ?? view.innerHeight);
    const fits = box.left >= left + 8 && box.right <= right - 8
      && box.top >= top + 8 && box.bottom <= bottom - 8;
    const hit = fits ? document.elementFromPoint(
      (box.left + box.right) / 2, (box.top + box.bottom) / 2,
    ) : null;
    if (!fits || !(hit === control || (hit && control.contains(hit)))) {
      control.scrollIntoView({block: 'center', inline: 'nearest', behavior: 'instant'});
    }
}

/** One deferred check per focus/layout event, scoped to this mounted quiz.
 * No scroll listener or idle frame loop: ordinary reading scroll remains free. */
export function observeQuizFocusVisibility(root: HTMLElement | null): () => void {
  const view = root?.ownerDocument.defaultView;
  if (!root || !view) return () => {};
  let frame: number | null = null;
  let disposed = false;
  const schedule = () => {
    if (disposed || frame !== null) return;
    frame = view.requestAnimationFrame(() => {
      frame = null;
      const active = root.ownerDocument.activeElement;
      if (disposed || !root.isConnected || !active || !root.contains(active)
          || !active.matches('[data-in010-focus-control], .in010-quiz__keyword')) return;
      revealActiveQuizControl(active as HTMLElement);
    });
  };
  root.addEventListener('focusin', schedule);
  view.addEventListener('resize', schedule);
  view.visualViewport?.addEventListener('resize', schedule);
  const observer = new view.ResizeObserver(schedule);
  observer.observe(root);
  return () => {
    disposed = true;
    if (frame !== null) view.cancelAnimationFrame(frame);
    root.removeEventListener('focusin', schedule);
    view.removeEventListener('resize', schedule);
    view.visualViewport?.removeEventListener('resize', schedule);
    observer.disconnect();
  };
}
