# G4 L3 Controlled CEO Preview QA

> Controlled CEO Preview — current JavaScript candidate. Original-runtime full-frame comparison, human audio/visual review, Owner acceptance, strict completion, and public release are pending.

## Result

- Status: **pass-machine-verified-controlled-ceo-preview**.
- Unique routes: **82**; route visits: **121**.
- Current JavaScript pages: **39/39**; runnable course shell: **1/1**.
- Desktop fixed-frame renders: **39/39**.
- Mobile Spanish reduced-motion renders: **39/39**.
- Spanish route output classification: **1 graphic**, **38 fail-closed semantic**.
- Replay mouse/Enter/Space checks: **39/39**.
- Axe serious/critical violations: **0** across **82** audits.
- Console/page/request/HTTP errors: **0/0/0/0**.
- Ignored same-origin Next.js RSC prefetch cancellations: **2737**.
- Horizontal-overflow failures: **0**.
- Atomic release boundary: **0/40 strict; unpublished**.
- Exact Controlled CEO Preview boundary: **121/121 visits**.
- Private/no-store, noindex, and controlled-preview identity headers: **121/121/121 of 121 visits**.

## Route matrix

# | animationId | EN desktop frame 1 | ES mobile reduced motion | Replay mouse/Enter/Space
---: | --- | --- | --- | ---
1 | `course-g04-l03-ir-001-341242cc` | pass | pass | pass
2 | `course-g04-l03-rw-002` | pass | pass | pass
3 | `course-g04-l03-rw-003` | pass | pass | pass
4 | `course-g04-l03-rw-004` | pass | pass | pass
5 | `course-g04-l03-vb-002` | pass | pass | pass
6 | `course-g04-l03-vb-003` | pass | pass | pass
7 | `course-g04-l03-vb-004` | pass | pass | pass
8 | `course-g04-l03-vb-005` | pass | pass | pass
9 | `course-g04-l03-vb-006` | pass | pass | pass
10 | `course-g04-l03-vb-007` | pass | pass | pass
11 | `course-g04-l03-vb-008` | pass | pass | pass
12 | `course-g04-l03-vb-009` | pass | pass | pass
13 | `course-g04-l03-in-002` | pass | pass | pass
14 | `course-g04-l03-in-003` | pass | pass | pass
15 | `course-g04-l03-in-004` | pass | pass | pass
16 | `course-g04-l03-in-005` | pass | pass | pass
17 | `course-g04-l03-in-006` | pass | pass | pass
18 | `course-g04-l03-in-007` | pass | pass | pass
19 | `course-g04-l03-in-008` | pass | pass | pass
20 | `course-g04-l03-in-009` | pass | pass | pass
21 | `course-g04-l03-in-010` | pass | pass | pass
22 | `course-g04-l03-in-011` | pass | pass | pass
23 | `course-g04-l03-in-012` | pass | pass | pass
24 | `course-g04-l03-ti-002` | pass | pass | pass
25 | `course-g04-l03-ti-003` | pass | pass | pass
26 | `course-g04-l03-ti-004` | pass | pass | pass
27 | `course-g04-l03-ti-005` | pass | pass | pass
28 | `course-g04-l03-ti-006` | pass | pass | pass
29 | `course-g04-l03-gs-002` | pass | pass | pass
30 | `course-g04-l03-ts-002` | pass | pass | pass
31 | `course-g04-l03-ts-003` | pass | pass | pass
32 | `course-g04-l03-ts-004` | pass | pass | pass
33 | `course-g04-l03-ts-005` | pass | pass | pass
34 | `course-g04-l03-ts-006` | pass | pass | pass
35 | `course-g04-l03-ts-007` | pass | pass | pass
36 | `course-g04-l03-ts-008` | pass | pass | pass
37 | `course-g04-l03-fq-001` | pass | pass | pass
38 | `course-g04-l03-fq-002` | pass | pass | pass
39 | `course-g04-l03-fq-003` | pass | pass | pass

## Course and shell routes

- `/courses/4/3`: pass; continuous player with 39 ordered picker pages; horizontal overflow 0px.
- `/es/courses/4/3`: pass; continuous player with 39 ordered picker pages; horizontal overflow 0px.
- `/animations/shell-course-g04-l03-index-local?auditContext=g4-l3-lesson&lang=en&seed=0&frame=50&scenario=lesson-map-audit`: pass; prototype warning retained; source-visual parity false; 39 source-ordered page links; runnable current-JavaScript shell module: true.
- `/es/animations/shell-course-g04-l03-index-local?auditContext=g4-l3-lesson&lang=es&seed=0&frame=50&scenario=lesson-map-audit`: pass; prototype warning retained; source-visual parity false; 39 source-ordered page links; runnable current-JavaScript shell module: true.

## Acceptance boundary

This report proves only the observed local Next.js/current-JavaScript product layer for the exact routes and profiles listed. The runnable course shell is an acceptance-neutral 39-page audit projection: its source visual parity is explicitly false, its 44-versus-39 static sequence conflict is unresolved, and its legacy external effects remain disabled. Original-runtime behavior, source navigation parity, interaction/scoring branches, audio synchronization and listening, bilingual visual parity, full-frame RMSE, human visual review, owner acceptance, strict completion, and atomic publication all remain false.

