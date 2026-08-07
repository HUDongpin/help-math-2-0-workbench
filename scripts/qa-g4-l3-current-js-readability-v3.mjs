#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
import sharp from "sharp";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const schemaVersion = 1;
const reportType = "g4-l3-current-js-readability-v3";
const defaultBaseUrl = "http://127.0.0.1:3216";
const defaultJsonOutput = path.join(
  projectRoot,
  "reports",
  "g4-l3-current-js-readability-v3.json",
);
const defaultMarkdownOutput = path.join(
  projectRoot,
  "reports",
  "g4-l3-current-js-readability-v3.md",
);
const defaultScreenshotRoot = path.join(
  projectRoot,
  "output",
  "playwright",
  "g4-l3-current-js-readability-v3",
);
const v31ReportType = "g4-l3-current-js-readability-v3-1";
const v32ReportType = "g4-l3-current-js-readability-v3-2";
const v33ReportType = "g4-l3-current-js-readability-v3-3";
const v33R2ReportType = "g4-l3-current-js-readability-v3-3-r2";
const READABILITY_ARTIFACT_VARIANTS = Object.freeze({
  v3: Object.freeze({
    id: "v3",
    version: "v3",
    reportType,
    title: "G4 L3 current-JS readability v3",
    defaultBaseUrl,
    jsonOutput: defaultJsonOutput,
    markdownOutput: defaultMarkdownOutput,
    screenshotRoot: defaultScreenshotRoot,
  }),
  "v3-1": Object.freeze({
    id: "v3-1",
    version: "v3.1",
    reportType: v31ReportType,
    title: "G4 L3 current-JS readability v3.1",
    defaultBaseUrl: "http://127.0.0.1:3217",
    jsonOutput: path.join(
      projectRoot,
      "reports",
      "g4-l3-current-js-readability-v3-1.json",
    ),
    markdownOutput: path.join(
      projectRoot,
      "reports",
      "g4-l3-current-js-readability-v3-1.md",
    ),
    screenshotRoot: path.join(
      projectRoot,
      "output",
      "playwright",
      "g4-l3-current-js-readability-v3-1",
    ),
  }),
  "v3-2": Object.freeze({
    id: "v3-2",
    version: "v3.2",
    reportType: v32ReportType,
    title: "G4 L3 current-JS readability v3.2",
    defaultBaseUrl: "http://127.0.0.1:3218",
    jsonOutput: path.join(
      projectRoot,
      "reports",
      "g4-l3-current-js-readability-v3-2.json",
    ),
    markdownOutput: path.join(
      projectRoot,
      "reports",
      "g4-l3-current-js-readability-v3-2.md",
    ),
    screenshotRoot: path.join(
      projectRoot,
      "output",
      "playwright",
      "g4-l3-current-js-readability-v3-2",
    ),
  }),
  "v3-3": Object.freeze({
    id: "v3-3",
    version: "v3.3",
    reportType: v33ReportType,
    title: "G4 L3 current-JS readability v3.3",
    defaultBaseUrl: "http://127.0.0.1:3219",
    jsonOutput: path.join(
      projectRoot,
      "reports",
      "g4-l3-current-js-readability-v3-3.json",
    ),
    markdownOutput: path.join(
      projectRoot,
      "reports",
      "g4-l3-current-js-readability-v3-3.md",
    ),
    screenshotRoot: path.join(
      projectRoot,
      "output",
      "playwright",
      "g4-l3-current-js-readability-v3-3",
    ),
  }),
  "v3-3-r2": Object.freeze({
    id: "v3-3-r2",
    version: "v3.3-r2",
    reportType: v33R2ReportType,
    title: "G4 L3 current-JS readability v3.3-r2",
    defaultBaseUrl: "http://127.0.0.1:3219",
    jsonOutput: path.join(
      projectRoot,
      "reports",
      "g4-l3-current-js-readability-v3-3-r2.json",
    ),
    markdownOutput: path.join(
      projectRoot,
      "reports",
      "g4-l3-current-js-readability-v3-3-r2.md",
    ),
    screenshotRoot: path.join(
      projectRoot,
      "output",
      "playwright",
      "g4-l3-current-js-readability-v3-3-r2",
    ),
  }),
});
const progressPath = "reports/g4-l3-current-javascript-progress.json";
const navigationContractPath =
  "reports/g4-l3-lesson-product-navigation-contract.json";
const readableAssetsManifestPath =
  "public/flash-assets/courses/course-g04-l03-ts-008/readable-view/readable-view-assets.json";
const ts08RendererPath =
  "public/flash-assets/courses/course-g04-l03-ts-008/canvas-renderer.js";
const expectedTs08RendererSha256 =
  "30d1272b3ce20cbf8ecbe76219351b78336bf24a71e921ae63bf48174fb267e6";
const page36AnimationId = "course-g04-l03-ts-008";
const sha256Pattern = /^[a-f0-9]{64}$/;

