# G4 L3 / G5 L4 private-preview capture currentness invalidation — r3

Status: `CAPTURE_INVALIDATED_AMBIENT_WORKTREE_DRIFT`.

The r2 private-preview execution completed 128 G4 TS006 frames and 419 G5
RW002 frames. It also observed the local private-login redirect and authenticated
G4/G5 preview routes. Those execution records are retained and were not
rewritten.

After the capture, the shared render-affecting file
`apps/web/app/globals.css` changed repeatedly. Both captures bind the earlier
166,782-byte SHA-256 `cbf8b0e07b42852a97407a1556a633b5cf4c6f0357689e03bf396d5834b50954`.
Later read-only observations found three different replacement SHA-256 values,
ending with a 10-second stable-stat observation at
`5c7a7de0d2ddfe8236dbed95209ed7d5b4d966dc5a39b6dee979ccdb8eea561a`.

Therefore neither capture is current for the present implementation closure.
No recapture is authorized while ownership and quiescence of the overlapping
CSS work remain unverified. This invalidation does not erase the private-login
observations, and it grants no original-runtime, baseline-comparison, audio,
interaction, Replay, human, Owner, strict-completion, release, or publication
authority.
