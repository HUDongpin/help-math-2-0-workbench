# G4 L3 Valid Pending Root Coverage Upgrade

The 38 untouched template workspaces now contain valid, one-indexed root requirements instead of invalid `1..0` ranges. This is a planning repair only.

- Upgraded workspaces: **38/38**.
- Valid pending root requirements: **76** (EN/ES).
- Conservative pending nested requirements: **374** (source-static main domains, EN/ES).
- Total pending requirements in these 38 workspaces: **450**.
- Invalid `1..0` ranges after upgrade: **0**.
- Authoritative runtime sessions / strict completions: **0 / 0**.
- Preimages: preserved under ignored `work/g4-l3-v2-coverage-preimages/c4d68b777ac0a594b05a7dcd2e117913223f6bcaea3e9e3a682b5e6806aa338c`; set SHA-256 `c4d68b777ac0a594b05a7dcd2e117913223f6bcaea3e9e3a682b5e6806aa338c`.

Each requirement binds `frameDomain`, `requirementId`, `trace`, `entryStateSha256`, frame range, scenario, language, and seed. The trace is explicitly unexecuted and the baseline authority remains unresolved. Nested domains and additional scenarios remain runtime-gated.
