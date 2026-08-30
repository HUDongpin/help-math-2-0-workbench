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

const EXPECTED_DEPLOYMENT_SAFE_FILE_EXCLUSIONS = Object.freeze([
  "tests/g4-l3-lesson-navigation.test.ts",
]);
const EXPECTED_DEPLOYMENT_SAFE_TEST_SKIP_NAMES = Object.freeze([
  "candidate profile holds 3 alternate runtime files and 204 frozen evidence files",
  "showcase asset policy binds exactly the 39 page packages and one shell",
  "source-bound resume prompt stays local, explicit, and acceptance-neutral",
  "source-bound Exit prompt preserves the shell visual and replaces legacy network behavior locally",
  "all 54 runtime files are exact-byte and exact-SHA bound to their manifests",
  "G5 L4 shell Key Terms candidate stays exact-source-bound and acceptance-neutral",
  "G4 L3 and G5 L4 formal adapters exclude both legacy shells",
]);
const EXPECTED_REQUIRED_DEPLOYMENT_TEST_PATHS = Object.freeze([
  "tests/private-preview-deployment-assets.test.ts",
  "tests/current-js-showcase-publication.test.ts",
  "tests/page-only-current-js-showcase-asset-policy.test.ts",
]);
const EXPECTED_DEPLOYMENT_E2E_SPEC_PATHS = Object.freeze([
  "e2e/site.spec.ts",
  "e2e/prototype-acceptance.spec.ts",
  "e2e/modern-wide-geometry.spec.ts",
  "e2e/canvas-sharpness.spec.ts",
  "e2e/learning-experience-polish.spec.ts",
]);
const EXPECTED_DEPLOYMENT_E2E_GREP_INVERT_NAMES = Object.freeze([
  "Conversion 1.2 local diagnostic renders its deterministic JavaScript stage",
  "Conversion 1.4 local diagnostic renders its deterministic JavaScript stage",
  "development-only diagnostic image assets respond with PNG content",
  "prototype demos honor exact one-indexed frame capture",
  "designer tools are explicit and remain outside the ordinary learning workspace",
  "workspace tools work without turning preview controls into real records",
  "dark designer-only Design notes screen has no serious or critical axe violations",
  "every learner screen and designer-only teacher screen stays axe-clean",
  "local audit archive fails closed until strict completion ledger entries exist",
  "/migration-status?view=designer has no serious or critical axe violations",
]);
const EXPECTED_DEPLOYMENT_E2E_ENV = Object.freeze({
  CLERK_LOCAL_AUTH_ENABLED: "false",
  CURRENT_JS_CANDIDATE_PROFILE_ENABLED: "false",
  CURRENT_JS_SHOWCASE_G3_L2_ENABLED: "true",
  CURRENT_JS_SHOWCASE_G4_L3_ENABLED: "true",
  CURRENT_JS_SHOWCASE_G4_L5_ENABLED: "true",
  CURRENT_JS_SHOWCASE_G4_L10_ENABLED: "true",
  CURRENT_JS_SHOWCASE_G4_L11_ENABLED: "true",
  CURRENT_JS_SHOWCASE_G5_L3_ENABLED: "true",
  CURRENT_JS_SHOWCASE_G5_L4_ENABLED: "true",
  CURRENT_JS_SHOWCASE_G5_L5_ENABLED: "true",
  CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED: "false",
  MODERN_WIDE_SHELL_ENABLED: "true",
  NOVA_CLIENT_RENDER_MOCK_ENABLED: "true",
  REVIEWER_INSTRUMENTATION_ENABLED: "false",
});

function parseJsonDocument(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function parseFrozenStringArray(source, exportName, label) {
  const expression = new RegExp(
    `export const ${exportName} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`,
    "u",
  );
  const match = expression.exec(source);
  invariant(match, `${label} is missing its frozen exact array`);
  const body = match[1];
  const literals = [...body.matchAll(/'([^']*)'/gu)];
  const remainder = body
    .replace(/'([^']*)'/gu, "")
    .replace(/[\s,]/gu, "");
  invariant(remainder.length === 0, `${label} contains a non-literal array member`);
  return literals.map(([literal]) => literal.slice(1, -1));
}

function parseFrozenStringRecord(source, exportName, label) {
  const expression = new RegExp(
    `export const ${exportName} = Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\);`,
    "u",
  );
  const match = expression.exec(source);
  invariant(match, `${label} is missing its frozen exact record`);
  const body = match[1];
  const entries = [...body.matchAll(/^\s*([A-Za-z0-9_]+): '([^']*)',?\s*$/gmu)];
  const remainder = body
    .replace(/^\s*([A-Za-z0-9_]+): '([^']*)',?\s*$/gmu, "")
    .replace(/[\s,]/gu, "");
  invariant(remainder.length === 0, `${label} contains a non-literal record member`);
  return Object.fromEntries(entries.map(([, key, value]) => [key, value]));
}

function assertExactArray(actual, expected, label) {
  invariant(
    actual.length === expected.length
      && actual.every((value, index) => value === expected[index]),
    `${label} must match the exact approved list`,
  );
}

