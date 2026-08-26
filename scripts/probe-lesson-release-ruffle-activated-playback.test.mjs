import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, realpath, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {chromium} from "@playwright/test";

import {
  buildActivatedPlaybackPlan,
  explicitlyActivateRufflePlayback,
  inspectRuffleActivationState,
  parseActivatedPlaybackArguments,
} from "./probe-lesson-release-ruffle-activated-playback.mjs";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function put(filePath, value) {
  await mkdir(path.dirname(filePath), {recursive: true});
  await writeFile(filePath, Buffer.isBuffer(value) ? value : `${JSON.stringify(value, null, 2)}\n`);
}

async function fixture() {
  const temporaryRoot = await realpath(os.tmpdir());
  const root = await mkdtemp(path.join(temporaryRoot, "lesson-ruffle-activated-probe-"));
  const bytes = Buffer.from("activated-probe-fixture-swf");
  const sha256 = digest(bytes);
  const animationId = "course-g04-l10-ti-003";
  const sourcePath = "HELP_COURSES/ELMGR4/L10/TI/L10TI03.swf";
  const canonical = `source-assets/flash/HELP MATH_ORIGINAL FILES/${sourcePath}`;
  const stage = {width: 799.9, height: 599.75};
  const assetId = `swf-${sha256}`;
  await put(path.join(root, "catalog", "lesson-releases.json"), {
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-g04-l10-fixture",
      releaseType: "complete-lesson",
      publicationMode: "atomic",
      titleDisplay: "Fixture",
      grade: 4,
      lesson: 10,
      scope: {collection: "course", grade: 4, lesson: 10, excludeNonMembers: true},
      expectedCounts: {members: 1, activeXmlReferencedPages: 1, courseShells: 0},
      members: [{
        ordinal: 1,
        animationId,
        assetId,
        releaseRole: "active-xml-referenced-page",
        source: {path: sourcePath, sha256},
      }],
    }],
  });
  await put(path.join(root, "catalog", "animations.json"), {
    schemaVersion: 1,
    animations: [{
      animationId,
      assetId,
      source: {path: sourcePath, bytes: bytes.length, sha256, swf: {stage}},
    }],
  });
  await put(path.join(root, canonical), bytes);
  await put(path.join(root, "migrations", animationId, "migration.json"), {
    id: animationId,
    animationId,
    assetId,
    source: {swf: canonical, placementPath: canonical, swfSha256: sha256},
    runtime: {stage},
  });
  await put(path.join(root, "migrations", animationId, "audit", "machine", "report.json"), {
    animationId,
    source: {
      path: canonical,
      expectedSha256: sha256,
      observedSha256Before: sha256,
      observedSha256After: sha256,
      bytesBefore: bytes.length,
      bytesAfter: bytes.length,
      hashMatches: true,
    },
    findings: {runtimeCrossCheck: {allMatch: true}},
    auditStatus: "partial",
    migrationStatusUnchanged: true,
  });
  return {root, animationId};
}

test("parses a loopback-only explicit-activation command and stable run ID", () => {
  const options = parseActivatedPlaybackArguments([
    "--release-id", "lesson-g04-l10-perimeter-area",
    "--id", "course-g04-l10-ir-001",
    "--base-url", "http://127.0.0.1:3102",
    "--lang", "both",
    "--run-id", "ir001-activated-sample",
    "--pre-activation-ms", "0",
    "--post-activation-ms", "750",
    "--timeout-ms", "5000",
    "--check",
  ]);
  assert.equal(options.runId, "ir001-activated-sample");
  assert.equal(options.preActivationMs, 0);
  assert.equal(options.postActivationMs, 750);
  assert.equal(options.timeoutMs, 5000);
  assert.equal(options.check, true);
  assert.throws(() => parseActivatedPlaybackArguments([
    "--release-id", "lesson-g04-l10-perimeter-area",
    "--base-url", "https://127.0.0.1:3102",
  ]), /plain HTTP/);
  assert.throws(() => parseActivatedPlaybackArguments([
    "--release-id", "lesson-g04-l10-perimeter-area",
    "--base-url", "http://example.com:3102",
  ]), /exact loopback/);
});

test("reuses exact release binding but maps fractional native and ceil raster stages into a separate append-only output tree", async (t) => {
  const current = await fixture();
  t.after(() => rm(current.root, {recursive: true, force: true}));
  const plan = await buildActivatedPlaybackPlan({
    root: current.root,
    releaseId: "lesson-g04-l10-fixture",
    ids: [current.animationId],
    baseUrl: "http://127.0.0.1:3102",
    language: "both",
    runId: "fractional-stage-run",
    releaseCatalogPath: path.join(current.root, "catalog", "lesson-releases.json"),
    animationCatalogPath: path.join(current.root, "catalog", "animations.json"),
    migrationsRoot: path.join(current.root, "migrations"),
  });
  assert.equal(plan.runs.length, 2);
  assert.deepEqual(plan.runs[0].nativeStage, {width: 799.9, height: 599.75});
  assert.deepEqual(plan.runs[0].rasterStage, {width: 800, height: 600});
  assert.ok(plan.runs.every((run) => run.output.includes("lesson-ruffle-activated-natural-playback-diagnostics")));
  assert.ok(plan.runs.every((run) => run.output.includes("fractional-stage-run")));
  assert.ok(plan.runs.every((run) => !run.output.includes(`${path.sep}lesson-ruffle-reference-diagnostics${path.sep}`)));
  assert.equal(plan.outputSeparation.routeLoadArtifactsAreNeverReadOrWritten, true);
});

