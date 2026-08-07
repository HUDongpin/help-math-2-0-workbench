#!/usr/bin/env node

import AxeBuilder from "@axe-core/playwright";
import {createHash} from "node:crypto";
import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const schemaVersion = 1;
const productReportType = "g4-l3-current-javascript-lesson-product-qa";
const controlledPreviewReportType = "g4-l3-controlled-ceo-preview-qa";
const controlledPreviewCopy =
  "Controlled CEO Preview — current JavaScript candidate. Original-runtime full-frame comparison, human audio/visual review, Owner acceptance, strict completion, and public release are pending.";
// Next.js development mode treats `localhost` as its canonical loopback
// origin. Using 127.0.0.1 can leave client-side dynamic imports waiting after
// the dev server rejects the webpack HMR origin, even though the document
// itself returned 200. Keep the default reproducible while still allowing
// either loopback spelling through `--base-url`.
const defaultBaseUrl = "http://localhost:3213";
const defaultJsonOutput = path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa.json");
const defaultMarkdownOutput = path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa.md");
const defaultScreenshotRoot = path.join(projectRoot, "output", "playwright", "g4-l3-current-javascript-product-qa");
const controlledPreviewJsonOutput = path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-qa.json");
const controlledPreviewMarkdownOutput = path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-qa.md");
const controlledPreviewScreenshotRoot = path.join(projectRoot, "output", "playwright", "g4-l3-controlled-ceo-preview-qa");
const v31ProductReportType = "g4-l3-current-javascript-lesson-product-qa-v3-1";
const v31ControlledPreviewReportType = "g4-l3-controlled-ceo-preview-v3-1-qa";
const v32ProductReportType = "g4-l3-current-javascript-lesson-product-qa-v3-2";
const v32ControlledPreviewReportType = "g4-l3-controlled-ceo-preview-v3-2-qa";
const v33ProductReportType = "g4-l3-current-javascript-lesson-product-qa-v3-3";
const v33ControlledPreviewReportType = "g4-l3-controlled-ceo-preview-v3-3-qa";
const v33R2ProductReportType = "g4-l3-current-javascript-lesson-product-qa-v3-3-r2";
const v33R2ControlledPreviewReportType = "g4-l3-controlled-ceo-preview-v3-3-r2-qa";
const QA_ARTIFACT_VARIANTS = Object.freeze({
  v3: Object.freeze({
    id: "v3",
    version: "v3",
    defaultBaseUrl,
    product: Object.freeze({
      reportType: productReportType,
      title: "G4 L3 current-JavaScript lesson product QA",
      jsonOutput: defaultJsonOutput,
      markdownOutput: defaultMarkdownOutput,
      screenshotRoot: defaultScreenshotRoot,
    }),
    controlled: Object.freeze({
      reportType: controlledPreviewReportType,
      title: "G4 L3 Controlled CEO Preview QA",
      jsonOutput: controlledPreviewJsonOutput,
      markdownOutput: controlledPreviewMarkdownOutput,
      screenshotRoot: controlledPreviewScreenshotRoot,
    }),
    writeProductAliasByDefault: true,
  }),
  "v3-1": Object.freeze({
    id: "v3-1",
    version: "v3.1",
    defaultBaseUrl: "http://127.0.0.1:3217",
    product: Object.freeze({
      reportType: v31ProductReportType,
      title: "G4 L3 current-JavaScript lesson product QA v3.1",
      jsonOutput: path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa-v3-1.json"),
      markdownOutput: path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa-v3-1.md"),
      screenshotRoot: path.join(projectRoot, "output", "playwright", "g4-l3-current-javascript-product-qa-v3-1"),
    }),
    controlled: Object.freeze({
      reportType: v31ControlledPreviewReportType,
      title: "G4 L3 Controlled CEO Preview v3.1 QA",
      jsonOutput: path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-v3-1-qa.json"),
      markdownOutput: path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-v3-1-qa.md"),
      screenshotRoot: path.join(projectRoot, "output", "playwright", "g4-l3-controlled-ceo-preview-v3-1-qa"),
    }),
    writeProductAliasByDefault: false,
  }),
  "v3-2": Object.freeze({
    id: "v3-2",
    version: "v3.2",
    defaultBaseUrl: "http://127.0.0.1:3218",
    product: Object.freeze({
      reportType: v32ProductReportType,
      title: "G4 L3 current-JavaScript lesson product QA v3.2",
      jsonOutput: path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa-v3-2.json"),
      markdownOutput: path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa-v3-2.md"),
      screenshotRoot: path.join(projectRoot, "output", "playwright", "g4-l3-current-javascript-product-qa-v3-2"),
    }),
    controlled: Object.freeze({
      reportType: v32ControlledPreviewReportType,
      title: "G4 L3 Controlled CEO Preview v3.2 QA",
      jsonOutput: path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-v3-2-qa.json"),
      markdownOutput: path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-v3-2-qa.md"),
      screenshotRoot: path.join(projectRoot, "output", "playwright", "g4-l3-controlled-ceo-preview-v3-2-qa"),
    }),
    writeProductAliasByDefault: false,
  }),
  "v3-3": Object.freeze({
    id: "v3-3",
    version: "v3.3",
    defaultBaseUrl: "http://127.0.0.1:3219",
    product: Object.freeze({
      reportType: v33ProductReportType,
      title: "G4 L3 current-JavaScript lesson product QA v3.3",
      jsonOutput: path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa-v3-3.json"),
      markdownOutput: path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa-v3-3.md"),
      screenshotRoot: path.join(projectRoot, "output", "playwright", "g4-l3-current-javascript-product-qa-v3-3"),
    }),
    controlled: Object.freeze({
      reportType: v33ControlledPreviewReportType,
      title: "G4 L3 Controlled CEO Preview v3.3 QA",
      jsonOutput: path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-v3-3-qa.json"),
      markdownOutput: path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-v3-3-qa.md"),
      screenshotRoot: path.join(projectRoot, "output", "playwright", "g4-l3-controlled-ceo-preview-v3-3-qa"),
    }),
    writeProductAliasByDefault: false,
  }),
  "v3-3-r2": Object.freeze({
    id: "v3-3-r2",
    version: "v3.3-r2",
    defaultBaseUrl: "http://127.0.0.1:3219",
    product: Object.freeze({
      reportType: v33R2ProductReportType,
      title: "G4 L3 current-JavaScript lesson product QA v3.3-r2",
      jsonOutput: path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa-v3-3-r2.json"),
      markdownOutput: path.join(projectRoot, "reports", "g4-l3-current-javascript-product-qa-v3-3-r2.md"),
      screenshotRoot: path.join(projectRoot, "output", "playwright", "g4-l3-current-javascript-product-qa-v3-3-r2"),
    }),
    controlled: Object.freeze({
      reportType: v33R2ControlledPreviewReportType,
      title: "G4 L3 Controlled CEO Preview v3.3-r2 QA",
      jsonOutput: path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-v3-3-r2-qa.json"),
      markdownOutput: path.join(projectRoot, "reports", "g4-l3-controlled-ceo-preview-v3-3-r2-qa.md"),
      screenshotRoot: path.join(projectRoot, "output", "playwright", "g4-l3-controlled-ceo-preview-v3-3-r2-qa"),
    }),
    writeProductAliasByDefault: false,
  }),
});
const sha256Pattern = /^[a-f0-9]{64}$/;

const INPUT_PATHS = Object.freeze({
  productQaGenerator: "scripts/qa-g4-l3-current-js-product.mjs",
  rootPackage: "package.json",
  webPackage: "apps/web/package.json",
  packageLock: "package-lock.json",
  currentJavascriptProgress: "reports/g4-l3-current-javascript-progress.json",
  lessonProductContract: "reports/g4-l3-lesson-product-navigation-contract.json",
  sourceXml: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index.xml",
  lessonNavigationData: "apps/web/lib/g4-l3-lesson-navigation.ts",
  lessonNavigationComponent: "apps/web/components/g4-l3-lesson-navigation.tsx",
  wholeLessonPlayer: "apps/web/components/g4-l3-whole-lesson-player.tsx",
  wholeLessonShell: "apps/web/components/legacy-responsive-lesson-shell.tsx",
  wholeLessonDescriptor: "apps/web/lib/g4-l3-whole-lesson-player-descriptor.ts",
  wholeLessonState: "apps/web/lib/g4-l3-whole-lesson.ts",
  controlledPreviewPolicy: "apps/web/lib/g4-l3-controlled-ceo-preview.ts",
  controlledPreviewBoundary: "apps/web/components/g4-l3-controlled-ceo-preview-boundary.tsx",
  courseRoute: "apps/web/app/[locale]/courses/[grade]/[lesson]/page.tsx",
  animationRoute: "apps/web/app/[locale]/animations/[animationId]/page.tsx",
  proxy: "apps/web/proxy.ts",
  animationRuntime: "apps/web/components/animation-runtime.tsx",
  webGlobalCss: "apps/web/app/globals.css",
  prototypeRegistry: "packages/demos/prototype-registry.json",
  generatedRegistry: "packages/demos/src/registry.generated.ts",
  prototypeManifest: "packages/demos/src/prototype-manifest.ts",
  g4L3ShellTimeline: "packages/demos/src/timelines/shell-course-g04-l03-index-local.ts",
  g4L3ShellModule: "packages/demos/src/modules/shell-course-g04-l03-index-local.tsx",
  completionLedger: "catalog/completion-ledger.json",
  lessonReleaseLedger: "catalog/lesson-release-ledger.json",
});

export const AUTHORITY_CLAIMS = Object.freeze({
  authoritativeOriginalRuntimeBaseline: false,
  naturalOriginalRuntimeTraversal: false,
  originalNavigationParity: false,
  interactionBranchParity: false,
  scoringParity: false,
  bilingualVisualParity: false,
  audioParity: false,
  audioListeningAcceptance: false,
  fullFrameCoverage: false,
  rmseAcceptance: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictMigrationCompletion: false,
  atomicLessonPublication: false,
});

export const QA_PROFILES = Object.freeze({
  desktopEnglish: Object.freeze({locale: "en", viewport: Object.freeze({width: 1280, height: 900}), reducedMotion: "no-preference"}),
  mobileSpanishReduced: Object.freeze({locale: "es", viewport: Object.freeze({width: 390, height: 844}), reducedMotion: "reduce"}),
  desktopEnglishReplay: Object.freeze({locale: "en", viewport: Object.freeze({width: 1280, height: 900}), reducedMotion: "no-preference"}),
});

const DEV_OVERLAY_CSS = [
  "script[data-nextjs-dev-overlay='true']",
  "nextjs-portal",
  "{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
].join("");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function relative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function absolute(projectPath) {
  const resolved = path.resolve(projectRoot, projectPath);
  const rel = path.relative(projectRoot, resolved);
  invariant(rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel), `Path escapes project: ${projectPath}`);
  return resolved;
}

