#include "request_schema.h"

#include <limits.h>
#include <string.h>

#define RULE(tag_value, type_value)                                           \
  {(tag_value), (type_value), 0, 0, 0, 0, 0, 0, 0, 0, NULL}
#define RULE_FLAGS(tag_value, type_value, flag_value)                         \
  {(tag_value), (type_value), 0, (flag_value), 0, 0, 0, 0, 0, 0, NULL}
#define RULE_LENGTH(tag_value, type_value, minimum, maximum)                  \
  {(tag_value), (type_value), 0, HMG4V23_FIELD_LENGTH_RANGE,                  \
   (minimum), (maximum), 0, 0, 0, 0, NULL}
#define RULE_NUMERIC(tag_value, type_value, minimum, maximum)                 \
  {(tag_value), (type_value), 0, HMG4V23_FIELD_NUMERIC_RANGE,                 \
   0, 0, (minimum), (maximum), 0, 0, NULL}
#define RULE_STRUCT(tag_value, nested)                                        \
  {(tag_value), HMG4V23_TLV_STRUCT, 0, 0, 0, 0, 0, 0, 0, 0, (nested)}
#define RULE_LIST(tag_value, minimum, maximum, nested)                        \
  {(tag_value), HMG4V23_TLV_LIST, 0, HMG4V23_FIELD_LIST_COUNT_RANGE,          \
   0, 0, 0, 0, (minimum), (maximum), (nested)}

static const hmg4v23_tlv_field_rule root_rules[] = {
    RULE(0x0201, HMG4V23_TLV_U64),
    RULE(0x0202, HMG4V23_TLV_U64),
    RULE(0x0203, HMG4V23_TLV_U32),
    RULE(0x0204, HMG4V23_TLV_U32),
    RULE_NUMERIC(0x0205, HMG4V23_TLV_U32, 0, 4095),
    RULE(0x0206, HMG4V23_TLV_U32),
    RULE_LENGTH(0x0207, HMG4V23_TLV_BYTES, 16, 16),
    RULE(0x0208, HMG4V23_TLV_SHA256),
    RULE(0x0209, HMG4V23_TLV_APPROVED_ABS_ROOT_PATH)};

static const hmg4v23_tlv_schema root_schema = {
    root_rules, sizeof(root_rules) / sizeof(root_rules[0]), 3};

static const hmg4v23_tlv_field_rule entry_rules[] = {
    RULE_NUMERIC(0x0101, HMG4V23_TLV_U32, 0, 113),
    RULE_NUMERIC(0x0102, HMG4V23_TLV_U32, 1, 2),
    RULE(0x0103, HMG4V23_TLV_POLICY_REL_PATH),
    RULE_NUMERIC(0x0104, HMG4V23_TLV_U32, 0, 1),
    RULE(0x0105, HMG4V23_TLV_U64),
    RULE_FLAGS(0x0106, HMG4V23_TLV_SHA256,
               HMG4V23_FIELD_ALLOW_ZERO_SHA256),
    RULE(0x0107, HMG4V23_TLV_U64),
    RULE(0x0108, HMG4V23_TLV_U64),
    RULE(0x0109, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x010a, HMG4V23_TLV_U32, 0, 4095),
    RULE(0x010b, HMG4V23_TLV_U32),
    RULE(0x010c, HMG4V23_TLV_U32),
    RULE(0x010d, HMG4V23_TLV_U32),
    RULE(0x010e, HMG4V23_TLV_SHA256),
    RULE(0x010f, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x0110, HMG4V23_TLV_U32, 1, 1)};

static const hmg4v23_tlv_schema entry_schema = {
    entry_rules, sizeof(entry_rules) / sizeof(entry_rules[0]), 3};

#define COMMON_0001_000D                                                    \
    RULE(0x0001, HMG4V23_TLV_SHA256),                                      \
    RULE_NUMERIC(0x0002, HMG4V23_TLV_U32, 2, 2),                           \
    RULE(0x0003, HMG4V23_TLV_SHA256),                                      \
    RULE(0x0004, HMG4V23_TLV_SHA256),                                      \
    RULE(0x0005, HMG4V23_TLV_SHA256),                                      \
    RULE(0x0006, HMG4V23_TLV_SHA256),                                      \
    RULE_STRUCT(0x0007, &root_schema),                                     \
    RULE(0x0008, HMG4V23_TLV_SHA256),                                      \
    RULE(0x0009, HMG4V23_TLV_SHA256),                                      \
    RULE(0x000a, HMG4V23_TLV_SHA256),                                      \
    RULE_NUMERIC(0x000b, HMG4V23_TLV_U64, 0, 0),                           \
    RULE_NUMERIC(0x000c, HMG4V23_TLV_U32, 114, 114),                       \
    RULE_LIST(0x000d, 114, 114, &entry_schema)

