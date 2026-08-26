# HELP Math Learning Platform Deployment

This runbook deploys the HELP Math 2.0 workbench application to the existing
Vercel project `helpmath-web`. The public canonical origin is
`https://www.helpmath.ai`; `https://helpmath.ai` permanently redirects to it.
Namecheap remains the authoritative DNS provider so existing mail records can
be preserved.

The former Vercel Git connection to `HUDongpin/helpmath-web` was disconnected
before the learning-platform cutover. Do not reconnect any repository until its
protected `main` is the exact accepted release source. Until then, releases use
the staged CLI flow below: upload a production-target candidate with
`--skip-domain`, test it, then promote that exact deployment.

## 1. GitHub release controls

1. Keep `HUDongpin/help-math-2-0-workbench` **Private**. Keep original HELP Math sources, private archives, API-key documents, local `.env` files, migration evidence, and review captures outside the deployment upload.
2. In repository settings, protect `main`: require a pull request, at least one approval, dismissal of stale approvals, resolved review conversations, and passing `Workbench` and `Site workspace` checks from `.github/workflows/ci.yml`.
3. Restrict direct pushes and force pushes to `main`. Require signed commits if that matches the owner's existing GitHub policy.
4. Keep Actions permissions read-only by default. The CI workflow needs no deployment token and explicitly avoids Git LFS downloads.

The two CI jobs install from the root lockfile with Node 24. `Workbench` runs `npm run verify:workbench` and `npm test`; `Site workspace` runs lint, type-check, tests, and build for `@helpmath/web`.

## 2. Existing Vercel project configuration

Use the existing project `helpmath-web` (`prj_q3v5Ue0zCL1T9rzTFD21KpNc5tzu`)
and record the deployment ID, source-closure hash, environment-variable names,
and previous production deployment in the launch receipt.

Use these project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root Directory | Repository root (`.`) |
| Git connection | Disconnected during controlled CLI release |
| Node.js | 24.x |
| Install Command | `npm install`/Vercel default using the root lockfile |
| Build Command | Root `npm run build` |
| Output Directory | `apps/web/.next` from root `vercel.json` |

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

Configure values separately for Production and Preview. Never copy `.env`
files or secrets into Git or pass secrets as command-line arguments. Secret
values must enter Vercel through non-echoing stdin or the Sensitive-variable UI.

| Variable | Production | Preview / Development |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.helpmath.ai` | Canonical production URL unless a feature explicitly needs its Preview origin |
| `CONTACT_FORM_ENABLED` | Exact `true` only after separate owner/legal and credential authorization; otherwise unset or `false` | Exact `true` only for an authorized end-to-end delivery test |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Production widget key restricted to HELP Math hostnames | Cloudflare test key or a separate non-production widget |
| `TURNSTILE_SECRET_KEY` | Matching production secret | Matching test/non-production secret |
| `RESEND_API_KEY` | Production key with minimum required access | Separate restricted test key where available |
| `SUPPORT_TO_EMAIL` | `support@helpmath.ai` | A controlled test mailbox; never the live student-support queue |
| `SUPPORT_FROM_EMAIL` | `HELP Math <support@helpmath.ai>` after sender verification | Verified non-production sender |

The learning-platform release also requires:

| Variable | Required value / boundary |
| --- | --- |
| `CURRENT_JS_SHOWCASE_G4_L3_ENABLED` | Exact `true`; opens only Grade 4 Lesson 3 and does not change strict ledgers |
| `MODERN_WIDE_SHELL_ENABLED` | Exact `true` for the Session-derived learning surface |
| `NOVA_TUTOR_ENABLED` | Exact `true`; missing/false fails closed before provider delivery |
| `OPENROUTER_API_KEY` | Sensitive server-only OpenRouter key; never share it with a browser bundle |
| `OPENROUTER_BASE_URL` | Exact `https://openrouter.ai/api/v1`; the server also permits the reviewed enterprise EU gateway |
| `OPENROUTER_HTTP_REFERER` | Leave empty unless public OpenRouter app attribution is deliberately approved; origin only, with no learner identifier or path |
| `OPENROUTER_APP_TITLE` | Leave empty unless app attribution is deliberately approved; no learner, class, or school identifier |
| `NOVA_MODEL` | Exact allowlisted `openai/gpt-5.6-luna`; no automatic model selection or application-level model fallback |
| `NOVA_TIMEOUT_MS` | `45000` for text and bounded frame requests |
| `NOVA_MAX_OUTPUT_TOKENS` | `700` |
| `NOVA_ALLOW_FRAME_CONTEXT` | Keep `false` until the separate image-transfer privacy, vendor, and legal gate is approved |
| `LRS_ENABLED` | Exact `true` |
| `LRS_ENDPOINT` | Sensitive HTTPS Learning Locker xAPI endpoint |
| `LRS_USERNAME` / `LRS_PASSWORD` | Sensitive server-only Basic credentials |
| `LRS_XAPI_VERSION` | Exact `1.0.3` |
| `LRS_ACTOR_HMAC_SECRET` | Independent Sensitive secret, at least 32 bytes |
| `LRS_REQUEST_TIMEOUT_MS` | `7000` |

Keep `HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC`, `MIGRATION_STATUS_ENABLED`, and
`REVIEWER_INSTRUMENTATION_ENABLED` unset in public production. No OpenRouter or LRS
secret may use a `NEXT_PUBLIC_` prefix.

