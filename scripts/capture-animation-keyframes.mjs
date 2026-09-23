#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { PNG } from "pngjs";

import {
  IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
  IMPLEMENTATION_CAPTURE_GENERATOR_PROVENANCE_SCHEMA_VERSION,
  IMPLEMENTATION_CAPTURE_SCRIPT_PATH,
  collectImplementationArtifactClosure,
  implementationCaptureGeneratorProvenanceErrors,
  implementationArtifactClosureErrors,
  isUnambiguousLoopbackHttpUrl,
} from "./implementation-artifact-closure.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const require = createRequire(import.meta.url);
const playwrightPackagePath = require.resolve("@playwright/test/package.json");
const playwrightPackageRelativePath = path.relative(defaultProjectRoot, playwrightPackagePath).split(path.sep).join("/");

export async function collectCaptureGeneratorProvenance() {
  const [scriptBytes, playwrightPackageBytes] = await Promise.all([
    readFile(scriptPath),
    readFile(playwrightPackagePath),
  ]);
  let playwrightPackage;
  try {
    playwrightPackage = JSON.parse(playwrightPackageBytes.toString("utf8"));
  } catch (error) {
    throw new Error(`Cannot read @playwright/test generator version: ${error.message}`);
  }
  if (typeof playwrightPackage.version !== "string" || !playwrightPackage.version.trim()) {
    throw new Error("@playwright/test package version is missing");
  }
  return {
    schemaVersion: IMPLEMENTATION_CAPTURE_GENERATOR_PROVENANCE_SCHEMA_VERSION,
    script: {
      path: IMPLEMENTATION_CAPTURE_SCRIPT_PATH,
      sha256: createHash("sha256").update(scriptBytes).digest("hex"),
    },
    playwright: {
      package: "@playwright/test",
      version: playwrightPackage.version,
      packageJsonPath: playwrightPackageRelativePath,
      packageJsonSha256: createHash("sha256").update(playwrightPackageBytes).digest("hex"),
    },
  };
}

function usage() {
  return `Usage:
  npm run capture:keyframes -- --id <animation-id> --url <page-url> --frames <1,10,25> --output <directory>

Options:
  --id <animation-id>       Exact animation identity reported by the stage (required)
  --project-root <path>     Project root containing migrations/<animation-id>
                            (default: repository root)
  --selector <css>          Capture target (default: [data-capture-stage="true"])
  --frame-param <name>      Exact-frame query parameter (default: frame)
  --frame-domain <id>       Timeline domain (required)
  --frame-domain-param <n>  Timeline-domain query parameter (default: frameDomain)
  --requirement-id <id>     Coverage requirement identity (required)
  --requirement-id-param <n>
                            Requirement query parameter (default: requirementId)
  --trace <id>              Reachable trace identity (required)
  --trace-param <name>      Trace query parameter (default: trace)
  --entry-state-sha256 <h>  Canonical entry-state SHA-256 (required)
  --entry-state-sha256-param <name>
                            Entry-state hash query parameter (default: entryStateSha256)
  --scenario <id>           Reachable scenario ID (default: default)
  --scenario-param <name>   Scenario query parameter (default: scenario)
  --lang <code>             Language variant (default: en)
  --lang-param <name>       Language query parameter (default: lang)
  --seed <value>            Deterministic random seed (default: 0)
  --seed-param <name>       Seed query parameter (default: seed)
  --width <pixels>          Browser viewport width (default: 780)
  --height <pixels>         Browser viewport height (default: 379)
  --device-scale <n>        Device scale factor (default: 1)`;
}

