import {expect, test, type Locator, type Page} from '@playwright/test';

import {G4_L3_WHOLE_LESSON_STORAGE_KEY} from '../lib/g4-l3-whole-lesson';

test.beforeEach(async ({page}) => {
  await page.route('**/api/learning-events', async (route) => {
    await route.fulfill({status: 204});
  });
});

async function openSeededLesson(
  page: Page,
  animationId: string,
  viewport = {width: 1920, height: 1080},
  progressHistory: {
    completedAnimationIds?: readonly string[];
    replayCounts?: Readonly<Record<string, number>>;
  } = {},
) {
  await page.setViewportSize(viewport);
  await page.addInitScript(({key, currentAnimationId, history}) => {
    window.localStorage.setItem(key, JSON.stringify({
      schemaVersion: 1,
      currentAnimationId,
      language: 'en',
      visitedAnimationIds: [currentAnimationId],
      completedAnimationIds: history.completedAnimationIds ?? [],
      replayCounts: history.replayCounts ?? {},
    }));
  }, {
    key: G4_L3_WHOLE_LESSON_STORAGE_KEY,
    currentAnimationId: animationId,
    history: progressHistory,
  });
  await page.goto('/courses/4/3?mode=focus', {waitUntil: 'domcontentloaded'});
  await expect(page.locator('[data-lesson-player="g4-l3-whole-lesson-mvp"]'))
    .toHaveAttribute('data-hydrated', 'true');
  await expect(page.getByRole('dialog', {name: 'Continue your lesson?'}))
    .toBeVisible();
}

async function continueLesson(page: Page) {
  await page.locator('[data-resume-choice="continue"]:visible').click();
  await expect(page.locator('[data-resume-decision="resolved"]')).toBeVisible();
}

async function expectMinimumFontSize(
  locator: Locator,
  minimum: number,
) {
  await expect(locator).toBeVisible();
  const size = await locator.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize));
  expect(size).toBeGreaterThanOrEqual(minimum);
}

async function expectAllMinimumFontSizes(
  locator: Locator,
  minimum: number,
) {
  const sizes = await locator.evaluateAll((elements) =>
    elements.map((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize)));
  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(minimum);
}

async function expectVisibleMinimumFontSizes(
  locator: Locator,
  minimum: number,
) {
  const sizes = await locator.evaluateAll((elements) => elements.flatMap((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return box.width > 0
      && box.height > 0
      && style.display !== 'none'
      && style.visibility !== 'hidden'
      ? [Number.parseFloat(style.fontSize)]
      : [];
  }));
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(minimum);
}

