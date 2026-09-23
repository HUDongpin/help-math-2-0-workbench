#include "response_codec.h"

#include <string.h>

static const uint8_t response_magic[8] = {
    'H', 'M', 'G', '4', 'R', '2', 0, 0};

static int span_pointer_is_valid(hmg4v23_span span) {
  return span.length == 0 || span.bytes != NULL;
}

static int digest_is_zero(const uint8_t digest[32]) {
  size_t index;
  uint8_t aggregate = 0;
  if (digest == NULL) return 1;
  for (index = 0; index < 32; ++index) aggregate |= digest[index];
  return aggregate == 0;
}

static uint8_t lower_hex_digit(uint8_t value) {
  return value < 10 ? (uint8_t)((uint8_t)'0' + value)
                    : (uint8_t)((uint8_t)'a' + (uint8_t)(value - 10));
}

static int lower_hex_equals_digest(hmg4v23_span encoded,
                                   const uint8_t digest[32]) {
  size_t index;
  if (encoded.bytes == NULL || encoded.length != 64 || digest == NULL) return 0;
  for (index = 0; index < 32; ++index) {
    if (encoded.bytes[index * 2] !=
            lower_hex_digit((uint8_t)(digest[index] >> 4)) ||
        encoded.bytes[index * 2 + 1] !=
            lower_hex_digit((uint8_t)(digest[index] & 0x0f))) {
      return 0;
    }
  }
  return 1;
}

static hmg4v23_response_result expected_presence(
    uint32_t operation,
    uint32_t status,
    uint32_t supplied_presence,
    uint32_t *expected) {
  uint32_t value = 0;
  if (expected == NULL) return HMG4V23_RESPONSE_NULL_ARGUMENT;
  if (operation < 1 || operation > 4) {
    return HMG4V23_RESPONSE_OPERATION_INVALID;
  }
  if (status > 6) return HMG4V23_RESPONSE_STATUS_INVALID;
  if (operation == 1) {
    if (status == 0 || status == 1 || status == 6) {
      value = HMG4V23_RESPONSE_HAS_CAPABILITY;
    } else if (status != 5) {
      return HMG4V23_RESPONSE_STATUS_OPERATION_INVALID;
    }
  } else if (operation == 2) {
    if (status == 0 || status == 1 || status == 3 || status == 4) {
      value = HMG4V23_RESPONSE_HAS_CURRENT_STATE;
    } else if (status == 6) {
      value = HMG4V23_RESPONSE_HAS_CURRENT_STATE |
              HMG4V23_RESPONSE_HAS_CAPABILITY;
    } else if (status != 5) {
      return HMG4V23_RESPONSE_STATUS_OPERATION_INVALID;
    }
  } else if (status == 0 || status == 2) {
    value = HMG4V23_RESPONSE_HAS_TRANSACTION |
            HMG4V23_RESPONSE_HAS_CURRENT_STATE |
            HMG4V23_RESPONSE_HAS_TERMINAL;
  } else if (status == 3) {
    value = HMG4V23_RESPONSE_HAS_TRANSACTION |
            HMG4V23_RESPONSE_HAS_CURRENT_STATE;
  } else if (status == 4) {
    value = HMG4V23_RESPONSE_HAS_TRANSACTION |
            HMG4V23_RESPONSE_HAS_CURRENT_STATE;
    if ((supplied_presence & HMG4V23_RESPONSE_HAS_TERMINAL) != 0) {
      value |= HMG4V23_RESPONSE_HAS_TERMINAL;
    }
  } else if (status == 1) {
    value = HMG4V23_RESPONSE_HAS_CURRENT_STATE;
  } else if (status == 6) {
    value = HMG4V23_RESPONSE_HAS_CURRENT_STATE |
            HMG4V23_RESPONSE_HAS_CAPABILITY;
  } else if (status != 5) {
    return HMG4V23_RESPONSE_STATUS_OPERATION_INVALID;
  }
  *expected = value;
  return HMG4V23_RESPONSE_OK;
}