export const READABILITY_PROFILES = Object.freeze([
  Object.freeze({
    id: "desktop-1440x900",
    viewport: Object.freeze({width: 1440, height: 900}),
    equivalence: "native browser CSS pixels",
  }),
  Object.freeze({
    id: "tablet-1024x768",
    viewport: Object.freeze({width: 1024, height: 768}),
    equivalence: "native browser CSS pixels",
  }),
  Object.freeze({
    id: "mobile-390x844",
    viewport: Object.freeze({width: 390, height: 844}),
    equivalence: "native browser CSS pixels",
  }),
  Object.freeze({
    id: "reflow-200-percent-720x450",
    viewport: Object.freeze({width: 720, height: 450}),
    equivalence:
      "1440x900 reference viewport expressed as 720x450 CSS pixels, equivalent to 200% zoom reflow",
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function relative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function absolute(projectPath) {
  const resolved = path.resolve(projectRoot, projectPath);
  const rel = path.relative(projectRoot, resolved);
  invariant(
    rel !== ".."
      && !rel.startsWith(`..${path.sep}`)
      && !path.isAbsolute(rel),
    `Path escapes project: ${projectPath}`,
  );
  return resolved;
}

async function readJson(projectPath) {
  return JSON.parse(await readFile(absolute(projectPath), "utf8"));
}

async function bindFile(projectPath) {
  const bytes = await readFile(absolute(projectPath));
  return {path: projectPath, bytes: bytes.length, sha256: sha256(bytes)};
}

export function validateReadabilityBaseUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid --base-url: ${value}`);
  }
  invariant(parsed.protocol === "http:", "Readability QA requires local HTTP");
  invariant(
    ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname),
    "Readability QA may target only a loopback host",
  );
  invariant(
    parsed.username === "" && parsed.password === "",
    "Readability QA URL must not contain credentials",
  );
  invariant(
    parsed.pathname === "/" && parsed.search === "" && parsed.hash === "",
    "Readability QA base URL must not include a path, query, or fragment",
  );
  return parsed.origin;
}

export function validateReadabilityScreenshotRoot(value) {
  const resolved = path.resolve(projectRoot, value);
  const rel = relative(resolved);
  const parts = rel.split("/");
  invariant(
    !path.isAbsolute(rel)
      && rel !== ".."
      && !rel.startsWith("../")
      && parts[0] === "output"
      && parts[1] === "playwright"
      && parts.length >= 3
      && parts.at(-1) !== "",
    "Readability screenshot root must be a dedicated project-contained output/playwright subdirectory",
  );
  return resolved;
}

export function parseReadabilityArguments(argv) {
  const options = {
    artifactVersion: "v3",
    baseUrl: null,
    jsonOutput: null,
    markdownOutput: null,
    screenshotRoot: null,
    check: false,
  };
  let baseUrlExplicit = false;
  let jsonOutputExplicit = false;
  let markdownOutputExplicit = false;
  let screenshotRootExplicit = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") {
      options.check = true;
      continue;
    }
    if (
      ![
        "--artifact-version",
        "--base-url",
        "--json-output",
        "--markdown-output",
        "--screenshot-root",
      ].includes(value)
    ) {
      throw new Error(`Unknown option: ${value}`);
    }
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
  }
  const artifactVariant = READABILITY_ARTIFACT_VARIANTS[options.artifactVersion];
  invariant(
    artifactVariant,
    `Unsupported --artifact-version: ${options.artifactVersion}`,
  );
  if (!baseUrlExplicit) options.baseUrl = artifactVariant.defaultBaseUrl;
  if (!jsonOutputExplicit) options.jsonOutput = artifactVariant.jsonOutput;
  if (!markdownOutputExplicit) {
    options.markdownOutput = artifactVariant.markdownOutput;
  }
  if (!screenshotRootExplicit) {
    options.screenshotRoot = artifactVariant.screenshotRoot;
  }
  options.baseUrl = validateReadabilityBaseUrl(options.baseUrl);
  options.screenshotRoot = validateReadabilityScreenshotRoot(
    options.screenshotRoot,
  );
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

export async function assertV33ReadabilityTargetsAbsent(options) {
  if (options.check) return;
  invariant(
    options.artifactVersion !== "v3-3",
    "v3.3 readability generation is frozen after its immutable attempt; use --check or generate the v3-3-r2 successor",
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
    `v3.3-r2 readability generation is immutable; refusing to overwrite existing artifact target(s): ${existing.join(", ")}`,
  );
}

async function prepareReadabilityScreenshotRoot(options) {
  invariant(
    options.artifactVersion !== "v3-3",
    "v3.3 readability screenshot root is frozen and may not be prepared or replaced",
  );
  if (options.artifactVersion === "v3-3-r2") {
    await mkdir(path.dirname(options.screenshotRoot), {recursive: true});
    await mkdir(options.screenshotRoot);
    return;
  }
  await rm(options.screenshotRoot, {recursive: true, force: true});
  await mkdir(options.screenshotRoot, {recursive: true});
}

async function writeGeneratedArtifact(target, content, artifactVersion) {
  await mkdir(path.dirname(target), {recursive: true});
  invariant(
    artifactVersion !== "v3-3",
    "v3.3 readability artifacts are frozen and may not be written",
  );
  if (artifactVersion === "v3-3-r2") {
    await writeFile(target, content, {flag: "wx"});
    return;
  }
  await writeFile(target, content);
}

function timelineDomain(candidate) {
  if (
    typeof candidate?.timeline?.main?.frameDomain === "string"
    && Number.isInteger(candidate?.timeline?.main?.frameCount)
  ) {
    return {
      frameDomain: candidate.timeline.main.frameDomain,
      frameCount: candidate.timeline.main.frameCount,
    };
  }
  if (
    typeof candidate?.timeline?.local?.timelineId === "string"
    && Number.isInteger(candidate?.timeline?.local?.frameCount)
  ) {
    return {
      frameDomain: candidate.timeline.local.timelineId,
      frameCount: candidate.timeline.local.frameCount,
    };
  }
  return {
    frameDomain: "root",
    frameCount: Math.max(1, candidate?.timeline?.root?.frameCount ?? 1),
  };
}

export function chooseRepresentativeFrame({
  animationId,
  candidate,
}) {
  const domain = timelineDomain(candidate);
  if (animationId === page36AnimationId) {
    return {
      frameDomain: "sprite-350",
      frame: 789,
      declaredFrameCount: 789,
      selection:
        "v3-readable-view-source-frame-required-by-hash-bound-specification",
    };
  }
  const firstExactStopFrame =
    candidate?.autoplayEvidence?.firstExactStopFrame;
  if (
    Number.isInteger(firstExactStopFrame)
    && firstExactStopFrame >= 1
    && firstExactStopFrame <= domain.frameCount
  ) {
    return {
      ...domain,
      frame: firstExactStopFrame,
      declaredFrameCount: domain.frameCount,
      selection: "first-exact-source-stop",
    };
  }
  return {
    ...domain,
    frame: domain.frameCount,
    declaredFrameCount: domain.frameCount,
    selection: "declared-current-js-domain-terminal",
  };
}

function normalizeRect(rect, label) {
  const normalized = {
    x: Number(rect?.x),
    y: Number(rect?.y),
    width: Number(rect?.width ?? rect?.w),
    height: Number(rect?.height ?? rect?.h),
  };
  invariant(
    Object.values(normalized).every(
      (value) => Number.isInteger(value) && value >= 0,
    ),
    `${label} is not an integer pixel rectangle`,
  );
  invariant(
    normalized.width > 0 && normalized.height > 0,
    `${label} is empty`,
  );
  return normalized;
}

function normalizeProjectAsset(asset, label) {
  const assetPath = asset?.path?.startsWith("/")
    ? `public${asset.path}`
    : asset?.path;
  invariant(
    typeof assetPath === "string"
      && assetPath.startsWith(
        "public/flash-assets/courses/course-g04-l03-ts-008/readable-view/",
      )
      && assetPath.endsWith(".png"),
    `${label} asset path is outside the Page 36 readable-view root`,
  );
  invariant(
    Number.isInteger(asset?.bytes) && asset.bytes > 0,
    `${label} asset byte count is invalid`,
  );
  invariant(
    sha256Pattern.test(asset?.sha256 ?? ""),
    `${label} asset SHA-256 is invalid`,
  );
  return {
    path: assetPath,
    bytes: asset.bytes,
    sha256: asset.sha256,
  };
}

export function normalizeReadabilityEnhancement(
  manifest,
  {sourceBytes} = {},
) {
  const splitManifest = Boolean(manifest?.source?.swf);
  const source = splitManifest
    ? manifest.source.swf
    : (manifest?.source ?? manifest?.sourceSwf);
  const presentation = splitManifest
    ? manifest.presentation
    : manifest;
  const transcriptById = new Map(
    (manifest?.transcriptBinding ?? []).map((binding) => [
      binding.id,
      binding,
    ]),
  );
  const sourceCrops = splitManifest
    ? manifest?.files?.crops
    : manifest?.crops;
  const normalized = {
    pageOrdinal: Number(manifest?.pageOrdinal ?? 36),
    animationId: splitManifest
      ? manifest?.source?.animationId
      : manifest?.animationId,
    source: {
      path: source?.path,
      bytes: Number(source?.bytes ?? sourceBytes),
      sha256: source?.sha256,
    },
    frameDomain: splitManifest
      ? manifest?.source?.frameDomain
      : manifest?.frameDomain,
    frame: Number(
      splitManifest ? manifest?.source?.frame : manifest?.frame,
    ),
    nativePaddingPixels: Number(presentation?.nativePaddingPixels),
    desktopScale: Number(presentation?.desktopScale),
    crops: (sourceCrops ?? []).map((crop) => {
      const transcript = transcriptById.get(crop?.id) ?? crop;
      return {
      id: crop?.id,
      sourceRect: normalizeRect(crop?.sourceRect, `${crop?.id} sourceRect`),
      paddedCropRect: normalizeRect(
        crop?.paddedCropRect,
        `${crop?.id} paddedCropRect`,
      ),
      asset: normalizeProjectAsset(crop?.asset ?? crop, crop?.id),
      sourceCharacterIds: [
        ...(transcript?.sourceCharacterIds ?? []),
      ].map(Number),
      transcriptSha256: transcript?.transcriptSha256,
    };
    }),
    defaultExpanded: presentation?.defaultExpanded,
    originalLayoutPreserved: splitManifest
      ? presentation?.originalStageRemainsVisible
      : manifest?.originalLayoutPreserved,
    strictAcceptanceEffect: presentation?.strictAcceptanceEffect,
  };
  invariant(
    normalized.pageOrdinal === 36
      && normalized.animationId === page36AnimationId,
    "readable-view manifest must bind G4 L3 Page 36",
  );
  invariant(
    normalized.source.path
      === "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS08.swf"
      && Number.isInteger(normalized.source.bytes)
      && normalized.source.bytes > 0
      && normalized.source.sha256
        === "9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885",
    "readable-view manifest source SWF identity drifted",
  );
  invariant(
    normalized.frameDomain === "sprite-350"
      && normalized.frame === 789
      && normalized.nativePaddingPixels === 4
      && normalized.desktopScale === 2.5,
    "readable-view frame, padding, or scale drifted",
  );
  invariant(
    normalized.defaultExpanded === true
      && normalized.originalLayoutPreserved === true
      && normalized.strictAcceptanceEffect === "none",
    "readable-view behavior or strict-acceptance boundary drifted",
  );
  invariant(
    normalized.crops.length === 2
      && normalized.crops[0]?.id === "step-3"
      && normalized.crops[1]?.id === "step-4",
    "readable-view manifest must contain ordered Step 3 and Step 4 crops",
  );
  const [step3, step4] = normalized.crops;
  invariant(
    JSON.stringify(step3.sourceRect)
      === JSON.stringify({x: 292, y: 147, width: 236, height: 149})
      && JSON.stringify(step3.paddedCropRect)
        === JSON.stringify({x: 288, y: 143, width: 244, height: 157})
      && JSON.stringify(step3.sourceCharacterIds)
        === JSON.stringify([99, 100, 101, 133]),
    "Step 3 readable crop binding drifted",
  );
  invariant(
    JSON.stringify(step4.sourceRect)
      === JSON.stringify({x: 292, y: 296, width: 236, height: 191})
      && JSON.stringify(step4.paddedCropRect)
        === JSON.stringify({x: 288, y: 292, width: 244, height: 199})
      && JSON.stringify(step4.sourceCharacterIds)
        === JSON.stringify([144, 145, 146, 147, 148, 149, 150, 151, 152]),
    "Step 4 readable crop binding drifted",
  );
  for (const crop of normalized.crops) {
    invariant(
      sha256Pattern.test(crop.transcriptSha256 ?? ""),
      `${crop.id} transcript SHA-256 is invalid`,
    );
  }
  return normalized;
}

async function loadScope() {
  const [progress, navigationContract, readableManifest] = await Promise.all([
    readJson(progressPath),
    readJson(navigationContractPath),
    readJson(readableAssetsManifestPath),
  ]);
  invariant(progress?.pages?.length === 39, "current-JS progress must list 39 pages");
  invariant(
    navigationContract?.pages?.length === 39,
    "navigation contract must list 39 pages",
  );
  const readableSourcePath =
    readableManifest?.source?.swf?.path
    ?? readableManifest?.source?.path;
  invariant(
    typeof readableSourcePath === "string",
    "readable-view manifest source SWF path is missing",
  );
  const readableSource = await bindFile(readableSourcePath);
  const readableEnhancements = normalizeReadabilityEnhancement(
    readableManifest,
    {sourceBytes: readableSource.bytes},
  );
  invariant(
    readableEnhancements.source.sha256 === readableSource.sha256,
    "readable-view source SWF file hash drifted",
  );
  const renderer = await bindFile(ts08RendererPath);
  invariant(
    renderer.sha256 === expectedTs08RendererSha256,
    "TS08 generated renderer frozen SHA-256 drifted",
  );
  const pages = [];
  for (const page of progress.pages) {
    const contractPage = navigationContract.pages.find(
      ({animationId}) => animationId === page.animationId,
    );
    invariant(
      contractPage?.globalPageOrdinal === page.globalPageOrdinal,
      `navigation contract mismatch for ${page.animationId}`,
    );
    const candidateReportPath =
      page.currentJavaScript?.candidateReport?.path;
    invariant(
      typeof candidateReportPath === "string",
      `candidate report missing for ${page.animationId}`,
    );
    const candidate = await readJson(candidateReportPath);
    pages.push({
      animationId: page.animationId,
      globalPageOrdinal: page.globalPageOrdinal,
      sectionCode: page.sectionCode,
      representative: chooseRepresentativeFrame({
        animationId: page.animationId,
        candidate,
      }),
      candidateReport: await bindFile(candidateReportPath),
    });
  }
  return {
    pages,
    readableEnhancements,
    sourceBindings: {
      generator: await bindFile(
        "scripts/qa-g4-l3-current-js-readability-v3.mjs",
      ),
      currentJavascriptProgress: await bindFile(progressPath),
      navigationContract: await bindFile(navigationContractPath),
      readableAssetsManifest: await bindFile(readableAssetsManifestPath),
      readableViewComponent: await bindFile(
        "apps/web/components/g4-l3-readable-view.tsx",
      ),
      readableViewSpec: await bindFile(
        "apps/web/lib/g4-l3-readable-view.ts",
      ),
      wholeLessonPlayer: await bindFile(
        "apps/web/components/g4-l3-whole-lesson-player.tsx",
      ),
      globalStyles: await bindFile("apps/web/app/globals.css"),
      ts08GeneratedRenderer: renderer,
    },
  };
}

function makeMonitor(page, baseUrl) {
  const events = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
  };
  page.on("console", (message) => {
    if (message.type() === "error") events.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => events.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (!url.startsWith(baseUrl)) return;
    const error = request.failure()?.errorText ?? "unknown";
    const parsed = new URL(url);
    if (error === "net::ERR_ABORTED" && parsed.searchParams.has("_rsc")) return;
    events.failedRequests.push({url: parsed.pathname, error});
  });
  page.on("response", (response) => {
    if (!response.url().startsWith(baseUrl) || response.status() < 400) return;
    const parsed = new URL(response.url());
    events.badResponses.push({url: parsed.pathname, status: response.status()});
  });
  return events;
}

function monitorIssues(events) {
  return [
    ...events.consoleErrors.map((detail) => ({
      severity: "P0",
      kind: "console-error",
      detail,
    })),
    ...events.pageErrors.map((detail) => ({
      severity: "P0",
      kind: "page-error",
      detail,
    })),
    ...events.failedRequests.map((detail) => ({
      severity: "P0",
      kind: "request-failure",
      detail: JSON.stringify(detail),
    })),
    ...events.badResponses.map((detail) => ({
      severity: "P0",
      kind: "http-error",
      detail: JSON.stringify(detail),
    })),
  ];
}

function clearMonitor(events) {
  for (const values of Object.values(events)) values.length = 0;
}

function snapshotMonitor(events) {
  return Object.fromEntries(
    Object.entries(events).map(([key, values]) => [
      key,
      structuredClone(values),
    ]),
  );
}

async function screenshotBinding(locator, outputPath) {
  await mkdir(path.dirname(outputPath), {recursive: true});
  await locator.screenshot({path: outputPath});
  const bytes = await readFile(outputPath);
  return {
    path: relative(outputPath),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function buildAnimationRoute(pagePlan) {
  const query = new URLSearchParams({
    auditContext: "g4-l3-readability-v3",
    frameDomain: pagePlan.representative.frameDomain,
    frame: String(pagePlan.representative.frame),
    lang: "en",
    seed: "0",
  });
  return `/animations/${pagePlan.animationId}?${query}`;
}

async function observeDirectRuntime(
  page,
  baseUrl,
  pagePlan,
  profile,
  screenshotRoot,
  events,
) {
  clearMonitor(events);
  const route = buildAnimationRoute(pagePlan);
  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const stage = page.locator(
    `.runtime-stage[data-animation-id="${pagePlan.animationId}"]`,
  );
  await stage.waitFor({state: "visible", timeout: 60_000});
  await stage.locator("> *").first().waitFor({
    state: "visible",
    timeout: 60_000,
  });
  await page.addStyleTag({
    content:
      "*,*::before,*::after{caret-color:transparent!important;animation:none!important;transition:none!important}",
  });
  await page.waitForTimeout(80);
  const layout = await stage.evaluate((element) => {
    const rectangle = element.getBoundingClientRect();
    const documentElement = document.documentElement;
    const parentRectangle = element.parentElement?.getBoundingClientRect();
    return {
      documentClientWidth: documentElement.clientWidth,
      documentScrollWidth: documentElement.scrollWidth,
      horizontalOverflowPx: Math.max(
        0,
        documentElement.scrollWidth - documentElement.clientWidth,
      ),
      stage: {
        left: rectangle.left,
        right: rectangle.right,
        top: rectangle.top,
        bottom: rectangle.bottom,
        width: rectangle.width,
        height: rectangle.height,
      },
      parent: parentRectangle
        ? {
            left: parentRectangle.left,
            right: parentRectangle.right,
            top: parentRectangle.top,
            bottom: parentRectangle.bottom,
          }
        : null,
      clippedByParentPx: parentRectangle
        ? Math.max(
            0,
            parentRectangle.left - rectangle.left,
            rectangle.right - parentRectangle.right,
          )
        : 0,
      runtimeUnavailableCount:
        element.closest(".runtime-shell")
          ?.querySelectorAll(
            ".runtime-unavailable,[data-runtime-domain-error]",
          ).length ?? 0,
      visibleCanvasOrSvgCount:
        element.querySelectorAll("canvas,svg,img").length,
    };
  });
  const identity = await stage.evaluate((element) => ({
    animationId: element.getAttribute("data-animation-id"),
    module: element.getAttribute("data-animation-module"),
    frameDomain: element.getAttribute("data-flash-frame-domain"),
    frame: Number(element.getAttribute("data-flash-frame")),
    language: element.getAttribute("data-runtime-language"),
  }));
  const runtimeEvents = snapshotMonitor(events);
  const issues = monitorIssues(runtimeEvents);
  if (response?.status() !== 200) {
    issues.push({
      severity: "P0",
      kind: "http-status",
      detail: `animation route returned ${response?.status() ?? "no response"}`,
    });
  }
  if (
    identity.animationId !== pagePlan.animationId
    || identity.module !== pagePlan.animationId
    || identity.frameDomain !== pagePlan.representative.frameDomain
    || identity.frame !== pagePlan.representative.frame
    || identity.language !== "en"
  ) {
    issues.push({
      severity: "P0",
      kind: "representative-frame-identity",
      detail: `expected ${pagePlan.animationId} ${pagePlan.representative.frameDomain}:${pagePlan.representative.frame}; observed ${identity.animationId} ${identity.frameDomain}:${identity.frame}`,
    });
  }
  if (
    layout.runtimeUnavailableCount > 0
    || layout.visibleCanvasOrSvgCount === 0
  ) {
    issues.push({
      severity: "P0",
      kind: "core-renderer-unavailable",
      detail: `unavailable=${layout.runtimeUnavailableCount}; visual elements=${layout.visibleCanvasOrSvgCount}`,
    });
  }
  if (layout.horizontalOverflowPx > 1 || layout.clippedByParentPx > 1) {
    issues.push({
      severity: "P1",
      kind: "stage-overflow-or-clipping",
      detail: `document overflow=${layout.horizontalOverflowPx}px; parent clipping=${layout.clippedByParentPx}px`,
    });
  }
  const screenshot = await screenshotBinding(
    stage,
    path.join(
      screenshotRoot,
      profile.id,
      "pages",
      `${String(pagePlan.globalPageOrdinal).padStart(2, "0")}-${pagePlan.animationId}-frame-${pagePlan.representative.frame}.png`,
    ),
  );
  return {
    route,
    responseStatus: response?.status() ?? null,
    identity,
    layout,
    screenshot,
    runtimeEvents,
    issues,
  };
}

async function closeCourseMapIfOpen(page) {
  const panel = page.locator(".lesson-shell2__side-panel--map");
  if (await panel.isVisible()) {
    await panel.locator('[data-course-map-close-control="true"]').click();
    await panel.waitFor({state: "hidden", timeout: 10_000});
  }
}

async function observeReadableView(page, readableEnhancements) {
  const selector =
    '[data-modern-enhancement="source-bound-readable-view"]';
  const enhancement = page.locator(selector);
  const count = await enhancement.count();
  if (count !== 1) {
    return {
      count,
      visible: false,
      passed: false,
      failures: [`readable-view count is ${count}`],
    };
  }
  const observation = await enhancement.evaluate((element) => {
    const transcript = element.querySelector(
      '[data-readable-transcript][lang="en"]',
    );
    const transcriptNodes = transcript
      ? [...transcript.querySelectorAll("p,li,dd")]
      : [];
    const computedFontSizes = transcriptNodes.map((node) =>
      Number.parseFloat(getComputedStyle(node).fontSize));
    const images = [...element.querySelectorAll("img")];
    const rectangle = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      visible:
        rectangle.width > 0
        && rectangle.height > 0
        && style.display !== "none"
        && style.visibility !== "hidden",
      sourceAnimationId: element.getAttribute("data-source-animation-id"),
      sourceFrame: Number(element.getAttribute("data-source-frame")),
      frameDomain: element.getAttribute("data-frame-domain"),
      strictAcceptanceEffect:
        element.getAttribute("data-strict-acceptance-effect"),
      originalLayoutPreserved:
        element.getAttribute("data-original-layout-preserved"),
      expanded:
        element.getAttribute("data-expanded")
        ?? element.querySelector("button[aria-expanded]")
          ?.getAttribute("aria-expanded")
        ?? null,
      transcript: {
        present: transcript !== null,
        lang: transcript?.getAttribute("lang") ?? null,
        textLength: (transcript?.textContent ?? "").trim().length,
        minimumComputedFontSizePx:
          computedFontSizes.length > 0
            ? Math.min(...computedFontSizes)
            : null,
        hashes: [...element.querySelectorAll("[data-transcript-sha256]")]
          .map((node) => node.getAttribute("data-transcript-sha256"))
          .filter(Boolean),
      },
      images: images.map((image) => ({
        src: image.getAttribute("src"),
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      })),
    };
  });
  const expectedTranscriptHashes = readableEnhancements.crops.map(
    ({transcriptSha256}) => transcriptSha256,
  );
  const failures = [];
  if (!observation.visible) failures.push("readable-view is not visible");
  if (observation.sourceAnimationId !== page36AnimationId) {
    failures.push("readable-view source animation identity drifted");
  }
  if (
    observation.sourceFrame !== 789
    || observation.frameDomain !== "sprite-350"
  ) {
    failures.push("readable-view frame identity drifted");
  }
  if (observation.strictAcceptanceEffect !== "none") {
    failures.push("readable-view strict acceptance effect was promoted");
  }
  if (observation.originalLayoutPreserved !== "true") {
    failures.push("readable-view does not declare original layout preserved");
  }
  if (observation.expanded !== "true") {
    failures.push("readable-view is not default-expanded");
  }
  if (
    !observation.transcript.present
    || observation.transcript.lang !== "en"
    || observation.transcript.textLength < 100
  ) {
    failures.push("exact English DOM transcript is missing or empty");
  }
  if (
    !Number.isFinite(observation.transcript.minimumComputedFontSizePx)
    || observation.transcript.minimumComputedFontSizePx < 16
  ) {
    failures.push("English DOM transcript is rendered below 16px");
  }
  if (
    JSON.stringify(observation.transcript.hashes)
      !== JSON.stringify(expectedTranscriptHashes)
  ) {
    failures.push("DOM transcript hashes differ from readable assets manifest");
  }
  if (
    observation.images.length !== 2
    || observation.images.some(
      ({complete, naturalWidth, naturalHeight}) =>
        !complete || naturalWidth <= 0 || naturalHeight <= 0,
    )
  ) {
    failures.push("readable-view crop images are incomplete");
  }
  return {
    count,
    ...observation,
    passed: failures.length === 0,
    failures,
  };
}

async function exerciseReadableViewInteractions(page) {
  const root = page.locator(
    '[data-modern-enhancement="source-bound-readable-view"]',
  );
  const toggle = root.locator("[data-readable-view-toggle]");
  const state = async () => ({
    expanded: await toggle.getAttribute("aria-expanded"),
    contentCount: await root.locator(".g4-l3-readable-view__content").count(),
    focusOnToggle: await toggle.evaluate(
      (element) => document.activeElement === element,
    ),
  });
  const steps = [];
  const failures = [];
  const expectState = (step, observed, expanded) => {
    const passed = observed.expanded === (expanded ? "true" : "false")
      && observed.contentCount === (expanded ? 1 : 0);
    steps.push({step, ...observed, passed});
    if (!passed) failures.push(`${step} did not set expanded=${expanded}`);
  };

  await toggle.click();
  await page.waitForTimeout(20);
  expectState("click-collapse", await state(), false);
  await toggle.click();
  await page.waitForTimeout(20);
  expectState("click-expand", await state(), true);

  await toggle.focus();
  await toggle.press("Enter");
  await page.waitForTimeout(20);
  expectState("enter-collapse", await state(), false);
  await toggle.press("Enter");
  await page.waitForTimeout(20);
  expectState("enter-expand", await state(), true);

  await toggle.focus();
  await toggle.press("Space");
  await page.waitForTimeout(20);
  expectState("space-collapse", await state(), false);
  await toggle.press("Space");
  await page.waitForTimeout(20);
  expectState("space-expand", await state(), true);

  const transcript = root.locator("[data-readable-transcript]").first();
  await transcript.evaluate((element) => {
    element.setAttribute("tabindex", "-1");
    element.focus();
  });
  await transcript.press("Escape");
  await page.waitForTimeout(20);
  const escapeState = await state();
  const escapePassed = escapeState.expanded === "false"
    && escapeState.contentCount === 0
    && escapeState.focusOnToggle;
  steps.push({
    step: "escape-collapse-and-focus-restore",
    ...escapeState,
    passed: escapePassed,
  });
  if (!escapePassed) {
    failures.push(
      "Escape did not collapse the panel and restore focus to its toggle",
    );
  }

  await toggle.click();
  await page.waitForTimeout(20);
  const restoredDefaultState = await state();
  const restored = restoredDefaultState.expanded === "true"
    && restoredDefaultState.contentCount === 1;
  steps.push({
    step: "restore-expanded-after-audit",
    ...restoredDefaultState,
    passed: restored,
  });
  if (!restored) failures.push("audit did not restore the expanded view");

  return {
    inputMethods: ["click", "Enter", "Space", "Escape"],
    focusRestoredAfterEscape: escapeState.focusOnToggle,
    steps,
    passed: failures.length === 0,
    failures,
  };
}

async function observeWholeLessonLayout(
  coursePage,
  pagePlan,
  profile,
  screenshotRoot,
  readableEnhancements,
) {
  const playerSelector = '[data-lesson-player="g4-l3-whole-lesson-mvp"]';
  await coursePage.locator(".lesson-shell2__page-picker select").selectOption(
    pagePlan.animationId,
    {force: true},
  );
  await coursePage.locator(
    `${playerSelector}[data-current-animation-id="${pagePlan.animationId}"][data-current-page="${pagePlan.globalPageOrdinal}"]`,
  ).waitFor({state: "visible", timeout: 60_000});
  await coursePage.locator(
    `${playerSelector} .runtime-stage[data-animation-id="${pagePlan.animationId}"] > *`,
  ).first().waitFor({state: "visible", timeout: 60_000});
  await closeCourseMapIfOpen(coursePage);
  await coursePage.waitForTimeout(40);
  const layout = await coursePage.locator(playerSelector).evaluate((element) => {
    const documentElement = document.documentElement;
    const stages = [...element.querySelectorAll(".runtime-stage")];
    const stage = stages[0] ?? null;
    const stageRectangle = stage?.getBoundingClientRect() ?? null;
    const legacyStage = element.querySelector(".lesson-shell2__legacy-stage");
    const legacyRectangle = legacyStage?.getBoundingClientRect() ?? null;
    const criticalControls = [
      ...element.querySelectorAll(
        ".lesson-shell2__page-picker,.lesson-shell2__section-tabs,.lesson-shell2__learning-actions button",
      ),
    ].map((control) => {
      const rectangle = control.getBoundingClientRect();
      return {
        left: rectangle.left,
        right: rectangle.right,
        width: rectangle.width,
        visible:
          rectangle.width > 0
          && rectangle.height > 0
          && getComputedStyle(control).visibility !== "hidden",
      };
    });
    return {
      documentClientWidth: documentElement.clientWidth,
      documentScrollWidth: documentElement.scrollWidth,
      horizontalOverflowPx: Math.max(
        0,
        documentElement.scrollWidth - documentElement.clientWidth,
      ),
      playerScrollOverflowPx: Math.max(
        0,
        element.scrollWidth - element.clientWidth,
      ),
      runtimeShellCount: element.querySelectorAll(".runtime-shell").length,
      runtimeStageCount: stages.length,
      primaryRuntimeCount: stages.filter((candidate) => {
        const rectangle = candidate.getBoundingClientRect();
        const style = getComputedStyle(candidate);
        return rectangle.width > 0
          && rectangle.height > 0
          && style.display !== "none"
          && style.visibility !== "hidden";
      }).length,
      runtimeAnimationId: stage?.getAttribute("data-animation-id") ?? null,
      unavailableCount: element.querySelectorAll(
        ".runtime-unavailable,[data-runtime-domain-error]",
      ).length,
      stageClippedPx:
        stageRectangle && legacyRectangle
          ? Math.max(
              0,
              legacyRectangle.left - stageRectangle.left,
              stageRectangle.right - legacyRectangle.right,
              legacyRectangle.top - stageRectangle.top,
              stageRectangle.bottom - legacyRectangle.bottom,
            )
          : 0,
      criticalControlHorizontalClipCount: criticalControls.filter(
        ({left, right, visible}) =>
          visible && (left < -1 || right > documentElement.clientWidth + 1),
      ).length,
      pageHeadingText:
        element.querySelector(".lesson-shell2__lesson-heading h1")
          ?.textContent?.trim()
        ?? element.querySelector("h1")?.textContent?.trim()
        ?? "",
      pageHeadingPresent:
        Boolean(element.querySelector("h1")?.textContent?.trim()),
      originalLegacyStageVisible: legacyRectangle
        ? legacyRectangle.width > 0
          && legacyRectangle.height > 0
          && getComputedStyle(legacyStage).visibility !== "hidden"
        : false,
      unexpectedReadableViewCount:
        element.querySelectorAll(
          '[data-modern-enhancement="source-bound-readable-view"]',
        ).length,
    };
  });
  const issues = [];
  if (
    layout.runtimeShellCount !== 1
    || layout.runtimeStageCount !== 1
    || layout.primaryRuntimeCount !== 1
    || layout.runtimeAnimationId !== pagePlan.animationId
    || layout.unavailableCount > 0
  ) {
    issues.push({
      severity: "P0",
      kind: "whole-lesson-primary-runtime",
      detail: `shells=${layout.runtimeShellCount}; stages=${layout.runtimeStageCount}; primary=${layout.primaryRuntimeCount}; runtime=${layout.runtimeAnimationId}; unavailable=${layout.unavailableCount}`,
    });
  }
  if (
    layout.horizontalOverflowPx > 1
    || layout.playerScrollOverflowPx > 1
    || layout.stageClippedPx > 1
    || layout.criticalControlHorizontalClipCount > 0
  ) {
    issues.push({
      severity: "P1",
      kind: "whole-lesson-overflow-or-clipping",
      detail: `document=${layout.horizontalOverflowPx}px; player=${layout.playerScrollOverflowPx}px; stage=${layout.stageClippedPx}px; clipped controls=${layout.criticalControlHorizontalClipCount}`,
    });
  }
  if (!layout.pageHeadingPresent) {
    issues.push({
      severity: "P1",
      kind: "accessible-page-heading",
      detail: "whole-lesson page heading is missing",
    });
  }
  let readableView = null;
  let readableScreenshot = null;
  if (pagePlan.globalPageOrdinal === 36) {
    readableView = await observeReadableView(
      coursePage,
      readableEnhancements,
    );
    if (!layout.originalLegacyStageVisible) {
      readableView.failures.push("original Page 36 stage is not visible");
      readableView.passed = false;
    }
    for (const failure of readableView.failures) {
      issues.push({
        severity: "P1",
        kind: "page-36-readable-view",
        detail: failure,
      });
    }
    if (readableView.count === 1) {
      readableScreenshot = await screenshotBinding(
        coursePage.locator(
          '[data-modern-enhancement="source-bound-readable-view"]',
        ),
        path.join(
          screenshotRoot,
          profile.id,
          "page-36-readable-view.png",
        ),
      );
      readableView.interactions =
        await exerciseReadableViewInteractions(coursePage);
      if (!readableView.interactions.passed) {
        readableView.passed = false;
        readableView.failures.push(
          ...readableView.interactions.failures.map(
            (failure) => `interaction: ${failure}`,
          ),
        );
        for (const failure of readableView.interactions.failures) {
          issues.push({
            severity: "P1",
            kind: "page-36-readable-view-interaction",
            detail: failure,
          });
        }
      }
    }
  } else if (layout.unexpectedReadableViewCount !== 0) {
    issues.push({
      severity: "P1",
      kind: "readable-view-scope-leak",
      detail: `Page ${pagePlan.globalPageOrdinal} exposes ${layout.unexpectedReadableViewCount} Page 36 readable views`,
    });
  }
  return {
    layout,
    readableView,
    readableScreenshot,
    accessibilityText: pagePlan.globalPageOrdinal === 36
      ? {
          status: readableView?.passed
            ? "exact-english-dom-transcript-source-hash-bound"
            : "missing-or-invalid-required-transcript",
          required: true,
        }
      : {
          status:
            "page-heading-present-canvas-content-semantics-not-established-by-automated-screening",
          required: false,
        },
    issues,
  };
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function buildContactSheet(
  profile,
  pageObservations,
  screenshotRoot,
) {
  const columns = 5;
  const rows = Math.ceil(pageObservations.length / columns);
  const cellWidth = 240;
  const imageHeight = 180;
  const labelHeight = 34;
  const cellHeight = imageHeight + labelHeight;
  const composites = [];
  for (const [index, observation] of pageObservations.entries()) {
    const left = (index % columns) * cellWidth;
    const top = Math.floor(index / columns) * cellHeight;
    const image = await sharp(absolute(observation.direct.screenshot.path))
      .resize(cellWidth, imageHeight, {
        fit: "contain",
        background: "#ffffff",
      })
      .png()
      .toBuffer();
    const label = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${cellWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#edf4ff"/><text x="8" y="14" fill="#0a3268" font-family="Arial,sans-serif" font-size="11" font-weight="700">${String(observation.globalPageOrdinal).padStart(2, "0")} · ${xmlEscape(observation.sectionCode)} · frame ${observation.inspectedFrame}</text><text x="8" y="28" fill="#375a80" font-family="Arial,sans-serif" font-size="9">${xmlEscape(observation.animationId)}</text></svg>`,
    );
    composites.push({input: image, left, top});
    composites.push({input: label, left, top: top + imageHeight});
  }
  const outputPath = path.join(
    screenshotRoot,
    `contact-sheet-${profile.id}.png`,
  );
  await mkdir(path.dirname(outputPath), {recursive: true});
  await sharp({
    create: {
      width: columns * cellWidth,
      height: rows * cellHeight,
      channels: 4,
      background: "#d9e8fb",
    },
  }).composite(composites).png().toFile(outputPath);
  return bindFile(relative(outputPath));
}

function severityFor(issues) {
  if (issues.some(({severity}) => severity === "P0")) return "P0";
  if (issues.some(({severity}) => severity === "P1")) return "P1";
  return "none";
}

async function inspectProfile(
  browser,
  options,
  profile,
  scope,
) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    reducedMotion: "reduce",
  });
  const capturePage = await context.newPage();
  const coursePage = await context.newPage();
  const captureEvents = makeMonitor(capturePage, options.baseUrl);
  const courseEvents = makeMonitor(coursePage, options.baseUrl);
  try {
    const response = await coursePage.goto(
      `${options.baseUrl}/courses/4/3`,
      {waitUntil: "domcontentloaded", timeout: 60_000},
    );
    invariant(
      response?.status() === 200,
      `whole-lesson route returned ${response?.status() ?? "no response"}`,
    );
    await coursePage.locator(
      '[data-lesson-player="g4-l3-whole-lesson-mvp"][data-hydrated="true"]',
    ).waitFor({state: "visible", timeout: 60_000});
    await closeCourseMapIfOpen(coursePage);
    const observations = [];
    for (const pagePlan of scope.pages) {
      const direct = await observeDirectRuntime(
        capturePage,
        options.baseUrl,
        pagePlan,
        profile,
        options.screenshotRoot,
        captureEvents,
      );
      const wholeLesson = await observeWholeLessonLayout(
        coursePage,
        pagePlan,
        profile,
        options.screenshotRoot,
        scope.readableEnhancements,
      );
      const issues = [
        ...direct.issues,
        ...wholeLesson.issues,
      ];
      observations.push({
        globalPageOrdinal: pagePlan.globalPageOrdinal,
        animationId: pagePlan.animationId,
        sectionCode: pagePlan.sectionCode,
        inspectedFrame: direct.identity.frame,
        frameDomain: direct.identity.frameDomain,
        representativeSelection: pagePlan.representative.selection,
        direct,
        wholeLesson,
        severity: severityFor(issues),
        issues,
      });
      process.stdout.write(
        `readability ${profile.id} ${String(pagePlan.globalPageOrdinal).padStart(2, "0")}/39 ${pagePlan.animationId}\n`,
      );
    }
    const courseMonitorIssues = monitorIssues(courseEvents);
    if (courseMonitorIssues.length > 0) {
      observations[0].issues.push(...courseMonitorIssues);
      observations[0].severity = severityFor(observations[0].issues);
    }
    const contactSheet = await buildContactSheet(
      profile,
      observations,
      options.screenshotRoot,
    );
    return {profile, observations, contactSheet};
  } finally {
    await Promise.all([capturePage.close(), coursePage.close()]);
    await context.close();
  }
}