static const hmg4v23_tlv_field_rule probe_rules[] = {
    RULE(0x0001, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x0002, HMG4V23_TLV_U32, 2, 2),
    RULE(0x0003, HMG4V23_TLV_SHA256),
    RULE(0x0004, HMG4V23_TLV_SHA256),
    RULE_STRUCT(0x0007, &root_schema),
    RULE(0x0023, HMG4V23_TLV_SHA256),
    RULE(0x0024, HMG4V23_TLV_SHA256)};

static const hmg4v23_tlv_field_rule verify_live_rules[] = {
    COMMON_0001_000D,
    RULE_NUMERIC(0x000e, HMG4V23_TLV_U32, 1, 1),
    RULE(0x0016, HMG4V23_TLV_SHA256),
    RULE(0x0017, HMG4V23_TLV_SHA256),
    RULE(0x0018, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x0019, HMG4V23_TLV_U32, 1, 2),
    RULE(0x001a, HMG4V23_TLV_SHA256),
    RULE(0x0023, HMG4V23_TLV_SHA256),
    RULE(0x0024, HMG4V23_TLV_SHA256),
    RULE(0x0027, HMG4V23_TLV_U32),
    RULE(0x0028, HMG4V23_TLV_SHA256)};

static const hmg4v23_tlv_field_rule verify_receipt_rules[] = {
    COMMON_0001_000D,
    RULE_NUMERIC(0x000e, HMG4V23_TLV_U32, 2, 2),
    RULE(0x000f, HMG4V23_TLV_SAFE_CUSTODY_LEAF),
    RULE(0x0010, HMG4V23_TLV_SHA256),
    RULE(0x0016, HMG4V23_TLV_SHA256),
    RULE(0x0017, HMG4V23_TLV_SHA256),
    RULE(0x0018, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x0019, HMG4V23_TLV_U32, 1, 2),
    RULE(0x001a, HMG4V23_TLV_SHA256),
    RULE(0x0023, HMG4V23_TLV_SHA256),
    RULE(0x0024, HMG4V23_TLV_SHA256),
    RULE(0x0027, HMG4V23_TLV_U32),
    RULE(0x0028, HMG4V23_TLV_SHA256)};

static const hmg4v23_tlv_field_rule apply_rules[] = {
    COMMON_0001_000D,
    RULE(0x0016, HMG4V23_TLV_SHA256),
    RULE(0x0017, HMG4V23_TLV_SHA256),
    RULE(0x0018, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x0019, HMG4V23_TLV_U32, 2, 2),
    RULE(0x001a, HMG4V23_TLV_SHA256),
    RULE(0x001b, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x001c, HMG4V23_TLV_U32, 114, 228),
    RULE(0x001d, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x001e, HMG4V23_TLV_U32, 114, 228),
    RULE(0x0023, HMG4V23_TLV_SHA256),
    RULE(0x0024, HMG4V23_TLV_SHA256),
    RULE(0x0025, HMG4V23_TLV_SHA256),
    RULE(0x0026, HMG4V23_TLV_APPROVED_EVIDENCE_REL_PATH),
    RULE(0x0027, HMG4V23_TLV_U32),
    RULE(0x0028, HMG4V23_TLV_SHA256)};

