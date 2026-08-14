# Nova Tutor on OpenRouter

This document describes the server-side, default-off OpenRouter integration for
Nova Tutor. It is an engineering configuration and verification record, not an
authorization to release Nova to students.

## Fixed provider contract

- Gateway: OpenRouter's OpenAI-compatible Chat Completions API.
- Base URL: `https://openrouter.ai/api/v1`.
- Request model: `openai/gpt-5.6-luna`.
- Learner-facing display name: `GPT-5.6 Luna`.
- Automatic model fallback: not used by this integration.
- Frame transfer: independently disabled unless
  `NOVA_ALLOW_FRAME_CONTEXT=true`.
- Provider privacy request: Zero Data Retention required, provider data
  collection denied, and support required for every sent parameter.

The server accepts only the reviewed OpenRouter US or enterprise EU gateway,
requires HTTPS with no URL credentials, custom port, query, or fragment, and
keeps the API key out of browser code.

## Local configuration

Copy the following names to `apps/web/.env.local` and enter the key locally.
Never paste a real key into this document, `.env.example`, a command argument,
Git, a test fixture, a screenshot, or a deployment log.

```dotenv
NOVA_TUTOR_ENABLED=false
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_HTTP_REFERER=
OPENROUTER_APP_TITLE=
NOVA_MODEL=openai/gpt-5.6-luna
NOVA_TIMEOUT_MS=45000
NOVA_MAX_OUTPUT_TOKENS=700
NOVA_ALLOW_FRAME_CONTEXT=false
NOVA_TUTOR_RATE_LIMIT_PER_MINUTE=12
```

Keep `OPENROUTER_HTTP_REFERER` and `OPENROUTER_APP_TITLE` empty unless public
OpenRouter app attribution is deliberately approved. If used, the referer must
be an origin only, and neither header may contain learner, teacher, school,
class, session, or behavior identifiers.

The owner-provided `All API Keys.docx` and every `.env.local` are excluded from
both Git and Vercel upload inputs. The local file should remain permission
`0600`. Server-only credentials must never use a `NEXT_PUBLIC_` prefix.

## Verification

From `apps/web`, run the focused suite:

```bash
npx tsx --test \
  tests/openrouter-config.test.ts \
  tests/nova-openrouter-route.test.ts \
  tests/nova-client.test.ts \
  tests/tutor-integration.test.ts
```

From the repository root, run the application gates:

```bash
npm test --workspace @helpmath/web
npm run typecheck --workspace @helpmath/web
npm run lint --workspace @helpmath/web
npm run build --workspace @helpmath/web
```

A live canary must use synthetic math content only. Its durable receipt may
record model identity, provider route, HTTP status, finish reason, latency,
token counts, and cost, but never the key, request text, response text,
provider response ID, IP address, or learner/teacher data.

After loading a live credential in a development server, treat `.next/` and
Turbopack caches as potentially secret-bearing derived data. Keep them outside
Git, deployments, archives, and handoffs; remove the development cache and run
an exact-key scan. If any cache was published or shared, rotate the credential.

## K-12 release boundary

The current route is a fail-closed Grade 4 Lesson 3 engineering pilot. Public
or student enablement remains blocked until the project separately establishes:

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

Do not infer or transmit a student's disability, IEP status, diagnosis,
learning difficulty, English-learner status, emotion, attention, or behavior as
a model label. Adaptive learning must remain a separately governed,
teacher-controlled service using only allowlisted, privacy-reviewed signals.

## Multimodal and image-generation boundary

GPT-5.6 Luna can accept supported text, image, and file input and returns text.
It is not an image-output model. Nova's optional lesson-frame input therefore
supports image understanding only.

Behavior-to-image generation is a different feature. It requires a separate,
disabled-by-default route, image-output model allowlist, credential and budget,
data contract, prompt and output moderation, consent and retention decision,
provenance disclosure, and owner/legal release gate. It must not reuse
`NOVA_ALLOW_FRAME_CONTEXT` as authorization, and it must not collect classroom
camera/video, faces, voiceprints, or infer emotion, disability, attention, or
identity.

Official references:

- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart)
- [GPT-5.6 Luna](https://openrouter.ai/openai/gpt-5.6-luna-20260709)
- [Zero Data Retention](https://openrouter.ai/docs/guides/features/zdr)
- [Provider routing](https://openrouter.ai/docs/guides/routing/provider-selection)
- [Image generation](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)
