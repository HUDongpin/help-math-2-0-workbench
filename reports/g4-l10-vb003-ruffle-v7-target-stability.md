# G4 L10 VB003 Ruffle v7 target stability

> **Ruffle forensic diagnostic self-comparison only.** This is not an Adobe original-runtime baseline, an original-versus-JavaScript comparison, formal RMSE acceptance, human/owner review, strict completion, or release evidence.

## Result

After the seven controlled host releases and the source-declared VB003 elapsed window, two 800×600 Ruffle captures 2,082 ms apart differ across the full player because the bottom host chrome remains dynamic. The target content region above y=500 and the lesson body from y=109 through y=499 are exactly pixel-stable.

| Region | x,y,w,h | Exact RGBA-different pixels | Normalized RGB RMSE | Exact stable |
| --- | --- | ---: | ---: | --- |
| fullPlayer | 0,0,800,600 | 2,520 | 0.006785937286 | false |
| targetContentAboveHostChrome | 0,0,800,500 | 0 | 0.000000000000 | true |
| targetLessonBody | 0,109,800,391 | 0 | 0.000000000000 | true |
| hostChrome | 0,500,800,100 | 2,520 | 0.016622083777 | false |

All **2,520** changed pixels are confined to host chrome. The target content has **0** changed pixels and RMSE **0**. This supports a static target-state candidate only: `begin`, child-domain entry, terminal playhead arrival, audio synchronization, Adobe original runtime, and visual fidelity all remain unproved.

Input diagnostic SHA-256: `eb2e458f3654a4420f35727bafd8c6eae314b619bdcb19737b1c8749b9145f06`. Strict acceptance effect: `none`.