static const hmg4v23_tlv_field_rule recover_rules[] = {
    COMMON_0001_000D,
    RULE_LENGTH(0x0011, HMG4V23_TLV_BYTES, 32, 32),
    RULE(0x0012, HMG4V23_TLV_SAFE_CUSTODY_LEAF),
    RULE(0x0013, HMG4V23_TLV_SHA256),
    RULE(0x0014, HMG4V23_TLV_APPROVED_EVIDENCE_REL_PATH),
    RULE(0x0015, HMG4V23_TLV_SHA256),
    RULE(0x0016, HMG4V23_TLV_SHA256),
    RULE(0x0017, HMG4V23_TLV_SHA256),
    RULE(0x0018, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x0019, HMG4V23_TLV_U32, 2, 2),
    RULE(0x001a, HMG4V23_TLV_SHA256),
    RULE(0x001b, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x001c, HMG4V23_TLV_U32, 114, 228),
    RULE(0x001d, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x001e, HMG4V23_TLV_U32, 114, 228),
    RULE_NUMERIC(0x001f, HMG4V23_TLV_U32, 1, 4),
    RULE(0x0020, HMG4V23_TLV_SHA256),
    RULE_NUMERIC(0x0021, HMG4V23_TLV_U32, 0, 228),
    RULE_FLAGS(0x0022, HMG4V23_TLV_SHA256,
               HMG4V23_FIELD_ALLOW_ZERO_SHA256),
    RULE(0x0023, HMG4V23_TLV_SHA256),
    RULE(0x0024, HMG4V23_TLV_SHA256),
    RULE(0x0027, HMG4V23_TLV_U32),
    RULE(0x0028, HMG4V23_TLV_SHA256),
    RULE(0x002b, HMG4V23_TLV_SHA256)};

static const hmg4v23_tlv_schema probe_schema = {
    probe_rules, sizeof(probe_rules) / sizeof(probe_rules[0]), 3};
static const hmg4v23_tlv_schema verify_live_schema = {
    verify_live_rules, sizeof(verify_live_rules) / sizeof(verify_live_rules[0]), 3};
static const hmg4v23_tlv_schema verify_receipt_schema = {
    verify_receipt_rules,
    sizeof(verify_receipt_rules) / sizeof(verify_receipt_rules[0]), 3};
static const hmg4v23_tlv_schema apply_schema = {
    apply_rules, sizeof(apply_rules) / sizeof(apply_rules[0]), 3};
static const hmg4v23_tlv_schema recover_schema = {
    recover_rules, sizeof(recover_rules) / sizeof(recover_rules[0]), 3};

typedef struct {
  const hmg4v23_request_path_authority *authority;
  size_t entry_path_ordinal;
  size_t root_path_count;
  int mismatch_is_root;
  int mismatch_is_entry;
} request_path_context;

static int span_pointer_is_valid(hmg4v23_span span) {
  return span.length == 0 || span.bytes != NULL;
}

static int span_equal(hmg4v23_span left, hmg4v23_span right) {
  return left.length == right.length &&
         (left.length == 0 || memcmp(left.bytes, right.bytes, left.length) == 0);
}

static uint8_t ascii_lower(uint8_t value) {
  return value >= (uint8_t)'A' && value <= (uint8_t)'Z'
             ? (uint8_t)(value + ((uint8_t)'a' - (uint8_t)'A'))
             : value;
}

static int spans_ascii_lower_equal(hmg4v23_span left, hmg4v23_span right) {
  size_t index;
  if (left.length != right.length) return 0;
  for (index = 0; index < left.length; ++index) {
    if (ascii_lower(left.bytes[index]) != ascii_lower(right.bytes[index])) return 0;
  }
  return 1;
}

static int bytes_all_zero(const uint8_t *bytes, size_t length) {
  size_t index;
  if (bytes == NULL) return 0;
  for (index = 0; index < length; ++index) {
    if (bytes[index] != 0) return 0;
  }
  return 1;
}

static uint8_t lower_hex_digit(uint8_t value) {
  return value < 10 ? (uint8_t)((uint8_t)'0' + value)
                    : (uint8_t)((uint8_t)'a' + (uint8_t)(value - 10));
}

static int hex_span_equals_bytes(hmg4v23_span hex, const uint8_t *bytes,
                                 size_t byte_count) {
  size_t index;
  if (bytes == NULL || hex.length != byte_count * 2) return 0;
  for (index = 0; index < byte_count; ++index) {
    if (hex.bytes[index * 2] != lower_hex_digit((uint8_t)(bytes[index] >> 4)) ||
        hex.bytes[index * 2 + 1] !=
            lower_hex_digit((uint8_t)(bytes[index] & 0x0f))) {
      return 0;
    }
  }
  return 1;
}

