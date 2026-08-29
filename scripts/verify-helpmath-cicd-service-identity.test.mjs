import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {
  validateServiceIdentityDocuments,
  verifyHelpmathCicdServiceIdentity,
} from "./verify-helpmath-cicd-service-identity.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("checked-in service identity package is secretless and activation-gated", async () => {
  const result = await verifyHelpmathCicdServiceIdentity(projectRoot);
  assert.equal(result.policy.status, "prepared-not-activated");
  assert.equal(result.summary.storedProviderSecrets, 0);
  assert.equal(result.summary.vercelControlPlaneTokens, 0);
  assert.equal(result.summary.trustedOidcHeader, true);
  assert.equal(result.summary.dispatchOriginBound, true);
});

test("static verifier rejects a Vercel token fallback", () => {
  const base = {
    candidateWorkflow: "vercel.deployment.ready vars.HELP_MATH_CICD_IDENTITY_ACTIVATED == 'true' environment: helpmath-production HELP_MATH_VERCEL_INSTALLATION_ID: ${{ github.event.installation.id }} HELP_MATH_VERCEL_SENDER_LOGIN: ${{ github.event.sender.login }} HELP_MATH_VERCEL_SENDER_TYPE: ${{ github.event.sender.type }} HELP_MATH_VERCEL_INSTALLATION_ID: ${{ steps.payload.outputs.installation_id }} HELP_MATH_VERCEL_SENDER_LOGIN: ${{ steps.payload.outputs.sender_login }} actions: read contents: read id-token: write statuses: write actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 actions/upload-artifact@330a01c490aca151604b8cf639adc76d48f6c5d4 vercel/repository-dispatch/actions/status@61881006269f0b5ac2cb186b198c54be6afe90e1 name: \"Vercel - helpmath-web: production-smoke\" github_token: ${{ github.token }} persist-credentials: false --mode candidate",
    postflightWorkflow: "vercel.deployment.promoted vars.HELP_MATH_CICD_IDENTITY_ACTIVATED == 'true' HELP_MATH_VERCEL_INSTALLATION_ID: ${{ github.event.installation.id }} HELP_MATH_VERCEL_SENDER_LOGIN: ${{ github.event.sender.login }} HELP_MATH_VERCEL_SENDER_TYPE: ${{ github.event.sender.type }} actions: read contents: read statuses: write vercel/repository-dispatch/actions/status@61881006269f0b5ac2cb186b198c54be6afe90e1 name: \"Vercel - helpmath-web: production-postflight\" github_token: ${{ github.token }} persist-credentials: false --mode postflight vercel-production-postflight.json",
    runner: "ACTIONS_ID_TOKEN_REQUEST_URL ACTIONS_ID_TOKEN_REQUEST_TOKEN HELP_MATH_VERCEL_INSTALLATION_ID OIDC request installation id drifted OIDC request sender login drifted ::add-mask:: GITHUB_OUTPUT flag: \"wx\"",
    core: "x-vercel-trusted-oidc-idp-token repo:HUDongpin/help-math-2-0-workbench:environment:helpmath-production dispatch installation id drifted service identity policy is not active redirect: \"manual\" https://token.actions.githubusercontent.com response body exceeded the bounded size containsOidcToken: false formalPublishedReleaseClaim",
    ignore: ".github/ docs/ scripts/*",
    ciWorkflow: "node --test scripts/helpmath-vercel-ci.test.mjs scripts/verify-helpmath-cicd-service-identity.test.mjs node scripts/verify-helpmath-cicd-service-identity.mjs",
    identityDoc: "prepared-not-activated Vercel for GitHub Trusted Sources HELP_MATH_CICD_IDENTITY_ACTIVATED repository Actions variable BLOCKED_POLICY_NOT_RELOADED 0/6",
    deploymentDoc: "CI/CD service-identity successor HELP_MATH_CICD_IDENTITY_ACTIVATED repository Actions variable Vercel Deployment Checks",
  };
  assert.throws(
    () => validateServiceIdentityDocuments({...base, candidateWorkflow: `${base.candidateWorkflow} VERCEL_TOKEN`}),
    /must not use a Vercel token/u,
  );
});

test("static verifier rejects a stored GitHub secret and unpinned promotion CLI", () => {
  const documents = {
    candidateWorkflow: "vercel.deployment.ready vars.HELP_MATH_CICD_IDENTITY_ACTIVATED == 'true' environment: helpmath-production HELP_MATH_VERCEL_INSTALLATION_ID: ${{ github.event.installation.id }} HELP_MATH_VERCEL_SENDER_LOGIN: ${{ github.event.sender.login }} HELP_MATH_VERCEL_SENDER_TYPE: ${{ github.event.sender.type }} HELP_MATH_VERCEL_INSTALLATION_ID: ${{ steps.payload.outputs.installation_id }} HELP_MATH_VERCEL_SENDER_LOGIN: ${{ steps.payload.outputs.sender_login }} actions: read contents: read id-token: write statuses: write actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 actions/upload-artifact@330a01c490aca151604b8cf639adc76d48f6c5d4 vercel/repository-dispatch/actions/status@61881006269f0b5ac2cb186b198c54be6afe90e1 name: \"Vercel - helpmath-web: production-smoke\" github_token: ${{ github.token }} persist-credentials: false --mode candidate ${{ secrets.DEPLOY_TOKEN }} vercel promote",
    postflightWorkflow: "vercel.deployment.promoted vars.HELP_MATH_CICD_IDENTITY_ACTIVATED == 'true' HELP_MATH_VERCEL_INSTALLATION_ID: ${{ github.event.installation.id }} HELP_MATH_VERCEL_SENDER_LOGIN: ${{ github.event.sender.login }} HELP_MATH_VERCEL_SENDER_TYPE: ${{ github.event.sender.type }} actions: read contents: read statuses: write vercel/repository-dispatch/actions/status@61881006269f0b5ac2cb186b198c54be6afe90e1 name: \"Vercel - helpmath-web: production-postflight\" github_token: ${{ github.token }} persist-credentials: false --mode postflight vercel-production-postflight.json",
    runner: "ACTIONS_ID_TOKEN_REQUEST_URL ACTIONS_ID_TOKEN_REQUEST_TOKEN HELP_MATH_VERCEL_INSTALLATION_ID OIDC request installation id drifted OIDC request sender login drifted ::add-mask:: GITHUB_OUTPUT flag: \"wx\"",
    core: "x-vercel-trusted-oidc-idp-token repo:HUDongpin/help-math-2-0-workbench:environment:helpmath-production dispatch installation id drifted service identity policy is not active redirect: \"manual\" https://token.actions.githubusercontent.com response body exceeded the bounded size containsOidcToken: false formalPublishedReleaseClaim",
    ignore: ".github/ docs/ scripts/*",
    ciWorkflow: "node --test scripts/helpmath-vercel-ci.test.mjs scripts/verify-helpmath-cicd-service-identity.test.mjs node scripts/verify-helpmath-cicd-service-identity.mjs",
    identityDoc: "prepared-not-activated Vercel for GitHub Trusted Sources HELP_MATH_CICD_IDENTITY_ACTIVATED repository Actions variable BLOCKED_POLICY_NOT_RELOADED 0/6",
    deploymentDoc: "CI/CD service-identity successor HELP_MATH_CICD_IDENTITY_ACTIVATED repository Actions variable Vercel Deployment Checks",
  };
  assert.throws(() => validateServiceIdentityDocuments(documents), /stored GitHub secrets/u);
});