static hmg4v23_response_result validate_custody_binding(
    hmg4v23_span leaf,
    hmg4v23_custody_variant expected_variant,
    const uint8_t transaction_id[32],
    const uint8_t digest[32],
    hmg4v23_response_result failure) {
  hmg4v23_custody_leaf parsed;
  if (!hmg4v23_parse_custody_leaf(leaf, &parsed) ||
      parsed.variant != expected_variant ||
      parsed.managed_index != HMG4V23_NO_INDEX ||
      !lower_hex_equals_digest(parsed.transaction_id_hex, transaction_id) ||
      !lower_hex_equals_digest(parsed.digest_hex, digest)) {
    return failure;
  }
  return HMG4V23_RESPONSE_OK;
}

static hmg4v23_response_result validate_fields(
    const hmg4v23_response_fields *fields) {
  uint32_t expected = 0;
  hmg4v23_response_result result;
  if (fields == NULL || !span_pointer_is_valid(fields->journal_leaf) ||
      !span_pointer_is_valid(fields->terminal_receipt_leaf)) {
    return HMG4V23_RESPONSE_NULL_ARGUMENT;
  }
  result = expected_presence(fields->operation, fields->status,
                             fields->present_fields, &expected);
  if (result != HMG4V23_RESPONSE_OK) return result;
  if (fields->present_fields != expected) {
    return HMG4V23_RESPONSE_PRESENCE_INVALID;
  }
  if (hmg4v23_validate_diagnostic_status(fields->diagnostic_code,
                                         fields->status) != HMG4V23_OK) {
    return HMG4V23_RESPONSE_DIAGNOSTIC_INVALID;
  }
  if ((expected & HMG4V23_RESPONSE_HAS_CAPABILITY) != 0) {
    const uint32_t required = fields->status == 6 ? 2u : 1u;
    if (fields->capability_state != required) {
      return HMG4V23_RESPONSE_CAPABILITY_INVALID;
    }
  }
  if ((expected & HMG4V23_RESPONSE_HAS_CURRENT_STATE) != 0 &&
      fields->status != 1 && fields->status != 6 &&
      digest_is_zero(fields->observed_current_set_sha256)) {
    return HMG4V23_RESPONSE_CURRENT_STATE_INVALID;
  }
  if ((expected & HMG4V23_RESPONSE_HAS_TRANSACTION) != 0) {
    if (digest_is_zero(fields->transaction_id) ||
        digest_is_zero(fields->journal_sha256) ||
        digest_is_zero(fields->sequence_zero_record_sha256)) {
      return HMG4V23_RESPONSE_TRANSACTION_INVALID;
    }
    result = validate_custody_binding(
        fields->journal_leaf, HMG4V23_CUSTODY_JOURNAL,
        fields->transaction_id, fields->sequence_zero_record_sha256,
        HMG4V23_RESPONSE_JOURNAL_LEAF_INVALID);
    if (result != HMG4V23_RESPONSE_OK) return result;
  }
  if ((expected & HMG4V23_RESPONSE_HAS_TERMINAL) != 0) {
    if (digest_is_zero(fields->terminal_receipt_sha256)) {
      return HMG4V23_RESPONSE_TERMINAL_INVALID;
    }
    if ((fields->status == 0 &&
         fields->terminal_state != 1 && fields->terminal_state != 2) ||
        (fields->status == 2 && fields->terminal_state != 3) ||
        (fields->status == 4 && fields->terminal_state != 4) ||
        (fields->status != 0 && fields->status != 2 && fields->status != 4)) {
      return HMG4V23_RESPONSE_TERMINAL_INVALID;
    }
    result = validate_custody_binding(
        fields->terminal_receipt_leaf, HMG4V23_CUSTODY_RECEIPT,
        fields->transaction_id, fields->terminal_receipt_sha256,
        HMG4V23_RESPONSE_RECEIPT_LEAF_INVALID);
    if (result != HMG4V23_RESPONSE_OK) return result;
  }
  return HMG4V23_RESPONSE_OK;
}

static int add_tlv_size(size_t *total, size_t value_length) {
  size_t field_length = 0;
  if (total == NULL ||
      !hmg4v23_checked_add_size(HMG4V23_TLV_HEADER_SIZE, value_length,
                               &field_length) ||
      !hmg4v23_checked_add_size(*total, field_length, total)) {
    return 0;
  }
  return 1;
}