function assertExactRecord(actual, expected, label) {
  const actualEntries = Object.entries(actual);
  const expectedEntries = Object.entries(expected);
  invariant(
    actualEntries.length === expectedEntries.length
      && actualEntries.every(([key, value], index) => {
        const [expectedKey, expectedValue] = expectedEntries[index];
        return key === expectedKey && value === expectedValue;
      }),
    `${label} must match the exact approved record`,
  );
}

function countOccurrences(source, fragment) {
  return source.split(fragment).length - 1;
}

function parseWorkflowJob(workflow, jobId) {
  const lines = workflow.split(/\r?\n/u);
  const start = lines.findIndex((line) => line === `  ${jobId}:`);
  invariant(start >= 0, `CI workflow is missing job ${jobId}`);
  const end = lines.findIndex(
    (line, index) => index > start && /^  [A-Za-z0-9_-]+:\s*$/u.test(line),
  );
  return lines.slice(start, end < 0 ? lines.length : end).join("\n");
}

function parseWorkflowStepRun(job, stepName) {
  const lines = job.split(/\r?\n/u);
  const start = lines.findIndex((line) => line === `      - name: ${stepName}`);
  invariant(start >= 0, `CI job is missing step ${stepName}`);
  const end = lines.findIndex(
    (line, index) => index > start && /^      - name:/u.test(line),
  );
  const stepLines = lines.slice(start, end < 0 ? lines.length : end);
  const runLines = stepLines.filter((line) => /^        run:\s+/u.test(line));
  invariant(runLines.length === 1, `CI step ${stepName} must have exactly one run command`);
  return runLines[0].replace(/^        run:\s+/u, "");
}

function validateDeploymentSafeTestRunner(source) {
  assertExactArray(
    parseFrozenStringArray(source, "EXCLUDED_TEST_PATHS", "deployment-safe file exclusions"),
    EXPECTED_DEPLOYMENT_SAFE_FILE_EXCLUSIONS,
    "deployment-safe file exclusions",
  );
  assertExactArray(
    parseFrozenStringArray(source, "DEPLOYMENT_SAFE_TEST_SKIP_NAMES", "deployment-safe test skip names"),
    EXPECTED_DEPLOYMENT_SAFE_TEST_SKIP_NAMES,
    "deployment-safe test skip names",
  );
  assertExactArray(
    parseFrozenStringArray(source, "REQUIRED_DEPLOYMENT_TEST_PATHS", "required deployment tests"),
    EXPECTED_REQUIRED_DEPLOYMENT_TEST_PATHS,
    "required deployment tests",
  );
  invariant(
    source.includes("export const DEPLOYMENT_SAFE_TEST_SKIP_PATTERN = buildExactTestSkipPattern();"),
    "deployment-safe runner must derive one exact skip pattern",
  );
  invariant(
    source.includes("testNames.map(escapeRegExp).join('|')"),
    "deployment-safe runner must regex-escape every exact test name",
  );
  invariant(
    source.includes("return `^(?:${testNames.map(escapeRegExp).join('|')})$`;"),
    "deployment-safe runner must anchor the exact skip pattern",
  );
  invariant(
    countOccurrences(source, "allTestPaths.filter") === 1
      && source.includes("const selectedTestPaths = allTestPaths.filter((relativePath) => !excluded.has(relativePath));"),
    "deployment-safe runner must use exactly the approved file exclusion filter",
  );
  invariant(
    source.includes("args: Object.freeze([\n      '--import',\n      'tsx',\n      '--test',\n      '--test-skip-pattern',\n      testSkipPattern,\n      ...testPaths,\n    ])"),
    "deployment-safe runner must invoke Node with the exact test arguments",
  );
  invariant(
    source.includes("cwd,\n      env,\n      shell: false,\n      stdio: 'inherit',"),
    "deployment-safe runner must use the web cwd, inherited stdio, and shell false",
  );
  invariant(
    source.includes("spawnImpl(invocation.command, invocation.args, invocation.options)"),
    "deployment-safe runner must spawn the built invocation",
  );
  invariant(
    source.includes("child.once('exit', (code, signal) =>")
      && source.includes("code: code ?? null")
      && source.includes("signal: signal ?? null"),
    "deployment-safe runner must preserve child exit code and signal",
  );
  invariant(
    source.includes("pathToFileURL") && source.includes("if (isMain) process.exitCode = await main();"),
    "deployment-safe runner must not execute on import",
  );
}

