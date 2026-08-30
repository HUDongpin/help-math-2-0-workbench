import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {
  DEPLOYMENT_PROVENANCE_HEADERS,
  requestGithubOidcToken,
  runSmoke,
  validateDispatch,
  validateGithubOidcClaims,
  validatePolicy,
} from "./lib/helpmath-vercel-ci.mjs";

const policy = validatePolicy(JSON.parse(await readFile(
  new URL("../.github/helpmath-vercel-production-policy.json", import.meta.url),
  "utf8",
)));
const nextConfigSource = await readFile(
  new URL("../apps/web/next.config.ts", import.meta.url),
  "utf8",
);
const activePolicy = validatePolicy({
  ...structuredClone(policy),
  status: "active",
  github: {
    ...structuredClone(policy.github),
    vercelApp: {
      ...structuredClone(policy.github.vercelApp),
      installationId: "12345678",
    },
  },
  trustedSource: {
    ...structuredClone(policy.trustedSource),
    claims: {
      ...structuredClone(policy.trustedSource.claims),
      repository_id: "987654321",
      repository_owner_id: "1234567",
    },
  },
});

const gitSha = "b2263fad156054239a74acdbf4b94048c9a45f69";
const deploymentId = "dpl_2YL2yrWS3618VGQB36nusPt7yLhB";
const deploymentUrl = "https://helpmath-example-team.vercel.app";

function provenanceHeaders(overrides = {}) {
  const provenance = {
    projectId: activePolicy.vercel.projectId,
    deploymentUrl,
    gitSha,
    ...overrides,
  };
  return {
    [DEPLOYMENT_PROVENANCE_HEADERS.projectId]: provenance.projectId,
    [DEPLOYMENT_PROVENANCE_HEADERS.deploymentUrl]: provenance.deploymentUrl,
    [DEPLOYMENT_PROVENANCE_HEADERS.gitSha]: provenance.gitSha,
  };
}

function workflowContext(overrides = {}, mode = "candidate") {
  return {
    eventName: "repository_dispatch",
    ref: "refs/heads/main",
    repository: activePolicy.repository,
    repositoryId: activePolicy.trustedSource.claims.repository_id,
    repositoryOwner: activePolicy.trustedSource.claims.repository_owner,
    repositoryOwnerId: activePolicy.trustedSource.claims.repository_owner_id,
    workflowRef: mode === "candidate"
      ? activePolicy.github.candidateWorkflowRef
      : activePolicy.github.postflightWorkflowRef,
    ...overrides,
  };
}