async function fakeRufflePage({playVisible, unmuteVisible, showUnmuteAfterPlay = false, blockPlayPointer = false}) {
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><body><script>
    class FakeRufflePlayer extends HTMLElement {
      constructor() {
        super();
        this._playing = false;
        this.playCalls = 0;
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = '<style>button{position:absolute;width:120px;height:80px} #pointer-blocker{position:absolute;inset:0;z-index:2}</style><button id="play-button">Play</button><button id="unmute-overlay">Unmute</button><div id="pointer-blocker"></div>';
        const play = shadow.getElementById('play-button');
        const unmute = shadow.getElementById('unmute-overlay');
        const blocker = shadow.getElementById('pointer-blocker');
        play.style.display = ${JSON.stringify(playVisible ? "block" : "none")};
        unmute.style.display = ${JSON.stringify(unmuteVisible ? "block" : "none")};
        blocker.style.display = ${JSON.stringify(blockPlayPointer ? "block" : "none")};
        this.playControl = play;
        play.addEventListener('click', () => {
          this.play();
          if (${JSON.stringify(showUnmuteAfterPlay)}) unmute.style.display = 'block';
        });
        unmute.addEventListener('click', () => { unmute.style.display = 'none'; });
      }
      play() { this.playCalls += 1; this._playing = true; this.playControl.style.display = 'none'; }
      get isPlaying() { return this._playing; }
      get readyState() { return 2; }
      get metadata() { return {width: 800, height: 600, frameRate: 12, numFrames: 10, swfVersion: 6}; }
      ruffle() { return {isPlaying: this._playing}; }
    }
    customElements.define('ruffle-player', FakeRufflePlayer);
    document.body.appendChild(document.createElement('ruffle-player'));
  <\/script></body>`);
  return {browser, page};
}

test("uses real Playwright clicks for visible play and unmute overlays and records time-local states", async (t) => {
  const {browser, page} = await fakeRufflePage({playVisible: true, unmuteVisible: false, showUnmuteAfterPlay: true});
  t.after(() => browser.close());
  const before = await inspectRuffleActivationState(page);
  assert.equal(before.publicElementIsPlaying, false);
  assert.equal(before.overlays.play.visible, true);
  const activation = await explicitlyActivateRufflePlayback(page, {timeoutMs: 5_000});
  assert.equal(activation.userActivationUsed, true);
  assert.equal(activation.userActivationAttempted, true);
  assert.equal(activation.playerPlayApiUsed, false);
  assert.deepEqual(activation.steps.filter(({method}) => method === "playwright-user-click").map(({method, target}) => [method, target]), [
    ["playwright-user-click", "ruffle-shadow-play-button"],
    ["playwright-user-click", "ruffle-shadow-unmute-overlay"],
  ]);
  assert.equal(activation.after.publicElementIsPlaying, true);
  assert.equal(activation.after.overlays.play.visible, false);
  assert.equal(activation.after.overlays.unmute.visible, false);
  assert.equal(await page.locator("ruffle-player").evaluate((player) => player.playCalls), 1);
});

test("records player.play API fallback when no playback overlay is visible", async (t) => {
  const {browser, page} = await fakeRufflePage({playVisible: false, unmuteVisible: false});
  t.after(() => browser.close());
  const activation = await explicitlyActivateRufflePlayback(page, {timeoutMs: 5_000});
  assert.equal(activation.userActivationUsed, false);
  assert.equal(activation.userActivationAttempted, false);
  assert.equal(activation.playerPlayApiUsed, true);
  assert.equal(activation.steps[0].method, "player-play-api");
  assert.equal(activation.steps[0].reason, "no-visible-playback-overlay");
  assert.equal(activation.after.publicElementIsPlaying, true);
  assert.equal(await page.locator("ruffle-player").evaluate((player) => player.playCalls), 1);
});

test("records an intercepted preferred user click before falling back to player.play API and clearing the play overlay", async (t) => {
  const {browser, page} = await fakeRufflePage({playVisible: true, unmuteVisible: false, blockPlayPointer: true});
  t.after(() => browser.close());
  const activation = await explicitlyActivateRufflePlayback(page, {timeoutMs: 250});
  assert.equal(activation.userActivationAttempted, true);
  assert.equal(activation.userActivationUsed, false);
  assert.equal(activation.playerPlayApiUsed, true);
  const clickAttempt = activation.steps.find(({method}) => method === "playwright-user-click-attempt");
  const apiStep = activation.steps.find(({method}) => method === "player-play-api");
  assert.equal(clickAttempt.outcome, "not-delivered");
  assert.match(clickAttempt.error, /intercepts pointer events|Timeout/);
  assert.ok(apiStep);
  assert.equal(activation.after.overlays.play.visible, false);
  assert.equal(activation.after.publicElementIsPlaying, true);
});

test("records unmute user activation separately from the required play API start", async (t) => {
  const {browser, page} = await fakeRufflePage({playVisible: false, unmuteVisible: true});
  t.after(() => browser.close());
  const activation = await explicitlyActivateRufflePlayback(page, {timeoutMs: 5_000});
  assert.equal(activation.userActivationUsed, true);
  assert.equal(activation.playerPlayApiUsed, true);
  assert.deepEqual(activation.steps.filter(({method}) => method !== "playwright-hover" && method !== "playwright-hover-attempt").map(({method, target}) => [method, target]), [
    ["playwright-user-click", "ruffle-shadow-unmute-overlay"],
    ["player-play-api", "ruffle-player"],
  ]);
  assert.equal(activation.after.publicElementIsPlaying, true);
});
