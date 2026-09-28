# HELP MATH 2.0 Root Goal failure retrospective and handoff — 2026-09-01

Status: **stopped-failed-primary-outcome-valuable-local-assets-retained-no-resumption-authority**

This document records the failure of the four-day HELP MATH 2.0 Root Goal,
the project rules that must change because of it, and the exact local work that
remains worth preserving. It is a retrospective and handoff, not a completion
receipt, release approval, migration admission, Provider attestation, or
authority to resume the stopped Goal.

## Executive conclusion

The Root Goal did not deliver its primary product outcome.

It attempted to combine all of the following in one continuing objective:

- deliver an anonymous English/Spanish public-learning MVP;
- close engineering, testing, security, performance, Preview, staged
  Production, and release evidence;
- maximize formal Current-JS progress across 1,751 active page occurrences;
- coordinate local migration, shared factory, GitHub, Vercel, human, Owner,
  strict-completion, and publication gates;
- run recurring watchdog, dashboard, ETA, nightly, and formal-integration
  duties.

After approximately four days, the formal Current-JS count remained unchanged,
no Preview or staged deployment was created, no Production promotion occurred,
and the public launch remained `NO_GO`. The work produced useful local safety
and release infrastructure, but the ratio of user-visible outcome to effort was
unacceptable.

The stopped Goal must not be resumed as one broad Goal.

## Exact stopped state

The final observed project state at the time of this handoff was:

| Subject | Exact state |
| --- | --- |
| Root Goal | `blocked`; not `complete` |
| Recurring automation | `help-math-2-0-root-controller` deleted on 2026-09-01 |
| Main worktree branch | `codex/detect-dead-code` |
| Main worktree HEAD | `1b8ffbdcd40622bc2ecc52a5c48d51e8fd60d63d` |
| Main retained dirty paths | `.codex-validation-p51-e355`, `catalog/completion-ledger.json`, `catalog/lesson-release-ledger.json` |
| Release-guard branch | `codex/helpmath-release-lineage-guard-20260830` |
| Release-guard HEAD | `f7646fb91f4f5f370c374fc58a31630c110d7f2f` |
| Release-guard tree | `eb940a14363d359ac3b1981a8780c6a4fb6699bc` |
| Release-guard status | clean |
| Launch-control contract | `CONTROL_CONTRACT_PASS` |
| Release readiness | `NO_GO` |
| External authorization anchor | `MISSING` |
| Staged Production task count | `0` |
| Active task lease | `C0-007-CLEAN-LINEAGE-SOURCE-ALIAS-PREFLIGHT` retained by `Root Release Controller` |

The stopped Goal's recorded resource use was approximately:

| Measure | Recorded value |
| --- | ---: |
| Goal tokens used | 59,963,229 |
| Goal elapsed seconds | 385,641 |
| Approximate elapsed time | 107.1 hours / 4.46 days |

Elapsed time includes waiting and recurring watchdog intervals; it is not a
claim of continuous human labor. It is still a useful measure of the cost and
duration of the failed scheduling approach.

## Primary outcome scorecard

The authoritative page-only denominator remains 1,751 active lesson-page
animation occurrences across 29 Lessons. The legacy Flash course shells remain
excluded.

| Primary outcome | Start-to-stop result | Delta |
| --- | ---: | ---: |
| Formally registered Current-JS occurrences | 426 / 1,751 | 0 |
| Unique registered renderers | 425 | 0 |
| Complete Current-JS Lessons | 8 | 0 |
| Remaining occurrences | 1,325 | 0 improvement |
| Candidate-only occurrences | 20 | no formal admission |
| Strict-complete occurrences | 0 | 0 |
| Original-runtime evidence | 0 | 0 |
| Technical-fidelity acceptance | 0 | 0 |
| Audio acceptance | 0 | 0 |
| Human visual review | 0 | 0 |
| Owner acceptance | 0 | 0 |
| Preview | 0 | 0 |
| Staged Production | 0 | 0 |
| Released | 0 | 0 |
| Production verified | 0 | 0 |
| Formal integration transactions executed | 0 | 0 |

The frozen weekly ETA status concluded that the exact registered occurrence
identity set was unchanged from the 2026-08-23 baseline, the recent formal
registration rate was zero, no finite ETA could be defended, and the schedule
risk was red. Candidate inventory, source custody, generated artifacts, commits,
tests, and governance receipts did not change this result.

## What failed

### 1. The Goal was too broad to be operable

The Goal combined local engineering, migration-factory work, product
registration, Provider identity, CI, Preview, staged Production, human review,
Owner review, strict completion, publication, storage management, and recurring
scheduler duties.

These dependencies do not share one authority or one execution boundary. A
local implementation task cannot create GitHub/Vercel administrator evidence;
a Provider receipt cannot create a formal Current-JS renderer; a generated
candidate cannot create human or Owner acceptance. Combining them meant that
one external blocker could stall the entire Goal while local activity continued.

