import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page} from '@playwright/test';

type RuntimeIssue = {kind: 'console' | 'page'; message: string};

function monitorRuntimeIssues(page: Page) {
  const issues: RuntimeIssue[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push({kind: 'console', message: message.text()});
  });
  page.on('pageerror', (error) => issues.push({kind: 'page', message: error.message}));
  return issues;
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

async function setTemperature(page: Page, value: number) {
  await page.locator('#temperature-input').evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    valueSetter?.call(input, String(nextValue));
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
}

test('the English demo keeps content level, age experience, and supports independent', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  const response = await page.goto('/demos', {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'One math lesson. Three age-respectful experiences.',
  })).toBeVisible();

  await expect(page.getByText('Grade 4 mathematics', {exact: true}).first()).toBeVisible();
  const dualLanguage = page.getByRole('button', {name: 'Dual', exact: true});
  await expect(dualLanguage).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', {name: /High school/}).click();
  await expect(page.locator('[data-age="high"]')).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Use signed numbers with confidence'})).toBeVisible();
  await expect(page.getByText('Grade 4 mathematics', {exact: true}).first()).toBeVisible();
  await expect(dualLanguage).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', {name: 'Español', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Usa números con signo con confianza'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Evaluación', exact: true})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Números negativos', exact: true})).toBeVisible();
  await expect(page.getByText('Está a la izquierda del cero y usa un signo menos.')).toBeVisible();
  await expect(page.locator('output[for="temperature-input"] [lang="es"]')).toContainText(
    '−8° está bajo cero',
  );
  await expect(page.locator('output[for="temperature-input"] [lang="en"]')).toHaveCount(0);

  await setTemperature(page, 0);
  await expect(page.getByText('Está en cero, así que no tiene signo positivo ni negativo.')).toBeVisible();
  await page.getByRole('button', {name: 'Muéstramelo en la recta numérica'}).click();
  await expect(page.getByText('Ya estás en cero. No necesitas moverte.')).toBeVisible();

  await setTemperature(page, 12);
  await expect(page.locator('output[for="temperature-input"]')).toContainText(
    '12° está sobre cero',
  );
  await expect(page.getByText('Está a la derecha del cero, así que es positivo.')).toBeVisible();
  await expect(page.getByText(/Muévete 12 espacios a la derecha/)).toBeVisible();

  const visualModel = page.getByRole('button', {name: 'Visual model', exact: true});
  await visualModel.click();
  await expect(visualModel).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText(/El modelo visual está oculto/)).toBeVisible();

  await page.getByRole('button', {name: 'Dilo de otra manera'}).click();
  await expect(page.getByText(/Piensa en un termómetro a 12°/)).toBeVisible();

  await page.getByRole('button', {name: 'Evaluación', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Demuestra lo que sabes'})).toBeVisible();

  await page.getByRole('button', {name: 'English', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Show what you know'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Assessment', exact: true})).toBeVisible();

  await expect(page.locator('main a[href*="/courses/"]')).toHaveCount(0);
  await expect(page.locator('main a[href*="executive-preview"]')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolations(page);
  expect(issues).toEqual([]);
});

