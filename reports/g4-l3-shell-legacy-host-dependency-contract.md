# G4 L3 course-shell legacy host/dependency disposition contract

> Acceptance-neutral forensic contract. It does not implement a route, execute a legacy endpoint, prove original-runtime behavior, or complete the shell/lesson migration.

## Bound shell

- Animation: `shell-course-g04-l03-index-local`
- Source: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf`
- SHA-256: `817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e`
- Runtime: 800×600, 12 FPS, 50 root frames
- Re-exported scripts: 528; normalized bundle `1d9daa6afa242d770e6726e144653b704f44e8c802dd3b370a0ba42470f8d8f2`

## Product navigation boundary

The active lesson product contract contains **39 pages**. The shipped shell embeds **44 entries**. The conflict remains unresolved; this contract does not silently promote the 44-entry static sequence over the 39 active XML pages.

## Candidate dispositions

| Disposition | Count |
|---|---:|
| local-nextjs-navigation-data-candidate | 8 |
| disabled-legacy-side-effect | 12 |
| unresolved-source-expression | 1 |
| human-runtime-evidence-required | 2 |

There are 20 exact static calls and 3 selected-Ruffle request observations, for 23 one-to-one dispositions.

| Static API | Exact calls |
|---|---:|
| fscommand | 5 |
| getURL | 3 |
| loadMovie | 5 |
| loadVariablesNum | 3 |
| SharedObject.getLocal | 1 |
| Sound.loadSound | 1 |
| XML.load | 2 |

## Candidate ledger

| ID | API | Role | Evidence location | Disposition |
|---|---|---|---|---|
| static-001 | getURL | javascript-parent-close | `DefineButton2_151/BUTTONCONDACTION on(release).as:2` | disabled-legacy-side-effect |
| static-002 | fscommand | close-player-host-command | `DefineButton2_151/BUTTONCONDACTION on(release).as:3` | disabled-legacy-side-effect |
| static-003 | getURL | javascript-student-help-window | `DefineButton2_247/BUTTONCONDACTION on(release).as:18` | disabled-legacy-side-effect |
| static-004 | getURL | lesson-report-and-bookmark-request | `DefineButton2_556/BUTTONCONDACTION on(release).as:7` | disabled-legacy-side-effect |
| static-005 | loadVariablesNum | failure-report-request | `DefineSprite_155/frame_15/DoAction.as:16` | disabled-legacy-side-effect |
| static-006 | loadVariablesNum | download-time-and-bookmark-report-request | `DefineSprite_155/frame_15/DoAction.as:74` | disabled-legacy-side-effect |
| static-007 | loadVariablesNum | final-quiz-report-request | `DefineSprite_164/frame_5/DoAction.as:2` | disabled-legacy-side-effect |
| static-008 | loadMovie | lesson-child-swf-load | `frame_35/DoAction.as:1007` | local-nextjs-navigation-data-candidate |
| static-009 | Sound.loadSound | spanish-page-audio-load | `frame_35/DoAction.as:2182` | human-runtime-evidence-required |
| static-010 | XML.load | keyterm-xml-load-primary | `frame_35/DoAction.as:2243` | local-nextjs-navigation-data-candidate |
| static-011 | XML.load | keyterm-xml-load-secondary | `frame_35/DoAction.as:2352` | local-nextjs-navigation-data-candidate |
| static-012 | loadMovie | keyterm-diagram-swf-load | `frame_35/DoAction.as:2679` | local-nextjs-navigation-data-candidate |
| static-013 | loadMovie | keyterm-diagram-swf-load | `frame_35/DoAction.as:2997` | local-nextjs-navigation-data-candidate |
| static-014 | loadMovie | keyterm-diagram-swf-load | `frame_35/DoAction.as:3311` | local-nextjs-navigation-data-candidate |
| static-015 | fscommand | legacy-flash-player-host-setting | `frame_35/DoAction.as:3326` | disabled-legacy-side-effect |
| static-016 | fscommand | legacy-flash-player-host-setting | `frame_35/DoAction.as:3327` | disabled-legacy-side-effect |
| static-017 | fscommand | legacy-flash-player-host-setting | `frame_35/DoAction.as:3328` | disabled-legacy-side-effect |
| static-018 | fscommand | legacy-flash-player-host-setting | `frame_35/DoAction.as:3329` | disabled-legacy-side-effect |
| static-019 | SharedObject.getLocal | local-bookmark-persistence | `frame_35/DoAction.as:3454` | human-runtime-evidence-required |
| static-020 | loadMovie | generic-scroll-pane-content-load | `FScrollPaneSymbol.as:169` | unresolved-source-expression |
| observed-001 | HTTP.GET | observed-initial-lesson-child-swf-read | `GET /api/reference/shell-course-g04-l03/IR/L3RW01.swf` | local-nextjs-navigation-data-candidate |
| observed-002 | HTTP.GET | observed-english-keyterm-xml-read | `GET /HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml` | local-nextjs-navigation-data-candidate |
| observed-003 | HTTP.POST | observed-legacy-report-and-bookmark-request | `POST /reference/shell-course-g04-l03-index-local` | disabled-legacy-side-effect |

## Selected Ruffle observations

Ruffle is forensic-only. All three requests were contained locally and blocked before reaching the server. They are not authoritative Flash/original-runtime evidence.

- `GET` (local-nextjs-navigation-data-candidate; blocked before server: true)

  `http://127.0.0.1:3104/api/reference/shell-course-g04-l03/IR/L3RW01.swf`
