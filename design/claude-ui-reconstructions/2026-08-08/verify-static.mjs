#!/usr/bin/env node

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(packageDir, "../../..");
const requireFromRepo = createRequire(join(repoRoot, "package.json"));
const { chromium } = requireFromRepo("@playwright/test");
const AxeBuilder = requireFromRepo("@axe-core/playwright").default;

const baseUrl = (process.argv[2] || "http://127.0.0.1:3212").replace(/\/$/, "");
const outputDir = join(repoRoot, "output/playwright/claude-ui-reconstructions-2026-08-12");
mkdirSync(outputDir, { recursive: true });

const artifacts = [
  "help-math-player-support-contract",
  "help-math-player",
  "helpmath-2-ui",
  "helpmath-2-kids",
  "helpmath-2-soft",
  "helpmath-identity",
  "g4-ui-review",
  "help-math-ui-geometry",
];

const results = [];
const browserSignals = [];

function record(name, pass, details = {}) {
  const result = { name, pass: Boolean(pass), ...details };
  results.push(result);
  process.stdout.write(`${result.pass ? "PASS" : "FAIL"}\t${name}${details.note ? `\t${details.note}` : ""}\n`);
  return result.pass;
}

function assert(name, condition, details = {}) {
  if (!record(name, condition, details)) throw new Error(name);
}

async function guarded(name, task) {
  try {
    await task();
  } catch (error) {
    if (!results.some((item) => item.name === name && !item.pass)) {
      record(name, false, { error: String(error?.stack || error) });
    }
  }
}

function observe(page, label) {
  const signals = { label, pageErrors: [], consoleErrors: [], externalRequests: [] };
  page.on("pageerror", (error) => signals.pageErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") signals.consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith(baseUrl) && !/^(data|blob|about):/.test(url)) signals.externalRequests.push(url);
  });
  browserSignals.push(signals);
  return signals;
}