hmg4v23_response_result hmg4v23_response_payload_length(
    const hmg4v23_response_fields *fields,
    size_t *payload_length) {
  size_t total = 0;
  hmg4v23_response_result result;
  if (payload_length == NULL) return HMG4V23_RESPONSE_NULL_ARGUMENT;
  result = validate_fields(fields);
  if (result != HMG4V23_RESPONSE_OK) return result;
  if (!add_tlv_size(&total, 4) || !add_tlv_size(&total, 32)) {
    return HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE;
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_TRANSACTION) != 0 &&
      (!add_tlv_size(&total, 32) ||
       !add_tlv_size(&total, fields->journal_leaf.length) ||
       !add_tlv_size(&total, 32))) {
    return HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE;
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_TERMINAL) != 0 &&
      (!add_tlv_size(&total, fields->terminal_receipt_leaf.length) ||
       !add_tlv_size(&total, 32) || !add_tlv_size(&total, 4))) {
    return HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE;
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_CURRENT_STATE) != 0 &&
      !add_tlv_size(&total, 32)) {
    return HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE;
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_CAPABILITY) != 0 &&
      !add_tlv_size(&total, 4)) {
    return HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE;
  }
  if ((uint64_t)total > HMG4V23_RESPONSE_MAX_PAYLOAD) {
    return HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE;
  }
  *payload_length = total;
  return HMG4V23_RESPONSE_OK;
}

typedef struct {
  uint8_t *bytes;
  size_t capacity;
  size_t offset;
} response_writer;

static int write_bytes(response_writer *writer,
                       const void *bytes,
                       size_t length) {
  if (writer == NULL || (length != 0 && bytes == NULL) ||
      !hmg4v23_range_within(writer->offset, length, writer->capacity)) {
    return 0;
  }
  if (length != 0) memmove(writer->bytes + writer->offset, bytes, length);
  writer->offset += length;
  return 1;
}

static int write_tlv(response_writer *writer,
                     uint16_t tag,
                     uint8_t type,
                     const void *value,
                     size_t value_length) {
  uint8_t header[HMG4V23_TLV_HEADER_SIZE];
  if (value_length > UINT32_MAX) return 0;
  hmg4v23_write_u16_be(header, tag);
  header[2] = type;
  header[3] = 0;
  hmg4v23_write_u32_be(header + 4, (uint32_t)value_length);
  return write_bytes(writer, header, sizeof(header)) &&
         write_bytes(writer, value, value_length);
}

static int write_tlv_u32(response_writer *writer,
                         uint16_t tag,
                         uint32_t value) {
  uint8_t encoded[4];
  hmg4v23_write_u32_be(encoded, value);
  return write_tlv(writer, tag, HMG4V23_TLV_U32, encoded, sizeof(encoded));
}

static int write_tlv_sha(response_writer *writer,
                         uint16_t tag,
                         const uint8_t digest[32]) {
  return write_tlv(writer, tag, HMG4V23_TLV_SHA256, digest, 32);
}