async function bindFile(projectPath) {
  const bytes = await readFile(absolute(projectPath));
  return {path: projectPath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function readJson(projectPath) {
  return JSON.parse(await readFile(absolute(projectPath), "utf8"));
}

export function validateLocalBaseUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid --base-url: ${value}`);
  }
  invariant(parsed.protocol === "http:", "Product QA requires a local HTTP URL");
  invariant(["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname), "Product QA may target only a loopback host");
  invariant(parsed.username === "" && parsed.password === "", "Product QA URL must not contain credentials");
  invariant(parsed.pathname === "/" && parsed.search === "" && parsed.hash === "", "Product QA base URL must not include a path, query, or fragment");
  return parsed.origin;
}

export function buildCourseUrl(locale) {
  invariant(locale === "en" || locale === "es", `Unsupported locale: ${locale}`);
  return `${locale === "es" ? "/es" : ""}/courses/4/3`;
}

export function buildAnimationUrl(animationId, {locale = "en", fixedFrame = false} = {}) {
  invariant(/^course-g04-l03-[a-z0-9-]+$/.test(animationId), `Unsafe G4 L3 animation id: ${animationId}`);
  invariant(locale === "en" || locale === "es", `Unsupported locale: ${locale}`);
  const route = `${locale === "es" ? "/es" : ""}/animations/${animationId}`;
  const query = new URLSearchParams({auditContext: "g4-l3-lesson", lang: locale, seed: "0"});
  if (fixedFrame) query.set("frame", "1");
  return `${route}?${query}`;
}

export function buildShellUrl(locale) {
  invariant(locale === "en" || locale === "es", `Unsupported locale: ${locale}`);
  const query = new URLSearchParams({auditContext: "g4-l3-lesson", lang: locale, seed: "0", frame: "50", scenario: "lesson-map-audit"});
  return `${locale === "es" ? "/es" : ""}/animations/shell-course-g04-l03-index-local?${query}`;
}

export function parseArguments(argv) {
  const options = {
    artifactVersion: "v3",
    baseUrl: null,
    jsonOutput: null,
    markdownOutput: null,
    screenshotRoot: null,
    check: false,
    controlledCeoPreview: false,
    writeProductAlias: false,
  };
  let baseUrlExplicit = false;
  let jsonOutputExplicit = false;
  let markdownOutputExplicit = false;
  let screenshotRootExplicit = false;
  let noProductAlias = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--controlled-ceo-preview") options.controlledCeoPreview = true;
    else if (value === "--no-product-alias") noProductAlias = true;
    else if (["--artifact-version", "--base-url", "--json-output", "--markdown-output", "--screenshot-root"].includes(value)) {
      const next = argv[index + 1];
      invariant(next && !next.startsWith("--"), `${value} requires a value`);
      index += 1;
      if (value === "--artifact-version") options.artifactVersion = next;
      if (value === "--base-url") {
        options.baseUrl = next;
        baseUrlExplicit = true;
      }
      if (value === "--json-output") {
        options.jsonOutput = path.resolve(projectRoot, next);
        jsonOutputExplicit = true;
      }
      if (value === "--markdown-output") {
        options.markdownOutput = path.resolve(projectRoot, next);
        markdownOutputExplicit = true;
      }
      if (value === "--screenshot-root") {
        options.screenshotRoot = path.resolve(projectRoot, next);
        screenshotRootExplicit = true;
      }
    } else throw new Error(`Unknown option: ${value}`);
  }
  const artifactVariant = QA_ARTIFACT_VARIANTS[options.artifactVersion];
  invariant(artifactVariant, `Unsupported --artifact-version: ${options.artifactVersion}`);
  const artifact = options.controlledCeoPreview
    ? artifactVariant.controlled
    : artifactVariant.product;
  if (!baseUrlExplicit) options.baseUrl = artifactVariant.defaultBaseUrl;
  if (!jsonOutputExplicit) options.jsonOutput = artifact.jsonOutput;
  if (!markdownOutputExplicit) options.markdownOutput = artifact.markdownOutput;
  if (!screenshotRootExplicit) options.screenshotRoot = artifact.screenshotRoot;
  options.writeProductAlias = options.controlledCeoPreview
    && artifactVariant.writeProductAliasByDefault
    && !noProductAlias;
  options.baseUrl = validateLocalBaseUrl(options.baseUrl);
  return options;
}

async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export async function assertV33GenerationTargetsAbsent(options) {
  if (options.check) return;
  invariant(
    options.artifactVersion !== "v3-3",
    "v3.3 QA generation is frozen after its immutable attempt; use --check or generate the v3-3-r2 successor",
  );
  if (options.artifactVersion !== "v3-3-r2") return;
  const targets = [
    options.jsonOutput,
    options.markdownOutput,
    options.screenshotRoot,
  ];
  const existing = [];
  for (const target of targets) {
    if (await pathExists(target)) existing.push(target);
  }
  invariant(
    existing.length === 0,
    `v3.3-r2 QA generation is immutable; refusing to overwrite existing artifact target(s): ${existing.join(", ")}`,
  );
}

async function prepareScreenshotRoot(options) {
  invariant(
    options.artifactVersion !== "v3-3",
    "v3.3 QA screenshot root is frozen and may not be prepared or replaced",
  );
  if (options.artifactVersion === "v3-3-r2") {
    await mkdir(path.dirname(options.screenshotRoot), {recursive: true});
    await mkdir(options.screenshotRoot);
    return;
  }
  await mkdir(options.screenshotRoot, {recursive: true});
}

async function writeGeneratedArtifact(target, content, artifactVersion) {
  await mkdir(path.dirname(target), {recursive: true});
  invariant(
    artifactVersion !== "v3-3",
    "v3.3 QA artifacts are frozen and may not be written",
  );
  if (artifactVersion === "v3-3-r2") {
    await writeFile(target, content, {flag: "wx"});
    return;
  }
  await writeFile(target, content);
}

function makeMonitor(page, baseUrl) {
  const events = {consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [], ignoredAbortedRscPrefetches: []};
  page.on("console", (message) => {
    if (message.type() === "error") events.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => events.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = request.url();
    const error = request.failure()?.errorText ?? "unknown";
    if (!url.startsWith(baseUrl)) return;
    const parsed = new URL(url);
    if (error === "net::ERR_ABORTED" && parsed.searchParams.has("_rsc")) {
      events.ignoredAbortedRscPrefetches.push({url, error});
      return;
    }
    events.failedRequests.push({url, error});
  });
  page.on("response", (response) => {
    if (response.url().startsWith(baseUrl) && response.status() >= 400) events.badResponses.push({url: response.url(), status: response.status()});
  });
  return events;
}

function check(failures, condition, message) {
  if (!condition) failures.push(message);
}

export function replayCounterTransition(previousReplay, observedReplay, expectedReplay) {
  const countersAreIntegers = [previousReplay, observedReplay, expectedReplay]
    .every((value) => Number.isInteger(value) && value >= 0);
  return {
    previousReplay,
    observedReplay,
    expectedReplay,
    countersAreIntegers,
    advanced: countersAreIntegers && observedReplay > previousReplay,
    exactlyOnce: countersAreIntegers
      && expectedReplay === previousReplay + 1
      && observedReplay === expectedReplay,
  };
}

function monitorFailures(events) {
  return [
    ...events.consoleErrors.map((message) => `console error: ${message}`),
    ...events.pageErrors.map((message) => `page error: ${message}`),
    ...events.failedRequests.map(({url, error}) => `request failed: ${url} (${error})`),
    ...events.badResponses.map(({url, status}) => `HTTP ${status}: ${url}`),
  ];
}

async function openObservedPage(context, baseUrl, route, readySelector) {
  const page = await context.newPage();
  const events = makeMonitor(page, baseUrl);
  const response = await page.goto(`${baseUrl}${route}`, {waitUntil: "domcontentloaded", timeout: 60_000});
  await page.locator(readySelector).first().waitFor({state: "visible", timeout: 60_000});
  await page.addStyleTag({content: DEV_OVERLAY_CSS});
  await page.waitForTimeout(80);
  return {page, events, response};
}

async function inspectControlledPreviewBoundary(page, response, enabled) {
  if (!enabled) return {observation: null, failures: []};

  const boundary = page.locator('[data-controlled-ceo-preview="g4-l3"]');
  const count = await boundary.count();
  const observation = {
    count,
    visible: count === 1 ? await boundary.isVisible() : false,
    copy: count === 1 ? await boundary.locator("strong").innerText() : null,
    attributes: count === 1 ? await boundary.evaluate((element) => ({
      currentJavascriptCandidate: element.getAttribute("data-current-javascript-candidate"),
      originalRuntimeFullFrameComparison: element.getAttribute("data-original-runtime-full-frame-comparison"),
      humanAudioVisualReview: element.getAttribute("data-human-audio-visual-review"),
      ownerAcceptance: element.getAttribute("data-owner-acceptance"),
      strictCompletion: element.getAttribute("data-strict-completion"),
      publicRelease: element.getAttribute("data-public-release"),
      strictCompleteMembers: element.getAttribute("data-strict-complete-members"),
      releaseMembers: element.getAttribute("data-release-members"),
    })) : null,
    response: {
      cacheControl: response ? await response.headerValue("cache-control") : null,
      xRobotsTag: response ? await response.headerValue("x-robots-tag") : null,
      xHelpmathControlledPreview: response ? await response.headerValue("x-helpmath-controlled-preview") : null,
      vary: response ? await response.headerValue("vary") : null,
    },
  };
  const failures = [];
  check(failures, observation.count === 1, `controlled CEO preview boundary count is ${observation.count}`);
  check(failures, observation.visible, "controlled CEO preview boundary is not visible");
  check(failures, observation.copy === controlledPreviewCopy, "controlled CEO preview copy drifted");
  check(failures, observation.attributes?.currentJavascriptCandidate === "true", "current JavaScript candidate boundary drifted");
  check(failures, observation.attributes?.originalRuntimeFullFrameComparison === "pending", "original-runtime full-frame boundary was promoted");
  check(failures, observation.attributes?.humanAudioVisualReview === "pending", "human audio/visual review boundary was promoted");
  check(failures, observation.attributes?.ownerAcceptance === "pending", "Owner acceptance boundary was promoted");
  check(failures, observation.attributes?.strictCompletion === "false", "strict completion boundary was promoted");
  check(failures, observation.attributes?.publicRelease === "false", "public release boundary was promoted");
  check(failures, observation.attributes?.strictCompleteMembers === "0", "strict member count is not zero");
  check(failures, observation.attributes?.releaseMembers === "40", "release member count is not 40");
  check(failures, observation.response.cacheControl === "private, no-store, max-age=0", `controlled preview cache policy drifted: ${observation.response.cacheControl}`);
  check(failures, observation.response.xRobotsTag === "noindex, nofollow, noarchive, noimageindex", `controlled preview robots policy drifted: ${observation.response.xRobotsTag}`);
  check(failures, observation.response.xHelpmathControlledPreview === "g4-l3-local-only", `controlled preview identity header drifted: ${observation.response.xHelpmathControlledPreview}`);
  return {observation, failures};
}

async function axeBlockingViolations(page) {
  const results = await new AxeBuilder({page})
    .include("main#main-content")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => ({target: node.target, failureSummary: node.failureSummary ?? null})),
    }));
}

async function layoutObservation(page, selector) {
  return page.locator(selector).first().evaluate((element) => {
    const rectangle = element.getBoundingClientRect();
    const documentElement = document.documentElement;
    return {
      viewportWidth: window.innerWidth,
      documentClientWidth: documentElement.clientWidth,
      documentScrollWidth: documentElement.scrollWidth,
      elementLeft: rectangle.left,
      elementRight: rectangle.right,
      elementWidth: rectangle.width,
      horizontalOverflowPx: Math.max(0, documentElement.scrollWidth - documentElement.clientWidth),
    };
  });
}

async function screenshotBinding(page, screenshotRoot, name, options = {}) {
  const target = path.join(screenshotRoot, name);
  await mkdir(path.dirname(target), {recursive: true});
  if (options.selector) await page.locator(options.selector).first().screenshot({path: target});
  else await page.screenshot({path: target, fullPage: options.fullPage ?? true});
  const bytes = await readFile(target);
  return {path: relative(target), bytes: bytes.length, sha256: sha256(bytes)};
}

function expectedLocalePrefix(locale) {
  return locale === "es" ? "/es" : "";
}

function previousAnimationId(pageRecord) {
  return pageRecord.previousAnimationId ?? pageRecord.navigation?.previousAnimationId ?? null;
}

function nextAnimationId(pageRecord) {
  return pageRecord.nextAnimationId ?? pageRecord.navigation?.nextAnimationId ?? null;
}

export function validateWholeLessonPlayerObservation(observation, contract, locale) {
  const failures = [];
  const expectedPageIds = contract.pages.map(({animationId}) => animationId);
  const observedPageIds = observation.pagePickerOptions.map(({animationId}) => animationId);
  const expectedSectionCodes = contract.sections.map(({code}) => code);
  const expectedMapRows = contract.pages.map((page) => ({
    animationId: page.animationId,
    ordinal: page.globalPageOrdinal,
    sectionCode: page.sectionCode,
    spanishTitleStatus: page.labels.pageSpanish.status,
  }));

  check(failures, observation.lessonPlayer === "g4-l3-whole-lesson-mvp", `unexpected whole-lesson player identity: ${observation.lessonPlayer}`);
  check(failures, observation.observationKind === "live-whole-lesson-player", `unexpected whole-lesson observation kind: ${observation.observationKind}`);
  check(failures, observation.candidateMode === "true", "whole-lesson player is not explicitly candidate-only");
  check(failures, observation.progressKind === "learner-session", `whole-lesson progress kind drifted: ${observation.progressKind}`);
  check(failures, observation.progressStorage === "local-device-only", `whole-lesson progress storage drifted: ${observation.progressStorage}`);
  check(failures, observation.hydrated === "true", "whole-lesson player did not finish client hydration");
  check(failures, observation.language === locale, `whole-lesson language mismatch: ${observation.language}`);
  check(failures, observation.currentAnimationId === expectedPageIds[0], `whole-lesson initial animation mismatch: ${observation.currentAnimationId}`);
  check(failures, observation.currentPage === 1, `whole-lesson initial page is ${observation.currentPage}`);
  check(failures, observation.currentReplayCount === 0, `whole-lesson initial Replay count is ${observation.currentReplayCount}`);
  check(failures, observation.pagePickerValue === expectedPageIds[0], `whole-lesson picker initial value mismatch: ${observation.pagePickerValue}`);
  check(failures, observation.pagePickerOptions.length === 39, `whole-lesson page picker has ${observation.pagePickerOptions.length} options`);
  check(failures, JSON.stringify(observedPageIds) === JSON.stringify(expectedPageIds), "whole-lesson page picker order differs from the canonical 39-page contract");
  check(failures, observation.sectionCodes.length === 8, `whole-lesson section navigation has ${observation.sectionCodes.length} sections`);
  check(failures, JSON.stringify(observation.sectionCodes) === JSON.stringify(expectedSectionCodes), "whole-lesson section order differs from the canonical eight-section contract");
  check(failures, observation.mapRows.length === 39, `whole-lesson course map has ${observation.mapRows.length} rows`);
  check(failures, JSON.stringify(observation.mapRows) === JSON.stringify(expectedMapRows), "whole-lesson course map order or source identity differs from the canonical contract");
  check(failures, observation.presentation === "wide-functional-audit-candidate", `whole-lesson presentation drifted: ${observation.presentation}`);
  check(failures, observation.shellLayout === "help-math-course-shell-800x600-v1", `whole-lesson shell layout drifted: ${observation.shellLayout}`);
  check(failures, observation.shellVisualAuthority === "ffdec-static-structural-candidate", `whole-lesson shell authority drifted: ${observation.shellVisualAuthority}`);
  check(failures, observation.nativeCompositeStage === "800x600", `whole-lesson composite stage drifted: ${observation.nativeCompositeStage}`);
  check(failures, observation.authoredStage === "800x600", `whole-lesson authored stage drifted: ${observation.authoredStage}`);
  check(failures, Number.isFinite(observation.viewportFitWidth) && observation.viewportFitWidth > 0 && observation.viewportFitWidth <= 800, `whole-lesson viewport-fit width is invalid: ${observation.viewportFitWidth}`);
  check(failures, observation.runtime.shellCount === 1, `whole-lesson player has ${observation.runtime.shellCount} runtime shells`);
  check(failures, observation.runtime.stageCount === 1, `whole-lesson player has ${observation.runtime.stageCount} runtime stages`);
  check(failures, observation.runtime.animationId === expectedPageIds[0], `whole-lesson initial runtime animation mismatch: ${observation.runtime.animationId}`);
  check(failures, observation.runtime.module === expectedPageIds[0], `whole-lesson initial runtime module mismatch: ${observation.runtime.module}`);
  check(failures, observation.runtime.language === locale, `whole-lesson initial runtime language mismatch: ${observation.runtime.language}`);
  check(failures, observation.runtime.outputMode !== "empty", "whole-lesson initial runtime has no visible current-JavaScript output");
  check(failures, observation.runtime.forbiddenLegacyEmbedCount === 0, "whole-lesson initial runtime contains a legacy SWF embed");
  check(failures, observation.runtime.runtimeDomainErrorCount === 0, "whole-lesson initial runtime contains a renderer-domain error");
  return failures;
}

async function waitForWholeLessonPage(page, playerSelector, animationId, ordinal) {
  await page.locator(
    `${playerSelector}[data-current-animation-id="${animationId}"][data-current-page="${ordinal}"]`,
  ).waitFor({state: "visible", timeout: 60_000});
  await page.locator(
    `${playerSelector} .runtime-stage[data-animation-id="${animationId}"] > *`,
  ).first().waitFor({state: "visible", timeout: 60_000});
}

async function observeWholeLessonRuntime(page, playerSelector) {
  return page.locator(playerSelector).evaluate((element) => {
    const stages = [...element.querySelectorAll(".runtime-stage")];
    const shells = [...element.querySelectorAll(".runtime-shell")];
    const stage = stages[0] ?? null;
    return {
      animationId: element.getAttribute("data-current-animation-id"),
      currentPage: Number(element.getAttribute("data-current-page")),
      runtimeShellCount: shells.length,
      runtimeStageCount: stages.length,
      runtimeAnimationId: stage?.getAttribute("data-animation-id") ?? null,
      runtimeModule: stage?.getAttribute("data-animation-module") ?? null,
      primaryRuntimeCount: stages.filter((candidate) => {
        const rectangle = candidate.getBoundingClientRect();
        const style = getComputedStyle(candidate);
        return rectangle.width > 0
          && rectangle.height > 0
          && style.display !== "none"
          && style.visibility !== "hidden";
      }).length,
    };
  });
}

function exactPrimaryRuntime(observation, expectedAnimationId, expectedOrdinal) {
  return observation.animationId === expectedAnimationId
    && observation.currentPage === expectedOrdinal
    && observation.runtimeShellCount === 1
    && observation.runtimeStageCount === 1
    && observation.primaryRuntimeCount === 1
    && observation.runtimeAnimationId === expectedAnimationId
    && observation.runtimeModule === expectedAnimationId;
}

async function observeTerminalCompletion(page, playerSelector, lastAnimationId) {
  return page.locator(playerSelector).evaluate((element, animationId) => {
    const next = element.querySelector('[data-lesson-nav="action-next"]');
    const completion = element.querySelector(
      ".lesson-shell2__learning-actions button[aria-pressed]",
    );
    const lastMapRow = element.querySelector(
      `.lesson-shell2__map-content button[data-animation-id="${animationId}"]`,
    );
    const stages = [...element.querySelectorAll(".runtime-stage")];
    const stage = stages[0] ?? null;
    return {
      animationId: element.getAttribute("data-current-animation-id"),
      currentPage: Number(element.getAttribute("data-current-page")),
      nextDisabled: next instanceof HTMLButtonElement ? next.disabled : null,
      completionPressed: completion?.getAttribute("aria-pressed") ?? null,
      lastMapRowComplete: lastMapRow?.getAttribute("data-complete") ?? null,
      finishedNoticeCount: element.querySelectorAll(
        ".lesson-shell2__finished",
      ).length,
      finishedNoticeText:
        element.querySelector(".lesson-shell2__finished")?.textContent?.trim()
          ?? null,
      runtimeShellCount: element.querySelectorAll(".runtime-shell").length,
      runtimeStageCount: stages.length,
      runtimeAnimationId: stage?.getAttribute("data-animation-id") ?? null,
      primaryRuntimeCount: stages.filter((candidate) => {
        const rectangle = candidate.getBoundingClientRect();
        const style = getComputedStyle(candidate);
        return rectangle.width > 0
          && rectangle.height > 0
          && style.display !== "none"
          && style.visibility !== "hidden";
      }).length,
    };
  }, lastAnimationId);
}

function navigationExpectation(pageRecord, lessonPages, sections, locale) {
  const prefix = expectedLocalePrefix(locale);
  const pageById = new Map(lessonPages.map((item) => [item.animationId, item]));
  const previousId = previousAnimationId(pageRecord);
  const nextId = nextAnimationId(pageRecord);
  const previous = previousId ? pageById.get(previousId) : null;
  const next = nextId ? pageById.get(nextId) : null;
  return {
    mapHref: `${prefix}/courses/4/3`,
    previousHref: previous ? `${prefix}/animations/${previous.animationId}?auditContext=g4-l3-lesson` : null,
    nextHref: next ? `${prefix}/animations/${next.animationId}?auditContext=g4-l3-lesson` : null,
    sectionHrefs: sections.map((section) => `${prefix}/animations/${section.firstActiveAnimationId}?auditContext=g4-l3-lesson`),
  };
}

async function inspectLessonNavigation(page, pageRecord, lessonPages, sections, locale) {
  const nav = page.locator(".lesson-context-navigation");
  const observation = await nav.evaluate((element) => {
    const primary = element.querySelector(".lesson-context-navigation__primary");
    const adjacent = [...element.querySelector(".lesson-context-navigation__adjacent")?.children ?? []];
    const sectionLinks = [...element.querySelectorAll(".lesson-context-navigation__sections a")];
    return {
      animationId: element.getAttribute("data-animation-id"),
      placement: element.getAttribute("data-lesson-placement"),
      mapHref: primary?.querySelector("a")?.getAttribute("href") ?? null,
      adjacent: adjacent.map((item) => ({tag: item.tagName.toLowerCase(), href: item.getAttribute("href"), ariaDisabled: item.getAttribute("aria-disabled")})),
      sectionHrefs: sectionLinks.map((item) => item.getAttribute("href")),
      currentSectionCount: element.querySelectorAll('.lesson-context-navigation__sections [aria-current="location"]').length,
    };
  });
  const expected = navigationExpectation(pageRecord, lessonPages, sections, locale);
  const failures = [];
  check(failures, observation.animationId === pageRecord.animationId, "lesson navigation animation identity mismatch");
  check(failures, observation.placement === String(pageRecord.globalPageOrdinal), "lesson navigation placement mismatch");
  check(failures, observation.mapHref === expected.mapHref, `lesson map href mismatch: ${observation.mapHref}`);
  check(failures, observation.adjacent.length === 2, "previous/next control count is not 2");
  if (observation.adjacent.length === 2) {
    const [previous, next] = observation.adjacent;
    check(failures, previous.href === expected.previousHref, `previous href mismatch: ${previous.href}`);
    check(failures, next.href === expected.nextHref, `next href mismatch: ${next.href}`);
    check(failures, expected.previousHref ? previous.tag === "a" : previous.ariaDisabled === "true", "previous boundary state mismatch");
    check(failures, expected.nextHref ? next.tag === "a" : next.ariaDisabled === "true", "next boundary state mismatch");
  }
  check(failures, JSON.stringify(observation.sectionHrefs) === JSON.stringify(expected.sectionHrefs), "section-first-page hrefs do not match the exact lesson contract");
  check(failures, observation.currentSectionCount === 1, "exactly one current section link was not marked");
  return {observation, failures};
}

async function inspectRuntimeIdentity(page, animationId, locale, expectedFrame = null) {
  const stage = page.locator(".runtime-stage");
  const observation = await stage.evaluate((element) => ({
    animationId: element.getAttribute("data-animation-id"),
    module: element.getAttribute("data-animation-module"),
    frame: Number(element.getAttribute("data-flash-frame")),
    frameDomain: element.getAttribute("data-flash-frame-domain"),
    rootFrame: Number(element.getAttribute("data-flash-root-frame")),
    language: element.getAttribute("data-runtime-language"),
    scenario: element.getAttribute("data-runtime-scenario"),
    seed: Number(element.getAttribute("data-runtime-seed")),
    visualElementCount: element.querySelectorAll("canvas, svg, img").length,
    visibleChildCount: [...element.children].filter((child) => {
      const rectangle = child.getBoundingClientRect();
      const style = getComputedStyle(child);
      return rectangle.width > 0 && rectangle.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }).length,
    visibleTextLength: (element.textContent ?? "").trim().length,
    forbiddenLegacyEmbedCount: element.querySelectorAll('object, embed, [src$=".swf"], [data$=".swf"]').length,
    runtimeDomainErrorCount: element.querySelectorAll("[data-runtime-domain-error]").length,
  }));
  observation.outputMode = observation.visualElementCount > 0
    ? "graphic"
    : observation.visibleChildCount > 0 && observation.visibleTextLength > 0
      ? "semantic-text"
      : "empty";
  const failures = [];
  check(failures, observation.animationId === animationId, `stage animation identity mismatch: ${observation.animationId}`);
  check(failures, observation.module === animationId, `stage module identity mismatch: ${observation.module}`);
  check(failures, observation.language === locale, `stage language mismatch: ${observation.language}`);
  check(failures, observation.seed === 0, `stage seed mismatch: ${observation.seed}`);
  check(failures, typeof observation.frameDomain === "string" && observation.frameDomain.length > 0, "stage frame domain is missing");
  check(failures, typeof observation.scenario === "string" && observation.scenario.length > 0, "stage scenario is missing");
  check(failures, Number.isInteger(observation.frame) && observation.frame >= 1, `invalid rendered frame: ${observation.frame}`);
  if (expectedFrame !== null) check(failures, observation.frame === expectedFrame, `expected frame ${expectedFrame}, rendered ${observation.frame}`);
  check(failures, observation.outputMode !== "empty", "stage has no visible current-JavaScript output");
  check(failures, observation.forbiddenLegacyEmbedCount === 0, "stage contains a legacy SWF embed");
  check(failures, observation.runtimeDomainErrorCount === 0, "stage contains a renderer-domain error");
  return {observation, failures};
}

async function inspectCourseMap(browser, baseUrl, contract, locale, screenshotRoot, controlledCeoPreview) {
  const profile = locale === "en" ? QA_PROFILES.desktopEnglish : QA_PROFILES.mobileSpanishReduced;
  const context = await browser.newContext({viewport: profile.viewport, reducedMotion: profile.reducedMotion});
  const route = buildCourseUrl(locale);
  const playerSelector = '[data-lesson-player="g4-l3-whole-lesson-mvp"]';
  const {page, events, response} = await openObservedPage(context, baseUrl, route, playerSelector);
  try {
    const failures = [];
    check(failures, response?.status() === 200, `course route returned ${response?.status() ?? "no response"}`);
    check(failures, await page.locator("html").getAttribute("lang") === locale, "document language mismatch");
    await page.locator(`${playerSelector}[data-hydrated="true"]`).waitFor({state: "visible", timeout: 60_000});
    await page.locator(`${playerSelector} .runtime-stage > *`).first().waitFor({state: "visible", timeout: 60_000});
    const controlledPreview = await inspectControlledPreviewBoundary(page, response, controlledCeoPreview);
    failures.push(...controlledPreview.failures);
    const player = await page.locator(playerSelector).evaluate((element) => {
      const shell = element.querySelector(".lesson-shell2");
      const pagePicker = element.querySelector(".lesson-shell2__page-picker select");
      const legacyStage = element.querySelector(".lesson-shell2__legacy-stage");
      const runtimeShells = [...element.querySelectorAll(".runtime-shell")];
      const runtimeStages = [...element.querySelectorAll(".runtime-stage")];
      const runtimeStage = runtimeStages[0] ?? null;
      const visualElementCount = runtimeStage?.querySelectorAll("canvas, svg, img").length ?? 0;
      const visibleChildCount = runtimeStage
        ? [...runtimeStage.children].filter((child) => {
            const rectangle = child.getBoundingClientRect();
            const style = getComputedStyle(child);
            return rectangle.width > 0 && rectangle.height > 0 && style.display !== "none" && style.visibility !== "hidden";
          }).length
        : 0;
      const visibleTextLength = (runtimeStage?.textContent ?? "").trim().length;
      return {
        observationKind: "live-whole-lesson-player",
        lessonPlayer: element.getAttribute("data-lesson-player"),
        candidateMode: shell?.getAttribute("data-candidate-mode") ?? null,
        progressKind: element.getAttribute("data-progress-kind"),
        progressStorage: element.getAttribute("data-progress-storage"),
        hydrated: element.getAttribute("data-hydrated"),
        language: shell?.getAttribute("lang") ?? null,
        currentAnimationId: element.getAttribute("data-current-animation-id"),
        currentPage: Number(element.getAttribute("data-current-page")),
        currentReplayCount: Number(element.getAttribute("data-current-replay-count")),
        pagePickerValue: pagePicker?.value ?? null,
        pagePickerOptions: [...pagePicker?.querySelectorAll("option") ?? []].map((option) => ({
          animationId: option.value,
          label: option.textContent?.trim() ?? "",
        })),
        sectionCodes: [...element.querySelectorAll(".lesson-shell2__section-tabs nav > button")].map(
          (button) => button.getAttribute("data-section-code"),
        ),
        mapRows: [...element.querySelectorAll(".lesson-shell2__map-content button[data-animation-id]")].map(
          (button) => ({
            animationId: button.getAttribute("data-animation-id"),
            ordinal: Number(button.getAttribute("data-global-page-ordinal")),
            sectionCode: button.getAttribute("data-section-code"),
            spanishTitleStatus: button.getAttribute("data-spanish-title-status"),
          }),
        ),
        presentation: shell?.getAttribute("data-presentation") ?? null,
        shellLayout: shell?.getAttribute("data-shell-layout") ?? null,
        shellVisualAuthority: shell?.getAttribute("data-shell-visual-authority") ?? null,
        nativeCompositeStage: legacyStage?.getAttribute("data-native-composite-stage") ?? null,
        authoredStage: legacyStage?.querySelector(".lesson-shell2__stage")?.getAttribute("data-authored-stage") ?? null,
        viewportFitWidth: Number(legacyStage?.getAttribute("data-viewport-fit-width")),
        runtime: {
          shellCount: runtimeShells.length,
          stageCount: runtimeStages.length,
          animationId: runtimeStage?.getAttribute("data-animation-id") ?? null,
          module: runtimeStage?.getAttribute("data-animation-module") ?? null,
          language: runtimeStage?.getAttribute("data-runtime-language") ?? null,
          outputMode: visualElementCount > 0
            ? "graphic"
            : visibleChildCount > 0 && visibleTextLength > 0
              ? "semantic-text"
              : "empty",
          forbiddenLegacyEmbedCount: runtimeStage?.querySelectorAll('object, embed, [src$=".swf"], [data$=".swf"]').length ?? 0,
          runtimeDomainErrorCount: runtimeStage?.querySelectorAll("[data-runtime-domain-error]").length ?? 0,
        },
      };
    });
    failures.push(...validateWholeLessonPlayerObservation(player, contract, locale));
    const firstAnimationId = contract.pages[0].animationId;
    const secondPage = contract.pages[1];
    const lastAnimationId = contract.pages.at(-1).animationId;
    const lastPageOrdinal = contract.pages.at(-1).globalPageOrdinal;
    const sectionTarget = contract.sections.find(
      ({firstActiveAnimationId}) => firstActiveAnimationId !== firstAnimationId,
    );
    const sectionTargetPage = contract.pages.find(
      ({animationId}) => animationId === sectionTarget?.firstActiveAnimationId,
    );
    invariant(secondPage, "G4 L3 contract is missing page 2");
    invariant(sectionTarget && sectionTargetPage, "G4 L3 contract is missing a non-initial section target");

    await page.locator(".lesson-shell2__page-picker select").selectOption(
      secondPage.animationId,
    );
    await waitForWholeLessonPage(
      page,
      playerSelector,
      secondPage.animationId,
      secondPage.globalPageOrdinal,
    );
    const pickerPage1To2Observation = await observeWholeLessonRuntime(
      page,
      playerSelector,
    );
    const pickerPage1To2 = {
      ...pickerPage1To2Observation,
      fromAnimationId: firstAnimationId,
      toAnimationId: secondPage.animationId,
      passed: exactPrimaryRuntime(
        pickerPage1To2Observation,
        secondPage.animationId,
        secondPage.globalPageOrdinal,
      ),
    };
    check(
      failures,
      pickerPage1To2.passed,
      "page picker Page 1 → Page 2 did not preserve one exact live runtime",
    );

    await page.locator(
      `${playerSelector} [data-lesson-nav="action-previous"]`,
    ).click();
    await waitForWholeLessonPage(
      page,
      playerSelector,
      firstAnimationId,
      1,
    );
    const previousToPage1Observation = await observeWholeLessonRuntime(
      page,
      playerSelector,
    );
    const previousToPage1 = {
      ...previousToPage1Observation,
      fromAnimationId: secondPage.animationId,
      toAnimationId: firstAnimationId,
      passed: exactPrimaryRuntime(
        previousToPage1Observation,
        firstAnimationId,
        1,
      ),
    };
    check(
      failures,
      previousToPage1.passed,
      "Previous did not return Page 2 → Page 1 with one exact live runtime",
    );

    await page.locator(
      `.lesson-shell2__section-tabs button[data-section-code="${sectionTarget.code}"]`,
    ).click();
    await waitForWholeLessonPage(
      page,
      playerSelector,
      sectionTarget.firstActiveAnimationId,
      sectionTargetPage.globalPageOrdinal,
    );
    const sectionFirstPageObservation = await observeWholeLessonRuntime(
      page,
      playerSelector,
    );
    const sectionFirstPage = {
      ...sectionFirstPageObservation,
      sectionCode: sectionTarget.code,
      expectedFirstAnimationId: sectionTarget.firstActiveAnimationId,
      passed: exactPrimaryRuntime(
        sectionFirstPageObservation,
        sectionTarget.firstActiveAnimationId,
        sectionTargetPage.globalPageOrdinal,
      ),
    };
    check(
      failures,
      sectionFirstPage.passed,
      "section tab did not land on that section's exact first page with one live runtime",
    );

    const modernMapTrigger = page.locator(
      '[data-course-map-trigger="modern-accessible-control"]',
    );
    const legacyMapTrigger = page.locator(
      '[data-course-map-trigger="legacy-source-hit-area"]',
    );
    const useModernMapTrigger = await modernMapTrigger.isVisible();
    const mapTrigger = useModernMapTrigger
      ? modernMapTrigger
      : legacyMapTrigger;
    check(
      failures,
      await mapTrigger.isVisible(),
      "neither the modern accessible nor legacy source-bound Course Map trigger was visible",
    );
    if (await mapTrigger.getAttribute("aria-expanded") !== "true") {
      await mapTrigger.click();
    }
    await page.locator(".lesson-shell2__side-panel--map").waitFor({
      state: "visible",
      timeout: 10_000,
    });
    await page.locator(
      `.lesson-shell2__map-content button[data-animation-id="${lastAnimationId}"]`,
    ).click();
    await waitForWholeLessonPage(
      page,
      playerSelector,
      lastAnimationId,
      lastPageOrdinal,
    );
    const mapJumpObservation = await observeWholeLessonRuntime(
      page,
      playerSelector,
    );
    const mapJump = {
      ...mapJumpObservation,
      triggerKind: useModernMapTrigger
        ? "modern-accessible-control"
        : "legacy-source-hit-area",
      rowSelector: `.lesson-shell2__map-content button[data-animation-id="${lastAnimationId}"]`,
      passed: exactPrimaryRuntime(
        mapJumpObservation,
        lastAnimationId,
        lastPageOrdinal,
      ),
    };
    check(failures, mapJump.passed, "course-map page-39 jump did not preserve one exact live runtime");

    const finishButton = page.locator(
      `${playerSelector} [data-lesson-nav="action-next"]`,
    );
    await finishButton.click();
    await page.locator(`${playerSelector} .lesson-shell2__finished`).waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const afterFirstFinish = await observeTerminalCompletion(
      page,
      playerSelector,
      lastAnimationId,
    );
    await finishButton.evaluate((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error("terminal completion control is not a button");
      }
      button.click();
    });
    await page.waitForTimeout(80);
    const afterSecondFinish = await observeTerminalCompletion(
      page,
      playerSelector,
      lastAnimationId,
    );
    const terminalCompletionIdempotent = {
      afterFirstFinish,
      afterSecondFinish,
      secondActivationMethod:
        "native-disabled-button-click-no-op-after-first-completion",
      passed:
        afterFirstFinish.animationId === lastAnimationId
        && afterFirstFinish.currentPage === lastPageOrdinal
        && afterFirstFinish.nextDisabled === true
        && afterFirstFinish.completionPressed === "true"
        && afterFirstFinish.lastMapRowComplete === "true"
        && afterFirstFinish.finishedNoticeCount === 1
        && afterFirstFinish.runtimeShellCount === 1
        && afterFirstFinish.runtimeStageCount === 1
        && afterFirstFinish.primaryRuntimeCount === 1
        && afterFirstFinish.runtimeAnimationId === lastAnimationId
        && JSON.stringify(afterSecondFinish) === JSON.stringify(afterFirstFinish),
    };
    check(
      failures,
      terminalCompletionIdempotent.passed,
      "last-page completion was not idempotent or did not preserve one exact live runtime",
    );

    await page.locator(".lesson-shell2__page-picker select").selectOption(
      firstAnimationId,
    );
    await waitForWholeLessonPage(page, playerSelector, firstAnimationId, 1);
    if (await mapTrigger.getAttribute("aria-expanded") !== "true") {
      await mapTrigger.click();
    }
    await page.locator(".lesson-shell2__side-panel--map").waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const map = {
      observationKind: "real-course-map-buttons",
      rowSelector: ".lesson-shell2__map-content button[data-animation-id]",
      pageRows: player.mapRows,
      sectionCodes: player.sectionCodes,
    };
    const layout = await layoutObservation(page, playerSelector);
    check(failures, layout.horizontalOverflowPx <= 1, `whole-lesson player has ${layout.horizontalOverflowPx}px horizontal overflow`);
    const axe = await axeBlockingViolations(page);
    check(failures, axe.length === 0, `whole-lesson player has ${axe.length} serious/critical axe violations`);
    failures.push(...monitorFailures(events));
    const screenshot = await screenshotBinding(page, screenshotRoot, `course-map-${locale}-${profile.viewport.width}x${profile.viewport.height}.png`);
    const interactions = {
      observationKind: "in-course-player-interactions-no-extra-route-visits",
      pickerPage1To2,
      previousToPage1,
      sectionFirstPage,
      mapJump,
      terminalCompletionIdempotent,
      exactlyOnePrimaryRuntimeThroughout: {
        observations: [
          pickerPage1To2Observation,
          previousToPage1Observation,
          sectionFirstPageObservation,
          mapJumpObservation,
          afterFirstFinish,
          afterSecondFinish,
        ],
        passed: [
          pickerPage1To2,
          previousToPage1,
          sectionFirstPage,
          mapJump,
          terminalCompletionIdempotent,
        ].every(({passed}) => passed),
      },
    };
    check(
      failures,
      interactions.exactlyOnePrimaryRuntimeThroughout.passed,
      "one or more whole-lesson transitions did not preserve exactly one primary runtime",
    );
    return {route, locale, profile, status: failures.length ? "fail" : "pass", controlledPreview: controlledPreview.observation, map, player, interactions, layout, axeBlockingViolations: axe, runtimeEvents: events, screenshot, failures};
  } finally {
    await context.close();
  }
}

async function inspectFixedAnimation(context, baseUrl, contract, pageRecord, locale, screenshotRoot, controlledCeoPreview) {
  const route = buildAnimationUrl(pageRecord.animationId, {locale, fixedFrame: locale === "en"});
  const {page, events, response} = await openObservedPage(context, baseUrl, route, ".runtime-stage > *");
  try {
    const failures = [];
    check(failures, response?.status() === 200, `animation route returned ${response?.status() ?? "no response"}`);
    check(failures, await page.locator("html").getAttribute("lang") === locale, "document language mismatch");
    const controlledPreview = await inspectControlledPreviewBoundary(page, response, controlledCeoPreview);
    failures.push(...controlledPreview.failures);
    const runtime = await inspectRuntimeIdentity(page, pageRecord.animationId, locale, locale === "en" ? 1 : null);
    failures.push(...runtime.failures);
    const navigation = await inspectLessonNavigation(page, pageRecord, contract.pages, contract.sections, locale);
    failures.push(...navigation.failures);
    const layout = await layoutObservation(page, ".runtime-shell");
    check(failures, layout.horizontalOverflowPx <= 1, `animation page has ${layout.horizontalOverflowPx}px horizontal overflow`);
    let reducedMotion = null;
    if (locale === "es") {
      const firstFrame = runtime.observation.frame;
      await page.waitForTimeout(250);
      const secondFrame = Number(await page.locator(".runtime-stage").getAttribute("data-flash-frame"));
      const noteVisible = await page.locator(".reduced-motion-note").isVisible();
      reducedMotion = {firstFrame, secondFrame, stable: firstFrame === secondFrame, noteVisible};
      check(failures, reducedMotion.stable, `reduced-motion frame advanced from ${firstFrame} to ${secondFrame}`);
      check(failures, noteVisible, "Spanish mobile reduced-motion note is not visible");
      check(failures, await page.locator('button[data-replay-keyboard="enter-space"]').isEnabled(), "Spanish Replay button is not enabled in reduced-motion mode");
    } else {
      check(failures, await page.locator('button[data-replay-keyboard="enter-space"]').isDisabled(), "fixed-frame Replay button must be disabled");
    }
    const axe = locale === "en" ? await axeBlockingViolations(page) : [];
    check(failures, axe.length === 0, `animation page has ${axe.length} serious/critical axe violations`);
    failures.push(...monitorFailures(events));
    let screenshot = null;
    if ((locale === "en" && pageRecord.globalPageOrdinal === 1) || (locale === "es" && pageRecord.globalPageOrdinal === 39)) {
      screenshot = await screenshotBinding(
        page,
        screenshotRoot,
        `page-${String(pageRecord.globalPageOrdinal).padStart(2, "0")}-${locale}-${locale === "en" ? "desktop" : "mobile-reduced"}.png`,
        controlledCeoPreview ? {selector: ".animation-workspace-section > .container"} : {selector: ".runtime-shell"},
      );
    }
    return {route, locale, status: failures.length ? "fail" : "pass", controlledPreview: controlledPreview.observation, runtime: runtime.observation, navigation: navigation.observation, layout, reducedMotion, axeBlockingViolations: axe, runtimeEvents: events, screenshot, failures};
  } finally {
    await page.close();
  }
}

async function inspectReplay(context, baseUrl, pageRecord, controlledCeoPreview) {
  const route = buildAnimationUrl(pageRecord.animationId, {locale: "en", fixedFrame: false});
  const {page, events, response} = await openObservedPage(context, baseUrl, route, ".runtime-stage > *");
  try {
    const failures = [];
    check(failures, response?.status() === 200, `Replay route returned ${response?.status() ?? "no response"}`);
    const controlledPreview = await inspectControlledPreviewBoundary(page, response, controlledCeoPreview);
    failures.push(...controlledPreview.failures);
    const button = page.locator('button[data-replay-keyboard="enter-space"]');
    check(failures, await button.isEnabled(), "Replay button is disabled in live mode");
    const shell = page.locator(".runtime-shell");
    const identityBefore = await inspectRuntimeIdentity(page, pageRecord.animationId, "en");
    failures.push(...identityBefore.failures);
    const activationFrames = [];
    const activate = async (kind, action, expectedReplay) => {
      const previousReplay = Number(await shell.getAttribute("data-runtime-replay"));
      invariant(
        Number.isInteger(previousReplay) && previousReplay >= 0,
        `${kind} Replay found an invalid pre-activation counter: ${previousReplay}`,
      );
      check(
        failures,
        previousReplay === expectedReplay - 1,
        `${kind} Replay pre-activation counter was ${previousReplay}; expected ${expectedReplay - 1}`,
      );
      const counterAdvanced = page.waitForFunction(
        ({previous}) => {
          const raw = document.querySelector(".runtime-shell")
            ?.getAttribute("data-runtime-replay");
          if (raw === null || raw === undefined || !/^\d+$/.test(raw)) return false;
          return Number(raw) > previous;
        },
        {previous: previousReplay},
        {polling: 50, timeout: 60_000},
      );
      await Promise.all([counterAdvanced, action()]);
      const observedReplay = Number(await shell.getAttribute("data-runtime-replay"));
      const transition = replayCounterTransition(
        previousReplay,
        observedReplay,
        expectedReplay,
      );
      check(failures, transition.countersAreIntegers, `${kind} Replay produced an invalid counter: ${observedReplay}`);
      check(
        failures,
        transition.exactlyOnce,
        `${kind} Replay counter advanced from ${previousReplay} to ${observedReplay}; expected exactly ${expectedReplay}`,
      );
      const observation = await inspectRuntimeIdentity(page, pageRecord.animationId, "en");
      failures.push(...observation.failures);
      activationFrames.push({kind, replay: observedReplay, frame: observation.observation.frame});
      check(failures, observation.observation.frameDomain === identityBefore.observation.frameDomain, `${kind} Replay changed frame domain`);
      check(failures, observation.observation.scenario === identityBefore.observation.scenario, `${kind} Replay changed scenario`);
      check(failures, observation.observation.seed === identityBefore.observation.seed, `${kind} Replay changed seed`);
    };
    await activate("mouse", () => button.click(), 1);
    await button.focus();
    await activate("Enter", () => page.keyboard.press("Enter"), 2);
    await button.focus();
    await activate("Space", () => page.keyboard.press("Space"), 3);
    check(failures, JSON.stringify(activationFrames.map(({replay}) => replay)) === JSON.stringify([1, 2, 3]), "Replay activation counter did not advance exactly once for mouse, Enter, and Space");
    failures.push(...monitorFailures(events));
    return {route, status: failures.length ? "fail" : "pass", controlledPreview: controlledPreview.observation, initialIdentity: identityBefore.observation, activationFrames, runtimeEvents: events, failures};
  } finally {
    await page.close();
  }
}

async function inspectShellRoute(browser, baseUrl, contract, locale, screenshotRoot, controlledCeoPreview) {
  const profile = locale === "en" ? QA_PROFILES.desktopEnglish : QA_PROFILES.mobileSpanishReduced;
  const context = await browser.newContext({viewport: profile.viewport, reducedMotion: profile.reducedMotion});
  const route = buildShellUrl(locale);
  const {page, events, response} = await openObservedPage(context, baseUrl, route, ".runtime-stage > *");
  try {
    const failures = [];
    check(failures, response?.status() === 200, `shell audit route returned ${response?.status() ?? "no response"}`);
    check(failures, await page.locator("html").getAttribute("lang") === locale, "shell document language mismatch");
    const controlledPreview = await inspectControlledPreviewBoundary(page, response, controlledCeoPreview);
    failures.push(...controlledPreview.failures);
    check(failures, await page.locator(".lesson-context-navigation").getAttribute("data-lesson-placement") === "shell", "shell lesson placement identity is missing");
    check(failures, await page.locator(".prototype-warning").isVisible(), "shell route is not explicitly labeled as a legacy prototype");
    check(failures, await page.locator(".runtime-unavailable").count() === 0, "shell route did not load its current-JavaScript module");
    const runtime = await inspectRuntimeIdentity(page, "shell-course-g04-l03-index-local", locale, 50);
    failures.push(...runtime.failures);
    const renderer = await page.locator('[data-animation-id="shell-course-g04-l03-index-local"][data-capture-stage="true"]').evaluate((element) => ({
      phase: element.getAttribute("data-shell-phase"),
      presentation: element.getAttribute("data-shell-presentation"),
      pageCount: Number(element.getAttribute("data-shell-page-count")),
      sourceVisualParity: element.getAttribute("data-shell-source-visual-parity"),
      staticPageCountConflict: element.getAttribute("data-shell-static-page-count-conflict"),
      renderVisual: element.getAttribute("data-render-visual"),
      legacyEmbedCount: element.querySelectorAll('object, embed, [src$=".swf"], [data$=".swf"]').length,
      headerContentOverflowPx: (() => {
        const header = element.querySelector(".course-shell-header");
        if (!header) return Number.POSITIVE_INFINITY;
        const headerBox = header.getBoundingClientRect();
        const contentBottom = Math.max(...[...header.querySelectorAll(".course-shell-heading > *")].map((child) => child.getBoundingClientRect().bottom));
        return Math.max(0, contentBottom - headerBox.bottom);
      })(),
    }));
    check(failures, renderer.phase === "source-close-confirmation-static-structure", `unexpected source shell phase: ${renderer.phase}`);
    check(failures, renderer.presentation === "current-javascript-lesson-map", `unexpected shell presentation: ${renderer.presentation}`);
    check(failures, renderer.pageCount === 39, `shell projection page count is ${renderer.pageCount}`);
    check(failures, renderer.sourceVisualParity === "false", "shell incorrectly claims source visual parity");
    check(failures, renderer.staticPageCountConflict === "unresolved", "44-versus-39 shell conflict is not explicit");
    check(failures, renderer.renderVisual === "true", "shell current-JavaScript projection is not render-ready");
    check(failures, renderer.legacyEmbedCount === 0, "shell projection contains a legacy SWF embed");
    check(failures, renderer.headerContentOverflowPx <= 1, `shell heading overflows its header by ${renderer.headerContentOverflowPx}px`);

    const sectionButtons = page.locator(".course-shell-sections > button");
    check(failures, await sectionButtons.count() === 8, "shell does not expose exactly 8 active XML sections");
    const sections = [];
    let spanishFallbackPages = 0;
    for (let index = 0; index < contract.sections.length; index += 1) {
      const section = contract.sections[index];
      await page.locator(".course-shell-sections > button").nth(index).click();
      const sectionRoot = page.locator(`#course-shell-g04-l03-${section.code}-title`).locator("..").locator("..");
      const links = page.locator(".course-shell-pages a");
      const observed = await links.evaluateAll((items) => items.map((item) => ({
        animationId: item.getAttribute("data-animation-id"),
        href: item.getAttribute("href"),
        authority: item.getAttribute("data-route-authority"),
        language: item.getAttribute("lang"),
        fallback: item.querySelector("small")?.textContent?.includes("Texto inglés") ?? false,
      })));
      const expectedPages = contract.pages.filter((item) => item.sectionCode === section.code);
      const expected = expectedPages.map((item) => ({
        animationId: item.animationId,
        href: `${expectedLocalePrefix(locale)}/animations/${item.animationId}?auditContext=g4-l3-lesson`,
        authority: "local-current-javascript-audit-only",
      }));
      check(failures, observed.length === section.activePageCount, `${section.code} shell page count mismatch`);
      check(failures, JSON.stringify(observed.map(({animationId, href, authority}) => ({animationId, href, authority}))) === JSON.stringify(expected), `${section.code} shell audit routes differ from the lesson contract`);
      spanishFallbackPages += observed.filter(({fallback}) => fallback).length;
      sections.push({code: section.code, pageCount: observed.length, links: observed});
      check(failures, await sectionRoot.count() === 1, `${section.code} section heading is missing`);
      await page.locator(".course-shell-section-heading > button").click();
    }
    check(failures, sections.reduce((total, section) => total + section.pageCount, 0) === 39, "shell sections do not total 39 pages");
    check(failures, spanishFallbackPages === (locale === "es" ? 24 : 0), `unexpected shell Spanish fallback count: ${spanishFallbackPages}`);

    let replay = null;
    if (locale === "en") {
      await page.locator(".course-shell-sections > button").last().click();
      await page.getByRole("button", {name: "Replay map"}).click();
      await page.locator(".course-shell-sections").waitFor({state: "visible"});
      replay = {resetToMenu: await page.locator(".course-shell-sections > button").count() === 8};
      check(failures, replay.resetToMenu, "shell inner Replay did not reset the current-JavaScript map");
      await page.getByRole("button", {name: "Request close"}).click();
      check(failures, await page.getByRole("dialog").isVisible(), "disabled shell close dialog did not open");
      check(failures, await page.getByRole("button", {name: "Yes (disabled)"}).isDisabled(), "legacy close side effect is not disabled");
      await page.getByRole("button", {name: "No"}).click();
    }

    const layout = await layoutObservation(page, ".runtime-shell");
    check(failures, layout.horizontalOverflowPx <= 1, `shell route has ${layout.horizontalOverflowPx}px horizontal overflow`);
    const axe = await axeBlockingViolations(page);
    check(failures, axe.length === 0, `shell route has ${axe.length} serious/critical axe violations`);
    failures.push(...monitorFailures(events));
    const screenshot = await screenshotBinding(
      page,
      screenshotRoot,
      `shell-${locale}-${profile.viewport.width}x${profile.viewport.height}.png`,
      controlledCeoPreview ? {selector: ".animation-workspace-section > .container"} : {selector: ".runtime-shell"},
    );
    return {route, locale, status: failures.length ? "fail" : "pass", controlledPreview: controlledPreview.observation, expectedPrototypeWarning: true, runnableCurrentJavascriptModule: true, runtime: runtime.observation, renderer, sections, spanishFallbackPages, replay, layout, axeBlockingViolations: axe, runtimeEvents: events, screenshot, failures};
  } finally {
    await context.close();
  }
}

