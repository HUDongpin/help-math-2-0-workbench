# G5 Lesson 13 bounded stress calibration v1

G5 L13 is source-ready at **73/73 active page placements**, with the legacy Flash course shell excluded. Its existing RW002 prototype remains a valid factory stress sentinel: the checked-in generator deterministically reproduces a **29,528,099-byte** Canvas runtime for a **1,873-frame** nested drawing timeline, and its exact currentness check passed.

This does **not** authorize lesson-wide scale-out. RW002 is the only L13 registered candidate module and remains `legacy-prototype`, not a completed private Current‑JS whole Lesson. The other 72 pages have not inherited its lane or acceptance status.

## Stress result

- Canonical source: 4,796,905-byte `L13RW02.swf`, SHA-256 `bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6`; paired FLA is missing.
- Machine structure: AS1/2, 6 exported script files, 5 `DoAction` tags, 1,870 embedded stream blocks, and 11 morph definitions.
- Generated output: 29,528,099-byte renderer, SHA-256 `74c68ad3a5988f9a11f580d958ca6666380a7a87c905afd8eb93bf8f133ba8b3`.
- Static frame state: frames 1–1,873 are addressable; frame 673 is the source stop awaiting press, 674 begins the post-stop drawing segment, and 1,873 is the terminal source stop. These labels expose source structure but do not claim that the original click or terminal transition executed.
- Safety: no legacy ActionScript, dynamic evaluation, network primitive, timer/autoplay, persistent storage, ambient DOM listener, or audio rendering is present in the adapter.

## Verification

- Generator currentness: pass; exact renderer and manifest match the hash-bound inputs.
- Candidate contract tests: **12/12 passed**, including 673/674/1873 boundary behavior, en/es source-shared untranslated visuals, source identity, generated asset currentness, and preserved audio blockers.
- RW-only factory/QA boundary tests: **3/3 passed**.
- The broader multi-candidate suite was **53/54**, with the sole failure outside L13: G4 L1 IR has a stale scenario-inventory hash pin. That issue is retained for the final gate audit; it is not hidden inside the L13 result.

## Decision

Keep RW002 as a stress sentinel and engineering prototype. Do not batch the other 72 L13 pages merely because this large static drawing output is reproducible. Before any candidate advances beyond this lane, it still needs authoritative original-runtime natural traversal, ActionScript/host-transition disposition, complete frame-domain reachability, audio listening and synchronization, full-frame comparison, human review, and Owner acceptance.

Current‑JS whole-Lesson completion, original-runtime fidelity, behavior parity, visual fidelity, audio acceptance, human review, Owner acceptance, strict completion, release, and publication all remain false.
