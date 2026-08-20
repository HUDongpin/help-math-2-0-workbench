import {spawn} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createServer} from "node:net";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "@playwright/test";

import {captureKeyframes} from "./capture-animation-keyframes.mjs";
import {captureCoverageV2Requirements} from "./capture-coverage-v2-requirements.mjs";
import {collectImplementationArtifactClosure} from "./implementation-artifact-closure.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const COOKIE_NAME = "helpmath_executive_preview";
const SESSION_PATTERN = /^v1\.\d+\.[A-Za-z0-9_-]{43}$/u;
const OUTPUTS = Object.freeze([
  Object.freeze({
    id: "course-g04-l03-ts-006",
    requirement: "req:sprite-23:lesson-shell-natural-entry:en",
    outputRoot: "output/playwright/g4-l3-current-js-v3/course-g04-l03-ts-006-en-current-r6",
  }),
  Object.freeze({
    id: "course-g05-l04-rw-002",
    requirement: "req:sprite-341:lesson-shell-natural-entry:en",
    outputRoot: "output/playwright/g5-l4-current-js-v1/course-g05-l04-rw-002-en-current-r2",
  }),
]);
const TS006_INVENTORY_SUCCESSOR_REPORT =
  "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.json";
const TS006_INVENTORY_SUCCESSOR_REPORT_SHA256 =
  "4b49ef2bfc76a438db401eeaaefe6d97ff75a1f3db64320dfdd030a0a7271ef3";
const TS006_PRIOR_CAPTURE =
  "output/playwright/g4-l3-current-js-v3/course-g04-l03-ts-006-en-current-r3/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function collectSuccessorArtifactClosure(input) {
  if (input.manifest.animationId !== "course-g04-l03-ts-006") {
    return collectImplementationArtifactClosure(input);
  }
  const [reportBytes, inventoryBytes, rendererManifestBytes, priorCaptureBytes] =
    await Promise.all([
      readFile(path.join(PROJECT_ROOT, TS006_INVENTORY_SUCCESSOR_REPORT)),
      readFile(path.join(PROJECT_ROOT, "migrations/course-g04-l03-ts-006/asset-inventory.csv")),
      readFile(path.join(PROJECT_ROOT, "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json")),
      readFile(path.join(PROJECT_ROOT, TS006_PRIOR_CAPTURE)),
    ]);
  invariant(
    sha256(reportBytes) === TS006_INVENTORY_SUCCESSOR_REPORT_SHA256,
    "TS006 inventory successor report drifted",
  );
  const report = JSON.parse(reportBytes);
  invariant(
    sha256(inventoryBytes) === report.predecessorInventory.sha256,
    "TS006 canonical asset inventory is not the preserved predecessor",
  );
  invariant(
    sha256(rendererManifestBytes) === report.exactTransition.successor,
    "TS006 renderer manifest does not match the exact successor binding",
  );
  invariant(
    report.exactTransition.changedFieldCount === 1,
    "TS006 inventory successor is not one-field bounded",
  );
  invariant(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    "TS006 inventory successor promotes acceptance",
  );

  const adjustedManifest = structuredClone(input.manifest);
  delete adjustedManifest.evidence.assetInventory;
  const closure = await collectImplementationArtifactClosure({
    ...input,
    manifest: adjustedManifest,
  });
  const priorClosure = JSON.parse(priorCaptureBytes).implementationArtifactClosure;
  invariant(priorClosure, "TS006 prior successful capture lacks an implementation closure");
  invariant(
    JSON.stringify(closure.artifacts.map(({path: artifactPath}) => artifactPath))
      === JSON.stringify(priorClosure.artifacts.map(({path: artifactPath}) => artifactPath)),
    "TS006 successor closure artifact path set differs from the prior full closure",
  );
  invariant(
    JSON.stringify(closure.projections.map(({path: projectionPath}) => projectionPath))
      === JSON.stringify(priorClosure.projections.map(({path: projectionPath}) => projectionPath)),
    "TS006 successor closure projection path set differs from the prior full closure",
  );
  return closure;
}

export function parseMode(argv) {
  if (argv.length === 1 && argv[0] === "--run") return "run";
  if (argv.length === 1 && argv[0] === "--help") return "help";
  throw new Error("expected exactly --run or --help");
}

