# Flash-to-JavaScript Skill Forward Test

Date: 2026-07-21 (Asia/Hong_Kong)

## Method

An isolated Codex agent received only the project path, the `$flash-to-js` skill, and this read-only request: begin a faithful migration audit of `Conversion_1_3.fla` and `Conversion_1_3.swf`, list exact first actions and evidence gates, and report missing prerequisites. It did not receive the conclusions from the parent task and was instructed not to edit files.

## Result

Pass. The agent:

- Located and followed the project workflow.
- Verified the preserved FLA/SWF hashes.
- Identified the SWF signature/version, `780 x 379` stage, 12 FPS, 170 frames, background, AVM1/AS2 behavior, language strings, terminal stop, and Replay behavior.
- Inventoried shape, morph, sprite, font, text, and button categories and detected that bitmap/audio/video tags were absent.
- Proposed the correct scaffold, draft validator, swfmill audit, Ruffle baseline, keyframe evidence, and renderer-decision sequence.
- Refused to make a full-fidelity claim because Adobe Animate, FFDec, and a working Java runtime were unavailable for authoritative FLA/library and deeper export inspection.
- Made no project changes.

## Conclusion

The project instructions and skill are sufficiently explicit for a fresh Codex instance to begin a new migration without relying on the original chat. Tool availability still controls the confidence level, as intended by the project fidelity contract.
