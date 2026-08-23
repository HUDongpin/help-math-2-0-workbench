import {
  expect,
  test,
  type Browser,
  type Locator,
  type Page,
} from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const pages = [
  { occurrence: 1, id: "course-g04-l09-ir-001" },
  { occurrence: 2, id: "course-g04-l09-rw-002" },
  { occurrence: 12, id: "course-g04-l09-vb-009" },
  { occurrence: 16, id: "course-g04-l09-in-003" },
  { occurrence: 22, id: "course-g04-l09-in-009" },
  { occurrence: 23, id: "course-g04-l09-in-010" },
  { occurrence: 24, id: "course-g04-l09-in-011" },
  { occurrence: 27, id: "course-g04-l09-ti-002" },
  { occurrence: 28, id: "course-g04-l09-ti-003" },
  { occurrence: 30, id: "course-g04-l09-ti-005" },
  { occurrence: 33, id: "course-g04-l09-gs-002" },
  { occurrence: 40, id: "course-g04-l09-ts-008" },
  { occurrence: 41, id: "course-g04-l09-fq-001" },
  { occurrence: 42, id: "course-g04-l09-fq-002" },
] as const;

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
const screenshotRoot = path.join(repositoryRoot, "reports/browser-qa/g4-l9-p4");

function screenshotName(item: (typeof pages)[number]): string {
  return `${String(item.occurrence).padStart(3, "0")}-${item.id}.png`;
}