test('Learning Home keeps lesson and teacher information readable across EN/ES viewports', async ({page}) => {
  test.setTimeout(120_000);
  const cases = [
    {path: '/', viewport: {width: 1440, height: 900}, lessons: 'All lessons', teacher: 'Teacher'},
    {path: '/', viewport: {width: 390, height: 844}, lessons: 'All lessons', teacher: 'Teacher'},
    {path: '/es', viewport: {width: 1024, height: 768}, lessons: 'Todas las lecciones', teacher: 'Docente'},
    {path: '/es', viewport: {width: 320, height: 568}, lessons: 'Todas las lecciones', teacher: 'Docente'},
  ] as const;

  for (const scenario of cases) {
    await page.setViewportSize(scenario.viewport);
    await page.goto(scenario.path, {waitUntil: 'domcontentloaded'});
    const platform = page.locator('[data-learning-platform-home]');
    await expect(platform).toBeVisible();

    const workspaceRail = page.getByRole('navigation', {
      name: scenario.path.startsWith('/es')
        ? 'Espacio de aprendizaje'
        : 'Learning workspace',
    });
    await expectVisibleMinimumFontSizes(
      workspaceRail.locator(
        'small, i, [class*="__railGroup"], [class*="__languageRow"] > span',
      ),
      13,
    );

    // The count remains visible/audible on wide layouts and becomes
    // presentation-only on compact layouts; the navigation label is stable.
    await page.getByRole('button', {name: scenario.lessons}).click();
    await expect(page.locator('[data-workspace-screen="lessons"]')).toBeVisible();
    const lessonCopy = page.locator('[data-lesson-card-copy]').first();
    await expectMinimumFontSize(lessonCopy.locator('small'), 13);
    await expectMinimumFontSize(lessonCopy.locator('strong'), 18);
    await expectMinimumFontSize(lessonCopy.locator('span'), 14);
    await expectAllMinimumFontSizes(
      page.locator('[data-lesson-card-status]'),
      13,
    );
    const lessonOverflow = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(lessonOverflow.scroll).toBeLessThanOrEqual(lessonOverflow.client + 1);

    await page.getByRole('button', {name: scenario.teacher, exact: true}).click();
    await expect(page.locator('[data-workspace-screen="class"]')).toBeVisible();
    await expectMinimumFontSize(
      page.locator('[data-teacher-stats] article span').first(),
      13,
    );
    const mastery = page.locator('[data-teacher-mastery]');
    await expectMinimumFontSize(mastery, 14);
    await expectMinimumFontSize(
      page.getByText('p(mastery)', {exact: true}),
      13,
    );
    await expectAllMinimumFontSizes(mastery.locator('thead th'), 13);
    await expectAllMinimumFontSizes(mastery.locator('tbody th small'), 13);
    await expectAllMinimumFontSizes(mastery.locator('tbody td b'), 14);
    await expectMinimumFontSize(
      page.locator('[data-teacher-actions] button').first(),
      15,
    );
    const attentionItems = page.locator('[data-teacher-attention] > div');
    await expectAllMinimumFontSizes(attentionItems, 14);
    await expectAllMinimumFontSizes(attentionItems.locator('small'), 13);

    const teacherLayout = await page.evaluate(() => {
      const tableRegion = document.querySelector<HTMLElement>(
        '[data-teacher-mastery]',
      )?.parentElement;
      return {
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        tableOverflow: tableRegion ? getComputedStyle(tableRegion).overflowX : null,
      };
    });
    expect(teacherLayout.scroll).toBeLessThanOrEqual(teacherLayout.client + 1);
    expect(teacherLayout.tableOverflow).toBe('auto');

    for (const button of await page.locator(
      '[data-teacher-actions] button, [aria-label="Learning workspace role"] button, [aria-label="Rol del espacio de aprendizaje"] button',
    ).all()) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  }
});

test('Introduction resume decision is a clear modern progress card', async ({page}) => {
  await openSeededLesson(page, 'course-g04-l03-rw-003', {width: 844, height: 600});

  const dialog = page.getByRole('dialog', {name: 'Continue your lesson?'});
  const card = dialog.locator('.lesson-shell2__resume-modern-card');
  await expect(card).toHaveAttribute(
    'data-visual-origin',
    'modern-functional-equivalent-source-evidence-retained',
  );
  await expect(card.getByText('Saved on this device', {exact: true})).toBeVisible();
  await expect(card.getByText('Page 3', {exact: true})).toBeVisible();
  await expect(card.getByText('Page 2', {exact: true})).toBeVisible();
  await expect(dialog.locator('img')).toHaveCount(0);

  const continueButton = dialog.getByRole('button', {name: 'Continue from page 3'});
  const startButton = dialog.getByRole('button', {name: 'Start at Page 1'});
  await expect(card.locator('.lesson-shell2__resume-modern-location small'))
    .toHaveAttribute('lang', 'en');
  await expect(continueButton).toBeFocused();
  expect(await card.evaluate((element) => element.scrollTop)).toBe(0);
  const cardBox = await card.boundingBox();
  const headerBox = await card.locator('.lesson-shell2__resume-modern-header')
    .boundingBox();
  expect(cardBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect(headerBox!.y).toBeGreaterThanOrEqual(cardBox!.y - 1);
  for (const button of [continueButton, startButton]) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
  await continueButton.click();
  await expect(page.locator('[data-current-page="3"]')).toBeVisible();
  await expect(page.getByRole('heading', {level: 1, name: 'Page 2'})).toBeFocused();
});

test('saved-position prompt leaves the lesson toolbar available', async ({page}) => {
  await openSeededLesson(page, 'course-g04-l03-rw-003', {width: 844, height: 600});

  const dialog = page.getByRole('dialog', {name: 'Continue your lesson?'});
  const toolbar = page.locator('.lesson-shell2__modern-toolbar');
  await expect(page.locator('.lesson-shell2')).toHaveAttribute(
    'data-session-decision-controls',
    'available',
  );
  await expect(dialog).toHaveAttribute('data-lesson-controls-available', 'true');
  await expect(dialog).not.toHaveAttribute('aria-modal', 'true');
  await expect(toolbar).not.toHaveAttribute('inert', '');
  await expect(toolbar).not.toHaveAttribute('aria-hidden', 'true');
  await expect(toolbar).toHaveCSS('pointer-events', 'auto');
  await expect(page.locator('.lesson-shell2__spine')).toHaveAttribute('inert', '');
  await expect(page.locator('.lesson-shell2__spine'))
    .toHaveAttribute('aria-hidden', 'true');

  const previous = toolbar.locator('[data-lesson-nav="action-previous"]');
  const play = toolbar.locator('[data-responsive-focus-key="pause"]');
  const next = toolbar.locator('[data-lesson-nav="action-next"]');
  const replay = toolbar.locator('[data-responsive-focus-key="replay"]');
  const nova = toolbar.getByRole('button', {name: 'Ask Nova', exact: true});
  for (const control of [previous, play, next, replay, nova]) {
    await expect(control).toBeVisible();
    await expect(control).toBeEnabled();
  }

  await previous.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('[data-resume-decision="resolved"]')).toBeVisible();
  await expect(page.locator('[data-current-page="2"]')).toBeVisible();
});