export function parseArguments(argv) {
  const options = {
    projectRoot: defaultProjectRoot,
    selector: '[data-capture-stage="true"]',
    frameParam: "frame",
    frameDomainParam: "frameDomain",
    requirementIdParam: "requirementId",
    traceParam: "trace",
    entryStateSha256Param: "entryStateSha256",
    scenario: "default",
    scenarioParam: "scenario",
    lang: "en",
    langParam: "lang",
    seed: "0",
    seedParam: "seed",
    width: 780,
    height: 379,
    deviceScale: 1,
  };
  const valueOptions = new Set([
    "--id", "--project-root", "--url", "--frames", "--output", "--selector", "--frame-param", "--frame-domain", "--frame-domain-param", "--requirement-id", "--requirement-id-param", "--trace", "--trace-param", "--entry-state-sha256", "--entry-state-sha256-param", "--scenario", "--scenario-param",
    "--lang", "--lang-param", "--seed", "--seed-param", "--width", "--height", "--device-scale",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (valueOptions.has(value)) {
      const next = argv[index + 1];
      if (next === undefined || next === "") throw new Error(`${value} requires a value`);
      const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      options[key] = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  options.width = Number(options.width);
  options.height = Number(options.height);
  options.deviceScale = Number(options.deviceScale);
  options.projectRoot = path.resolve(options.projectRoot);
  options.frameList = String(options.frames || "").split(",").filter(Boolean).map(Number);
  return options;
}

export function buildCaptureUrl(options, frame) {
  const targetUrl = new URL(options.url);
  targetUrl.searchParams.set(options.frameParam, String(frame));
  targetUrl.searchParams.set(options.frameDomainParam, options.frameDomain);
  targetUrl.searchParams.set(options.requirementIdParam, options.requirementId);
  targetUrl.searchParams.set(options.traceParam, options.trace);
  targetUrl.searchParams.set(options.entryStateSha256Param, options.entryStateSha256);
  targetUrl.searchParams.set(options.scenarioParam, options.scenario);
  targetUrl.searchParams.set(options.langParam, options.lang);
  targetUrl.searchParams.set(options.seedParam, String(options.seed));
  targetUrl.searchParams.set("capture", "1");
  return targetUrl;
}

export function assertReportedFrame(renderedFrame, requestedFrame, selector) {
  if (renderedFrame === null || renderedFrame === undefined || renderedFrame === "") {
    throw new Error(`${selector} is missing mandatory data-flash-frame for requested frame ${requestedFrame}`);
  }
  if (!/^\d+$/.test(String(renderedFrame)) || Number(renderedFrame) !== requestedFrame) {
    throw new Error(`Requested frame ${requestedFrame}, but ${selector} reports frame ${renderedFrame}`);
  }
  return Number(renderedFrame);
}

export function assertReportedFrameDomain(renderedDomain, requestedDomain, selector) {
  if (renderedDomain === null || renderedDomain === undefined || renderedDomain === "") {
    throw new Error(`${selector} is missing mandatory data-flash-frame-domain`);
  }
  if (requestedDomain && renderedDomain !== requestedDomain) {
    throw new Error(`Requested frame domain ${requestedDomain}, but ${selector} reports domain ${renderedDomain}`);
  }
  return renderedDomain;
}

export function assertReportedCaptureIdentity(renderedValue, requestedValue, attribute, selector) {
  if (renderedValue === null || renderedValue === undefined || renderedValue === "") {
    throw new Error(`${selector} is missing mandatory ${attribute}`);
  }
  if (renderedValue !== requestedValue) {
    throw new Error(`Requested ${attribute} ${requestedValue}, but ${selector} reports ${renderedValue}`);
  }
  return renderedValue;
}

export function assertReportedRuntimeContext(rendered, requested, selector) {
  const runtime = {
    scenario: assertReportedCaptureIdentity(
      rendered.scenario,
      requested.scenario,
      "data-runtime-scenario",
      selector,
    ),
    language: assertReportedCaptureIdentity(
      rendered.language,
      requested.language,
      "data-runtime-language",
      selector,
    ),
    seed: assertReportedCaptureIdentity(
      rendered.seed,
      String(requested.seed),
      "data-runtime-seed",
      selector,
    ),
  };
  return {
    ...runtime,
    flashScenario: assertReportedCaptureIdentity(
      rendered.flashScenario,
      requested.scenario,
      "data-flash-scenario",
      selector,
    ),
    flashLanguage: assertReportedCaptureIdentity(
      rendered.flashLanguage,
      requested.language,
      "data-flash-lang",
      selector,
    ),
    flashSeed: assertReportedCaptureIdentity(
      rendered.flashSeed,
      String(requested.seed),
      "data-flash-seed",
      selector,
    ),
    flashContextIdentityComplete: true,
  };
}

export function assertRendererReadyContract(snapshot, requested, selector) {
  const target = snapshot?.target;
  if (!target) throw new Error(`${selector} did not resolve a capture stage`);
  if (target.captureStage !== "true") {
    throw new Error(`${selector} is missing mandatory data-capture-stage="true"`);
  }
  if (target.renderState !== "ready") {
    throw new Error(`${selector} renderer is not ready (data-render-state=${target.renderState || "missing"})`);
  }
  const targetIdentity = assertRendererIdentity(target, requested, selector);

  const visual = snapshot?.visual;
  if (!visual) {
    throw new Error(`${selector} is missing a real visual target marked data-render-visual="true"`);
  }
  const visualSelector = `${selector} ${String(visual.tagName || "visual").toLowerCase()}[data-render-visual="true"]`;
  if (visual.renderVisual !== "true") {
    throw new Error(`${visualSelector} is missing mandatory data-render-visual="true"`);
  }
  if (visual.renderState !== "ready") {
    throw new Error(`${visualSelector} renderer is not ready (data-render-state=${visual.renderState || "missing"})`);
  }
  if (visual.visible !== true) throw new Error(`${visualSelector} is not visibly renderable`);
  const visualIdentity = assertRendererIdentity(
    visual,
    {...requested, rootFrame: targetIdentity.rootFrame},
    visualSelector,
  );
  return {
    target: targetIdentity,
    visual: {
      ...visualIdentity,
      tagName: String(visual.tagName || "").toLowerCase(),
      renderState: visual.renderState,
    },
  };
}

function assertRendererIdentity(rendered, requested, selector) {
  const rootFrame = assertReportedRootFrame(
    rendered.rootFrame,
    requested.rootFrame ?? (requested.frameDomain === "root" ? requested.frame : undefined),
    selector,
  );
  return {
    animationId: assertReportedCaptureIdentity(
      rendered.animationId,
      requested.animationId,
      "data-animation-id",
      selector,
    ),
    frame: assertReportedFrame(rendered.frame, requested.frame, selector),
    frameDomain: assertReportedFrameDomain(rendered.frameDomain, requested.frameDomain, selector),
    rootFrame,
    requirementId: assertReportedCaptureIdentity(
      rendered.requirementId,
      requested.requirementId,
      "data-flash-requirement-id",
      selector,
    ),
    traceId: assertReportedCaptureIdentity(
      rendered.traceId,
      requested.traceId,
      "data-flash-trace-id",
      selector,
    ),
    entryStateSha256: assertReportedCaptureIdentity(
      rendered.entryStateSha256,
      requested.entryStateSha256,
      "data-flash-entry-state-sha256",
      selector,
    ),
    ...assertReportedRuntimeContext({
      scenario: rendered.scenario,
      language: rendered.language,
      seed: rendered.seed,
      flashScenario: rendered.flashScenario,
      flashLanguage: rendered.flashLanguage,
      flashSeed: rendered.flashSeed,
    }, {
      scenario: requested.scenario,
      language: requested.language,
      seed: requested.seed,
    }, selector),
  };
}

function assertReportedRootFrame(renderedRootFrame, requestedRootFrame, selector) {
  if (!/^\d+$/.test(String(renderedRootFrame ?? "")) || Number(renderedRootFrame) < 1) {
    throw new Error(`${selector} is missing mandatory positive data-flash-root-frame`);
  }
  if (requestedRootFrame !== undefined && Number(renderedRootFrame) !== requestedRootFrame) {
    throw new Error(`Requested root frame ${requestedRootFrame}, but ${selector} reports root frame ${renderedRootFrame}`);
  }
  return Number(renderedRootFrame);
}

async function readRendererReadySnapshot(locator) {
  return locator.evaluate((target) => {
    const read = (element) => {
      if (!element) return null;
      const rectangle = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tagName: element.tagName,
        captureStage: element.getAttribute("data-capture-stage"),
        renderVisual: element.getAttribute("data-render-visual"),
        renderState: element.getAttribute("data-render-state"),
        animationId: element.getAttribute("data-animation-id"),
        frame: element.getAttribute("data-flash-frame"),
        frameDomain: element.getAttribute("data-flash-frame-domain"),
        rootFrame: element.getAttribute("data-flash-root-frame"),
        requirementId: element.getAttribute("data-flash-requirement-id"),
        traceId: element.getAttribute("data-flash-trace-id"),
        entryStateSha256: element.getAttribute("data-flash-entry-state-sha256"),
        flashScenario: element.getAttribute("data-flash-scenario"),
        flashLanguage: element.getAttribute("data-flash-lang"),
        flashSeed: element.getAttribute("data-flash-seed"),
        scenario: element.getAttribute("data-runtime-scenario"),
        language: element.getAttribute("data-runtime-language"),
        seed: element.getAttribute("data-runtime-seed"),
        visible:
          rectangle.width > 0 &&
          rectangle.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden",
      };
    };
    const visual = target.matches('[data-render-visual="true"]')
      ? target
      : target.querySelector('[data-render-visual="true"]');
    return { target: read(target), visual: read(visual) };
  });
}

function validateOptions(options) {
  if (!options.url || !options.output || !options.frameList.length) throw new Error(usage());
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(String(options.id ?? ""))) throw new Error("id must be a stable non-empty animation identifier");
  if (!isUnambiguousLoopbackHttpUrl(options.url)) throw new Error("url must be an unambiguous credential-free loopback http URL");
  if (!String(options.frameDomain ?? "").trim()) throw new Error("frameDomain is required");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(String(options.requirementId ?? ""))) throw new Error("requirementId must be a stable non-empty identifier");
  if (!String(options.trace ?? "").trim()) throw new Error("trace is required");
  if (!/^[a-f0-9]{64}$/.test(String(options.entryStateSha256 ?? ""))) throw new Error("entryStateSha256 must be a lowercase 64-character SHA-256");
  if (options.frameList.some((frame) => !Number.isInteger(frame) || frame < 1)) throw new Error("Frames must be positive one-indexed integers");
  if (!(Number.isInteger(options.width) && options.width > 0 && Number.isInteger(options.height) && options.height > 0)) throw new Error("Viewport width and height must be positive integers");
  if (!(Number.isFinite(options.deviceScale) && options.deviceScale > 0)) throw new Error("Device scale must be greater than zero");
  for (const field of ["scenario", "lang", "seed", "frameParam", "frameDomainParam", "requirementIdParam", "traceParam", "entryStateSha256Param", "scenarioParam", "langParam", "seedParam"]) if (!String(options[field] ?? "").trim()) throw new Error(`${field} must not be empty`);
}

