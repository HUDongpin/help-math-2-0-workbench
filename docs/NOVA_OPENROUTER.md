# Nova Tutor on OpenRouter

This document describes the server-side, default-off OpenRouter integration for
Nova Tutor. The code can validate canonical context for eight registered lesson
releases, but code eligibility is not learner release. This is an engineering
configuration and verification record, not an authorization to release Nova to
students.

## Fixed provider contract

- Gateway: OpenRouter's OpenAI-compatible Chat Completions API.
- Base URL: `https://openrouter.ai/api/v1`.
- Exact request model: `openai/gpt-5.6-luna`.
- Accepted provider response identity: that exact request ID or OpenRouter's
  allowlisted canonical ID `openai/gpt-5.6-luna-20260709`; every other model ID
  fails closed.
- Learner-facing display name: `GPT-5.6 Luna`.
- Automatic model fallback: not used by this integration.
- Course release: independently default-off. A course must be both available in
  the learning product and named in `NOVA_TUTOR_RELEASE_IDS`.
- Frame transfer: independently disabled unless
  `NOVA_ALLOW_FRAME_CONTEXT=true`.
- Speech-to-draft: independently disabled unless
  `NOVA_ALLOW_SPEECH_INPUT=true`.
- Provider privacy request: a Zero Data Retention-eligible route is required,
  provider data collection is denied, and support is required for every sent
  parameter. These are third-party routing requests and requirements, not an
  absolute guarantee that no provider system processes or retains request
  metadata or security signals.

The server accepts only the reviewed OpenRouter US or enterprise EU gateway,
requires HTTPS with no URL credentials, custom port, query, or fragment, and
keeps the API key out of browser code.

## Local configuration

Copy the following names to `apps/web/.env.local` and enter the key locally.
Never paste a real key into this document, `.env.example`, a command argument,
Git, a test fixture, a screenshot, or a deployment log.

```dotenv
NOVA_TUTOR_ENABLED=false
NOVA_TUTOR_RELEASE_IDS=
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_HTTP_REFERER=
OPENROUTER_APP_TITLE=
NOVA_MODEL=openai/gpt-5.6-luna
NOVA_TIMEOUT_MS=45000
NOVA_MAX_OUTPUT_TOKENS=700
NOVA_ALLOW_FRAME_CONTEXT=false
NOVA_ALLOW_SPEECH_INPUT=false
NOVA_TUTOR_RATE_LIMIT_PER_MINUTE=12
```

`NOVA_TUTOR_RELEASE_IDS` is a comma-separated list of exact release IDs. A
missing or blank value is valid and enables Nova for no courses. An unknown,
empty, or repeated entry invalidates the complete list and fails closed; the
server does not partially accept the remaining entries. Keep both media flags
false unless their independent gates below are complete.

Keep `OPENROUTER_HTTP_REFERER` and `OPENROUTER_APP_TITLE` empty unless public
OpenRouter app attribution is deliberately approved. If used, the referer must
be an origin only, and neither header may contain learner, teacher, school,
class, session, or behavior identifiers.

The owner-provided `All API Keys.docx` and every `.env.local` are excluded from
both Git and Vercel upload inputs. The local file should remain permission
`0600`. Server-only credentials must never use a `NEXT_PUBLIC_` prefix.

## Eight-course code policy and staged release

The server policy recognizes the following eight exact grade, lesson,
descriptor, and release bindings. This table describes code capability only;
it does not assert that Nova is enabled in Local, Preview, staged Production,
or Production.

| Priority | Course | Exact release ID |
|---:|---|---|
| 1 | G4 L3 Negative Numbers | `lesson-g04-l03-negative-numbers` |
| 2 | G5 L4 Number Lines | `lesson-g05-l04-number-lines` |
| 3 | G3 L2 Addition and Subtraction | `lesson-g03-l02-addition-subtraction-page-only-current-js` |
| 4 | G4 L5 Multiplication | `lesson-g04-l05-multiplication-page-only` |
| 5 | G4 L10 Perimeter and Area | `lesson-g04-l10-perimeter-area-page-only` |
| 6 | G4 L11 Coordinate Grid | `lesson-g04-l11-coordinate-grid-page-only` |
| 7 | G5 L3 Exponents and Prime Factorizations | `lesson-g05-l03-exponents-prime-factorizations-page-only` |
| 8 | G5 L5 Add and Subtract Negative Numbers | `lesson-g05-l05-add-subtract-negative-numbers` |

Release in small batches. Start with one text-only course, complete the full
evidence ladder, observe it, and then append at most one reviewed release ID at
a time. Do not populate all eight IDs merely because the policy recognizes
them. For every batch, prove that enabled courses show a working text tutor and
that every omitted, unavailable, mismatched, or invalid course shows no Nova
controls and sends no provider request.