async function selectAnimation(
  page: Page,
  item: (typeof pages)[number],
): Promise<void> {
  const player = page.locator(
    '[data-lesson-player="descriptor-driven-page-only-product-bridge"]',
  );
  if ((await player.getAttribute("data-current-animation-id")) === item.id)
    return;
  const placementId = `g04-l09-placement-${String(item.occurrence).padStart(3, "0")}`;
  await page.evaluate(
    ({ currentAnimationId }) => {
      window.localStorage.setItem(
        "helpmath:g4-l9-p4-product-bridge:v1",
        JSON.stringify({
          schemaVersion: 1,
          releaseId: "private-g4-l9-p4-representative-slice-v1",
          currentAnimationId,
          locale: document.documentElement.lang,
          visitedAnimationIds: [currentAnimationId],
          reviewedAnimationIds: [],
          replayCounts: {},
        }),
      );
    },
    { currentAnimationId: placementId },
  );
  const response = await page.reload({ waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(player).toHaveAttribute("data-hydrated", "true");
  await expect(player).toHaveAttribute("data-current-animation-id", item.id);
}

async function exerciseGs002(page: Page, module: Locator): Promise<void> {
  await module.getByRole("button", { name: "Glossary", exact: true }).click();
  await expect(module).toHaveAttribute("data-host-decision", "allowed");
  const glossary = page.locator('[data-glossary-entry-id="equation"]');
  await expect(glossary).toBeVisible();
  await glossary
    .getByRole("button", { name: /Close and continue|Cerrar y continuar/ })
    .click();
  await module.getByRole("button", { name: "Course", exact: true }).click();
  await expect(module).toHaveAttribute("data-host-decision", "allowed");

  const runtimeStage = module.locator("..");
  const seed = Number(await runtimeStage.getAttribute("data-runtime-seed"));
  expect(Number.isSafeInteger(seed)).toBe(true);
  let expectedScore = 0;
  for (let questionIndex = 1; questionIndex <= 10; questionIndex += 1) {
    await expect(module).toHaveAttribute(
      "data-question-index",
      String(questionIndex),
    );
    const questionText = await module
      .getByRole("heading", { name: /Seeded question \d+/ })
      .textContent();
    const questionNumber = Number(questionText?.match(/\d+/)?.[0]);
    expect(Number.isInteger(questionNumber)).toBe(true);
    const correctOption = (questionNumber + seed) % 3;
    const chooseCorrect = questionIndex % 2 === 1;
    const selectedOption = chooseCorrect
      ? correctOption
      : (correctOption + 1) % 3;
    await module
      .getByRole("button", {
        name: `Option ${String.fromCharCode(65 + selectedOption)}`,
        exact: true,
      })
      .click();
    await expect(module.locator("[data-feedback]")).toHaveAttribute(
      "data-feedback",
      chooseCorrect ? "correct" : "incorrect",
    );
    if (chooseCorrect) expectedScore += 1;
    await expect(module).toHaveAttribute("data-score", String(expectedScore));
    await module.getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(module.locator('[data-final="true"]')).toHaveText(
    `Final · ${expectedScore}/10`,
  );
  await module.getByRole("button", { name: "Repeat", exact: true }).click();
  await expect(module).toHaveAttribute("data-question-index", "1");
  await expect(module).toHaveAttribute("data-score", "0");
  await module
    .getByRole("button", { name: "Blocked report", exact: true })
    .click();
  await expect(module).toHaveAttribute("data-host-decision", "blocked");
  await expect(module).toHaveAttribute("data-network-calls", "0");
  await module.getByRole("button", { name: "Replay", exact: true }).click();
  await expect(module).toHaveAttribute("data-question-index", "1");
  await expect(module).toHaveAttribute("data-score", "0");
  await expect(module).toHaveAttribute("data-network-calls", "0");
}

async function exercisePage(
  page: Page,
  item: (typeof pages)[number],
): Promise<void> {
  await selectAnimation(page, item);
  const player = page.locator(
    '[data-lesson-player="descriptor-driven-page-only-product-bridge"]',
  );
  await expect(player).toHaveAttribute(
    "data-current-page",
    String(item.occurrence),
  );
  await expect(player).toHaveAttribute(
    "data-renderer-availability",
    "registered",
  );
  await expect(player).toHaveAttribute("data-unavailable-pages", "29");
  await expect(player).toHaveAttribute(
    "data-page-audio-acceptance",
    "not-established",
  );
  await expect(player).toHaveAttribute(
    "data-page-actionscript-execution",
    "not-executed",
  );
  const module = page.locator(
    `[data-private-current-js="true"][data-animation-id="${item.id}"]`,
  );
  await expect(module).toBeVisible();
  await expect(module).toHaveAttribute("data-network-calls", "0");
  await expect(module).toHaveAttribute(
    "data-original-runtime-validated",
    "false",
  );
  await expect(module).toHaveAttribute("data-fidelity-accepted", "false");

  if (item.id === "course-g04-l09-gs-002") {
    await exerciseGs002(page, module);
    return;
  }

  const start = module.getByRole("button", { name: /Start|Comenzar/ });
  if (await start.count()) await start.click();
  const answer = module.getByRole("button", { name: /Option A|Opción A/ });
  await expect(answer).toBeEnabled();
  await answer.click();
  await expect(module.locator("[data-feedback]")).toBeVisible();

  const audio = module.getByRole("button", {
    name: /Play audio|Reproducir audio/,
  });
  if (await audio.count()) {
    await audio.click();
    await expect(module).toHaveAttribute("data-audio-lifecycle", "requested");
    await module
      .getByRole("button", { name: /Stop audio|Detener audio/ })
      .click();
    await expect(module).toHaveAttribute("data-audio-lifecycle", "stopped");
  }

  if (item.id.endsWith("fq-001") || item.id.endsWith("fq-002")) {
    await module
      .getByRole("button", { name: /Blocked report|Informe bloqueado/ })
      .click();
    await expect(module).toHaveAttribute("data-network-calls", "0");
    await expect(module).toHaveAttribute("data-host-decision", "blocked");
  }

  const replay = module.getByRole("button", { name: /Replay|Repetir/ }).last();
  await replay.click();
  await expect(module).toHaveAttribute("data-network-calls", "0");
  await expect(module).toHaveAttribute("data-replay", /[1-9]\d*/);
  await expect(module.locator("[data-feedback]")).toHaveCount(0);
}

async function runMatrix({
  browser,
  baseURL,
  locale,
  viewport,
  outputDirectory,
}: {
  browser: Browser;
  baseURL: string;
  locale: "en" | "es";
  viewport: { width: number; height: number };
  outputDirectory: "desktop-en-1440x1000" | "mobile-es-390x844";
}): Promise<void> {
  const context = await browser.newContext({
    baseURL,
    locale: locale === "en" ? "en-US" : "es-ES",
    reducedMotion: "reduce",
    viewport,
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const forbiddenRequests: string[] = [];
  const allowedOrigin = new URL(baseURL).origin;
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      (url.origin !== allowedOrigin ||
        /geturl|report|final-quiz-post|legacy-endpoint|xml-send/iu.test(
          url.href,
        ))
    )
      forbiddenRequests.push(url.href);
  });

  const routeResponse = await page.goto(
    `/${locale}/migration-status/g4-l9-product-bridge`,
  );
  expect(routeResponse?.status()).toBe(200);
  await expect(page.locator("[data-lesson-player]")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await mkdir(path.join(screenshotRoot, outputDirectory), { recursive: true });
  for (const item of pages) {
    await test.step(`${outputDirectory} ${item.occurrence} ${item.id}`, async () => {
      await exercisePage(page, item);
      await page.screenshot({
        animations: "disabled",
        path: path.join(screenshotRoot, outputDirectory, screenshotName(item)),
      });
    });
  }
  assertNoRuntimeErrors(consoleErrors, pageErrors, forbiddenRequests);
  await context.close();
}

function assertNoRuntimeErrors(
  consoleErrors: readonly string[],
  pageErrors: readonly string[],
  forbiddenRequests: readonly string[],
): void {
  expect(consoleErrors, "browser console errors").toEqual([]);
  expect(pageErrors, "uncaught page errors").toEqual([]);
  expect(
    forbiddenRequests,
    "external, legacy, or unknown network requests",
  ).toEqual([]);
}

test("14-page P4 private modern My Lesson matrix passes desktop EN and mobile ES", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000);
  expect(baseURL).toBeTruthy();
  await runMatrix({
    browser,
    baseURL: baseURL!,
    locale: "en",
    viewport: { width: 1440, height: 1000 },
    outputDirectory: "desktop-en-1440x1000",
  });
  await runMatrix({
    browser,
    baseURL: baseURL!,
    locale: "es",
    viewport: { width: 390, height: 844 },
    outputDirectory: "mobile-es-390x844",
  });
});
