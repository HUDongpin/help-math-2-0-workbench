# Family Portal external readiness audit — 2026-08-24

Status: **BLOCKED_EXTERNAL_ENVIRONMENT_AND_AUTHORITY**

This is a read-only, secret-redacted observation of the local environment for
the isolated `codex/parent-portal` worktree. It is not a provider receipt,
deployment record, account inventory, permission grant or evidence that a
credential does not exist anywhere outside the inspected process/files.

## Inspected boundary

The audit checked, without printing values:

- non-empty variable-name presence in the current process environment;
- the three common environment files discoverable in the isolated worktree and
  nearby checkout boundary;
- Vercel link-file presence and metadata only, without printing organization,
  project ID or project name;
- local command availability for Vercel, Supabase and Resend;
- common provider access-token variable presence;
- common local real-release receipt/trust-root candidate paths;
- current Git branch, commit and clean/dirty state.

It did not contact a provider, install/download a CLI, enumerate an account,
read a remote project, send email, mutate DNS, deploy, migrate a hosted
database, or inspect any real family record.

## Observed result

| Check | Redacted result |
|---|---|
| Isolated worktree branch | `codex/parent-portal` |
| Current predecessor commit | `60f356be9b34cabd3ca1aad15b6dd00babfc7e35` |
| Clean release artifact | No; `2,948` porcelain status entries were present |
| Vercel link in isolated worktree | No |
| Vercel link elsewhere | One link in another checkout, modified `2026-08-07T03:02:56.190Z`; it is not inherited as current evidence |
| Vercel CLI | Not installed (`command -v` exit `1`) |
| Supabase CLI | Not installed (`command -v` exit `1`) |
| Resend CLI | Not installed (`command -v` exit `1`) |
| Vercel access token | Not present in inspected process environment |
| Supabase access token | Not present in inspected process environment |
| Resend API key | Not present in inspected process/environment-file boundary |
| GitHub token | Not present in inspected process environment |
| Local real-family release receipt candidate | None found in the bounded candidate paths |
| External release trust roots | None supplied |

Of the production runtime names checked, only `NEXT_PUBLIC_SITE_URL` had a
non-empty value in the inspected boundary. These were absent:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FAMILY_SUPABASE_AUTH_ISSUER`
- `FAMILY_INVITATION_ISSUER_JWT`
- `FAMILY_WEBHOOK_WRITER_JWT`
- `FAMILY_OUTBOX_ENCRYPTION_KEYRING`
- `FAMILY_EMAIL_DIGEST_KEY`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `CRON_SECRET`
- `FAMILY_REAL_RELEASE_TRUST_ROOTS_SHA256`

The existing production-configuration command therefore remains correctly
`CONFIGURATION_NOT_READY`, and the final receipt command remains correctly
`REAL_FAMILY_RELEASE_RECEIPT_INVALID`.

## Consequence

No trustworthy hosted preflight is possible from this worktree. The unrelated
checkout's dated Vercel link cannot establish the current project, deployment,
environment, account session or authorization. Installing a CLI without an
approved target and credential would not close that gap. Reusing historical or
unknown credentials would violate the identity, privacy and change-control
boundary.

The following actions remain unauthorized and were not attempted:

- creating or linking a Vercel/Supabase/Resend project;
- installing provider CLIs or logging into an account;
- applying migrations to a hosted database;
- configuring DNS, domains, callbacks, cron, webhook or email delivery;
- creating a real tenant, guardian, learner, relationship or message;
- generating reviewer trust roots or signing an approval;
- committing, pushing, deploying or promoting the current dirty worktree.

## Minimum resumption packet

An authorized operator must provide, through the approved secret/evidence
channels rather than chat or Git:

1. Exact staging/production Vercel project and organization authority.
2. Exact hosted Supabase project ref, region, issuer/audience and authorized
   migration/backup/restore operators.
3. Exact verified Resend domain, From address, webhook, permitted test cohort
   and provider/DPA disposition.
4. Approved secret-store references for all production variables; never their
   plaintext in a report.
5. Edge/WAF provider and approved anonymous/distributed abuse-control policy.
6. A clean reviewed Git commit/build/deployment identity.
7. Restricted evidence root, externally controlled Ed25519 trust roots and the
   independently injected trust-root SHA-256.
8. The actual `FP-R00`–`FP-R14` evidence and signatures, including Owner,
   qualified Legal, District, independent Security and independent
   Accessibility decisions.

After that packet exists, rerun the production-configuration preflight, then
the authorized hosted staging drills, and only after all evidence is final run
the [real-family release receipt verifier](./real-family-release-receipt.md).

Family readiness remains independent from every Flash source, Current-JS,
My Lesson, original-runtime/fidelity, audio, migration-human/Owner, strict
completion, Lesson-release and publication gate.
