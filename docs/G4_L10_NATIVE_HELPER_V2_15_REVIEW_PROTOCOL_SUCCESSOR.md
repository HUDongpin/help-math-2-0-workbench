# G4 L10 Native Helper v2.15 Independent-Review Protocol Successor

Status: active review-procedure successor authorized by the project owner on 2026-08-07. This document changes only how the frozen native-helper specification is independently reviewed. It does not amend, satisfy, or weaken any production-helper requirement in the frozen v2 through v2.14 contract lineage.

## 1. Frozen v2.14 history is closed, retained, and nonqualifying

V2.14 history status: STRICT_BUT_NONQUALIFYING_CLOSED

The exact historical target, six failed batch receipts, four activation receipts, and six chunk plans are frozen by `reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json`. Those seventeen artifacts remain evidence of a deliberately strict review process and of why each attempted batch did not qualify. They are not deleted, rewritten, relabeled as PASS, or treated as useless.

No new HMG4RB4 batch may be created.

No v2.14 activation receipt, failed receipt, task ID, output, chunk plan, command, or observation may be replayed as a qualifying v2.15 result. No additional artifact whose basename begins `g4-l10-native-helper-v2-14-` may be added. A missing, changed, or additional member fails the closed-history check.

The closed history has no implementation, runtime, V28-transition, acceptance, integration, release, or publication effect. It remains `STRICT_BUT_NONQUALIFYING_CLOSED` even if a later review qualifies.

## 2. Stable three-view review set

The successor keeps three independent, user-owned reviewer views:

1. `schema`: validate inherited grammar, HMG4GL4, HMG4AL3, all 42 HMG4PE1 paragraph preimages, HMG4FR3, cross-field consistency, and closed production authority.
2. `adversarial`: attack ownership, replay and mixed-input substitution, target/root spoofing, Base64/length/hash aliases, error disclosure, authentication claims, V28 preservation, clean-room isolation, and every path to implementation or runtime authority.
3. `whole`: read and assess the complete frozen contract lineage and successor protocol, repeat the structural and all-paragraph checks, confirm retained exclusions, and detect any authority expansion.

Each view remains independent: it must reach its own findings without reading or copying a sibling review conclusion. The reviewer task ID and scope must be included in its human conclusion. A task ID may be retained for later mechanical retries or a required scope refresh; the protocol does not require three replacement user-owned tasks merely because one task encountered an unrelated mechanical error.

There is no HMG4RB successor batch token. Consolidation compares the target, protocol, deterministic-verifier, and closed-history identities carried by each of the three outputs. All four identities must match across all three views.

## 3. Phase A: preflight is diagnostic and occurs before evidence

Preflight runs before a formal evidence unit begins. It tests:

- availability and executability of the eight required macOS-native tools;
- Node and verifier command syntax;
- deterministic extraction, LF, UTF-8, Base64, hash, receipt-serialization, and no-clobber primitives;
- syntax of the focused verifier test file; and
- current identities of the verifier, protocol, closed-history manifest, and v2.14 target.

The only qualifying preflight command is:

```text
node scripts/g4-l10-native-helper-v2_15-review-verifier.mjs preflight --output /tmp/<reviewer-unique>/preflight.json
```

The focused regression command is also pre-evidence:

```text
node --test scripts/g4-l10-native-helper-v2_15-review-verifier.test.mjs
```

A preflight failure has status `PREFLIGHT_RETRYABLE_NOT_EVIDENCE`. It must be disclosed and preserved, but it is not an evidence finding, does not invalidate a reviewer task, and may be corrected and rerun before the formal unit begins. No reviewer may describe a failed preflight as ready.

Formal evidence may begin only from a current `READY_FOR_FORMAL_EVIDENCE` receipt produced by the canonical tool set and the exact current verifier, protocol, history closure, and target.

## 4. Phase B: deterministic formal evidence

During formal evidence, reviewers do not compose long shell pipelines, dynamically choose extraction boundaries, reconstruct the contract with ad hoc commands, or treat terminal rendering as the authoritative byte transport. They invoke the already-preflighted deterministic verifier exactly once per attempt:

```text
node scripts/g4-l10-native-helper-v2_15-review-verifier.mjs evidence --scope schema --preflight-receipt /tmp/<reviewer-unique>/preflight.json --output /tmp/<reviewer-unique>/schema-evidence.json
node scripts/g4-l10-native-helper-v2_15-review-verifier.mjs evidence --scope adversarial --preflight-receipt /tmp/<reviewer-unique>/preflight.json --output /tmp/<reviewer-unique>/adversarial-evidence.json
node scripts/g4-l10-native-helper-v2_15-review-verifier.mjs evidence --scope whole --preflight-receipt /tmp/<reviewer-unique>/preflight.json --output /tmp/<reviewer-unique>/whole-evidence.json
```

