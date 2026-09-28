import {expect, test} from '@playwright/test';

const storageKey = 'helpmath:g4-l3:whole-lesson-mvp:v1';
for (const pageId of ['007', '008']) {
  test(`TS${pageId} completes through actual My Lesson and Replay resets activity`, async ({page, browser}) => {
    test.setTimeout(60_000);
    await test.info().attach('browser-version', {body: Buffer.from(browser.version()), contentType: 'text/plain'});
    await page.setViewportSize({width: 390, height: 844});
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
      if (url.pathname === '/api/learning-events') return route.fulfill({status: 204});
      return route.continue();
    });
    const id = `course-g04-l03-ts-${pageId}`;
    await page.addInitScript(({key, id}) => {
      localStorage.setItem(key, JSON.stringify({schemaVersion: 1, currentAnimationId: id,
        language: 'en', visitedAnimationIds: [id], completedAnimationIds: [], replayCounts: {}}));
    }, {key: storageKey, id});
    await page.goto('/courses/4/3?mode=focus');
    const player = page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"]');
    await expect(player).toHaveAttribute('data-hydrated', 'true');
    await page.locator('[data-resume-choice="continue"]:visible').click();
    await expect(player).toHaveAttribute('data-current-animation-id', id);
    const control = (name: string) => page.locator(`[data-ts${pageId}-focus-control="${name}"]:visible`).first();
    if (pageId === '007') {
      for (let step = 0; step < 4; step++) await control('walkthrough-continue').click();
    } else {
      for (let step = 1; step <= 4; step++) {
        await control(`walkthrough-step-${step}`).click();
        if (step >= 3) await control(`walkthrough-box-${step}-close`).click();
      }
    }
    await control(`choice-${pageId === '007' ? 'B' : 'D'}`).click();
    await expect(control('feedback-status')).toContainText(/Correct|YOU GOT IT|Great Job/);
    // Held feedback under reduced motion must not mark the lesson complete early.
    const progress = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
    expect((await progress()).completedAnimationIds).not.toContain(id);
    await control('feedback-status').getByRole('button', {name: 'Continue', exact: true}).click();
    await expect(control('terminal')).toBeVisible();
    await expect.poll(async () => (await progress()).completedAnimationIds).toContain(id);
    await page.getByRole('button', {name: 'Replay question', exact: true}).filter({visible: true}).first().click();
    await expect(control(pageId === '007' ? 'walkthrough-continue' : 'walkthrough-step-1')).toBeEnabled();
    await expect(control('terminal')).toHaveCount(0);
    expect((await progress()).completedAnimationIds).toContain(id);
    await expect.poll(async () => (await progress()).replayCounts[id]).toBe(1);
    const away = pageId === '007' ? 'next' : 'previous';
    const back = pageId === '007' ? 'previous' : 'next';
    await page.locator(`[data-responsive-focus-key="${away}"]:visible`).first().click();
    await expect(player).toHaveAttribute('data-current-animation-id', `course-g04-l03-ts-${pageId === '007' ? '008' : '007'}`);
    await page.locator(`[data-responsive-focus-key="${back}"]:visible`).first().click();
    await expect(player).toHaveAttribute('data-current-animation-id', id);
    await expect(control(pageId === '007' ? 'walkthrough-continue' : 'walkthrough-step-1')).toBeEnabled();
    expect((await progress()).completedAnimationIds).toContain(id);
    expect((await progress()).replayCounts[id]).toBe(1);
  });
}