test('the mobile demo remains operable without horizontal scrolling', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const issues = monitorRuntimeIssues(page);
  await page.goto('/demos', {waitUntil: 'networkidle'});

  await page.getByRole('button', {name: /Middle school/}).click();
  await expect(page.locator('[data-age="middle"]')).toBeVisible();
  await page.getByRole('button', {name: 'Next step'}).click();
  await expect(page.getByText('Current step', {exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Reduce motion', exact: true}).click();
  await expect(page.locator('[class*="page"][data-reduced-motion="true"]')).toBeVisible();

  const interactiveTargets = page.locator('main button:visible, main a:visible');
  const targetCount = await interactiveTargets.count();
  expect(targetCount).toBeGreaterThan(20);
  for (let index = 0; index < targetCount; index += 1) {
    const box = await interactiveTargets.nth(index).boundingBox();
    if (!box) continue;
    expect(
      box.height >= 44 && box.width >= 44,
      `Target ${index} is only ${box.width}×${box.height}`,
    ).toBe(true);
  }

  await expectNoHorizontalOverflow(page);
  const menuSummary = page.locator('summary[aria-label="Open navigation"]');
  await expect(menuSummary).toBeVisible();
  await expect
    .poll(async () => (await menuSummary.boundingBox())?.height ?? 0)
    .toBeGreaterThanOrEqual(44);
  await menuSummary.click();
  const footerLinks = page.locator('footer a:visible');
  for (let index = 0; index < await footerLinks.count(); index += 1) {
    const box = await footerLinks.nth(index).boundingBox();
    if (box) expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await expectNoAxeViolations(page);
  expect(issues).toEqual([]);
});

test('core learning choices work with keyboard activation alone', async ({page}) => {
  const issues = monitorRuntimeIssues(page);
  await page.goto('/demos', {waitUntil: 'networkidle'});

  const highSchool = page.getByRole('button', {name: /High school/});
  await highSchool.focus();
  await page.keyboard.press('Enter');
  await expect(highSchool).toHaveAttribute('aria-pressed', 'true');

  const spanish = page.getByRole('button', {name: 'Español', exact: true});
  await spanish.focus();
  await page.keyboard.press('Space');
  await expect(spanish).toHaveAttribute('aria-pressed', 'true');

  const nextStep = page.getByRole('button', {name: 'Paso siguiente'});
  await nextStep.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Paso actual', {exact: true})).toBeVisible();
  await expect(page.getByText('Comprobación', {exact: true}).last()).toBeVisible();

  const novaQuestion = page.getByRole('button', {name: 'Muéstramelo en la recta numérica'});
  await novaQuestion.focus();
  await page.keyboard.press('Space');
  await expect(page.getByText(/Muévete 8 espacios a la izquierda/)).toBeVisible();

  expect(issues).toEqual([]);
});

test('the demo reflows across presentation and student-device viewports', async ({page}) => {
  const viewports = [
    {width: 1440, height: 900},
    {width: 1024, height: 768},
    {width: 768, height: 1024},
    {width: 844, height: 390},
    {width: 320, height: 568},
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/demos', {waitUntil: 'networkidle'});
    await expect(page.getByRole('heading', {
      level: 1,
      name: 'One math lesson. Three age-respectful experiences.',
    })).toBeVisible();
    const homeBrandBox = await page
      .getByRole('banner')
      .getByRole('link', {name: 'HELP Math home'})
      .boundingBox();
    expect(homeBrandBox, `Home brand is missing at ${viewport.width}×${viewport.height}`).not.toBeNull();
    expect(
      homeBrandBox?.height ?? 0,
      `Home brand is shorter than 44px at ${viewport.width}×${viewport.height}`,
    ).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
  }
});

test('the demo keeps content available at 200 percent text size', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const issues = monitorRuntimeIssues(page);
  await page.goto('/demos', {waitUntil: 'networkidle'});
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });

  await expect(page.getByRole('heading', {
    level: 1,
    name: 'One math lesson. Three age-respectful experiences.',
  })).toBeVisible();
  await expect(page.getByRole('button', {name: /High school/})).toBeVisible();
  await expect(page.getByRole('heading', {name: /Negative Numbers/})).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const keyRegions = page.locator('header, main section, main article, main aside');
  for (let index = 0; index < await keyRegions.count(); index += 1) {
    const box = await keyRegions.nth(index).boundingBox();
    if (!box) continue;
    expect(box.x, `Region ${index} starts outside the viewport`).toBeGreaterThanOrEqual(-1);
    expect(
      box.x + box.width,
      `Region ${index} ends outside the viewport`,
    ).toBeLessThanOrEqual(391);
  }
  expect(issues).toEqual([]);
});

test('read aloud cancels stale mathematics when the value or language changes', async ({page}) => {
  await page.addInitScript(() => {
    const speechTest = {
      cancelCount: 0,
      spoken: [] as string[],
      utterances: [] as Array<{onend?: (() => void) | null}>,
    };
    class FakeUtterance {
      lang = '';
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      rate = 1;

      constructor(public text: string) {}
    }
    Object.defineProperty(window, '__speechTest', {value: speechTest});
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeUtterance,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel() {
          speechTest.cancelCount += 1;
        },
        speak(utterance: FakeUtterance) {
          speechTest.spoken.push(utterance.text);
          speechTest.utterances.push(utterance);
        },
      },
    });
  });
  await page.goto('/demos', {waitUntil: 'networkidle'});

  await page.getByRole('button', {name: 'Read aloud'}).click();
  await expect(page.getByRole('button', {name: 'Stop reading'})).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => (
    window as unknown as {__speechTest: {spoken: string[]}}
  ).__speechTest.spoken)).toEqual([
    '−8° is below zero, so it is a negative number.',
    '−8° está bajo cero, así que es un número negativo.',
  ]);

  await setTemperature(page, 12);
  await expect(page.getByRole('button', {name: 'Read aloud'})).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('Read-aloud stopped.', {exact: true})).toBeVisible();
  const cancellationState = await page.evaluate(() => {
    const speechTest = (
      window as unknown as {
        __speechTest: {
          cancelCount: number;
          utterances: Array<{onend?: (() => void) | null}>;
        };
      }
    ).__speechTest;
    speechTest.utterances.forEach((utterance) => utterance.onend?.());
    return speechTest.cancelCount;
  });
  expect(cancellationState).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole('button', {name: 'Read aloud'})).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', {name: 'Read aloud'}).click();
  await page.getByRole('button', {name: 'Español', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Read aloud'})).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('La lectura en voz alta se detuvo.', {exact: true})).toBeVisible();
});

test('the Spanish route localizes the full product concept', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const issues = monitorRuntimeIssues(page);
  const response = await page.goto('/es/demos', {waitUntil: 'networkidle'});
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Una lección de matemáticas. Tres experiencias apropiadas para cada edad.',
  })).toBeVisible();

  await page.getByRole('button', {name: /Preparatoria/}).click();
  await expect(page.locator('[data-age="high"]')).toBeVisible();
  await page.getByRole('button', {name: 'Bilingüe', exact: true}).click();
  await expect(page.locator('output[for="temperature-input"] [lang="en"]')).toBeVisible();
  await expect(page.locator('output[for="temperature-input"] [lang="es"]')).toBeVisible();
  await expect(page.getByText('No publicada', {exact: true})).toBeVisible();

  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolations(page);
  expect(issues).toEqual([]);
});
