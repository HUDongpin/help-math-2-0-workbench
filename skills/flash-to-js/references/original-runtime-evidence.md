# Original Runtime Evidence

Use this reference when planning or executing a Flash baseline. Authority is assigned per coverage requirement and trace, not once for the entire SWF.

## Classify The Playback Source

- `Ruffle`: forensic observation only.
- JavaScript rewrite: implementation evidence only.
- Adobe Animate Test Movie, Adobe Flash Player Projector, or another explicitly authorized legacy runtime: possible original-runtime authority when identity, source, host, operation, and capture are proven.
- Screenshot, PDF, or stakeholder recollection: supporting evidence only.

Never label a Ruffle image, implementation capture, empty capture kit, trace specification, or prepared candidate package as an authoritative baseline.

## Select The Capture Mode

- Use `original-runtime-direct-seek` or `original-runtime-frame-step` only for a linear root visual requirement with exact frame observations.
- Use `original-runtime-natural-trace` for nested timelines, interaction, navigation, scoring, branching, randomness, Replay, source-driven schedules, or audio.
- Bind every session to `animationId`, `requirementId`, frame domain, trace, entry-state SHA-256, scenario, language, seed, native stage, FPS, and exact frame range.
- For natural traces, bind the ordered source-evidenced actions, source targets, pre/post states, terminal semantics, and a separately hash-chained execution report.

Frame seeking proves appearance only. It cannot prove the action path, nested entry, branch causality, Replay, scoring, navigation, or sound.

## Prepare The Environment

1. Verify the runtime executable and version, source SWF hash, required host/runtime tree, and toolchain receipt.
2. Use a contained, reviewed runtime environment. Do not expose unknown legacy endpoints or reuse private credentials.
3. Confirm the evidence destination is writable and has enough free capacity for lossless native-size PNGs, logs, manifests, comparisons, and archives.
4. Use a named human operator for any GUI open, natural interaction, or runtime observation that the protocol requires.
5. Store live session outputs outside unsigned capture-kit directories.

For HELP course or shell sessions, require all current containment controls before launch:

1. Prove outbound networking is denied at the host or disposable-session boundary.
2. Use one read-only, hash-allowlisted local lesson tree containing only the selected SWF and permitted dependencies.
3. Use a disposable runtime profile with an empty Flash SharedObject store; discard it after the one-item session.
4. Run one SWF in one fresh player process and abort on any unexpected dialog, browser navigation, host command, or unallowlisted resource request.
5. Record a request audit proving no legacy request reached a server and inventory all attempted local or blocked loads.
6. Disable telemetry POSTs, JavaScript URLs, external browser opens, `fscommand` host effects, and persistent bookmark writes.
7. Run a fresh storage-capacity preflight immediately before every bounded capture session.
8. Bind explicit owner approval, the named operator, exact host, launch path, and stop conditions before execution.

Check the current containment-readiness report rather than assuming these controls are approved. If any required control is unselected, unapproved, or unverified, keep runtime execution and authoritative baseline capture closed.

The project runbook may require opening a staged, hash-bound SWF through the runtime GUI rather than passing it on the command line. Follow the requirement-specific operator card exactly.

## Treat Kits And Candidates As Pending

Scaffold commands create unsigned instructions, schemas, staged sources, or empty output locations. They do not launch the runtime, observe a frame, sign evidence, update coverage, or grant acceptance.

Candidate preparers may validate logs, hash chains, dimensions, images, and receipts while still writing only `pending-human-owner` evidence. Preserve that status.

If canonical promotion is hard-disabled or limited to `--dry-run`/`--check`, do not bypass it by:

- Removing the safety flag.
- Copying PNGs into canonical baseline directories.
- Handwriting execution reports or authority fields.
- Editing coverage, migration status, reviews, receipts, or ledgers to resemble completion.

Report the promotion boundary as an unresolved gate.

## Preserve The Evidence DAG

Keep evidence flow one-way:

`source + stable specification + runtime identity -> runtime session -> baseline manifest -> implementation manifest -> metrics/review inputs -> human review -> owner review -> strict report/ledger`

Do not bind stable technical evidence to mutable status or acceptance fields. A later signature or status update must not invalidate the source, trace, renderer, or capture evidence it reviewed.
