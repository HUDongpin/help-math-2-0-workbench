# G5 L3 main source-promotion currentness successor

This plan reuses the exact, reviewed 43-file copy set from
`g5-l3-active-source-promotion-2026-08-21.json` while rebasing the transaction
onto the current main-checkout source profile.

The predecessor plan was prepared against 9,147 canonical files. The current
main checkout has 9,244 canonical files because 97 exact G5 L4 FQ MP3 files
were subsequently reconciled into the frozen source profile. Those MP3s are
disjoint from the 24 G5 L3 SWFs and 19 G5 L3 FLAs selected here, and they stay
in the staged tree unchanged.

The expected source-only post-state is 9,287 files and 3,271,150,427 bytes.
The transaction must clone and validate source and catalog staging trees before
an atomic sibling-directory swap, and it must retain both prior trees as
recovery evidence.

The resulting applied receipt may establish canonical source custody only. It
does not establish Current-JavaScript behavior, original-runtime execution,
visual fidelity, audio acceptance, human or Owner acceptance, strict
completion, release, or publication.
