# G4 L10 VB001 host-chain static audit

> **Acceptance-neutral machine evidence.** This report closes only the source-static timing gap before a controlled Ruffle host-chain probe. It is not Adobe original-runtime, natural-entry, audio-listening, visual-fidelity, human, owner, strict, whole-lesson, or release evidence.

## Result

VB001 is a real shell-playlist dependency but is not an active XML or formal 47-member release member. Its 10-frame root stops at frame 1 until the shell preloader calls `begin`; root frame 6 places `sprite-31`. The principal child has **136 frames at 12 FPS** and executes `stop();` on frame 136. Two 135-frame embedded streaming-audio branches are selected by `random(2)` and activated from child frame 5.

| Timeline | Frames | Static role |
| --- | ---: | --- |
| root | 10 | loaded child root |
| sprite-31 | 136 | principal nested animation and random-audio controller |
| sprite-5 | 135 | embedded streaming-audio branch Mc_Sound_0 |
| sprite-6 | 135 | embedded streaming-audio branch Mc_Sound_1 |

A conservative controlled-probe window is **15,418 ms after exact VB001 HTTP delivery**: 3,084 ms host-preloader settle + ceil(136/12 seconds) + 1,000 ms buffer. This is only a source-declared elapsed-time envelope; it does not prove runtime entry, terminal playhead arrival, or audio completion.

## Source custody

- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB01.swf`, SHA-256 `3909cbf09c6bace7400687680e082007f8bc695bd16a279674a95bd266c109ec`, 58,345 bytes.
- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB01.fla`, SHA-256 `6c098c272e8608e401f3a51e7d065eb2a5bf076b23e1e8947a5041f5705d34ff`, 1,197,568 bytes; classic OLE/Compound-File custody verified, Adobe authoring inspection still pending.
- Fresh swfmill XML SHA-256: `7e940bc56fa453f8e8a320139bf2aaba9633356080c7cf4a60d695094f96696a`.
- Source files modified: **false**.

## Authority boundary

Formal migration declaration created: **false**. Active release denominator changed: **false**. Named-human audio listening: **false**. Authoritative original runtime, baseline, RMSE, human/owner review, strict completion, whole-lesson integration, and publication: **all false**. Strict acceptance effect: `none`.
