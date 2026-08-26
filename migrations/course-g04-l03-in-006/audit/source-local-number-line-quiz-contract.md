# G4 L3 IN006 source-local number-line quiz contract

- Animation: `course-g04-l03-in-006`
- Status: `verified-source-local-number-line-quiz-initial-state-and-post-stop-static-frames`
- Main domain: `sprite-151`, frames 1–1057
- Quiz entry: frame 1054, with a source `stop()`
- Source questions: 8 ordered start/target pairs
- Number line: -15 through 15, 31 generated labels

The source initializes the number-line quiz locally at frame 1054. It duplicates 31 tick/label clips, chooses one of eight question pairs with `random(arr.length)`, and stops. Frames 1055–1057 contain only audio-stream blocks plus `ShowFrame`; they are not naturally reached after the source stop.

The current-JavaScript renderer may use the recorded embedded font outlines and metrics to draw the deterministic initial question and number labels. Its capture seed maps to one implementation branch by modulo eight only; that seed is not injected into untouched AVM1 and is not authoritative random-runtime evidence. Drag/drop, direction changes, equation updates, feedback, audio, New Number, Clear, natural runtime, parity, review, and acceptance remain pending.
