# CurrentStateSnapshotV1

`CurrentStateSnapshotV1` is an unsigned, release-scoped diagnostic receipt. It
records why a lesson entered M0 without converting current JavaScript,
structural audits, builds, or stale-ledger diagnostics into fidelity or release
evidence.

It is deliberately separate from `EvidenceReceiptV1`. The latter is issued only
after every release member is strict-complete, the atomic release is published,
human and Owner decisions are current, and the production promotion protocol
signs the exact release. A current-state snapshot has no acceptance or
publication effect.

## Capture boundary

The capture binds:

- the selected release definition and exact member-identity set;
- the source manifest, protected completion ledger, Lesson release ledger,
  renderer registries, release machine packet, package manifest, and lockfile;
- generator and schema bytes;
- Git branch/HEAD state and a path-withheld worktree fingerprint;
- tool versions;
- exact diagnostic argv, timestamps, exit status, signal, stdout/stderr byte
  counts, and SHA-256 digests.

The generator reads every bound input and the worktree fingerprint both before
and after the command window. Any inode, bytes, hash, HEAD, branch, or worktree
drift aborts the public receipt. This prevents a concurrent ledger writer from
silently changing the snapshot basis.

Failed commands remain failed observations. In particular, a protected stale
ledger is not rebuilt by the capture.

## Privacy and storage

The checked-in JSON and Markdown contain only repository-relative logical
paths, counts, versions, dispositions, and hashes. They do not contain raw
frames, raw audio, command output, workstation paths, identities, contact
information, student data, credentials, or secrets.

Raw stdout and stderr are stored mode `0600` below the ignored
`work/current-state-snapshots/` root. They remain outside Git and deployments.
The normal verifier rehashes those private files. `--public-only` verifies the
public receipt and current repository bindings when the private command logs
are intentionally unavailable.

## G5 L4 commands

Capture is a no-replace operation:

```bash
npm run snapshot:g5:l4:current-state
```

Verify without rerunning diagnostic commands:

```bash
npm run snapshot:g5:l4:current-state:check
npm run snapshot:g5:l4:current-state:public-check
```

The G5 L4 profile is
`catalog/current-state-snapshot-profiles.json`. Its temporal statement
explicitly records that the release definition, fail-closed product controls,
55 draft workspaces, and M0 machine packet already existed. The receipt must
not be described as a pre-change checkout image.
