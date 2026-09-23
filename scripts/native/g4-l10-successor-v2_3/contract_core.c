#include "contract_core.h"

#include <CommonCrypto/CommonDigest.h>
#include <limits.h>
#include <string.h>

const uint8_t hmg4v23_successor_sha256[32] = {
    0xbf, 0x0a, 0xbe, 0xd5, 0x9f, 0x8d, 0xb5, 0xbe,
    0x0e, 0xf8, 0x36, 0x57, 0x53, 0x0b, 0xc8, 0x1c,
    0xc9, 0x3d, 0x85, 0xc9, 0xae, 0x46, 0x64, 0x61,
    0x14, 0x2c, 0x06, 0x93, 0x3e, 0x56, 0x93, 0x20};
const uint8_t hmg4v23_predecessor_sha256[32] = {
    0xd7, 0xbb, 0x87, 0x55, 0xcb, 0xd8, 0xfb, 0x3a,
    0x7f, 0x4d, 0x70, 0x9d, 0x1e, 0xc2, 0x87, 0x9f,
    0x8a, 0xee, 0x4f, 0xa8, 0xb8, 0xad, 0x4c, 0xba,
    0xcf, 0xd7, 0xe5, 0x06, 0x8a, 0x9e, 0xeb, 0x5c};
const uint8_t hmg4v23_gate_a_sha256[32] = {
    0xee, 0xa8, 0x02, 0xda, 0xf1, 0x75, 0xc9, 0x23,
    0x51, 0x70, 0xe8, 0x75, 0x8c, 0x56, 0x4b, 0x52,
    0xbe, 0xf4, 0x37, 0x1a, 0xa4, 0x4b, 0x67, 0x46,
    0xa8, 0xd8, 0x9d, 0x23, 0x71, 0xc7, 0x93, 0xc8};

typedef struct {
  uint8_t magic[8];
  uint32_t first_kind;
  uint32_t last_kind;
  uint32_t kind_mask;
  uint64_t maximum_payload;
} authority_rule;

#define MAGIC6(a, b, c, d, e, f) {(a), (b), (c), (d), (e), (f), 0, 0}
#define MIB(value) (UINT64_C(value) * UINT64_C(1048576))

static const authority_rule authority_rules[] = {
    {MAGIC6('H','M','G','4','P','2'), 1, 1, 0, MIB(16)},
    {MAGIC6('H','M','G','4','N','2'), 1, 1, 0, MIB(16)},
    {MAGIC6('H','M','G','4','K','2'), 1, 2, 0, MIB(16)},
    {MAGIC6('H','M','G','4','F','2'), 1, 2, 0, MIB(4)},
    {MAGIC6('H','M','G','4','L','2'), 1, 1, 0, MIB(1)},
    {MAGIC6('H','M','G','4','L','2'), 2, 2, 0, MIB(16)},
    {MAGIC6('H','M','G','4','C','2'), 0, 0, (UINT32_C(1)<<1)|(UINT32_C(1)<<3), MIB(8)},
    {MAGIC6('H','M','G','4','S','2'), 0, 0, (UINT32_C(1)<<1)|(UINT32_C(1)<<3), MIB(2)},
    {MAGIC6('H','M','G','4','Q','2'), 1, 1, 0, UINT64_C(1073741824)},
    {MAGIC6('H','M','G','4','I','2'), 1, 1, 0, MIB(64)},
    {MAGIC6('H','M','G','4','U','2'), 1, 1, 0, MIB(64)},
    {MAGIC6('H','M','G','4','Y','2'), 1, 1, 0, MIB(1)},
    {MAGIC6('H','M','G','4','W','2'), 1, 1, 0, MIB(1)},
    {MAGIC6('H','M','G','4','Z','2'), 1, 1, 0, MIB(1)},
    {MAGIC6('H','M','G','4','E','2'), 1, 6, 0, MIB(16)},
    {MAGIC6('H','M','G','4','L','3'), 1, 1, 0, MIB(16)},
    {MAGIC6('H','M','G','4','G','2'), 1, 1, 0, MIB(128)},
    {MAGIC6('H','M','G','4','H','2'), 1, 2, 0, MIB(64)},
    {MAGIC6('H','M','G','4','M','2'), 1, 2, 0, MIB(64)}};

