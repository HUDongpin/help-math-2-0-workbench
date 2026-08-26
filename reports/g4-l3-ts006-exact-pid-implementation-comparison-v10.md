# G4 L3 TS006 exact-PID implementation comparison v10

Status: **acceptance-neutral fixed-registration diagnostic; not a baseline, authority claim, fidelity acceptance, strict completion, or release evidence**.

## Mapping boundary

The following ten one-based pairs are operator-selected piecewise diagnostic anchors. They are tentative and are not source-playhead telemetry or a trace-bound source-frame mapping.

| Candidate frame | Source capture ordinal | Diagnostic phase | Kind |
|---:|---:|---|---|
| 1 | 18 | reset-like-plateau-first-stable-frame | static |
| 8 | 31 | check-your-work-first-reveal | transition |
| 13 | 38 | check-your-work-reveal-end | transition |
| 55 | 120 | strategies-heading-first-reveal | transition |
| 58 | 125 | strategies-heading-reveal-end | transition |
| 74 | 156 | strategy-list-first-reveal | transition |
| 77 | 161 | strategy-list-reveal-end | transition |
| 125 | 253 | show-your-work-first-reveal | transition |
| 127 | 261 | show-your-work-reveal-settle | transition |
| 128 | 262 | terminal-like-suffix-entry | static |

The implementation `entryStateSha256` is the SHA-256 of a checked-in diagnostic context record. It is explicitly not an observed or authoritative original-runtime entry state.

## Fixed-coordinate RMSE

Every metric compares the same fixed x/y RGB pixels. Registration offset is always (0,0); there is no translation search, alignment optimization, resampling, clipping, exclusion rectangle, or pixel mask. Header, body, and footer partition all 800x600 pixels.

| Candidate frame | Source ordinal | Kind | Full | Body | Header | Footer |
|---:|---:|---|---:|---:|---:|---:|
| 1 | 18 | static | 0.071875 | 0.044484 | 0.086709 | 0.138812 |
| 8 | 31 | transition | 0.072625 | 0.045872 | 0.086709 | 0.139418 |
| 13 | 38 | transition | 0.083610 | 0.068263 | 0.086709 | 0.137835 |
| 55 | 120 | transition | 0.081427 | 0.064566 | 0.086709 | 0.137267 |
| 58 | 125 | transition | 0.085204 | 0.071715 | 0.086709 | 0.135936 |
| 74 | 156 | transition | 0.087091 | 0.075156 | 0.086709 | 0.135200 |
| 77 | 161 | transition | 0.112826 | 0.114089 | 0.086709 | 0.136258 |
| 125 | 253 | transition | 0.116786 | 0.120163 | 0.086709 | 0.134002 |
| 127 | 261 | transition | 0.119164 | 0.123887 | 0.086709 | 0.131951 |
| 128 | 262 | static | 0.119869 | 0.124360 | 0.086709 | 0.134530 |

## Summary

- full: mean 0.095048; max 0.119869 (candidate frame 128, source ordinal 262)
- header: mean 0.086709; max 0.086709 (candidate frame 1, source ordinal 18)
- body: mean 0.085256; max 0.124360 (candidate frame 128, source ordinal 262)
- footer: mean 0.136121; max 0.139418 (candidate frame 8, source ordinal 31)

- Browser capture: clean
- Fixed registration: verified at (0,0)
- Pixel masks: none
- Strict acceptance effect: **none**

## Boundary

- The exact-PID source package is still an acceptance-neutral diagnostic and not an authorized natural runtime trace.
- The ten source-ordinal to candidate-frame pairs are tentative piecewise phase anchors, not source-playhead telemetry or authoritative frame identity.
- The diagnostic entry-state digest binds a candidate context file; it is not an observed or authoritative original-runtime entry state.
- Ten spot frames do not establish complete 128-frame coverage or transition timing parity.
- No accepted audio timing or listening review, independent Spanish trace, independent human visual review, Owner acceptance, or strict completion is attached.
