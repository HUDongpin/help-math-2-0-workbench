# Grade 4 Lesson 10 native helper v2 development codecs

This directory is a workspace-only development artifact bound to
`docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md` as it existed at review
time. It is not the production helper, is not installed, and is not authorized
to operate on the live workspace.

The implemented layers are intentionally limited to pure, in-memory byte
processing:

- checked size arithmetic and explicit big-endian integers;
- the fixed 56-byte `HMG4V2` request frame and payload SHA-256 check;
- canonical TLV framing, ordering, scalar widths, and lexical path checks;
- exact request operation tag/type matrices;
- exact `RootIdentity` and 114-entry request-list structural checks;
- cross-field checks that are completely frozen in the current contract;
- canonical `HMG4A2` ACL, `HMG4X2` xattr-set, and `HMG4L2` symlink-target
  encoding, validation, and hashing; and
- canonical `HMG4B2` bundle-header, LIST-entry, table, alignment, gap, and
  per-blob integrity validation.

The canonical ACL codec enforces a defensive development ceiling of 1,024
entries. The current contract defines a 32-bit entry-count field but does not
freeze a production resource limit. Streams above this ceiling fail closed as
`HMG4V2_CANONICAL_BOUND_EXCEEDED`; this implementation choice is not a new wire
meaning or production authorization.

It has no production dispatcher, filesystem walker, transaction engine,
journal writer, response encoder, protected installer, or original-runtime
launcher. In particular, it cannot supply mutation authority.

The current contract does not yet freeze canonical binary schemas for the
policy, sealed plan, capability, quiescence, installation, and reproducible-
build evidence objects. It also does not freeze the production response
`diagnostic_code` registry, the full policy-dependent custody-leaf grammar, or
the executable self-identity/transport mechanism. These codecs therefore
perform syntax, canonical-encoding, and bounded integrity validation only. A
caller must not treat a successful result as policy equality, evidence
validation, runtime authority, or an acceptance result. In particular, the
xattr-set codec validates the frozen `HMG4X2` object but does not interpret an
xattr-policy object, whose canonical schema is not frozen by the current
contract.

Compile and run the native unit tests from the repository root:

```bash
/usr/bin/clang -std=c11 -Wall -Wextra -Werror \
  scripts/native/g4-l10-successor-v2/protocol_core.c \
  scripts/native/g4-l10-successor-v2/protocol_core_test.c \
  -o /tmp/hmg4v2-protocol-core-test
/tmp/hmg4v2-protocol-core-test
```

The repository-level protocol-core Node test builds in private temporary
directories, also runs AddressSanitizer/UndefinedBehaviorSanitizer over both
the unit corpus and 200,000 deterministic aligned/misaligned malformed inputs,
checks the core object's undefined-symbol surface, and compares two independent
optimized object builds byte-for-byte:

```bash
node --test scripts/g4-l10-native-helper-v2-protocol-core.test.mjs
```

The canonical/bundle Node test binds every reviewed source hash and the
contract hash, runs strict unit vectors, runs AddressSanitizer and
UndefinedBehaviorSanitizer over both unit corpora and deterministic 120,000-
case fuzz corpora, checks the production modules for ambient-authority APIs,
checks exact undefined-symbol surfaces, and compares independent optimized
object builds byte-for-byte:

```bash
node --test scripts/g4-l10-native-helper-v2-canonical-codecs.test.mjs
```