function isUnexpectedRequest(requestUrl, expectedOrigin) {
  let parsed;
  try {
    parsed = new URL(requestUrl);
  } catch {
    return true;
  }
  if (!["http:", "https:", "ws:", "wss:"].includes(parsed.protocol)) return false;
  return parsed.origin !== expectedOrigin;
}

export async function captureKeyframes(options, {
  browserType = chromium,
  collectArtifactClosure = collectImplementationArtifactClosure,
  collectGeneratorProvenance = collectCaptureGeneratorProvenance,
} = {}) {
  validateOptions(options);
  const generatorBeforeCapture = await collectGeneratorProvenance();
  const projectRoot = path.resolve(options.projectRoot || defaultProjectRoot);
  const workspace = path.resolve(projectRoot, "migrations", options.id);
  const migrationPath = path.join(workspace, "migration.json");
  let migrationManifest;
  try {
    migrationManifest = JSON.parse(await readFile(migrationPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot collect capture-time implementation artifact closure from ${migrationPath}: ${error.message}`);
  }
  if (migrationManifest.animationId !== options.id) {
    throw new Error(`migration.json animationId ${migrationManifest.animationId || "missing"} does not match requested ${options.id}`);
  }
  const implementationArtifactClosure = await collectArtifactClosure({
    projectRoot,
    workspace,
    manifest: migrationManifest,
  });
  const output = path.resolve(options.output);
  await mkdir(output, { recursive: true });
  const browser = await browserType.launch({ headless: true });
  const browserVersion = browser.version();
  const generatorProvenance = {
    ...generatorBeforeCapture,
    browser: {
      type: "chromium",
      version: browserVersion,
    },
  };
  const generatorErrors = implementationCaptureGeneratorProvenanceErrors(generatorProvenance);
  if (generatorErrors.length) {
    await browser.close();
    throw new Error(`Capture generator provenance is invalid: ${generatorErrors.join("; ")}`);
  }
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: options.deviceScale,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const httpErrors = [];
  const unexpectedRequests = [];
  const expectedOrigin = new URL(options.url).origin;
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    if (isUnexpectedRequest(request.url(), expectedOrigin)) unexpectedRequests.push(request.url());
  });
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()}: ${request.failure()?.errorText || "failed"}`));
  page.on("response", (response) => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });

  const captured = [];
  let captureError = null;
  try {
    const pad = Math.max(3, String(Math.max(...options.frameList)).length);
    for (const frame of options.frameList) {
      const targetUrl = buildCaptureUrl(options, frame);
      await page.goto(targetUrl.href, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await page.evaluate(() => {
        for (const portal of document.querySelectorAll("nextjs-portal")) portal.style.display = "none";
      });
      const locator = page.locator(options.selector).first();
      const domainFailure = page.locator("[data-runtime-domain-error]").first();
      await Promise.race([
        locator.waitFor({ state: "visible" }),
        domainFailure.waitFor({ state: "visible" }).then(async () => {
          const code = await domainFailure.getAttribute("data-runtime-domain-error");
          const requested = await domainFailure.getAttribute("data-requested-frame-domain");
          throw new Error(`Renderer rejected frame domain ${requested || options.frameDomain}: ${code || "runtime-domain-error"}`);
        }),
      ]);
      const rendererState = await Promise.race([
        page.waitForFunction((selector) => {
          const target = document.querySelector(selector);
          const state = target?.getAttribute("data-render-state");
          return state === "ready" || state === "error" || state === "blocked" ? state : false;
        }, options.selector).then(async (handle) => handle.jsonValue()),
        domainFailure.waitFor({ state: "visible" }).then(async () => {
          const code = await domainFailure.getAttribute("data-runtime-domain-error");
          const requested = await domainFailure.getAttribute("data-requested-frame-domain");
          throw new Error(`Renderer rejected frame domain ${requested || options.frameDomain}: ${code || "runtime-domain-error"}`);
        }),
      ]);
      if (rendererState !== "ready") {
        throw new Error(`${options.selector} renderer failed safely before capture (data-render-state=${rendererState})`);
      }
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((image) => image.complete ? null : new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        })));
      });
      const requestedIdentity = {
        animationId: options.id,
        frame,
        frameDomain: options.frameDomain,
        requirementId: options.requirementId,
        traceId: options.trace,
        entryStateSha256: options.entryStateSha256,
        scenario: options.scenario,
        language: options.lang,
        seed: options.seed,
      };
      const reported = assertRendererReadyContract(
        await readRendererReadySnapshot(locator),
        requestedIdentity,
        options.selector,
      );
      const filename = `frame-${String(frame).padStart(pad, "0")}.png`;
      const filePath = path.join(output, filename);
      await locator.screenshot({ path: filePath, animations: "disabled" });
      const afterScreenshot = assertRendererReadyContract(
        await readRendererReadySnapshot(locator),
        requestedIdentity,
        options.selector,
      );
      const bytes = await readFile(filePath);
      const png = PNG.sync.read(bytes);
      captured.push({
        animationId: reported.target.animationId,
        reportedAnimationId: reported.target.animationId,
        frame,
        reportedFrame: reported.target.frame,
        frameDomain: reported.target.frameDomain,
        frameDomainId: reported.target.frameDomain,
        reportedFrameDomainId: reported.target.frameDomain,
        rootFrame: reported.target.rootFrame,
        requirementId: reported.target.requirementId,
        traceId: reported.target.traceId,
        entryStateSha256: reported.target.entryStateSha256,
        scenario: reported.target.scenario,
        language: reported.target.language,
        seed: reported.target.seed,
        flashContextIdentityComplete: reported.target.flashContextIdentityComplete,
        reportedRenderState: "ready",
        visualTarget: {
          tagName: reported.visual.tagName,
          reportedRenderState: afterScreenshot.visual.renderState,
          animationId: afterScreenshot.visual.animationId,
          reportedFrame: afterScreenshot.visual.frame,
          frameDomainId: afterScreenshot.visual.frameDomain,
          rootFrame: afterScreenshot.visual.rootFrame,
          requirementId: afterScreenshot.visual.requirementId,
          traceId: afterScreenshot.visual.traceId,
          entryStateSha256: afterScreenshot.visual.entryStateSha256,
          scenario: afterScreenshot.visual.scenario,
          language: afterScreenshot.visual.language,
          seed: afterScreenshot.visual.seed,
          flashContextIdentityComplete: afterScreenshot.visual.flashContextIdentityComplete,
        },
        file: filename,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        width: png.width,
        height: png.height,
        url: targetUrl.href,
      });
    }
  } catch (error) {
    captureError = error;
  } finally {
    await browser.close();
  }

  try {
    const migrationManifestAfterCapture = JSON.parse(await readFile(migrationPath, "utf8"));
    if (migrationManifestAfterCapture.animationId !== options.id) {
      throw new Error(`migration.json animationId changed to ${migrationManifestAfterCapture.animationId || "missing"}`);
    }
    const closureAfterCapture = await collectArtifactClosure({
      projectRoot,
      workspace,
      manifest: migrationManifestAfterCapture,
    });
    const freshnessErrors = implementationArtifactClosureErrors(
      implementationArtifactClosure,
      closureAfterCapture,
    );
    if (freshnessErrors.length) {
      const freshnessError = `Render-affecting implementation artifacts changed during capture: ${freshnessErrors.join("; ")}`;
      captureError = new Error(captureError ? `${captureError.message}; ${freshnessError}` : freshnessError);
    }
  } catch (error) {
    const freshnessError = `Cannot recompute the render-affecting implementation artifact closure after capture: ${error.message}`;
    captureError = new Error(captureError ? `${captureError.message}; ${freshnessError}` : freshnessError);
  }
  try {
    const generatorAfterCapture = await collectGeneratorProvenance();
    if (JSON.stringify(generatorAfterCapture) !== JSON.stringify(generatorBeforeCapture)) {
      const generatorFreshnessError = "Capture generator script or Playwright package changed during capture";
      captureError = new Error(captureError ? `${captureError.message}; ${generatorFreshnessError}` : generatorFreshnessError);
    }
  } catch (error) {
    const generatorFreshnessError = `Cannot recompute capture generator provenance after capture: ${error.message}`;
    captureError = new Error(captureError ? `${captureError.message}; ${generatorFreshnessError}` : generatorFreshnessError);
  }

  const clean = !captureError && !consoleErrors.length && !failedRequests.length && !httpErrors.length && !unexpectedRequests.length;
  const manifest = {
    schemaVersion: IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
    status: clean ? "complete" : "failed",
    animationId: options.id,
    capturedAt: new Date().toISOString(),
    sourceUrl: options.url,
    selector: options.selector,
    reportedAnimationIdAttribute: "data-animation-id",
    reportedFrameAttribute: "data-flash-frame",
    reportedFrameDomainAttribute: "data-flash-frame-domain",
    reportedRequirementIdAttribute: "data-flash-requirement-id",
    reportedTraceAttribute: "data-flash-trace-id",
    reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
    reportedFlashScenarioAttribute: "data-flash-scenario",
    reportedFlashLanguageAttribute: "data-flash-lang",
    reportedFlashSeedAttribute: "data-flash-seed",
    reportedScenarioAttribute: "data-runtime-scenario",
    reportedLanguageAttribute: "data-runtime-language",
    reportedSeedAttribute: "data-runtime-seed",
    flashContextIdentityComplete: true,
    captureStageAttribute: "data-capture-stage",
    reportedRenderStateAttribute: "data-render-state",
    reportedVisualTargetAttribute: "data-render-visual",
    requiredRenderState: "ready",
    frameDomainId: options.frameDomain,
    requirementId: options.requirementId,
    traceId: options.trace,
    entryStateSha256: options.entryStateSha256,
    requestedFrameDomain: options.frameDomain ?? null,
    scenario: options.scenario,
    language: options.lang,
    seed: String(options.seed),
    queryParameters: {
      frame: options.frameParam,
      frameDomain: options.frameDomainParam,
      requirementId: options.requirementIdParam,
      trace: options.traceParam,
      entryStateSha256: options.entryStateSha256Param,
      scenario: options.scenarioParam,
      language: options.langParam,
      seed: options.seedParam,
    },
    viewport: { width: options.width, height: options.height, deviceScaleFactor: options.deviceScale },
    generatorProvenance,
    implementationArtifactClosure,
    captured,
    consoleErrors,
    failedRequests,
    httpErrors,
    unexpectedRequests: [...new Set(unexpectedRequests)],
    error: captureError?.message || null,
  };
  await writeFile(path.join(output, "capture-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  if (captureError) throw captureError;
  if (!clean) throw new Error(`Capture found ${consoleErrors.length} console error(s), ${failedRequests.length} failed request(s), ${httpErrors.length} HTTP error(s), and ${manifest.unexpectedRequests.length} unexpected request(s)`);
  return { output, manifest };
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const { output, manifest } = await captureKeyframes(options);
    console.log(`Captured ${manifest.captured.length} keyframe(s) in ${output}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
