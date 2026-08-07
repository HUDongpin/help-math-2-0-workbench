import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  buildAuthoritativeChartOverlay,
  buildSafeRuntime,
  generateSafeAnimateCreatejsAdapter,
  parseArguments,
  patchTweenJs,
  resolveAdapterFrameState,
  sanitizeAnimateExport,
  validateAdapterAuditEvidence,
  validateSpec
} from "./build-safe-animate-createjs-adapter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_PATH = path.join(ROOT, "migrations/course-g03-l01-vb-004/audit/animate-createjs-adapter-spec.json");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function loadInputs() {
  const spec = validateSpec(JSON.parse(await readFile(SPEC_PATH, "utf8")));
  const [animateJs, tweenJs, glyphHtml, scenarioInventory, ffdecScriptsGzip, audioAudit, authoringAudit, adobeStandaloneBaseline] = await Promise.all([
    readFile(path.join(ROOT, spec.authoringExport.javascript), "utf8"),
    readFile(path.join(ROOT, spec.createjs.tweenjs.source), "utf8"),
    readFile(path.join(ROOT, spec.glyphEvidence.framesHtml), "utf8"),
    readFile(path.join(ROOT, spec.evidence.scenarioInventory), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, spec.evidence.ffdecScripts)),
    readFile(path.join(ROOT, spec.evidence.audioAudit), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, spec.evidence.authoringAudit), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, spec.evidence.adobeStandaloneBaseline), "utf8").then(JSON.parse)
  ]);
  return {spec, animateJs, tweenJs, glyphHtml, scenarioInventory, ffdecScripts: gunzipSync(ffdecScriptsGzip).toString("utf8"), audioAudit, authoringAudit, adobeStandaloneBaseline};
}

test("adapter CLI is explicit and rejects unknown arguments", () => {
  assert.deepEqual(parseArguments(["--check"], {root: ROOT}), {check: true, specPath: SPEC_PATH});
  assert.throws(() => parseArguments(["--spec"], {root: ROOT}), /requires a path/);
  assert.throws(() => parseArguments(["--unknown"], {root: ROOT}), /Unknown argument/);
});

test("one-indexed local and root contracts expose only source-supported rendering boundaries", async () => {
  const {spec} = await loadInputs();
  assert.deepEqual(resolveAdapterFrameState({}, spec), {
    frame: 1,
    frameDomain: "sprite-231",
    localFrame: 1,
    exportFrame: 0,
    rootFrame: 6,
    exportRootFrame: 5,
    scenario: "linear-to-quiz-stop",
    lang: "en",
    seed: 0,
    runtimeReachability: "source-structured-linear-to-stop",
    interactionBoundary: false,
    visualLocalizationStatus: "source-shared-untranslated-visual",
    audioLocalizationStatus: "unresolved",
    audioStatus: "blocked-until-authoritative-listening-and-cue-mapping",
    interactionStatus: "blocked-until-host-bindings-branches-scoring-and-replay-are-proven",
    spanishStatus: "single-source-English-visual-rendered-untranslated; Spanish-audio-and-bilingual-parity-unresolved",
    instructionCorrection: "none",
    instructionClipRight: null,
    glyphCorrection: "authoritative-swf-vector-chart"
  });
  assert.equal(resolveAdapterFrameState({frame: 56, seed: -1}, spec).interactionBoundary, true);
  const structural = resolveAdapterFrameState({frame: 222, scenario: "authoring-frame-inspection"}, spec);
  assert.equal(structural.exportFrame, 221);
  assert.equal(structural.runtimeReachability, "structural-only-runtime-reachability-unproven");
  assert.equal(structural.glyphCorrection, "none");
  assert.equal(resolveAdapterFrameState({frame: 57}, spec).runtimeReachability, "structural-only-runtime-reachability-unproven");
  assert.equal(resolveAdapterFrameState({frame: 1, lang: "es"}, spec).visualLocalizationStatus, "source-shared-untranslated-visual");
  const rootFirst = resolveAdapterFrameState({frameDomain: "root", frame: 1, scenario: "root-standalone", lang: "es"}, spec);
  assert.equal(rootFirst.frame, 1);
  assert.equal(rootFirst.localFrame, null);
  assert.equal(rootFirst.rootFrame, 1);
  assert.equal(rootFirst.runtimeReachability, "source-standalone-sequential-step");
  const rootLast = resolveAdapterFrameState({frameDomain: "root", frame: 10, scenario: "root-standalone"}, spec);
  assert.equal(rootLast.localFrame, 10);
  assert.equal(rootLast.exportRootFrame, 9);
  assert.equal(rootLast.glyphCorrection, "authoritative-swf-vector-chart");
  assert.equal(rootLast.instructionCorrection, "authoritative-swf-vector-full-reveal");
  assert.equal(rootLast.instructionClipRight, null);
  const rootPartialFrame7 = resolveAdapterFrameState({frameDomain: "root", frame: 7, scenario: "root-standalone"}, spec);
  assert.equal(rootPartialFrame7.instructionCorrection, "authoritative-swf-vector-partial-reveal");
  assert.equal(rootPartialFrame7.instructionClipRight, 291);
  const rootPartialFrame8 = resolveAdapterFrameState({frameDomain: "root", frame: 8, scenario: "root-standalone"}, spec);
  assert.equal(rootPartialFrame8.instructionCorrection, "authoritative-swf-vector-partial-reveal");
  assert.equal(rootPartialFrame8.instructionClipRight, 361);
  assert.throws(() => resolveAdapterFrameState({frame: 0}, spec), /within 1\.\.222/);
  assert.throws(() => resolveAdapterFrameState({frameDomain: "root", frame: 1}, spec), /requires frameDomain sprite-231/);
  assert.throws(() => resolveAdapterFrameState({frame: 1, scenario: "correct-answer"}, spec), /unsupported scenario/);
});

