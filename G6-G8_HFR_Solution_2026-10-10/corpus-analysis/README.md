# Corpus analysis: scanners and results (10 Oct 2026)

All scripts open source SWFs read-only. Python scripts run with the system `python3` (3.9+) and no packages; `.mjs` scripts run with Node 24.

| File | What it measures |
| --- | --- |
| `swfscan.py` → `swfscan-g678.jsonl`, `swfscan-G3/G4/G5.jsonl` | Per SWF file: signature, SWF version, stage, frame rate, frame count, AVM1/AVM2, tag inventory, ActionScript bytes, SHA-256 |
| `avm1scan.py` → `avm1-g678.json` | Opcode and string-constant frequencies over frame, init and button scripts (**excludes clip-event scripts**; superseded for features by `static-inventory-g678.json`) |
| `hostapi.py` → `hostapi-g678.json` | Course-shell surface: `_root` / `_level0` / `_parent` / `_global` member calls and assignments (symbolic stack tracking; frame and button scripts; 2,851 files) |
| `avm1lib.py`, `features.py` | Earlier per-placement feature flags (superseded by `../hfr-spike/static-inventory.mjs`) |
| `static-inventory-g678.json` | **Authoritative** opcode and feature inventory per active placement, including clip-event scripts (from `hfr-spike/static-inventory.mjs`) |
| `spike-run-v1/v2/v3.jsonl` | Headless prototype results per placement for each iteration (v3 is final) |
| `spike-run-g345-v3.jsonl` | Prototype v3 over all G3–G5 SWFs |
| `agg.py` | Summarise a spike run: `python3 agg.py spike-run-v3.jsonl` |

Key results are quoted in Sections 4 and 6 of the solution report.