hmg4v23_response_result hmg4v23_encode_response_frame(
    const hmg4v23_response_fields *fields,
    uint8_t *output,
    size_t output_capacity,
    size_t *output_length) {
  size_t payload_length = 0;
  size_t frame_length = 0;
  uint8_t payload_sha256[32];
  response_writer writer;
  hmg4v23_response_result result;
  if (output == NULL || output_length == NULL) {
    return HMG4V23_RESPONSE_NULL_ARGUMENT;
  }
  result = hmg4v23_response_payload_length(fields, &payload_length);
  if (result != HMG4V23_RESPONSE_OK) return result;
  if (!hmg4v23_checked_add_size(HMG4V23_RESPONSE_HEADER_SIZE, payload_length,
                               &frame_length)) {
    return HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE;
  }
  if (output_capacity < frame_length) {
    return HMG4V23_RESPONSE_OUTPUT_TOO_SMALL;
  }
  writer.bytes = output;
  writer.capacity = frame_length;
  writer.offset = HMG4V23_RESPONSE_HEADER_SIZE;
  if (!write_tlv_u32(&writer, 0x8001, fields->diagnostic_code) ||
      !write_tlv_sha(&writer, 0x8002, fields->request_payload_sha256)) {
    return HMG4V23_RESPONSE_OUTPUT_TOO_SMALL;
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_TRANSACTION) != 0 &&
      (!write_tlv(&writer, 0x8003, HMG4V23_TLV_BYTES,
                  fields->transaction_id, 32) ||
       !write_tlv(&writer, 0x8004, HMG4V23_TLV_SAFE_CUSTODY_LEAF,
                  fields->journal_leaf.bytes, fields->journal_leaf.length) ||
       !write_tlv_sha(&writer, 0x8005, fields->journal_sha256))) {
    return HMG4V23_RESPONSE_OUTPUT_TOO_SMALL;
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_TERMINAL) != 0 &&
      (!write_tlv(&writer, 0x8006, HMG4V23_TLV_SAFE_CUSTODY_LEAF,
                  fields->terminal_receipt_leaf.bytes,
                  fields->terminal_receipt_leaf.length) ||
       !write_tlv_sha(&writer, 0x8007, fields->terminal_receipt_sha256) ||
       !write_tlv_u32(&writer, 0x8008, fields->terminal_state))) {
    return HMG4V23_RESPONSE_OUTPUT_TOO_SMALL;
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_CURRENT_STATE) != 0 &&
      !write_tlv_sha(&writer, 0x8009,
                     fields->observed_current_set_sha256)) {
    return HMG4V23_RESPONSE_OUTPUT_TOO_SMALL;
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_CAPABILITY) != 0 &&
      !write_tlv_u32(&writer, 0x800a, fields->capability_state)) {
    return HMG4V23_RESPONSE_OUTPUT_TOO_SMALL;
  }
  if (writer.offset != frame_length ||
      hmg4v23_sha256((hmg4v23_span){output + HMG4V23_RESPONSE_HEADER_SIZE,
                                   payload_length},
                     payload_sha256) != HMG4V23_OK) {
    return HMG4V23_RESPONSE_HASH_ENGINE_FAILURE;
  }
  memcpy(output, response_magic, sizeof(response_magic));
  hmg4v23_write_u32_be(output + 8, 2);
  hmg4v23_write_u32_be(output + 12, fields->status);
  hmg4v23_write_u64_be(output + 16, (uint64_t)payload_length);
  memcpy(output + 24, payload_sha256, sizeof(payload_sha256));
  *output_length = frame_length;
  return HMG4V23_RESPONSE_OK;
}

