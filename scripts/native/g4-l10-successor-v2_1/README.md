# Grade 4 Lesson 10 native helper v2.1 production source workspace

This no-clobber directory is bound to the frozen successor security contract
and its passing Gate-A companion:

- successor SHA-256: `170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab`
- predecessor SHA-256: `77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`
- Gate-A companion SHA-256: `7fa23b8b5c4506e9e519c2bc22d063445491295bab27ec433cf6749ee2f70123`

The sibling `g4-l10-successor-v2` codecs remain byte-preserved,
predecessor-bound development artifacts. They are not relabeled or treated as
production authority.

The current v2.1 implementation increments are `contract_core.c/.h`,
`canonical_tlv.c/.h`, and `request_schema.c/.h`. They are pure,
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
dispatcher, request reader, filesystem walker, self-identity bootstrap, journal
writer, installer, signing path, original-runtime launcher, apply call graph,
or recover call graph. They cannot mutate a fixture or protected namespace.

Run the workspace-only, nonprivileged harness from the repository root:

```bash
node --test scripts/g4-l10-native-helper-v2_1-contract-core.test.mjs
node --test scripts/g4-l10-native-helper-v2_1-canonical-tlv.test.mjs
node --test scripts/g4-l10-native-helper-v2_1-request-schema.test.mjs
node --test scripts/g4-l10-native-helper-v2_1-request-transport-core.test.mjs
```

A passing result has zero acceptance effect and is not Gate B, protected
installation authority, runtime authority, promotion, or publication.