test('Nova can be opened directly from an unresolved saved-position prompt', async ({page}) => {
  await openSeededLesson(page, 'course-g04-l03-rw-003', {width: 1440, height: 900});

  await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
  await expect(page.getByRole('dialog', {name: 'Continue your lesson?'}))
    .toHaveCount(0);
  await expect(page.locator('[data-resume-decision="resolved"]')).toBeVisible();
  await expect(page.locator('.lesson-shell2')).toHaveAttribute('data-tutor-open', 'true');
  await expect(page.locator('.lesson-shell2__nova-panel')).toBeVisible();
  await expect(page.locator('[data-current-page="3"]')).toBeVisible();
});

test('Starting at Page 1 keeps completed and replay history and restores lesson focus', async ({page}) => {
  await openSeededLesson(
    page,
    'course-g04-l03-rw-003',
    {width: 844, height: 600},
    {
      completedAnimationIds: ['course-g04-l03-rw-003'],
      replayCounts: {'course-g04-l03-rw-003': 2},
    },
  );
  await page.getByRole('button', {name: 'Start at Page 1'}).click();
  await expect(page.locator('[data-current-page="1"]')).toBeVisible();
  await expect(page.getByRole('heading', {level: 1, name: 'Introduction'})).toBeFocused();
  const stored = await page.evaluate((key) =>
    JSON.parse(window.localStorage.getItem(key) ?? '{}'),
  G4_L3_WHOLE_LESSON_STORAGE_KEY);
  expect(stored.completedAnimationIds).toContain('course-g04-l03-rw-003');
  expect(stored.replayCounts['course-g04-l03-rw-003']).toBe(2);
});

