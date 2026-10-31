# G6–G8 conversion: HFR solution package (10 October 2026)

Prepared by Claude (Claude Code) for Dr. Peter Hu and the HELP Math 2.0 engineering team, in response to *G6-G8_Current_JS_Detailed_Report_2026-10-10* (Codex).

**One-sentence summary:** G6–G8 conversion is slow because every scripted page is rewritten and proven by hand. The pages are uniform ActionScript 1/2 content that a converter can translate automatically into TypeScript page modules played by one TypeScript runtime: **HFR with TypeScript output**, the target the Owner agreed on 10 October.

**Sample conversion (11 October):** NMS Lesson 7 (grade 6, 52 pages) and P040/P050 were converted into 54 TypeScript modules. All 2,378 code bodies are structured TypeScript, and 54 of 54 pages behave identically to the original bytecode. Open the viewer with `node hfr-sample/tools/serve.mjs` → http://127.0.0.1:8765/viewer/index.html.

## Read in this order

1. `Owner_Decision_Brief_2026-10-10.md`: one page, the decisions needed (D1–D7).
2. `G6-G8_HFR_Solution_Report_2026-10-10.docx` (or `.md`): the full root-cause analysis, solution, evidence, plan, risks and answers to Codex's questions.
3. `HFR_Technical_Specification.md` and `hfr-host-bridge.d.ts`: what engineers build.
4. `hfr-sample/README.md`: **what HFR output looks like**, with the generated TypeScript, data files, screens, how to run and verify.
5. `Animations_on Modern Shell.md` (11 October): how HFR pages get played inside the production My Lesson shell (`/courses/3/1` style). It was not done as of 11 October; the file gives the adapter design, milestones and Owner decisions.
6. `HFR_Execution_Backlog.csv`: tasks, estimates, dependencies, acceptance criteria.
7. `Codex_HFR_Sprint1_Kickoff_Prompt.md`: instructions for agent workers once decisions are made.
8. `hfr-spike/` and `corpus-analysis/`: the headless prototype and corpus measurements, reproducible with Node 24 and Python 3.
9. `figures/`: the figures used in the report.

## Scope of what was done

- Read-only review of the G6–G8 worktree (`/Volumes/WestWorld/HELP MATH 2.0-g678-implementation`), the registry, the release manifest, the workflow log, the handoffs and the 9 Oct efficiency study.
- Scanned all SWFs in the G6–G8 (2,853) and G3–G5 (2,074) source views.
- Built and ran a headless AVM1 prototype in an isolated scratch folder.
- Built a working converter (SWF → TypeScript + data), TypeScript runtime, viewer and equivalence verifier (`hfr-sample/`); converted and verified NMS Lesson 7 and P040/P050; checked rendering and interaction in a browser.
- **Not done:** no change to the Codex worktree, registry, admission files or evidence; no Ruffle comparison; no My Lesson integration; no registration; no fidelity or acceptance claims. The paused Codex session was not touched.
