# Vendor boundary

This directory contains HELP-authored wrappers/normalizers, not a copied
Next2D or OpenFL repository.

- `next2d/next2d-headless-extract.mjs` is the audited dependency-free wrapper
  used to instrument one pinned MIT `SwfParserWorker.js`. The upstream worker
  is downloaded into the ignored run directory and accepted only when its
  SHA-256 matches `toolchain-lock.json`.
- `openfl/normalize-openfl.mjs` normalizes the MIT OpenFL SWF export, removes a
  random UUID from semantic identity, joins the hash-bound HELP catalog
  identity, and fails closed on dangling symbol references.

The wrapper hashes are checked by focused tests and the backend adapters.