function collectScreenshots(profileResults) {
  const screenshots = [];
  for (const profileResult of profileResults) {
    for (const page of profileResult.observations) {
      screenshots.push(page.direct.screenshot);
      if (page.wholeLesson.readableScreenshot) {
        screenshots.push(page.wholeLesson.readableScreenshot);
      }
    }
    screenshots.push(profileResult.contactSheet);
  }
  return screenshots;
}

function buildPageReports(scope, profileResults) {
  return scope.pages.map((pagePlan) => {
    const observations = profileResults.map((profileResult) => {
      const observation = profileResult.observations.find(
        ({animationId}) => animationId === pagePlan.animationId,
      );
      invariant(
        observation,
        `missing ${profileResult.profile.id} observation for ${pagePlan.animationId}`,
      );
      return {
        profileId: profileResult.profile.id,
        ...observation,
      };
    });
    const issues = observations.flatMap(({profileId, issues: values}) =>
      values.map((issue) => ({profileId, ...issue})));
    return {
      globalPageOrdinal: pagePlan.globalPageOrdinal,
      animationId: pagePlan.animationId,
      sectionCode: pagePlan.sectionCode,
      representative: pagePlan.representative,
      candidateReport: pagePlan.candidateReport,
      severity: severityFor(issues),
      disposition: pagePlan.globalPageOrdinal === 36
        ? (
            issues.length === 0
              ? "known-source-authored-small-text-resolved-by-v3-readable-view"
              : "page-36-readable-view-invalid"
          )
        : (
            issues.length === 0
              ? "no-automated-p0-or-p1-detected"
              : "p0-or-p1-detected-requires-readable-view-spec-before-release"
          ),
      observations,
      issues,
    };
  });
}

