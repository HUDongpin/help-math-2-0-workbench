# G4 L3 IR001 current-JavaScript random-audio candidate

Two exact embedded MP3 streams are staged without transcoding. The source AVM1 selects one branch with `random(2)` and starts it at parent frame 5; the JavaScript engineering candidate uses seed parity only to make both branches reproducible for QA.

| Outcome | Source domain | SHA-256 | Duration ms | Seed remainder |
|---:|---|---|---:|---:|
| 0 | `sprite-9` | `9b5b7659bda9ce6d22df5e3b927e9e56a87ef9a5405b55a46a8af2fff94e87ff` | 11180 | 0 |
| 1 | `sprite-10` | `d90d924f11f549a10218a6689b21b5d73aa19208ffab07c5f5725110e7b5d420` | 11180 | 1 |

This does not establish spoken language, the original runtime's random distribution or call order, authoritative synchronization, listening acceptance, Replay parity, human or Owner acceptance, strict completion, or publication.