#define D(code_value, status_value, label) \
  {UINT32_C(code_value), UINT32_C(status_value), (label)}
static const hmg4v23_diagnostic diagnostics[] = {
    D(0x00000000,0,"SUCCESS"),
    D(0x00010001,5,"REQUEST_PAYLOAD_TRUNCATED"),
    D(0x00010002,5,"REQUEST_PAYLOAD_HASH_MISMATCH"),
    D(0x00010003,5,"NONCANONICAL_TLV"),
    D(0x00010004,5,"OPERATION_SCHEMA_MISMATCH"),
    D(0x00010005,5,"PROTOCOL_SPEC_MISMATCH"),
    D(0x00010006,5,"REQUEST_TRANSPORT_READ_POLL_OR_CLOCK_ERROR"),
    D(0x00010008,5,"REQUEST_TRAILING_OR_SECOND_FRAME"),
    D(0x00010009,5,"REQUEST_DEADLINE_EXCEEDED"),
    D(0x00020001,1,"HELPER_SELF_IDENTITY_MISMATCH"),
    D(0x00020002,1,"POLICY_MISMATCH"),
    D(0x00020003,1,"PLAN_MISMATCH"),
    D(0x00020004,1,"BUNDLE_MISMATCH"),
    D(0x00020005,1,"BUILD_RECEIPT_MISMATCH"),
    D(0x00020006,1,"INSTALL_RECEIPT_MISMATCH"),
    D(0x00020007,1,"ROOT_IDENTITY_MISMATCH"),
    D(0x00020008,1,"PARENT_IDENTITY_MISMATCH"),
    D(0x00020009,1,"PATH_ALLOWLIST_MISMATCH"),
    D(0x0002000a,1,"PREDECESSOR_SET_MISMATCH"),
    D(0x0002000b,1,"DESIRED_SET_MISMATCH"),
    D(0x0002000c,1,"XATTR_POLICY_MISMATCH"),
    D(0x0002000d,1,"QUIESCENCE_RECEIPT_MISMATCH"),
    D(0x0002000e,1,"COMPLIANT_HELPER_LOCK_BUSY"),
    D(0x0002000f,1,"CUSTODY_NAMESPACE_BLOCKER"),
    D(0x00020010,1,"CURRENT_SET_MISMATCH"),
    D(0x00020011,1,"AUTHORIZATION_MISMATCH"),
    D(0x00020012,1,"EVIDENCE_EXPIRED_OR_CLOCK_INVALID"),
    D(0x00020013,1,"PROTECTED_DOMAIN_PRECONDITION_FAILED"),
    D(0x00020014,1,"ACCEPTANCE_EFFECT_NONZERO"),
    D(0x00020015,1,"CHECKED_ARITHMETIC_OR_REPRESENTATION_FAILURE"),
    D(0x00020016,1,"MEMORY_ALLOCATION_FAILURE"),
    D(0x00020017,1,"SHA256_ENGINE_FAILURE"),
    D(0x00020018,1,"AUTHORITY_STREAM_IO_FAILURE"),
    D(0x00020019,1,"EVIDENCE_OBJECT_OPEN_IO_FAILURE"),
    D(0x0002001a,1,"PROTECTED_PARENT_OPEN_IO_FAILURE"),
    D(0x0002001b,1,"NAMESPACE_ENUMERATION_IO_FAILURE"),
    D(0x0002001c,1,"SYSTEM_LOCK_ACQUIRE_IO_FAILURE"),
    D(0x0002001d,1,"TRANSACTION_ENTROPY_IO_FAILURE"),
    D(0x0002001e,1,"TRANSACTION_ENTROPY_ALL_ZERO"),
    D(0x0002001f,1,"TRANSACTION_ID_COLLISION_EXHAUSTED"),
    D(0x00020020,1,"JOURNAL_EXCLUSIVE_CREATE_IO_FAILURE"),
    D(0x00030001,6,"COMPILETIME_CAPABILITY_MISSING"),
    D(0x00030002,6,"OS_OR_SDK_CAPABILITY_MISMATCH"),
    D(0x00030003,6,"MOUNT_CAPABILITY_MISMATCH"),
    D(0x00030004,6,"TARGET_CAPABILITY_RECEIPT_BLOCKED"),
    D(0x00030005,6,"SYSTEM_LOCK_CAPABILITY_RECEIPT_BLOCKED"),
    D(0x00030006,6,"NOFOLLOW_BENEATH_UNIQUE_UNSUPPORTED"),
    D(0x00030007,6,"RENAME_EXCL_UNSUPPORTED"),
    D(0x00030008,6,"DURABILITY_PRIMITIVE_UNSUPPORTED"),
    D(0x00030009,6,"FD_METADATA_PRIMITIVE_UNSUPPORTED"),
    D(0x0003000a,6,"FLOCK_CAPABILITY_UNSUPPORTED"),
    D(0x0003000b,6,"PROTECTED_WRITER_CAPABILITY_UNPROVEN"),
    D(0x00040001,3,"PARTIAL_BEGIN_JOURNAL"),
    D(0x00040002,3,"TORN_JOURNAL_TAIL"),
    D(0x00040003,3,"NONTERMINAL_APPLY"),
    D(0x00040004,3,"NONTERMINAL_RECOVERY"),
    D(0x00040005,3,"TERMINAL_INTENT_WITHOUT_RECEIPT"),
    D(0x00040006,3,"RECEIPT_WITHOUT_TERMINAL_RECORD"),
    D(0x00040008,3,"ROLLBACK_IN_PROGRESS"),
    D(0x00040009,3,"JOURNAL_APPEND_IO_FAILURE_PROVEN_NO_EFFECT"),
    D(0x0004000a,3,"TERMINAL_RECEIPT_CREATE_IO_FAILURE_PROVEN_NO_EFFECT"),
    D(0x00050001,4,"FOREIGN_OR_REPLACEMENT_INODE"),
    D(0x00050002,4,"UNACCOUNTED_MANAGED_INODE"),
    D(0x00050003,4,"AMBIGUOUS_RECOVERY_GRAPH"),
    D(0x00050004,4,"UNRESOLVED_NAMESPACE_SET"),
    D(0x00050005,4,"TERMINAL_JOURNAL_RECEIPT_MISMATCH"),
    D(0x00050006,4,"PROTECTED_DOMAIN_DRIFT_AFTER_BEGIN"),
    D(0x00050007,4,"CAPABILITY_DRIFT_AFTER_BEGIN"),
    D(0x00050008,4,"DURABILITY_STATE_UNCERTAIN"),
    D(0x00050009,4,"QUIESCENCE_DRIFT_AFTER_BEGIN"),
    D(0x0005000a,4,"JOURNAL_INVARIANT_FAILURE_AFTER_BEGIN"),
    D(0x0005000b,4,"POST_BEGIN_CHECKED_ARITHMETIC_OR_ALLOCATION_FAILURE"),
    D(0x0005000c,4,"POST_BEGIN_SHA256_OR_AUTHORITY_STREAM_IO_FAILURE"),
    D(0x0005000d,4,"POST_BEGIN_EVIDENCE_OBJECT_IO_FAILURE"),
    D(0x0005000e,4,"POST_BEGIN_PROTECTED_PARENT_IO_FAILURE"),
    D(0x0005000f,4,"POST_BEGIN_NAMESPACE_ENUMERATION_IO_FAILURE"),
    D(0x00050010,4,"TERMINAL_RECEIPT_INSPECTION_IO_FAILURE"),
    D(0x00050011,4,"POST_BEGIN_AUTHORITY_CLOCK_INVALID"),
    D(0x00050012,4,"UNRESOLVED_CHAIN_SET"),
    D(0x00050013,4,"JOURNAL_EXCLUSIVE_CREATE_EFFECT_UNCERTAIN"),
    D(0x00060001,2,"REFUSED_AFTER_BEGIN_BEFORE_FORMAL_MOVE"),
    D(0x00060002,2,"RECOVERY_FINISH_REFUSAL")};