function summarize(pages, screenshots, contactSheets) {
  const issues = pages.flatMap(({globalPageOrdinal, animationId, issues}) =>
    issues.map((issue) => ({globalPageOrdinal, animationId, ...issue})));
  const p0 = issues.filter(({severity}) => severity === "P0");
  const p1 = issues.filter(({severity}) => severity === "P1");
  const page36 = pages.find(({globalPageOrdinal}) => globalPageOrdinal === 36);
  return {
    status: p0.length === 0 && p1.length === 0
      ? "pass-current-js-p0-p1-readability-screening"
      : "fail-current-js-p0-p1-readability-screening",
    pagesInspected: pages.length,
    profileCount: READABILITY_PROFILES.length,
    observations: pages.reduce(
      (count, page) => count + page.observations.length,
      0,
    ),
    screenshotCount: screenshots.length,
    contactSheetCount: contactSheets.length,
    p0Count: p0.length,
    p1Count: p1.length,
    unresolvedP0P1Count: p0.length + p1.length,
    page36ReadableViewProfilePasses:
      page36?.observations.filter(
        ({wholeLesson}) => wholeLesson.readableView?.passed,
      ).length ?? 0,
    strictCompleteMembers: 0,
    releaseMembers: 40,
    published: false,
    strictAcceptanceEffect: "none",
    issues,
  };
}

