# Audio And Review Acceptance

Use this reference after structural audits are stable and before asking anyone to sign evidence.

## Audio Is An Independent Gate

- Record every source cue in `audio-inventory.csv` with its hash, language, duration, start semantics, frame domain, host dependency, stop/complete behavior, and Replay behavior.
- Use machine audio audits for structure, extraction, and consistency. They do not prove that a person heard the correct content in the correct original-runtime state.
- For required audio, create the project acceptance template with `npm run scaffold:audio-acceptance -- --id <animation-id>` only after the inventory and machine audit are current.
- Bind each accepted cue to a natural, authorized original-runtime listening session, runtime/toolchain identity, source/host hashes, ordered operation-event hash chain, lossless capture or runtime log, and the actual named reviewer.
- Do not substitute synthesized audio, silence, Ruffle playback, current-JS playback, waveform inspection, or file existence for original-runtime listening acceptance.
- When `audio.required` is false, retain source-bound machine negative evidence and an accepted-not-required reason. Do not infer absence from silence.

The system of record is `evidence/audio-listening-acceptance.json`; machine audit files are inputs, not signatures. Do not overwrite an existing signed or rejected record.

## Human Visual Review Is Immutable

The named human visual reviewer must inspect the complete hash-bound visual review input, including all requirement manifests, contact sheets, every frame diff and outlier, and all language-specific visual states. Keep audio listening, behavior, and product/accessibility evidence as separately bound gates for owner review.

- Store a new append-only record under `evidence/reviews/human/`.
- Include reviewer identity, actual review time, exact scope, evidence descriptors, decision, findings, and `previousRecord` when superseding an earlier decision.
- Mirror the decision, reviewer, reviewed time, exact scope `all-keyframe-and-full-frame-diffs`, and exact `{path, bytes, sha256}` descriptor into `migration.json`; every value must match the immutable record.
- Reject a wrong formula, number, label, score, layer, branch, or event frame even when aggregate RMSE passes.

Codex, scripts, CI, checkboxes, generated timestamps, engineering prereview, and current-JS approval are not human visual review.

## Owner Review Is A Separate Decision

After technical evidence and human review are current, the owner or authorized representative reviews the exact packet, known exceptions, audio, behavior, product, and prior human record.

- Store a new append-only record under `evidence/reviews/owner/`.
- Bind it to the exact human/audio/behavior/product/exception descriptors and preserve `previousRecord` history.
- Mirror the decision, reviewer, reviewed time, reason, and exact record descriptor into `migration.json`; every value must match the immutable record.
- Do not use owner acceptance to override missing frames, missing natural traces, incorrect instructional content, absent audio, or a failed validator.

Automation must never invent identities, sign, backdate, fill a future time, rewrite a rejected decision as accepted, or overwrite an immutable record. If no authorized reviewer is available, report the gate as pending.
