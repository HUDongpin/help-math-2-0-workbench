# G4 L10 Native Helper v2.2 Successor Independent Review — FAILED

Status: **Gate A failed; this is not a passing companion and grants no authority**
Evidence date: **2026-08-05**
Acceptance effect: **none**
Runtime authority: **none**

## Frozen identity

- successor: `docs/G4_L10_NATIVE_HELPER_V2_2_SECURITY_CONTRACT_SUCCESSOR.md`
- successor SHA-256: `d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c`
- successor byte count: `960016`
- successor LF count: `15172`
- successor mode before and after all reviews: `0444`
- direct v2.1 predecessor SHA-256:
  `170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab`
- original v2 predecessor SHA-256:
  `77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`

The three independent scoped units each rehashed the complete successor before
and after review. Every before and after digest was the frozen successor digest
above. No reviewer edited the contract or executed a build, installation,
original runtime, apply, recover, acceptance, promotion, or publication action.

## Independent scoped units

### Unit A

- reviewer ID: `gate-a-v22-reviewer-a-lorentz`
- task ID: `gate-a-v22-a-d7bb8755`
- transcript ID: `gate-a-v22-a-d7bb8755-final-v1`
- primary scope: Sections 0 through 5; byte range `1..EOF`
- interval: `2026-08-05T08:39:00Z..2026-08-05T08:46:40Z`
- before/after SHA-256:
  `d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c`
- result: `P0/P1/P2 = 0/3/0`, `FAIL`

### Unit B

- reviewer ID: `gate-a-v22-reviewer-b-anscombe`
- task ID: `gate-a-v22-b-d7bb8755`
- primary scope: Sections 6 through 10; dependency backtrace Sections 0, 2, 4,
  and 16; byte range `1..EOF`
- interval: `2026-08-05T08:39:05Z..2026-08-05T08:45:10Z`
- before/after SHA-256:
  `d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c`
- result: `P0/P1/P2 = 0/3/0`, `FAIL`

### Unit C

- reviewer ID: `gate-a-v22-reviewer-c-james`
- task ID: `gate-a-v22-c-d7bb8755`
- primary scope: Sections 11 through 16; cross-check Section 2; byte range
  `1..EOF`
- interval: `2026-08-05T08:39:25Z..2026-08-05T08:47:07Z`
- before/after SHA-256:
  `d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c`
- result: `P0/P1/P2 = 0/3/0`, `FAIL`

## Open findings

### P1 — non-unique predecessor authority

Section 0 names both the direct v2.1 predecessor and the original v2
predecessor, while canonical fields such as `9202`, `1002`, `8502`, `7dc5`,
the launcher vectors, and the HMG4VC2 incorporated-predecessor slot retain the
singular phrase `exact Section 0 value`. Two different byte identities
therefore satisfy the prose. The authority-object preimage is not unique.

Required remediation: give every singular predecessor field one exact direct
predecessor identity. If an explicit chain is required, bind it separately
with discriminated names and deterministic ordering.

### P1 — stale and non-constructible Gate-A companion

Section 16 still requires the existing read-only v2.1 companion path and v2.1
heading. Its frozen-identity grammar binds only the original v2 predecessor and
cannot bind the direct v2.1 predecessor. A conforming v2.2 PASS companion would
therefore have to overwrite or impersonate frozen v2.1 evidence.

Required remediation: define a new no-clobber successor-specific companion
path, heading, direct-predecessor field, optional separately named root
predecessor field, and deterministic batch preimage that includes every
declared digest.

### P1 — `PROC_PIDLISTFDS` rule not propagated or evidenced

Section 2 correctly treats the positive size-query return as a capacity
estimate and admits an aligned positive actual return below the enlarged
capacity. The selected host produced the legitimate relation `360 -> 24`.
However, the external-launcher child rule still says a short result blocks;
the parent inherits that stale rule; and the dropped-child fixture leaves the
return/retry policy unspecified. Their pass schemas contain the normalized
list but no estimate, enlarged capacity, actual returned byte count, raw
returned prefix, retry reason, or layout witness.

Required remediation: apply one closed algorithm to helper startup, launcher
child, launcher parent, and fixture child. Add canonical per-attempt evidence
that binds estimate, capacity, actual return, raw returned prefix, disposition,
retry count, terminal list, and SDK layout. Gate B must cover the valid
`360 -> 24` case and negative query/read, nonmultiple, full/over-capacity,
duplicate, overflow/allocation, retry-exhaustion, hidden-extra-FD, and two-pass
drift cases in every applicable producer domain.

## Checks without additional findings

- Section 2's local helper-startup rule remains fail-closed, detects a hidden
  fourth FD, requires two consecutive stable passes, and emits no wire bytes
  before silent exit 64 on failure.
- All seven custody alternatives and managed indices `000..113` remain closed.
- The direction registry remains exactly `1..4`; direction 1 remains
  `LIVE_TO_PREIMAGE_CUSTODY` with retained-FD, no-replace semantics.
- Journal record types remain exactly `1..22`.
- The diagnostic registry remains 82 unique codes with reserved holes
  `00010007` and `00040007` absent.
- The rollback registry remains exactly three reasons.
- No new P0/P1/P2 was found in custody, direction-1, journal, recovery,
  diagnostic, rollback, time, or equality rules beyond the three findings
  above.

## Final verdict and boundary

```text
open-p0=0
open-p1=3
open-p2=0
verdict=FAIL
specification-only=true
acceptance-effect=0
runtime-authority=0
```

This failed report is historical review evidence only. It is deliberately not
named as the v2.2 PASS companion required by the defective Section 16 grammar.
It does not authorize production-helper implementation against v2.2, Gate B,
protected installation, original-runtime launch, apply, recover, acceptance,
promotion, release, or publication. Remediation requires a new no-clobber
successor contract and a fresh independent Gate A.
