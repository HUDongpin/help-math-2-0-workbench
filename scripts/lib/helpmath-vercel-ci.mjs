import {readFile} from "node:fs/promises";

const SHA256 = /^[0-9a-f]{40}$/u;
const DEPLOYMENT_ID = /^dpl_[A-Za-z0-9]+$/u;
const STATUS_CONTEXT = /^[A-Za-z0-9][A-Za-z0-9 .:_/-]{0,99}$/u;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function plainObject(value) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value, expected, label) {
  invariant(plainObject(value), `${label} must be a plain object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(wanted), `${label} keys drifted`);
}

function exactBoolean(value, label) {
  invariant(typeof value === "boolean", `${label} must be boolean`);
}

function normalizedBranch(ref) {
  invariant(typeof ref === "string" && ref.length > 0, "git.ref must be a non-empty string");
  return ref.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : ref;
}

function validatedDeploymentUrl(raw) {
  invariant(typeof raw === "string", "deployment url must be a string");
  const url = new URL(raw);
  invariant(url.protocol === "https:", "deployment url must use https");
  invariant(url.username === "" && url.password === "", "deployment url must not contain credentials");
  invariant(url.port === "", "deployment url must not contain a port");
  invariant(url.pathname === "/" && url.search === "" && url.hash === "", "deployment url must be an origin only");
  invariant(url.hostname.endsWith(".vercel.app"), "deployment url must use a vercel.app host");
  return url.origin;
}

function validateRoutePath(path, label) {
  invariant(typeof path === "string" && path.startsWith("/"), `${label} must be root-relative`);
  invariant(!path.startsWith("//") && !path.includes("\\") && !path.includes("\0"), `${label} is unsafe`);
  const url = new URL(path, "https://www.helpmath.ai");
  invariant(url.origin === "https://www.helpmath.ai", `${label} escaped the canonical origin`);
  return `${url.pathname}${url.search}`;
}

export function validatePolicy(policy) {
  exactKeys(policy, [
    "activationVariable",
    "activationVariableScope",
    "defaultBranch",
    "github",
    "releaseBoundary",
    "repository",
    "routes",
    "schemaVersion",
    "status",
    "trustedSource",
    "vercel",
  ], "policy");
  invariant(policy.schemaVersion === 2, "policy schemaVersion must be 2");
  invariant(
    policy.status === "prepared-not-activated" || policy.status === "active",
    "policy status must be prepared-not-activated or active",
  );
  invariant(policy.repository === "HUDongpin/help-math-2-0-workbench", "repository drifted");
  invariant(policy.defaultBranch === "main", "default branch must be main");
  invariant(policy.activationVariable === "HELP_MATH_CICD_IDENTITY_ACTIVATED", "activation variable drifted");
  invariant(
    policy.activationVariableScope === "repository-actions-variable",
    "activation variable must be a repository Actions variable",
  );

  exactKeys(policy.vercel, ["environment", "projectId", "projectName"], "policy.vercel");
  invariant(policy.vercel.projectId === "prj_q3v5Ue0zCL1T9rzTFD21KpNc5tzu", "Vercel project id drifted");
  invariant(policy.vercel.projectName === "helpmath-web", "Vercel project name drifted");
  invariant(policy.vercel.environment === "production", "Vercel environment must be production");

  exactKeys(policy.github, [
    "candidateStatusContext",
    "candidateWorkflowRef",
    "environment",
    "oidcAudience",
    "postflightStatusContext",
    "postflightWorkflowRef",
    "vercelApp",
  ], "policy.github");
  invariant(policy.github.environment === "helpmath-production", "GitHub environment drifted");
  invariant(policy.github.oidcAudience === "https://vercel.com/helpmath-production", "OIDC audience drifted");
  invariant(STATUS_CONTEXT.test(policy.github.candidateStatusContext), "candidate status context is invalid");
  invariant(STATUS_CONTEXT.test(policy.github.postflightStatusContext), "postflight status context is invalid");
  invariant(policy.github.candidateStatusContext !== policy.github.postflightStatusContext, "status contexts must be distinct");
  invariant(
    policy.github.candidateWorkflowRef
      === "HUDongpin/help-math-2-0-workbench/.github/workflows/vercel-production-smoke.yml@refs/heads/main",
    "candidate workflow ref drifted",
  );
  invariant(
    policy.github.postflightWorkflowRef
      === "HUDongpin/help-math-2-0-workbench/.github/workflows/vercel-production-postflight.yml@refs/heads/main",
    "postflight workflow ref drifted",
  );
  invariant(policy.github.candidateWorkflowRef !== policy.github.postflightWorkflowRef, "workflow refs must be distinct");
  exactKeys(policy.github.vercelApp, ["installationId", "senderLogin", "senderType"], "policy.github.vercelApp");
  invariant(policy.github.vercelApp.senderLogin === "vercel[bot]", "Vercel App sender login drifted");
  invariant(policy.github.vercelApp.senderType === "Bot", "Vercel App sender type drifted");
  const providerId = (value) => typeof value === "string" && /^[1-9][0-9]{0,19}$/u.test(value);
  if (policy.status === "prepared-not-activated") {
    invariant(policy.github.vercelApp.installationId === null, "prepared policy must not invent an installation id");
  } else {
    invariant(
      providerId(policy.github.vercelApp.installationId),
      "active policy requires the exact Vercel GitHub App installation id",
    );
  }

  exactKeys(policy.trustedSource, ["claims", "header", "issuer"], "policy.trustedSource");
  invariant(policy.trustedSource.issuer === "https://token.actions.githubusercontent.com", "OIDC issuer drifted");
  invariant(policy.trustedSource.header === "x-vercel-trusted-oidc-idp-token", "trusted OIDC header drifted");
  exactKeys(policy.trustedSource.claims, [
    "aud",
    "environment",
    "event_name",
    "ref",
    "repository",
    "repository_id",
    "repository_owner",
    "repository_owner_id",
    "workflow_ref",
  ], "policy.trustedSource.claims");
  const claims = policy.trustedSource.claims;
  invariant(claims.aud === policy.github.oidcAudience, "trusted OIDC audience drifted");
  invariant(claims.repository === policy.repository, "trusted repository claim drifted");
  invariant(claims.repository_owner === "HUDongpin", "trusted repository owner claim drifted");
  invariant(claims.ref === "refs/heads/main", "trusted ref claim must be refs/heads/main");
  invariant(claims.environment === policy.github.environment, "trusted environment claim drifted");
  invariant(claims.event_name === "repository_dispatch", "trusted event claim must be repository_dispatch");
  invariant(
    claims.workflow_ref === policy.github.candidateWorkflowRef,
    "trusted workflow_ref claim drifted",
  );
  if (policy.status === "prepared-not-activated") {
    invariant(claims.repository_id === null, "prepared policy must not invent a GitHub repository id");
    invariant(claims.repository_owner_id === null, "prepared policy must not invent a GitHub repository owner id");
  } else {
    invariant(providerId(claims.repository_id), "active policy requires the exact immutable GitHub repository_id claim");
    invariant(providerId(claims.repository_owner_id), "active policy requires the exact immutable GitHub repository_owner_id claim");
  }

  exactKeys(policy.routes, ["apexProbe", "courses", "forbidden", "roots"], "policy.routes");
  invariant(Array.isArray(policy.routes.roots) && policy.routes.roots.length === 2, "root route set must contain 2 rows");
  invariant(Array.isArray(policy.routes.courses) && policy.routes.courses.length === 8, "course route set must contain 8 rows");
  invariant(Array.isArray(policy.routes.forbidden) && policy.routes.forbidden.length === 7, "forbidden route set must contain 7 rows");

  const routeKeys = new Set();
  for (const [index, row] of policy.routes.roots.entries()) {
    exactKeys(row, ["marker", "path", "status"], `policy.routes.roots[${index}]`);
    const path = validateRoutePath(row.path, `root route ${index}`);
    invariant(!routeKeys.has(path), `duplicate route ${path}`);
    routeKeys.add(path);
    invariant(row.status === 200, `root route ${path} must expect 200`);
    invariant(typeof row.marker === "string" && row.marker.length > 0, `root route ${path} needs a marker`);
  }
  let pageTotal = 0;
  for (const [index, row] of policy.routes.courses.entries()) {
    exactKeys(row, ["pageCount", "path"], `policy.routes.courses[${index}]`);
    const path = validateRoutePath(row.path, `course route ${index}`);
    invariant(!routeKeys.has(path), `duplicate route ${path}`);
    routeKeys.add(path);
    invariant(Number.isSafeInteger(row.pageCount) && row.pageCount > 0, `course route ${path} has an invalid page count`);
    pageTotal += row.pageCount;
  }
  for (const [index, item] of policy.routes.forbidden.entries()) {
    const path = validateRoutePath(item, `forbidden route ${index}`);
    invariant(!routeKeys.has(path), `duplicate route ${path}`);
    routeKeys.add(path);
  }
  validateRoutePath(policy.routes.apexProbe, "apex probe");

  exactKeys(policy.releaseBoundary, [
    "contactEnabled",
    "currentJsLessons",
    "currentJsPagePlacements",
    "formalPublishedReleaseClaim",
    "lrsEnabled",
    "novaEnabled",
    "strictCompletionClaim",
  ], "policy.releaseBoundary");
  invariant(policy.releaseBoundary.currentJsLessons === 8, "Current-JS lesson count drifted");
  invariant(policy.releaseBoundary.currentJsPagePlacements === 426, "Current-JS page count drifted");
  invariant(pageTotal === policy.releaseBoundary.currentJsPagePlacements, "course page counts do not total 426");
  for (const key of [
    "strictCompletionClaim",
    "formalPublishedReleaseClaim",
    "novaEnabled",
    "lrsEnabled",
    "contactEnabled",
  ]) {
    exactBoolean(policy.releaseBoundary[key], `policy.releaseBoundary.${key}`);
    invariant(policy.releaseBoundary[key] === false, `policy.releaseBoundary.${key} must remain false`);
  }
  return policy;
}

export async function readPolicy(path) {
  const text = await readFile(path, "utf8");
  invariant(text.endsWith("\n"), "policy must end with a newline");
  return validatePolicy(JSON.parse(text));
}

export function validateWorkflowContext(context, policy, mode) {
  validatePolicy(policy);
  invariant(policy.status === "active", "service identity policy is not active");
  invariant(mode === "candidate" || mode === "postflight", "workflow context mode is invalid");
  exactKeys(context, [
    "eventName",
    "ref",
    "repository",
    "repositoryId",
    "repositoryOwner",
    "repositoryOwnerId",
    "workflowRef",
  ], "GitHub workflow context");
  const claims = policy.trustedSource.claims;
  invariant(context.repository === claims.repository, "GitHub workflow repository drifted");
  invariant(context.repositoryId === claims.repository_id, "GitHub workflow repository id drifted");
  invariant(context.repositoryOwner === claims.repository_owner, "GitHub workflow repository owner drifted");
  invariant(context.repositoryOwnerId === claims.repository_owner_id, "GitHub workflow repository owner id drifted");
  invariant(context.ref === claims.ref, "GitHub workflow ref drifted");
  invariant(context.eventName === claims.event_name, "GitHub workflow event name drifted");
  const expectedWorkflowRef = mode === "candidate"
    ? policy.github.candidateWorkflowRef
    : policy.github.postflightWorkflowRef;
  invariant(context.workflowRef === expectedWorkflowRef, `GitHub ${mode} workflow_ref drifted`);
  return context;
}

export function validateDispatch({action, payload, checkoutSha, eventOrigin, workflowContext, mode, policy}) {
  validatePolicy(policy);
  invariant(policy.status === "active", "service identity policy is not active");
  invariant(mode === "candidate" || mode === "postflight", "dispatch mode is invalid");
  const expectedAction = mode === "candidate"
    ? "vercel.deployment.ready"
    : "vercel.deployment.promoted";
  invariant(action === expectedAction, `unexpected repository_dispatch action: ${action}`);
  validateWorkflowContext(workflowContext, policy, mode);
  invariant(SHA256.test(checkoutSha), "checkout SHA must be a full lowercase Git SHA");
  exactKeys(eventOrigin, ["installationId", "senderLogin", "senderType"], "dispatch origin");
  invariant(eventOrigin.installationId === policy.github.vercelApp.installationId, "dispatch installation id drifted");
  invariant(eventOrigin.senderLogin === policy.github.vercelApp.senderLogin, "dispatch sender login drifted");
  invariant(eventOrigin.senderType === policy.github.vercelApp.senderType, "dispatch sender type drifted");

  exactKeys(payload, ["environment", "git", "id", "project", "state", "url"], "dispatch payload");
  exactKeys(payload.project, ["id", "name"], "dispatch project");
  exactKeys(payload.git, ["ref", "sha", "shortSha"], "dispatch git");
  exactKeys(payload.state, ["type"], "dispatch state");
  invariant(payload.project.id === policy.vercel.projectId, "dispatch project id drifted");
  invariant(payload.project.name === policy.vercel.projectName, "dispatch project name drifted");
  invariant(payload.environment === policy.vercel.environment, "dispatch environment is not production");
  invariant(normalizedBranch(payload.git.ref) === policy.defaultBranch, "dispatch git ref is not main");
  invariant(SHA256.test(payload.git.sha), "dispatch git SHA is invalid");
  invariant(payload.git.sha === checkoutSha, "dispatch SHA does not match checked-out main");
  invariant(
    typeof payload.git.shortSha === "string"
      && payload.git.shortSha.length >= 7
      && payload.git.shortSha.length <= 12
      && payload.git.sha.startsWith(payload.git.shortSha),
    "dispatch short SHA is invalid",
  );
  invariant(DEPLOYMENT_ID.test(payload.id), "dispatch deployment id is invalid");
  invariant(payload.state.type === (mode === "candidate" ? "pending" : "promoted"), "dispatch state is invalid");
  const deploymentUrl = validatedDeploymentUrl(payload.url);
  return Object.freeze({
    deploymentId: payload.id,
    deploymentUrl,
    githubAppInstallationId: eventOrigin.installationId,
    githubAppSenderLogin: eventOrigin.senderLogin,
    gitRef: policy.trustedSource.claims.ref,
    gitSha: payload.git.sha,
    projectId: payload.project.id,
    projectName: payload.project.name,
  });
}

function expectedChecks(policy) {
  const checks = [];
  for (const row of policy.routes.roots) checks.push({...row});
  for (const row of policy.routes.courses) {
    for (const prefix of ["", "/es"]) {
      checks.push({
        path: `${prefix}${row.path}`,
        status: 200,
        marker: `data-current-js-pages=\"${row.pageCount}\"`,
      });
    }
  }
  for (const path of policy.routes.forbidden) checks.push({path, status: 404, marker: ""});
  return checks;
}

