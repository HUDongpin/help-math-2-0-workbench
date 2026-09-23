# Grade 4 Lesson 10 native helper v2.3 production source workspace

This no-clobber directory is bound to the frozen successor security contract
and its passing Gate-A companion:

- successor SHA-256: `bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320`
- direct predecessor SHA-256: `d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c`
- root predecessor SHA-256: `77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`
- Gate-A companion SHA-256: `eea802daf175c9235170e8758c564b52bef4371aa44b6746a8d89d2371c793c8`

The sibling `g4-l10-successor-v2` and `g4-l10-successor-v2_1` codecs remain
byte-preserved, predecessor-bound development artifacts. They are not relabeled
or treated as production authority.

The inherited v2.3 implementation increments are `contract_core.c/.h`,
`canonical_tlv.c/.h`, `request_schema.c/.h`, and
`request_transport_core.c/.h`. They are pure,
allocation-free foundations for the production helper. The contract core
freezes:

- the successor, predecessor, and Gate-A byte identities;
- the 56-byte authority-envelope framing and every top-level magic/kind/payload
  ceiling;
- the four successor TLV type-site allowlists;
- the fixed xattr bounds;
- the complete 82-entry diagnostic code/status registry, including permanent
  holes `00010007` and `00040007`;
- the three rollback reasons;
- the four transition directions, including direction 1
  `LIVE_TO_PREIMAGE_CUSTODY`; and
- the request/response 21-row poll precedence as a pure decision function.

The canonical TLV layer additionally implements:

- strict eight-byte TLV framing, reserved-byte, ordering, duplicate, type-site,
  scalar-width, boolean, and nonzero-SHA defaults;
- data-driven exact field schemas with required/optional tags, numeric and
  length bounds, the successor BYTES override, recursively validated STRUCTs,
  count-bounded LIST members, and a caller-declared finite depth;
- fail-closed authority-path callbacks, so lexical parsing never grants path
  authority by itself;
- all seven exact `SAFE_CUSTODY_LEAF` alternatives and the 000..113 managed
  index grammar;
- exact evidence role/hash paths, fixture roots, fixture attempts, and fixture
  claims; and
- the four successor path types at their closed legal tag sites.

The canonical-object and xattr-policy layers additionally implement:

- exact canonical predecessor-format HMG4A2 ACL, HMG4X2 xattr-set, and HMG4L2
  symlink-target encoding, validation, bounds, and SHA-256;
- the frozen xattr bounds of 64 rules, 127 name bytes, 4,096 value bytes,
  65,536 aggregate value bytes, and 524,288 stream bytes; and
- the complete HMG4Y2 kind-1 payload, including strict name order, contiguous
  rule ordinals, exact-set/empty-set semantics, zero acceptance-effect mask,
  and recomputation of the bound canonical HMG4X2 stream hash.

The HMG4B2 bundle layer validates the fixed 96-byte header, exactly 114
canonical bundle entries, table/data/blob hashes, 4-KiB alignment, range and
gap rules, exact zero padding, duplicate/case-colliding paths, and the frozen
16-MiB table, 64-GiB data-region, and 4-GiB per-blob ceilings. It returns only
immutable in-memory views and has no file or mutation API.

The HMG4R2 response codec additionally implements:

- exact 56-byte response framing, canonical ascending TLVs, the 16-MiB
  response-payload ceiling, payload/frame SHA-256, and fixed status-to-exit
  mapping;
- every operation/status field-presence row, including the successor's
  explicitly nonterminal status-4 diagnostic form and the separate durable
  manual-terminal status-4 form;
- the complete 82-code diagnostic/status registry, capability-state rules,
  current-state zero-sentinel boundary, and terminal-state/status mapping; and
- transaction-bound journal and terminal-receipt custody leaves whose lowercase
  transaction IDs and digest components equal the supplied sequence-zero and
  terminal-receipt preimages.

The response codec is a pure encoder/validator. It does not decide a diagnostic,
construct a journal or receipt, attest the supplied sequence-zero context, stop
filesystem activity, or write FD 1. Those call-graph and transport obligations
remain in later production layers.

The Darwin anonymous-pipe transport adapter now binds the pure transport
decisions to the selected SDK calls. After the separate two-pass startup-FD
attestation, it installs and reads back process-local `SIGPIPE` ignore state,
then:

- rechecks exact nonblocking direction flags immediately before every
  `read`/`write`/`poll`;
