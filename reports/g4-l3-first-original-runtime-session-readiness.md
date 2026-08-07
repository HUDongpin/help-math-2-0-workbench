# G4 L3 First Original-Runtime Session Readiness

This packet selects one first-session candidate but does not authorize or launch Adobe Flash Player or Animate.

## Selected candidate

- **`course-g04-l03-ts-006` — 4 - Step Plan**.
- Source SWF SHA-256: `fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47`; FLA SHA-256: `3f500c60b73b735eb001993b31ff101bf1615384c86b6a28987a84feef5b70dd`.
- Native runtime facts: 800×600, 12 FPS, 10 root frames; 139 statically reachable declared frames across root and nested definitions.
- Static signals used for selection: no exact external operation, no random candidate, one source-bound scenario candidate, one static candidate family. These are not runtime reachability proof.

| Rank | Candidate | Reachable declared frames | Source-bound candidates | Exact external ops |
|---:|---|---:|---:|---:|
| 1 | `course-g04-l03-ts-006` | 139 | 1 | 0 |
| 2 | `course-g04-l03-in-003` | 483 | 1 | 0 |

## Bounded capacity envelope

- 278 logical frames across EN/ES × 3 PNG roles = 834 PNG objects, using the current p95 PNG byte sample, 60% overhead, and 4.00 GiB fixed working space.
- Incremental envelope: **4.41 GiB** × 1.20 safety margin; operational reserve: **100.00 GiB**; bound available space: **851.30 GiB**.
- Headroom after the envelope and reserve: **746.00 GiB**. The static envelope fits, but a live preflight is still mandatory and this is not execution authorization.

## Operator-protocol draft

- Bound draft: `reports/g4-l3-ts006-original-runtime-session-protocol-draft.json`; state: `draft-not-scheduled-not-authorized`.
- Two planning candidates: `candidate:course-g04-l03-ts-006:natural-host-entry:en`, `candidate:course-g04-l03-ts-006:natural-host-entry:es`; ten proposed steps: `P00 → P01 → P02 → P03 → P04 → P05 → P06 → P07 → P08 → P09`.
- The candidate entry-state hashes are deterministic planning identities only. No authoritative requirement ID, trace ID, accepted event schedule, or accepted capture schedule exists yet.

## Natural evidence still to schedule

- authorized same-lesson host natural entry in English
- authorized same-lesson host natural entry in Spanish
- root timeline natural playback and terminal stop
- runtime disposition of sprite-3 and sprite-23, including every reachable transition
- embedded stream identity/timing plus the associated Spanish MP3 path
- complete Replay reset and previous/next host navigation

Requirement IDs, trace IDs, entry-state hashes, event schedules, and capture schedules are all still empty. Direct seek remains unauthorized until a natural same-source trace is established.

## Read-only host-tree preparation

- CR-02 technical artifact: **prepared, not approved**.
- Manifest: `work/original-runtime-host-trees/course-g04-l03-ts-006/root/staging-manifest.json`; file-set SHA-256: `b6b92f1e95f29117084150d8d0e278e5516514bb1306223d6ac667677aa90a28`.
- 657 independent SWF/MP3/XML copies / 35469789 bytes; files `0444`, directories `0555`; no symlinks or hard links.
- This tree is a local dependency allowlist candidate only. It does not approve CR-02 or make execution ready.

## Containment and authorization

| Control | Mechanism | Approved | Verified |
|---|---|---|---|
| CR-01 | unselected | false | false |
| CR-02 | technical artifact prepared | false | false |
| CR-03 | unselected | false | false |
| CR-04 | unselected | false | false |
| CR-05 | unselected | false | false |
| CR-06 | unselected | false | false |
| CR-07 | unselected | false | false |
| CR-08 | unselected | false | false |

Owner decision, named original-runtime operator, authorized host context, containment mechanisms, disposable profile, and session identity are all unfilled. Execution remains **closed**.

## Acceptance boundary

This packet chooses one low-static-risk first-session candidate, proves that a conservative static storage envelope fits the bound snapshot with reserve, binds a separate hash-verified read-only CR-02 dependency tree, and binds a deterministic EN/ES operator-protocol draft. It launches nothing and records no human identity, accepted schedule, or approval. Technical preparation does not prove runtime reachability, containment approval, authorization, baseline authority, fidelity, acceptance, parity, or completion.