### 2. Governance investment grew faster than product progress

The work repeatedly added or reviewed:

- backlog handoffs and retained leases;
- branch-anchor path sets;
- exact changed-path ownership contracts;
- materializers, native runners, slot verifiers, and claim protocols;
- versioned currentness successors;
- multiple independent-review and quarantine receipts;
- race, symlink, hardlink, no-replace, and inode-binding controls.

Some of these controls closed real safety defects. The total governance surface,
however, became disproportionate to the product outcome. The release guard
gained six commits after `4ff752bc...`, while the shared factory lineage recorded
substantial additional commit and path activity. Formal Current-JS remained 426.

Governance proved that work was not authorized or not complete; it did not
convert candidates into registered product pages.

### 3. Activity metrics displaced the result metric

The failed Goal repeatedly surfaced counts such as:

- commits created;
- paths changed;
- tests passed;
- candidate files generated;
- CAS objects and extracted files;
- hashes, receipts, protocol versions, and review rounds;
- subagents and parallel audits.

These are operational diagnostics. They are not product progress.

For this project, the primary migration result is a state-3 admission:

> A reviewed module is in the official registry, the exact active placement is
> present in the source-ordered descriptor, and the modern My Lesson host can
> present it on the admitted surface.

Only that state increases `registeredOccurrences`. Structural extraction,
runnable candidates, static Canvas output, successful unit tests, and private
evidence bundles remain states 1 or 2 until formal admission is complete.

### 4. A known external blocker was re-audited instead of terminating the path

The Provider path remained blocked by:

`BLOCKED_SERVICE_IDENTITY_BOOTSTRAP_MISSING`

No local code or repeated audit could create:

- a real scoped service principal/App/workload identity;
- a Vercel GitHub App installation ID;
- immutable GitHub repository and owner IDs returned by the Provider;
- current branch-protection and required-check receipts;
- current Vercel Trusted Sources and Deployment Checks evidence;
- an exact staged deployment and Promotion receipt.

Once this was established, the Provider portion should have stopped and waited
for an external event. Rechecking policy loading, branch state, workflow text,
or historical receipts could not change the missing external identity.

### 5. Recurring watchdogs continued after the Goal was terminally blocked

The 15-minute heartbeat repeatedly read Goal state, Git identity, lease state,
launch control, receipts, and disk capacity. These checks were safe, but when
the state was unchanged they added context and scheduling cost without creating
new information or product value.

A blocked Goal should enter an event-driven wait or terminate its automation.
It should not continue fixed-interval polling indefinitely.

### 6. More parallel agents increased coordination cost after the bottleneck was known

Parallel review found real defects, but the final bottlenecks were external
identity, absent formal transaction authority, candidate-to-product admission,
and shared-worktree drift. More agents could not solve those dependencies.

After that point, additional agents mainly increased version churn, review
invalidations, path ownership checks, and reconciliation overhead.

### 7. Capacity became a recurring distraction rather than a single gate

System Data and WestWorld capacity were repeatedly sampled while APFS, browser
profiles, other projects, caches, open deleted files, and concurrent work made
the numbers volatile. The useful result was one fail-closed capacity decision;
repeated sampling did not explain the external space changes or produce product
progress.

System-operating headroom and factory-required working capacity must remain two
separate fields. A historical statement such as "20 GB available" is not a
factory requirement and must not substitute for a fresh byte-level probe.

## Permanent project rules adopted from this failure

These rules apply to future HELP MATH 2.0 goals unless the Owner explicitly
approves a narrower exception in advance.

### Rule 1: No broad multi-authority Goal

A future Goal must have exactly one primary outcome in one authority domain.

Do not combine all of the following in one Goal:

- Current-JS implementation or registration;
- Provider/service-identity activation;
- Preview or staged deployment;
- human or Owner acceptance;
- strict completion or release;
- archive/source promotion;
- storage cleanup;
- recurring scheduler duties.

Split them into independently stoppable Goals with explicit predecessor
receipts.

### Rule 2: Every Goal must declare one result metric

Before work starts, record:

- the authoritative baseline;
- one primary result metric;
- the exact target value;
- the exact evidence that proves the target;
- a changed-path allowlist;
- stop conditions;
- excluded gates and authority domains.

For a migration Goal, prefer a metric such as:

```text
registeredOccurrences: 426 -> 442
```

Do not use commits, changed paths, generated candidates, extracted files, test
counts, CAS bytes, receipts, review rounds, or agent count as the primary result.

### Rule 3: Activity metrics are secondary diagnostics only

Activity metrics may explain cost, throughput, and rework. They must always be
reported beside candidate-to-product yield and the authoritative product delta.