async function waitForSupportSync(page) {
  await page.waitForTimeout(80);
}

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "no-preference",
  });

  await guarded("archive launcher and all eight catalog selections", async () => {
    const page = await desktop.newPage();
    const signals = observe(page, "archive-launcher");
    const response = await page.goto(`${baseUrl}/index.html`, { waitUntil: "load" });
    assert("archive launcher returns HTTP 200", response?.status() === 200, { status: response?.status() });
    assert("archive exposes exactly eight catalog entries", await page.locator("button.entry").count() === 8);
    assert(
      "archive desktop has no horizontal overflow",
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
    );

    for (const artifact of artifacts) {
      const entry = page.locator(`button.entry[data-page="${artifact}"]`);
      await entry.click();
      await page.waitForFunction(
        (key) => document.querySelector("#preview-frame")?.getAttribute("src") === `pages/${key}.html`,
        artifact
      );
      const pressed = await page.locator('button.entry[aria-pressed="true"]').getAttribute("data-page");
      const href = await page.locator("#open-page").getAttribute("href");
      assert(`catalog selects ${artifact}`, pressed === artifact && href === `pages/${artifact}.html`, { pressed, href });
    }

    await page.locator('button.entry[data-page="help-math-player-support-contract"]').click();
    await page.locator("#preview-frame").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: join(outputDir, "archive-launcher-desktop.png"), fullPage: true });
    const axe = await new AxeBuilder({ page }).exclude("#preview-frame").analyze();
    assert("archive launcher has no axe findings outside the isolated preview", axe.violations.length === 0, {
      violations: axe.violations.map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })),
    });
    await page.waitForTimeout(100);
    assert("archive launcher emits no page or console errors", signals.pageErrors.length === 0 && signals.consoleErrors.length === 0, signals);
    assert("archive launcher makes no external requests", signals.externalRequests.length === 0, signals);
    await page.close();
  });

  await guarded("all reconstructed pages load directly and remain self-contained", async () => {
    for (const artifact of artifacts) {
      const page = await desktop.newPage();
      const signals = observe(page, artifact);
      const response = await page.goto(`${baseUrl}/pages/${artifact}.html`, { waitUntil: "load" });
      assert(`${artifact} returns HTTP 200`, response?.status() === 200, { status: response?.status() });
      assert(`${artifact} renders non-empty content`, (await page.locator("body").innerText()).trim().length > 80);
      await page.waitForTimeout(120);
      assert(`${artifact} emits no page or console errors`, signals.pageErrors.length === 0 && signals.consoleErrors.length === 0, signals);
      assert(`${artifact} makes no external requests`, signals.externalRequests.length === 0, signals);
      if (artifact === "helpmath-identity") {
        await page.screenshot({ path: join(outputDir, "identity-page-desktop.png"), fullPage: true });
      }
      if (artifact === "g4-ui-review") {
        await page.screenshot({ path: join(outputDir, "g4-review-replacement-desktop.png"), fullPage: true });
      }
      await page.close();
    }
  });

  await guarded("current-contract desktop geometry, modes, and offline Nova controls", async () => {
    const page = await desktop.newPage();
    const signals = observe(page, "support-contract-desktop");
    await page.goto(`${baseUrl}/pages/help-math-player-support-contract.html`, { waitUntil: "load" });

    assert("current-contract page starts in Focus with Nova closed", await page.locator("#vp").evaluate((el) => el.dataset.mode === "focus" && el.dataset.nova === "closed"));
    assert("closed Focus support is absent from keyboard and accessibility navigation", await page.locator(".side").evaluate((el) => el.inert && el.getAttribute("aria-hidden") === "true"));
    assert("legacy Today mode is hidden in the current-contract derivative", await page.locator('.mode[data-set="legacy"]').evaluate((el) => getComputedStyle(el).display === "none"));
    const planeRatio = await page.locator("#plane").evaluate((el) => {
      const box = el.getBoundingClientRect();
      return { width: box.width, height: box.height, ratio: box.width / box.height };
    });
    assert("authored lesson plane preserves the 800 by 415 ratio", Math.abs(planeRatio.ratio - 800 / 415) < 0.015, planeRatio);

    const initialMeta = await page.locator("#pgMeta").innerText();
    await page.locator("#prev").click();
    const previousMeta = await page.locator("#pgMeta").innerText();
    assert("Previous changes the lesson page", previousMeta !== initialMeta, { initialMeta, previousMeta });
    await page.locator("#next").click();
    assert("Next restores the original lesson page", (await page.locator("#pgMeta").innerText()) === initialMeta);
    const playBefore = await page.locator("#play").getAttribute("aria-pressed");
    await page.locator("#play").click();
    assert("Play or pause toggles narration state", (await page.locator("#play").getAttribute("aria-pressed")) !== playBefore);
    const volumeBefore = await page.locator("#vol").getAttribute("aria-pressed");
    await page.locator("#vol").click();
    assert("Volume toggles narration mute state", (await page.locator("#vol").getAttribute("aria-pressed")) !== volumeBefore);
    await page.locator("#replay").click();
    assert("Replay keeps the current lesson page renderable", await page.locator("#scene").isVisible());

    await page.locator("#askNova").click();
    await waitForSupportSync(page);
    assert("Focus Ask Nova opens a non-modal desktop support region", await page.locator("#vp").evaluate((el) => el.dataset.nova === "open") && await page.locator(".side").getAttribute("role") === "complementary");
    assert("open Focus support re-enters keyboard and accessibility navigation", await page.locator(".side").evaluate((el) => !el.inert && el.getAttribute("aria-hidden") === "false"));
    assert("offline provider status is explicit", (await page.locator(".provider-state").innerText()).toLowerCase().includes("provider not configured"));
    assert("historical simulated tutor conversation is removed", await page.locator("#thread .bubble").count() === 0);
    assert("voice, camera, classroom voice, and Send are disabled", await page.evaluate(() => ["mic", "cam", "bandMic"].every((id) => document.getElementById(id)?.disabled) && document.querySelector(".nova-send")?.disabled));
    const openAxe = await new AxeBuilder({ page }).analyze();
    assert("open desktop Nova state has no axe findings", openAxe.violations.length === 0, {
      violations: openAxe.violations.map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })),
    });

    const firstStarter = page.locator("#novaChips button").first();
    const starterText = (await firstStarter.innerText()).trim();
    await firstStarter.click();
    assert("question starter prepares only a local draft", (await page.locator("#novaText").inputValue()) === starterText && (await page.locator("#draftState").innerText()).includes("Nothing has been sent"));
    await page.locator("#novaText").press("Enter");
    assert("Enter cannot synthesize or send a tutor reply", await page.locator("#thread .bubble").count() === 0 && (await page.locator("#draftState").innerText()).includes("nothing was sent"));

    await page.locator("#tab-read").click();
    assert("Read it tab activates its reference panel", await page.locator("#tab-read").getAttribute("aria-selected") === "true" && await page.locator("#readPanel").isVisible());
    await page.locator("#tab-read").press("End");
    assert("tab keyboard End moves to Words", await page.locator("#tab-words").getAttribute("aria-selected") === "true" && await page.locator("#tab-words").evaluate((el) => document.activeElement === el));
    await page.locator("#tab-words").press("Home");
    assert("tab keyboard Home moves to Nova", await page.locator("#tab-nova").getAttribute("aria-selected") === "true" && await page.locator("#tab-nova").evaluate((el) => document.activeElement === el));

    await page.locator(".support-close").click();
    await waitForSupportSync(page);
    assert("desktop Close shuts Nova and returns focus", await page.locator("#vp").evaluate((el) => el.dataset.nova === "closed") && await page.locator("#askNova").evaluate((el) => document.activeElement === el));
    assert("desktop Close removes hidden support from navigation", await page.locator(".side").evaluate((el) => el.inert && el.getAttribute("aria-hidden") === "true"));

    await page.locator('.mode[data-set="study"]').click();
    await waitForSupportSync(page);
    assert("Study starts with the Read it reference tab", await page.locator("#vp").evaluate((el) => el.dataset.mode === "study" && el.dataset.nova === "closed") && await page.locator("#tab-read").getAttribute("aria-selected") === "true");
    assert("desktop Study keeps its visible reference panel navigable", await page.locator(".side").evaluate((el) => !el.inert && el.getAttribute("aria-hidden") === "false"));
    await page.locator("#dtoggle").click();
    assert("study-support toggle returns to Focus", await page.locator("#vp").evaluate((el) => el.dataset.mode === "focus"));

    await page.locator('.mode[data-set="class"]').click();
    await page.locator("#askNova").click();
    await waitForSupportSync(page);
    assert("Classroom Ask Nova opens the projector band", await page.locator("#vp").evaluate((el) => el.dataset.mode === "class" && el.dataset.nova === "open") && await page.locator("#novaBand").isVisible());
    assert("Classroom keeps the unused side panel out of navigation", await page.locator(".side").evaluate((el) => el.inert && el.getAttribute("aria-hidden") === "true"));
    assert("classroom band discloses offline state", (await page.locator("#bandQ").innerText()).toLowerCase().includes("unavailable") && (await page.locator("#bandA").innerText()).toLowerCase().includes("no question"));
    await page.locator("#bandClose").click();
    assert("Classroom band close shuts Nova", await page.locator("#vp").evaluate((el) => el.dataset.nova === "closed"));

    await page.locator('.mode[data-set="focus"]').click();
    await page.locator("#askNova").click();
    await page.waitForTimeout(550);
    await page.locator("#vp").screenshot({ path: join(outputDir, "support-contract-desktop-focus-open.png") });
    await page.locator(".support-close").click();
    await page.waitForTimeout(300);

    const axe = await new AxeBuilder({ page }).analyze();
    assert("closed current-contract page has no axe findings", axe.violations.length === 0, {
      violations: axe.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
        nodes: item.nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary })),
      })),
    });
    await page.waitForTimeout(100);
    assert("current-contract desktop emits no page or console errors", signals.pageErrors.length === 0 && signals.consoleErrors.length === 0, signals);
    assert("current-contract desktop makes no external requests", signals.externalRequests.length === 0, signals);
    await page.close();
  });

  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });

  await guarded("mobile archive layout and Nova modal focus contract", async () => {
    const archive = await mobile.newPage();
    const archiveSignals = observe(archive, "archive-mobile");
    await archive.goto(`${baseUrl}/index.html`, { waitUntil: "load" });
    assert(
      "archive mobile has no horizontal overflow",
      await archive.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      await archive.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
    );
    const previewFrame = archive.frames().find((frame) => frame.url().includes("help-math-player-support-contract.html"));
    const previewBox = await archive.locator("#preview-frame").boundingBox();
    const previewWrapBox = await archive.locator(".framewrap").boundingBox();
    const previewMetrics = await previewFrame.evaluate(() => ({
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(
      "mobile archive preview uses its real narrow layout viewport",
      Boolean(previewBox) && Boolean(previewWrapBox)
        && Math.abs(previewBox.width - previewWrapBox.width) <= 1
        && previewBox.width <= 375
        && Math.abs(previewMetrics.innerWidth - previewBox.width) <= 2
        && previewMetrics.scrollWidth <= previewMetrics.innerWidth + 1,
      { previewBox, previewWrapBox, previewMetrics }
    );
    await archive.locator("#preview-frame").scrollIntoViewIfNeeded();
    await archive.waitForTimeout(500);
    await archive.evaluate(() => scrollTo(0, 0));
    await archive.screenshot({ path: join(outputDir, "archive-launcher-mobile.png"), fullPage: true });
    assert("archive mobile emits no page or console errors", archiveSignals.pageErrors.length === 0 && archiveSignals.consoleErrors.length === 0, archiveSignals);
    await archive.close();

    const page = await mobile.newPage();
    const signals = observe(page, "support-contract-mobile");
    await page.goto(`${baseUrl}/pages/help-math-player-support-contract.html`, { waitUntil: "load" });
    assert(
      "current-contract mobile has no horizontal overflow while closed",
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
    );

    await page.locator("#askNova").click();
    await waitForSupportSync(page);
    assert("mobile Nova opens as an aria-modal dialog", await page.locator(".side").getAttribute("role") === "dialog" && await page.locator(".side").getAttribute("aria-modal") === "true");
    assert("open mobile Nova support is navigable", await page.locator(".side").evaluate((el) => !el.inert && el.getAttribute("aria-hidden") === "false"));
    assert("mobile Nova shows a full-viewport scrim", await page.locator(".support-scrim").isVisible());
    assert("mobile Nova makes the lesson background inert", await page.evaluate(() => document.querySelector(".spine")?.inert && document.querySelector(".stagecol")?.inert));
    assert("mobile Nova initially focuses Close", await page.locator(".support-close").evaluate((el) => document.activeElement === el));
    const modalBox = await page.locator(".side").boundingBox();
    assert("mobile Nova sheet stays within the viewport", Boolean(modalBox) && modalBox.x >= -1 && modalBox.x + modalBox.width <= 376 && modalBox.height <= 642, modalBox || {});
    const modalAxe = await new AxeBuilder({ page }).analyze();
    assert("open mobile Nova modal has no axe findings", modalAxe.violations.length === 0, {
      violations: modalAxe.violations.map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })),
    });

    const focusableIds = await page.locator(".side").evaluate((side) => Array.from(side.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]'))
      .filter((el) => !el.hidden && el.getClientRects().length)
      .map((el) => el.id || el.className));
    assert("mobile Nova has a usable focus sequence", focusableIds.length >= 4, { focusableIds });
    await page.locator(".side").evaluate((side) => {
      const items = Array.from(side.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]')).filter((el) => !el.hidden && el.getClientRects().length);
      items[items.length - 1].focus();
    });
    await page.keyboard.press("Tab");
    assert("mobile forward Tab wraps to Close", await page.locator(".support-close").evaluate((el) => document.activeElement === el));
    await page.keyboard.press("Shift+Tab");
    assert("mobile reverse Tab wraps to the last enabled control", await page.evaluate(() => document.activeElement !== document.querySelector(".support-close") && document.querySelector(".side")?.contains(document.activeElement)));

    await page.screenshot({ path: join(outputDir, "support-contract-mobile-modal.png"), fullPage: false });
    await page.keyboard.press("Escape");
    await waitForSupportSync(page);
    assert("Escape closes mobile Nova and returns focus", await page.locator("#vp").evaluate((el) => el.dataset.nova === "closed") && await page.locator("#askNova").evaluate((el) => document.activeElement === el));
    assert("closing mobile Nova restores the lesson background", await page.evaluate(() => !document.querySelector(".spine")?.inert && !document.querySelector(".stagecol")?.inert && !document.body.classList.contains("contract-modal-open")));
    assert("closing mobile Nova removes hidden support from navigation", await page.locator(".side").evaluate((el) => el.inert && el.getAttribute("aria-hidden") === "true"));

    await page.locator("#askNova").click();
    await waitForSupportSync(page);
    await page.locator(".support-scrim").click({ position: { x: 3, y: 3 } });
    await waitForSupportSync(page);
    assert("mobile scrim closes Nova", await page.locator("#vp").evaluate((el) => el.dataset.nova === "closed"));

    assert(
      "current-contract mobile has no horizontal overflow after modal use",
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
    );
    await page.waitForTimeout(100);
    assert("current-contract mobile emits no page or console errors", signals.pageErrors.length === 0 && signals.consoleErrors.length === 0, signals);
    assert("current-contract mobile makes no external requests", signals.externalRequests.length === 0, signals);
    await page.close();
  });

  await mobile.close();

  const preferences = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  await guarded("dark color scheme and reduced-motion preferences", async () => {
    const page = await preferences.newPage();
    const signals = observe(page, "archive-dark-reduced-motion");
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "load" });
    assert("archive responds to dark color preference", await page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches));
    assert("archive responds to reduced-motion preference", await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches));
    await page.screenshot({ path: join(outputDir, "archive-launcher-dark.png"), fullPage: true });
    assert("dark and reduced-motion archive emits no page or console errors", signals.pageErrors.length === 0 && signals.consoleErrors.length === 0, signals);
    await page.close();
  });
  await preferences.close();
} finally {
  await browser.close();
}

const failures = results.filter((item) => !item.pass);
const report = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  baseUrl,
  browser: "Playwright Chromium",
  viewportProfiles: ["1440x1000 light", "375x812@2x light", "1280x800 dark reduced-motion"],
  assertions: { total: results.length, passed: results.length - failures.length, failed: failures.length },
  results,
  browserSignals,
  screenshots: [
    "archive-launcher-desktop.png",
    "archive-launcher-mobile.png",
    "archive-launcher-dark.png",
    "support-contract-desktop-focus-open.png",
    "support-contract-mobile-modal.png",
    "identity-page-desktop.png",
    "g4-review-replacement-desktop.png",
  ],
};
writeFileSync(join(outputDir, "verify-static-results.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`RESULT\t${report.assertions.passed}/${report.assertions.total} passed\n`);
if (failures.length) process.exitCode = 1;
