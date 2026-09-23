# G4 L3 GS002 source-local game initial-state contract

- Animation: `course-g04-l03-gs-002`
- Status: `verified-source-local-game-initial-state-and-post-stop-static-frame`
- Main domain: `sprite-321`, frames 1–428
- Game entry: frame 427, with a source `stop()`
- Deterministic current-JavaScript positions: 14

Frame 427 initializes the timer, score, blank sign/location fields, ship position, and a random virus position. The source timer field starts as `00:00:00` and the frame script writes score `0`. Both fields use device fonts with zero embedded glyphs, so the deterministic current-JavaScript drawing records its fallback font stack and remains pending an original-runtime text baseline. The deterministic current-JavaScript state maps a seed onto the fourteen legal virus positions while never executing or claiming to reproduce AVM1 random state. Frame 428 has no script and no source navigation path; it remains post-stop structural inspection only.

All buttons, input, movement, scoring, feedback, timer behavior, audio, natural random execution, parity, fresh human review, owner acceptance, and strict completion remain pending.