static const hmg4v23_rollback_reason rollback_reasons[] = {
    {1, "FORWARD_MOVE_RESOLVED_NO_EFFECT_AFTER_PRIOR_EFFECT"},
    {2, "NEXT_FORWARD_PRECONDITION_FAILED_ALL_INODES_ACCOUNTED"},
    {3, "FINAL_LIVE_VERIFICATION_FAILED_ALL_INODES_ACCOUNTED"}};

static const hmg4v23_direction directions[] = {
    {1, 1, 3, UINT32_C(1)<<1, 0, "LIVE_TO_PREIMAGE_CUSTODY"},
    {2, 2, 1, (UINT32_C(1)<<0)|(UINT32_C(1)<<1), 0, "STAGE_CUSTODY_TO_LIVE"},
    {3, 1, 4, (UINT32_C(1)<<0)|(UINT32_C(1)<<1), 2, "INSTALLED_LIVE_TO_ROLLBACK_CUSTODY"},
    {4, 3, 1, UINT32_C(1)<<1, 0, "PREIMAGE_CUSTODY_TO_LIVE"}};

static const hmg4v23_xattr_limits xattr_limits = {
    64, 127, 4096, 65536, 524288};

int hmg4v23_checked_add_size(size_t left, size_t right, size_t *result) {
  if (result == NULL || left > SIZE_MAX - right) return 0;
  *result = left + right;
  return 1;
}

