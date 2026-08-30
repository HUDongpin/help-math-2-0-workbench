# HELP Math CI/CD Service Identity

Status: **prepared-not-activated**

This package replaces the local Owner-credential launcher with a bounded,
secretless deployment path. It does not activate that path, connect GitHub or
Vercel, create a provider installation, change a domain, or promote a
deployment. While a newly started Codex run still reports
`BLOCKED_POLICY_NOT_RELOADED`, every identity and provider write remains
forbidden.

## Identity model

```mermaid
flowchart LR
  A["Protected main commit"] --> B["Vercel for GitHub installation"]
  B --> C["Unaliased Production deployment"]
  C --> D["vercel.deployment.ready"]
  D --> E["GitHub Environment approval"]
  E --> F["Short-lived GitHub OIDC token"]
  F --> G["Vercel Trusted Sources protected smoke"]
  G --> H["GitHub commit status"]
  H --> I["Vercel Deployment Checks auto-promotion"]
  I --> J["vercel.deployment.promoted postflight"]
```

The identities are deliberately separate:

- **Deployment:** the Vercel for GitHub installation is restricted to
  `HUDongpin/help-math-2-0-workbench` and the existing `helpmath-web` project.
  It builds the protected `main` commit. No Owner CLI session or Vercel token
  is stored in GitHub. Before any OIDC token is requested, both workflows
  require the event's sender to be `vercel[bot]` and its GitHub App
  installation ID to equal the reviewed ID in repository policy. They also
  bind the immutable GitHub `repository_id` and `repository_owner_id`, the
  repository name, ref, event, and `workflow_ref` from the live workflow
  context. This prevents a forged `repository_dispatch` or a recycled
  repository name from redirecting the token to an unrelated `vercel.app`
  origin.
- **Candidate access:** GitHub Actions requests one short-lived OIDC token with
  audience `https://vercel.com/helpmath-production`. Vercel Trusted Sources
  accepts it only when every configured claim matches: audience, repository,
  immutable repository and owner IDs, environment, ref, event, and the ordinary
  workflow's `workflow_ref`. The runner parses and checks the same claims before
  forwarding the token; Vercel independently verifies its signature. The token
  crosses deployment protection; it cannot create, promote, roll back,
  reconfigure, or delete a deployment.
- **Promotion decision:** the GitHub environment `helpmath-production` supplies
  an auditable required-review boundary. The workflow posts only the exact
  `Vercel - helpmath-web: production-smoke` status to the deployed main SHA.
  The Vercel-maintained repository-dispatch status action is pinned to full
  commit `61881006269f0b5ac2cb186b198c54be6afe90e1`; it receives only the
  job-scoped ephemeral `github.token`. Vercel Deployment Checks, not the
  workflow, promotes after the status passes.
- **Postflight:** the provider-generated `vercel.deployment.promoted` event
  binds the deployment ID, project, environment, ref, SHA, immutable repository
  IDs, and the distinct postflight `workflow_ref`. Every checked public response
  must also expose build-fixed, non-secret project ID, unique deployment URL,
  and Git SHA provenance equal to that event. The schema-v2 receipt keeps
  `eventDeploymentIdentity` separate from `observedDomainDeploymentIdentity`
  and cannot pass on route content alone. The postflight receives no OIDC token.
- **Merge admission:** the ordinary CI workflow exposes a separate
  `CI/CD service identity` job. It runs the secretless identity tests and
  verifier plus the exact deployment-asset closure from a clean Git checkout.
  It does not request OIDC, write statuses, or depend on ignored private source
  archives. The source-complete `Workbench` job remains a distinct diagnostic
  job and is not required for this site-release path. `Site workspace` uses
  `npm run test:deployment`, whose recursive runner keeps ordinary security,
  route, unit, and exact deployment-asset tests while excluding only the seven
  source-bound tests that require candidate assets, legacy shell assets, private
  migration/source files, or private reports. Neither job is reinterpreted as
  Flash fidelity or lesson-publication evidence.

