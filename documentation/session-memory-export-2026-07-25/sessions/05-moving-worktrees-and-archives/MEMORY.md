# Session memory — Moving worktrees and archives

Thread: `019f8fce-c12f-7ec0-9116-249cc78c49b6`

## Question

The user showed several desktop HELP Math folders and asked whether they could
be moved to an external hard drive without affecting the current project.

## Findings

- The main `HELP MATH_Flash_To_JS` project did not depend on the shown folders
  through a submodule, symlink, or direct project reference at that time.
- Most `helpmath-web-*` directories were Git linked worktrees, not ordinary
  independent folders. Dragging them in Finder would break Git’s stored
  absolute paths.
- One accessibility worktree was still in active browser/Playwright use and was
  not safe to move then.
- One actions worktree contained an untracked `output/` directory that needed
  preservation.
- Legacy source-recovery and web-archive folders were ordinary evidence
  archives and could be copied, hash-verified, and only then considered for
  cleanup.
- The observed `KINGSTON` disk was ExFAT and unsuitable as the live
  symlink-heavy Next.js/Git workspace.

## Safe rule

For linked worktrees, either:

1. finish/commit/preserve required changes, remove the worktree through Git, and
   recreate it from the repository at the destination; or
2. migrate the repository/worktree structure using Git-aware procedures and
   verify `git worktree list`, not Finder drag-and-drop.

For archives, copy first, compute and compare SHA-256 manifests, verify file
counts/bytes, and retain the original until the external copy is proven.

## Freshness warning

All named desktop folders and active-process claims were point-in-time findings
from 2026-07-24. Reinspect current Git worktrees and open processes before
moving or deleting anything.

