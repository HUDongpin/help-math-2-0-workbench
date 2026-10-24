// Leave clearance for focus styles that settle without a border-box resize.
const MIN_FOCUS_VIEWPORT_GUTTER = 8;

export interface FocusBox {
    left: number;
    top: number;
    right: number;
    bottom: number;
}
export function outwardScrollDelta(value: number) { return value > 0 ? Math.ceil(value) : Math.floor(value); }
export function wholeFocusFits(box: FocusBox, viewport: FocusBox, inset: number) { return box.left - inset >= viewport.left && box.right + inset <= viewport.right && box.top - inset >= viewport.top && box.bottom + inset <= viewport.bottom; }
/** Reveals newly keyboard-focused controls after native focus scrolling and keeps
 * them visible through layout changes. One event-bound frame, never a clock loop;
 * installation alone and explicit user scrolling do not request a reveal. */
export function installModernControlFocusVisibility(root: HTMLElement, stage: HTMLElement) {
    if (typeof ResizeObserver === 'undefined')
        return () => { };
    const win = root.ownerDocument.defaultView!;
    let armed: HTMLElement | null = null, previouslyVisible = false, disposed = false, focusFrame = 0;
    const viewport = (): FocusBox => {
        const v = win.visualViewport, viewportTop = v?.offsetTop ?? 0;
        const header = root.querySelector<HTMLElement>('.lesson-shell2__learning-nav');
        const box = header?.getBoundingClientRect(), style = header && win.getComputedStyle(header);
        const headerBottom = box && style && ['fixed', 'sticky'].includes(style.position)
            && style.display !== 'none' && style.visibility === 'visible'
            && box.width > 0 && box.height > 0 && box.top <= viewportTop + 1 && box.bottom > viewportTop
            ? box.bottom : viewportTop;
        return { left: v?.offsetLeft ?? 0, top: Math.max(viewportTop, headerBottom), right: (v?.offsetLeft ?? 0) + (v?.width ?? win.innerWidth), bottom: viewportTop + (v?.height ?? win.innerHeight) };
    };
    const fits = (node: HTMLElement) => { const style = win.getComputedStyle(node), inset = Math.max(MIN_FOCUS_VIEWPORT_GUTTER, (parseFloat(style.outlineWidth) || 0) + Math.max(0, parseFloat(style.outlineOffset) || 0)); return wholeFocusFits(node.getBoundingClientRect(), viewport(), inset); };
    const eligible = () => {
        const node = root.ownerDocument.activeElement;
        if (!(node instanceof win.HTMLElement) || !root.isConnected || !node.isConnected
            || !root.contains(node) || node.closest('[inert],[aria-hidden="true"],[hidden]')) return null;
        if (node.matches('[data-responsive-focus-key]:focus-visible') && node.closest('.lesson-shell2__modern-toolbar')) return node;
        const nativeSection = node.closest<HTMLElement>('section[data-fq002-native-flow="true"]');
        if (!nativeSection || !node.matches(':focus-visible')) return null;
        const nativeControl = node.matches('[data-fq002-focus-control], button[data-fq002-audio]')
            || (node.matches('select') && !!node.closest('[data-audio-language]'));
        if (!nativeControl) return null;
        const box = node.getBoundingClientRect(), sectionBox = nativeSection.getBoundingClientRect();
        const style = win.getComputedStyle(node), sectionStyle = win.getComputedStyle(nativeSection);
        return box.width > 0 && box.height > 0 && sectionBox.width > 0 && sectionBox.height > 0
            && style.display !== 'none' && style.visibility === 'visible'
            && sectionStyle.display !== 'none' && sectionStyle.visibility === 'visible' ? node : null;
    };
    const cancelFocusFrame = () => { if (focusFrame) win.cancelAnimationFrame(focusFrame); focusFrame = 0; };
    const onFocus = (event?: FocusEvent) => {
        cancelFocusFrame();
        armed = eligible();
        // A new keyboard focus acquisition gets one post-focus-scroll repair.
        // Installation alone must not pull a previously offscreen control back.
        previouslyVisible = !!armed && (event !== undefined || fits(armed));
        if (event && armed) focusFrame = win.requestAnimationFrame(() => { focusFrame = 0; changed(); });
    };
    const disarm = () => { cancelFocusFrame(); armed = null; previouslyVisible = false; };
    const keyIntent = (event: KeyboardEvent) => {
        if (event.defaultPrevented || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
        // Native range and select keys change a value; they do not express page-scroll intent.
        const target = eligible();
        if (target && event.target === target && target.matches('input[type="range"], select')) return;
        disarm();
    };
    const changed = () => { if (disposed)
        return; const node = eligible(); if (!node || node !== armed) {
        disarm();
        return;
    } const visible = fits(node); if (previouslyVisible && !visible) {
        node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        const box = node.getBoundingClientRect(), bounds = viewport(), style = win.getComputedStyle(node), margin = Math.max(MIN_FOCUS_VIEWPORT_GUTTER, (parseFloat(style.outlineWidth) || 0) + Math.max(0, parseFloat(style.outlineOffset) || 0));
        const left = box.left - margin < bounds.left ? box.left - margin - bounds.left : box.right + margin > bounds.right ? box.right + margin - bounds.right : 0, top = box.top - margin < bounds.top ? box.top - margin - bounds.top : box.bottom + margin > bounds.bottom ? box.bottom + margin - bounds.bottom : 0;
        if (left || top)
            win.scrollBy({ left: outwardScrollDelta(left), top: outwardScrollDelta(top), behavior: 'instant' });
        // A transiently clamped scroll must not cancel keyboard protection.
        // Retain it for later layout notifications until explicit disarm.
    }
    else
        previouslyVisible = visible; };
    const observer = new ResizeObserver(changed);
    observer.observe(stage);
    if (stage.parentElement)
        observer.observe(stage.parentElement);
    observer.observe(root);
    const header = root.querySelector('.lesson-shell2__learning-nav');
    if (header) observer.observe(header);
    for (const toolbar of root.querySelectorAll('.lesson-shell2__modern-toolbar'))
        observer.observe(toolbar);
    root.addEventListener('focusin', onFocus);
    root.addEventListener('focusout', disarm);
    win.addEventListener('wheel', disarm, { passive: true });
    win.addEventListener('touchmove', disarm, { passive: true });
    win.addEventListener('pointerdown', disarm, { passive: true });
    win.addEventListener('keydown', keyIntent);
    win.addEventListener('resize', changed);
    win.visualViewport?.addEventListener('resize', changed);
    onFocus();
    return () => { disposed = true; observer.disconnect(); root.removeEventListener('focusin', onFocus); root.removeEventListener('focusout', disarm); win.removeEventListener('wheel', disarm); win.removeEventListener('touchmove', disarm); win.removeEventListener('pointerdown', disarm); win.removeEventListener('keydown', keyIntent); win.removeEventListener('resize', changed); win.visualViewport?.removeEventListener('resize', changed); disarm(); };
}