test("adapter claims are cross-checked against scenario, audio, and Animate audits", async () => {
  const {spec, scenarioInventory, ffdecScripts, audioAudit, authoringAudit, adobeStandaloneBaseline} = await loadInputs();
  const evidence = validateAdapterAuditEvidence(spec, scenarioInventory, ffdecScripts, audioAudit, authoringAudit, adobeStandaloneBaseline);
  assert.equal(evidence.root.frameCount, 10);
  assert.equal(evidence.local.frameCount, 222);
  const changed = structuredClone(audioAudit);
  changed.acceptance.authoritativeListeningComplete = true;
  assert.throws(() => validateAdapterAuditEvidence(spec, scenarioInventory, ffdecScripts, changed, authoringAudit, adobeStandaloneBaseline), /fail-closed precondition changed/);
  assert.throws(
    () => validateAdapterAuditEvidence(spec, scenarioInventory, `${ffdecScripts}\n_global.language = "es";`, audioAudit, authoringAudit, adobeStandaloneBaseline),
    /visual language branch is now present/
  );
  const changedBaseline = structuredClone(adobeStandaloneBaseline);
  changedBaseline.runtime.lang = "es";
  assert.throws(
    () => validateAdapterAuditEvidence(spec, scenarioInventory, ffdecScripts, audioAudit, authoringAudit, changedBaseline),
    /only the observed English runtime/
  );
});

test("Animate export removes bootstrap, ambient listeners, and legacy runtime side effects", async () => {
  const {spec, animateJs} = await loadInputs();
  const output = sanitizeAnimateExport(animateJs, spec);
  new Script(output);
  assert.match(output, /HELP_MATH_VB004_INSTALL_EXPORT/);
  assert.match(output, /L1VB04workingcopy_HTML5Canvas/);
  for (const forbidden of [
    "bootstrap callback support",
    "AdobeAn",
    "addEventListener(",
    "createjs.Stage",
    "cjs.Stage",
    "LoadQueue",
    "makeResponsive",
    "document.body",
    "http://",
    "https://"
  ]) assert.equal(output.includes(forbidden), false, `sanitized export contains ${forbidden}`);
});

test("pinned TweenJS cannot register an ambient CreateJS Ticker", async () => {
  const {spec, tweenJs} = await loadInputs();
  const output = patchTweenJs(tweenJs, spec);
  new Script(output);
  assert.equal(output.includes('createjs.Ticker.addEventListener("tick",Tween)'), false);
  assert.match(output, /deterministic patch documented/);
});