test('VB005 keeps its three Source Terms inside the animation bottom edge', async ({page}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await openSeededLesson(
    page,
    'course-g04-l03-vb-005',
    {width: 1440, height: 900},
  );
  await continueLesson(page);

  const learning = page.locator('.lesson-shell2__learning-column');
  const stage = page.locator('.lesson-shell2__legacy-stage');
  const sourceTerms = stage.locator(
    '[data-source-glossary-placement="visible-stage-content-bottom"]',
  );
  const sourceTermBar = sourceTerms.locator('> div[role="group"]');
  const canvas = page.locator(
    'canvas[data-course-canvas="course-g04-l03-vb-005"]',
  );
  await expect(canvas).toBeVisible({timeout: 20_000});
  await expect(sourceTerms).toBeVisible({timeout: 20_000});
  await expect(sourceTermBar).toBeVisible();
  await expect(sourceTerms).toHaveAttribute(
    'data-page-interaction-companion-surface',
    'source-glossary',
  );
  for (const term of ['Negative number', 'Less than', 'Zero']) {
    await expect(sourceTerms.getByRole('button', {name: term, exact: true}))
      .toBeVisible();
  }
  await expect(page.locator(
    '.lesson-shell2__page-interaction-companion [data-page-interaction-companion-surface="source-glossary"]',
  )).toHaveCount(0);

  const expectSourceTermsInsideBottomEdge = async () => {
    const [learningBox, stageBox, canvasBox, sourceTermBarBox] = await Promise.all([
      learning.boundingBox(),
      stage.boundingBox(),
      canvas.boundingBox(),
      sourceTermBar.boundingBox(),
    ]);
    expect(learningBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();
    expect(sourceTermBarBox).not.toBeNull();
    const learningCenter = learningBox!.x + learningBox!.width / 2;
    const canvasCenter = canvasBox!.x + canvasBox!.width / 2;
    expect(Math.abs(learningCenter - canvasCenter)).toBeLessThanOrEqual(2);
    expect(sourceTermBarBox!.x).toBeGreaterThanOrEqual(stageBox!.x - 1);
    expect(sourceTermBarBox!.x + sourceTermBarBox!.width).toBeLessThanOrEqual(
      stageBox!.x + stageBox!.width + 1,
    );
    // At 320px the required 44px touch targets occupy more than 30% of the
    // visible stage height. Judge the control band by its centre and bottom,
    // rather than requiring its top edge to begin below a fixed 70% line.
    expect(sourceTermBarBox!.y + sourceTermBarBox!.height / 2)
      .toBeGreaterThanOrEqual(
        stageBox!.y + stageBox!.height * .75,
      );
    expect(sourceTermBarBox!.y + sourceTermBarBox!.height)
      .toBeGreaterThanOrEqual(
        stageBox!.y + stageBox!.height * .9,
      );
    expect(sourceTermBarBox!.y + sourceTermBarBox!.height).toBeLessThanOrEqual(
      stageBox!.y + stageBox!.height + 1,
    );
    expect(
      stageBox!.y + stageBox!.height
        - (sourceTermBarBox!.y + sourceTermBarBox!.height),
    ).toBeLessThanOrEqual(Math.max(16, stageBox!.height * .04));
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth <=
        document.documentElement.clientWidth
    )).toBe(true);
  };

  await expectSourceTermsInsideBottomEdge();

  const lessThanTerm = sourceTerms.getByRole('button', {
    name: 'Less than',
    exact: true,
  });
  await lessThanTerm.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.lesson-shell2'))
    .toHaveAttribute('data-active-tool', 'key-terms');
  const keyTermsPanel = page.locator('.lesson-shell2__side-panel--tool');
  await expect(keyTermsPanel).toBeVisible();
  await expect(keyTermsPanel.getByRole('heading', {
    level: 2,
    name: 'Key Terms',
    exact: true,
  })).toBeVisible();
  await expect(keyTermsPanel.getByRole('heading', {
    level: 3,
    name: 'Less than',
    exact: true,
  })).toBeVisible();
  await keyTermsPanel.getByRole('button', {name: 'Close tool'}).click();
  await expect(keyTermsPanel).toBeHidden();
  await expect.poll(
    () => lessThanTerm.evaluate((element) => document.activeElement === element),
    {timeout: 2_000},
  ).toBe(true);

  for (const viewport of [
    {width: 844, height: 600},
    {width: 320, height: 568},
  ]) {
    await page.setViewportSize(viewport);
    await expect(sourceTerms).toBeVisible();
    await expectSourceTermsInsideBottomEdge();
    const compactButtons = sourceTerms.getByRole('button');
    await expect(compactButtons).toHaveCount(3);
    const compactGeometry = await sourceTerms.evaluate((surface) => {
      const group = surface.querySelector<HTMLElement>('div[role="group"]');
      if (!group) return null;
      const groupRect = group.getBoundingClientRect();
      return {
        buttons: Array.from(group.querySelectorAll('button')).map((button) => {
          const rect = button.getBoundingClientRect();
          return {
            height: rect.height,
            left: rect.left,
            right: rect.right,
            width: rect.width,
          };
        }),
        group: {left: groupRect.left, right: groupRect.right},
      };
    });
    expect(compactGeometry).not.toBeNull();
    for (const box of compactGeometry!.buttons) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.left).toBeGreaterThanOrEqual(compactGeometry!.group.left - 1);
      expect(box.right).toBeLessThanOrEqual(compactGeometry!.group.right + 1);
    }
  }
});

