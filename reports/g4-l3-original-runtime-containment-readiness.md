# G4 L3 Original-Runtime Side-Effect Containment Readiness

This acceptance-neutral report binds the exact static ActionScript side-effect surface before any original-runtime session. It launches nothing and authorizes nothing.

## Result

- Affected members: **3/40**. Exact external operations: **23**.
- Network-capable/resource/script-navigation operations: **17**; host-control operations: **5**; local persistent-state operations: **1**.
- Containment controls: **8 specified / 0 approved**. Runtime sessions and authoritative baselines remain **0**.
- Execution state: `closed-awaiting-approved-side-effect-containment`.

## Exact API surface

| API | Count |
|---|---:|
| fscommand | 5 |
| getURL | 6 |
| loadMovie | 5 |
| loadVariablesNum | 3 |
| SharedObject.getLocal | 1 |
| Sound.loadSound | 1 |
| XML.load | 2 |

## Affected members

| Seq | Animation | Exact operations | APIs | Execution |
|---:|---|---:|---|---|
| 38 | `course-g04-l03-fq-002` | 2 | getURL:2 | closed |
| 39 | `course-g04-l03-fq-003` | 1 | getURL:1 | closed |
| 40 | `shell-course-g04-l03-index-local` | 20 | fscommand:5, getURL:3, loadMovie:5, loadVariablesNum:3, SharedObject.getLocal:1, Sound.loadSound:1, XML.load:2 | closed |

Static presence does not prove runtime reachability. The remaining 37 members still require the same isolated-session controls because host-loaded dependencies and shared runtime state can introduce side effects.

## Required controls

| ID | Requirement | Mechanism | Approved | Verified |
|---|---|---|---|---|
| CR-01 | Disable outbound networking at the host or disposable-session boundary and prove the deny state before launching the player. | unselected | false | false |
| CR-02 | Materialize one read-only, hash-allowlisted local lesson tree for the selected SWF and every permitted local dependency. | unselected | false | false |
| CR-03 | Use an isolated disposable runtime profile with an empty Flash SharedObject store and discard it after the one-item session. | unselected | false | false |
| CR-04 | Run one SWF in one fresh player process; abort on any unexpected dialog, browser navigation, host command, or unallowlisted resource request. | unselected | false | false |
| CR-05 | Record a connection/request audit proving that no legacy request reached a server and inventory every attempted local or blocked resource load. | unselected | false | false |
| CR-06 | Keep telemetry POSTs, javascript URLs, external browser opens, fscommand host effects, and persistent bookmark writes disabled. | unselected | false | false |
| CR-07 | Run a fresh storage-capacity preflight immediately before every bounded capture session. | unselected | false | false |
| CR-08 | Bind explicit owner approval, a named original-runtime operator, the exact host, launch path, and stop conditions before execution. | unselected | false | false |

## Acceptance boundary

This report binds exact static ActionScript side-effect candidates and specifies fail-closed controls. It launches no runtime and executes no endpoint. Static calls do not prove reachability, and unselected controls do not constitute containment, authorization, baseline evidence, acceptance, parity, or completion.