function isExactLoopbackOrigin(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:"
      && parsed.hostname === "127.0.0.1"
      && parsed.username === ""
      && parsed.password === ""
      && parsed.pathname === "/"
      && parsed.search === ""
      && parsed.hash === "";
  } catch {
    return false;
  }
}

export function privateSessionTransportDescriptor(origin) {
  invariant(isExactLoopbackOrigin(origin), "origin must be exact credential-free 127.0.0.1 HTTP");
  return Object.freeze({
    mode: "existing-private-preview-session-cookie",
    exactOrigin: origin,
    cookieName: COOKIE_NAME,
    credentialSource: "ephemeral-in-process-login-response",
    credentialRecorded: false,
    cookieInstalledForExactOriginAndStrippedFromOtherOrigins: true,
    publicBypassCreated: false,
  });
}

export function buildSessionScopedBrowserType({
  session,
  exactOrigin,
  browserType = chromium,
}) {
  invariant(SESSION_PATTERN.test(session), "private preview session has an invalid shape");
  privateSessionTransportDescriptor(exactOrigin);
  return Object.freeze({
    async launch(options) {
      const browser = await browserType.launch(options);
      return Object.freeze({
        version: () => browser.version(),
        async newContext(contextOptions) {
          const context = await browser.newContext(contextOptions);
          await context.addCookies([{
            name: COOKIE_NAME,
            value: session,
            url: exactOrigin,
            httpOnly: true,
            sameSite: "Lax",
          }]);
          await context.route("**/*", async (route) => {
            let requestOrigin = "";
            try {
              requestOrigin = new URL(route.request().url()).origin;
            } catch {
              // Non-URL requests never receive the session cookie.
            }
            const headers = {...route.request().headers()};
            if (requestOrigin !== exactOrigin) delete headers.cookie;
            await route.continue({headers});
          });
          return context;
        },
        close: () => browser.close(),
      });
    },
  });
}

async function reserveLoopbackPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  invariant(address && typeof address === "object", "failed to reserve a loopback port");
  const port = address.port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(origin, child, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "not started";
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`development server exited early with ${child.exitCode}`);
    try {
      const response = await fetch(`${origin}/executive-preview`, {redirect: "manual"});
      if (response.status === 200) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`development server did not become ready: ${lastError}`);
}