async function loadScope() {
  const [progress, contract, releaseLedger] = await Promise.all([
    readJson(INPUT_PATHS.currentJavascriptProgress),
    readJson(INPUT_PATHS.lessonProductContract),
    readJson(INPUT_PATHS.lessonReleaseLedger),
  ]);
  invariant(progress.summary.activePages === 39 && progress.summary.currentJavaScriptModules === 39, "Current-JavaScript progress is not 39/39");
  invariant(contract.summary.activePages === 39 && contract.pages.length === 39, "Lesson product contract is not 39 pages");
  invariant(contract.summary.courseShells === 1, "Lesson product contract does not declare one shell");
  invariant(contract.publication.published === false && contract.publication.strictCompleteMembers === 0, "Lesson release is no longer in the expected fail-closed state");
  const progressIds = progress.pages.map(({animationId}) => animationId);
  const contractIds = contract.pages.map(({animationId}) => animationId);
  invariant(JSON.stringify(progressIds) === JSON.stringify(contractIds), "Current-JavaScript report order differs from the lesson contract");
  invariant(progress.pages.every((item) => item.currentJavaScript.currentOutputExists), "At least one lesson page lacks current JavaScript");
  invariant(progress.pages.every((item) => Object.values(item.acceptance).every((value) => value === false)), "Current-JavaScript report contains an unexpected acceptance promotion");
  const release = releaseLedger.releases.find(({releaseId}) => releaseId === contract.publication.releaseId);
  invariant(release && release.published === false && release.strictCompleteCount === 0, "Lesson release ledger is not closed at 0 strict members");
  const sourceBindings = Object.fromEntries(await Promise.all(Object.entries(INPUT_PATHS)
    .filter(([key]) => key !== "lessonProductContract" && key !== "currentJavascriptProgress")
    .map(async ([key, projectPath]) => [key, await bindFile(projectPath)])));
  // The QA reads the contract for expectations but deliberately does not bind
  // its complete file hash or the progress report that binds that contract.
  // The contract later binds this QA report, so hashing either reverse edge
  // would create an unverifiable cycle. Source XML, navigation code, registries,
  // package/tool inputs, and ledgers above remain independently bound.
  return {progress, contract, sourceBindings};
}