function jwt(payload) {
  const header = Buffer.from(JSON.stringify({alg: "RS256", typ: "JWT"})).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.test-signature`;
}

function payload({mode = "candidate", overrides = {}} = {}) {
  const value = {
    environment: "production",
    git: {ref: "main", sha: gitSha, shortSha: gitSha.slice(0, 9)},
    id: deploymentId,
    project: {id: activePolicy.vercel.projectId, name: activePolicy.vercel.projectName},
    state: {type: mode === "candidate" ? "pending" : "promoted"},
    url: deploymentUrl,
  };
  return Object.assign(value, overrides);
}

test("policy fixes one secretless Vercel Git and GitHub OIDC boundary", () => {
  assert.equal(policy.status, "prepared-not-activated");
  assert.equal(policy.github.vercelApp.installationId, null);
  assert.equal(policy.trustedSource.claims.repository_id, null);
  assert.equal(policy.trustedSource.claims.repository_owner_id, null);
  assert.equal(policy.activationVariableScope, "repository-actions-variable");
  assert.equal(policy.github.environment, "helpmath-production");
  assert.equal(policy.trustedSource.claims.workflow_ref, "HUDongpin/help-math-2-0-workbench/.github/workflows/vercel-production-smoke.yml@refs/heads/main");
  assert.equal(policy.trustedSource.header, "x-vercel-trusted-oidc-idp-token");
  assert.equal(policy.routes.courses.reduce((sum, row) => sum + row.pageCount, 0), 426);
  assert.deepEqual(
    Object.values(policy.releaseBoundary).filter((value) => typeof value === "boolean"),
    [false, false, false, false, false],
  );
});

test("application responses expose only fail-closed build provenance fields", () => {
  assert.match(nextConfigSource, /source: '\/:path\*'/u);
  for (const headerName of Object.values(DEPLOYMENT_PROVENANCE_HEADERS)) {
    assert.match(nextConfigSource, new RegExp(headerName, "iu"));
  }
  assert.match(nextConfigSource, /process\.env\.VERCEL_PROJECT_ID/u);
  assert.match(nextConfigSource, /process\.env\.VERCEL_URL/u);
  assert.match(nextConfigSource, /process\.env\.VERCEL_GIT_COMMIT_SHA/u);
  assert.match(nextConfigSource, /'unavailable'/u);
});

test("policy cannot activate without all three observed provider identity IDs", () => {
  const activationBase = {
    ...structuredClone(policy),
    status: "active",
    github: {
      ...structuredClone(policy.github),
      vercelApp: {
        ...structuredClone(policy.github.vercelApp),
        installationId: "12345678",
      },
    },
  };
  assert.throws(() => validatePolicy(activationBase), /repository_id claim/iu);
  activationBase.trustedSource.claims.repository_id = "987654321";
  assert.throws(() => validatePolicy(activationBase), /repository_owner_id claim/iu);
});

test("candidate dispatch binds the exact project, production main SHA, and deployment", () => {
  const result = validateDispatch({
    action: "vercel.deployment.ready",
    payload: payload(),
    checkoutSha: gitSha,
    eventOrigin: {installationId: "12345678", senderLogin: "vercel[bot]", senderType: "Bot"},
    workflowContext: workflowContext(),
    mode: "candidate",
    policy: activePolicy,
  });
  assert.deepEqual(result, {
    deploymentId,
    deploymentUrl,
    githubAppInstallationId: "12345678",
    githubAppSenderLogin: "vercel[bot]",
    gitRef: "refs/heads/main",
    gitSha,
    projectId: activePolicy.vercel.projectId,
    projectName: activePolicy.vercel.projectName,
  });
});

test("postflight dispatch requires the promoted event and state", () => {
  const result = validateDispatch({
    action: "vercel.deployment.promoted",
    payload: payload({mode: "postflight"}),
    checkoutSha: gitSha,
    eventOrigin: {installationId: "12345678", senderLogin: "vercel[bot]", senderType: "Bot"},
    workflowContext: workflowContext({}, "postflight"),
    mode: "postflight",
    policy: activePolicy,
  });
  assert.equal(result.deploymentId, deploymentId);
});

test("dispatch validation rejects project, branch, SHA, environment, URL, and state drift", () => {
  const cases = [
    {pattern: /project/iu, mutate: (value) => { value.project.id = "prj_other"; }},
    {pattern: /ref|main/iu, mutate: (value) => { value.git.ref = "feature"; }},
    {pattern: /SHA/iu, mutate: (value) => { value.git.sha = "a".repeat(40); value.git.shortSha = "a".repeat(9); }},
    {pattern: /environment/iu, mutate: (value) => { value.environment = "preview"; }},
    {pattern: /URL/iu, mutate: (value) => { value.url = "https://example.com"; }},
    {pattern: /state/iu, mutate: (value) => { value.state.type = "success"; }},
  ];
  for (const item of cases) {
    const value = payload();
    item.mutate(value);
    assert.throws(() => validateDispatch({
      action: "vercel.deployment.ready",
      payload: value,
      checkoutSha: gitSha,
      eventOrigin: {installationId: "12345678", senderLogin: "vercel[bot]", senderType: "Bot"},
      workflowContext: workflowContext(),
      mode: "candidate",
      policy: activePolicy,
    }), item.pattern);
  }
});

test("dispatch validation rejects inactive policy and event-origin drift before OIDC", () => {
  const common = {
    action: "vercel.deployment.ready",
    payload: payload(),
    checkoutSha: gitSha,
    workflowContext: workflowContext(),
    mode: "candidate",
  };
  assert.throws(() => validateDispatch({
    ...common,
    eventOrigin: {installationId: "12345678", senderLogin: "vercel[bot]", senderType: "Bot"},
    policy,
  }), /not active/iu);
  for (const eventOrigin of [
    {installationId: "87654321", senderLogin: "vercel[bot]", senderType: "Bot"},
    {installationId: "12345678", senderLogin: "attacker[bot]", senderType: "Bot"},
    {installationId: "12345678", senderLogin: "vercel[bot]", senderType: "User"},
  ]) {
    assert.throws(() => validateDispatch({...common, eventOrigin, policy: activePolicy}), /dispatch (installation id|sender)/iu);
  }
});

test("dispatch validation rejects immutable repository identity and workflow_ref drift", () => {
  const common = {
    action: "vercel.deployment.ready",
    payload: payload(),
    checkoutSha: gitSha,
    eventOrigin: {installationId: "12345678", senderLogin: "vercel[bot]", senderType: "Bot"},
    mode: "candidate",
    policy: activePolicy,
  };
  assert.throws(
    () => validateDispatch({...common, workflowContext: workflowContext({repositoryId: "111111111"})}),
    /repository id drifted/iu,
  );
  assert.throws(
    () => validateDispatch({...common, workflowContext: workflowContext({repositoryOwnerId: "2222222"})}),
    /repository owner id drifted/iu,
  );
  assert.throws(
    () => validateDispatch({...common, workflowContext: workflowContext({workflowRef: "attacker/repo/.github/workflows/pwn.yml@refs/heads/main"})}),
    /workflow_ref drifted/iu,
  );
});

function responseFor(rawUrl, {candidate, provenance = {}}) {
  const url = new URL(rawUrl);
  if (url.origin === "https://helpmath.ai") {
    const location = `https://www.helpmath.ai${url.pathname}${url.search}`;
    const response = new Response(null, {status: 308, headers: {location}});
    Object.defineProperty(response, "url", {value: url.href});
    return response;
  }
  const forbidden = activePolicy.routes.forbidden.includes(url.pathname);
  let body = "";
  if (!forbidden) {
    const course = activePolicy.routes.courses.find((row) => url.pathname.endsWith(row.path));
    body = course ? `<main data-current-js-pages=\"${course.pageCount}\">HELP Math</main>` : "<main>HELP Math</main>";
  }
  const headers = {
    "content-length": String(Buffer.byteLength(body)),
    ...(provenance === null ? {} : provenanceHeaders(provenance)),
  };
  if (candidate) headers["x-robots-tag"] = "noindex, nofollow";
  const response = new Response(body, {status: forbidden ? 404 : 200, headers});
  Object.defineProperty(response, "url", {value: url.href});
  return response;
}

