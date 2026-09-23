# G4 L3 TS006 Current-Account Disposable-Profile Readiness

The owner requested that capture continue under the current macOS administrator account and that no additional account be created. The EN and ES sessions remain separate and require a new disposable process profile for each language.

## Verified technical capability

The current host can run an exact allowlisted executable while the same sandbox policy denies non-allowlisted process execution, loopback network connections, private HOME reads, private HOME writes, LaunchServices host-open requests, and every non-startup LaunchServices lookup. The exact `com.apple.lsd.modifydb` and `com.apple.lsd.mapdb` lookups are separately allowed only so the empty Projector can register its own bundle, map the LaunchServices database, and complete AppKit window initialization. The separately allowlisted user-font directory remains readable for fidelity after its own hash binding. No external network contact was attempted and Flash Player was not launched.

Two unique empty profile candidates are now prepared: one for EN and one for ES. Their manifests and sandbox policies are hash-bound; their SharedObject, frame, audio, and log directories are empty. They remain non-executable candidates until the live gate closes.

## Remaining live gate

This is capability evidence, not a live session preflight. External owner signature for the exception, named EN/ES operators, external trust root, independent visual reviewer, release custodian, language-specific disposable profile creation, host network disable, and same-session checks are still missing. Original-runtime execution readiness is **false**.

## Acceptance boundary

No runtime session, baseline, audio review, visual review, owner acceptance, strict completion, or publication is established.