The workflows use no `${{ secrets.* }}` values, no `VERCEL_TOKEN`, no
Protection Bypass secret, no Owner credential helper, and no Vercel mutation
API. The only GitHub token is the job-scoped ephemeral `github.token`; its only
write permission is commit-status writing, alongside explicit read-only
repository and Actions access. Candidate access uses a short-lived OIDC token
and the `x-vercel-trusted-oidc-idp-token` header.

## Fixed repository policy

The machine-readable policy is
`.github/helpmath-vercel-production-policy.json`. It fixes:

- repository: `HUDongpin/help-math-2-0-workbench`;
- default and Production branch: `main`;
- Vercel project: `helpmath-web`
  (`prj_q3v5Ue0zCL1T9rzTFD21KpNc5tzu`);
- GitHub environment: `helpmath-production`;
- repository Actions activation variable:
  `HELP_MATH_CICD_IDENTITY_ACTIVATED`;
- Vercel GitHub App sender `vercel[bot]` and an installation ID that is
  deliberately `null` while this package is prepared but not activated;
- Trusted Sources issuer, audience, repository name, immutable GitHub
  `repository_id` and `repository_owner_id`, environment, `workflow_ref`, ref,
  event, and header; the two immutable IDs are deliberately `null` while the
  package is prepared;
- distinct candidate and postflight workflow refs, so the public postflight is
  not incorrectly validated as the OIDC-bearing candidate workflow;
- the exact eight-lesson, 426-page bilingual route matrix;
- fail-closed unpublished routes and apex redirect probe; and
- all-false strict-completion, formal-publication, Nova, LRS, and Contact
  claims for this release.

Changing those values requires a reviewed pull request. Provider settings do
not override a mismatch in the checked-in policy.

Activation requires a narrow follow-up pull request that records the exact
repository-restricted Vercel GitHub App installation ID, the live GitHub
`repository_id`, and the live `repository_owner_id`, then changes policy
`status` from `prepared-not-activated` to `active`. The runtime rejects every
dispatch, OIDC request, and smoke run while the status is still prepared or any
one of these three IDs is absent. Never guess, preallocate, or copy an ID from
another repository.