function aggregateRuntimeEvents(entries) {
  const totals = {consoleErrors: 0, pageErrors: 0, failedRequests: 0, badResponses: 0, ignoredAbortedRscPrefetches: 0};
  for (const entry of entries) {
    const events = entry.runtimeEvents;
    for (const key of Object.keys(totals)) totals[key] += events?.[key]?.length ?? 0;
  }
  return totals;
}

function allEntries(routeChecks) {
  return [
    ...routeChecks.courseMaps,
    ...routeChecks.shellAuditRoutes,
    ...routeChecks.animations.flatMap(({desktopEnglish, mobileSpanishReduced, replay}) => [desktopEnglish, mobileSpanishReduced, replay]),
  ];
}

function reportScreenshots(routeChecks) {
  return allEntries(routeChecks).flatMap((entry) => entry.screenshot ? [entry.screenshot] : []);
}

function validFileBinding(binding) {
  return typeof binding?.path === "string"
    && Number.isInteger(binding?.bytes)
    && binding.bytes > 0
    && sha256Pattern.test(binding?.sha256 ?? "");
}

function artifactVariantForReportType(candidateReportType) {
  for (const variant of Object.values(QA_ARTIFACT_VARIANTS)) {
    if (variant.product.reportType === candidateReportType) {
      return {variant, artifact: variant.product, controlledCeoPreview: false};
    }
    if (variant.controlled.reportType === candidateReportType) {
      return {variant, artifact: variant.controlled, controlledCeoPreview: true};
    }
  }
  return null;
}

