#include "xattr_policy.h"

#include <CommonCrypto/CommonDigest.h>
#include <limits.h>
#include <string.h>

#define FIELD(tag_value, type_value, flag_value, min_length, max_length,      \
              min_numeric, max_numeric, min_count, max_count, nested)        \
  {(tag_value), (type_value), 0, (flag_value), (min_length), (max_length),    \
   (min_numeric), (max_numeric), (min_count), (max_count), (nested)}

static const hmg4v23_tlv_field_rule xattr_rule_fields[] = {
    FIELD(0x7101, HMG4V23_TLV_U32, HMG4V23_FIELD_NUMERIC_RANGE,
          0, 0, 0, 63, 0, 0, NULL),
    FIELD(0x7102, HMG4V23_TLV_BYTES,
          HMG4V23_FIELD_LENGTH_RANGE | HMG4V23_FIELD_BYTES_BOUND_OVERRIDE,
          1, 127, 0, 0, 0, 0, NULL),
    FIELD(0x7103, HMG4V23_TLV_BYTES,
          HMG4V23_FIELD_LENGTH_RANGE | HMG4V23_FIELD_BYTES_BOUND_OVERRIDE,
          0, 4096, 0, 0, 0, 0, NULL),
};

static const hmg4v23_tlv_schema xattr_rule_schema = {
    xattr_rule_fields,
    sizeof(xattr_rule_fields) / sizeof(xattr_rule_fields[0]),
    4};

static const hmg4v23_tlv_field_rule policy_fields[] = {
    FIELD(0x7001, HMG4V23_TLV_SHA256, 0,
          0, 0, 0, 0, 0, 0, NULL),
    FIELD(0x7002, HMG4V23_TLV_U32, HMG4V23_FIELD_NUMERIC_RANGE,
          0, 0, 2, 2, 0, 0, NULL),
    FIELD(0x7003, HMG4V23_TLV_U32, HMG4V23_FIELD_NUMERIC_RANGE,
          0, 0, 1, 1, 0, 0, NULL),
    FIELD(0x7004, HMG4V23_TLV_U32, HMG4V23_FIELD_NUMERIC_RANGE,
          0, 0, 0, 64, 0, 0, NULL),
    FIELD(0x7005, HMG4V23_TLV_LIST, HMG4V23_FIELD_LIST_COUNT_RANGE,
          0, 0, 0, 0, 0, 64, &xattr_rule_schema),
    FIELD(0x7006, HMG4V23_TLV_SHA256, 0,
          0, 0, 0, 0, 0, 0, NULL),
    FIELD(0x7007, HMG4V23_TLV_U32, HMG4V23_FIELD_NUMERIC_RANGE,
          0, 0, 127, 127, 0, 0, NULL),
    FIELD(0x7008, HMG4V23_TLV_U64, HMG4V23_FIELD_NUMERIC_RANGE,
          0, 0, 4096, 4096, 0, 0, NULL),
    FIELD(0x7009, HMG4V23_TLV_U64, HMG4V23_FIELD_NUMERIC_RANGE,
          0, 0, 65536, 65536, 0, 0, NULL),
    FIELD(0x700a, HMG4V23_TLV_U64, HMG4V23_FIELD_NUMERIC_RANGE,
          0, 0, 524288, 524288, 0, 0, NULL),
    FIELD(0x700b, HMG4V23_TLV_BOOL, 0,
          0, 0, 0, 0, 0, 0, NULL),
    FIELD(0x700c, HMG4V23_TLV_U64, HMG4V23_FIELD_NUMERIC_RANGE,
          0, 0, 0, 0, 0, 0, NULL),
};

static const hmg4v23_tlv_schema policy_schema = {
    policy_fields,
    sizeof(policy_fields) / sizeof(policy_fields[0]),
    4};

#undef FIELD

static const uint8_t policy_magic[8] = {
    0x48, 0x4d, 0x47, 0x34, 0x59, 0x32, 0x00, 0x00};
static const uint8_t xattr_magic[8] = {
    0x48, 0x4d, 0x47, 0x34, 0x58, 0x32, 0x00, 0x00};

static void write_u32_be(uint8_t bytes[4], uint32_t value) {
  bytes[0] = (uint8_t)(value >> 24);
  bytes[1] = (uint8_t)(value >> 16);
  bytes[2] = (uint8_t)(value >> 8);
  bytes[3] = (uint8_t)value;
}