- `GET` (local-nextjs-navigation-data-candidate; blocked before server: true)

  `http://127.0.0.1:3104/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml`
- `POST` (disabled-legacy-side-effect; blocked before server: true)

  `http://127.0.0.1:3104/reference/shell-course-g04-l03-index-local?&Student_ID=&Class_ID=&Lesson_ID=&Section=Introduction&FileName=http://127.0.0.1:3104/api/reference/shell-course-g04-l03/IR/L3RW01.swf&Failure=yes&Close=no&Download_Time=&Book_Mark=0SPLDATA0SPLDATA1SPLDATA2SPLDATAhttp://127.0.0.1:3104/api/reference/shell-course-g04-l03/IR/L3RW01.swf`

## Evidence boundaries

- The generator physically rehashes the shell, re-exports all FFDec scripts, and reproduces the upstream full-script manifest and normalized-bundle hashes.
- Static source proves exact expressions, not runtime reachability, concrete caller values, timing, branch behavior, or product requirements.
- The two XML calls are an exact-source extension beyond the upstream machine audit's 18 external-API occurrences.
- The Spanish audio expression has no established file association, activation timing, synchronization, or listening acceptance.
- SharedObject operations are recorded but were not read, written, cleared, or emulated by this work.
- No legacy URL or endpoint was executed by this generator.

## Required next evidence

- Capture an authorized original-runtime/Adobe Animate shell trace for initial child loading, navigation, language switching, keyterm reads, bookmark state, audio activation, and terminal behavior.
- Resolve the generic FScrollPane loadMovie(url) caller expression before assigning any concrete resource or modern implementation.
- Reconcile the 39 active XML pages with the shell's 44-entry static sequence; retain the five extras as unresolved forensic evidence until reviewed.
- Resolve the missing lesson-specific versus present grade-wide keyterm XML conflict with runtime and owner evidence.
- Bind each source-derived Spanish MP3 candidate to a physical file, hash, language, duration, start frame, synchronization trace, and listening acceptance.
- Define reviewed modern bookmark semantics before replacing SharedObject; do not read or write legacy local storage by default.
- Keep legacy close/window/fscommand/report/loadVariables effects disabled unless a separate reviewed product/API requirement authorizes a modern replacement.
- Complete behavior, bilingual, audio, accessibility, visual, human-review, owner, and strict migration gates before any completion claim.

## Acceptance gates

| Gate | Value |
|---|---|
| authoritativeOriginalRuntimeBaseline | false |
| routeImplementation | false |
| runtimeReachability | false |
| behaviorParity | false |
| visualParity | false |
| bilingualAcceptance | false |
| audioAcceptance | false |
| accessibilityAcceptance | false |
| humanVisualReview | false |
| ownerAcceptance | false |
| strictMigrationCompletion | false |

Every gate remains false. This contract records exact static dependency candidates and contained Ruffle observations only; it is not fidelity, parity, acceptance, or migration completion.