function validBinding(binding) {
  return typeof binding?.path === "string"
    && Number.isInteger(binding?.bytes)
    && binding.bytes > 0
    && sha256Pattern.test(binding?.sha256 ?? "");
}

function artifactVariantForReportType(candidateReportType) {
  return Object.values(READABILITY_ARTIFACT_VARIANTS).find(
    ({reportType: candidate}) => candidate === candidateReportType,
  ) ?? null;
}

function buildArtifactIdentity(artifactVersion, sourceBindings) {
  if (artifactVersion === "v3") return null;
  const variant = READABILITY_ARTIFACT_VARIANTS[artifactVersion];
  return {
    variant: variant.id,
    version: variant.version,
    reportType: variant.reportType,
    title: variant.title,
    generatorSourceBinding: sourceBindings.generator,
  };
}

export function validateReadabilityReportStructure(
  report,
  {expectedArtifactVersion = null} = {},
) {
  const errors = [];
  const artifactVariant = artifactVariantForReportType(report?.reportType);
  if (report?.schemaVersion !== schemaVersion) {
    errors.push(`schemaVersion must be ${schemaVersion}`);
  }
  if (!artifactVariant) {
    errors.push("reportType is unsupported");
  }
  if (expectedArtifactVersion && artifactVariant?.id !== expectedArtifactVersion) {
    errors.push(`report artifact version must be ${expectedArtifactVersion}`);
  }
  if (
    artifactVariant
    && artifactVariant.id !== "v3"
    && report?.environment?.baseUrl !== artifactVariant.defaultBaseUrl
  ) {
    errors.push(`${artifactVariant.version} report environment.baseUrl must be ${artifactVariant.defaultBaseUrl}`);
  }
  if (artifactVariant && artifactVariant.id !== "v3") {
    const requiredSourceBindingKeys = [
      "generator",
      "currentJavascriptProgress",
      "navigationContract",
      "readableAssetsManifest",
      "readableViewComponent",
      "readableViewSpec",
      "wholeLessonPlayer",
      "globalStyles",
      "ts08GeneratedRenderer",
    ];
    const expectedIdentity = {
      variant: artifactVariant.id,
      version: artifactVariant.version,
      reportType: artifactVariant.reportType,
      title: artifactVariant.title,
      generatorSourceBinding: report?.sourceBindings?.generator,
    };
    if (
      !validBinding(report?.sourceBindings?.generator)
      || JSON.stringify(report?.artifactIdentity) !== JSON.stringify(expectedIdentity)
    ) {
      errors.push(`${artifactVariant.version} artifact identity must bind its report type, title, version, and current readability generator source`);
    }
    if (
      JSON.stringify(Object.keys(report?.sourceBindings ?? {}).sort())
        !== JSON.stringify(requiredSourceBindingKeys.sort())
      || requiredSourceBindingKeys.some(
        (key) => !validBinding(report?.sourceBindings?.[key]),
      )
    ) {
      errors.push(
        `${artifactVariant.version} source bindings must include the exact readability implementation, player, CSS, inputs, renderer, and generator set`,
      );
    }
  }
  if (
    report?.summary?.pagesInspected !== 39
    || report?.summary?.profileCount !== 4
    || report?.summary?.observations !== 156
  ) {
    errors.push("readability report must contain 39 pages × 4 profiles");
  }
  if (
    report?.summary?.strictCompleteMembers !== 0
    || report?.summary?.releaseMembers !== 40
    || report?.summary?.published !== false
    || report?.summary?.strictAcceptanceEffect !== "none"
  ) {
    errors.push("strict acceptance must remain 0/40, unpublished, effect none");
  }
  if (
    report?.authorityClaims?.flashFidelity !== false
    || report?.authorityClaims?.humanVisualReview !== false
    || report?.authorityClaims?.ownerAcceptance !== false
    || report?.authorityClaims?.strictMigrationCompletion !== false
    || report?.authorityClaims?.publicRelease !== false
  ) {
    errors.push("authority claims must remain false");
  }
  try {
    const normalized = normalizeReadabilityEnhancement(
      report?.readabilityEnhancements,
    );
    if (
      JSON.stringify(normalized)
        !== JSON.stringify(report.readabilityEnhancements)
    ) {
      errors.push("readabilityEnhancements is not canonical");
    }
  } catch (error) {
    errors.push(`readabilityEnhancements invalid: ${error.message}`);
  }
  if (
    !Array.isArray(report?.pages)
    || report.pages.length !== 39
    || report.pages.some(
      (page, index) =>
        page.globalPageOrdinal !== index + 1
        || page.observations?.length !== 4
        || !validBinding(page.candidateReport),
    )
  ) {
    errors.push("pages must be ordered 1–39 with four bound observations each");
  }
  const profileIds = READABILITY_PROFILES.map(({id}) => id);
  for (const page of report?.pages ?? []) {
    if (
      JSON.stringify(page.observations?.map(({profileId}) => profileId))
        !== JSON.stringify(profileIds)
    ) {
      errors.push(`Page ${page.globalPageOrdinal} profile order drifted`);
      break;
    }
    if (
      page.observations.some(
        (observation) =>
          !observation?.direct?.identity
          || !observation?.wholeLesson?.layout
          || !validBinding(observation.direct?.screenshot)
          || !Array.isArray(observation?.issues),
      )
    ) {
      errors.push(`Page ${page.globalPageOrdinal} observation shape is invalid`);
    }
  }
  const screenshotPaths = new Set();
  if (
    !Array.isArray(report?.screenshots)
    || report.screenshots.length < 160
    || report.screenshots.length > 164
    || report.summary?.screenshotCount !== report.screenshots.length
    || report.screenshots.some((binding) => {
      if (!validBinding(binding) || screenshotPaths.has(binding.path)) {
        return true;
      }
      screenshotPaths.add(binding.path);
      return false;
    })
  ) {
    errors.push("screenshots must uniquely bind all generated frames, Page 36 views, and contact sheets");
  }
  if (
    !Array.isArray(report?.contactSheets)
    || report.contactSheets.length !== 4
    || report.contactSheets.some((binding) => !validBinding(binding))
  ) {
    errors.push("contactSheets must bind all four viewport sheets");
  }
  if (
    report?.summary?.status
      === "pass-current-js-p0-p1-readability-screening"
  ) {
    if (
      report.summary.p0Count !== 0
      || report.summary.p1Count !== 0
      || report.summary.unresolvedP0P1Count !== 0
      || report.summary.page36ReadableViewProfilePasses !== 4
    ) {
      errors.push("passing readability report must have zero P0/P1 and Page 36 4/4");
    }
    if (
      report.pages?.some(
        ({severity, observations}) =>
          severity !== "none"
          || observations.some(({issues}) => issues.length !== 0),
      )
    ) {
      errors.push("passing readability report contains page-level issues");
    }
    for (const page of report?.pages ?? []) {
      if (
        page.observations.some(
          (observation) =>
            observation.direct?.identity?.animationId !== page.animationId
            || observation.direct?.identity?.frame
              !== page.representative?.frame
            || observation.direct?.identity?.frameDomain
              !== page.representative?.frameDomain
            || observation.wholeLesson?.layout?.runtimeStageCount !== 1
            || observation.wholeLesson?.layout?.primaryRuntimeCount !== 1
            || observation.wholeLesson?.layout?.horizontalOverflowPx > 1
            || observation.wholeLesson?.layout
              ?.criticalControlHorizontalClipCount > 0
        )
      ) {
        errors.push(
          `Page ${page.globalPageOrdinal} has invalid frame identity, runtime, or layout`,
        );
      }
    }
    const page36 = report?.pages?.[35];
    if (
      page36?.animationId !== page36AnimationId
      || page36?.representative?.frame !== 789
      || page36?.representative?.frameDomain !== "sprite-350"
      || page36?.observations?.some(
        ({wholeLesson}) =>
          wholeLesson?.readableView?.passed !== true
          || wholeLesson?.readableView?.interactions?.passed !== true
          || JSON.stringify(
            wholeLesson?.readableView?.interactions?.inputMethods,
          ) !== JSON.stringify(["click", "Enter", "Space", "Escape"])
          || wholeLesson?.readableView?.interactions
            ?.focusRestoredAfterEscape !== true
          || !validBinding(wholeLesson?.readableScreenshot),
      )
    ) {
      errors.push("Page 36 must pass its default view, click/keyboard/Escape interactions, and focus restoration in all profiles");
    }
    for (const page of report?.pages ?? []) {
      if (
        page.globalPageOrdinal !== 36
        && page.observations?.some(
          ({wholeLesson}) =>
            wholeLesson?.layout?.unexpectedReadableViewCount !== 0
            || wholeLesson?.readableView !== null
            || wholeLesson?.readableScreenshot !== null,
        )
      ) {
        errors.push(`Page 36 readable view leaked onto Page ${page.globalPageOrdinal}`);
        break;
      }
    }
    if (report.screenshots?.length !== 164) {
      errors.push(
        "passing report must bind 156 frames, 4 Page 36 views, and 4 contact sheets",
      );
    }
  }
  return errors;
}