test('Calculator has one bottom-spine entry and uses the modern learner keypad', async ({page}) => {
  await openSeededLesson(page, 'course-g04-l03-rw-002');
  await continueLesson(page);

  const spine = page.locator('.lesson-shell2__spine');
  const calculatorTrigger = spine.getByRole('button', {
    name: 'Calculator',
    exact: true,
  });
  await expect(spine).toBeVisible();
  await expect(page.getByRole('button', {
    name: 'Calculator',
    exact: true,
  })).toHaveCount(1);
  await expect(calculatorTrigger).toBeVisible();
  const [spineBox, triggerBox] = await Promise.all([
    spine.boundingBox(),
    calculatorTrigger.boundingBox(),
  ]);
  expect(spineBox).not.toBeNull();
  expect(triggerBox).not.toBeNull();
  expect(triggerBox!.height).toBeGreaterThanOrEqual(44);
  expect(triggerBox!.width).toBeGreaterThanOrEqual(44);
  expect(triggerBox!.y).toBeGreaterThan(spineBox!.y + spineBox!.height / 2);
  expect(triggerBox!.y + triggerBox!.height)
    .toBeLessThanOrEqual(spineBox!.y + spineBox!.height + 1);

  await calculatorTrigger.click();
  await expect(calculatorTrigger).toHaveAttribute('aria-expanded', 'true');
  const lessonRoot = page.locator('.lesson-shell2[data-host-presentation="modern-wide"]');
  const directory = spine.locator('.lesson-shell2__spine-directory');
  const calculatorPanel = spine.locator(
    '.lesson-shell2__spine-calculator-panel',
  );
  const calculator = calculatorPanel.locator('.lesson-shell2__calculator');
  const closeCalculator = calculatorPanel.getByRole('button', {
    name: 'Close calculator',
  });
  await expect(lessonRoot).toHaveAttribute('data-active-tool', 'calculator');
  await expect(lessonRoot).toHaveAttribute('data-spine-calculator-open', 'true');
  await expect(lessonRoot).toHaveAttribute('data-tool-open', 'false');
  await expect(lessonRoot).toHaveAttribute('data-support-modal-open', 'false');
  await expect(directory).toBeHidden();
  await expect(calculatorPanel).toBeVisible();
  await expect(closeCalculator).toBeFocused();
  await expect(page.locator('.lesson-shell2__side-panel--tool')).toBeHidden();
  await expect(calculatorPanel.locator('.lesson-shell2__tool-rail-page-context'))
    .toHaveCount(0);
  await expect(calculatorPanel).not.toContainText(/Page \d+ of \d+|TRY IT|Question 1/);
  await expect(calculator).toBeVisible();
  await expect(calculator).toHaveAttribute(
    'data-calculator-presentation',
    'modern-support',
  );
  await expect(calculator.locator('img')).toHaveCount(0);
  await expect(calculator.locator('.lesson-shell2__calculator-boundary'))
    .toHaveCount(0);
  await expect(calculator.locator('.lesson-shell2__calculator-memory'))
    .toHaveCount(0);

  await calculator.getByRole('button', {name: 'Two', exact: true}).click();
  await calculator.getByRole('button', {name: 'Add', exact: true}).click();
  await calculator.getByRole('button', {name: 'Three', exact: true}).click();
  await calculator.getByRole('button', {name: 'Equals', exact: true}).click();
  await calculator.getByRole('button', {name: 'Equals', exact: true}).click();
  await expect(calculator.locator('output[aria-label="Calculator display"]'))
    .toHaveText('8');

  await closeCalculator.click();
  await expect(directory).toBeVisible();
  await expect(calculatorPanel).toBeHidden();
  await expect(calculatorTrigger).toBeFocused();
  await calculatorTrigger.click();
  await expect(calculator.locator('output[aria-label="Calculator display"]'))
    .toHaveText('8');
  await page.keyboard.press('Escape');
  await expect(calculatorPanel).toBeHidden();
  await expect(calculatorTrigger).toBeFocused();
  await page.getByRole('button', {
    name: 'Hide lesson section names',
  }).click();
  await expect(spine).toHaveAttribute('data-spine-state', 'collapsed');
  await expect(calculatorTrigger).toBeVisible();
  const collapsedBox = await calculatorTrigger.boundingBox();
  expect(collapsedBox).not.toBeNull();
  expect(collapsedBox!.height).toBeGreaterThanOrEqual(44);
  expect(collapsedBox!.width).toBeGreaterThanOrEqual(44);
});

