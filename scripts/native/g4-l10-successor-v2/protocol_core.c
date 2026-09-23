#include "protocol_core.h"

#include <CommonCrypto/CommonDigest.h>
#include <limits.h>
#include <string.h>

enum {
  HMG4V2_TYPE_U32 = 0x01,
  HMG4V2_TYPE_U64 = 0x02,
  HMG4V2_TYPE_BOOL = 0x03,
  HMG4V2_TYPE_SHA256 = 0x04,
  HMG4V2_TYPE_BYTES = 0x05,
  HMG4V2_TYPE_POLICY_REL_PATH = 0x06,
  HMG4V2_TYPE_STRUCT = 0x07,
  HMG4V2_TYPE_LIST = 0x08,
  HMG4V2_TYPE_APPROVED_ABS_ROOT_PATH = 0x09,
  HMG4V2_TYPE_SAFE_CUSTODY_LEAF = 0x0a,
  HMG4V2_TYPE_APPROVED_EVIDENCE_REL_PATH = 0x0b,
  HMG4V2_TYPE_OBSERVED_CUSTODY_LEAF = 0x0c
};

typedef struct {
  uint32_t role;
  uint32_t predecessor_state;
  uint64_t desired_offset;
  uint64_t desired_size;
  hmg4v2_span path;
} hmg4v2_entry_summary;

static const uint8_t k_request_magic[8] = {
    0x48, 0x4d, 0x47, 0x34, 0x56, 0x32, 0x00, 0x00};

const uint8_t hmg4v2_protocol_spec_sha256[32] = {
    0x77, 0xc2, 0x47, 0x9d, 0x7b, 0xe1, 0x97, 0xe6,
    0x2a, 0x9c, 0xf3, 0x7e, 0x05, 0xd7, 0x1d, 0x60,
    0x51, 0x85, 0x8a, 0x29, 0x16, 0x71, 0x43, 0xca,
    0x39, 0xdd, 0xc5, 0xbe, 0x7b, 0x99, 0x45, 0x83};

static int span_pointer_is_valid(hmg4v2_span span) {
  return span.length == 0 || span.bytes != NULL;
}

int hmg4v2_checked_add_size(size_t left, size_t right, size_t *result) {
  if (result == NULL || right > SIZE_MAX - left) return 0;
  *result = left + right;
  return 1;
}

int hmg4v2_checked_mul_size(size_t left, size_t right, size_t *result) {
  if (result == NULL || (left != 0 && right > SIZE_MAX / left)) return 0;
  *result = left * right;
  return 1;
}

int hmg4v2_range_within(size_t offset, size_t length, size_t total) {
  size_t end = 0;
  return hmg4v2_checked_add_size(offset, length, &end) && end <= total;
}

uint16_t hmg4v2_read_u16_be(const uint8_t bytes[2]) {
  return (uint16_t)(((uint16_t)bytes[0] << 8) | (uint16_t)bytes[1]);
}

uint32_t hmg4v2_read_u32_be(const uint8_t bytes[4]) {
  return ((uint32_t)bytes[0] << 24) | ((uint32_t)bytes[1] << 16) |
         ((uint32_t)bytes[2] << 8) | (uint32_t)bytes[3];
}

uint64_t hmg4v2_read_u64_be(const uint8_t bytes[8]) {
  return ((uint64_t)bytes[0] << 56) | ((uint64_t)bytes[1] << 48) |
         ((uint64_t)bytes[2] << 40) | ((uint64_t)bytes[3] << 32) |
         ((uint64_t)bytes[4] << 24) | ((uint64_t)bytes[5] << 16) |
         ((uint64_t)bytes[6] << 8) | (uint64_t)bytes[7];
}

void hmg4v2_write_u16_be(uint8_t bytes[2], uint16_t value) {
  bytes[0] = (uint8_t)(value >> 8);
  bytes[1] = (uint8_t)value;
}

void hmg4v2_write_u32_be(uint8_t bytes[4], uint32_t value) {
  bytes[0] = (uint8_t)(value >> 24);
  bytes[1] = (uint8_t)(value >> 16);
  bytes[2] = (uint8_t)(value >> 8);
  bytes[3] = (uint8_t)value;
}

void hmg4v2_write_u64_be(uint8_t bytes[8], uint64_t value) {
  bytes[0] = (uint8_t)(value >> 56);
  bytes[1] = (uint8_t)(value >> 48);
  bytes[2] = (uint8_t)(value >> 40);
  bytes[3] = (uint8_t)(value >> 32);
  bytes[4] = (uint8_t)(value >> 24);
  bytes[5] = (uint8_t)(value >> 16);
  bytes[6] = (uint8_t)(value >> 8);
  bytes[7] = (uint8_t)value;
}