test("candidate smoke checks all 25 protected routes and emits no token or response body", async () => {
  const secret = `header.${"x".repeat(180)}.signature`;
  const receipt = await runSmoke({
    policy: activePolicy,
    mode: "candidate",
    deployment: {deploymentId, deploymentUrl, gitSha, githubAppInstallationId: "12345678"},
    oidcToken: secret,
    fetchImpl: async (url, options) => {
      assert.equal(options.headers[activePolicy.trustedSource.header], secret);
      assert.equal(options.redirect, "manual");
      return responseFor(url, {candidate: true});
    },
    now: () => new Date("2026-08-29T08:00:00.000Z"),
  });
  assert.equal(receipt.checks.routeCount, 25);
  assert.equal(receipt.checks.passed, 25);
  assert.equal(receipt.checks.apexRedirect, null);
  assert.equal(receipt.schemaVersion, 2);
  assert.deepEqual(receipt.eventDeploymentIdentity, {
    projectId: activePolicy.vercel.projectId,
    deploymentId,
    deploymentUrl,
    gitSha,
  });
  assert.deepEqual(receipt.observedDomainDeploymentIdentity, {
    origin: deploymentUrl,
    projectId: activePolicy.vercel.projectId,
    deploymentUrl,
    gitSha,
    routeResponseCount: 25,
    consistentAcrossRouteSweep: true,
  });
  assert.equal(
    receipt.checks.results.every((result) => result.deploymentProvenanceMatch === true),
    true,
  );
  assert.equal(receipt.vercel.accessIdentity, "github-actions-oidc-trusted-source");
  assert.deepEqual(receipt.githubServiceIdentity, {
    appSender: "vercel[bot]",
    installationId: "12345678",
    storedCredential: false,
  });
  assert.equal(JSON.stringify(receipt).includes(secret), false);
  assert.equal(receipt.privacy.containsResponseBody, false);
});

