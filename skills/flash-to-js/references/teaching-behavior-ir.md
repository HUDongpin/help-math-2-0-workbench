# Teaching Behavior In Intermediate Representations

Use when an IR/configuration needs to drive instructional behavior, not only
draw frames. Extend an existing applicable IR before introducing a new family.
The repository already has source-bound behavior-composite IRs, including
`migrations/course-g05-l05-ts-007/audit/behavior-composite-ir.json`, with answer
models, attempts, source assignments and unresolved audio/host dispositions.
Do not describe all existing IR as graphics-only.

## Minimum Behavior Contract

| Dimension | Record |
| --- | --- |
| Events and effects | Event name, admissible state, input lock, effects and destination. Reject repeated/out-of-phase input. |
| Input and conditions | Exact option/input identity, source predicate or authored right/wrong handler, attempt/score rules, and source location. |
| Feedback and sequencing | Feedback state, completion event, retry/advance condition and relevant variables. Separate an actual media-ended event from a projected timer or explicit Continue. |
| Audio ownership | Owning state/domain, exact source-bound asset, start/stop/replay rule, and whether completion waits for audio. Unknown ownership is explicitly unresolved; never invent a sound to fill the field. |
| Replay | Complete initial state vector, seed policy, effects to cancel and resources to stop. Distinguish source facts from modern product reset decisions. |
| Completion/host | Exact terminal condition, readiness requirement, modern host notification and semantics. Page completion may occur after exhausted attempts; it is not necessarily correctness or mastery. |

Bind source facts to immutable SWF/FLA and extracted handler/placement evidence.
Label modern product contracts separately, particularly accessibility focus,
reset policy and `onActivityComplete`. Explicitly list delegated behavior and
unresolved semantics so a partial IR is not mistaken for a full page compiler.

## Maintained TS008 Slice

- Input: `migrations/course-g04-l03-ts-008/audit/teaching-behavior-ir.json`.
- Compiler: `scripts/build-ts008-teaching-behavior.py`.
- Output: `packages/demos/src/timelines/course-g04-l03-ts-008-behavior.generated.ts`.
- Consumers: TS008's maintained interaction reducer and renderer.

This version handles the existing quiz-feedback contract, initial Replay state
and terminal My Lesson notification condition. It reuses the two-attempt shared
adapter. Walkthrough, help, feedback content/windows and timer orchestration
remain in maintained page code. It does not add general ActionScript execution
or audio playback. Audio is explicitly unresolved and cannot be enabled by
changing a flag in this IR.

The compiler checks all three source/extraction hashes, parses sprite-350
placements, and checks each option's actual right/wrong button handler. It also
checks wrong-feedback counter conditions and correct-feedback continuation.
The admitted modern completion/reset contract is checked separately. A changed
answer, mismatched placement, altered attempt limit, incomplete Replay vector,
unsupported event or premature completion fails before output is written.

```sh
python3 scripts/build-ts008-teaching-behavior.py
python3 scripts/build-ts008-teaching-behavior.py --check
python3 scripts/test_ts008_teaching_behavior.py
node --import tsx --test packages/demos/tests/course-g04-l03-ts-008*.test.ts
```

Edit the IR or compiler, never the generated output. Re-run the source checks,
regenerate and test actual consumers. Existing dated receipts pinning a changed
consumer are historical; do not silently refresh them as acceptance evidence.

## Avoid Circular Validation

Use independent checks with different failure modes:

1. Compare the IR to raw source extraction, including option-to-object placement
   and the handler's actual effect. Hashes establish identity, not semantics.
2. Retain independent, explicit expected outcomes in consumer tests. Do not
   derive expected answers, attempt limits or reset states from the new IR.
3. Mutate the IR's answer, retry rule, source binding or reset vector and prove
   the compiler rejects the contradiction. Generated-output equality alone is
   only a reproducibility check.
4. Exercise host wiring and audio lifecycle in browser journeys when those
   behaviors change. State-machine equivalence is not original-runtime parity.

For “correct answer -> explanation -> feedback audio -> allow Continue”, each
effect and ordering edge needs its own evidence. If the audio owner or end
condition is unknown, record the unresolved edge and block that complete-chain
claim while allowing independently supported visual/interaction work.