hmg4v2_core_result hmg4v2_sha256(
    hmg4v2_span input,
    uint8_t digest[32]) {
  static const uint8_t empty = 0;
  const uint8_t *source = input.bytes;
  if (digest == NULL || !span_pointer_is_valid(input)) {
    return HMG4V2_CORE_NULL_ARGUMENT;
  }
  if (input.length > UINT32_MAX) return HMG4V2_CORE_PAYLOAD_TOO_LARGE;
  if (source == NULL) source = &empty;
  if (CC_SHA256(source, (CC_LONG)input.length, digest) == NULL) {
    return HMG4V2_CORE_BAD_SCALAR_VALUE;
  }
  return HMG4V2_CORE_OK;
}

hmg4v2_core_result hmg4v2_parse_request_header(
    hmg4v2_span header_bytes,
    hmg4v2_request_header *result) {
  uint32_t version = 0;
  uint32_t operation = 0;
  uint64_t payload_length = 0;
  if (result == NULL || !span_pointer_is_valid(header_bytes)) {
    return HMG4V2_CORE_NULL_ARGUMENT;
  }
  if (header_bytes.length < HMG4V2_HEADER_SIZE) {
    return HMG4V2_CORE_TRUNCATED_HEADER;
  }
  if (header_bytes.length != HMG4V2_HEADER_SIZE) {
    return HMG4V2_CORE_FRAME_LENGTH_MISMATCH;
  }
  if (memcmp(header_bytes.bytes, k_request_magic, sizeof(k_request_magic)) != 0) {
    return HMG4V2_CORE_BAD_MAGIC;
  }
  version = hmg4v2_read_u32_be(header_bytes.bytes + 8);
  if (version != 2) return HMG4V2_CORE_BAD_VERSION;
  operation = hmg4v2_read_u32_be(header_bytes.bytes + 12);
  if (operation < 1 || operation > 4) return HMG4V2_CORE_BAD_OPERATION;
  payload_length = hmg4v2_read_u64_be(header_bytes.bytes + 16);
  if (payload_length > HMG4V2_MAX_PAYLOAD) {
    return HMG4V2_CORE_PAYLOAD_TOO_LARGE;
  }
  result->operation = operation;
  result->payload_length = payload_length;
  memcpy(result->payload_sha256, header_bytes.bytes + 24,
         sizeof(result->payload_sha256));
  return HMG4V2_CORE_OK;
}

hmg4v2_core_result hmg4v2_validate_buffered_request_frame(
    hmg4v2_span frame_bytes,
    hmg4v2_request_frame *result) {
  hmg4v2_request_header header;
  hmg4v2_span header_span;
  hmg4v2_span payload;
  hmg4v2_core_result status;
  uint8_t actual_hash[32];
  size_t expected_length = 0;
  if (result == NULL || !span_pointer_is_valid(frame_bytes)) {
    return HMG4V2_CORE_NULL_ARGUMENT;
  }
  if (frame_bytes.length < HMG4V2_HEADER_SIZE) {
    return HMG4V2_CORE_TRUNCATED_HEADER;
  }
  header_span.bytes = frame_bytes.bytes;
  header_span.length = HMG4V2_HEADER_SIZE;
  status = hmg4v2_parse_request_header(header_span, &header);
  if (status != HMG4V2_CORE_OK) return status;
  if (header.payload_length > SIZE_MAX) return HMG4V2_CORE_SIZE_OVERFLOW;
  if (!hmg4v2_checked_add_size(HMG4V2_HEADER_SIZE,
                              (size_t)header.payload_length,
                              &expected_length)) {
    return HMG4V2_CORE_SIZE_OVERFLOW;
  }
  if (expected_length != frame_bytes.length) {
    return HMG4V2_CORE_FRAME_LENGTH_MISMATCH;
  }
  payload.bytes = frame_bytes.bytes + HMG4V2_HEADER_SIZE;
  payload.length = (size_t)header.payload_length;
  status = hmg4v2_sha256(payload, actual_hash);
  if (status != HMG4V2_CORE_OK) return status;
  if (memcmp(actual_hash, header.payload_sha256, sizeof(actual_hash)) != 0) {
    return HMG4V2_CORE_PAYLOAD_HASH_MISMATCH;
  }
  result->header = header;
  result->payload = payload;
  return HMG4V2_CORE_OK;
}

static int bytes_equal(hmg4v2_span left, hmg4v2_span right) {
  if (left.length != right.length) return 0;
  return left.length == 0 || memcmp(left.bytes, right.bytes, left.length) == 0;
}

static uint8_t ascii_lower(uint8_t value) {
  if (value >= (uint8_t)'A' && value <= (uint8_t)'Z') {
    return (uint8_t)(value + ((uint8_t)'a' - (uint8_t)'A'));
  }
  return value;
}

static int bytes_ascii_lower_equal(hmg4v2_span left, hmg4v2_span right) {
  size_t index = 0;
  if (left.length != right.length) return 0;
  for (index = 0; index < left.length; index += 1) {
    if (ascii_lower(left.bytes[index]) != ascii_lower(right.bytes[index])) {
      return 0;
    }
  }
  return 1;
}

