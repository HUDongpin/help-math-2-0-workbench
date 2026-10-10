# Owner decision brief: G6–G8 conversion method

10 October 2026, updated 11 October · For Dr. Peter Hu · One page · Full analysis: *G6-G8_HFR_Solution_Report_2026-10-10* (revision 2)

## Situation

- **621 of 2,282** G6–G8 placements are registered; **1,661** remain. Work is paused at your request.
- The current method rewrites each page's ActionScript behaviour by hand and proves each page individually. The best measured rate is **17.75 pages/day**, and **83/day** is needed for 30 October. At the best rate, completion is about **mid-January 2027**.
- The September factory produced 379 pages in one batch because those pages had no scripted behaviour. Every remaining page has scripted behaviour, and the current tools cannot execute it.

## Direction: HFR with TypeScript output (agreed 10 October)

A converter turns each Flash page into a **generated TypeScript page module** (its logic, translated from the original bytecode) plus a data file and media. One maintained **TypeScript runtime library** plays every page inside My Lesson. No Flash is involved at run time. All pages are ActionScript 1/2, Flash 6/7, 800×600, 12 fps; they use 63 instructions and 44 shell functions.

**Evidence:**
- **Sample conversion:** NMS Lesson 7 (grade 6, 52 pages) plus P040 and P050 were converted into 54 TypeScript modules. All 2,378 code bodies became structured TypeScript, and **54 of 54 pages behave identically** to the original bytecode. All 52 pages render in the browser, and P040's game plays a full round.
- **Whole corpus:** 99.67% of 118,923 code bodies translate to structured TypeScript.
- **Headless prototype:** runs 2,281 of 2,282 placements.

## Decisions requested

| # | Decision | If yes | If no | Recommendation |
| --- | --- | --- | --- | --- |
| D1 | HFR with TypeScript output (generated page modules + data + one maintained runtime + reviewed overlays) as the Current-JS tier for new G6–G8 work | Generated modules replace ≈ 38,000 additional hand-written page files | Per-page rewriting continues (≈ Jan 2027 at best) | **Agreed (10 Oct); record formally** |
| D2 | Verify the runtime once and pages automatically (T0, T0b equivalence, T1–T3); review per lesson; strict and Owner gates unchanged | Verification cost becomes a nightly automated run | Eight-cell matrix and proof per page continue | **Yes** |
| D3 | Pinned Ruffle as an automated oracle; pre-approve it as a labelled temporary fallback (Track B) for pages not passing HFR by 28 Oct | Objective test reference; guaranteed coverage on 30 Oct | Slower, manual comparison; coverage risk | **Yes / Yes, conditional** |
| D4 | Freeze the bespoke lane (P040/P050 only if one session or less); keep the 621 registrations | Team focuses on HFR | Two competing methods | **Yes** |
| D5 | Hermetic HFR workspace on American Dream; no new evidence growth on WestWorld (≈ 1 GB free) | Portable, reproducible pipeline | Disk-full failures recur | **Yes** |
| D6 | The lesson (44 atomic releases) as the release and review unit | One review per lesson | Per-page releases | **Yes** |
| D7 | Re-baseline 30 Oct as “all 2,282 playable with real interactions in private My Lesson (HFR or Track B)”, full HFR review by about 6 Nov if needed | An honest, achievable target | Target unsupported by any measured rate | **Yes** |

## Gates you will see

- **G1, 16 Oct:** 60 representative pages play in My Lesson as TypeScript; 100% pass the equivalence check; ≥ 80% match the Ruffle oracle.
- **G2, 22 Oct:** ≥ 90% of 2,282 pass automated differential checks.
- **G3, 28 Oct:** ≥ 40 of 44 lessons reviewed and released privately; any residue in Track B.

Nothing in this plan changes the fidelity, listening, Owner-acceptance, publication or legal gates.

Decision record: D1 ☐ D2 ☐ D3 ☐ D4 ☐ D5 ☐ D6 ☐ D7 ☐   Date: ____________   Notes: ______________________________