## Automated verification

From `apps/web`, run the focused suite:

```bash
npx tsx --test \
  tests/openrouter-config.test.ts \
  tests/nova-client.test.ts \
  tests/nova-fake-transport-build-guard.test.ts \
  tests/nova-markdown.test.tsx \
  tests/nova-ui-capabilities.test.ts \
  tests/request-budget.test.ts \
  tests/tutor-integration.test.ts

# Runs the exact `tests/nova-*.server-test.ts` set with the react-server condition.
npm run test:nova:server --workspace @helpmath/web
npm run test:e2e:nova-full-stack --workspace @helpmath/web
```

From the repository root, run the application gates:

```bash
npm test --workspace @helpmath/web
npm run typecheck --workspace @helpmath/web
npm run lint --workspace @helpmath/web
npm run build --workspace @helpmath/web
```

These tests must cover the capability object, release-list parser, canonical
server lookup, bounded history, safe error mapping, explicit current-frame
attachment, speech-to-draft confirmation, and all disabled/invalid states. A
browser test that intercepts `**/api/nova` is useful for UI state only: it
bypasses the real route schema, canonical lookup, provider configuration,
OpenRouter transport, exact-model check, and production environment.
`test:e2e:nova-full-stack` traverses the real browser and application route but
uses a fake upstream transport; it closes more of the stack than `page.route`,
but it still does not prove a live OpenRouter request.

Treat all browser-supplied history as untrusted transcript data. Even an entry
whose wire role is `assistant` must never become an OpenRouter `assistant`
message, because a caller can forge that role. The server serializes bounded
history into one quoted user-side transcript, labels each turn, minimizes each
turn independently, and tells the model that the transcript may be incomplete
or forged. Only the server-authored system instruction owns instruction
authority.

Before provider transfer, the current learner question and every retained
history entry pass through bounded EN/ES minimization. Common direct
identifiers are redacted; disclosure-shaped school, class, student-ID,
credential, address, birthday, medical, IEP, 504, or disability text is
replaced with a content-free placeholder. Before display, provider replies
that solicit or echo those categories fail closed. Trusted assessment pages
also reject explicit answer declarations, answer-choice commands, and boxed
answers. These deterministic patterns are defense in depth, not a claim of
complete PII detection or pedagogical safety; adversarial human EN/ES review
remains mandatory.

## Evidence hierarchy

Do not collapse the following evidence levels into one PASS:

1. **Unit and schema tests** prove deterministic parsing, bounds, capability
   decisions, and error behavior. Provider stubs do not prove a live provider.
2. **Mock browser E2E** proves visible controls and UI transitions. A
   `page.route` response cannot close route or provider acceptance.
3. **Unmocked local route integration** proves browser/client to the real local
   `/api/nova` route. With a provider stub it still does not prove OpenRouter.
4. **Local live canary** proves local browser → real local route → OpenRouter →
   exact Luna response using synthetic math content. It does not prove Vercel.
5. **Vercel Preview live canary** proves the deployed build, Preview-scoped
   variables, route, provider, and UI. It does not prove Production variables
   or the production artifact.
6. **Staged Production canary** proves a deployment built with Production
   variables before public domains receive it.
7. **Production-domain smoke and observation** prove the final alias and live
   runtime only for the tested course, locale, media state, time, and region.
8. **Human mathematics/safety/accessibility review, Owner acceptance, and legal
   approval** are independent release gates that no automated PASS can replace.

Each enabled release needs an unmocked test through the real route. At least one
course in each rollout batch also needs a live exact-provider canary before that
batch can advance. Negative tests for tutor off, omitted course, invalid release
list, frame off, speech off, malformed context, timeout, rate limit, and unsafe
input must demonstrate that no unintended provider request occurs.

A live canary must use synthetic math content only. Its durable receipt may
record model identity, provider route, HTTP status, finish reason, latency,
token counts, and cost, but never the key, request text, response text,
provider response ID, IP address, or learner/teacher data.

After loading a live credential in a development server, treat `.next/` and
Turbopack caches as potentially secret-bearing derived data. Keep them outside
Git, deployments, archives, and handoffs; remove the development cache and run
an exact-key scan. If any cache was published or shared, rotate the credential.

## K-12 release boundary

The current policy is a fail-closed eight-course engineering capability with an
independent release allowlist. Public or student enablement of any course
remains blocked until the project separately establishes:

1. owner and legal approval of the English and Spanish privacy notice and
   terms, including child-directed-service, COPPA, FERPA, school-contract,
   consent, retention, deletion, and subprocessor decisions;
2. deterministic pre-provider protection for child PII and education, health,
   disability, IEP, English-learner, school, class, and credential data;