static int component_is_dot_or_dot_dot(const uint8_t *bytes, size_t length) {
  return (length == 1 && bytes[0] == (uint8_t)'.') ||
         (length == 2 && bytes[0] == (uint8_t)'.' &&
          bytes[1] == (uint8_t)'.');
}

static int authority_component_is_safe(const uint8_t *bytes, size_t length) {
  size_t index = 0;
  if (bytes == NULL || length == 0 || component_is_dot_or_dot_dot(bytes, length)) {
    return 0;
  }
  for (index = 0; index < length; index += 1) {
    const uint8_t value = bytes[index];
    if (value == 0 || value >= 0x80 || value == (uint8_t)'/' ||
        value == (uint8_t)'\\') {
      return 0;
    }
  }
  return 1;
}

int hmg4v2_policy_rel_path_is_lexically_safe(hmg4v2_span path) {
  size_t component_start = 0;
  size_t index = 0;
  if (!span_pointer_is_valid(path) || path.length == 0 || path.length > 1024) {
    return 0;
  }
  if (path.bytes[0] == (uint8_t)'/' ||
      path.bytes[path.length - 1] == (uint8_t)'/') {
    return 0;
  }
  for (index = 0; index <= path.length; index += 1) {
    if (index == path.length || path.bytes[index] == (uint8_t)'/') {
      if (!authority_component_is_safe(path.bytes + component_start,
                                       index - component_start)) {
        return 0;
      }
      component_start = index + 1;
    }
  }
  return 1;
}

int hmg4v2_approved_abs_root_is_lexically_safe(hmg4v2_span path) {
  hmg4v2_span relative;
  if (!span_pointer_is_valid(path) || path.length < 2 || path.length > 1024 ||
      path.bytes[0] != (uint8_t)'/') {
    return 0;
  }
  relative.bytes = path.bytes + 1;
  relative.length = path.length - 1;
  return hmg4v2_policy_rel_path_is_lexically_safe(relative);
}

int hmg4v2_leaf_is_common_lexically_safe(hmg4v2_span leaf) {
  return span_pointer_is_valid(leaf) && leaf.length >= 1 && leaf.length <= 255 &&
         authority_component_is_safe(leaf.bytes, leaf.length);
}

static int observed_leaf_is_lexically_safe(hmg4v2_span leaf) {
  size_t index = 0;
  if (!span_pointer_is_valid(leaf) || leaf.length == 0 || leaf.length > 255 ||
      component_is_dot_or_dot_dot(leaf.bytes, leaf.length)) {
    return 0;
  }
  for (index = 0; index < leaf.length; index += 1) {
    if (leaf.bytes[index] == 0 || leaf.bytes[index] == (uint8_t)'/') return 0;
  }
  return 1;
}

static hmg4v2_core_result validate_tlv_value(
    uint8_t type,
    hmg4v2_span value) {
  switch (type) {
    case HMG4V2_TYPE_U32:
      return value.length == 4 ? HMG4V2_CORE_OK : HMG4V2_CORE_BAD_TLV_LENGTH;
    case HMG4V2_TYPE_U64:
      return value.length == 8 ? HMG4V2_CORE_OK : HMG4V2_CORE_BAD_TLV_LENGTH;
    case HMG4V2_TYPE_BOOL:
      if (value.length != 1) return HMG4V2_CORE_BAD_TLV_LENGTH;
      return value.bytes[0] <= 1 ? HMG4V2_CORE_OK
                                 : HMG4V2_CORE_BAD_SCALAR_VALUE;
    case HMG4V2_TYPE_SHA256:
      return value.length == 32 ? HMG4V2_CORE_OK : HMG4V2_CORE_BAD_TLV_LENGTH;
    case HMG4V2_TYPE_BYTES:
      return value.length <= 4096 ? HMG4V2_CORE_OK
                                  : HMG4V2_CORE_BAD_TLV_LENGTH;
    case HMG4V2_TYPE_POLICY_REL_PATH:
      return hmg4v2_policy_rel_path_is_lexically_safe(value)
                 ? HMG4V2_CORE_OK
                 : HMG4V2_CORE_BAD_PATH;
    case HMG4V2_TYPE_STRUCT:
      return HMG4V2_CORE_OK;
    case HMG4V2_TYPE_LIST:
      return value.length >= 4 ? HMG4V2_CORE_OK : HMG4V2_CORE_BAD_TLV_LENGTH;
    case HMG4V2_TYPE_APPROVED_ABS_ROOT_PATH:
      return hmg4v2_approved_abs_root_is_lexically_safe(value)
                 ? HMG4V2_CORE_OK
                 : HMG4V2_CORE_BAD_PATH;
    case HMG4V2_TYPE_SAFE_CUSTODY_LEAF:
      return hmg4v2_leaf_is_common_lexically_safe(value)
                 ? HMG4V2_CORE_OK
                 : HMG4V2_CORE_BAD_PATH;
    case HMG4V2_TYPE_APPROVED_EVIDENCE_REL_PATH:
      return hmg4v2_policy_rel_path_is_lexically_safe(value)
                 ? HMG4V2_CORE_OK
                 : HMG4V2_CORE_BAD_PATH;
    case HMG4V2_TYPE_OBSERVED_CUSTODY_LEAF:
      return observed_leaf_is_lexically_safe(value) ? HMG4V2_CORE_OK
                                                    : HMG4V2_CORE_BAD_PATH;
    default:
      return HMG4V2_CORE_BAD_TLV_TYPE;
  }
}

