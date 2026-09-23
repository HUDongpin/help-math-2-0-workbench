import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, realpath, rm, writeFile} from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {chromium} from "@playwright/test";

import {
  assertLoopbackBaseUrl,
  buildReleaseProbePlan,
  expandLanguages,
  installPlaywrightNetworkGuard,
  parseArguments,
  readPinnedRuffleNetworkingBoundary,
  requestDisposition,
  unwrapSourceResponseOutcome,
  waitForSourceResponseSettled,
} from "./probe-lesson-release-ruffle-reference.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function put(filePath, value) {
  await mkdir(path.dirname(filePath), {recursive: true});
  await writeFile(filePath, Buffer.isBuffer(value) ? value : `${JSON.stringify(value, null, 2)}\n`);
}

async function fixture() {
  const temporaryRoot = await realpath(os.tmpdir());
  const root = await mkdtemp(path.join(temporaryRoot, "lesson-ruffle-probe-"));
  const members = [
    {
      ordinal: 1,
      animationId: "course-g04-l10-in-002",
      releaseRole: "active-xml-referenced-page",
      sourcePath: "HELP_COURSES/ELMGR4/L10/IN/L10IN02.swf",
      bytes: Buffer.from("fixture-swf-one"),
      stage: {width: 800, height: 600},
    },
    {
      ordinal: 2,
      animationId: "course-g04-l10-ti-003",
      releaseRole: "course-shell",
      sourcePath: "HELP_COURSES/ELMGR4/L10/TI/L10TI03.swf",
      bytes: Buffer.from("fixture-swf-two"),
      stage: {width: 799.9, height: 599.75},
    },
  ].map((member) => ({
    ...member,
    sha256: digest(member.bytes),
    assetId: `swf-${digest(member.bytes)}`,
  }));
  const releaseMembers = members.map((member) => ({
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    source: {path: member.sourcePath, sha256: member.sha256},
  }));
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
      expectedCounts: {members: 2, activeXmlReferencedPages: 1, courseShells: 1},
      members: releaseMembers,
    }],
  });
  await put(path.join(root, "catalog", "animations.json"), {
    schemaVersion: 1,
    animations: members.map((member) => ({
      animationId: member.animationId,
      assetId: member.assetId,
      source: {
        path: member.sourcePath,
        bytes: member.bytes.length,
        sha256: member.sha256,
        swf: {stage: member.stage},
      },
    })),
  });
  await mkdir(path.join(root, "migrations"), {recursive: true});
  for (const member of members) {
    const canonical = `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.sourcePath}`;
    await put(path.join(root, canonical), member.bytes);
    const workspace = path.join(root, "migrations", member.animationId);
    await put(path.join(workspace, "migration.json"), {
      id: member.animationId,
      animationId: member.animationId,
      assetId: member.assetId,
      source: {
        swf: canonical,
        placementPath: canonical,
        swfSha256: member.sha256,
      },
      runtime: {stage: member.stage},
    });
    await put(path.join(workspace, "audit", "machine", "report.json"), {
      animationId: member.animationId,
      source: {
        path: canonical,
        expectedSha256: member.sha256,
        observedSha256Before: member.sha256,
        observedSha256After: member.sha256,
        bytesBefore: member.bytes.length,
        bytesAfter: member.bytes.length,
        hashMatches: true,
      },
      findings: {runtimeCrossCheck: {allMatch: true}},
      auditStatus: "partial",
      migrationStatusUnchanged: true,
    });
  }
  return {root, members};
}

test("accepts only an exact credential-free plain-HTTP loopback origin", () => {
  assert.equal(assertLoopbackBaseUrl("http://127.0.0.1:3104"), "http://127.0.0.1:3104");
  assert.equal(assertLoopbackBaseUrl("http://localhost:3000"), "http://localhost:3000");
  assert.throws(() => assertLoopbackBaseUrl("https://127.0.0.1:3104"), /plain HTTP/);
  assert.throws(() => assertLoopbackBaseUrl("http://example.com:3104"), /exact loopback/);
  assert.throws(() => assertLoopbackBaseUrl("http://user:pass@127.0.0.1:3104"), /credentials/);
});

