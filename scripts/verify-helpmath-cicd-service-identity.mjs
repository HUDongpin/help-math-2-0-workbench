#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {readPolicy} from "./lib/helpmath-vercel-ci.mjs";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function includesAll(text, fragments, label) {
  for (const fragment of fragments) invariant(text.includes(fragment), `${label} omitted ${fragment}`);
}

export function validateServiceIdentityDocuments(documents) {
  const {
    candidateWorkflow,
    ciWorkflow,
    core,
    deploymentDoc,
    identityDoc,
    ignore,
    postflightWorkflow,
    runner,
  } = documents;
  for (const [label, text] of Object.entries(documents)) {
    invariant(typeof text === "string" && text.length > 0, `${label} is empty`);
  }

  includesAll(candidateWorkflow, [
    "vercel.deployment.ready",
    "vars.HELP_MATH_CICD_IDENTITY_ACTIVATED == 'true'",
    "environment: helpmath-production",
    "HELP_MATH_VERCEL_INSTALLATION_ID: ${{ github.event.installation.id }}",
    "HELP_MATH_VERCEL_SENDER_LOGIN: ${{ github.event.sender.login }}",
    "HELP_MATH_VERCEL_SENDER_TYPE: ${{ github.event.sender.type }}",
    "HELP_MATH_GITHUB_REPOSITORY_ID: ${{ github.repository_id }}",
    "HELP_MATH_GITHUB_REPOSITORY_OWNER_ID: ${{ github.repository_owner_id }}",
    "HELP_MATH_GITHUB_WORKFLOW_REF: ${{ github.workflow_ref }}",
    "actions: read",
    "contents: read",
    "id-token: write",
    "statuses: write",
    "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803",
    "actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38",
    "actions/upload-artifact@330a01c490aca151604b8cf639adc76d48f6c5d4",
    "vercel/repository-dispatch/actions/status@61881006269f0b5ac2cb186b198c54be6afe90e1",
    "name: \"Vercel - helpmath-web: production-smoke\"",
    "github_token: ${{ github.token }}",
    "HELP_MATH_VERCEL_INSTALLATION_ID: ${{ steps.payload.outputs.installation_id }}",
    "HELP_MATH_VERCEL_SENDER_LOGIN: ${{ steps.payload.outputs.sender_login }}",
    "HELP_MATH_VERCEL_SENDER_TYPE: ${{ github.event.sender.type }}",
    "persist-credentials: false",
    "--mode candidate",
  ], "candidate workflow");
  includesAll(postflightWorkflow, [
    "vercel.deployment.promoted",
    "vars.HELP_MATH_CICD_IDENTITY_ACTIVATED == 'true'",
    "HELP_MATH_VERCEL_INSTALLATION_ID: ${{ github.event.installation.id }}",
    "HELP_MATH_VERCEL_SENDER_LOGIN: ${{ github.event.sender.login }}",
    "HELP_MATH_VERCEL_SENDER_TYPE: ${{ github.event.sender.type }}",
    "HELP_MATH_GITHUB_REPOSITORY_ID: ${{ github.repository_id }}",
    "HELP_MATH_GITHUB_REPOSITORY_OWNER_ID: ${{ github.repository_owner_id }}",
    "HELP_MATH_GITHUB_WORKFLOW_REF: ${{ github.workflow_ref }}",
    "actions: read",
    "contents: read",
    "statuses: write",
    "vercel/repository-dispatch/actions/status@61881006269f0b5ac2cb186b198c54be6afe90e1",
    "name: \"Vercel - helpmath-web: production-postflight\"",
    "github_token: ${{ github.token }}",
    "persist-credentials: false",
    "--mode postflight",
    "vercel-production-postflight.json",
  ], "postflight workflow");

  for (const [label, text] of [
    ["candidate workflow", candidateWorkflow],
    ["CI workflow", ciWorkflow],
    ["postflight workflow", postflightWorkflow],
    ["runner", runner],
  ]) {
    invariant(!text.includes("${{ secrets."), `${label} must not use stored GitHub secrets`);
    invariant(!/VERCEL_(?:TOKEN|ACCESS_TOKEN|AUTH_TOKEN)/u.test(text), `${label} must not use a Vercel token`);
    invariant(!/\bvercel\s+(?:deploy|promote|rollback)\b/u.test(text), `${label} must not invoke a Vercel mutation CLI`);
    invariant(!text.includes("api.vercel.com"), `${label} must not call the Vercel control-plane API`);
    invariant(!text.includes("pull_request_target"), `${label} must not use pull_request_target`);
  }
  invariant(!postflightWorkflow.includes("id-token: write"), "postflight must not request an OIDC token");
  invariant(!postflightWorkflow.includes("environment: helpmath-production"), "postflight must not request a second promotion approval");
  invariant((candidateWorkflow.match(/vercel\/repository-dispatch\/actions\/status@/gu) ?? []).length === 1, "candidate must register exactly one Vercel status action");
  invariant((postflightWorkflow.match(/vercel\/repository-dispatch\/actions\/status@/gu) ?? []).length === 1, "postflight must register exactly one Vercel status action");

  includesAll(core, [
    "x-vercel-trusted-oidc-idp-token",
    "active policy requires the exact immutable GitHub repository_id claim",
    "validateGithubOidcClaims",
    "repository_id",
    "workflow_ref",
    "GitHub OIDC ${name} claim drifted",
    "dispatch installation id drifted",
    "service identity policy is not active",
    "redirect: \"manual\"",
    "https://token.actions.githubusercontent.com",
    "response body exceeded the bounded size",
    "containsOidcToken: false",
    "formalPublishedReleaseClaim",
  ], "CI core");
  includesAll(runner, [
    "ACTIONS_ID_TOKEN_REQUEST_URL",
    "ACTIONS_ID_TOKEN_REQUEST_TOKEN",
    "HELP_MATH_VERCEL_INSTALLATION_ID",
    "HELP_MATH_GITHUB_REPOSITORY_ID",
    "HELP_MATH_GITHUB_REPOSITORY_OWNER_ID",
    "HELP_MATH_GITHUB_WORKFLOW_REF",
    "OIDC request installation id drifted",
    "OIDC request sender login drifted",
    "OIDC request sender type drifted",
    "::add-mask::",
    "GITHUB_OUTPUT",
    "flag: \"wx\"",
  ], "CI runner");
  invariant(!runner.includes("whoami"), "CI runner must not inspect a personal Vercel session");
  invariant(!runner.includes("keychain"), "CI runner must not inspect a keychain");

  includesAll(ignore, [".github/", "docs/", "scripts/*"], ".vercelignore");
  const serviceIdentityJobStart = ciWorkflow.indexOf("  cicd-service-identity:\n");
  const workbenchJobStart = ciWorkflow.indexOf("\n  workbench:\n", serviceIdentityJobStart);
  invariant(serviceIdentityJobStart >= 0 && workbenchJobStart > serviceIdentityJobStart, "CI workflow must isolate the service-identity job from Workbench");
  const serviceIdentityJob = ciWorkflow.slice(serviceIdentityJobStart, workbenchJobStart);
  includesAll(serviceIdentityJob, [
    "name: CI/CD service identity",
    "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803",
    "actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38",
    "persist-credentials: false",
    "npm ci",
    "node --test scripts/helpmath-vercel-ci.test.mjs scripts/verify-helpmath-cicd-service-identity.test.mjs",
    "node scripts/verify-helpmath-cicd-service-identity.mjs",
    "npm run verify:asset-profiles:deployment --workspace @helpmath/web",
  ], "CI/CD service-identity job");
  invariant(!serviceIdentityJob.includes("npm run verify:workbench"), "service-identity release check must not depend on the private source-complete Workbench gate");
  invariant(!serviceIdentityJob.includes("npm run verify:sources"), "service-identity release check must not require ignored private source archives");
  invariant(!serviceIdentityJob.includes("\n        run: npm test\n"), "service-identity release check must not substitute the source-complete Workbench suite");
  invariant(!ciWorkflow.includes("id-token: write"), "ordinary CI must not request a GitHub OIDC token");
  invariant(!ciWorkflow.includes("statuses: write"), "ordinary CI must not write commit statuses");
  includesAll(identityDoc, [
    "prepared-not-activated",
    "Vercel for GitHub",
    "Trusted Sources",
    "HELP_MATH_CICD_IDENTITY_ACTIVATED",
    "repository Actions variable",
    "repository_id",
    "workflow_ref",
    "BLOCKED_POLICY_NOT_RELOADED",
    "0/6",
  ], "service-identity documentation");
  includesAll(deploymentDoc, [
    "CI/CD service-identity successor",
    "HELP_MATH_CICD_IDENTITY_ACTIVATED",
    "repository Actions variable",
    "Vercel Deployment Checks",
  ], "deployment documentation");
  return Object.freeze({
    candidateWorkflow: true,
    dispatchOriginBound: true,
    releaseCheckSeparateFromWorkbench: true,
    postflightWorkflow: true,
    storedProviderSecrets: 0,
    vercelControlPlaneTokens: 0,
    trustedOidcHeader: true,
    immutableGithubIdentity: true,
  });
}