static hmg4v23_tlv_result request_path_authorizer(
    void *opaque, uint16_t tag, uint8_t type, hmg4v23_span value) {
  request_path_context *context = (request_path_context *)opaque;
  if (context == NULL || context->authority == NULL) {
    return HMG4V23_TLV_PATH_CONTEXT_REJECTED;
  }
  if (tag == 0x0209 && type == HMG4V23_TLV_APPROVED_ABS_ROOT_PATH) {
    ++context->root_path_count;
    if (!span_equal(value, context->authority->approved_root_path)) {
      context->mismatch_is_root = 1;
    }
    return HMG4V23_TLV_OK;
  }
  if (tag == 0x0103 && type == HMG4V23_TLV_POLICY_REL_PATH) {
    if (context->entry_path_ordinal >= context->authority->managed_path_count ||
        !span_equal(value,
                    context->authority->managed_paths[context->entry_path_ordinal])) {
      context->mismatch_is_entry = 1;
    }
    ++context->entry_path_ordinal;
    return HMG4V23_TLV_OK;
  }
  if ((tag == 0x000f || tag == 0x0012) &&
      type == HMG4V23_TLV_SAFE_CUSTODY_LEAF) {
    return HMG4V23_TLV_OK;
  }
  if ((tag == 0x0014 || tag == 0x0026) &&
      type == HMG4V23_TLV_APPROVED_EVIDENCE_REL_PATH) {
    return HMG4V23_TLV_OK;
  }
  return HMG4V23_TLV_PATH_CONTEXT_REJECTED;
}

static int path_authority_is_valid(
    const hmg4v23_request_path_authority *authority) {
  size_t left;
  size_t right;
  if (authority == NULL ||
      !hmg4v23_approved_abs_root_is_lexically_safe(authority->approved_root_path) ||
      authority->managed_paths == NULL ||
      authority->managed_path_count != HMG4V23_MANAGED_ENTRY_COUNT) {
    return 0;
  }
  for (left = 0; left < authority->managed_path_count; ++left) {
    if (!hmg4v23_policy_rel_path_is_lexically_safe(authority->managed_paths[left])) {
      return 0;
    }
    for (right = 0; right < left; ++right) {
      if (span_equal(authority->managed_paths[left], authority->managed_paths[right]) ||
          spans_ascii_lower_equal(authority->managed_paths[left],
                                  authority->managed_paths[right])) {
        return 0;
      }
    }
  }
  return 1;
}

static const hmg4v23_tlv_view *find_field(const hmg4v23_tlv_view *fields,
                                          size_t count, uint16_t tag) {
  size_t index;
  for (index = 0; index < count; ++index) {
    if (fields[index].tag == tag) return &fields[index];
  }
  return NULL;
}

static hmg4v23_request_result collect_top_fields(
    hmg4v23_span payload, hmg4v23_tlv_view fields[40], size_t *field_count) {
  hmg4v23_tlv_cursor cursor;
  size_t count = 0;
  int done = 0;
  if (field_count == NULL) return HMG4V23_REQUEST_NULL_ARGUMENT;
  hmg4v23_tlv_cursor_init(&cursor, payload);
  while (!done) {
    hmg4v23_tlv_result result;
    if (count == 40) return HMG4V23_REQUEST_TLV_SCHEMA_INVALID;
    result = hmg4v23_tlv_next_raw(&cursor, &fields[count], &done);
    if (result != HMG4V23_TLV_OK) return HMG4V23_REQUEST_TLV_SCHEMA_INVALID;
    if (!done) ++count;
  }
  *field_count = count;
  return HMG4V23_REQUEST_OK;
}

