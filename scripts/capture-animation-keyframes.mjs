#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { PNG } from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);

function usage() {
  return `Usage:
  npm run capture:keyframes -- --url <page-url> --frames <1,10,25> --output <directory>

Options:
  --selector <css>          Capture target (default: .faithful-stage-wrap)
  --frame-param <name>      Exact-frame query parameter (default: frame)
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
    selector: ".faithful-stage-wrap",
    frameParam: "frame",
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
    "--url", "--frames", "--output", "--selector", "--frame-param", "--scenario", "--scenario-param",
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
  options.frameList = String(options.frames || "").split(",").filter(Boolean).map(Number);
  return options;
}

export function buildCaptureUrl(options, frame) {
  const targetUrl = new URL(options.url);
  targetUrl.searchParams.set(options.frameParam, String(frame));
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

function validateOptions(options) {
  if (!options.url || !options.output || !options.frameList.length) throw new Error(usage());
  if (options.frameList.some((frame) => !Number.isInteger(frame) || frame < 1)) throw new Error("Frames must be positive one-indexed integers");
  if (!(Number.isInteger(options.width) && options.width > 0 && Number.isInteger(options.height) && options.height > 0)) throw new Error("Viewport width and height must be positive integers");
  if (!(Number.isFinite(options.deviceScale) && options.deviceScale > 0)) throw new Error("Device scale must be greater than zero");
  for (const field of ["scenario", "lang", "seed", "frameParam", "scenarioParam", "langParam", "seedParam"]) if (!String(options[field] ?? "").trim()) throw new Error(`${field} must not be empty`);
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

export async function captureKeyframes(options, { browserType = chromium } = {}) {
  validateOptions(options);
  const output = path.resolve(options.output);
  await mkdir(output, { recursive: true });
  const browser = await browserType.launch({ headless: true });
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
      await locator.waitFor({ state: "visible" });
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((image) => image.complete ? null : new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        })));
      });
      const reportedFrame = assertReportedFrame(await locator.getAttribute("data-flash-frame"), frame, options.selector);
      const filename = `frame-${String(frame).padStart(pad, "0")}.png`;
      const filePath = path.join(output, filename);
      await locator.screenshot({ path: filePath, animations: "disabled" });
      const bytes = await readFile(filePath);
      const png = PNG.sync.read(bytes);
      captured.push({
        frame,
        reportedFrame,
        scenario: options.scenario,
        language: options.lang,
        seed: String(options.seed),
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

  const clean = !captureError && !consoleErrors.length && !failedRequests.length && !httpErrors.length && !unexpectedRequests.length;
  const manifest = {
    schemaVersion: 2,
    status: clean ? "complete" : "failed",
    capturedAt: new Date().toISOString(),
    sourceUrl: options.url,
    selector: options.selector,
    reportedFrameAttribute: "data-flash-frame",
    scenario: options.scenario,
    language: options.lang,
    seed: String(options.seed),
    queryParameters: {
      frame: options.frameParam,
      scenario: options.scenarioParam,
      language: options.langParam,
      seed: options.seedParam,
    },
    viewport: { width: options.width, height: options.height, deviceScaleFactor: options.deviceScale },
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