export async function verifyHelpmathCicdServiceIdentity(projectRoot) {
  const files = {
    candidateWorkflow: ".github/workflows/vercel-production-smoke.yml",
    ciWorkflow: ".github/workflows/ci.yml",
    core: "scripts/lib/helpmath-vercel-ci.mjs",
    deploymentDoc: "docs/DEPLOYMENT.md",
    identityDoc: "docs/CI_CD_SERVICE_IDENTITY.md",
    ignore: ".vercelignore",
    postflightWorkflow: ".github/workflows/vercel-production-postflight.yml",
    runner: "scripts/helpmath-vercel-ci.mjs",
  };
  const entries = await Promise.all(Object.entries(files).map(async ([key, relative]) => [
    key,
    await readFile(path.join(projectRoot, relative), "utf8"),
  ]));
  const policy = await readPolicy(path.join(projectRoot, ".github", "helpmath-vercel-production-policy.json"));
  const summary = validateServiceIdentityDocuments(Object.fromEntries(entries));
  return {policy, summary};
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = await verifyHelpmathCicdServiceIdentity(projectRoot);
  process.stdout.write(`${JSON.stringify({
    status: result.policy.status,
    repository: result.policy.repository,
    vercelAppInstallationId: result.policy.github.vercelApp.installationId,
    githubRepositoryId: result.policy.trustedSource.claims.repository_id,
    githubRepositoryOwnerId: result.policy.trustedSource.claims.repository_owner_id,
    vercelProjectId: result.policy.vercel.projectId,
    ...result.summary,
  }, null, 2)}\n`);
}