test("parses an exact release command with optional member subset and bilingual routes", () => {
  const options = parseArguments([
    "--release-id", "lesson-g04-l10-perimeter-area",
    "--id", "course-g04-l10-ti-003",
    "--id", "course-g04-l10-in-002",
    "--base-url", "http://127.0.0.1:3104",
    "--lang", "both",
    "--settle-ms", "0",
    "--timeout-ms", "5000",
  ]);
  assert.equal(options.releaseId, "lesson-g04-l10-perimeter-area");
  assert.deepEqual(options.ids, ["course-g04-l10-ti-003", "course-g04-l10-in-002"]);
  assert.deepEqual(expandLanguages(options.language), ["en", "es"]);
  assert.equal(options.settleMs, 0);
  assert.equal(options.timeoutMs, 5000);
  assert.throws(() => parseArguments(["--base-url", "http://127.0.0.1:3104"]), /release-id/);
  assert.throws(() => parseArguments([
    "--release-id", "lesson-g04-l10-perimeter-area",
    "--base-url", "http://127.0.0.1:3104",
    "--lang", "fr",
  ]), /en, es, or both/);
  assert.throws(() => parseArguments([
    "--release-id", "lesson-g04-l10-perimeter-area",
    "--base-url", "http://127.0.0.1:3104",
    "--id", "course-g04-l10-in-002",
    "--id", "course-g04-l10-in-002",
  ]), /must not be repeated/);
});

test("exact request policy allows only the page, SWF API, _next, and Ruffle GETs", () => {
  const policy = {
    expectedOrigin: "http://127.0.0.1:3104",
    pageUrl: "http://127.0.0.1:3104/reference/member",
    sourceUrl: "http://127.0.0.1:3104/api/reference/member",
  };
  assert.equal(requestDisposition(policy.pageUrl, "GET", policy).allowed, true);
  assert.equal(requestDisposition(policy.sourceUrl, "GET", policy).allowed, true);
  assert.equal(requestDisposition("http://127.0.0.1:3104/_next/static/chunk.js", "GET", policy).allowed, true);
  assert.equal(requestDisposition("http://127.0.0.1:3104/api/ruffle/ruffle.js", "GET", policy).allowed, true);
  assert.equal(requestDisposition(`${policy.pageUrl}?drift=1`, "GET", policy).allowed, false);
  assert.equal(requestDisposition("http://127.0.0.1:3104/favicon.ico", "GET", policy).kind, "blocked-local-unallowlisted-get");
  assert.equal(requestDisposition(policy.sourceUrl, "HEAD", policy).kind, "blocked-local-non-get");
  assert.equal(requestDisposition(policy.sourceUrl, "POST", policy).kind, "blocked-local-non-get");
  assert.equal(requestDisposition("https://example.com/file", "GET", policy).kind, "blocked-external-or-non-loopback-get");
});

test("validates source path, hash, bytes, machine stage cross-check, and preserves release ordinal order", async (t) => {
  const current = await fixture();
  t.after(() => rm(current.root, {recursive: true, force: true}));
  const plan = await buildReleaseProbePlan({
    root: current.root,
    releaseId: "lesson-g04-l10-fixture",
    ids: [current.members[1].animationId, current.members[0].animationId],
    baseUrl: "http://127.0.0.1:3104",
    language: "both",
  });
  assert.deepEqual(plan.members.map(({animationId}) => animationId), current.members.map(({animationId}) => animationId));
  assert.deepEqual(plan.members.map(({stage}) => stage), [{width: 800, height: 600}, {width: 799.9, height: 599.75}]);
  assert.deepEqual(
    plan.runs.map(({ordinal, language}) => [ordinal, language]),
    [[1, "en"], [1, "es"], [2, "en"], [2, "es"]],
  );
  assert.ok(plan.runs.every(({output}) => output.startsWith(path.join(current.root, "output", "playwright", "lesson-ruffle-reference-diagnostics", "lesson-g04-l10-fixture") + path.sep)));
  assert.equal(plan.release.selection, "explicit-exact-release-subset");
});

test("fails closed on non-member selection and physical source byte/hash drift", async (t) => {
  const current = await fixture();
  t.after(() => rm(current.root, {recursive: true, force: true}));
  await assert.rejects(buildReleaseProbePlan({
    root: current.root,
    releaseId: "lesson-g04-l10-fixture",
    ids: ["course-g04-l10-unknown-001"],
    baseUrl: "http://127.0.0.1:3104",
  }), /not an exact member/);
  const source = path.join(
    current.root,
    "source-assets",
    "flash",
    "HELP MATH_ORIGINAL FILES",
    ...current.members[0].sourcePath.split("/"),
  );
  await writeFile(source, "drifted-source-bytes");
  await assert.rejects(buildReleaseProbePlan({
    root: current.root,
    releaseId: "lesson-g04-l10-fixture",
    baseUrl: "http://127.0.0.1:3104",
    language: "en",
  }), /byte count conflicts|hash conflicts/);
});