function buildArtifactIdentity(artifactVersion, controlledCeoPreview, sourceBindings) {
  if (artifactVersion === "v3") return null;
  const variant = QA_ARTIFACT_VARIANTS[artifactVersion];
  const artifact = controlledCeoPreview ? variant.controlled : variant.product;
  return {
    variant: variant.id,
    version: variant.version,
    reportType: artifact.reportType,
    title: artifact.title,
    generatorSourceBinding: sourceBindings.productQaGenerator,
  };
}

export function buildEvidenceDigests(routeChecks) {
  const routeManifest = [
    ...routeChecks.courseMaps.map(({locale, route}) => ({kind: "course-map", locale, route})),
    ...routeChecks.shellAuditRoutes.map(({locale, route}) => ({kind: "shell", locale, route})),
    ...routeChecks.animations.flatMap(({animationId, desktopEnglish, mobileSpanishReduced}) => [
      {kind: "animation", locale: "en", animationId, route: desktopEnglish.route},
      {kind: "animation", locale: "es", animationId, route: mobileSpanishReduced.route},
    ]),
  ];
  const visitManifest = allEntries(routeChecks).map(({route, status}, visitOrdinal) => ({
    visitOrdinal: visitOrdinal + 1,
    route,
    status,
  }));
  const captureManifest = reportScreenshots(routeChecks).map(({path: capturePath, bytes, sha256: captureSha256}) => ({
    path: capturePath,
    bytes,
    sha256: captureSha256,
  }));
  return {
    routeManifestCount: routeManifest.length,
    routeManifestSha256: sha256(JSON.stringify(routeManifest)),
    visitManifestCount: visitManifest.length,
    visitManifestSha256: sha256(JSON.stringify(visitManifest)),
    captureManifestCount: captureManifest.length,
    captureManifestSha256: sha256(JSON.stringify(captureManifest)),
  };
}