static hmg4v23_request_result validate_entry_semantics(
    hmg4v23_span encoded_list, uint32_t *predecessor_present_count) {
  hmg4v23_span prior_paths[HMG4V23_MANAGED_ENTRY_COUNT];
  uint32_t count;
  uint32_t ordinal;
  uint32_t present = 0;
  size_t offset = 4;
  uint64_t previous_end = 0;
  int saw_report_last = 0;
  if (predecessor_present_count == NULL || encoded_list.length < 4) {
    return HMG4V23_REQUEST_ENTRY_COUNT_INVALID;
  }
  count = hmg4v23_read_u32_be(encoded_list.bytes);
  if (count != HMG4V23_MANAGED_ENTRY_COUNT) {
    return HMG4V23_REQUEST_ENTRY_COUNT_INVALID;
  }
  for (ordinal = 0; ordinal < count; ++ordinal) {
    uint32_t member_length;
    hmg4v23_span member;
    hmg4v23_tlv_cursor cursor;
    hmg4v23_tlv_view fields[16];
    size_t field_ordinal;
    int done = 0;
    uint32_t role;
    uint32_t state;
    uint64_t desired_offset;
    uint64_t desired_size;
    uint64_t desired_end;
    uint32_t prior;
    if (offset > encoded_list.length || encoded_list.length - offset < 4) {
      return HMG4V23_REQUEST_ENTRY_COUNT_INVALID;
    }
    member_length = hmg4v23_read_u32_be(encoded_list.bytes + offset);
    offset += 4;
    if (offset > encoded_list.length ||
        (size_t)member_length > encoded_list.length - offset) {
      return HMG4V23_REQUEST_ENTRY_COUNT_INVALID;
    }
    member = (hmg4v23_span){encoded_list.bytes + offset, (size_t)member_length};
    hmg4v23_tlv_cursor_init(&cursor, member);
    for (field_ordinal = 0; field_ordinal < 16; ++field_ordinal) {
      if (hmg4v23_tlv_next_raw(&cursor, &fields[field_ordinal], &done) !=
              HMG4V23_TLV_OK ||
          done) {
        return HMG4V23_REQUEST_TLV_SCHEMA_INVALID;
      }
    }
    if (hmg4v23_tlv_next_raw(&cursor, &fields[0], &done) != HMG4V23_TLV_OK ||
        !done) {
      return HMG4V23_REQUEST_TLV_SCHEMA_INVALID;
    }
    if (hmg4v23_read_u32_be(fields[0].value.bytes) != ordinal) {
      return HMG4V23_REQUEST_ENTRY_INDEX_MISMATCH;
    }
    role = hmg4v23_read_u32_be(fields[1].value.bytes);
    if (role == 2) {
      saw_report_last = 1;
    } else if (saw_report_last) {
      return HMG4V23_REQUEST_ENTRY_ROLE_ORDER_INVALID;
    }
    prior_paths[ordinal] = fields[2].value;
    for (prior = 0; prior < ordinal; ++prior) {
      if (span_equal(prior_paths[prior], prior_paths[ordinal]) ||
          spans_ascii_lower_equal(prior_paths[prior], prior_paths[ordinal])) {
        return HMG4V23_REQUEST_ENTRY_PATH_MISMATCH;
      }
    }
    state = hmg4v23_read_u32_be(fields[3].value.bytes);
    if (state == 0) {
      if (hmg4v23_read_u64_be(fields[4].value.bytes) != 0 ||
          !bytes_all_zero(fields[5].value.bytes, fields[5].value.length)) {
        return HMG4V23_REQUEST_ENTRY_STATE_INVALID;
      }
    } else {
      if (bytes_all_zero(fields[5].value.bytes, fields[5].value.length)) {
        return HMG4V23_REQUEST_ENTRY_STATE_INVALID;
      }
      ++present;
    }
    desired_offset = hmg4v23_read_u64_be(fields[6].value.bytes);
    desired_size = hmg4v23_read_u64_be(fields[7].value.bytes);
    if ((desired_offset % UINT64_C(4096)) != 0 || desired_size == 0 ||
        desired_size > UINT64_C(4294967296) ||
        desired_offset > UINT64_C(68719476736) ||
        desired_size > UINT64_MAX - desired_offset) {
      return HMG4V23_REQUEST_ENTRY_RANGE_INVALID;
    }
    desired_end = desired_offset + desired_size;
    if (desired_end > UINT64_C(68719476736) ||
        (ordinal != 0 && desired_offset < previous_end)) {
      return HMG4V23_REQUEST_ENTRY_RANGE_INVALID;
    }
    previous_end = desired_end;
    offset += (size_t)member_length;
  }
  if (offset != encoded_list.length) return HMG4V23_REQUEST_ENTRY_COUNT_INVALID;
  *predecessor_present_count = present;
  return HMG4V23_REQUEST_OK;
}

static hmg4v23_request_result validate_terminal_receipt_binding(
    const hmg4v23_tlv_view *leaf_field,
    const hmg4v23_tlv_view *hash_field) {
  hmg4v23_custody_leaf leaf;
  return leaf_field != NULL && hash_field != NULL &&
                 hmg4v23_parse_custody_leaf(leaf_field->value, &leaf) &&
                 leaf.variant == HMG4V23_CUSTODY_RECEIPT &&
                 hex_span_equals_bytes(leaf.digest_hex, hash_field->value.bytes, 32)
             ? HMG4V23_REQUEST_OK
             : HMG4V23_REQUEST_CUSTODY_BINDING_INVALID;
}