async function boundedBody(response) {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    invariant(Number.isSafeInteger(length) && length >= 0 && length <= MAX_RESPONSE_BYTES, "response content-length is invalid or too large");
  }
  if (response.body === null) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      invariant(value instanceof Uint8Array, "response body yielded an invalid chunk");
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel("response body exceeded the bounded size");
        throw new Error("response body exceeded the bounded size");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", {fatal: true}).decode(bytes);
}

function requestHeaders({mode, oidcToken, policy}) {
  const headers = {
    "cache-control": "no-cache",
    pragma: "no-cache",
    "user-agent": "helpmath-ci-service-identity/1",
  };
  if (mode === "candidate") {
    invariant(typeof oidcToken === "string" && oidcToken.length >= 100, "candidate smoke requires a short-lived OIDC token");
    headers[policy.trustedSource.header] = oidcToken;
  } else {
    invariant(oidcToken === undefined || oidcToken === "", "postflight must not receive an OIDC token");
  }
  return headers;
}

export async function runSmoke({policy, mode, deployment, oidcToken, fetchImpl = fetch, now = () => new Date()}) {
  validatePolicy(policy);
  invariant(policy.status === "active", "service identity policy is not active");
  invariant(mode === "candidate" || mode === "postflight", "smoke mode is invalid");
  invariant(plainObject(deployment), "deployment identity must be a plain object");
  invariant(DEPLOYMENT_ID.test(deployment.deploymentId), "deployment identity is invalid");
  invariant(SHA256.test(deployment.gitSha), "deployment Git SHA is invalid");
  invariant(
    deployment.githubAppInstallationId === policy.github.vercelApp.installationId,
    "deployment installation id drifted",
  );
  const baseOrigin = mode === "candidate"
    ? validatedDeploymentUrl(deployment.deploymentUrl)
    : "https://www.helpmath.ai";
  const headers = requestHeaders({mode, oidcToken, policy});
  const results = [];

  for (const check of expectedChecks(policy)) {
    const path = validateRoutePath(check.path, "smoke route");
    const requestUrl = new URL(path, `${baseOrigin}/`);
    const response = await fetchImpl(requestUrl, {
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    invariant(new URL(response.url).origin === baseOrigin, `route ${path} escaped the expected origin`);
    invariant(response.status === check.status, `route ${path} returned ${response.status}; expected ${check.status}`);
    const body = await boundedBody(response);
    if (check.marker) invariant(body.includes(check.marker), `route ${path} omitted its required marker`);
    if (mode === "candidate") {
      const robots = response.headers.get("x-robots-tag") ?? "";
      invariant(robots.toLowerCase().includes("noindex"), `protected candidate route ${path} omitted x-robots-tag: noindex`);
    }
    results.push({path, status: response.status, requiredMarker: check.marker, pass: true});
  }

  let apexRedirect = null;
  if (mode === "postflight") {
    const probe = validateRoutePath(policy.routes.apexProbe, "apex probe");
    const response = await fetchImpl(new URL(probe, "https://helpmath.ai"), {
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
        "user-agent": "helpmath-ci-service-identity/1",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const expectedLocation = new URL(probe, "https://www.helpmath.ai").href;
    const location = response.headers.get("location");
    invariant(response.status === 308, `apex returned ${response.status}; expected 308`);
    invariant(location === expectedLocation, "apex redirect did not preserve the exact path and query");
    apexRedirect = {status: response.status, location, pass: true};
  }

  const generatedAt = now();
  invariant(generatedAt instanceof Date && Number.isFinite(generatedAt.getTime()), "receipt time is invalid");
  return {
    schemaVersion: 1,
    evidenceKind: mode === "candidate"
      ? "HELP_MATH_VERCEL_GIT_PRODUCTION_CANDIDATE_SMOKE"
      : "HELP_MATH_VERCEL_GIT_PRODUCTION_POSTFLIGHT",
    status: "PASS",
    generatedAtUtc: generatedAt.toISOString(),
    source: {
      repository: policy.repository,
      branch: policy.defaultBranch,
      commit: deployment.gitSha,
    },
    githubServiceIdentity: {
      appSender: policy.github.vercelApp.senderLogin,
      installationId: deployment.githubAppInstallationId,
      storedCredential: false,
    },
    vercel: {
      projectId: policy.vercel.projectId,
      projectName: policy.vercel.projectName,
      deploymentId: deployment.deploymentId,
      deploymentUrl: deployment.deploymentUrl,
      environment: policy.vercel.environment,
      accessIdentity: mode === "candidate" ? "github-actions-oidc-trusted-source" : "public-domain",
    },
    checks: {
      routeCount: results.length,
      passed: results.length,
      results,
      apexRedirect,
    },
    releaseBoundary: {...policy.releaseBoundary},
    privacy: {
      containsCredential: false,
      containsOidcToken: false,
      containsResponseBody: false,
      containsPrivatePath: false,
    },
  };
}

function decodeJwtPayload(token) {
  invariant(typeof token === "string", "GitHub OIDC response did not contain a JWT");
  const parts = token.split(".");
  invariant(parts.length === 3 && parts.every((part) => part.length > 0), "GitHub OIDC response did not contain a JWT");
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("GitHub OIDC JWT payload is invalid");
  }
  invariant(plainObject(payload), "GitHub OIDC JWT payload must be a plain object");
  return payload;
}

export function validateGithubOidcClaims(token, {issuer, claims}) {
  invariant(issuer === "https://token.actions.githubusercontent.com", "OIDC issuer drifted");
  exactKeys(claims, [
    "aud",
    "environment",
    "event_name",
    "ref",
    "repository",
    "repository_id",
    "repository_owner",
    "repository_owner_id",
    "workflow_ref",
  ], "expected GitHub OIDC claims");
  const payload = decodeJwtPayload(token);
  invariant(payload.iss === issuer, "GitHub OIDC iss claim drifted");
  for (const [name, expected] of Object.entries(claims)) {
    invariant(typeof expected === "string" && expected.length > 0, `expected GitHub OIDC ${name} claim is unavailable`);
    const actual = payload[name];
    const matches = Array.isArray(actual) ? actual.includes(expected) : actual === expected;
    invariant(matches, `GitHub OIDC ${name} claim drifted`);
  }
  return payload;
}

export async function requestGithubOidcToken({requestUrl, requestToken, issuer, claims, fetchImpl = fetch}) {
  invariant(typeof requestUrl === "string", "GitHub OIDC request URL is unavailable");
  invariant(typeof requestToken === "string" && requestToken.length >= 20, "GitHub OIDC request token is unavailable");
  invariant(claims?.aud === "https://vercel.com/helpmath-production", "OIDC audience drifted");
  const url = new URL(requestUrl);
  invariant(
    url.origin === "https://token.actions.githubusercontent.com"
      && url.username === ""
      && url.password === "",
    "GitHub OIDC request origin drifted",
  );
  url.searchParams.set("audience", claims.aud);
  const response = await fetchImpl(url, {
    headers: {authorization: `bearer ${requestToken}`},
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  invariant(response.status === 200, `GitHub OIDC endpoint returned ${response.status}`);
  const body = await response.json();
  exactKeys(body, ["value"], "GitHub OIDC response");
  validateGithubOidcClaims(body.value, {issuer, claims});
  return body.value;
}