test('GS002 presents one crisp actor layer and a responsive modern game loop', async ({page}) => {
  test.setTimeout(70_000);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await openSeededLesson(page, 'course-g04-l03-gs-002');
  await continueLesson(page);

  const canvas = page.locator(
    'canvas[data-course-canvas="course-g04-l03-gs-002-interaction-base"]',
  );
  await expect(canvas).toHaveAttribute(
    'data-current-js-game-base',
    'source-sprite321-case426-clean-base',
    {timeout: 50_000},
  );
  const stageControls = page.getByRole('form', {
    name: 'Move the space ship to the target',
  });
  const ship = stageControls.locator(
    'img[data-source-sprite-sha256="06c707e65cfd9a9c8fd7b13cd1570c12ed9e2185f4c20fbb8e2c532ee00abeaa"]',
  );
  const virus = stageControls.locator(
    'img[data-source-sprite-sha256="4e3f9ed24e5c1b637ef9a56089a58d9c2bdef55d71588825e80fd0efcb8404fe"]',
  );
  await expect(ship).toBeVisible();
  await expect(virus).toBeVisible();
  for (const actor of [ship, virus]) {
    const image = await actor.evaluate((element) => {
      const imageElement = element as HTMLImageElement;
      const rect = imageElement.getBoundingClientRect();
      return {
        complete: imageElement.complete,
        naturalHeight: imageElement.naturalHeight,
        naturalWidth: imageElement.naturalWidth,
        renderedHeight: rect.height,
        renderedWidth: rect.width,
      };
    });
    expect(image.complete).toBe(true);
    expect(image.naturalHeight).toBeGreaterThan(0);
    expect(image.naturalWidth).toBeGreaterThan(0);
    expect(image.renderedHeight).toBeGreaterThan(0);
    expect(image.renderedWidth).toBeGreaterThan(0);
  }
  const pause = page.locator(
    '.lesson-shell2__modern-toolbar [data-responsive-focus-key="pause"]',
  );
  await pause.click();
  await expect(page.locator('[data-source-sprite-mask]')).toHaveCount(0);
  await expect(page.locator('output[aria-label="Time remaining"]'))
    .toHaveText('00:04:00');

  await pause.click();
  await stageControls.getByRole('radio', {name: 'Positive'}).check();
  await stageControls.getByRole('textbox', {name: 'Number of spaces'}).fill('7');
  await stageControls.getByRole('button', {name: 'Go'}).click();
  await expect(page.locator('[data-current-js-hit-feedback="visible"]'))
    .toBeVisible({timeout: 8_000});
  await expect(stageControls.locator('output[aria-label="Score 1"]'))
    .toBeVisible();
  await expect(page.locator('[data-current-js-hit-feedback="visible"]'))
    .toHaveCount(0, {timeout: 3_000});

  await stageControls.getByRole('button', {name: 'New Game'}).click();
  await expect(stageControls.locator('output[aria-label="Score 0"]'))
    .toBeVisible();
  await expect(page.locator('output[aria-label="Time remaining"]'))
    .not.toContainText(':60');
});

test('Nova replies render Markdown, a text diagram, and LaTeX without literal syntax', async ({page}) => {
  await page.route('**/api/nova', async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        ok: true,
        model: 'openai/gpt-5.6-luna',
        reply: `A **number line** helps us see where numbers are.

\`\`\`text
-3 -2 -1  0  1  2  3
 |  |  |  |  |  |  |
\`\`\`

- Numbers **to the right** get bigger.
- Negative temperatures include $-2^\\circ\\mathrm{C}$.

$$-4 < -1$$`,
      }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await openSeededLesson(page, 'course-g04-l03-vb-002');
  await continueLesson(page);
  await page.getByRole('button', {name: 'Ask Nova', exact: true}).click();
  const panel = page.locator('.lesson-shell2__nova-panel');
  await panel.getByRole('textbox', {name: 'Type a question for Nova'})
    .fill('Help me understand the number line.');
  await panel.getByRole('button', {name: 'Send question to Nova'}).click();

  const reply = panel.locator('[data-nova-message-role="assistant"]');
  await expect(reply.locator('strong').filter({hasText: 'number line'})).toBeVisible();
  await expect(reply.locator('pre code.language-text')).toContainText('-3 -2 -1');
  await expect(reply.locator('ul li')).toHaveCount(2);
  await expect(reply.locator('.katex')).toHaveCount(2);
  await expect(reply.locator('.katex-display')).toHaveCount(1);
  await expect(reply.locator('.lesson-shell2__nova-markdown'))
    .not.toContainText(/\*\*|```|\$\$/u);
});