function controlledPreviewBoundaryPasses(observation) {
  return observation?.count === 1
    && observation.visible === true
    && observation.copy === controlledPreviewCopy
    && observation.attributes?.currentJavascriptCandidate === "true"
    && observation.attributes?.originalRuntimeFullFrameComparison === "pending"
    && observation.attributes?.humanAudioVisualReview === "pending"
    && observation.attributes?.ownerAcceptance === "pending"
    && observation.attributes?.strictCompletion === "false"
    && observation.attributes?.publicRelease === "false"
    && observation.attributes?.strictCompleteMembers === "0"
    && observation.attributes?.releaseMembers === "40";
}

function summaryFromChecks(routeChecks, controlledCeoPreview) {
  const entries = allEntries(routeChecks);
  const failures = entries.flatMap((entry) => entry.failures.map((message) => ({route: entry.route, message})));
  const runtimeEvents = aggregateRuntimeEvents(entries);
  const axeAudits = entries.filter((entry) => Array.isArray(entry.axeBlockingViolations)).length;
  const axeBlockingViolations = entries.reduce((total, entry) => total + (entry.axeBlockingViolations?.length ?? 0), 0);
  const controlledBoundaryPasses = entries.filter((entry) => controlledPreviewBoundaryPasses(entry.controlledPreview)).length;
  const privateNoStoreHeaderPasses = entries.filter((entry) => entry.controlledPreview?.response?.cacheControl === "private, no-store, max-age=0").length;
  const noindexHeaderPasses = entries.filter((entry) => entry.controlledPreview?.response?.xRobotsTag === "noindex, nofollow, noarchive, noimageindex").length;
  const controlledPreviewIdentityHeaderPasses = entries.filter((entry) => entry.controlledPreview?.response?.xHelpmathControlledPreview === "g4-l3-local-only").length;
  return {
    status: failures.length === 0
      ? (controlledCeoPreview ? "pass-machine-verified-controlled-ceo-preview" : "pass-current-javascript-product-layer")
      : (controlledCeoPreview ? "fail-controlled-ceo-preview" : "fail-current-javascript-product-layer"),
    activePages: 39,
    courseShells: 1,
    releaseMembers: 40,
    strictCompleteMembers: 0,
    published: false,
    currentJavascriptAnimationModules: 39,
    runnableShellModules: routeChecks.shellAuditRoutes.every(({runnableCurrentJavascriptModule, status}) => runnableCurrentJavascriptModule && status === "pass") ? 1 : 0,
    uniqueRoutesVerified: 82,
    routeVisits: entries.length,
    courseMapRoutes: routeChecks.courseMaps.length,
    animationLocaleRoutes: routeChecks.animations.length * 2,
    shellAuditRoutes: routeChecks.shellAuditRoutes.length,
    liveReplayRoutes: routeChecks.animations.length,
    desktopFixedFrameRoutes: routeChecks.animations.filter(({desktopEnglish}) => desktopEnglish.status === "pass").length,
    mobileSpanishReducedMotionRoutes: routeChecks.animations.filter(({mobileSpanishReduced}) => mobileSpanishReduced.status === "pass").length,
    mobileSpanishGraphicRoutes: routeChecks.animations.filter(({mobileSpanishReduced}) => mobileSpanishReduced.runtime.outputMode === "graphic").length,
    mobileSpanishFailClosedSemanticRoutes: routeChecks.animations.filter(({mobileSpanishReduced}) => mobileSpanishReduced.runtime.outputMode === "semantic-text").length,
    replayMouseEnterSpaceRoutes: routeChecks.animations.filter(({replay}) => replay.status === "pass").length,
    axeAudits,
    axeSeriousOrCriticalViolations: axeBlockingViolations,
    horizontalOverflowFailures: entries.filter((entry) => (entry.layout?.horizontalOverflowPx ?? 0) > 1).length,
    runtimeRenderFailures: routeChecks.animations.filter(({desktopEnglish, mobileSpanishReduced}) => desktopEnglish.status !== "pass" || mobileSpanishReduced.status !== "pass").length,
    navigationFailures: routeChecks.animations.filter(({desktopEnglish, mobileSpanishReduced}) => desktopEnglish.navigation === undefined || mobileSpanishReduced.navigation === undefined || desktopEnglish.failures.some((item) => item.includes("navigation") || item.includes("href")) || mobileSpanishReduced.failures.some((item) => item.includes("navigation") || item.includes("href"))).length,
    replayFailures: routeChecks.animations.filter(({replay}) => replay.status !== "pass").length,
    consoleErrors: runtimeEvents.consoleErrors,
    pageErrors: runtimeEvents.pageErrors,
    failedRequests: runtimeEvents.failedRequests,
    badHttpResponses: runtimeEvents.badResponses,
    ignoredAbortedRscPrefetches: runtimeEvents.ignoredAbortedRscPrefetches,
    screenshotCount: reportScreenshots(routeChecks).length,
    controlledPreviewBoundaryPasses: controlledCeoPreview ? controlledBoundaryPasses : 0,
    privateNoStoreHeaderPasses: controlledCeoPreview ? privateNoStoreHeaderPasses : 0,
    noindexHeaderPasses: controlledCeoPreview ? noindexHeaderPasses : 0,
    controlledPreviewIdentityHeaderPasses: controlledCeoPreview ? controlledPreviewIdentityHeaderPasses : 0,
    failureCount: failures.length,
    failures,
  };
}