int hmg4v23_checked_mul_size(size_t left, size_t right, size_t *result) {
  if (result == NULL || (left != 0 && right > SIZE_MAX / left)) return 0;
  *result = left * right;
  return 1;
}

int hmg4v23_range_within(size_t offset, size_t length, size_t total) {
  return offset <= total && length <= total - offset;
}

uint16_t hmg4v23_read_u16_be(const uint8_t bytes[2]) {
  return (uint16_t)(((uint16_t)bytes[0] << 8) | (uint16_t)bytes[1]);
}

uint32_t hmg4v23_read_u32_be(const uint8_t bytes[4]) {
  return ((uint32_t)bytes[0] << 24) | ((uint32_t)bytes[1] << 16) |
         ((uint32_t)bytes[2] << 8) | (uint32_t)bytes[3];
}

uint64_t hmg4v23_read_u64_be(const uint8_t bytes[8]) {
  return ((uint64_t)hmg4v23_read_u32_be(bytes) << 32) |
         (uint64_t)hmg4v23_read_u32_be(bytes + 4);
}

void hmg4v23_write_u16_be(uint8_t bytes[2], uint16_t value) {
  bytes[0] = (uint8_t)(value >> 8);
  bytes[1] = (uint8_t)value;
}

void hmg4v23_write_u32_be(uint8_t bytes[4], uint32_t value) {
  bytes[0] = (uint8_t)(value >> 24);
  bytes[1] = (uint8_t)(value >> 16);
  bytes[2] = (uint8_t)(value >> 8);
  bytes[3] = (uint8_t)value;
}

void hmg4v23_write_u64_be(uint8_t bytes[8], uint64_t value) {
  bytes[0] = (uint8_t)(value >> 56);
  bytes[1] = (uint8_t)(value >> 48);
  bytes[2] = (uint8_t)(value >> 40);
  bytes[3] = (uint8_t)(value >> 32);
  bytes[4] = (uint8_t)(value >> 24);
  bytes[5] = (uint8_t)(value >> 16);
  bytes[6] = (uint8_t)(value >> 8);
  bytes[7] = (uint8_t)value;
}

hmg4v23_result hmg4v23_sha256(
    hmg4v23_span input,
    uint8_t digest[32]) {
  static const uint8_t empty = 0;
  const uint8_t *cursor = input.bytes;
  size_t remaining = input.length;
  CC_SHA256_CTX context;
  if (digest == NULL || (input.length != 0 && input.bytes == NULL)) {
    return HMG4V23_NULL_ARGUMENT;
  }
  if (cursor == NULL) cursor = &empty;
  if (CC_SHA256_Init(&context) != 1) return HMG4V23_PAYLOAD_HASH_MISMATCH;
  while (remaining != 0) {
    const size_t chunk = remaining > (size_t)UINT32_MAX
                             ? (size_t)UINT32_MAX
                             : remaining;
    if (CC_SHA256_Update(&context, cursor, (CC_LONG)chunk) != 1) {
      return HMG4V23_PAYLOAD_HASH_MISMATCH;
    }
    cursor += chunk;
    remaining -= chunk;
  }
  if (CC_SHA256_Final(digest, &context) != 1) {
    return HMG4V23_PAYLOAD_HASH_MISMATCH;
  }
  return HMG4V23_OK;
}

