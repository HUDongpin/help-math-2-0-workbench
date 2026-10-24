/** Keep a newly focused lesson heading clear of the fixed host header.
 * Layout events may repair focus scrolling until the user expresses scroll or
 * pointer intent. Installation itself never moves an existing focus target. */
export function installLessonHeadingFocusVisibility(root: HTMLElement) {
  const document = root.ownerDocument;
  const win = document.defaultView;
  if (!win || typeof win.ResizeObserver !== 'function') return () => {};
  let target: HTMLElement | null = null;
  let observer: ResizeObserver | null = null;
  let pendingFrame = 0;
  let disposed = false;
  const cancelFrame = () => {
    if (pendingFrame) win.cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
  };
  const disarm = () => {
    cancelFrame();
    observer?.disconnect();
    observer = null;
    target = null;
  };
  const reveal = () => {
    pendingFrame = 0;
    const node = target;
    if (disposed || !root.isConnected || !node?.isConnected || !root.contains(node) || document.activeElement !== node) {
      disarm();
      return;
    }
    const header = root.querySelector('.lesson-shell2__learning-nav')?.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const viewport = win.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const top = Math.max(viewportTop, header && header.top < viewportTop + 1 ? header.bottom : 0) + 8;
    const bottom = viewportTop + (viewport?.height ?? win.innerHeight) - 8;
    let delta = 0;
    if (box.top < top) delta = box.top - top;
    else if (box.bottom > bottom) delta = box.height <= bottom - top ? box.bottom - bottom : box.top - top;
    if (delta) win.scrollBy({top: delta < 0 ? Math.floor(delta) : Math.ceil(delta), behavior: 'instant'});
  };
  const schedule = () => {
    if (disposed || !target) return;
    cancelFrame();
    pendingFrame = win.requestAnimationFrame(reveal);
  };
  const focus = (event: FocusEvent) => {
    disarm();
    const node = event.target;
    if (!(node instanceof win.HTMLElement) || !root.contains(node) || !node.matches('.lesson-shell2__page-heading h1') || node.closest('[inert],[aria-hidden="true"]')) return;
    target = node;
    observer = new win.ResizeObserver(schedule);
    for (const element of [node, root, root.querySelector('.lesson-shell2__learning-nav')]) {
      if (element) observer.observe(element);
    }
    schedule();
  };
  const keyIntent = (event: KeyboardEvent) => {
    if (['Tab', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) disarm();
  };
  root.addEventListener('focusin', focus);
  root.addEventListener('focusout', disarm);
  win.addEventListener('wheel', disarm, {passive: true});
  win.addEventListener('touchmove', disarm, {passive: true});
  win.addEventListener('pointerdown', disarm, {passive: true});
  win.addEventListener('keydown', keyIntent);
  win.addEventListener('resize', schedule);
  win.visualViewport?.addEventListener('resize', schedule);
  return () => {
    disposed = true;
    disarm();
    root.removeEventListener('focusin', focus);
    root.removeEventListener('focusout', disarm);
    win.removeEventListener('wheel', disarm);
    win.removeEventListener('touchmove', disarm);
    win.removeEventListener('pointerdown', disarm);
    win.removeEventListener('keydown', keyIntent);
    win.removeEventListener('resize', schedule);
    win.visualViewport?.removeEventListener('resize', schedule);
  };
}