void hmg4v2_tlv_cursor_init(hmg4v2_tlv_cursor *cursor, hmg4v2_span bytes) {
  if (cursor == NULL) return;
  cursor->bytes = bytes;
  cursor->offset = 0;
  cursor->last_tag = 0;
  cursor->has_last_tag = 0;
}

hmg4v2_core_result hmg4v2_tlv_next(
    hmg4v2_tlv_cursor *cursor,
    hmg4v2_tlv_view *view,
    int *done) {
  size_t value_offset = 0;
  size_t next_offset = 0;
  uint16_t tag = 0;
  uint8_t type = 0;
  uint32_t length_u32 = 0;
  hmg4v2_span value;
  hmg4v2_core_result status;
  if (cursor == NULL || view == NULL || done == NULL ||
      !span_pointer_is_valid(cursor->bytes)) {
    return HMG4V2_CORE_NULL_ARGUMENT;
  }
  if (cursor->offset == cursor->bytes.length) {
    *done = 1;
    return HMG4V2_CORE_OK;
  }
  *done = 0;
  if (!hmg4v2_range_within(cursor->offset, 8, cursor->bytes.length)) {
    return HMG4V2_CORE_TRUNCATED_TLV;
  }
  tag = hmg4v2_read_u16_be(cursor->bytes.bytes + cursor->offset);
  type = cursor->bytes.bytes[cursor->offset + 2];
  if (cursor->bytes.bytes[cursor->offset + 3] != 0) {
    return HMG4V2_CORE_BAD_RESERVED_BYTE;
  }
  length_u32 = hmg4v2_read_u32_be(cursor->bytes.bytes + cursor->offset + 4);
  if (!hmg4v2_checked_add_size(cursor->offset, 8, &value_offset) ||
      !hmg4v2_checked_add_size(value_offset, (size_t)length_u32, &next_offset)) {
    return HMG4V2_CORE_SIZE_OVERFLOW;
  }
  if (next_offset > cursor->bytes.length) return HMG4V2_CORE_TRUNCATED_TLV;
  if (cursor->has_last_tag && tag <= cursor->last_tag) {
    return HMG4V2_CORE_BAD_TLV_ORDER;
  }
  value.bytes = cursor->bytes.bytes + value_offset;
  value.length = (size_t)length_u32;
  status = validate_tlv_value(type, value);
  if (status != HMG4V2_CORE_OK) return status;
  view->tag = tag;
  view->type = type;
  view->value = value;
  cursor->offset = next_offset;
  cursor->last_tag = tag;
  cursor->has_last_tag = 1;
  return HMG4V2_CORE_OK;
}

static hmg4v2_core_result next_expected(
    hmg4v2_tlv_cursor *cursor,
    uint16_t expected_tag,
    uint8_t expected_type,
    hmg4v2_tlv_view *view) {
  int done = 0;
  hmg4v2_core_result status = hmg4v2_tlv_next(cursor, view, &done);
  if (status != HMG4V2_CORE_OK) return status;
  if (done || view->tag != expected_tag) return HMG4V2_CORE_WRONG_TAG_SET;
  if (view->type != expected_type) return HMG4V2_CORE_WRONG_FIELD_TYPE;
  return HMG4V2_CORE_OK;
}

static hmg4v2_core_result require_cursor_end(hmg4v2_tlv_cursor *cursor) {
  hmg4v2_tlv_view view;
  int done = 0;
  hmg4v2_core_result status = hmg4v2_tlv_next(cursor, &view, &done);
  if (status != HMG4V2_CORE_OK) return status;
  return done ? HMG4V2_CORE_OK : HMG4V2_CORE_WRONG_TAG_SET;
}