static const authority_rule *find_rule(const uint8_t magic[8], uint32_t kind) {
  size_t ordinal;
  for (ordinal = 0; ordinal < sizeof(authority_rules)/sizeof(authority_rules[0]); ++ordinal) {
    const authority_rule *rule = &authority_rules[ordinal];
    if (memcmp(rule->magic, magic, 8) != 0) continue;
    if (rule->kind_mask != 0) {
      if (kind < 32 && (rule->kind_mask & (UINT32_C(1) << kind)) != 0) return rule;
    } else if (kind >= rule->first_kind && kind <= rule->last_kind) {
      return rule;
    }
  }
  return NULL;
}

static int magic_exists(const uint8_t magic[8]) {
  size_t ordinal;
  for (ordinal = 0; ordinal < sizeof(authority_rules)/sizeof(authority_rules[0]); ++ordinal) {
    if (memcmp(authority_rules[ordinal].magic, magic, 8) == 0) return 1;
  }
  return 0;
}

hmg4v23_result hmg4v23_parse_authority_header(
    hmg4v23_span header_bytes,
    hmg4v23_authority_header *result) {
  const authority_rule *rule;
  if (result == NULL || (header_bytes.bytes == NULL && header_bytes.length != 0)) return HMG4V23_NULL_ARGUMENT;
  if (header_bytes.length != HMG4V23_AUTHORITY_HEADER_SIZE) return HMG4V23_TRUNCATED_HEADER;
  memcpy(result->magic, header_bytes.bytes, 8);
  if (!magic_exists(result->magic)) return HMG4V23_BAD_MAGIC;
  if (hmg4v23_read_u32_be(header_bytes.bytes + 8) != 2) return HMG4V23_BAD_VERSION;
  result->kind = hmg4v23_read_u32_be(header_bytes.bytes + 12);
  rule = find_rule(result->magic, result->kind);
  if (rule == NULL) return HMG4V23_BAD_KIND;
  result->payload_length = hmg4v23_read_u64_be(header_bytes.bytes + 16);
  if (result->payload_length > rule->maximum_payload) return HMG4V23_PAYLOAD_TOO_LARGE;
  memcpy(result->payload_sha256, header_bytes.bytes + 24, 32);
  return HMG4V23_OK;
}

hmg4v23_result hmg4v23_validate_authority_envelope(
    hmg4v23_span frame_bytes,
    hmg4v23_authority_envelope *result) {
  hmg4v23_result parsed;
  size_t total;
  uint8_t digest[CC_SHA256_DIGEST_LENGTH];
  if (result == NULL || (frame_bytes.bytes == NULL && frame_bytes.length != 0)) return HMG4V23_NULL_ARGUMENT;
  if (frame_bytes.length < HMG4V23_AUTHORITY_HEADER_SIZE) return HMG4V23_TRUNCATED_HEADER;
  parsed = hmg4v23_parse_authority_header((hmg4v23_span){frame_bytes.bytes, HMG4V23_AUTHORITY_HEADER_SIZE}, &result->header);
  if (parsed != HMG4V23_OK) return parsed;
  if (result->header.payload_length > (uint64_t)SIZE_MAX) return HMG4V23_SIZE_OVERFLOW;
  if (!hmg4v23_checked_add_size(HMG4V23_AUTHORITY_HEADER_SIZE, (size_t)result->header.payload_length, &total)) return HMG4V23_SIZE_OVERFLOW;
  if (total != frame_bytes.length) return HMG4V23_FRAME_LENGTH_MISMATCH;
  result->payload.bytes = frame_bytes.bytes + HMG4V23_AUTHORITY_HEADER_SIZE;
  result->payload.length = (size_t)result->header.payload_length;
  if (CC_SHA256(result->payload.bytes, (CC_LONG)result->payload.length, digest) == NULL) return HMG4V23_PAYLOAD_HASH_MISMATCH;
  if (memcmp(digest, result->header.payload_sha256, sizeof(digest)) != 0) return HMG4V23_PAYLOAD_HASH_MISMATCH;
  return HMG4V23_OK;
}