- applies one checked absolute `CLOCK_MONOTONIC` deadline to the complete
  request and another to the complete response, with post-call expiry taking
  precedence over every syscall result;
- retains the exact 56-byte header and bounded payload, requires the one-byte
  EOF probe, and separates unframed header failure from all post-header framed
  diagnostics;
- permits on FD 2 only the fixed 21-byte invalid-header token, with a separate
  100-ms deadline, `EINTR`-only retry, no poll, and immediate abandonment on
  partial/zero/error outcomes; and
- validates the one complete HMG4R2 frame before FD-1 emission, handles short
  writes and `EAGAIN` through the frozen poll matrix, and classifies every
  response transport failure as exit 74 with no second frame.

The production object has no caller-supplied syscall table. Deterministic
fault injection exists only when the source is compiled with the test-only
`HMG4V23_TRANSPORT_TESTING` definition. The real-exec harness uses three
distinct anonymous pipes and the production startup attestation; it is a
synthetic transport fixture, not an original-runtime process.

The helper never parses Markdown at runtime. Later source layers must compile
the frozen authority-object schemas and contextual equality/allowlist rules
into C tables and callbacks that consume this validator.

The request-schema layer compiles the complete predecessor request,
`RootIdentity`, and 114-member `Entry` schemas together with the successor
operation amendments. It requires `0023/0024` for every operation,
`0025/0026` only for apply, `0027/0028` for verify/apply/recover, and `002b`
only for recover. It also checks the successor specification hash, exact
approved root, all 114 exact managed paths, Entry indices/role order/states,
zero-hash exceptions, desired bundle ranges, transition counts, custody
transaction/digest bindings, and apply/recover evidence role/hash paths.
Canonical and operation-schema validation precede the protocol-spec equality;
exact authority-path comparisons occur only after that equality, preserving
the contract's diagnostic precedence.

The Darwin startup-FD layer implements the shared
`PIDLISTFDS_CAPACITY_V1` admission rule. In particular, the positive size query
is treated as a capacity estimate: a positive aligned read below the enlarged
capacity is complete even when it is shorter than the query estimate. The
same module requires two consecutive normalized passes within one shared
eight-attempt budget and validates exactly three anonymous, nonblocking,
direction-correct, pairwise nonaliased pipe endpoints. It emits no wire bytes
and opens no path.

The syscall-free `request_transport_core.c/.h` layer implements the exact
56-byte `HMG4V2` header with the successor-narrowed 1-MiB payload cap, complete
frame/payload hashes, checked nanosecond/deadline arithmetic, ceiling poll
timeouts capped at `INT_MAX`, and the post-sample-precedence decisions for
header/payload/EOF reads, response writes, and the one fixed 21-byte diagnostic
token. It does not attest FDs, call `read`/`write`/`poll`, install SIGPIPE
handling, or emit a frame; those SDK-bound syscall and self-identity layers
remain required.

Authority-envelope or generic schema success is not authority-object success.
The complete policy, plan, receipt, authorization, shared-STRUCT, contextual
equality, and derived-hash registries must succeed in later production layers
before an authority object can be consumed. These increments have no `main`,
dispatcher, filesystem walker, self-identity bootstrap, journal
writer, installer, signing path, original-runtime launcher, apply call graph,
or recover call graph. They cannot mutate a fixture or protected namespace.

Run the workspace-only, nonprivileged harnesses from the repository root. They
compile only into private temporary directories and never invoke protected
installation, original runtime, apply, or recover:

```bash
node --test scripts/g4-l10-native-helper-v2_3-contract-core.test.mjs
node --test scripts/g4-l10-native-helper-v2_3-canonical-tlv.test.mjs
node --test scripts/g4-l10-native-helper-v2_3-request-schema.test.mjs
node --test scripts/g4-l10-native-helper-v2_3-request-transport-core.test.mjs
node --test scripts/g4-l10-native-helper-v2_3-darwin-startup-fd.test.mjs
node --test scripts/g4-l10-native-helper-v2_3-canonical-objects-xattr-policy.test.mjs
node --test scripts/g4-l10-native-helper-v2_3-bundle-codec.test.mjs
node --test scripts/g4-l10-native-helper-v2_3-response-codec.test.mjs
node --test scripts/g4-l10-native-helper-v2_3-darwin-pipe-transport.test.mjs
```

A passing result has zero acceptance effect and is not Gate B, protected
installation authority, runtime authority, promotion, or publication.
