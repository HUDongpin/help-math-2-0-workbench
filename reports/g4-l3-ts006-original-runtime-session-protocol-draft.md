# G4 L3 TS006 Original-Runtime Session Protocol Draft

This is a reviewable, deterministic **draft**. It does not authorize or launch Adobe Flash Player or Animate.

## Bound source facts

- Source: `course-g04-l03-ts-006`, 800×600, 12 FPS, root 10 frames. Root frame 1 requests `InternalPreloader.jump_check` and stops; root frame 6 is labeled `begin`, places `Animation03`, and stops. Runtime reachability remains unresolved.
- Candidate nested domains: `sprite-3` / `Mc_Page_Title` = 1 declared frame; `sprite-23` / `Animation03` = 128 declared frames with stream sound `LTS06` and a frame-128 stop. Neither disposition is promoted from static placement to runtime fact.
- Audio: embedded MP3 stream candidate (128 blocks, 22.05 kHz mono) plus catalog Spanish MP3 candidate (7.632 s, 48 kHz mono). Language, cue, synchronization, and listening acceptance remain unresolved.
- Read-only host tree: 657 files / 35,469,789 bytes; CR-02 is technically prepared but not approved.

## Trace candidates

| Language | Candidate ID | Entry-state candidate SHA-256 | Status |
|---|---|---|---|
| en | `candidate:course-g04-l03-ts-006:natural-host-entry:en` | `cc5bbba244e27277284ee0a791bf0b13dde575b01e64981d4ec2e5b0a11a6827` | draft / not accepted |
| es | `candidate:course-g04-l03-ts-006:natural-host-entry:es` | `5b793db36c453b8475042458d20c47644228d18355cef5458098d0e538d23be1` | draft / not accepted |

These candidate IDs and hashes are planning identities, not authoritative requirement IDs, trace IDs, or observations.

## Proposed operator protocol

1. **P00 — preflight:** Before any launch, recheck all bound hashes, live free space, approved no-egress control, approved read-only local dependency allowlist, fresh disposable profile, empty SharedObject store, authorized host context, owner decision, and named original-runtime operator; abort if any field is absent or differs.
2. **P01 — fresh-process:** In one fresh runtime process for the selected language, use only the authorized staged lesson-shell host entry; do not directly open L3TS06.swf and do not use direct seek.
3. **P02 — natural-page-entry:** Enter TS006 through the same-lesson host path before invoking any page-language audio control. Record root frame 1, the InternalPreloader jump_check request, the host response, and the natural transition or lack of transition to the frame-6 begin label; do not invent a pre-entry host-language selector.
4. **P03 — page-language-audio:** After natural TS006 entry, in the Spanish session release the orange En esta página control at native-stage point (699,95), inside the source-derived bounds left 633.9/right 762.65/top 84.4/bottom 106.4. Resolve Shell root frame 49 instance SA, button object 217, hit shape 212, depth 202; record the source-expected SA_PLAY to SA_PAUSE transition and the actual load, audibility, spoken language, synchronization, onSoundComplete, and resume outcome. In the English session, record the naturally reached English/audio state without fabricating a pre-entry selector.
5. **P04 — frame-domain-disposition:** Record whether root-placed sprite-3/Mc_Page_Title and sprite-23/Animation03 are instantiated, their entry states, parent/root frame, and every naturally reached local frame without relabeling either nested timeline as the root timeline.
6. **P05 — natural-playback:** If sprite-23 is naturally reached, capture its ordered frame/state chain through declared frame 128 and the terminal stop. Record all observed root frames; leave unobserved declared root frames unresolved.
7. **P06 — audio:** Record the actual audio asset, start/stop time, owner frame domain, cue, synchronization, and language. Listen to the complete path; do not infer language or cue from filenames or technical probes.
8. **P07 — replay:** At the observed terminal state, invoke Replay only through the host-native control and record a complete reset of root, nested playheads, audio, language, and navigation state followed by a second natural terminal state.
9. **P08 — navigation:** Exercise Previous and Next only through the host-native controls, record destinations and state effects, return naturally to TS006, and verify a fresh entry state.
10. **P09 — close:** Close the runtime completely, record the process/session receipt and post-session no-egress/SharedObject checks, then repeat P00-P09 in a new process for the other language.

Direct seek remains forbidden. Each language requires a fresh process, natural same-lesson host entry, an ordered event/state chain, full nested-domain disposition, audio listening/synchronization evidence, Replay, navigation, no-egress verification, and complete exit.

## Gate

Prepared: source/authoring bindings, EN/ES trace candidates, read-only CR-02 tree, and this draft. Missing: owner approval, named runtime operator, authorized host, approved containment mechanisms, accepted schedule, and live capacity preflight. Execution remains **closed**.

## Acceptance boundary

This artifact is a deterministic, reviewable operator-protocol draft derived from static source, work-only Animate authoring, audio-probe, installed-runtime, containment, and read-only host-tree evidence. It launches nothing and creates no operator identity, approval, accepted schedule, runtime observation, baseline, audio acceptance, fidelity, parity, or migration completion.