static void write_u64_be(uint8_t bytes[8], uint64_t value) {
  bytes[0] = (uint8_t)(value >> 56);
  bytes[1] = (uint8_t)(value >> 48);
  bytes[2] = (uint8_t)(value >> 40);
  bytes[3] = (uint8_t)(value >> 32);
  bytes[4] = (uint8_t)(value >> 24);
  bytes[5] = (uint8_t)(value >> 16);
  bytes[6] = (uint8_t)(value >> 8);
  bytes[7] = (uint8_t)value;
}

static int checked_add_u64(uint64_t left, uint64_t right, uint64_t *result) {
  if (result == NULL || right > UINT64_MAX - left) return 0;
  *result = left + right;
  return 1;
}

static int unsigned_bytes_compare(hmg4v23_span left, hmg4v23_span right) {
  const size_t common = left.length < right.length ? left.length : right.length;
  int compared = 0;
  if (common > 0) compared = memcmp(left.bytes, right.bytes, common);
  if (compared != 0) return compared;
  if (left.length < right.length) return -1;
  if (left.length > right.length) return 1;
  return 0;
}

static int span_has_nul(hmg4v23_span span) {
  size_t index = 0;
  for (index = 0; index < span.length; ++index) {
    if (span.bytes[index] == 0) return 1;
  }
  return 0;
}

static int sha256_update(CC_SHA256_CTX *context, hmg4v23_span span) {
  size_t offset = 0;
  if (context == NULL || (span.length != 0 && span.bytes == NULL)) return 0;
  while (offset < span.length) {
    size_t remaining = span.length - offset;
    CC_LONG amount = remaining > (size_t)UINT32_MAX
                         ? (CC_LONG)UINT32_MAX
                         : (CC_LONG)remaining;
    if (CC_SHA256_Update(context, span.bytes + offset, amount) != 1) return 0;
    offset += (size_t)amount;
  }
  return 1;
}

static hmg4v23_xattr_policy_result parse_rule(
    hmg4v23_span member,
    uint32_t expected_ordinal,
    hmg4v23_xattr_policy_rule_view *result) {
  hmg4v23_tlv_cursor cursor;
  hmg4v23_tlv_view field;
  int done = 0;
  if (result == NULL) return HMG4V23_XATTR_POLICY_NULL_ARGUMENT;
  memset(result, 0, sizeof(*result));
  hmg4v23_tlv_cursor_init(&cursor, member);
  if (hmg4v23_tlv_next_raw(&cursor, &field, &done) != HMG4V23_TLV_OK || done ||
      field.tag != 0x7101) {
    return HMG4V23_XATTR_POLICY_LIST_INVALID;
  }
  result->ordinal = hmg4v23_read_u32_be(field.value.bytes);
  if (result->ordinal != expected_ordinal) {
    return HMG4V23_XATTR_POLICY_ORDINAL_INVALID;
  }
  if (hmg4v23_tlv_next_raw(&cursor, &field, &done) != HMG4V23_TLV_OK || done ||
      field.tag != 0x7102) {
    return HMG4V23_XATTR_POLICY_LIST_INVALID;
  }
  result->name = field.value;
  if (span_has_nul(result->name)) return HMG4V23_XATTR_POLICY_NAME_INVALID;
  if (hmg4v23_tlv_next_raw(&cursor, &field, &done) != HMG4V23_TLV_OK || done ||
      field.tag != 0x7103) {
    return HMG4V23_XATTR_POLICY_LIST_INVALID;
  }
  result->value = field.value;
  if (hmg4v23_tlv_next_raw(&cursor, &field, &done) != HMG4V23_TLV_OK || !done) {
    return HMG4V23_XATTR_POLICY_LIST_INVALID;
  }
  return HMG4V23_XATTR_POLICY_OK;
}

