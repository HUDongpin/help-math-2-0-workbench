# HELP Math Website Deployment

This runbook deploys the private `HUDongpin/helpmath-web` repository to a Vercel Pro team. The public canonical origin is `https://www.helpmath.ai`; `https://helpmath.ai` permanently redirects to it. Namecheap remains the authoritative DNS provider so existing mail records can be preserved.

No step in this runbook creates a GitHub repository, pushes a branch, changes DNS, or promotes production automatically. Those are explicit owner operations after the recorded checks pass.

## 1. GitHub release controls

1. Create `HUDongpin/helpmath-web` as **Private** and push only the reviewed website worktree. Keep `HELP MATH_ORIGINAL FILES` in the separate private archive described in [ARCHIVE.md](./ARCHIVE.md).
2. In repository settings, protect `main`: require a pull request, at least one approval, dismissal of stale approvals, resolved review conversations, and passing `Workbench` and `Site workspace` checks from `.github/workflows/ci.yml`.
3. Restrict direct pushes and force pushes to `main`. Require signed commits if that matches the owner's existing GitHub policy.
4. Keep Actions permissions read-only by default. The CI workflow needs no deployment token and explicitly avoids Git LFS downloads.

The two CI jobs install from the root lockfile with Node 24. `Workbench` runs `npm run verify:workbench` and `npm test`; `Site workspace` runs lint, type-check, tests, and build for `@helpmath/web`.

## 2. Import into Vercel Pro

In the correct Vercel Pro team, import the private GitHub repository and record the team, project ID, repository, production branch, and initial deployment URL in the launch log.

Use these project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root Directory | `apps/web` |
| Include source files outside Root Directory | Enabled; required for the root lockfile, `catalog/`, and `packages/demos/` |
| Production Branch | `main` |
| Node.js | 24.x |
| Install Command | `npm ci` using the repository-root `package-lock.json` |
| Build Command | `npm run build` in `apps/web` |
| Output Directory | Next.js default; do not override |

