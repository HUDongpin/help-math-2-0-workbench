import assert from "node:assert/strict";
import test from "node:test";
import {
  PRODUCTION_ROUTES,
  formatSummary,
  normalizeOrigin,
  probeRoute,
  responseProblem,
  runRouteHealth,
} from "./production-route-health.mjs";

const SITEMAP = PRODUCTION_ROUTES.find((route) => route.path === "/sitemap.xml");
const ROBOTS = PRODUCTION_ROUTES.find((route) => route.path === "/robots.txt");
const HOME = PRODUCTION_ROUTES.find((route) => route.path === "/");
const SITEMAP_BODY = '<?xml version="1.0"?><urlset><url><loc>https://www.helpmath.ai/</loc></url></urlset>';

function response(status, contentType, body = "") {
  return new Response(body, {status, headers: contentType ? {"content-type": contentType} : {}});
}

function healthyResponse(url) {
  const {pathname} = new URL(url);
  if (pathname === "/sitemap.xml") return response(200, "application/xml", SITEMAP_BODY);
  if (pathname === "/robots.txt") return response(200, "text/plain", "User-Agent: *\nAllow: /\n");
  return response(200, "text/html; charset=utf-8", "<!doctype html>");
}

function scriptedFetch(script) {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, init) => {
      calls.push({url, init});
      const next = script(url, calls.length);
      if (next instanceof Error) throw next;
      return next;
    },
  };
}

const noSleep = async () => {};

test("route contracts accept the healthy production responses", () => {
  assert.equal(responseProblem(SITEMAP, {status: 200, contentType: "application/xml", body: SITEMAP_BODY}), null);
  assert.equal(responseProblem(ROBOTS, {status: 200, contentType: "text/plain", body: "User-Agent: *\nDisallow: /"}), null);
  assert.equal(responseProblem(HOME, {status: 200, contentType: "text/html; charset=utf-8", body: ""}), null);
});

test("route contracts reject 5xx, wrong types and empty sitemaps", () => {
  assert.equal(responseProblem(SITEMAP, {status: 500, contentType: "text/html", body: ""}), "HTTP 500");
  assert.match(responseProblem(SITEMAP, {status: 200, contentType: "text/html", body: SITEMAP_BODY}), /content-type/u);
  assert.match(responseProblem(SITEMAP, {status: 200, contentType: "application/xml", body: "<urlset></urlset>"}), /<loc>/u);
  assert.match(responseProblem(ROBOTS, {status: 200, contentType: "text/plain", body: ""}), /User-Agent/u);
  assert.equal(responseProblem(HOME, {status: 308, contentType: null, body: ""}), "HTTP 308");
});

test("one transient 5xx stays within the default threshold", async () => {
  const {fetchImpl, calls} = scriptedFetch((url, call) => call === 2 ? response(500, "text/html") : healthyResponse(url));
  const result = await probeRoute({route: SITEMAP, origin: "https://www.helpmath.ai", fetchImpl, sleep: noSleep});
  assert.equal(calls.length, 5);
  assert.equal(result.failures, 1);
  assert.equal(result.healthy, true);
  assert.deepEqual(result.results.map((entry) => entry.status), [200, 500, 200, 200, 200]);
});

test("a sustained 5xx rate or network errors mark the route unhealthy", async () => {
  const {fetchImpl} = scriptedFetch((url, call) => call % 2 === 0 ? response(503, "text/html") : healthyResponse(url));
  const flaky = await probeRoute({route: SITEMAP, origin: "https://www.helpmath.ai", fetchImpl, sleep: noSleep});
  assert.equal(flaky.failures, 2);
  assert.equal(flaky.healthy, false);

  const down = scriptedFetch(() => new TypeError("fetch failed"));
  const unreachable = await probeRoute({route: HOME, origin: "https://www.helpmath.ai", fetchImpl: down.fetchImpl, sleep: noSleep});
  assert.equal(unreachable.failures, 5);
  assert.equal(unreachable.healthy, false);
  assert.match(unreachable.results[0].problem, /request failed: fetch failed/u);
});

test("probes bypass caches, never follow redirects and identify themselves", async () => {
  const {fetchImpl, calls} = scriptedFetch((url) => healthyResponse(url));
  await probeRoute({route: ROBOTS, origin: "https://www.helpmath.ai", attempts: 1, fetchImpl, sleep: noSleep});
  assert.equal(calls[0].url, "https://www.helpmath.ai/robots.txt");
  assert.equal(calls[0].init.cache, "no-store");
  assert.equal(calls[0].init.redirect, "manual");
  assert.match(calls[0].init.headers["user-agent"], /^helpmath-production-route-health\//u);
  assert.ok(calls[0].init.signal instanceof AbortSignal);
});

test("the full run checks sitemap, robots and both locale homes", async () => {
  const {fetchImpl, calls} = scriptedFetch((url) => healthyResponse(url));
  const report = await runRouteHealth({fetchImpl, sleep: noSleep, attempts: 2});
  assert.equal(report.healthy, true);
  assert.deepEqual(report.routes.map((route) => route.path), ["/sitemap.xml", "/robots.txt", "/", "/es"]);
  assert.equal(calls.length, 8);
  assert.match(formatSummary(report), /healthy/u);
});

test("an unhealthy route fails the whole run and is named in the summary", async () => {
  const {fetchImpl} = scriptedFetch((url) => new URL(url).pathname === "/sitemap.xml" ? response(500, "text/html") : healthyResponse(url));
  const report = await runRouteHealth({fetchImpl, sleep: noSleep});
  assert.equal(report.healthy, false);
  const summary = formatSummary(report);
  assert.match(summary, /UNHEALTHY/u);
  assert.match(summary, /`\/sitemap\.xml` \| 5\/5 \| 1 \| 500, 500, 500, 500, 500 \| HTTP 500/u);
});

test("options are validated before any request", async () => {
  assert.equal(normalizeOrigin("https://www.helpmath.ai/"), "https://www.helpmath.ai");
  assert.throws(() => normalizeOrigin("http://www.helpmath.ai"), /https/u);
  assert.throws(() => normalizeOrigin("https://www.helpmath.ai/es"), /bare/u);
  assert.throws(() => normalizeOrigin("https://user:pass@www.helpmath.ai"), /bare/u);
  const {fetchImpl, calls} = scriptedFetch((url) => healthyResponse(url));
  await assert.rejects(runRouteHealth({fetchImpl, attempts: 0}), /attempts/u);
  await assert.rejects(runRouteHealth({fetchImpl, attempts: 3, maxFailures: 3}), /max failures/u);
  assert.equal(calls.length, 0);
});