int hmg4v23_tlv_type_site_is_legal(uint8_t type, uint16_t tag) {
  if (type >= 0x01 && type <= 0x0c) return 1;
  if (type == 0x0d) return tag == 0x790a || tag == 0x300b;
  if (type == 0x0e) return tag == 0x7a04 || tag == 0x7fd3;
  if (type == 0x0f) return tag == 0x3030 || tag == 0x7f39 || tag == 0x80c4;
  if (type == 0x10) {
    return tag == 0x6107 || tag == 0x6143 || tag == 0x6152 ||
           tag == 0x61a4 || tag == 0x8b1a || tag == 0x9302 ||
           tag == 0x9422 || tag == 0x95e9 || tag == 0x9662;
  }
  return 0;
}

const hmg4v23_xattr_limits *hmg4v23_xattr_policy_limits(void) { return &xattr_limits; }

const hmg4v23_diagnostic *hmg4v23_diagnostic_at(size_t ordinal) {
  return ordinal < HMG4V23_DIAGNOSTIC_COUNT ? &diagnostics[ordinal] : NULL;
}

hmg4v23_result hmg4v23_lookup_diagnostic(uint32_t code, const hmg4v23_diagnostic **result) {
  size_t low = 0, high = HMG4V23_DIAGNOSTIC_COUNT;
  if (result == NULL) return HMG4V23_NULL_ARGUMENT;
  while (low < high) {
    size_t mid = low + (high - low) / 2;
    if (diagnostics[mid].code == code) { *result = &diagnostics[mid]; return HMG4V23_OK; }
    if (diagnostics[mid].code < code) low = mid + 1; else high = mid;
  }
  *result = NULL;
  return HMG4V23_UNKNOWN_DIAGNOSTIC;
}

hmg4v23_result hmg4v23_validate_diagnostic_status(uint32_t code, uint32_t status) {
  const hmg4v23_diagnostic *diagnostic = NULL;
  hmg4v23_result found = hmg4v23_lookup_diagnostic(code, &diagnostic);
  if (found != HMG4V23_OK) return found;
  return diagnostic->status == status ? HMG4V23_OK : HMG4V23_DIAGNOSTIC_STATUS_MISMATCH;
}

const hmg4v23_rollback_reason *hmg4v23_rollback_reason_at(size_t ordinal) {
  return ordinal < HMG4V23_ROLLBACK_REASON_COUNT ? &rollback_reasons[ordinal] : NULL;
}

hmg4v23_result hmg4v23_lookup_rollback_reason(uint32_t reason, const hmg4v23_rollback_reason **result) {
  if (result == NULL) return HMG4V23_NULL_ARGUMENT;
  if (reason >= 1 && reason <= HMG4V23_ROLLBACK_REASON_COUNT) { *result = &rollback_reasons[reason - 1]; return HMG4V23_OK; }
  *result = NULL;
  return HMG4V23_UNKNOWN_ROLLBACK_REASON;
}

const hmg4v23_direction *hmg4v23_direction_at(size_t ordinal) {
  return ordinal < HMG4V23_DIRECTION_COUNT ? &directions[ordinal] : NULL;
}

hmg4v23_result hmg4v23_lookup_direction(uint32_t direction, const hmg4v23_direction **result) {
  if (result == NULL) return HMG4V23_NULL_ARGUMENT;
  if (direction >= 1 && direction <= HMG4V23_DIRECTION_COUNT) { *result = &directions[direction - 1]; return HMG4V23_OK; }
  *result = NULL;
  return HMG4V23_UNKNOWN_DIRECTION;
}

static int single_bit(uint16_t value) { return value != 0 && (value & (uint16_t)(value - 1)) == 0; }

