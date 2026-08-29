#!/usr/bin/env node

import {execFileSync} from "node:child_process";
import {appendFile, mkdir, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  readPolicy,
  requestGithubOidcToken,
  runSmoke,
  validateDispatch,
} from "./lib/helpmath-vercel-ci.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultPolicyPath = path.join(projectRoot, ".github", "helpmath-vercel-production-policy.json");

function fail(message) {
  throw new Error(message);
}

function requiredEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.length === 0) fail(`required environment field is unavailable: ${name}`);
  return value;
}

function parseCommand(argv) {
  if (argv.length < 1) fail("usage: helpmath-vercel-ci.mjs <validate-payload|request-oidc|smoke>");
  const [command, ...rest] = argv;
  const values = new Map();
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || value === undefined) fail("CLI options must be explicit --key value pairs");
    if (values.has(key)) fail(`duplicate CLI option: ${key}`);
    values.set(key, value);
  }
  return {command, values};
}

function option(values, key, {required = true, fallback} = {}) {
  if (values.has(key)) return values.get(key);
  if (fallback !== undefined) return fallback;
  if (required) fail(`missing required option: ${key}`);
  return undefined;
}

async function githubOutput(entries) {
  const outputPath = requiredEnv("GITHUB_OUTPUT");
  for (const [key, value] of Object.entries(entries)) {
    if (!/^[a-z][a-z0-9_]*$/u.test(key)) fail(`invalid GitHub output key: ${key}`);
    if (typeof value !== "string" || value.includes("\n") || value.includes("\r")) fail(`unsafe GitHub output value: ${key}`);
    await appendFile(outputPath, `${key}=${value}\n`, {encoding: "utf8", mode: 0o600});
  }
}

function checkoutSha() {
  const value = execFileSync("git", ["rev-parse", "--verify", "HEAD"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_TERMINAL_PROMPT: "0",
    },
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  return value;
}

async function validatePayload(values) {
  const mode = option(values, "--mode");
  const policy = await readPolicy(option(values, "--policy", {fallback: defaultPolicyPath}));
  const payload = JSON.parse(requiredEnv("HELP_MATH_VERCEL_PAYLOAD_JSON"));
  const identity = validateDispatch({
    action: requiredEnv("HELP_MATH_VERCEL_EVENT_ACTION"),
    payload,
    checkoutSha: checkoutSha(),
    eventOrigin: {
      installationId: requiredEnv("HELP_MATH_VERCEL_INSTALLATION_ID"),
      senderLogin: requiredEnv("HELP_MATH_VERCEL_SENDER_LOGIN"),
      senderType: requiredEnv("HELP_MATH_VERCEL_SENDER_TYPE"),
    },
    repository: requiredEnv("GITHUB_REPOSITORY"),
    mode,
    policy,
  });
  await githubOutput({
    deployment_id: identity.deploymentId,
    deployment_url: identity.deploymentUrl,
    git_ref: identity.gitRef,
    git_sha: identity.gitSha,
    installation_id: identity.githubAppInstallationId,
    project_id: identity.projectId,
    sender_login: identity.githubAppSenderLogin,
  });
  process.stdout.write(`Validated ${mode} dispatch for ${identity.deploymentId} at ${identity.gitSha}.\n`);
}

async function requestOidc(values) {
  const policy = await readPolicy(option(values, "--policy", {fallback: defaultPolicyPath}));
  if (policy.status !== "active") fail("service identity policy is not active");
  if (requiredEnv("HELP_MATH_VERCEL_INSTALLATION_ID") !== policy.github.vercelApp.installationId) {
    fail("OIDC request installation id drifted");
  }
  if (requiredEnv("HELP_MATH_VERCEL_SENDER_LOGIN") !== policy.github.vercelApp.senderLogin) {
    fail("OIDC request sender login drifted");
  }
  const token = await requestGithubOidcToken({
    requestUrl: requiredEnv("ACTIONS_ID_TOKEN_REQUEST_URL"),
    requestToken: requiredEnv("ACTIONS_ID_TOKEN_REQUEST_TOKEN"),
    audience: policy.github.oidcAudience,
  });
  process.stdout.write(`::add-mask::${token}\n`);
  await githubOutput({token});
  process.stdout.write("Issued one short-lived GitHub OIDC token for the trusted deployment smoke.\n");
}

function fixedReceiptPath(raw, mode) {
  const expected = mode === "candidate"
    ? "artifacts/ci-service-identity/vercel-production-candidate-smoke.json"
    : "artifacts/ci-service-identity/vercel-production-postflight.json";
  if (raw !== expected) fail(`receipt path must be exactly ${expected}`);
  return path.join(projectRoot, expected);
}

async function smoke(values) {
  const mode = option(values, "--mode");
  if (mode !== "candidate" && mode !== "postflight") fail("smoke mode must be candidate or postflight");
  const policy = await readPolicy(option(values, "--policy", {fallback: defaultPolicyPath}));
  const outputPath = fixedReceiptPath(option(values, "--receipt"), mode);
  const deployment = {
    deploymentId: requiredEnv("HELP_MATH_DEPLOYMENT_ID"),
    deploymentUrl: requiredEnv("HELP_MATH_DEPLOYMENT_URL"),
    githubAppInstallationId: requiredEnv("HELP_MATH_VERCEL_INSTALLATION_ID"),
    gitSha: requiredEnv("HELP_MATH_GIT_SHA"),
  };
  const receipt = await runSmoke({
    policy,
    mode,
    deployment,
    oidcToken: mode === "candidate" ? requiredEnv("HELP_MATH_TRUSTED_OIDC_TOKEN") : undefined,
  });
  await mkdir(path.dirname(outputPath), {recursive: true, mode: 0o700});
  const resolvedParent = await realpath(path.dirname(outputPath));
  if (resolvedParent !== path.dirname(outputPath)) fail("receipt parent resolved unexpectedly");
  await writeFile(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    await appendFile(
      summaryPath,
      `### HELP Math ${mode} verification\n\n- Deployment: \`${receipt.vercel.deploymentId}\`\n- Git SHA: \`${receipt.source.commit}\`\n- Routes: ${receipt.checks.passed}/${receipt.checks.routeCount}\n- Strict-completion claim: \`false\`\n- Formal publication claim: \`false\`\n`,
      "utf8",
    );
  }
  process.stdout.write(`PASS: ${mode} smoke ${receipt.checks.passed}/${receipt.checks.routeCount}.\n`);
}

const {command, values} = parseCommand(process.argv.slice(2));
const handlers = {
  "request-oidc": requestOidc,
  smoke,
  "validate-payload": validatePayload,
};
if (!(command in handlers)) fail(`unknown command: ${command}`);
await handlers[command](values);