static hmg4v23_response_result read_response_payload(
    uint32_t operation,
    uint32_t status,
    hmg4v23_span payload,
    const uint8_t sequence_zero_record_sha256[32],
    hmg4v23_response_fields *fields) {
  hmg4v23_tlv_cursor cursor;
  hmg4v23_tlv_view tlv;
  hmg4v23_tlv_result tlv_result;
  int done = 0;
  uint32_t seen = 0;
  if (fields == NULL) return HMG4V23_RESPONSE_NULL_ARGUMENT;
  memset(fields, 0, sizeof(*fields));
  fields->operation = operation;
  fields->status = status;
  hmg4v23_tlv_cursor_init(&cursor, payload);
  while (!done) {
    tlv_result = hmg4v23_tlv_next_raw(&cursor, &tlv, &done);
    if (tlv_result != HMG4V23_TLV_OK) return HMG4V23_RESPONSE_TLV_INVALID;
    if (done) break;
    if (tlv.tag == 0x8001 && tlv.type == HMG4V23_TLV_U32 &&
        tlv.value.length == 4) {
      fields->diagnostic_code = hmg4v23_read_u32_be(tlv.value.bytes);
      seen |= UINT32_C(1) << 0;
    } else if (tlv.tag == 0x8002 && tlv.type == HMG4V23_TLV_SHA256 &&
               tlv.value.length == 32) {
      memcpy(fields->request_payload_sha256, tlv.value.bytes, 32);
      seen |= UINT32_C(1) << 1;
    } else if (tlv.tag == 0x8003 && tlv.type == HMG4V23_TLV_BYTES &&
               tlv.value.length == 32) {
      memcpy(fields->transaction_id, tlv.value.bytes, 32);
      fields->present_fields |= HMG4V23_RESPONSE_HAS_TRANSACTION;
      seen |= UINT32_C(1) << 2;
    } else if (tlv.tag == 0x8004 &&
               tlv.type == HMG4V23_TLV_SAFE_CUSTODY_LEAF) {
      fields->journal_leaf = tlv.value;
      seen |= UINT32_C(1) << 3;
    } else if (tlv.tag == 0x8005 && tlv.type == HMG4V23_TLV_SHA256 &&
               tlv.value.length == 32) {
      memcpy(fields->journal_sha256, tlv.value.bytes, 32);
      seen |= UINT32_C(1) << 4;
    } else if (tlv.tag == 0x8006 &&
               tlv.type == HMG4V23_TLV_SAFE_CUSTODY_LEAF) {
      fields->terminal_receipt_leaf = tlv.value;
      fields->present_fields |= HMG4V23_RESPONSE_HAS_TERMINAL;
      seen |= UINT32_C(1) << 5;
    } else if (tlv.tag == 0x8007 && tlv.type == HMG4V23_TLV_SHA256 &&
               tlv.value.length == 32) {
      memcpy(fields->terminal_receipt_sha256, tlv.value.bytes, 32);
      seen |= UINT32_C(1) << 6;
    } else if (tlv.tag == 0x8008 && tlv.type == HMG4V23_TLV_U32 &&
               tlv.value.length == 4) {
      fields->terminal_state = hmg4v23_read_u32_be(tlv.value.bytes);
      seen |= UINT32_C(1) << 7;
    } else if (tlv.tag == 0x8009 && tlv.type == HMG4V23_TLV_SHA256 &&
               tlv.value.length == 32) {
      memcpy(fields->observed_current_set_sha256, tlv.value.bytes, 32);
      fields->present_fields |= HMG4V23_RESPONSE_HAS_CURRENT_STATE;
      seen |= UINT32_C(1) << 8;
    } else if (tlv.tag == 0x800a && tlv.type == HMG4V23_TLV_U32 &&
               tlv.value.length == 4) {
      fields->capability_state = hmg4v23_read_u32_be(tlv.value.bytes);
      fields->present_fields |= HMG4V23_RESPONSE_HAS_CAPABILITY;
      seen |= UINT32_C(1) << 9;
    } else {
      return HMG4V23_RESPONSE_TLV_INVALID;
    }
  }
  if ((seen & (UINT32_C(1) << 0)) == 0 ||
      (seen & (UINT32_C(1) << 1)) == 0) {
    return HMG4V23_RESPONSE_PRESENCE_INVALID;
  }
  {
    const uint32_t transaction_group =
        (UINT32_C(1) << 2) | (UINT32_C(1) << 3) | (UINT32_C(1) << 4);
    const uint32_t transaction_seen = seen & transaction_group;
    if (transaction_seen != 0 && transaction_seen != transaction_group) {
      return HMG4V23_RESPONSE_PRESENCE_INVALID;
    }
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_TRANSACTION) != 0) {
    if (sequence_zero_record_sha256 == NULL) {
      return HMG4V23_RESPONSE_CONTEXT_REQUIRED;
    }
    memcpy(fields->sequence_zero_record_sha256,
           sequence_zero_record_sha256, 32);
  } else if (sequence_zero_record_sha256 != NULL) {
    return HMG4V23_RESPONSE_CONTEXT_FORBIDDEN;
  }
  if ((fields->present_fields & HMG4V23_RESPONSE_HAS_TERMINAL) != 0) {
    const uint32_t terminal_group =
        (UINT32_C(1) << 5) | (UINT32_C(1) << 6) | (UINT32_C(1) << 7);
    if ((seen & terminal_group) != terminal_group) {
      return HMG4V23_RESPONSE_PRESENCE_INVALID;
    }
  } else if ((seen & ((UINT32_C(1) << 6) | (UINT32_C(1) << 7))) != 0) {
    return HMG4V23_RESPONSE_PRESENCE_INVALID;
  }
  return validate_fields(fields);
}

