# Sprint 1 kickoff instructions for agent workers (Codex or Claude)

Use this only after the Owner has recorded decisions D1–D5 (see `Owner_Decision_Brief_2026-10-10.md`). Paste the block below into a new agent session. Workstream-specific tasks are in `HFR_Execution_Backlog.csv`.

---

```text
You are an engineer on the HELP Flash Runtime (HFR) project for HELP Math 2.0.

GOAL (Owner-agreed target: "HFR with TypeScript output")
Convert every G6–G8 lesson page (2,282 placements) into TypeScript automatically:
a generated TypeScript page module (logic translated from the SWF bytecode) plus a
data file and media, played by ONE maintained TypeScript runtime inside the
existing My Lesson host, with the page's ORIGINAL behaviour. We no longer write
per-page players, per-page proofs or per-page admission transactions.

READ FIRST (in this order)
1. G6-G8_HFR_Solution_2026-10-10/hfr-sample/README.md: the working converter, runtime,
   viewer and verifier; NMS Lesson 7 + P040/P050 already convert and verify 54/54. START FROM IT.
2. G6-G8_HFR_Solution_2026-10-10/HFR_Technical_Specification.md (§3a translation rules, §11 tiers)
3. G6-G8_HFR_Solution_2026-10-10/hfr-host-bridge.d.ts (the host interface)
4. Your workstream rows in HFR_Execution_Backlog.csv

WORKSPACE RULES
- Work only in the HFR branch/worktree on the American Dream disk. Do not write to
  /Volumes/WestWorld (≈1 GB free) except through normal git operations the Owner approves.
- Source SWFs are read-only and hash-bound. Never modify source-assets or the AWS
  courseware view.
- Do not touch the existing G6–G8 registry, admission index/host, the 621 registered
  pages, or historical evidence. HFR registers through its own generic HfrPage module
  once the Owner approves the integration step.
- No network calls from legacy ActionScript: getURL, LoadVars, XML and report clips are
  sandboxed and logged.

ENGINEERING RULES
- Fix behaviour in the converter, the runtime or the shell adapter, never in a single page.
  If a page truly needs a different result, write a named overlay with a reason and request review.
- Generated page modules (.ts) and data files are never hand-edited: regenerate them.
- Every converter change must keep T0b (generated TypeScript vs original bytecode) at
  100% identical on the pages already passing; report any page that changes.
- Fail closed: an unknown opcode, tag, built-in or shell call is a reported failure,
  never silently ignored.
- Every change must keep the full-corpus T0 run green (convert + tsc + headless run) and must
  not reduce the T0b or T1 pass counts without an explanation in the PR.
- Prefer measurements over prose. A PR description states: what changed, T0/T1 counts
  before and after, and the clusters fixed. Keep it short.
- Parallel work is safe: you own modules, not shared per-page files. Coordinate only on
  the interfaces in hfr-host-bridge.d.ts and the bundle schema.
- Rework rule: if the same cluster fails twice after a fix, change the hypothesis and
  write a two-line note; do not retry unchanged.

DEFINITION OF DONE FOR SPRINT 1 (gate G1, 16 Oct)
- A 60-page stratified sample (15 per strand; all 8 section codes; P040/P050; ≥5 drag pages;
  ≥5 MX-component pages) compiles, runs and plays in local My Lesson.
- T0 = 100% and T0b = 100% on the sample; T1 (Ruffle differential via the instrumented shim SWF) ≥ 80%.
- Host events (navigation state, glossary links, feedback, final-quiz audio) are visible in
  the host log.

DAILY REPORT (≤ 10 lines)
T0 and T1 counts (corpus and sample), top 5 failure clusters with owners, what merged,
blockers. No long narratives and no re-derivation of earlier state.
```

---

## Notes for the coordinator

- `hfr-sample/` runs with Node 24 and the workbench's installed esbuild/typescript: `npm run compile:nms-l07`, `npm run build`, `npm run verify`, `npm run typecheck`, `npm run serve`.
- Known items to close first: the 0.33% explicit-stack fallback (for-loops with `continue`, stack-underflow patterns); `tellTarget` with slash paths (GEO L11 P019); frame-1 script order of a parent and its newly placed children (verify against Ruffle); P040 button-label highlight bars; final-quiz audio routing; the accessibility mirror.
- The original shell SWF is not in the materialised source view. The shell contract here was derived from the page bytecode. If the original course player is ever recovered, compare it with the adapter.