hmg4v2_core_result hmg4v2_validate_root_identity_syntax(
    hmg4v2_span encoded_struct) {
  static const uint8_t types[9] = {
      HMG4V2_TYPE_U64,
      HMG4V2_TYPE_U64,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_BYTES,
      HMG4V2_TYPE_SHA256,
      HMG4V2_TYPE_APPROVED_ABS_ROOT_PATH};
  hmg4v2_tlv_cursor cursor;
  hmg4v2_tlv_view view;
  size_t index = 0;
  hmg4v2_core_result status;
  hmg4v2_tlv_cursor_init(&cursor, encoded_struct);
  for (index = 0; index < 9; index += 1) {
    status = next_expected(&cursor, (uint16_t)(0x0201u + index), types[index],
                           &view);
    if (status != HMG4V2_CORE_OK) return HMG4V2_CORE_BAD_ROOT_IDENTITY;
    if (view.tag == 0x0207u && view.value.length != 16) {
      return HMG4V2_CORE_BAD_ROOT_IDENTITY;
    }
  }
  status = require_cursor_end(&cursor);
  return status == HMG4V2_CORE_OK ? HMG4V2_CORE_OK
                                 : HMG4V2_CORE_BAD_ROOT_IDENTITY;
}

static int hash_is_all_zero(hmg4v2_span hash) {
  size_t index = 0;
  if (hash.length != 32) return 0;
  for (index = 0; index < hash.length; index += 1) {
    if (hash.bytes[index] != 0) return 0;
  }
  return 1;
}

static hmg4v2_core_result validate_one_entry(
    hmg4v2_span encoded_struct,
    uint32_t expected_index,
    hmg4v2_entry_summary *summary) {
  static const uint8_t types[16] = {
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_POLICY_REL_PATH,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U64,
      HMG4V2_TYPE_SHA256,
      HMG4V2_TYPE_U64,
      HMG4V2_TYPE_U64,
      HMG4V2_TYPE_SHA256,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_SHA256,
      HMG4V2_TYPE_SHA256,
      HMG4V2_TYPE_U32};
  hmg4v2_tlv_view fields[16];
  hmg4v2_tlv_cursor cursor;
  size_t index = 0;
  uint64_t range_end = 0;
  hmg4v2_core_result status;
  if (summary == NULL) return HMG4V2_CORE_NULL_ARGUMENT;
  hmg4v2_tlv_cursor_init(&cursor, encoded_struct);
  for (index = 0; index < 16; index += 1) {
    status = next_expected(&cursor, (uint16_t)(0x0101u + index), types[index],
                           &fields[index]);
    if (status != HMG4V2_CORE_OK) return HMG4V2_CORE_BAD_ENTRY;
  }
  if (require_cursor_end(&cursor) != HMG4V2_CORE_OK) {
    return HMG4V2_CORE_BAD_ENTRY;
  }
  if (hmg4v2_read_u32_be(fields[0].value.bytes) != expected_index) {
    return HMG4V2_CORE_BAD_ENTRY;
  }
  summary->role = hmg4v2_read_u32_be(fields[1].value.bytes);
  if (summary->role < 1 || summary->role > 2) return HMG4V2_CORE_BAD_ENTRY;
  summary->path = fields[2].value;
  summary->predecessor_state = hmg4v2_read_u32_be(fields[3].value.bytes);
  if (summary->predecessor_state > 1) return HMG4V2_CORE_BAD_ENTRY;
  if (summary->predecessor_state == 0 &&
      (hmg4v2_read_u64_be(fields[4].value.bytes) != 0 ||
       !hash_is_all_zero(fields[5].value))) {
    return HMG4V2_CORE_BAD_ENTRY;
  }
  summary->desired_offset = hmg4v2_read_u64_be(fields[6].value.bytes);
  summary->desired_size = hmg4v2_read_u64_be(fields[7].value.bytes);
  if ((summary->desired_offset % 4096u) != 0 || summary->desired_size == 0 ||
      summary->desired_size > UINT64_C(4294967296) ||
      summary->desired_offset > UINT64_C(68719476736) ||
      summary->desired_size > UINT64_MAX - summary->desired_offset) {
    return HMG4V2_CORE_BAD_ENTRY;
  }
  range_end = summary->desired_offset + summary->desired_size;
  if (range_end > UINT64_C(68719476736)) return HMG4V2_CORE_BAD_ENTRY;
  if (hmg4v2_read_u32_be(fields[15].value.bytes) != 1) {
    return HMG4V2_CORE_BAD_ENTRY;
  }
  return HMG4V2_CORE_OK;
}