export function validateReportStructure(report, {expectedArtifactVersion = null} = {}) {
  const errors = [];
  const reportArtifact = artifactVariantForReportType(report?.reportType);
  if (report?.schemaVersion !== schemaVersion) errors.push(`schemaVersion must be ${schemaVersion}`);
  if (!reportArtifact) errors.push("reportType is unsupported");
  if (expectedArtifactVersion && reportArtifact?.variant.id !== expectedArtifactVersion) {
    errors.push(`report artifact version must be ${expectedArtifactVersion}`);
  }
  if (
    reportArtifact
    && reportArtifact.variant.id !== "v3"
    && report?.environment?.baseUrl !== reportArtifact.variant.defaultBaseUrl
  ) {
    errors.push(`${reportArtifact.variant.version} report environment.baseUrl must be ${reportArtifact.variant.defaultBaseUrl}`);
  }
  if (reportArtifact && reportArtifact.variant.id !== "v3") {
    const expectedIdentity = {
      variant: reportArtifact.variant.id,
      version: reportArtifact.variant.version,
      reportType: reportArtifact.artifact.reportType,
      title: reportArtifact.artifact.title,
      generatorSourceBinding: report?.sourceBindings?.productQaGenerator,
    };
    if (
      !validFileBinding(report?.sourceBindings?.productQaGenerator)
      || JSON.stringify(report?.artifactIdentity) !== JSON.stringify(expectedIdentity)
    ) {
      errors.push(`${reportArtifact.variant.version} artifact identity must bind its report type, title, version, and current QA generator source`);
    }
  }
  if (report?.summary?.activePages !== 39) errors.push("summary.activePages must be 39");
  if (report?.summary?.uniqueRoutesVerified !== 82) errors.push("summary.uniqueRoutesVerified must be 82");
  if (report?.summary?.routeVisits !== 121) errors.push("summary.routeVisits must be 121");
  if (report?.summary?.runnableShellModules !== 1) errors.push("summary.runnableShellModules must be 1");
  if (report?.routeChecks?.animations?.length !== 39) errors.push("routeChecks.animations must contain 39 pages");
  if (report?.routeChecks?.courseMaps?.length !== 2) errors.push("routeChecks.courseMaps must contain 2 locales");
  if (report?.routeChecks?.shellAuditRoutes?.length !== 2) errors.push("routeChecks.shellAuditRoutes must contain 2 locales");
  if (JSON.stringify(report?.authorityClaims) !== JSON.stringify(AUTHORITY_CLAIMS)) errors.push("authorityClaims must remain entirely false");
  if (report?.acceptance?.humanVisualAccepted !== false || report?.acceptance?.ownerAccepted !== false || report?.acceptance?.strictMigrationComplete !== false || report?.acceptance?.lessonComplete !== false) errors.push("acceptance authority fields must remain false");
  if (report?.acceptance?.acceptanceNeutral !== true) errors.push("report must be acceptance-neutral");
  if (report?.summary?.releaseMembers !== 40 || report?.summary?.strictCompleteMembers !== 0 || report?.summary?.published !== false) errors.push("release boundary must remain 0/40 and unpublished");
  const passing = report?.summary?.status === "pass-current-javascript-product-layer"
    || report?.summary?.status === "pass-machine-verified-controlled-ceo-preview";
  if (passing) {
    for (const key of ["failureCount", "axeSeriousOrCriticalViolations", "horizontalOverflowFailures", "runtimeRenderFailures", "navigationFailures", "replayFailures", "consoleErrors", "pageErrors", "failedRequests", "badHttpResponses"]) {
      if (report.summary[key] !== 0) errors.push(`passing report requires summary.${key} = 0`);
    }
    if (report.summary.desktopFixedFrameRoutes !== 39 || report.summary.mobileSpanishReducedMotionRoutes !== 39 || report.summary.replayMouseEnterSpaceRoutes !== 39) errors.push("passing report requires all 39 desktop, mobile reduced-motion, and Replay checks");
    if ((report.summary.mobileSpanishGraphicRoutes ?? 0) + (report.summary.mobileSpanishFailClosedSemanticRoutes ?? 0) !== 39) errors.push("passing report must classify all 39 Spanish routes as graphic or fail-closed semantic output");
    for (const courseMap of report?.routeChecks?.courseMaps ?? []) {
      const realMapRows = courseMap?.map?.pageRows;
      const realMapShape = Array.isArray(realMapRows)
        && realMapRows.length === 39
        && realMapRows.every((row, index) =>
          typeof row?.animationId === "string"
          && /^course-g04-l03-/.test(row.animationId)
          && row.ordinal === index + 1
          && typeof row?.sectionCode === "string"
          && row.sectionCode.length >= 2
          && typeof row?.spanishTitleStatus === "string"
          && row.spanishTitleStatus.length > 0);
      const interactions = courseMap?.interactions;
      if (
        courseMap?.status !== "pass"
        || courseMap?.player?.observationKind !== "live-whole-lesson-player"
        || courseMap?.player?.lessonPlayer !== "g4-l3-whole-lesson-mvp"
        || courseMap?.player?.presentation !== "wide-functional-audit-candidate"
        || courseMap?.player?.nativeCompositeStage !== "800x600"
        || courseMap?.player?.pagePickerOptions?.length !== 39
        || courseMap?.map?.observationKind !== "real-course-map-buttons"
        || courseMap?.map?.rowSelector !== ".lesson-shell2__map-content button[data-animation-id]"
        || !realMapShape
        || courseMap?.map?.sectionCodes?.length !== 8
        || interactions?.observationKind !== "in-course-player-interactions-no-extra-route-visits"
        || interactions?.pickerPage1To2?.passed !== true
        || interactions?.previousToPage1?.passed !== true
        || interactions?.sectionFirstPage?.passed !== true
        || interactions?.mapJump?.passed !== true
        || interactions?.terminalCompletionIdempotent?.passed !== true
        || interactions?.exactlyOnePrimaryRuntimeThroughout?.passed !== true
        || interactions?.exactlyOnePrimaryRuntimeThroughout?.observations?.length
          !== 6
      ) {
        errors.push("passing report requires two complete live-player observations, real 39-row Course Maps, and all required in-course interactions");
        break;
      }
    }
  }
  if (reportArtifact?.controlledCeoPreview) {
    if (report?.summary?.status === "pass-machine-verified-controlled-ceo-preview") {
      for (const key of ["controlledPreviewBoundaryPasses", "privateNoStoreHeaderPasses", "noindexHeaderPasses", "controlledPreviewIdentityHeaderPasses"]) {
        if (report.summary[key] !== 121) errors.push(`controlled preview requires summary.${key} = 121`);
      }
    }
    if (report?.acceptance?.controlledCeoPreview !== true) errors.push("controlled preview report must declare its bounded preview status");
    const digests = report?.evidenceDigests;
    if (
      digests?.routeManifestCount !== 82
      || digests?.visitManifestCount !== 121
      || digests?.captureManifestCount !== 6
      || !sha256Pattern.test(digests?.routeManifestSha256 ?? "")
      || !sha256Pattern.test(digests?.visitManifestSha256 ?? "")
      || !sha256Pattern.test(digests?.captureManifestSha256 ?? "")
    ) {
      errors.push("controlled preview route/visit/capture digest shape drifted");
    } else {
      const expectedDigests = buildEvidenceDigests(report.routeChecks);
      if (JSON.stringify(digests) !== JSON.stringify(expectedDigests)) {
        errors.push("controlled preview route/visit/capture digests do not match route checks");
      }
    }
  }
  return errors;
}