function extractSessionCookie(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);
  for (const value of values) {
    const match = value.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`, "u"));
    if (match && SESSION_PATTERN.test(match[1])) return {
      value: match[1],
      flags: {
        httpOnly: /(?:^|;)\s*HttpOnly(?:;|$)/iu.test(value),
        sameSiteLax: /(?:^|;)\s*SameSite=Lax(?:;|$)/iu.test(value),
        pathRoot: /(?:^|;)\s*Path=\/(?:;|$)/iu.test(value),
        secure: /(?:^|;)\s*Secure(?:;|$)/iu.test(value),
      },
    };
  }
  throw new Error("login response did not contain the expected session cookie");
}

async function probe(origin, pathname, session) {
  const response = await fetch(`${origin}${pathname}`, {
    redirect: "manual",
    headers: session ? {cookie: `${COOKIE_NAME}=${session}`} : undefined,
  });
  return Object.freeze({
    pathname,
    authenticated: Boolean(session),
    status: response.status,
    location: response.headers.get("location"),
    cacheControl: response.headers.get("cache-control"),
    robots: response.headers.get("x-robots-tag"),
    controlledPreview: response.headers.get("x-helpmath-controlled-preview"),
  });
}

async function stopChild(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  const exited = await Promise.race([
    new Promise((resolve) => child.once("exit", () => resolve(true))),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (!exited && child.exitCode === null) child.kill("SIGKILL");
}

export async function runPrivatePreviewCaptures({logger = console.error} = {}) {
  const port = await reserveLoopbackPort();
  const origin = `http://127.0.0.1:${port}`;
  const accessKey = randomBytes(32).toString("hex");
  const sessionSecret = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const child = spawn("npm", ["run", "dev", "--workspace", "@helpmath/web", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      EXECUTIVE_PREVIEW_ENABLED: "true",
      EXECUTIVE_PREVIEW_ACCESS_KEY: accessKey,
      EXECUTIVE_PREVIEW_SESSION_SECRET: sessionSecret,
      EXECUTIVE_PREVIEW_EXPIRES_AT: expiresAt,
      VERCEL_ENV: "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logTail = [];
  const retainLog = (chunk) => {
    const text = String(chunk);
    logTail.push(...text.split(/\r?\n/u).filter(Boolean));
    if (logTail.length > 40) logTail.splice(0, logTail.length - 40);
  };
  child.stdout.on("data", retainLog);
  child.stderr.on("data", retainLog);

  try {
    await waitForServer(origin, child);
    const loginResponse = await fetch(`${origin}/api/executive-preview/session`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin,
        "sec-fetch-site": "same-origin",
      },
      body: new URLSearchParams({
        locale: "en",
        passphrase: accessKey,
        returnTo: "/executive-preview",
      }),
    });
    invariant(loginResponse.status === 303, `private preview login returned HTTP ${loginResponse.status}`);
    const session = extractSessionCookie(loginResponse);
    invariant(session.flags.httpOnly, "private preview cookie is not HttpOnly");
    invariant(session.flags.sameSiteLax, "private preview cookie is not SameSite=Lax");
    invariant(session.flags.pathRoot, "private preview cookie is not scoped to Path=/");
    invariant(!session.flags.secure, "plain-HTTP loopback development cookie unexpectedly requires Secure");

    const probes = [];
    probes.push(await probe(origin, "/courses/4/3", undefined));
    probes.push(await probe(origin, "/courses/4/3", session.value));
    probes.push(await probe(origin, "/executive-preview/g5-l4", session.value));
    invariant(probes[0].status === 307, "unauthenticated G4 L3 route did not redirect to login");
    invariant(probes[1].status === 200, "authenticated G4 L3 route did not load");
    invariant(probes[2].status === 200, "authenticated G5 L4 preview did not load");
    for (const result of probes.slice(1)) {
      invariant(
        result.cacheControl?.includes("no-store")
          || result.cacheControl === "no-cache, must-revalidate",
        `${result.pathname} has an unexpected development cache policy (observed ${result.cacheControl ?? "null"})`,
      );
      invariant(
        result.robots?.includes("noindex"),
        `${result.pathname} lacks noindex (observed ${result.robots ?? "null"})`,
      );
    }

    const browserType = buildSessionScopedBrowserType({
      session: session.value,
      exactOrigin: origin,
    });
    const captures = [];
    for (const target of OUTPUTS) {
      logger(`[private capture] ${target.id}`);
      const result = await captureCoverageV2Requirements({
        id: target.id,
        projectRoot: PROJECT_ROOT,
        baseUrl: origin,
        outputRoot: target.outputRoot,
        requirements: [target.requirement],
        check: false,
      }, {
        capture: (options) => captureKeyframes(options, {
          browserType,
          collectArtifactClosure: collectSuccessorArtifactClosure,
        }),
        collectCurrentArtifactClosure: collectSuccessorArtifactClosure,
        logger,
      });
      captures.push(Object.freeze({
        id: target.id,
        requirement: target.requirement,
        outputRoot: target.outputRoot,
        manifest: result.manifestDescriptor,
        frameCount: result.manifest.selection.totalFrameCount,
      }));
    }
    return Object.freeze({
      status: "complete-private-preview-development-current-javascript-captures",
      environment: {
        server: "Next.js development server",
        exactOrigin: origin,
        credentialsGeneratedEphemerally: true,
        credentialsRecorded: false,
        publicDeploymentEvidence: false,
        developmentCacheHeaderMayOverrideProxyPrivateNoStore: true,
      },
      login: {
        endpoint: "/api/executive-preview/session",
        status: loginResponse.status,
        redirectLocation: loginResponse.headers.get("location"),
        cookieName: COOKIE_NAME,
        ...session.flags,
        credentialRecorded: false,
      },
      transport: privateSessionTransportDescriptor(origin),
      probes,
      captures,
      authority: {
        currentJavascriptImplementationCaptureOnly: true,
        productionDeployment: false,
        originalRuntime: false,
        visualOrBehavioralParity: false,
        audioAcceptance: false,
        humanReview: false,
        ownerAcceptance: false,
        strictCompletion: false,
        publication: false,
      },
    });
  } catch (error) {
    if (logTail.length) error.message += `\nserver log tail:\n${logTail.join("\n")}`;
    throw error;
  } finally {
    await stopChild(child);
  }
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  if (mode === "help") {
    console.log("Usage: node scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-07-r2.mjs --run");
    return;
  }
  const result = await runPrivatePreviewCaptures();
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