hmg4v23_result hmg4v23_poll_decide(
    const hmg4v23_poll_symbols *symbols,
    hmg4v23_poll_endpoint endpoint,
    int post_at_or_after_deadline,
    int poll_return,
    int poll_errno,
    uint16_t revents,
    hmg4v23_poll_decision *decision) {
  uint16_t known;
  uint16_t values[5];
  size_t left, right;
  if (symbols == NULL || decision == NULL) return HMG4V23_NULL_ARGUMENT;
  if (endpoint != HMG4V23_POLL_ENDPOINT_REQUEST && endpoint != HMG4V23_POLL_ENDPOINT_RESPONSE) return HMG4V23_BAD_POLL_ENDPOINT;
  values[0]=symbols->pollin; values[1]=symbols->pollout; values[2]=symbols->pollerr; values[3]=symbols->pollhup; values[4]=symbols->pollnval;
  for (left=0; left<5; ++left) {
    if (!single_bit(values[left])) return HMG4V23_BAD_POLL_SYMBOLS;
    for (right=left+1; right<5; ++right) if (values[left] == values[right]) return HMG4V23_BAD_POLL_SYMBOLS;
  }
  known = (uint16_t)(values[0]|values[1]|values[2]|values[3]|values[4]);
  if (post_at_or_after_deadline) { *decision = HMG4V23_POLL_DEADLINE; return HMG4V23_OK; }
  if (poll_return <= 0 && revents != 0) { *decision = HMG4V23_POLL_TRANSPORT_ERROR; return HMG4V23_OK; }
  if (poll_return == -1) {
    *decision = poll_errno == symbols->eintr_value ? HMG4V23_POLL_AGAIN : HMG4V23_POLL_TRANSPORT_ERROR;
    return HMG4V23_OK;
  }
  if (poll_return == 0) { *decision = HMG4V23_POLL_AGAIN; return HMG4V23_OK; }
  if (poll_return != 1 || (revents & (uint16_t)~known) != 0) { *decision = HMG4V23_POLL_TRANSPORT_ERROR; return HMG4V23_OK; }
  if (endpoint == HMG4V23_POLL_ENDPOINT_REQUEST) {
    if ((revents & symbols->pollout) != 0 || (revents & symbols->pollnval) != 0 || (revents & symbols->pollerr) != 0) *decision = HMG4V23_POLL_TRANSPORT_ERROR;
    else if (revents == symbols->pollin) *decision = HMG4V23_POLL_REQUEST_RETRY_READ;
    else if (revents == symbols->pollhup) *decision = HMG4V23_POLL_REQUEST_EOF_READ;
    else if (revents == (uint16_t)(symbols->pollin|symbols->pollhup)) *decision = HMG4V23_POLL_REQUEST_DRAIN_READ;
    else *decision = HMG4V23_POLL_TRANSPORT_ERROR;
  } else {
    if ((revents & symbols->pollin) != 0 || (revents & symbols->pollnval) != 0 || (revents & symbols->pollerr) != 0 || (revents & symbols->pollhup) != 0) *decision = HMG4V23_POLL_TRANSPORT_ERROR;
    else if (revents == symbols->pollout) *decision = HMG4V23_POLL_RESPONSE_RETRY_WRITE;
    else *decision = HMG4V23_POLL_TRANSPORT_ERROR;
  }
  return HMG4V23_OK;
}

const char *hmg4v23_result_name(hmg4v23_result result) {
  static const char *names[] = {"OK","NULL_ARGUMENT","TRUNCATED_HEADER","BAD_MAGIC","BAD_VERSION","BAD_KIND","PAYLOAD_TOO_LARGE","SIZE_OVERFLOW","FRAME_LENGTH_MISMATCH","PAYLOAD_HASH_MISMATCH","BAD_TLV_TYPE_SITE","UNKNOWN_DIAGNOSTIC","DIAGNOSTIC_STATUS_MISMATCH","UNKNOWN_ROLLBACK_REASON","UNKNOWN_DIRECTION","BAD_POLL_SYMBOLS","BAD_POLL_ENDPOINT"};
  size_t ordinal = (size_t)result;
  return ordinal < sizeof(names)/sizeof(names[0]) ? names[ordinal] : "UNKNOWN_RESULT";
}