hmg4v2_core_result hmg4v2_validate_entry_list_syntax(
    hmg4v2_span encoded_list,
    uint32_t *predecessor_present_count) {
  hmg4v2_span paths[HMG4V2_MANAGED_ENTRY_COUNT];
  size_t offset = 0;
  uint32_t count = 0;
  uint32_t index = 0;
  uint32_t present = 0;
  int saw_report_last = 0;
  uint64_t previous_end = 0;
  hmg4v2_entry_summary summary;
  hmg4v2_core_result status;
  if (predecessor_present_count == NULL || !span_pointer_is_valid(encoded_list)) {
    return HMG4V2_CORE_NULL_ARGUMENT;
  }
  if (encoded_list.length < 4) return HMG4V2_CORE_BAD_LIST;
  count = hmg4v2_read_u32_be(encoded_list.bytes);
  if (count != HMG4V2_MANAGED_ENTRY_COUNT) return HMG4V2_CORE_BAD_LIST;
  offset = 4;
  for (index = 0; index < count; index += 1) {
    uint32_t member_length = 0;
    hmg4v2_span member;
    uint32_t prior = 0;
    if (!hmg4v2_range_within(offset, 4, encoded_list.length)) {
      return HMG4V2_CORE_BAD_LIST;
    }
    member_length = hmg4v2_read_u32_be(encoded_list.bytes + offset);
    if (!hmg4v2_checked_add_size(offset, 4, &offset) ||
        !hmg4v2_range_within(offset, (size_t)member_length,
                            encoded_list.length)) {
      return HMG4V2_CORE_BAD_LIST;
    }
    member.bytes = encoded_list.bytes + offset;
    member.length = (size_t)member_length;
    status = validate_one_entry(member, index, &summary);
    if (status != HMG4V2_CORE_OK) return status;
    if (summary.role == 2) {
      saw_report_last = 1;
    } else if (saw_report_last) {
      return HMG4V2_CORE_BAD_ROLE_ORDER;
    }
    if (index > 0 && summary.desired_offset < previous_end) {
      return HMG4V2_CORE_BAD_RANGE_ORDER;
    }
    previous_end = summary.desired_offset + summary.desired_size;
    for (prior = 0; prior < index; prior += 1) {
      if (bytes_equal(paths[prior], summary.path)) {
        return HMG4V2_CORE_DUPLICATE_PATH;
      }
      if (bytes_ascii_lower_equal(paths[prior], summary.path)) {
        return HMG4V2_CORE_CASE_COLLISION;
      }
    }
    paths[index] = summary.path;
    if (summary.predecessor_state == 1) present += 1;
    if (!hmg4v2_checked_add_size(offset, (size_t)member_length, &offset)) {
      return HMG4V2_CORE_SIZE_OVERFLOW;
    }
  }
  if (offset != encoded_list.length) return HMG4V2_CORE_BAD_LIST;
  *predecessor_present_count = present;
  return HMG4V2_CORE_OK;
}

static uint8_t top_level_type(uint16_t tag) {
  switch (tag) {
    case 0x0001:
      return HMG4V2_TYPE_SHA256;
    case 0x0002:
      return HMG4V2_TYPE_U32;
    case 0x0003:
    case 0x0004:
    case 0x0005:
    case 0x0006:
      return HMG4V2_TYPE_SHA256;
    case 0x0007:
      return HMG4V2_TYPE_STRUCT;
    case 0x0008:
    case 0x0009:
    case 0x000a:
      return HMG4V2_TYPE_SHA256;
    case 0x000b:
      return HMG4V2_TYPE_U64;
    case 0x000c:
      return HMG4V2_TYPE_U32;
    case 0x000d:
      return HMG4V2_TYPE_LIST;
    case 0x000e:
      return HMG4V2_TYPE_U32;
    case 0x000f:
      return HMG4V2_TYPE_SAFE_CUSTODY_LEAF;
    case 0x0010:
      return HMG4V2_TYPE_SHA256;
    case 0x0011:
      return HMG4V2_TYPE_BYTES;
    case 0x0012:
      return HMG4V2_TYPE_SAFE_CUSTODY_LEAF;
    case 0x0013:
      return HMG4V2_TYPE_SHA256;
    case 0x0014:
      return HMG4V2_TYPE_APPROVED_EVIDENCE_REL_PATH;
    case 0x0015:
    case 0x0016:
    case 0x0017:
    case 0x0018:
      return HMG4V2_TYPE_SHA256;
    case 0x0019:
      return HMG4V2_TYPE_U32;
    case 0x001a:
    case 0x001b:
      return HMG4V2_TYPE_SHA256;
    case 0x001c:
      return HMG4V2_TYPE_U32;
    case 0x001d:
      return HMG4V2_TYPE_SHA256;
    case 0x001e:
    case 0x001f:
      return HMG4V2_TYPE_U32;
    case 0x0020:
      return HMG4V2_TYPE_SHA256;
    case 0x0021:
      return HMG4V2_TYPE_U32;
    case 0x0022:
      return HMG4V2_TYPE_SHA256;
    default:
      return 0;
  }
}

static const hmg4v2_tlv_view *find_field(
    const hmg4v2_tlv_view *fields,
    size_t count,
    uint16_t tag) {
  size_t index = 0;
  for (index = 0; index < count; index += 1) {
    if (fields[index].tag == tag) return &fields[index];
  }
  return NULL;
}

static int tags_equal(
    const hmg4v2_tlv_view *fields,
    size_t field_count,
    const uint16_t *expected,
    size_t expected_count) {
  size_t index = 0;
  if (field_count != expected_count) return 0;
  for (index = 0; index < expected_count; index += 1) {
    if (fields[index].tag != expected[index]) return 0;
  }
  return 1;
}

