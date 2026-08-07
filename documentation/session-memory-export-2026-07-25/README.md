# Six-session memory export

This directory contains the six sessions shown under the original
`HELP MATH_Flash_To_JS` Codex project, excluding the session that performed this
export.

## What is included

- `INDEX.md`: reader entry point and cross-session summary.
- `sessions/*/MEMORY.md`: concise handoff memory for future Codex work.
- `sessions/*/TRANSCRIPT.md`: readable, sanitized user-visible conversation.
- `sessions/*/TRANSCRIPT.json`: structured version of the same conversation.
- `MANIFEST.json`: session IDs, original rollout paths, source sizes and
  SHA-256 hashes, message counts, and exported-file hashes.
- `SHA256SUMS`: integrity hashes for all export files other than the manifest
  and checksum file themselves.
- `export-session-memory.mjs`: reproducible exporter used for the transcripts.

## Privacy and evidence boundary

This is a continuity export, not a raw forensic copy of Codex internals. It
includes actual user messages and user-visible Codex replies. It intentionally
excludes:

- system/developer prompts and injected project/environment context;
- internal reasoning;
- tool-call payloads, terminal output, and sub-agent internal traffic;
- secret values, tokens, passwords, and private-preview passphrases.

The original rollout files were not copied because they total hundreds of
megabytes, contain internal/tool records, and may include sensitive values.
Their exact paths, byte sizes, and SHA-256 hashes are retained in
`MANIFEST.json` for traceability.

Historical claims in these sessions may have drifted. Verify current repository
files, source hashes, tests, deployments, and approvals before reuse.