test("candidate smoke fails closed without protected noindex evidence", async () => {
  await assert.rejects(
    runSmoke({
      policy: activePolicy,
      mode: "candidate",
      deployment: {deploymentId, deploymentUrl, gitSha, githubAppInstallationId: "12345678"},
      oidcToken: `header.${"x".repeat(180)}.signature`,
      fetchImpl: async (url) => responseFor(url, {candidate: false}),
    }),
    /noindex/u,
  );
});

test("candidate smoke does not follow a redirect carrying its OIDC token", async () => {
  await assert.rejects(
    runSmoke({
      policy: activePolicy,
      mode: "candidate",
      deployment: {deploymentId, deploymentUrl, gitSha, githubAppInstallationId: "12345678"},
      oidcToken: `header.${"x".repeat(180)}.signature`,
      fetchImpl: async (url, options) => {
        assert.equal(options.redirect, "manual");
        const response = new Response(null, {
          status: 302,
          headers: {location: "https://attacker.invalid/collect"},
        });
        Object.defineProperty(response, "url", {value: url.href});
        return response;
      },
    }),
    /returned 302/iu,
  );
});

test("candidate smoke rejects an oversized response before retaining its body", async () => {
  await assert.rejects(
    runSmoke({
      policy: activePolicy,
      mode: "candidate",
      deployment: {deploymentId, deploymentUrl, gitSha, githubAppInstallationId: "12345678"},
      oidcToken: `header.${"x".repeat(180)}.signature`,
      fetchImpl: async (url) => {
        const response = new Response("x", {
          status: 200,
          headers: {
            "content-length": String((5 * 1024 * 1024) + 1),
            "x-robots-tag": "noindex",
            ...provenanceHeaders(),
          },
        });
        Object.defineProperty(response, "url", {value: url.href});
        return response;
      },
    }),
    /content-length/iu,
  );
});

test("public postflight checks routes plus exact apex path and query preservation", async () => {
  const receipt = await runSmoke({
    policy: activePolicy,
    mode: "postflight",
    deployment: {deploymentId, deploymentUrl, gitSha, githubAppInstallationId: "12345678"},
    fetchImpl: async (url, options) => {
      assert.equal(options.headers[activePolicy.trustedSource.header], undefined);
      return responseFor(url, {candidate: false});
    },
    now: () => new Date("2026-08-29T08:01:00.000Z"),
  });
  assert.equal(receipt.checks.routeCount, 25);
  assert.deepEqual(receipt.checks.apexRedirect, {
    status: 308,
    location: "https://www.helpmath.ai/courses/4/5?probe=ci-service-identity",
    pass: true,
  });
  assert.equal(receipt.vercel.accessIdentity, "public-domain");
  assert.deepEqual(receipt.observedDomainDeploymentIdentity, {
    origin: "https://www.helpmath.ai",
    projectId: activePolicy.vercel.projectId,
    deploymentUrl,
    gitSha,
    routeResponseCount: 25,
    consistentAcrossRouteSweep: true,
  });
  assert.deepEqual(receipt.deploymentBinding, {
    comparedFields: ["projectId", "deploymentUrl", "gitSha"],
    eventToObservedDomainExactMatch: true,
    responseCount: 25,
  });
});

test("public postflight rejects missing or mismatched deployment provenance", async () => {
  const cases = [
    {
      label: "missing",
      provenance: null,
      pattern: /provenance project id drifted/iu,
    },
    {
      label: "wrong project",
      provenance: {projectId: "prj_wrong"},
      pattern: /provenance project id drifted/iu,
    },
    {
      label: "same SHA but wrong deployment",
      provenance: {deploymentUrl: "https://different-deployment.vercel.app"},
      pattern: /provenance URL drifted/iu,
    },
    {
      label: "right deployment but wrong SHA",
      provenance: {gitSha: "a".repeat(40)},
      pattern: /provenance Git SHA drifted/iu,
    },
  ];
  for (const item of cases) {
    await assert.rejects(
      runSmoke({
        policy: activePolicy,
        mode: "postflight",
        deployment: {deploymentId, deploymentUrl, gitSha, githubAppInstallationId: "12345678"},
        fetchImpl: async (url) => responseFor(url, {
          candidate: false,
          provenance: item.provenance,
        }),
      }),
      item.pattern,
      item.label,
    );
  }
});

