async page => {
  const plan = page.__g678LayoutCase;
  if (!plan || !['017', '018'].includes(plan.page) || !['en', 'es'].includes(plan.locale)) throw Error('explicit layout adapter required');
  const {page: p, locale, viewport, output} = plan;
  const id = `shared-alg001-l06-p${p}`;
  const assert = (value, label) => {if (!value) throw Error(label);};
  const labels = locale === 'es'
    ? {play: 'Reproducir animación', pause: 'Pausar animación', replay: 'Repetir', close: 'Cerrar glosario'}
    : {play: 'Play animation', pause: 'Pause animation', replay: 'Replay', close: 'Close glossary'};
  if (!page.__g678LayoutErrors) {
    page.__g678LayoutErrors = [];
    page.on('pageerror', error => page.__g678LayoutErrors.push(String(error)));
  }
  await page.setViewportSize(viewport);
  await page.emulateMedia({reducedMotion: 'reduce'});
  const response = await page.goto(`http://127.0.0.1:3331/${locale}/migration-status/g678-calibration/${id}/continuous-v1?mode=focus`, {waitUntil: 'domcontentloaded', timeout: 60000});
  assert(response.status() === 200, 'registered host route');
  await page.waitForFunction(p => document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-player-phase`) === 'ready', p, {timeout: 45000});
  await page.keyboard.press('Tab');
  assert(await page.locator('.skip-link').evaluate(e => e === document.activeElement), 'trusted Tab reaches skip link');
  await page.keyboard.press('Enter');
  assert(await page.locator('#main-content').evaluate(e => e === document.activeElement), 'skip link transfers focus to My Lesson');
  await page.getByRole('button', {name: labels.play, exact: true}).click();
  await page.waitForFunction(p => Number(document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-player-frame`)) >= 25, p, {timeout: 15000});
  await page.getByRole('button', {name: labels.pause, exact: true}).click();
  await page.evaluate(p => {window.__g678LayoutNode = document.querySelector(`[data-p${p}-player]`);}, p);
  const observations = [];
  for (const fontPercent of [100, 200]) {
    await page.evaluate(percent => {document.documentElement.style.fontSize = `${percent}%`;}, fontPercent);
    const canvas = page.locator(`[data-p${p}-player] canvas`).first();
    await canvas.scrollIntoViewIfNeeded();
    const observation = await page.evaluate(({p, fontPercent}) => {
      const player = document.querySelector(`[data-p${p}-player]`), canvas = player.querySelector('canvas');
      const native = document.querySelector(`[data-p${p}-native-text]`);
      const rect = element => element.getBoundingClientRect().toJSON();
      const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const view = {left: 0, top: 0, right: innerWidth, bottom: innerHeight};
      const canvasRect = rect(canvas);
      const overlays = ['.site-header', '.lesson-shell2__learning-nav', '.skip-link'].map(selector => {
        const e = document.querySelector(selector), style = getComputedStyle(e), bounds = rect(e);
        return {selector, position: style.position, display: style.display, rect: bounds,
          visibleArea: style.display === 'none' ? 0 : overlap(bounds, view),
          canvasOverlap: style.display === 'none' ? 0 : overlap(bounds, canvasRect)};
      });
      const clipping = [];
      for (let e = canvas.parentElement; e; e = e.parentElement) {
        const style = getComputedStyle(e), bounds = rect(e);
        const x = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX);
        const y = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY);
        if ((x && (canvasRect.left < bounds.left - 1 || canvasRect.right > bounds.right + 1)) ||
          (y && (canvasRect.top < bounds.top - 1 || canvasRect.bottom > bounds.bottom + 1))) {
          clipping.push({tag: e.tagName, class: e.className, overflowX: style.overflowX, overflowY: style.overflowY, rect: bounds});
        }
      }
      return {fontPercent, rootFontPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
        nativeTextFontPx: parseFloat(getComputedStyle(native?.querySelector('p') ?? native).fontSize),
        viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio},
        frame: Number(player.getAttribute(`data-p${p}-player-frame`)), phase: player.getAttribute(`data-p${p}-player-phase`),
        sameNode: player === window.__g678LayoutNode, nativeOutsideCanvas: !player.contains(native),
        canvas: canvasRect, overlays, clipping, scrollWidth: document.documentElement.scrollWidth,
        rootClientWidth: document.documentElement.clientWidth, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches};
    }, {p, fontPercent});
    assert(observation.sameNode && observation.phase === 'paused', 'layout change preserves held player');
    assert(observation.viewport.dpr === 1 && observation.reducedMotion, 'observed DPR and motion matrix');
    assert(observation.scrollWidth <= observation.rootClientWidth + 1, 'document horizontal overflow');
    assert(observation.nativeOutsideCanvas, 'readable source companion remains in host flow');
    assert(observation.clipping.length === 0, 'canvas ancestor clipping');
    assert(observation.canvas.top >= -1 && observation.canvas.bottom <= viewport.height + 1, 'entire canvas can be reached in viewport');
    assert(observation.overlays.every(row => row.canvasOverlap <= 1), 'header or skip link covers canvas');
    assert(observation.overlays.find(row => row.selector === '.skip-link').visibleArea === 0, 'unfocused skip link fully hidden');
    if (viewport.width < 1280) assert(observation.overlays.find(row => row.selector === '.lesson-shell2__learning-nav').position === 'relative', 'compact header follows document flow');
    const image = `${output}/${id}-${locale}-${viewport.width}-${fontPercent}.png`;
    await page.screenshot({path: image, fullPage: true});
    observations.push({...observation, screenshot: image});
  }
  assert(observations[1].rootFontPx === observations[0].rootFontPx * 2 && observations[0].frame === observations[1].frame, 'measured root font enlargement preserves source cursor');
  const key = p === '017' ? 'Equation' : 'Evaluate', entryId = p === '017' ? 'equation' : 'evaluate';
  const trigger = page.locator(`[data-p${p}-glossary-key="${key}"]`).first();
  const instance = await trigger.getAttribute('data-source-button-instance-id');
  let tabs = 0;
  for (; tabs < 120; tabs++) {
    if (await trigger.evaluate(e => e === document.activeElement)) break;
    await page.keyboard.press('Shift+Tab');
  }
  assert(tabs < 120, 'glossary is reachable through trusted keyboard traversal');
  // Let the browser finish its native keyboard scroll before measuring focus.
  // No focus or scroll is assigned by the adapter here.
  await page.waitForTimeout(250);
  const focus = await trigger.evaluate(e => {
    const r = e.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {rect: r.toJSON(), hit: e === hit || e.contains(hit)};
  });
  assert(focus.hit && focus.rect.top >= -1 && focus.rect.bottom <= viewport.height + 1,
    `focused native control visible and unobscured: ${JSON.stringify(focus)}`);
  await page.keyboard.press('Enter');
  const dialog = page.locator(`[role="dialog"][data-glossary-entry-id="${entryId}"]`);
  await dialog.waitFor({state: 'visible'});
  const close = dialog.getByRole('button', {name: labels.close, exact: true});
  await close.click();
  await dialog.waitFor({state: 'hidden'});
  assert(await trigger.evaluate(e => e === document.activeElement), 'glossary returns focus to source instance');
  const held = await page.locator(`[data-p${p}-player]`).getAttribute(`data-p${p}-player-frame`);
  assert(Number(held) === observations[1].frame, 'glossary retains held source frame');
  await page.getByRole('button', {name: labels.replay, exact: true}).click();
  await page.waitForFunction(p => document.querySelector(`[data-p${p}-player]`)?.getAttribute(`data-p${p}-player-phase`) === 'ready', p);
  assert(await page.locator(`[data-p${p}-player]`).getAttribute(`data-p${p}-player-frame`) === '1', 'Replay after enlarged layout resets source');
  assert(page.__g678LayoutErrors.length === 0, 'layout browser page errors');
  return {status: 'scoped-layout-passed', animationId: id, locale, viewport, observations,
    keyboard: {tabs, instance, focus, glossaryFocusReturned: true, replayFrame: 1}, pageErrors: [...page.__g678LayoutErrors]};
}