The public application is an npm-workspace consumer of the generated dynamic
registry in `packages/demos/` and the reviewed publication ledger/catalog in
`catalog/`. Vercel therefore must include source files outside `apps/web`; the
root `.vercelignore` still excludes the legacy source archive, migrations,
full-frame evidence, Ruffle, and workbench-only files. Do not add a second
application lockfile or copy live migrations into the web app. Promote an
animation by completing its evidence package, rebuilding the fail-closed
completion ledger/registry, and rerunning the full CI suite. See Vercel's
[monorepo guide](https://vercel.com/docs/monorepos) and
[shared-package FAQ](https://vercel.com/docs/monorepos/monorepo-faq).

For a private repository owned by a GitHub organization, each commit author whose commit triggers a deployment must also be a member of the Vercel Pro team and have the GitHub identity connected to Vercel. Vercel documents this restriction in [Deploying private Git repositories](https://vercel.com/docs/git#deploying-private-git-repositories).

Enable **Standard Protection** with Vercel Authentication. It protects Preview deployments and generated deployment URLs while leaving the current production custom domain public. Password protection is not assumed because it requires an additional Pro add-on under Vercel's current policy. See [Deployment Protection](https://vercel.com/docs/deployment-protection).

## 3. Environment variables

Configure values in Vercel Project Settings, scoped separately to Production, Preview, and Development. Never copy `.env` files or secrets into Git.

| Variable | Production | Preview / Development |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.helpmath.ai` | Canonical production URL unless a feature explicitly needs its Preview origin |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Production widget key restricted to HELP Math hostnames | Cloudflare test key or a separate non-production widget |
| `TURNSTILE_SECRET_KEY` | Matching production secret | Matching test/non-production secret |
| `RESEND_API_KEY` | Production key with minimum required access | Separate restricted test key where available |
| `SUPPORT_TO_EMAIL` | `support@helpmath.ai` | A controlled test mailbox; never the live student-support queue |
| `SUPPORT_FROM_EMAIL` | `HELP Math <support@helpmath.ai>` after sender verification | Verified non-production sender |

Changing a Vercel variable affects only new deployments, so redeploy after every environment change. Vercel documents the environment scopes and behavior in [Environment variables](https://vercel.com/docs/environment-variables).

Before enabling Resend, inventory existing mail DNS. Add only the exact verification records supplied for the selected sending identity. Never replace the current apex MX, SPF, DKIM, DMARC, or mailbox-provider verification records. If a record conflicts, stop and coordinate with the mail administrator instead of merging or deleting it.

## 4. Preview and production release

Every pull request must receive a protected Vercel Preview. Verify the exact commit SHA, then run the launch acceptance suite against that URL:

- English and Spanish navigation, locale persistence, metadata, canonical and alternate-language links.
- Contact validation, Turnstile failure/success paths, delivery to the environment's test mailbox, and absence of student data storage.
- Approved demos, deterministic frame mode, Replay, keyboard use, reduced motion, responsive layouts, and no FLA/SWF/Ruffle requests.
- No serious axe findings, console errors, mixed content, broken internal links, or unexpected network destinations.
- Preview responses remain non-indexable and the protected URL is not publicly accessible without authorized Vercel access.

For the initial controlled-release period, keep `main` as the Production Branch but disable **Production → Branch Tracking → Auto-assign Custom Production Domains**. A merge then creates a staged production deployment with Production environment variables without moving `www.helpmath.ai`. After acceptance, select that exact deployment and **Promote** it. This is Vercel's documented [staged production deployment](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment) flow.

When the owner decides automatic releases are mature, re-enable domain auto-assignment. Do not change that policy silently; record the date and approver in the launch log.

## 5. Namecheap DNS cutover

Do not change nameservers. At least 48 hours before cutover, export or screenshot the entire Namecheap Advanced DNS zone and record current answers:

```bash
dig +short A helpmath.ai
dig +short CNAME www.helpmath.ai
dig +short MX helpmath.ai
dig +short TXT helpmath.ai
dig +short TXT _dmarc.helpmath.ai
```

Lower the TTL only for the website records that will change. Do not alter MX or mail-related TXT/CNAME records.

1. Add both `www.helpmath.ai` and `helpmath.ai` to the Vercel project.
2. Make `www.helpmath.ai` primary and configure the apex domain to permanently redirect to `www` in Vercel Domains settings.
3. In Namecheap, set `www` to the exact CNAME target shown by this Vercel project. Set the apex `@` A record to the exact value Vercel shows. Do not copy addresses from an old runbook because Vercel can provide project-specific values.
4. Remove only conflicting old website A/AAAA/CNAME records after they have been captured in the rollback log. Leave MX, SPF, DKIM, DMARC, CAA, and ownership-verification records intact unless their responsible provider explicitly instructs otherwise.
5. Wait for Vercel to report valid configuration and issue TLS before declaring cutover complete.

Vercel recommends `www` as the primary domain with an apex redirect because a subdomain can use CNAME routing; see [Deploying and redirecting domains](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting). Namecheap's mail-authentication record format is documented in [TXT/SPF/DKIM/DMARC records](https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain/).

## 6. Post-cutover checks

Run these checks from at least two networks after DNS propagation:

```bash
curl -sS -I https://www.helpmath.ai/
curl -sS -I https://helpmath.ai/
curl -sS -I https://www.helpmath.ai/ruffle
curl -sS -I https://www.helpmath.ai/flash/example.swf
```

Acceptance requires:

- `www` returns `200` with a valid certificate and the expected release identifier.
- Apex returns a permanent `301` or `308` whose `Location` uses `https://www.helpmath.ai/` and preserves the path/query.
- Archive/Ruffle/SWF probes return `404`; inspect the deployment's Source view as an additional check.
- Contact mail reaches `support@helpmath.ai`; Reply-To is the submitter, while From remains the verified HELP Math sender.
- MX and mail-authentication answers match the pre-cutover inventory and a real inbound/outbound mailbox test succeeds.
- Vercel Runtime Logs show no new application errors, unexpected outbound endpoints, or secrets/PII.

Because there is currently no confirmed administrative control of `helpprogram.net`, this release is a new-domain launch, not a completed SEO domain migration. Keep the old-to-new URL map ready, but do not claim migration parity until the old host serves verified page-level permanent redirects.

## 7. Rollback

Before cutover, identify the last known-good production deployment and retain the previous website DNS answers.

- Application failure after promotion: use Vercel **Instant Rollback** to the recorded deployment, then repeat the production smoke checks. A rollback also pauses automatic production-domain assignment until a later deployment is promoted; do not assume subsequent pushes are live.
- DNS/TLS failure: restore only the prior website A/AAAA/CNAME records from the launch log. Do not roll back or edit mail records.
- Contact delivery failure: disable or replace the public contact call-to-action with the documented support fallback in a reviewed deployment; never expose an unverified sender or silently discard requests.

Vercel Pro can roll back to eligible deployments that previously served a production domain; details and caveats are in [Instant Rollback](https://vercel.com/docs/instant-rollback). Record incident time, release SHA, deployment IDs, DNS changes, decision owner, and verification evidence.