test("authoritative chart overlay contains only hash-pinned SWF vector functions", async () => {
  const {spec, glyphHtml} = await loadInputs();
  const output = buildAuthoritativeChartOverlay(glyphHtml, spec);
  new Script(output);
  assert.match(output, /HELP_MATH_VB004_DRAW_AUTHORITATIVE_CHART/);
  assert.match(output, /HELP_MATH_VB004_DRAW_AUTHORITATIVE_INSTRUCTION/);
  assert.match(output, /ctx\.rect\(0, 0, clipRightExclusive, 600\)/);
  assert.match(output, /function text8/);
  assert.match(output, /function font1/);
  assert.match(output, /new Path2D\(pathData\)/);
  assert.equal(output.includes("drawPath("), false);
  assert.equal(output.includes("defaultFill = textColor"), true);
  assert.equal(output.includes("\n\tdefaultFill = textColor"), false);
});

test("custom runtime has no timer, ambient listener, network primitive, or body mutation", async () => {
  const {spec} = await loadInputs();
  const output = buildSafeRuntime(spec);
  new Script(output);
  assert.match(output, /data-flash-frame/);
  assert.match(output, /data-flash-frame-domain/);
  assert.match(output, /gotoAndStop/);
  assert.match(output, /Ticker unexpectedly initialized/);
  for (const pattern of [
    /\bfetch\b/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bsendBeacon\b/,
    /\bsetTimeout\s*\(/,
    /\bsetInterval\s*\(/,
    /\brequestAnimationFrame\s*\(/,
    /\baddEventListener\s*\(/,
    /document\.body/,
    /\bpostMessage\s*\(/,
    /window\.open\s*\(/
  ]) assert.doesNotMatch(output, pattern);
});

test("generated adapter is current, locally pinned, and outside the product registry", async () => {
  const result = await generateSafeAnimateCreatejsAdapter({root: ROOT, specPath: SPEC_PATH, check: true});
  assert.equal(result.fileCount, 11);
  assert.equal(result.productionRegistered, false);
  const outputDirectory = path.join(ROOT, result.outputDirectory);
  const manifest = JSON.parse(await readFile(path.join(outputDirectory, "manifest.json"), "utf8"));
  assert.equal(manifest.productionRegistered, false);
  assert.equal(manifest.deterministicRuntime.tickerRegistrationRemoved, true);
  assert.equal(manifest.deterministicRuntime.rootFrameCount, 10);
  assert.equal(manifest.deterministicRuntime.defaultFrameDomain, "sprite-231");
  assert.deepEqual(manifest.deterministicRuntime.supportedLanguages, ["en", "es"]);
  assert.equal(manifest.deterministicRuntime.visualLocalizationStatus, "source-shared-untranslated-visual");
  assert.equal(manifest.deterministicRuntime.audioLocalizationStatus, "unresolved");
  assert.equal(manifest.deterministicRuntime.visualLanguageBranchEvidence.exhaustiveScriptCount, 37);
  assert.equal(manifest.deterministicRuntime.visualLanguageBranchEvidence.status, "none-observed-in-exhaustive-37-script-export");
  assert.ok(manifest.deterministicRuntime.scenarios.some((scenario) => scenario.id === "root-standalone" && scenario.frameDomain === "root"));
  for (const [name, metadata] of Object.entries(manifest.generatedFiles)) {
    const value = await readFile(path.join(outputDirectory, name));
    assert.equal(value.byteLength, metadata.bytes, `${name} byte count changed`);
    assert.equal(sha256(value), metadata.sha256, `${name} hash changed`);
  }
  const html = await readFile(path.join(outputDirectory, "index.html"), "utf8");
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(html, /canvas id="flash-stage" width="800" height="600"/);
  const packageJson = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  assert.equal(packageJson.devDependencies.easeljs, "1.0.2");
  assert.equal(packageJson.devDependencies.tweenjs, "1.0.2");
});

test("original FLA and SWF remain byte-for-byte unchanged", async () => {
  const {spec} = await loadInputs();
  const [fla, swf] = await Promise.all([
    readFile(path.join(ROOT, spec.source.fla)),
    readFile(path.join(ROOT, spec.source.swf))
  ]);
  assert.equal(sha256(fla), spec.source.flaSha256);
  assert.equal(sha256(swf), spec.source.swfSha256);
});
