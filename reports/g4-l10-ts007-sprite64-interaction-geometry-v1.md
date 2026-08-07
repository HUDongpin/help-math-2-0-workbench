# G4 L10 TS007 sprite-64 interaction geometry v1

Status: **SOURCE_STATIC_HIT_GEOMETRY_AND_COORDINATE_CANDIDATES_FROZEN_RUNTIME_TRACE_UNRESOLVED**

Decision: **PRESERVE_GEOMETRY_PREDECLARE_CANDIDATES_DO_NOT_EXECUTE_DO_NOT_CLASSIFY**

This acceptance-neutral report derives native-stage geometry from the exact SWF display list. It executes no runtime or pointer input and leaves sprite-64 unresolved.

## Source-static target candidates

- Object 60 drag control: stage bounds `{"left":355.4,"right":547.65,"top":226.95,"bottom":253.55}`; safe integer point `{"x":452,"y":240}`.
- Object 62 movement control: stage bounds `{"left":342.7,"right":362.2,"top":230.85,"bottom":250.35}`; safe integer point `{"x":352,"y":241}`.
- Both points map back inside nonzero-alpha source vector fills. Bounds alone are not treated as Flash hit-test proof.

## Angle boundary

The rotation anchor maps to native-stage `{"x":539.25,"y":256.5}`. Eight integer candidates cover the two strict range branches. The equality branches require the half-pixel line `y=256.5`; two mathematical candidates are recorded but are not executable authority because input precision and stage-to-window mapping are unresolved.

## Boundary

No workspace, coverage, disposition, trace, capture kit, helper, runtime, renderer, comparison, review, acceptance, integration, promotion, release, or publication state changed.

Report fingerprint: `1a988c88fb8b1d7478aa18d4597e63eaeb32f895f8e50950d35cea73a54d9e66`.