Do not bind Trusted Sources only to the historical name-based GitHub OIDC
`sub`. GitHub introduced immutable `sub` formats containing owner/repository
IDs for repositories created after 2026-07-15, renamed after that date, or
opted into immutable subjects. This policy instead uses the stable
`repository_id` and `repository_owner_id` claims directly and uses
`workflow_ref` for this ordinary workflow; `job_workflow_ref` is not a
substitute unless the job actually invokes a reusable workflow. See GitHub's
[OIDC claim reference](https://docs.github.com/en/actions/reference/security/oidc#oidc-token-claims).

## Required management policy change

Before provider activation, the developer/system configuration manager must
publish a new policy outside the running task. A fresh Codex task must then
confirm that it actually loaded permission to configure and use this exact
non-Owner service identity. The permission must remain confined to:

- the repository and Vercel project above;
- GitHub branch/environment/protection configuration;
- the Vercel for GitHub installation, Trusted Sources, and Deployment Checks;
- production-candidate smoke and post-promotion read-only verification; and
- provider rollback or disablement for this project only.

It must continue to forbid reading Owner local credentials, keychains, CLI
sessions, browser cookies, shell history, personal tokens, and credential
helpers. If the fresh task still sees the prior policy, it must stop at
`BLOCKED_POLICY_NOT_RELOADED`.

## GitHub administrator configuration

Complete these steps without placing a secret in chat, Git, workflow inputs,
command arguments, or ordinary logs:

1. Protect `main`. Require pull requests, at least one independent approval,
   dismissal of stale approvals, resolved conversations, and the
   `CI/CD service identity` and `Site workspace` checks. Block force pushes
   and direct pushes. Keep `Workbench` visible, but do not require it for this
   Git-hosted site-release path: its strict source/evidence validation requires
   ignored private source archives and work records that a clean GitHub runner
   must not receive. Do not weaken that job or treat its absence/failure as a
   strict-completion pass; run it only in a separately authorized,
   source-complete environment.
2. Create the environment `helpmath-production`.
3. Restrict it to protected `main`, require the Owner or authorized release
   team as reviewer, prevent self-review, and disable administrator bypass
   where the current GitHub plan supports those controls.
4. Store **no secrets** in the environment. The package does not accept a
   Vercel token or protection-bypass secret.
5. After the Vercel GitHub App is authorized only for this repository, obtain
   the non-secret immutable `github.repository_id` and
   `github.repository_owner_id` from the repository context. Record those two
   IDs plus the exact App installation ID in a reviewed activation pull
   request, configure Vercel with the same claim values, and only then change
   the machine-readable policy status to `active`.
6. Leave the repository Actions variable
   `HELP_MATH_CICD_IDENTITY_ACTIVATED` absent until every Vercel control below
   except the Deployment Check itself is configured and Production domain
   auto-assignment is verified off. Set that repository variable to exact
   string `true` immediately before creating the first status-seeding staged
   deployment. Do not store it as an environment-level variable: the job-level
   activation condition is evaluated before the protected environment job
   begins.

The environment review is the operational Owner-promotion decision for the
site deployment. It is not an Owner acceptance record for Flash fidelity or an
`EvidenceReceiptV1` lesson-publication decision.

## Vercel administrator configuration

Use the existing `helpmath-web` project. Do not create a replacement project.

1. Keep automatic Production-domain assignment off while creating and testing
   the first staged Git-connected Production deployment. That first deployment
   exists to prove the dispatch, OIDC, route, and status-context path; it is not
   the release candidate that may receive the public domains.
2. Install or authorize **Vercel for GitHub** only for
   `HUDongpin/help-math-2-0-workbench`, then connect that repository to
   `helpmath-web`.
3. Set the Production branch to protected `main`. Keep the project root,
   build, output, Node, environment-variable, and deployment-protection
   settings from `docs/DEPLOYMENT.md` unchanged.
4. Keep Vercel `repository_dispatch` delivery enabled for
   `vercel.deployment.ready` and `vercel.deployment.promoted`.
5. Add a **GitHub Actions** Trusted Sources external OIDC rule, switch to
   **Edit raw claims**, and configure these exact bindings. Replace the two
   bracketed values only with the live immutable IDs recorded in the activation
   pull request:

   ```text
   issuer             = https://token.actions.githubusercontent.com
   aud                = https://vercel.com/helpmath-production
   repository         = HUDongpin/help-math-2-0-workbench
   repository_id      = <exact github.repository_id>
   repository_owner   = HUDongpin
   repository_owner_id = <exact github.repository_owner_id>
   environment        = helpmath-production
   event_name         = repository_dispatch
   ref                = refs/heads/main
   workflow_ref       = HUDongpin/help-math-2-0-workbench/.github/workflows/vercel-production-smoke.yml@refs/heads/main
   ```

   Do not configure a guessed name-only `sub`, and do not use
   `job_workflow_ref`. Every listed raw claim must be present and must match
   exactly. Apply the rule only to the `production` environment on
   `helpmath-web`. Vercel documents the required audience, identity claims,
   exact matching behavior, custom audience, and raw `workflow_ref` option in
   [Trusted Sources](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/trusted-sources).

6. Do not add a long-lived Protection Bypass for Automation secret. The smoke
   workflow must pass only through the Trusted Sources OIDC rule.
7. Use the first staged deployment to produce the exact commit-status context
   `Vercel - helpmath-web: production-smoke`, then retain its passing receipt.
8. Vercel currently documents automatic Production aliasing as a prerequisite
   for selecting Deployment Checks. Treat the transition from staged mode to
   required-check mode as one fail-closed administrator transaction: freeze
   `main`, verify that no deployment is queued, enable automatic aliasing, add
   the exact check immediately, and confirm that a missing, skipped, pending,
   failed, or canceled status blocks domain assignment before permitting any
   new Production deployment.
9. Do not use the first status-seeding deployment for public cutover. Create a
   new Production deployment from the exact protected `main` SHA only after
   the required check is visibly attached. If the dashboard cannot complete
   step 8 without a possible unguarded alias assignment, stop and introduce a
   separately reviewed two-phase bootstrap that disables Git deployments until
   the check is attached; never accept a temporary unguarded promotion window.

The initial sequence intentionally creates a new Git-connected deployment. It
does not promote or mutate the earlier CLI-staged deployment
`dpl_2YL2yrWS3618VGQB36nusPt7yLhB`; that deployment remains dated evidence and
must not be represented as the Git-service-identity result.

## First activation sequence

1. Review and merge this prepared package together with the accepted application tree
   into protected `main` while the old Vercel Git connection remains inactive
   or automatic aliasing remains off. Require the exact `CI/CD service identity`
   and `Site workspace` checks; retain the separate source-complete Workbench
   result without using it as site-deployment or publication evidence.
2. Complete the GitHub environment and Vercel Trusted Sources setup, authorize
   the repository-restricted Vercel for GitHub installation, and verify that
   Production domain auto-assignment remains off. Do not create a deployment
   yet.
3. Merge the narrow activation pull request containing the observed App
   installation ID, GitHub repository ID, owner ID, and `status: active`, then
   rerun the focused identity tests. The Vercel raw-claim rule must contain the
   exact same values.
4. Set the repository Actions variable
   `HELP_MATH_CICD_IDENTITY_ACTIVATED=true`. Keep the GitHub environment free
   of that variable and of all secrets.
5. Connect only `HUDongpin/help-math-2-0-workbench` to `helpmath-web`, then let
   Vercel build the first exact protected `main` SHA without assigning custom
   domains. Approve the `helpmath-production` GitHub environment and retain the
   resulting status-context and candidate-smoke evidence.
6. Complete the fail-closed aliasing/check transaction in Vercel administrator
   step 8, then confirm the exact check is required for Production.
7. Trigger a new Git-connected Production deployment from the still-current
   protected `main` SHA. Approve the `helpmath-production` GitHub environment
   for that deployment only after its project, branch, SHA, deployment ID, and
   generated URL match the dispatch receipt.
8. Inspect the privacy-safe candidate receipt. It must report all 25 routes
   passing, exact project/deployment/SHA identity, protected `noindex`, and no
   credential, response body, private path, strict, or publication claim.
9. Let Vercel perform automatic aliasing only after the required check for the
   second deployment passes; no workflow token performs the promotion.
10. Require the `vercel.deployment.promoted` postflight to pass the same 25
    public routes, exact project/deployment-URL/SHA provenance on every route,
    and the exact apex `308` path/query-preserving redirect. Missing, stale, or
    mixed provenance is a failure even when every page marker is otherwise
    correct.
11. Retain the GitHub environment review, Vercel installation/configuration
    IDs, deployment ID, main SHA, workflow run IDs, candidate/postflight
    artifacts, prior deployment ID, and rollback decision in the restricted
    launch record.

## Failure and rollback behavior

- No activation variable: the workflows skip and no promotion status exists.
- Prepared policy, absent/wrong installation ID, immutable repository/owner ID,
  `workflow_ref`, or non-Vercel sender: the workflow fails before requesting or
  forwarding an OIDC token.
- Wrong project, environment, branch, SHA, state, ID, or URL: no status is
  posted, so promotion remains blocked.
- Environment review withheld: the candidate remains unpromoted.
- OIDC or Trusted Sources failure: the pending status never becomes success.
- Smoke failure: the final status is failure and Vercel cannot alias.
- Postflight failure: stop further releases and use the recorded Vercel
  rollback point or a reviewed revert through protected `main`.
- Disablement: unset the activation variable, disable automatic aliasing, and
  disconnect the single Git installation if necessary. Do not delete receipts
  or the prior deployment.

## Evidence boundary

This package establishes CI/CD identity and site-deployment gates only. It does
not create the externally anchored production trust adapter required by
`skills/flash-to-js/references/lesson-release.md`, does not sign or issue an
`EvidenceReceiptV1`, and does not convert Current-JS routes into strict Flash
fidelity, audio, human, Owner, or formal lesson-publication acceptance.

At preparation time the objective remains **0/6 fully closed gates**: the
package is concrete local progress, but identity installation, current remote
source proof, Git-connected deployment, domain cutover, product acceptance, and
formal publication are all still incomplete until provider activation and
postflight evidence exist.