static hmg4v23_xattr_policy_result parse_rule_list(
    hmg4v23_span list,
    uint32_t expected_count,
    hmg4v23_xattr_policy_view *result) {
  uint32_t count = 0;
  uint32_t ordinal = 0;
  size_t offset = 4;
  uint64_t total_values = 0;
  uint64_t stream_length = 16;
  if (list.bytes == NULL || list.length < 4 || result == NULL) {
    return HMG4V23_XATTR_POLICY_LIST_INVALID;
  }
  count = hmg4v23_read_u32_be(list.bytes);
  if (count != expected_count || count > HMG4V23_XATTR_POLICY_RULE_COUNT_MAX) {
    return HMG4V23_XATTR_POLICY_LIST_INVALID;
  }
  for (ordinal = 0; ordinal < count; ++ordinal) {
    uint32_t member_length = 0;
    size_t member_offset = 0;
    size_t next_offset = 0;
    uint64_t next_length = 0;
    hmg4v23_xattr_policy_result parsed;
    if (offset > list.length || list.length - offset < 4) {
      return HMG4V23_XATTR_POLICY_LIST_INVALID;
    }
    member_length = hmg4v23_read_u32_be(list.bytes + offset);
    member_offset = offset + 4;
    if ((size_t)member_length > list.length - member_offset) {
      return HMG4V23_XATTR_POLICY_LIST_INVALID;
    }
    next_offset = member_offset + (size_t)member_length;
    parsed = parse_rule(
        (hmg4v23_span){list.bytes + member_offset, (size_t)member_length},
        ordinal,
        &result->attributes[ordinal]);
    if (parsed != HMG4V23_XATTR_POLICY_OK) return parsed;
    if (ordinal > 0 &&
        unsigned_bytes_compare(result->attributes[ordinal - 1].name,
                               result->attributes[ordinal].name) >= 0) {
      return HMG4V23_XATTR_POLICY_NAME_ORDER_INVALID;
    }
    if (!checked_add_u64(total_values,
                         (uint64_t)result->attributes[ordinal].value.length,
                         &total_values)) {
      return HMG4V23_XATTR_POLICY_ARITHMETIC_OVERFLOW;
    }
    next_length = UINT64_C(4) +
                  (uint64_t)result->attributes[ordinal].name.length;
    if (!checked_add_u64(next_length, UINT64_C(8), &next_length) ||
        !checked_add_u64(
            next_length,
            (uint64_t)result->attributes[ordinal].value.length,
            &next_length) ||
        !checked_add_u64(stream_length, next_length, &stream_length)) {
      return HMG4V23_XATTR_POLICY_ARITHMETIC_OVERFLOW;
    }
    offset = next_offset;
  }
  if (offset != list.length) return HMG4V23_XATTR_POLICY_LIST_INVALID;
  if (total_values > HMG4V23_XATTR_POLICY_MAX_TOTAL_VALUE_LENGTH ||
      stream_length > HMG4V23_XATTR_POLICY_MAX_STREAM_LENGTH) {
    return HMG4V23_XATTR_POLICY_BOUND_EXCEEDED;
  }
  result->attribute_count = count;
  result->total_value_length = total_values;
  result->canonical_xattr_set_stream_length = stream_length;
  return HMG4V23_XATTR_POLICY_OK;
}

static hmg4v23_xattr_policy_result compute_stream_hash(
    const hmg4v23_xattr_policy_view *view,
    uint8_t digest[32]) {
  CC_SHA256_CTX context;
  uint8_t header[16];
  uint32_t ordinal = 0;
  if (view == NULL || digest == NULL) {
    return HMG4V23_XATTR_POLICY_NULL_ARGUMENT;
  }
  memcpy(header, xattr_magic, sizeof(xattr_magic));
  write_u32_be(header + 8, 2);
  write_u32_be(header + 12, view->attribute_count);
  if (CC_SHA256_Init(&context) != 1 ||
      !sha256_update(&context, (hmg4v23_span){header, sizeof(header)})) {
    return HMG4V23_XATTR_POLICY_STREAM_HASH_FAILURE;
  }
  for (ordinal = 0; ordinal < view->attribute_count; ++ordinal) {
    uint8_t name_length[4];
    uint8_t value_length[8];
    write_u32_be(name_length, (uint32_t)view->attributes[ordinal].name.length);
    write_u64_be(value_length, (uint64_t)view->attributes[ordinal].value.length);
    if (!sha256_update(&context,
                       (hmg4v23_span){name_length, sizeof(name_length)}) ||
        !sha256_update(&context, view->attributes[ordinal].name) ||
        !sha256_update(&context,
                       (hmg4v23_span){value_length, sizeof(value_length)}) ||
        !sha256_update(&context, view->attributes[ordinal].value)) {
      return HMG4V23_XATTR_POLICY_STREAM_HASH_FAILURE;
    }
  }
  if (CC_SHA256_Final(digest, &context) != 1) {
    return HMG4V23_XATTR_POLICY_STREAM_HASH_FAILURE;
  }
  return HMG4V23_XATTR_POLICY_OK;
}

