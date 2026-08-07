# Adobe Animate blank-JSFL probe regression diagnostic

This is an acceptance-neutral, hash-bound diagnostic. It did not launch or operate Adobe Animate and has no migration, review, approval, parity, or strict-acceptance effect.

## Outcome

- Current unattended disposable-document JSFL readiness: **false**
- Status: `not-ready-repeated-timeout-without-controller-marker`
- Deterministic repository-code defect proven: **false**
- Root-cause classification: `undetermined-animate-runtime-ui-or-host-environment-state`
- Automatic retry authorized: **false**

## Bound comparison

- Historical pass: `work/animate/jsfl-cli-probes/run-pbVdi8/probe-result.json`; 23469 ms; exit 0; marker/audit/PNG validated.
- Current failure: `work/animate/jsfl-cli-probes/run-tQ3kYA/probe-result.json`; 60298 ms; Animate JSFL probe timed out after 60000 ms; no marker/audit/PNG.
- Current failure: `work/animate/jsfl-cli-probes/run-k7g1FO/probe-result.json`; 120329 ms; Animate JSFL probe timed out after 120000 ms; no marker/audit/PNG.
- Animate executable SHA-256: `fc7903fe74b3ad16842274eeffef12e18bcb51cee8722d7fd69166948991fbcb`
- Audit-template SHA-256: `043188cb940adc1895a8682ca2c5e146faf07e96a03bade11c62073055dda0ae`
- Probe-runner SHA-256: `c25b66287698eee29a3002695b94fe1553cdfcc99828514e8cfc3aa74d910948`
- Animate version/build: `21.0.7` / `21.0.7.42652`
- Run-directory-normalized generated JSFL identical: true
- Run-directory-normalized controller JSFL identical: true
- Current generator exactly reproduces all three stored generated scripts: true
- Common Animate startup signals present in all stderr logs: true
- Controller/JSFL error absent from all stderr logs: true

## Interpretation

The same current generator reproduces the historical and failed run scripts exactly after substituting each run directory. The executable and audit-template hashes also match. Both current attempts entered a bounded Animate process but produced no controller marker before SIGTERM, including the 120-second attempt. These receipts prove a current execution regression, but they do not identify a deterministic repository-code defect or a specific modal/UI cause.

## Next evidence

A separately authorized, observed cold-start diagnostic must identify the actual Animate UI/runtime state and produce a new hash-bound controller marker, audit JSON, native-stage PNG, and clean process exit. Do not infer readiness from the historical pass.