If the primary result metric remains unchanged, report `productDelta: 0`
prominently even when local tests or candidate generation pass.

### Rule 4: Governance must close a named blocker

Do not add a governance layer merely because another layer can be imagined.

A new contract, receipt, materializer, verifier, reviewer role, or protocol
version is permitted only when it:

1. closes a specific P0/P1 blocker to the current primary outcome;
2. has a smaller cost than the product work it protects;
3. removes or supersedes an older path where safe, rather than creating an
   indefinite version chain;
4. includes a test demonstrating the exact defect it closes;
5. cannot be replaced by a simpler existing Git, filesystem, CI, or review
   primitive.

The default governance budget is one task contract and one terminal receipt
chain per bounded transaction. Exceeding this default requires an explicit
Owner decision tied to a named risk.

### Rule 5: Stop on a non-local blocker

When progress requires a Provider administrator, named human, Owner decision,
credential act, external signing authority, or missing source that the current
task cannot create, record the blocker once and stop that Goal path.

Do not poll, regenerate local evidence, or create more governance in the hope
that the external fact will appear.

### Rule 6: Stop after two execution cycles without product delta

If two bounded execution/review cycles leave the primary result metric
unchanged, the Goal must stop for retrospective and rescoping. A third cycle
requires explicit Owner approval and a written explanation of what material
input changed.

### Rule 7: Use event-driven recovery, not fixed polling

Blocked work may resume only after a named input changes, such as:

- a new immutable source receipt;
- a reviewed Provider bootstrap receipt;
- an exact clean candidate commit;
- a named-human decision;
- a fresh capacity probe above the task-specific requirement.

Do not keep a 15-minute heartbeat active solely to rediscover the same blocker.

### Rule 8: Limit parallelism to the actual bottleneck

Use parallel agents only for independent work that can change the primary
result or close a named blocker. Once the bottleneck is external or serial,
stop adding agents. One writer and one independent reviewer are the default for
a bounded integration transaction.

### Rule 9: Preserve evidence-state separation

Continue to distinguish all of the following:

1. structural/static evidence;
2. unregistered engineering candidate;
3. registered Current-JS product integration;
4. authoritative original-runtime evidence;
5. technical comparison;
6. audio acceptance;
7. human visual review;
8. Owner acceptance;
9. strict completion;
10. lesson publication.

No future efficiency change may collapse these evidence states.

### Rule 10: Safety success is not product completion

Preserving source files, avoiding credential exposure, stopping on a capacity
gate, and preventing an unauthorized release are valuable outcomes. Report
them as safety outcomes, not as delivery of the MVP or migration progress.

## Valuable work retained by reference

The following work remains useful. Preserve the original commits and immutable
receipts; do not duplicate large evidence into this Markdown file.

### A. Clean release-guard lineage

Retain branch:

```text
codex/helpmath-release-lineage-guard-20260830
```

Retain commits:

| Commit | Retained value |
| --- | --- |
| `65ea16d25...` | Reject tracked hidden stage roots and harden deploy closure |
| `8a3bddc99...` | Governance handoff for service-identity port |
| `fca93413c...` | Secretless CI/CD service-identity port |
| `d31a90b9b...` | Finalize service-identity port evidence |
| `6194d4421...` | Governance handoff for source-alias preflight |
| `f7646fb91...` | Verify canonical source alias |

The cumulative release-guard change from `4ff752bc...` to `f7646fb...` covers
21 paths, approximately 2,737 insertions and 55 deletions. It includes useful
workflow, verifier, security-header, npm-policy, deployment-documentation, and
source-alias work. It remains local release preparation, not Provider activation
or publication authority.

### B. Service-identity preparation

Retain the checked-in service-identity policy, workflow jobs, static verifier,
tests, deployment closure checks, Vercel smoke/postflight workflows, and
documentation in the release guard.

Status remains:

```text
prepared-not-activated
```

Future use requires a fresh, non-secret Provider bootstrap receipt containing
the real scoped principal, effective permissions, exact repository/project/
environment bindings, Vercel installation ID, and immutable GitHub repository
and owner IDs.

### C. Deploy-closure privacy and hidden-root hardening

Retain the schema-v2 deploy-closure protections that fail closed on hidden
stage/source roots, case and alias variants, unsafe index entries, gitlinks,
duplicates, missing entries, and extra entries while redacting protected raw
paths from serialized failure results.

This is a genuine security and privacy improvement. It proves only the local
Git-index predeploy closure that it names.

### D. Source-alias preflight evidence

Retain C0-007's reviewed source-alias preflight and its twelve typed artifact
bindings. It proved the ignored canonical source alias, source custody,
page-only/currentness checks, and absence of the generated-input alias for that
exact subject.

It did not change Current-JS, strict, Preview, Released, or Production state.
The retained Root lease is a historical baton and must not be treated as
authority to execute a new task.