Nova's current server request requires an OpenRouter Zero Data Retention
endpoint, denies provider data collection, and requires support for every sent
parameter. Keep account-level prompt/completion logging and data-discount
sharing disabled as a separate operational check. These settings minimize
provider retention; they do not by themselves establish COPPA, FERPA, school-
contract, parental-consent, special-education-record, or release approval.

Treat local `.next/` and Turbopack development caches as secret-bearing derived
data whenever a live server-only key is loaded. They are already excluded from
Git and deployment, but must also be excluded from archives and handoffs. After
a live credential test, remove `.next/dev/cache` and run an exact-key scan over
tracked/untracked candidate files plus the remaining build output. Cache
deletion is hygiene, not key rotation; rotate the provider key if any cache was
published or shared outside the controlled workstation.

GPT-5.6 Luna accepts text, image, and file input and returns text. It is not an
image-generation model. Any behavior-to-image feature requires a separate,
disabled-by-default route, image-output model, credential/budget, data contract,
moderation policy, consent/retention decision, and owner/legal release gate.

Changing a Vercel variable affects only new deployments, so redeploy after every environment change. Vercel documents the environment scopes and behavior in [Environment variables](https://vercel.com/docs/environment-variables).

The contact API remains disabled unless `CONTACT_FORM_ENABLED` is exactly
`true` and all five Turnstile, Resend, and support-address variables above are
non-empty. Missing, false, differently cased, or whitespace-padded values fail
closed before request-body parsing or any provider request. Do not enable the
flag merely because a credential exists.

Before enabling Resend, inventory existing mail DNS. Add only the exact verification records supplied for the selected sending identity. Never replace the current apex MX, SPF, DKIM, DMARC, or mailbox-provider verification records. If a record conflicts, stop and coordinate with the mail administrator instead of merging or deleting it.

## 4. Staged preview and production release

Before every upload, run `npx vercel deploy --dry --json` and fail if the file
list contains `All API Keys.docx`, any `.env.local`, `source-assets/`,
`private-archive/`, `migrations/`, or local worktrees/evidence. Verify the local
production build and the exact source closure, then create a protected Preview
or a production-target candidate without assigning domains.

Run the launch acceptance suite against the candidate URL:

- English and Spanish navigation, locale persistence, metadata, canonical and alternate-language links.
- When Contact remains paused, both locale routes show the explicit
  non-submitting status, render no form/input/textarea/Turnstile control, and
  direct API POST fails with `CONTACT_DISABLED` before body parsing or provider
  delivery. Only when a separate owner/legal/credential authorization enables
  Contact may the launch suite exercise validation, Turnstile failure/success
  paths, delivery to a controlled test mailbox, and absence of student data
  storage.
- Grade 4 Lesson 3 has the exact 39-page order, functional shell, resume state,
  Replay, keyboard use, reduced motion, responsive layout, and no public
  FLA/SWF/Ruffle request.
- Nova performs real exact-model text, quick-prompt, Words, Spanish-interface,
  assessment-safe, voice-transcript, and bounded current-frame flows; disabled,
  timeout, rejection, and permission-denied states fail visibly.
- Learning events write through the same-origin API to Learning Locker, use a
  pseudonymous Actor whose `account.name` is an opaque identifier and which has
  no human display name or `mbox`, survive the bounded offline outbox, and can
  be read back by their exact xAPI statement UUID.
- No serious axe findings, console errors, mixed content, broken internal links, or unexpected network destinations.
- Preview responses remain non-indexable and the protected URL is not publicly accessible without authorized Vercel access.

Create the candidate with:

```bash
npx vercel deploy --prod --skip-domain --yes
```

After candidate acceptance, promote only that exact URL or deployment ID:

```bash
npx vercel promote <deployment-id-or-url> --yes
```

This is Vercel's documented [staged production deployment](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment) flow.

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
- If Contact is intentionally paused, the EN/ES status pages contain no
  submission controls and `/api/contact` remains fail-closed before provider
  delivery. If Contact was separately authorized and enabled for this exact
  release, mail reaches the approved support mailbox; Reply-To is the
  submitter, while From remains the verified HELP Math sender.
- MX and mail-authentication answers match the pre-cutover inventory and a real inbound/outbound mailbox test succeeds.
- Vercel Runtime Logs show no new application errors, unexpected outbound endpoints, or secrets/PII.

Because there is currently no confirmed administrative control of `helpprogram.net`, this release is a new-domain launch, not a completed SEO domain migration. Keep the old-to-new URL map ready, but do not claim migration parity until the old host serves verified page-level permanent redirects.

## 7. Rollback

Before cutover, identify the last known-good production deployment and retain the previous website DNS answers.

- Application failure after promotion: use Vercel **Instant Rollback** to the recorded deployment, then repeat the production smoke checks. A rollback also pauses automatic production-domain assignment until a later deployment is promoted; do not assume subsequent pushes are live.
- DNS/TLS failure: restore only the prior website A/AAAA/CNAME records from the launch log. Do not roll back or edit mail records.
- Contact delivery failure: disable or replace the public contact call-to-action with the documented support fallback in a reviewed deployment; never expose an unverified sender or silently discard requests.

Vercel Pro can roll back to eligible deployments that previously served a production domain; details and caveats are in [Instant Rollback](https://vercel.com/docs/instant-rollback). Record incident time, release SHA, deployment IDs, DNS changes, decision owner, and verification evidence.