static hmg4v23_request_result validate_original_journal_binding(
    const hmg4v23_tlv_view *transaction_id,
    const hmg4v23_tlv_view *journal_leaf) {
  hmg4v23_custody_leaf leaf;
  return transaction_id != NULL && journal_leaf != NULL &&
                 !bytes_all_zero(transaction_id->value.bytes,
                                 transaction_id->value.length) &&
                 hmg4v23_parse_custody_leaf(journal_leaf->value, &leaf) &&
                 leaf.variant == HMG4V23_CUSTODY_JOURNAL &&
                 hex_span_equals_bytes(leaf.transaction_id_hex,
                                       transaction_id->value.bytes, 32)
             ? HMG4V23_REQUEST_OK
             : HMG4V23_REQUEST_CUSTODY_BINDING_INVALID;
}

static hmg4v23_request_result validate_evidence_binding(
    const hmg4v23_tlv_view *path_field,
    const hmg4v23_tlv_view *hash_field,
    hmg4v23_evidence_role role) {
  return path_field != NULL && hash_field != NULL &&
                 hmg4v23_validate_evidence_path(path_field->value, role,
                                                hash_field->value.bytes)
             ? HMG4V23_REQUEST_OK
             : HMG4V23_REQUEST_EVIDENCE_BINDING_INVALID;
}