test("public postflight rejects an alias change during the route sweep", async () => {
  let publicRouteResponses = 0;
  await assert.rejects(
    runSmoke({
      policy: activePolicy,
      mode: "postflight",
      deployment: {deploymentId, deploymentUrl, gitSha, githubAppInstallationId: "12345678"},
      fetchImpl: async (url) => {
        const parsed = new URL(url);
        if (parsed.origin === "https://helpmath.ai") {
          return responseFor(url, {candidate: false});
        }
        publicRouteResponses += 1;
        return responseFor(url, {
          candidate: false,
          provenance: publicRouteResponses === 1
            ? {}
            : {deploymentUrl: "https://replacement-deployment.vercel.app"},
        });
      },
    }),
    /provenance URL drifted/iu,
  );
  assert.equal(publicRouteResponses, 2);
});

test("OIDC exchange requests the fixed audience and returns only a JWT", async () => {
  let observed;
  const tokenValue = jwt({
    iss: activePolicy.trustedSource.issuer,
    ...activePolicy.trustedSource.claims,
  });
  const token = await requestGithubOidcToken({
    requestUrl: "https://token.actions.githubusercontent.com/request?job=1",
    requestToken: "ephemeral-request-token-value",
    issuer: activePolicy.trustedSource.issuer,
    claims: activePolicy.trustedSource.claims,
    fetchImpl: async (url, options) => {
      observed = {url: url.href, authorization: options.headers.authorization};
      return new Response(JSON.stringify({value: tokenValue}), {
        status: 200,
        headers: {"content-type": "application/json"},
      });
    },
  });
  assert.equal(token, tokenValue);
  assert.equal(new URL(observed.url).searchParams.get("audience"), activePolicy.github.oidcAudience);
  assert.equal(observed.authorization, "bearer ephemeral-request-token-value");
  await assert.rejects(
    requestGithubOidcToken({
      requestUrl: "https://attacker.invalid/request",
      requestToken: "ephemeral-request-token-value",
      issuer: activePolicy.trustedSource.issuer,
      claims: activePolicy.trustedSource.claims,
      fetchImpl: async () => new Response(JSON.stringify({value: tokenValue}), {status: 200}),
    }),
    /origin drifted/iu,
  );
});

test("OIDC claim validation rejects immutable repository and workflow identity drift", () => {
  const expected = {issuer: activePolicy.trustedSource.issuer, claims: activePolicy.trustedSource.claims};
  assert.throws(
    () => validateGithubOidcClaims(jwt({
      iss: activePolicy.trustedSource.issuer,
      ...activePolicy.trustedSource.claims,
      repository_id: "111111111",
    }), expected),
    /repository_id claim drifted/iu,
  );
  assert.throws(
    () => validateGithubOidcClaims(jwt({
      iss: activePolicy.trustedSource.issuer,
      ...activePolicy.trustedSource.claims,
      workflow_ref: "attacker/repo/.github/workflows/pwn.yml@refs/heads/main",
    }), expected),
    /workflow_ref claim drifted/iu,
  );
});

test("OIDC claim validation rejects array supersets instead of weakening exact claims", () => {
  const expected = {issuer: activePolicy.trustedSource.issuer, claims: activePolicy.trustedSource.claims};
  for (const name of ["aud", "repository"]) {
    const payloadClaims = {
      iss: activePolicy.trustedSource.issuer,
      ...activePolicy.trustedSource.claims,
      [name]: [activePolicy.trustedSource.claims[name], "attacker-controlled-value"],
    };
    assert.throws(
      () => validateGithubOidcClaims(jwt(payloadClaims), expected),
      new RegExp(`GitHub OIDC ${name} claim drifted`, "u"),
    );
  }
});