export function renderReadabilityMarkdown(report) {
  const artifactVariant = artifactVariantForReportType(report.reportType);
  const lines = [
    `# ${report.artifactIdentity?.title ?? artifactVariant?.title ?? "G4 L3 current-JS readability v3"}`,
    "",
    `- Status: **${report.summary.status}**.`,
    `- Coverage: **${report.summary.pagesInspected}/39 pages × ${report.summary.profileCount}/4 viewports = ${report.summary.observations} observations**.`,
    `- P0/P1: **${report.summary.p0Count}/${report.summary.p1Count}**; unresolved: **${report.summary.unresolvedP0P1Count}**.`,
    `- Page 36 Readable View: **${report.summary.page36ReadableViewProfilePasses}/4 profiles**; fixed current-JS source frame \`sprite-350:789\`.`,
    `- Evidence: **${report.summary.screenshotCount} PNG bindings**, including **${report.summary.contactSheetCount} contact sheets**.`,
    "- Release boundary: **strict 0/40, unpublished; strictAcceptanceEffect = none**.",
    "",
    "## Screening policy",
    "",
    "- P0: core current-JS renderer unavailable, wrong deterministic frame identity, HTTP/request/console/page error, or not exactly one primary runtime.",
    "- P1: horizontal overflow above 1px, stage/control clipping, missing accessible page heading, or invalid Page 36 source-bound crop/transcript support.",
    "- This is automated current-JavaScript screening plus durable screenshots. It is not original Flash evidence, human visual review, owner acceptance, or strict migration completion.",
    "",
    "## Pages",
    "",
    "| Page | Animation | Frame | Result | Disposition |",
    "| ---: | --- | --- | --- | --- |",
    ...report.pages.map((page) =>
      `| ${page.globalPageOrdinal} | \`${page.animationId}\` | \`${page.representative.frameDomain}:${page.representative.frame}\` | ${page.severity} | ${page.disposition} |`),
    "",
    "## Page 36 readable enhancement",
    "",
    `- Source SWF: \`${report.readabilityEnhancements.source.sha256}\`.`,
    `- Crops: ${report.readabilityEnhancements.crops.map(({id, asset}) => `${id} \`${asset.sha256}\``).join("; ")}.`,
    "- Original 800×600 stage remains present; the panel is default-expanded and can be collapsed to Original Layout only.",
    "- The English DOM transcript remains source-bound; Spanish UI must disclose that the original mathematics content is English-only.",
    "",
    "## Limitations",
    "",
    ...report.screeningLimitations.map((item) => `- ${item}`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function verifyBinding(binding, errors) {
  if (!validBinding(binding)) {
    errors.push("invalid file binding");
    return;
  }
  try {
    const current = await bindFile(binding.path);
    if (
      current.bytes !== binding.bytes
      || current.sha256 !== binding.sha256
    ) {
      errors.push(`${binding.path} drifted`);
    }
  } catch (error) {
    errors.push(`${binding.path} cannot be verified: ${error.message}`);
  }
}

async function listPngFiles(root) {
  const files = [];
  async function visit(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile() && entry.name.endsWith(".png")) {
        files.push(relative(target));
      }
    }
  }
  await visit(root);
  return files.sort();
}

async function checkReport(
  jsonOutput,
  markdownOutput,
  screenshotRoot,
  expectedArtifactVersion,
) {
  const report = JSON.parse(await readFile(jsonOutput, "utf8"));
  const errors = validateReadabilityReportStructure(report, {
    expectedArtifactVersion,
  });
  for (const binding of Object.values(report.sourceBindings ?? {})) {
    await verifyBinding(binding, errors);
  }
  for (const page of report.pages ?? []) {
    await verifyBinding(page.candidateReport, errors);
  }
  for (const screenshot of report.screenshots ?? []) {
    await verifyBinding(screenshot, errors);
  }
  try {
    const expectedPngs = [...new Set(
      (report.screenshots ?? []).map(({path: filePath}) => filePath),
    )].sort();
    const actualPngs = await listPngFiles(screenshotRoot);
    if (JSON.stringify(actualPngs) !== JSON.stringify(expectedPngs)) {
      errors.push(
        `${relative(screenshotRoot)} recursive PNG inventory differs from report.screenshots`,
      );
    }
  } catch (error) {
    errors.push(
      `${relative(screenshotRoot)} PNG inventory cannot be verified: ${error.message}`,
    );
  }
  const manifest = await readJson(readableAssetsManifestPath);
  const manifestSourcePath =
    manifest?.source?.swf?.path ?? manifest?.source?.path;
  const manifestSource = await bindFile(manifestSourcePath);
  const currentEnhancement = normalizeReadabilityEnhancement(
    manifest,
    {sourceBytes: manifestSource.bytes},
  );
  if (
    JSON.stringify(currentEnhancement)
      !== JSON.stringify(report.readabilityEnhancements)
  ) {
    errors.push("readable-view asset manifest drifted");
  }
  for (const crop of report.readabilityEnhancements?.crops ?? []) {
    await verifyBinding(crop.asset, errors);
  }
  const expectedMarkdown = renderReadabilityMarkdown(report);
  const currentMarkdown = await readFile(markdownOutput, "utf8");
  if (currentMarkdown !== expectedMarkdown) {
    errors.push(`${relative(markdownOutput)} drifted`);
  }
  invariant(
    errors.length === 0,
    `G4 L3 readability report verification failed:\n- ${errors.join("\n- ")}`,
  );
  return report;
}

async function runReadabilityQa(options) {
  await assertV33ReadabilityTargetsAbsent(options);
  const scope = await loadScope();
  const artifactVariant = READABILITY_ARTIFACT_VARIANTS[options.artifactVersion];
  await prepareReadabilityScreenshotRoot(options);
  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();
  let profileResults;
  try {
    profileResults = [];
    for (const profile of READABILITY_PROFILES) {
      profileResults.push(
        await inspectProfile(browser, options, profile, scope),
      );
    }
  } finally {
    await browser.close();
  }
  const pages = buildPageReports(scope, profileResults);
  const contactSheets = profileResults.map(({contactSheet}) => contactSheet);
  const screenshots = collectScreenshots(profileResults);
  const summary = summarize(pages, screenshots, contactSheets);
  const report = {
    schemaVersion,
    reportType: artifactVariant.reportType,
    ...(options.artifactVersion === "v3" ? {} : {
      artifactIdentity: buildArtifactIdentity(
        options.artifactVersion,
        scope.sourceBindings,
      ),
    }),
    scope: {
      lesson: {grade: 4, lesson: 3, title: "Negative Numbers"},
      currentJavascriptPages: 39,
      viewportProfiles: READABILITY_PROFILES,
      severityScope: ["P0", "P1"],
      repairPolicy:
        "Only source-bound ReadableViewSpec crops and exact DOM transcripts; generated renderers remain unchanged.",
    },
    environment: {
      baseUrl: options.baseUrl,
      browser: "chromium",
      browserVersion,
      locale: "en",
      reducedMotion: "reduce",
    },
    sourceBindings: scope.sourceBindings,
    readabilityEnhancements: scope.readableEnhancements,
    summary,
    pages,
    contactSheets,
    screenshots,
    screeningLimitations: [
      "Canvas pixel screenshots support review but do not establish that every canvas-authored mathematical string has an independent DOM semantic equivalent.",
      "No original Flash runtime is invoked, compared, or accepted by this current-JavaScript readability audit.",
      "Automated P0/P1 screening does not replace human visual review or owner acceptance.",
    ],
    authorityClaims: {
      currentJavascriptReadabilityScreening:
        summary.unresolvedP0P1Count === 0,
      flashFidelity: false,
      originalRuntimeComparison: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false,
      publicRelease: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: "none",
      strictCompleteMembers: 0,
      releaseMembers: 40,
      published: false,
      statement:
        "This report covers current-JavaScript P0/P1 readability screening only. It does not establish Flash fidelity, original-runtime parity, human visual acceptance, Owner acceptance, strict completion, or publication.",
    },
  };
  const structureErrors = validateReadabilityReportStructure(report, {
    expectedArtifactVersion: options.artifactVersion,
  });
  invariant(
    structureErrors.length === 0,
    `Generated readability report is invalid:\n- ${structureErrors.join("\n- ")}`,
  );
  await writeGeneratedArtifact(
    options.jsonOutput,
    `${JSON.stringify(report, null, 2)}\n`,
    options.artifactVersion,
  );
  await writeGeneratedArtifact(
    options.markdownOutput,
    renderReadabilityMarkdown(report),
    options.artifactVersion,
  );
  invariant(
    summary.unresolvedP0P1Count === 0,
    `Readability QA found ${summary.unresolvedP0P1Count} P0/P1 issues`,
  );
  return report;
}

async function main() {
  const options = parseReadabilityArguments(process.argv.slice(2));
  if (options.check) {
    const report = await checkReport(
      options.jsonOutput,
      options.markdownOutput,
      options.screenshotRoot,
      options.artifactVersion,
    );
    process.stdout.write(
      `verified ${relative(options.jsonOutput)}: ${report.summary.status}, ${report.summary.observations} observations\n`,
    );
    return;
  }
  const report = await runReadabilityQa(options);
  process.stdout.write(
    `wrote ${relative(options.jsonOutput)}: ${report.summary.status}, ${report.summary.observations} observations\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