hmg4v23_xattr_policy_result hmg4v23_validate_xattr_policy(
    hmg4v23_span frame,
    hmg4v23_xattr_policy_view *result) {
  hmg4v23_authority_envelope envelope;
  hmg4v23_tlv_cursor cursor;
  hmg4v23_tlv_view field;
  hmg4v23_span rule_list = {NULL, 0};
  uint32_t count = 0;
  uint32_t maximum_name = 0;
  uint64_t maximum_value = 0;
  uint64_t maximum_total_value = 0;
  uint64_t maximum_stream = 0;
  uint64_t acceptance_mask = 1;
  int exact_empty = 0;
  int done = 0;
  uint8_t recomputed[32];
  hmg4v23_xattr_policy_result parsed;
  if (result == NULL || (frame.length != 0 && frame.bytes == NULL)) {
    return HMG4V23_XATTR_POLICY_NULL_ARGUMENT;
  }
  memset(result, 0, sizeof(*result));
  memset(&envelope, 0, sizeof(envelope));
  if (hmg4v23_validate_authority_envelope(frame, &envelope) != HMG4V23_OK ||
      memcmp(envelope.header.magic, policy_magic, sizeof(policy_magic)) != 0 ||
      envelope.header.kind != 1) {
    return HMG4V23_XATTR_POLICY_ENVELOPE_INVALID;
  }
  if (hmg4v23_validate_tlv_schema(
          envelope.payload, &policy_schema, NULL, NULL) != HMG4V23_TLV_OK) {
    return HMG4V23_XATTR_POLICY_SCHEMA_INVALID;
  }
  hmg4v23_tlv_cursor_init(&cursor, envelope.payload);
  for (;;) {
    if (hmg4v23_tlv_next_raw(&cursor, &field, &done) != HMG4V23_TLV_OK) {
      return HMG4V23_XATTR_POLICY_SCHEMA_INVALID;
    }
    if (done) break;
    switch (field.tag) {
      case 0x7001:
        if (memcmp(field.value.bytes, hmg4v23_successor_sha256, 32) != 0) {
          return HMG4V23_XATTR_POLICY_SPECIFICATION_MISMATCH;
        }
        break;
      case 0x7004:
        count = hmg4v23_read_u32_be(field.value.bytes);
        break;
      case 0x7005:
        rule_list = field.value;
        break;
      case 0x7006:
        memcpy(result->canonical_xattr_set_sha256, field.value.bytes, 32);
        break;
      case 0x7007:
        maximum_name = hmg4v23_read_u32_be(field.value.bytes);
        break;
      case 0x7008:
        maximum_value = hmg4v23_read_u64_be(field.value.bytes);
        break;
      case 0x7009:
        maximum_total_value = hmg4v23_read_u64_be(field.value.bytes);
        break;
      case 0x700a:
        maximum_stream = hmg4v23_read_u64_be(field.value.bytes);
        break;
      case 0x700b:
        exact_empty = field.value.bytes[0] == 1;
        break;
      case 0x700c:
        acceptance_mask = hmg4v23_read_u64_be(field.value.bytes);
        break;
      default:
        break;
    }
  }
  if (maximum_name != HMG4V23_XATTR_POLICY_MAX_NAME_LENGTH ||
      maximum_value != HMG4V23_XATTR_POLICY_MAX_VALUE_LENGTH ||
      maximum_total_value != HMG4V23_XATTR_POLICY_MAX_TOTAL_VALUE_LENGTH ||
      maximum_stream != HMG4V23_XATTR_POLICY_MAX_STREAM_LENGTH ||
      acceptance_mask != 0) {
    return HMG4V23_XATTR_POLICY_CONSTANT_MISMATCH;
  }
  parsed = parse_rule_list(rule_list, count, result);
  if (parsed != HMG4V23_XATTR_POLICY_OK) return parsed;
  if (exact_empty != (count == 0)) {
    return HMG4V23_XATTR_POLICY_EMPTY_FLAG_MISMATCH;
  }
  result->exact_empty_set = exact_empty;
  parsed = compute_stream_hash(result, recomputed);
  if (parsed != HMG4V23_XATTR_POLICY_OK) return parsed;
  if (memcmp(recomputed, result->canonical_xattr_set_sha256, 32) != 0) {
    return HMG4V23_XATTR_POLICY_STREAM_HASH_MISMATCH;
  }
  result->payload = envelope.payload;
  return HMG4V23_XATTR_POLICY_OK;
}

const char *hmg4v23_xattr_policy_result_name(
    hmg4v23_xattr_policy_result result) {
  static const char *const names[] = {
      "ok",
      "null_argument",
      "envelope_invalid",
      "schema_invalid",
      "specification_mismatch",
      "constant_mismatch",
      "list_invalid",
      "ordinal_invalid",
      "name_invalid",
      "name_order_invalid",
      "arithmetic_overflow",
      "bound_exceeded",
      "stream_hash_failure",
      "stream_hash_mismatch",
      "empty_flag_mismatch"};
  const size_t index = (size_t)result;
  if (index >= sizeof(names) / sizeof(names[0])) return "unknown";
  return names[index];
}