### E. Scheduler and release receipts

Retain these private receipts outside Git and deployments:

- `/Volumes/WestWorld/.helpmath-release-control-private/2026-08-31-c1/status/c1-001-nightly-release-gates-2026-08-31-quarantine.v1.json`
- `/Volumes/WestWorld/.helpmath-release-control-private/2026-08-31-c1/status/c1-001-owner-dashboard-0830-status-2026-08-31.v1.json`
- `/Volumes/WestWorld/.helpmath-release-control-private/2026-08-31-c1/reviews/c1-001-owner-dashboard-0830-status-2026-08-31-independent-review.v1.json`
- `/Volumes/WestWorld/.helpmath-release-control-private/2026-08-31-c1/status/c1-001-weekly-1751-eta-2026-08-31.v1.json`
- `/Volumes/WestWorld/.helpmath-release-control-private/2026-08-31-c1/reviews/c1-001-weekly-1751-eta-2026-08-31-independent-review.v1.json`
- `/Volumes/WestWorld/.helpmath-release-control-private/2026-08-31-c0-successor/reviews/formal-integration-1130-native-six-file-materialization-independent-review.v1.json`
- `/Volumes/WestWorld/.helpmath-release-control-private/2026-08-31-c0-successor/reviews/formal-integration-1130-native-six-file-materialization-outcome.v1.json`
- `/Volumes/WestWorld/.helpmath-release-control-private/2026-08-31-c0-successor/reviews/formal-integration-1130-protocol-package-quarantine.v1.json`

These receipts preserve dated status, failure, and boundary evidence. They do
not authorize a future transaction and must not be rewritten to look successful.

### F. Factory research and extraction evidence

Retain the existing factory branches, receipts, CAS/extraction evidence,
behavior audits, currentness controls, and dirty candidate worktrees until a
separate retention review determines their disposition.

Useful retained findings include:

- structural extraction and source custody for bounded samples;
- behavior-heavy classifications and host/audio/Replay blockers;
- verified `NO-GO-scale-out` decisions;
- race, symlink, hardlink, no-replace, and currentness defects found by
  adversarial review;
- the evidence that candidate throughput did not establish product yield.

Do not count factory commits, generated files, CAS objects, structural pages,
or candidate renderers as Current-JS unless they complete formal state-3
admission.

### G. Preserved user and source work

Retain without reset, clean, stash, overwrite, or automatic deletion:

- the three pre-existing dirty paths in the main worktree;
- all registered worktrees and local/archive refs until a separate reviewed
  cleanup decision identifies exact removable targets;
- canonical `source-assets/` and external archive evidence;
- private release-control receipts;
- candidate worktrees with uncommitted or untracked outputs.

The failed Goal did not authorize cleanup or retention changes.

## What must not be inferred from the retained archive

The retained work does not prove any of the following:

- that the anonymous EN/ES MVP was delivered;
- that candidate pages are registered Current-JS;
- that a factory shard has product yield;
- that GitHub required checks or Vercel Trusted Sources are active;
- that a Provider deployment is bound to the release-guard commit;
- that Preview, staged, Released, or Production gates are open;
- that original runtime, fidelity, audio, human, Owner, or strict acceptance
  exists;
- that a formal-integration slot was consumed;
- that the stopped Goal may resume automatically.

## Required shape of any future successor Goal

Any future successor must be a new Goal, not a continuation of this one. Its
proposal must fit on one screen and include:

1. one authority domain;
2. one primary result metric and exact baseline/target;
3. one clean subject worktree, branch, HEAD, and tree;
4. one exact changed-path allowlist;
5. one bounded implementation transaction;
6. one independent review;
7. explicit excluded gates;
8. named external inputs, if any, already present before the Goal starts;
9. a two-cycle no-progress stop condition;
10. no recurring heartbeat unless a time-based duty is itself the sole Goal.

Recommended future decomposition:

- **Current-JS Goal:** admit one exact reviewed occurrence set and produce a
  measurable `registeredOccurrences` increase; exclude Provider and release.
- **Provider Goal:** activate and verify one exact scoped service identity only
  after the external bootstrap receipt exists; exclude migration.
- **Release Goal:** create Preview/staged/Production evidence only after the
  product commit and Provider identity are independently current.

## Final handoff decision

The four-day Root Goal is stopped because it failed its primary product
outcome and consumed excessive effort in governance, repeated audit, and
activity reporting without formal Current-JS or public-release progress.

Its valuable local security, source-custody, release-preparation, and failure
evidence is preserved by the references above. Those assets may support a
future narrowly scoped task, but they grant no authority to resume the stopped
Goal and must never be presented as the anonymous EN/ES MVP, Current-JS
progress, Preview, staged deployment, release, or Production completion.
