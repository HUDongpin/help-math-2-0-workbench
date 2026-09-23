# Key-term pilot assets

These files are implementation assets extracted from the untouched owner-provided SWFs with
JPEXS Free Flash Decompiler 26.2.1. They are not runtime baselines and do not independently
prove strict fidelity.

- `acute-angle/frames/1.png` through `60.png` are the 225×225 root-timeline frames from
  `acute_angle.swf` (`dbc56af636e5551c582977f9230be2ae530874a05c901f0cf44dd5e2d5f2a347`).
  All 60 hashes were checked against the structural-baseline manifest.
- `computeghgh/frame.png` is the common 225×225 root-timeline image from
  `computeghgh.swf` (`fc5c79792530092fa98d450ac00622f5f107c598bf2f313b69fe3b524a6d62e8`).
- `computeghgh/buttons/{up,over,down}.svg` are the three visible states of source
  `DefineButton2` character 14. The source button action is `gotoAndPlay(1)` and frame 35
  contains `stop()`.

The associated `acute_angle.mp3` is intentionally not copied here: its source hash is known,
but the original host-controlled start frame has not yet been established.

