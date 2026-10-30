// Scheduled health probe for the public production routes that crawlers and
// internal tooling read. A route fails only when more than `maxFailures` of
// its spaced attempts fail, so one transient edge error does not page anyone,
// while a sustained 5xx rate (helpmath-web issue #78) does.

export const DEFAULT_ORIGIN = "https://www.helpmath.ai";
export const DEFAULT_ATTEMPTS = 5;
export const DEFAULT_MAX_FAILURES = 1;
export const DEFAULT_DELAY_MS = 3000;
export const DEFAULT_TIMEOUT_MS = 15000;
export const USER_AGENT = "helpmath-production-route-health/1";

export const PRODUCTION_ROUTES = Object.freeze([
  Object.freeze({
    path: "/sitemap.xml",
    contentType: "xml",
    bodyCheck: (body) => body.includes("<urlset") && /<loc>[^<]+<\/loc>/u.test(body),
    bodyExpectation: "a <urlset> with at least one <loc>",
  }),
  Object.freeze({
    path: "/robots.txt",
    contentType: "text/plain",
    bodyCheck: (body) => /^user-agent:/imu.test(body),
    bodyExpectation: "a User-Agent rule",
  }),
  Object.freeze({path: "/", contentType: "text/html"}),
  Object.freeze({path: "/es", contentType: "text/html"}),
]);

function fail(message) {
  throw new Error(message);
}

export function normalizeOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`origin is not a URL: ${value}`);
  }
  if (url.protocol !== "https:") fail("origin must use https");
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    fail("origin must be a bare https origin");
  }
  return url.origin;
}

/** Returns null when the response meets the route contract, otherwise the reason. */
export function responseProblem(route, {status, contentType, body}) {
  if (status !== 200) return `HTTP ${status}`;
  if (!String(contentType ?? "").toLowerCase().includes(route.contentType)) {
    return `content-type ${contentType || "(none)"} does not include ${route.contentType}`;
  }
  if (route.bodyCheck && !route.bodyCheck(body)) return `body is missing ${route.bodyExpectation}`;
  return null;
}

export async function probeRoute({
  route,
  origin,
  attempts = DEFAULT_ATTEMPTS,
  maxFailures = DEFAULT_MAX_FAILURES,
  delayMs = DEFAULT_DELAY_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  const url = new URL(route.path, origin).toString();
  const results = [];
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) await sleep(delayMs);
    const startedAt = Date.now();
    let problem;
    let status = null;
    try {
      const response = await fetchImpl(url, {
        cache: "no-store",
        headers: {"user-agent": USER_AGENT},
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      });
      status = response.status;
      problem = responseProblem(route, {
        status,
        contentType: response.headers.get("content-type"),
        body: status === 200 ? await response.text() : "",
      });
    } catch (error) {
      problem = `request failed: ${error?.name === "TimeoutError" ? `timed out after ${timeoutMs} ms` : error?.message ?? String(error)}`;
    }
    results.push({attempt, status, ok: problem === null, problem, elapsedMs: Date.now() - startedAt});
  }
  const failures = results.filter((result) => !result.ok).length;
  return {
    path: route.path,
    url,
    attempts,
    failures,
    maxFailures,
    healthy: failures <= maxFailures,
    results,
  };
}

export async function runRouteHealth({
  origin = DEFAULT_ORIGIN,
  routes = PRODUCTION_ROUTES,
  attempts = DEFAULT_ATTEMPTS,
  maxFailures = DEFAULT_MAX_FAILURES,
  ...options
} = {}) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!Number.isInteger(attempts) || attempts < 1) fail("attempts must be a positive integer");
  if (!Number.isInteger(maxFailures) || maxFailures < 0 || maxFailures >= attempts) {
    fail("max failures must be a non-negative integer below attempts");
  }
  const checkedRoutes = [];
  for (const route of routes) {
    checkedRoutes.push(await probeRoute({route, origin: normalizedOrigin, attempts, maxFailures, ...options}));
  }
  return {
    origin: normalizedOrigin,
    healthy: checkedRoutes.every((route) => route.healthy),
    routes: checkedRoutes,
  };
}

export function formatSummary(report) {
  const lines = [
    `### HELP Math production route health: ${report.healthy ? "healthy" : "UNHEALTHY"}`,
    "",
    `Origin: \`${report.origin}\``,
    "",
    "| Route | Failed attempts | Allowed | Statuses | First problem |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const route of report.routes) {
    const statuses = route.results.map((result) => result.status ?? "error").join(", ");
    const firstProblem = route.results.find((result) => !result.ok)?.problem ?? "";
    lines.push(`| \`${route.path}\` | ${route.failures}/${route.attempts} | ${route.maxFailures} | ${statuses} | ${firstProblem.replaceAll("|", "\\|")} |`);
  }
  return `${lines.join("\n")}\n`;
}