static hmg4v2_core_result validate_top_level_types(
    const hmg4v2_tlv_view *fields,
    size_t count) {
  size_t index = 0;
  for (index = 0; index < count; index += 1) {
    const uint8_t expected = top_level_type(fields[index].tag);
    if (expected == 0) return HMG4V2_CORE_WRONG_TAG_SET;
    if (fields[index].type != expected) return HMG4V2_CORE_WRONG_FIELD_TYPE;
  }
  return HMG4V2_CORE_OK;
}

hmg4v2_core_result hmg4v2_validate_request_payload_syntax(
    uint32_t operation,
    hmg4v2_span payload) {
  static const uint16_t probe_tags[] = {
      0x0001, 0x0002, 0x0003, 0x0004, 0x0007};
  static const uint16_t verify_live_tags[] = {
      0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007,
      0x0008, 0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x000e,
      0x0016, 0x0017, 0x0018, 0x0019, 0x001a};
  static const uint16_t verify_receipt_tags[] = {
      0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007,
      0x0008, 0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x000e,
      0x000f, 0x0010, 0x0016, 0x0017, 0x0018, 0x0019, 0x001a};
  static const uint16_t apply_tags[] = {
      0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007,
      0x0008, 0x0009, 0x000a, 0x000b, 0x000c, 0x000d,
      0x0016, 0x0017, 0x0018, 0x0019, 0x001a, 0x001b, 0x001c,
      0x001d, 0x001e};
  static const uint16_t recover_tags[] = {
      0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007,
      0x0008, 0x0009, 0x000a, 0x000b, 0x000c, 0x000d,
      0x0011, 0x0012, 0x0013, 0x0014, 0x0015, 0x0016, 0x0017,
      0x0018, 0x0019, 0x001a, 0x001b, 0x001c, 0x001d, 0x001e,
      0x001f, 0x0020, 0x0021, 0x0022};
  hmg4v2_tlv_view fields[34];
  hmg4v2_tlv_cursor cursor;
  size_t count = 0;
  int done = 0;
  hmg4v2_core_result status;
  const hmg4v2_tlv_view *field = NULL;
  const hmg4v2_tlv_view *entry_list_field = NULL;
  uint32_t predecessor_present_count = 0;
  uint32_t expected_vector_count = 0;
  if (operation < 1 || operation > 4 || !span_pointer_is_valid(payload)) {
    return operation < 1 || operation > 4 ? HMG4V2_CORE_BAD_OPERATION
                                          : HMG4V2_CORE_NULL_ARGUMENT;
  }
  hmg4v2_tlv_cursor_init(&cursor, payload);
  while (1) {
    if (count == sizeof(fields) / sizeof(fields[0])) {
      hmg4v2_tlv_view extra;
      status = hmg4v2_tlv_next(&cursor, &extra, &done);
      if (status != HMG4V2_CORE_OK) return status;
      if (!done) return HMG4V2_CORE_TOO_MANY_TOP_LEVEL_FIELDS;
      break;
    }
    status = hmg4v2_tlv_next(&cursor, &fields[count], &done);
    if (status != HMG4V2_CORE_OK) return status;
    if (done) break;
    count += 1;
  }
  if (operation == 1) {
    if (!tags_equal(fields, count, probe_tags,
                    sizeof(probe_tags) / sizeof(probe_tags[0]))) {
      return HMG4V2_CORE_WRONG_TAG_SET;
    }
  } else if (operation == 2) {
    field = find_field(fields, count, 0x000e);
    if (field == NULL || field->type != HMG4V2_TYPE_U32) {
      return HMG4V2_CORE_WRONG_TAG_SET;
    }
    if (hmg4v2_read_u32_be(field->value.bytes) == 1) {
      if (!tags_equal(fields, count, verify_live_tags,
                      sizeof(verify_live_tags) / sizeof(verify_live_tags[0]))) {
        return HMG4V2_CORE_WRONG_TAG_SET;
      }
    } else if (hmg4v2_read_u32_be(field->value.bytes) == 2) {
      if (!tags_equal(fields, count, verify_receipt_tags,
                      sizeof(verify_receipt_tags) /
                          sizeof(verify_receipt_tags[0]))) {
        return HMG4V2_CORE_WRONG_TAG_SET;
      }
    } else {
      return HMG4V2_CORE_BAD_SCALAR_VALUE;
    }
  } else if (operation == 3) {
    if (!tags_equal(fields, count, apply_tags,
                    sizeof(apply_tags) / sizeof(apply_tags[0]))) {
      return HMG4V2_CORE_WRONG_TAG_SET;
    }
  } else {
    if (!tags_equal(fields, count, recover_tags,
                    sizeof(recover_tags) / sizeof(recover_tags[0]))) {
      return HMG4V2_CORE_WRONG_TAG_SET;
    }
  }
  status = validate_top_level_types(fields, count);
  if (status != HMG4V2_CORE_OK) return status;
  field = find_field(fields, count, 0x0001);
  if (field == NULL ||
      memcmp(field->value.bytes, hmg4v2_protocol_spec_sha256,
             sizeof(hmg4v2_protocol_spec_sha256)) != 0) {
    return HMG4V2_CORE_BAD_SCALAR_VALUE;
  }
  field = find_field(fields, count, 0x0002);
  if (field == NULL || hmg4v2_read_u32_be(field->value.bytes) != 2) {
    return HMG4V2_CORE_BAD_SCALAR_VALUE;
  }
  field = find_field(fields, count, 0x0007);
  if (field == NULL ||
      hmg4v2_validate_root_identity_syntax(field->value) != HMG4V2_CORE_OK) {
    return HMG4V2_CORE_BAD_ROOT_IDENTITY;
  }
  field = find_field(fields, count, 0x000b);
  if (field != NULL && hmg4v2_read_u64_be(field->value.bytes) != 0) {
    return HMG4V2_CORE_BAD_SCALAR_VALUE;
  }
  field = find_field(fields, count, 0x000c);
  if (field != NULL &&
      hmg4v2_read_u32_be(field->value.bytes) != HMG4V2_MANAGED_ENTRY_COUNT) {
    return HMG4V2_CORE_BAD_SCALAR_VALUE;
  }
  entry_list_field = find_field(fields, count, 0x000d);
  if (entry_list_field != NULL) {
    status = hmg4v2_validate_entry_list_syntax(
        entry_list_field->value, &predecessor_present_count);
    if (status != HMG4V2_CORE_OK) return status;
    expected_vector_count = HMG4V2_MANAGED_ENTRY_COUNT +
                            predecessor_present_count;
  }
  field = find_field(fields, count, 0x0011);
  if (field != NULL && field->value.length != 32) {
    return HMG4V2_CORE_BAD_SCALAR_VALUE;
  }
  field = find_field(fields, count, 0x0019);
  if (field != NULL) {
    const uint32_t envelope = hmg4v2_read_u32_be(field->value.bytes);
    if (envelope < 1 || envelope > 2 ||
        ((operation == 3 || operation == 4) && envelope != 2)) {
      return HMG4V2_CORE_BAD_SCALAR_VALUE;
    }
  }
  field = find_field(fields, count, 0x001c);
  if (field != NULL &&
      hmg4v2_read_u32_be(field->value.bytes) != expected_vector_count) {
    return HMG4V2_CORE_BAD_SCALAR_VALUE;
  }
  field = find_field(fields, count, 0x001e);
  if (field != NULL &&
      hmg4v2_read_u32_be(field->value.bytes) != expected_vector_count) {
    return HMG4V2_CORE_BAD_SCALAR_VALUE;
  }
  field = find_field(fields, count, 0x001f);
  if (field != NULL) {
    const uint32_t disposition = hmg4v2_read_u32_be(field->value.bytes);
    const hmg4v2_tlv_view *authorized_count =
        find_field(fields, count, 0x0021);
    uint32_t transition_count = 0;
    if (disposition < 1 || disposition > 4 || authorized_count == NULL) {
      return HMG4V2_CORE_BAD_SCALAR_VALUE;
    }
    transition_count = hmg4v2_read_u32_be(authorized_count->value.bytes);
    if (transition_count > expected_vector_count ||
        ((disposition == 3 || disposition == 4) && transition_count != 0)) {
      return HMG4V2_CORE_BAD_SCALAR_VALUE;
    }
  }
  return HMG4V2_CORE_OK;
}

hmg4v2_core_result hmg4v2_authority_validation_status(void) {
  return HMG4V2_CORE_UNFROZEN_AUTHORITY;
}

const char *hmg4v2_core_result_name(hmg4v2_core_result result) {
  static const char *const names[] = {
      "ok",
      "null-argument",
      "truncated-header",
      "bad-magic",
      "bad-version",
      "bad-operation",
      "payload-too-large",
      "size-overflow",
      "frame-length-mismatch",
      "payload-hash-mismatch",
      "truncated-tlv",
      "bad-reserved-byte",
      "bad-tlv-type",
      "bad-tlv-length",
      "bad-tlv-order",
      "bad-scalar-value",
      "bad-path",
      "too-many-top-level-fields",
      "wrong-tag-set",
      "wrong-field-type",
      "bad-root-identity",
      "bad-list",
      "bad-entry",
      "duplicate-path",
      "case-collision",
      "bad-role-order",
      "bad-range-order",
      "unfrozen-authority"};
  const size_t count = sizeof(names) / sizeof(names[0]);
  if ((size_t)result >= count) return "unknown-core-result";
  return names[(size_t)result];
}