function validateDeploymentE2eRunner(source) {
  assertExactArray(
    parseFrozenStringArray(source, "DEPLOYMENT_E2E_SPEC_PATHS", "deployment E2E spec allowlist"),
    EXPECTED_DEPLOYMENT_E2E_SPEC_PATHS,
    "deployment E2E spec allowlist",
  );
  assertExactArray(
    parseFrozenStringArray(source, "DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES", "deployment E2E grep-invert names"),
    EXPECTED_DEPLOYMENT_E2E_GREP_INVERT_NAMES,
    "deployment E2E grep-invert names",
  );
  assertExactRecord(
    parseFrozenStringRecord(source, "DEPLOYMENT_E2E_ENV", "deployment E2E environment"),
    EXPECTED_DEPLOYMENT_E2E_ENV,
    "deployment E2E environment",
  );
  invariant(
    source.includes("export const DEPLOYMENT_E2E_GREP_INVERT_PATTERN = buildExactGrepInvertPattern();"),
    "deployment E2E runner must derive one exact grep-invert pattern",
  );
  invariant(
    source.includes("return `(?:^| )(?:${names.map(escapeRegExp).join('|')})$`;"),
    "deployment E2E runner must anchor and escape the exact grep-invert names",
  );
  invariant(
    source.includes("assertExactList(specPaths, DEPLOYMENT_E2E_SPEC_PATHS, 'deployment E2E spec allowlist');")
      && source.includes("assertExactList(\n    grepInvertNames,\n    DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES,"),
    "deployment E2E runner must reject allowlist or grep-invert drift",
  );
  invariant(
    source.includes("args: Object.freeze([\n      playwrightCli,\n      'test',\n      ...specPaths,\n      '--workers=2',\n      '--grep-invert',\n      buildExactGrepInvertPattern(grepInvertNames),\n    ])"),
    "deployment E2E runner must invoke only the exact specs with workers=2",
  );
  invariant(
    source.includes("env: Object.freeze({...baseEnv, ...DEPLOYMENT_E2E_ENV})")
      && source.includes("shell: false")
      && source.includes("stdio: 'inherit'"),
    "deployment E2E runner must apply the exact environment without a shell",
  );
  invariant(
    source.includes("pathToFileURL") && source.includes("if (isMain) process.exitCode = await main();"),
    "deployment E2E runner must not execute on import",
  );
}

export function validateServiceIdentityDocuments(documents) {
  const {
    candidateWorkflow,
    ciWorkflow,
    core,
    deploymentDoc,
    deploymentE2eRunner,
    deploymentSafeTestRunner,
    identityDoc,
    ignore,
    postflightWorkflow,
    runner,
    webPackageJson,
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

  validateDeploymentSafeTestRunner(deploymentSafeTestRunner);
  validateDeploymentE2eRunner(deploymentE2eRunner);
  const webPackage = parseJsonDocument(webPackageJson, "apps/web/package.json");
  invariant(
    webPackage?.scripts?.["test:deployment"] === "node scripts/run-deployment-safe-tests.mjs",
    "apps/web/package.json test:deployment must invoke the exact deployment-safe runner",
  );
  invariant(
    webPackage?.scripts?.["test:e2e:deployment"] === "node scripts/run-deployment-e2e.mjs",
    "apps/web/package.json test:e2e:deployment must invoke the exact deployment E2E runner",
  );

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
    "x-helpmath-vercel-project-id",
    "x-helpmath-vercel-deployment-url",
    "x-helpmath-git-commit-sha",
    "eventDeploymentIdentity",
    "observedDomainDeploymentIdentity",
    "eventToObservedDomainExactMatch",
    "typeof actual === \"string\" && actual === expected",
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
  const siteJob = parseWorkflowJob(ciWorkflow, "site");
  invariant(
    parseWorkflowStepRun(siteJob, "Test site") === "npm run test:deployment",
    "Site workspace Test site step must invoke npm run test:deployment exactly",
  );
  const siteRunCommands = [...siteJob.matchAll(/^        run:\s+(.+)$/gmu)]
    .map(([, command]) => command);
  invariant(
    siteRunCommands.filter((command) => command === "npm run test:deployment").length === 1,
    "Site workspace must invoke deployment-safe tests exactly once",
  );
  invariant(!siteRunCommands.includes("npm test"), "Site workspace must not run the source-bound full test suite");
  invariant(
    parseWorkflowStepRun(siteJob, "Run deployment browser and accessibility tests") === "npm run test:e2e:deployment",
    "Site workspace must invoke the exact deployment E2E runner",
  );
  invariant(
    siteRunCommands.filter((command) => command === "npm run test:e2e:deployment").length === 1,
    "Site workspace must invoke deployment E2E exactly once",
  );
  for (const command of [
    "npm run test:e2e",
    "npm run test:e2e:g5-l4-audio-gate-off --workspace @helpmath/web",
    "npm run test:e2e:modern-wide --workspace @helpmath/web",
    "npm run test:e2e:nova-full-stack --workspace @helpmath/web",
  ]) {
    invariant(!siteRunCommands.includes(command), `Site workspace must not rerun specialized E2E command: ${command}`);
  }
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
    deploymentE2eRunner: "apps/web/scripts/run-deployment-e2e.mjs",
    deploymentSafeTestRunner: "apps/web/scripts/run-deployment-safe-tests.mjs",
    identityDoc: "docs/CI_CD_SERVICE_IDENTITY.md",
    ignore: ".vercelignore",
    postflightWorkflow: ".github/workflows/vercel-production-postflight.yml",
    runner: "scripts/helpmath-vercel-ci.mjs",
    webPackageJson: "apps/web/package.json",
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