async function validateCheckedInReport(reportPath, markdownPath, expectedArtifactVersion) {
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const errors = validateReportStructure(report, {expectedArtifactVersion});
  for (const binding of Object.values(report.sourceBindings ?? {})) {
    if (!binding?.path || !sha256Pattern.test(binding.sha256 ?? "")) {
      errors.push("invalid source binding");
      continue;
    }
    try {
      const current = await bindFile(binding.path);
      if (current.bytes !== binding.bytes || current.sha256 !== binding.sha256) errors.push(`${binding.path} drifted`);
    } catch (error) {
      errors.push(`${binding.path} cannot be verified: ${error.message}`);
    }
  }
  for (const screenshot of report.screenshots ?? []) {
    try {
      const current = await bindFile(screenshot.path);
      if (current.bytes !== screenshot.bytes || current.sha256 !== screenshot.sha256) errors.push(`${screenshot.path} drifted`);
    } catch (error) {
      errors.push(`${screenshot.path} cannot be verified: ${error.message}`);
    }
  }
  const expectedMarkdown = renderMarkdown(report);
  const actualMarkdown = await readFile(markdownPath, "utf8");
  if (actualMarkdown !== expectedMarkdown) errors.push(`${relative(markdownPath)} is stale`);
  invariant(errors.length === 0, `G4 L3 current-JavaScript product QA check failed:\n- ${errors.join("\n- ")}`);
  return report;
}

export function renderMarkdown(report) {
  const summary = report.summary;
  const reportArtifact = artifactVariantForReportType(report.reportType);
  const controlledCeoPreview = reportArtifact?.controlledCeoPreview ?? false;
  const lines = [
    `# ${report.artifactIdentity?.title ?? reportArtifact?.artifact.title ?? "G4 L3 current-JavaScript lesson product QA"}`,
    "",
    controlledCeoPreview
      ? `> ${controlledPreviewCopy}`
      : "> Acceptance-neutral browser evidence for the current JavaScript layer. This is not original-runtime, visual-parity, audio, human, owner, strict-completion, or publication evidence.",
    "",
    "## Result",
    "",
    `- Status: **${summary.status}**.`,
    `- Unique routes: **${summary.uniqueRoutesVerified}**; route visits: **${summary.routeVisits}**.`,
    `- Current JavaScript pages: **${summary.currentJavascriptAnimationModules}/39**; runnable course shell: **${summary.runnableShellModules}/1**.`,
    `- Desktop fixed-frame renders: **${summary.desktopFixedFrameRoutes}/39**.`,
    `- Mobile Spanish reduced-motion renders: **${summary.mobileSpanishReducedMotionRoutes}/39**.`,
    `- Spanish route output classification: **${summary.mobileSpanishGraphicRoutes} graphic**, **${summary.mobileSpanishFailClosedSemanticRoutes} fail-closed semantic**.`,
    `- Replay mouse/Enter/Space checks: **${summary.replayMouseEnterSpaceRoutes}/39**.`,
    `- Axe serious/critical violations: **${summary.axeSeriousOrCriticalViolations}** across **${summary.axeAudits}** audits.`,
    `- Console/page/request/HTTP errors: **${summary.consoleErrors}/${summary.pageErrors}/${summary.failedRequests}/${summary.badHttpResponses}**.`,
    `- Ignored same-origin Next.js RSC prefetch cancellations: **${summary.ignoredAbortedRscPrefetches ?? 0}**.`,
    `- Horizontal-overflow failures: **${summary.horizontalOverflowFailures}**.`,
    `- Atomic release boundary: **${summary.strictCompleteMembers}/${summary.releaseMembers} strict; ${summary.published ? "published" : "unpublished"}**.`,
    ...(controlledCeoPreview ? [
      `- Exact Controlled CEO Preview boundary: **${summary.controlledPreviewBoundaryPasses}/121 visits**.`,
      `- Private/no-store, noindex, and controlled-preview identity headers: **${summary.privateNoStoreHeaderPasses}/${summary.noindexHeaderPasses}/${summary.controlledPreviewIdentityHeaderPasses} of 121 visits**.`,
    ] : []),
    "",
    "## Route matrix",
    "",
    "# | animationId | EN desktop frame 1 | ES mobile reduced motion | Replay mouse/Enter/Space",
    "---: | --- | --- | --- | ---",
    ...report.routeChecks.animations.map((item, index) => `${index + 1} | \`${item.animationId}\` | ${item.desktopEnglish.status} | ${item.mobileSpanishReduced.status} | ${item.replay.status}`),
    "",
    "## Course and shell routes",
    "",
    ...report.routeChecks.courseMaps.map((item) => `- \`${item.route}\`: ${item.status}; continuous player with ${item.map.pageRows.length} ordered picker pages; horizontal overflow ${item.layout.horizontalOverflowPx}px.`),
    ...report.routeChecks.shellAuditRoutes.map((item) => `- \`${item.route}\`: ${item.status}; prototype warning retained; source-visual parity false; ${item.sections.reduce((total, section) => total + section.pageCount, 0)} source-ordered page links; runnable current-JavaScript shell module: ${item.runnableCurrentJavascriptModule}.`),
    "",
    "## Acceptance boundary",
    "",
    report.acceptance.statement,
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function runQa(options) {
  await assertV33GenerationTargetsAbsent(options);
  const {contract, sourceBindings} = await loadScope();
  const artifactVariant = QA_ARTIFACT_VARIANTS[options.artifactVersion];
  const artifact = options.controlledCeoPreview
    ? artifactVariant.controlled
    : artifactVariant.product;
  await prepareScreenshotRoot(options);
  const browser = await chromium.launch({headless: true});
  let routeChecks;
  let browserVersion;
  try {
    browserVersion = browser.version();
    const courseMaps = [];
    for (const locale of ["en", "es"]) courseMaps.push(await inspectCourseMap(browser, options.baseUrl, contract, locale, options.screenshotRoot, options.controlledCeoPreview));
    const shellAuditRoutes = [];
    for (const locale of ["en", "es"]) shellAuditRoutes.push(await inspectShellRoute(browser, options.baseUrl, contract, locale, options.screenshotRoot, options.controlledCeoPreview));
    for (const shellCheck of shellAuditRoutes) {
      for (const failure of shellCheck.failures) {
        process.stdout.write(`shell ${shellCheck.locale} failure: ${failure}\n`);
      }
    }

    const desktopContext = await browser.newContext({viewport: QA_PROFILES.desktopEnglish.viewport, reducedMotion: QA_PROFILES.desktopEnglish.reducedMotion});
    const mobileContext = await browser.newContext({viewport: QA_PROFILES.mobileSpanishReduced.viewport, reducedMotion: QA_PROFILES.mobileSpanishReduced.reducedMotion});
    const replayContext = await browser.newContext({viewport: QA_PROFILES.desktopEnglishReplay.viewport, reducedMotion: QA_PROFILES.desktopEnglishReplay.reducedMotion});
    const animations = [];
    try {
      for (const pageRecord of contract.pages) {
        const desktopEnglish = await inspectFixedAnimation(desktopContext, options.baseUrl, contract, pageRecord, "en", options.screenshotRoot, options.controlledCeoPreview);
        const mobileSpanishReduced = await inspectFixedAnimation(mobileContext, options.baseUrl, contract, pageRecord, "es", options.screenshotRoot, options.controlledCeoPreview);
        const replay = await inspectReplay(replayContext, options.baseUrl, pageRecord, options.controlledCeoPreview);
        animations.push({animationId: pageRecord.animationId, globalPageOrdinal: pageRecord.globalPageOrdinal, sectionCode: pageRecord.sectionCode, desktopEnglish, mobileSpanishReduced, replay});
        process.stdout.write(`checked ${String(pageRecord.globalPageOrdinal).padStart(2, "0")}/39 ${pageRecord.animationId}\n`);
      }
    } finally {
      await Promise.all([desktopContext.close(), mobileContext.close(), replayContext.close()]);
    }
    routeChecks = {courseMaps, shellAuditRoutes, animations};
  } finally {
    await browser.close();
  }

  const summary = summaryFromChecks(routeChecks, options.controlledCeoPreview);
  const report = {
    schemaVersion,
    reportType: artifact.reportType,
    ...(options.artifactVersion === "v3" ? {} : {
      artifactIdentity: buildArtifactIdentity(
        options.artifactVersion,
        options.controlledCeoPreview,
        sourceBindings,
      ),
    }),
    scope: {
      lesson: {grade: 4, lesson: 3, title: "Negative Numbers"},
      activePages: 39,
      courseShells: 1,
      sourceSequenceAuthority: "active-course-index-xml-global-page-order",
      productLayer: options.controlledCeoPreview
        ? "machine-verified-controlled-ceo-preview"
        : "current-javascript-local-audit-preview",
    },
    environment: {
      baseUrl: options.baseUrl,
      browser: "chromium",
      browserVersion,
      profiles: QA_PROFILES,
      axeTags: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      blockingAxeImpacts: ["serious", "critical"],
    },
    sourceBindings,
    summary,
    routeChecks,
    screenshots: reportScreenshots(routeChecks),
    evidenceDigests: buildEvidenceDigests(routeChecks),
    authorityClaims: AUTHORITY_CLAIMS,
    acceptance: {
      acceptanceNeutral: true,
      controlledCeoPreview: options.controlledCeoPreview,
      currentJavascriptProductQaPassed: summary.failureCount === 0,
      currentJavascriptRouteBehaviorVerified: summary.failureCount === 0,
      currentJavascriptResponsiveLayoutVerified: summary.horizontalOverflowFailures === 0,
      currentJavascriptAccessibilityChecked: summary.axeSeriousOrCriticalViolations === 0,
      authoritativeOriginalRuntimeComplete: false,
      originalNavigationParityAccepted: false,
      bilingualVisualParityAccepted: false,
      audioAccepted: false,
      fullFrameRmseAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonComplete: false,
      statement: "This report proves only the observed local Next.js/current-JavaScript product layer for the exact routes and profiles listed. The runnable course shell is an acceptance-neutral 39-page audit projection: its source visual parity is explicitly false, its 44-versus-39 static sequence conflict is unresolved, and its legacy external effects remain disabled. Original-runtime behavior, source navigation parity, interaction/scoring branches, audio synchronization and listening, bilingual visual parity, full-frame RMSE, human visual review, owner acceptance, strict completion, and atomic publication all remain false.",
    },
  };
  const structureErrors = validateReportStructure(report, {
    expectedArtifactVersion: options.artifactVersion,
  });
  invariant(structureErrors.length === 0, `Generated QA report is invalid:\n- ${structureErrors.join("\n- ")}`);
  await writeGeneratedArtifact(
    options.jsonOutput,
    `${JSON.stringify(report, null, 2)}\n`,
    options.artifactVersion,
  );
  await writeGeneratedArtifact(
    options.markdownOutput,
    renderMarkdown(report),
    options.artifactVersion,
  );
  if (options.controlledCeoPreview && options.writeProductAlias) {
    const productAlias = {
      ...report,
      reportType: productReportType,
      scope: {
        ...report.scope,
        productLayer: "current-javascript-local-audit-preview",
      },
      summary: {
        ...report.summary,
        status: report.summary.failureCount === 0
          ? "pass-current-javascript-product-layer"
          : "fail-current-javascript-product-layer",
      },
      acceptance: {
        ...report.acceptance,
        controlledCeoPreview: false,
        observedWithinControlledCeoPreview: true,
      },
    };
    const aliasErrors = validateReportStructure(productAlias);
    invariant(aliasErrors.length === 0, `Generated product QA alias is invalid:\n- ${aliasErrors.join("\n- ")}`);
    await writeFile(defaultJsonOutput, `${JSON.stringify(productAlias, null, 2)}\n`);
    await writeFile(defaultMarkdownOutput, renderMarkdown(productAlias));
  }
  invariant(summary.failureCount === 0, `G4 L3 product QA found ${summary.failureCount} failures; inspect ${relative(options.jsonOutput)}`);
  return report;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.check) {
    const report = await validateCheckedInReport(
      options.jsonOutput,
      options.markdownOutput,
      options.artifactVersion,
    );
    process.stdout.write(`verified ${relative(options.jsonOutput)}: ${report.summary.status}, ${report.summary.uniqueRoutesVerified} routes\n`);
    return;
  }
  const report = await runQa(options);
  process.stdout.write(`wrote ${relative(options.jsonOutput)}: ${report.summary.status}, ${report.summary.uniqueRoutesVerified} routes\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