test("records the pinned Ruffle 0.4.1 None-mode limitation from local source", async () => {
  const boundary = await readPinnedRuffleNetworkingBoundary({root: projectRoot});
  assert.equal(boundary.rufflePackageVersion, "0.4.1");
  assert.equal(boundary.lockfilePinnedVersionVerified, true);
  assert.match(boundary.localSourceDocumentation.statement, /NetworkingAccessMode\.None.*not implemented/);
  assert.match(boundary.enforcement.statement, /route interception is the network enforcement boundary/);
  assert.equal(boundary.configuredPlayerDefenseInDepth.allowNetworking, "none");
});

test("real Playwright context interception aborts and records non-allowlisted HTTP and WebSocket requests", async (t) => {
  const reached = [];
  let reachedWebSocketUpgrade = false;
  const server = http.createServer((request, response) => {
    reached.push({method: request.method, url: request.url});
    if (request.url === "/reference/member") {
      response.writeHead(200, {"content-type": "text/html"});
      response.end("<!doctype html><title>fixture</title>");
    } else if (request.url === "/api/reference/member") {
      response.writeHead(200, {"content-type": "application/x-shockwave-flash"});
      response.end("swf");
    } else {
      response.writeHead(200, {"content-type": "text/plain"});
      response.end("unexpected");
    }
  });
  server.on("upgrade", () => {
    reachedWebSocketUpgrade = true;
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const pageUrl = `${origin}/reference/member`;
  const sourceUrl = `${origin}/api/reference/member`;
  const browser = await chromium.launch({headless: true});
  t.after(() => browser.close());
  const context = await browser.newContext({serviceWorkers: "block"});
  t.after(() => context.close());
  const guard = await installPlaywrightNetworkGuard(context, {expectedOrigin: origin, pageUrl, sourceUrl});
  const page = await context.newPage();
  await page.goto(pageUrl);
  const results = await page.evaluate(async ({sourceUrl, origin}) => {
    const settle = (promise) => promise.then(
      (response) => ({status: "fulfilled", httpStatus: response.status}),
      () => ({status: "rejected"}),
    );
    return Promise.all([
      settle(fetch(sourceUrl)),
      settle(fetch(`${origin}/not-allowlisted`)),
      settle(fetch(sourceUrl, {method: "POST"})),
      settle(fetch("http://example.com/blocked")),
    ]);
  }, {sourceUrl, origin});
  const webSocketOutcome = await page.evaluate((webSocketUrl) => new Promise((resolve) => {
    const socket = new WebSocket(webSocketUrl);
    const timer = setTimeout(() => resolve("timeout"), 2_000);
    socket.addEventListener("open", () => {
      clearTimeout(timer);
      resolve("opened");
    }, {once: true});
    socket.addEventListener("error", () => {
      clearTimeout(timer);
      resolve("blocked");
    }, {once: true});
    socket.addEventListener("close", () => {
      clearTimeout(timer);
      resolve("blocked");
    }, {once: true});
  }), `${origin.replace("http://", "ws://")}/blocked-socket`);
  assert.deepEqual(results.map(({status}) => status), ["fulfilled", "rejected", "rejected", "rejected"]);
  assert.deepEqual(reached, [
    {method: "GET", url: "/reference/member"},
    {method: "GET", url: "/api/reference/member"},
  ]);
  assert.equal(guard.blockedRequests.length, 3);
  assert.ok(guard.blockedRequests.some(({kind}) => kind === "blocked-local-unallowlisted-get"));
  assert.ok(guard.blockedRequests.some(({kind}) => kind === "blocked-local-non-get"));
  assert.ok(guard.blockedRequests.some(({kind}) => kind === "blocked-external-or-non-loopback-get"));
  assert.equal(webSocketOutcome, "blocked");
  assert.equal(guard.blockedWebSockets.length, 1);
  assert.equal(guard.blockedWebSockets[0].kind, "blocked-websocket");
  assert.equal(reachedWebSocketUpgrade, false);
});

test("source-response wait settles page/context closure without an unhandled rejection and preserves the error", async (t) => {
  const browser = await chromium.launch({headless: true});
  t.after(() => browser.close());
  const context = await browser.newContext();
  const page = await context.newPage();
  const outcomePromise = waitForSourceResponseSettled(
    page,
    "http://127.0.0.1:9/api/reference/never-arrives",
    5_000,
  );
  await context.close();
  const outcome = await outcomePromise;
  assert.equal(outcome.status, "rejected");
  assert.match(outcome.error.message, /Target page, context or browser has been closed/);
  assert.throws(
    () => unwrapSourceResponseOutcome(outcome),
    /Target page, context or browser has been closed/,
  );
});