The verifier uses Node filesystem descriptors and deterministic parsers. It verifies the original v2.14 target identity and type; the exact v2.14 closed-history allowlist; HMG4GL4 reconstruction; HMG4AL3 rows, edges, targets, hashes, and reverse coverage; all 42 canonical HMG4PE1 decodes, lengths, UTF-8 constraints, re-encodings, and paragraph hashes; HMG4FR3; ordered sections; V28 and missing-MP3 preservation; protocol markers; and the closed no-authority boundary. It writes only the explicitly named no-clobber receipt outside the workspace.

`VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW` means only that the deterministic inputs and structures passed. It is not a reviewer conclusion and is never a PASS by itself. Each reviewer must still assess its assigned scope and report every P0/P1/P2 finding or explicit zero.

## 5. Failure taxonomy and retry rules

Three states are intentionally distinct:

- `PREFLIGHT_RETRYABLE_NOT_EVIDENCE`: a diagnostic, tool-availability, syntax, or extraction self-test failed before evidence. Correct it and rerun preflight. No evidence unit has started.
- `MECHANICAL_ERROR_RETRYABLE_SAME_REVIEWER`: the prevalidated verifier could not complete because of an unrelated invocation, I/O, resource, output-collision, or internal mechanical error. Preserve and disclose the failed attempt, choose a new no-clobber output path or correct the mechanical cause, and rerun in the same reviewer task. Sibling reviews remain valid for their unchanged anchors.
- `EVIDENCE_INPUT_MISMATCH`: a target, protocol, verifier receipt, history member, grammar, hash, count, encoding, lineage, or authority assertion did not match. This is evidence, not a mechanical excuse. It remains a substantive blocked result or finding until the underlying input is explicitly superseded and re-reviewed.

A retry never erases an earlier attempt. The reviewer conclusion lists all attempts, their receipt IDs when available, their states, and which attempt supports the conclusion.

TARGET_OR_PROTOCOL_CHANGE_REQUIRES_SCOPE_REFRESH_NOT_NEW_TASKS

If the target or this protocol changes, all three scopes must refresh because their common reviewed object changed. The same three user-owned tasks may perform that refresh; three newly created tasks are not mechanically required. If only the verifier changes, preflight and deterministic evidence must be rerun for every affected scope, but the user-owned reviewer tasks may likewise remain.

An evidence mismatch, reviewer finding, loss of reviewer independence, or scope omission cannot be downgraded to a mechanical retry. A scope with a nonzero, omitted, ambiguous, or unevaluated priority is not zero.

## 6. Consolidation rule

A consolidator must obtain each original user-owned reviewer conclusion and its deterministic evidence receipt. It verifies:

- three distinct task IDs and exactly one conclusion for each ordered scope;
- matching target, protocol, verifier, history-closure, and successful-preflight identities;
- complete attempt disclosure and no sibling-output dependency before conclusion;
- explicit P0/P1/P2 values with every finding enumerated;
- `VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW` for the supporting attempt; and
- unchanged before/after target identity.

Only three complete independent `P0/P1/P2=0/0/0` conclusions with an empty combined finding union may be called `spec-review-qualified`.

spec-review-qualified has no implementation or runtime authority.

It also has no V28 transition, helper creation or test, original-runtime launch, acceptance, strict-completion, source-promotion, integration, release, or publication authority. Any later action requires its own current, explicit, user-authenticated authorization and every retained contract prerequisite.

## 7. Retained operational and product boundaries

Current unresolved V28 remains: operational freeze false; 57 writable files; 48 native members; nine non-Gate-A top-level runners; 553,897 bytes; checksum-set SHA-256 `cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200`; native-root mode `0755`. This protocol authorizes no V28 mutation or transition.

The sixteen Grade 4 missing MP3s remain unresolved. No source, lesson, renderer, audio, visual/RMSE, migration, original-runtime, human-review, owner-acceptance, strict-completion, whole-course, release, or publication state changes.

## 8. Closed authority

This protocol and its verifier are read-only specification-review infrastructure. They may read the allowlisted contract lineage and history and may create only explicit no-clobber receipts outside the workspace. They cannot edit a contract, implement or execute a helper, inspect or reuse retired implementation knowledge, mutate V28, install, apply, recover, launch the original runtime, accept, promote, integrate, release, or publish.