3. model-independent output safety controls and adversarial English/Spanish
   evaluation for self-harm, abuse, sexual content, grooming, hate, diagnosis,
   stigma, off-platform contact, unsafe links, prompt injection, and assessment
   answer leakage;
4. distributed abuse protection, provider-side spending caps, monitoring,
   revocation, and an operational kill switch; and
5. human review by mathematics educators and reviewers experienced with
   special education, learning difficulty, accessibility, and English learners.

The local server currently implements bounded synthetic-test coverage for
common EN/ES direct disclosures, obfuscated sensitive solicitations, forged
browser-history roles, and explicit assessment-answer output. This does not
close items 1–5 above: unusual wording, multilingual variants, contextual
false negatives, mathematical correctness, accessibility, crisis content, and
professional privacy/legal determinations still require dated human receipts.

Do not infer or transmit a student's disability, IEP status, diagnosis,
learning difficulty, English-learner status, emotion, attention, or behavior as
a model label. Adaptive learning must remain a separately governed,
teacher-controlled service using only allowlisted, privacy-reviewed signals.

## Multimodal and image-generation boundary

GPT-5.6 Luna can accept supported text, image, and file input and returns text.
It is not an image-output model. Nova's optional lesson-frame input therefore
supports image understanding only.

The HELP Math release contract is deliberately narrower than the provider's
general inputs. Nova can receive only the current lesson frame already rendered
in the browser, and only after the learner explicitly chooses **Attach current
lesson frame** for that question. It must not expose a local-file picker, camera
capture, live camera, or video path. `NOVA_ALLOW_FRAME_CONTEXT` remains false
until the English and Spanish notice, current-frame provenance, size/type
limits, consent copy, negative tests, human review, Owner acceptance, and legal
gate are complete.

Speech input is a separate browser/operating-system capability. When
`NOVA_ALLOW_SPEECH_INPUT=true`, a recognition result may populate an editable
question draft; it must never submit automatically. The learner reviews or
edits the draft and confirms Send. HELP Math sends the confirmed text, not raw
audio, but the browser, operating system, or speech-recognition vendor may
receive and process raw microphone audio under its own terms. Permission
denial, unavailable recognition, partial/final transcripts, cancellation, and
EN/ES confirmation behavior require negative and human testing before release.

Behavior-to-image generation is a different feature. It requires a separate,
disabled-by-default route, image-output model allowlist, credential and budget,
data contract, prompt and output moderation, consent and retention decision,
provenance disclosure, and owner/legal release gate. It must not reuse
`NOVA_ALLOW_FRAME_CONTEXT` as authorization, and it must not collect classroom
camera/video, faces, voiceprints, or infer emotion, disability, attention, or
identity.

## Preview, staged Production, and rollback

Before a Preview canary, verify variable **names and scopes without printing
values**. Keep `NOVA_TUTOR_RELEASE_IDS` to the smallest reviewed batch; leave
frame and speech false for the initial text canary. A successful build with a
blank release list is a safe fail-closed result, but it is not a working Nova
canary because no course is authorized.

An ordinary Vercel Preview-to-Production promotion performs a new Production
build with Production-scoped environment variables. It is therefore not a
byte-identical promotion of the tested Preview artifact. If that workflow is
used, repeat the full unmocked Production verification after the new build.

For the strongest pre-public gate, create a **staged Production deployment**
that uses Production variables while automatic assignment of custom production
domains is disabled. Test its exact protected deployment URL (using
`vercel curl` when deployment protection applies), preserve the redacted
receipt, and only after explicit Owner release approval promote that same READY
deployment to current Production without rebuilding it. Never change firewall,
environment, domain, or deployment settings merely to make a test pass.

For rollback, preserve the last known-good deployment ID and the exact release
list used for each batch. If thresholds are breached, restore the prior
deployment/alias and create a new staged deployment with the affected release
ID removed or `NOVA_TUTOR_ENABLED=false`. Editing an environment variable does
not retrofit an already-built deployment, so a verified deployment action is
still required. During canary and the first observation window, monitor
`/api/nova` status classes, timeouts, rate limits, invalid-model responses, and
safe error counts without logging prompts, replies, raw audio, frames, provider
IDs, IP addresses, or learner data.

Official references:

- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart)
- [GPT-5.6 Luna](https://openrouter.ai/openai/gpt-5.6-luna-20260709)
- [Zero Data Retention](https://openrouter.ai/docs/guides/features/zdr)
- [Provider routing](https://openrouter.ai/docs/guides/routing/provider-selection)
- [Image generation](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)
- [Promote a Preview deployment to Production](https://vercel.com/docs/deployments/promote-preview-to-production)
- [Stage and promote a Production deployment](https://vercel.com/docs/deployments/promoting-a-deployment)