hmg4v23_response_result hmg4v23_validate_response_frame(
    uint32_t expected_operation,
    hmg4v23_span complete_frame,
    const uint8_t expected_sequence_zero_record_sha256[32],
    hmg4v23_response_frame_view *view) {
  uint64_t payload_length_u64;
  size_t payload_length;
  size_t expected_length;
  uint8_t payload_sha256[32];
  hmg4v23_response_result result;
  if (view == NULL || !span_pointer_is_valid(complete_frame)) {
    return HMG4V23_RESPONSE_NULL_ARGUMENT;
  }
  if (expected_operation < 1 || expected_operation > 4) {
    return HMG4V23_RESPONSE_OPERATION_INVALID;
  }
  if (complete_frame.length < HMG4V23_RESPONSE_HEADER_SIZE) {
    return HMG4V23_RESPONSE_FRAME_TOO_SHORT;
  }
  if (memcmp(complete_frame.bytes, response_magic, sizeof(response_magic)) != 0) {
    return HMG4V23_RESPONSE_MAGIC_INVALID;
  }
  if (hmg4v23_read_u32_be(complete_frame.bytes + 8) != 2) {
    return HMG4V23_RESPONSE_VERSION_INVALID;
  }
  if (hmg4v23_read_u32_be(complete_frame.bytes + 12) > 6) {
    return HMG4V23_RESPONSE_STATUS_INVALID;
  }
  payload_length_u64 = hmg4v23_read_u64_be(complete_frame.bytes + 16);
  if (payload_length_u64 > HMG4V23_RESPONSE_MAX_PAYLOAD ||
      payload_length_u64 > (uint64_t)SIZE_MAX) {
    return HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE;
  }
  payload_length = (size_t)payload_length_u64;
  if (!hmg4v23_checked_add_size(HMG4V23_RESPONSE_HEADER_SIZE, payload_length,
                               &expected_length) ||
      complete_frame.length != expected_length) {
    return HMG4V23_RESPONSE_FRAME_LENGTH_INVALID;
  }
  if (hmg4v23_sha256(
          (hmg4v23_span){complete_frame.bytes + HMG4V23_RESPONSE_HEADER_SIZE,
                         payload_length},
          payload_sha256) != HMG4V23_OK) {
    return HMG4V23_RESPONSE_HASH_ENGINE_FAILURE;
  }
  if (memcmp(payload_sha256, complete_frame.bytes + 24, 32) != 0) {
    return HMG4V23_RESPONSE_PAYLOAD_HASH_INVALID;
  }
  memset(view, 0, sizeof(*view));
  view->complete_frame = complete_frame;
  view->payload = (hmg4v23_span){
      complete_frame.bytes + HMG4V23_RESPONSE_HEADER_SIZE, payload_length};
  result = read_response_payload(
      expected_operation, hmg4v23_read_u32_be(complete_frame.bytes + 12),
      view->payload, expected_sequence_zero_record_sha256, &view->fields);
  if (result != HMG4V23_RESPONSE_OK) return result;
  if (hmg4v23_sha256(complete_frame, view->response_frame_sha256) != HMG4V23_OK) {
    return HMG4V23_RESPONSE_HASH_ENGINE_FAILURE;
  }
  return HMG4V23_RESPONSE_OK;
}

int hmg4v23_response_exit_code(uint32_t status, int *exit_code) {
  static const int exits[] = {0, 20, 20, 30, 40, 64, 70};
  if (exit_code == NULL || status > 6) return 0;
  *exit_code = exits[status];
  return 1;
}

const char *hmg4v23_response_result_name(hmg4v23_response_result result) {
  static const char *const names[] = {
      "OK", "NULL_ARGUMENT", "OPERATION_INVALID", "STATUS_INVALID",
      "STATUS_OPERATION_INVALID", "DIAGNOSTIC_INVALID", "PRESENCE_INVALID",
      "CAPABILITY_INVALID", "CURRENT_STATE_INVALID", "TRANSACTION_INVALID",
      "JOURNAL_LEAF_INVALID", "TERMINAL_INVALID", "RECEIPT_LEAF_INVALID",
      "CONTEXT_REQUIRED", "CONTEXT_FORBIDDEN", "OUTPUT_TOO_SMALL",
      "FRAME_TOO_SHORT", "MAGIC_INVALID", "VERSION_INVALID",
      "PAYLOAD_TOO_LARGE", "FRAME_LENGTH_INVALID", "PAYLOAD_HASH_INVALID",
      "TLV_INVALID", "HASH_ENGINE_FAILURE"};
  const size_t ordinal = (size_t)result;
  return ordinal < sizeof(names) / sizeof(names[0])
             ? names[ordinal]
             : "UNKNOWN_RESPONSE_RESULT";
}
