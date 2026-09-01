# Shared calibration structural audit

`scripts/audit-shared-calibration-structure.mjs` is the bounded, read-only
machine-audit stage for the G6–G8 shared-page calibration set. It consumes the
profile's `calibrationSet` and the checked-in shared catalog, verifies each
selected SWF against its catalog byte count/SHA-256, and invokes FFDec and
swfmill for structural observations only.

```bash
node scripts/audit-shared-calibration-structure.mjs \
  --profile catalog/g678-shared-source-profile.v1.json \
  --catalog catalog/g678-shared-catalog.v1.json \
  --source-root "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware" \
  --output work/g678-shared-page-factory/calibration-structure-v1

# Re-hash inputs, sources, and generated evidence without invoking tools.
node scripts/audit-shared-calibration-structure.mjs \
  --check \
  --profile catalog/g678-shared-source-profile.v1.json \
  --catalog catalog/g678-shared-catalog.v1.json \
  --source-root "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware" \
  --output work/g678-shared-page-factory/calibration-structure-v1
```

The output directory is create-exclusive and contains `report.json`, per-page
command logs, FFDec script-export inventories, and swfmill XML. Placement
processing is serialized per page and bounded by `--concurrency` (maximum four)
and `--timeout-ms` (maximum 900,000 ms per command). A command failure,
malformed structural output, source/catalog hash drift, or unexpected output
artifact fails closed; an incomplete staging directory is retained for
diagnostics and is never renamed to the requested output.

The report's lane value is only a preliminary machine hint (`low`,
`interactive-understood`, `behavior-heavy`, or `unknown`) with
`generationEligible: false` and `scaleOutAuthorized: false`. FFDec ActionScript
is not executed, and the audit does not generate JavaScript, modify a migration
workspace or registry, change the modern My Lesson host, establish an original
runtime baseline, compare fidelity, accept audio, or alter review/strict/release
or publication state. Every acceptance effect in the report is explicitly
`false`.