hmg4v23_request_result hmg4v23_validate_request_payload(
    uint32_t operation,
    hmg4v23_span payload,
    const hmg4v23_request_path_authority *path_authority,
    hmg4v23_request_summary *summary) {
  hmg4v23_tlv_view fields[40];
  size_t field_count = 0;
  const hmg4v23_tlv_view *field;
  const hmg4v23_tlv_view *entries;
  const hmg4v23_tlv_schema *selected_schema;
  request_path_context path_context;
  hmg4v23_tlv_result tlv_result;
  hmg4v23_request_result result;
  uint32_t verify_target = 0;
  uint32_t predecessor_present_count = 0;
  uint32_t expected_transition_count;
  if (summary == NULL || !span_pointer_is_valid(payload)) {
    return HMG4V23_REQUEST_NULL_ARGUMENT;
  }
  memset(summary, 0, sizeof(*summary));
  summary->operation = operation;
  if (operation < 1 || operation > 4) return HMG4V23_REQUEST_BAD_OPERATION;
  if (payload.length > HMG4V23_REQUEST_MAX_PAYLOAD) {
    return HMG4V23_REQUEST_PAYLOAD_TOO_LARGE;
  }
  if (!path_authority_is_valid(path_authority)) {
    return HMG4V23_REQUEST_AUTHORITY_CONTEXT_INVALID;
  }
  result = collect_top_fields(payload, fields, &field_count);
  if (result != HMG4V23_REQUEST_OK) return result;
  if (operation == 1) {
    selected_schema = &probe_schema;
  } else if (operation == 2) {
    field = find_field(fields, field_count, 0x000e);
    if (field == NULL || field->type != HMG4V23_TLV_U32 ||
        field->value.length != 4) {
      return HMG4V23_REQUEST_TLV_SCHEMA_INVALID;
    }
    verify_target = hmg4v23_read_u32_be(field->value.bytes);
    selected_schema = verify_target == 1 ? &verify_live_schema
                       : verify_target == 2 ? &verify_receipt_schema
                                            : NULL;
    if (selected_schema == NULL) return HMG4V23_REQUEST_SCALAR_INVALID;
  } else if (operation == 3) {
    selected_schema = &apply_schema;
  } else {
    selected_schema = &recover_schema;
  }
  path_context.authority = path_authority;
  path_context.entry_path_ordinal = 0;
  path_context.root_path_count = 0;
  path_context.mismatch_is_root = 0;
  path_context.mismatch_is_entry = 0;
  tlv_result = hmg4v23_validate_tlv_schema(
      payload, selected_schema, request_path_authorizer, &path_context);
  summary->tlv_result = tlv_result;
  if (tlv_result != HMG4V23_TLV_OK) {
    return HMG4V23_REQUEST_TLV_SCHEMA_INVALID;
  }
  field = find_field(fields, field_count, 0x0001);
  if (field == NULL ||
      memcmp(field->value.bytes, hmg4v23_successor_sha256, 32) != 0) {
    return HMG4V23_REQUEST_PROTOCOL_SPEC_MISMATCH;
  }
  if (path_context.root_path_count != 1 || path_context.mismatch_is_root) {
    return HMG4V23_REQUEST_ROOT_PATH_MISMATCH;
  }
  if (operation != 1 &&
      (path_context.entry_path_ordinal != HMG4V23_MANAGED_ENTRY_COUNT ||
       path_context.mismatch_is_entry)) {
    return HMG4V23_REQUEST_ENTRY_PATH_MISMATCH;
  }
  entries = find_field(fields, field_count, 0x000d);
  if (entries != NULL) {
    result = validate_entry_semantics(entries->value, &predecessor_present_count);
    if (result != HMG4V23_REQUEST_OK) return result;
  }
  expected_transition_count = entries == NULL
                                  ? 0
                                  : UINT32_C(114) + predecessor_present_count;
  if (operation == 2 && verify_target == 2) {
    result = validate_terminal_receipt_binding(
        find_field(fields, field_count, 0x000f),
        find_field(fields, field_count, 0x0010));
    if (result != HMG4V23_REQUEST_OK) return result;
  }
  if (operation == 3) {
    result = validate_evidence_binding(
        find_field(fields, field_count, 0x0026),
        find_field(fields, field_count, 0x0025), HMG4V23_EVIDENCE_APPLY);
    if (result != HMG4V23_REQUEST_OK) return result;
  }
  if (operation == 4) {
    const hmg4v23_tlv_view *disposition;
    const hmg4v23_tlv_view *authorized_count;
    result = validate_original_journal_binding(
        find_field(fields, field_count, 0x0011),
        find_field(fields, field_count, 0x0012));
    if (result != HMG4V23_REQUEST_OK) return result;
    result = validate_evidence_binding(
        find_field(fields, field_count, 0x0014),
        find_field(fields, field_count, 0x0015), HMG4V23_EVIDENCE_RECOVER);
    if (result != HMG4V23_REQUEST_OK) return result;
    disposition = find_field(fields, field_count, 0x001f);
    authorized_count = find_field(fields, field_count, 0x0021);
    if (disposition == NULL || authorized_count == NULL ||
        hmg4v23_read_u32_be(authorized_count->value.bytes) >
            expected_transition_count ||
        ((hmg4v23_read_u32_be(disposition->value.bytes) == 3 ||
          hmg4v23_read_u32_be(disposition->value.bytes) == 4) &&
         hmg4v23_read_u32_be(authorized_count->value.bytes) != 0)) {
      return HMG4V23_REQUEST_SCALAR_INVALID;
    }
  }
  if (operation == 3 || operation == 4) {
    const hmg4v23_tlv_view *forward = find_field(fields, field_count, 0x001c);
    const hmg4v23_tlv_view *rollback = find_field(fields, field_count, 0x001e);
    if (forward == NULL || rollback == NULL ||
        hmg4v23_read_u32_be(forward->value.bytes) != expected_transition_count ||
        hmg4v23_read_u32_be(rollback->value.bytes) != expected_transition_count) {
      return HMG4V23_REQUEST_SCALAR_INVALID;
    }
  }
  summary->operation = operation;
  summary->verify_target = verify_target;
  summary->predecessor_present_count = predecessor_present_count;
  summary->expected_transition_count = expected_transition_count;
  summary->tlv_result = HMG4V23_TLV_OK;
  return HMG4V23_REQUEST_OK;
}

const char *hmg4v23_request_result_name(hmg4v23_request_result result) {
  static const char *const names[] = {
      "OK", "NULL_ARGUMENT", "BAD_OPERATION", "PAYLOAD_TOO_LARGE",
      "AUTHORITY_CONTEXT_INVALID", "TLV_SCHEMA_INVALID",
      "PROTOCOL_SPEC_MISMATCH", "ROOT_PATH_MISMATCH",
      "ENTRY_INDEX_MISMATCH", "ENTRY_PATH_MISMATCH",
      "ENTRY_ROLE_ORDER_INVALID", "ENTRY_STATE_INVALID",
      "ENTRY_RANGE_INVALID", "ENTRY_COUNT_INVALID", "SCALAR_INVALID",
      "CUSTODY_BINDING_INVALID", "EVIDENCE_BINDING_INVALID"};
  const size_t ordinal = (size_t)result;
  return ordinal < sizeof(names) / sizeof(names[0]) ? names[ordinal]
                                                    : "UNKNOWN_REQUEST_RESULT";
}
