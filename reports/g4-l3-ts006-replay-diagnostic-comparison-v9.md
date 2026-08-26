# G4 L3 TS006 Replay diagnostic comparison v9

This is an acceptance-neutral engineering comparison between the proposed Replay segment in the new raw Flash capture and the existing JavaScript diagnostic compositor v8. It is not a baseline, promoted candidate, coverage result, ledger result, or strict evidence.

## Result

- Compared frames: 10
- Proposed mapping: capture ordinal = source local frame + 162 (tentative, not trace-bound)
- Source cursor setting: excluded; no pixel mask was applied
- Next button: neutral-orange in all selected source and implementation frames
- Source left-stage offsets: 0, 25 px
- Strict acceptance effect: **none**

## Regional RMSE

Raw columns compare fixed 800x600 coordinates. Registered columns shift only the source's detected leading black inset and compare the common visible width; they are diagnostic and cannot be used as acceptance metrics.

| Local frame | Capture ordinal | Source left inset | Raw full | Raw body | Raw header | Raw footer | Registered full | Registered body | Registered header | Registered footer |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 163 | 0 | 0.065075 | 0.038370 | 0.073146 | 0.133308 | 0.065075 | 0.038370 | 0.073146 | 0.133308 |
| 8 | 170 | 25 | 0.226116 | 0.180649 | 0.287340 | 0.328160 | 0.065963 | 0.040255 | 0.073872 | 0.133139 |
| 13 | 175 | 25 | 0.230960 | 0.189344 | 0.287340 | 0.327961 | 0.082037 | 0.070608 | 0.073872 | 0.134491 |
| 55 | 217 | 25 | 0.233515 | 0.193933 | 0.287340 | 0.327565 | 0.076460 | 0.061263 | 0.073872 | 0.133626 |
| 58 | 220 | 25 | 0.234993 | 0.196484 | 0.287340 | 0.327589 | 0.080865 | 0.069145 | 0.073872 | 0.133040 |
| 74 | 236 | 25 | 0.235775 | 0.197844 | 0.287340 | 0.327543 | 0.083046 | 0.073040 | 0.073872 | 0.132252 |
| 77 | 239 | 25 | 0.246901 | 0.216453 | 0.287340 | 0.327846 | 0.111261 | 0.115296 | 0.073872 | 0.131195 |
| 125 | 287 | 25 | 0.247589 | 0.217775 | 0.287340 | 0.327150 | 0.111543 | 0.115954 | 0.073872 | 0.129907 |
| 127 | 289 | 25 | 0.248782 | 0.219753 | 0.287340 | 0.327056 | 0.114366 | 0.119744 | 0.073872 | 0.130463 |
| 128 | 290 | 25 | 0.248892 | 0.219939 | 0.287340 | 0.327033 | 0.114675 | 0.120096 | 0.073872 | 0.130830 |

## v9 priorities

P0. Re-run or adjudicate the Replay capture registration before changing candidate geometry: the selected source frames contain left-stage offsets 0, 25 px. Bind any replacement segment to a trace and require one stable native-stage origin.
   Check: Run this generator again and require summary.sourceStageRegistration.distinctLeftOffsetsPixels to equal [0] before treating raw RMSE as candidate error.

P1. After the ordinal mapping is trace-confirmed, retune the sprite-23 reveal phases around source frames 77 and 125-128; the worst stage-registered body/content RMSE is 0.120096 at local frame 128.
   Check: Update inferredSourcePhases/ramp anchors, recapture exactly the same ten local frames, and require the stage-registered body/content mean and max to decrease without changing neutral controls.

P2. Refine footer background/control geometry independently from lesson content; its stage-registered RMSE mean is 0.132225 and the Next control must remain neutral-orange.
   Check: Adjust only diagnostic shell/footer assets and layout constants, then rerun this report and require a lower footer mean while summary.nextButtonNeutral.allSelectedFramesNeutral remains true.

P3. Keep ScreenCaptureKit cursor exclusion enabled and park the pointer away from controls so an invisible pointer cannot leave a hover state in captured pixels.
   Check: Require capture-manifest configuration.cursor = excluded and both source/implementation Next probes to classify neutral-orange for every selected frame.

## Boundary

- The proposed capture-ordinal to source-local-frame mapping is not trace-bound and is not source-frame authority.
- The source's whole-stage left registration changes within the proposed segment; raw fixed-coordinate RMSE therefore combines capture/runtime registration with candidate differences.
- Stage-registered RMSE discards the clipped rightmost source width and is diagnostic only, never an acceptance metric.
- This ten-frame spot comparison does not establish full-frame coverage, authoritative baseline, audio timing/listening, Spanish behavior, independent human review, Owner acceptance, or strict completion.
