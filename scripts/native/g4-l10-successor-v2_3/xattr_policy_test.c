#include "xattr_policy.h"

#include <CommonCrypto/CommonDigest.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static uint64_t assertions = 0;

#define CHECK(expression)                                                   \
  do {                                                                      \
    ++assertions;                                                           \
    if (!(expression)) {                                                    \
      fprintf(stderr, "check failed at %s:%d: %s\n", __FILE__, __LINE__, \
              #expression);                                                 \
      return 1;                                                             \
    }                                                                       \
  } while (0)

typedef struct {
  uint8_t *bytes;
  size_t capacity;
  size_t length;
} buffer;

static void put_u16(uint8_t bytes[2], uint16_t value) {
  bytes[0] = (uint8_t)(value >> 8);
  bytes[1] = (uint8_t)value;
}

static void put_u32(uint8_t bytes[4], uint32_t value) {
  bytes[0] = (uint8_t)(value >> 24);
  bytes[1] = (uint8_t)(value >> 16);
  bytes[2] = (uint8_t)(value >> 8);
  bytes[3] = (uint8_t)value;
}

static void put_u64(uint8_t bytes[8], uint64_t value) {
  bytes[0] = (uint8_t)(value >> 56);
  bytes[1] = (uint8_t)(value >> 48);
  bytes[2] = (uint8_t)(value >> 40);
  bytes[3] = (uint8_t)(value >> 32);
  bytes[4] = (uint8_t)(value >> 24);
  bytes[5] = (uint8_t)(value >> 16);
  bytes[6] = (uint8_t)(value >> 8);
  bytes[7] = (uint8_t)value;
}

static int append(buffer *destination, const void *source, size_t length) {
  if (destination == NULL || source == NULL ||
      length > destination->capacity - destination->length) {
    return 0;
  }
  memcpy(destination->bytes + destination->length, source, length);
  destination->length += length;
  return 1;
}

static int append_tlv(
    buffer *destination,
    uint16_t tag,
    uint8_t type,
    const void *value,
    uint32_t length) {
  uint8_t header[8];
  put_u16(header, tag);
  header[2] = type;
  header[3] = 0;
  put_u32(header + 4, length);
  return append(destination, header, sizeof(header)) &&
         (length == 0 || append(destination, value, (size_t)length));
}

static int append_u32(buffer *destination, uint16_t tag, uint32_t value) {
  uint8_t bytes[4];
  put_u32(bytes, value);
  return append_tlv(destination, tag, HMG4V23_TLV_U32, bytes, 4);
}

static int append_u64(buffer *destination, uint16_t tag, uint64_t value) {
  uint8_t bytes[8];
  put_u64(bytes, value);
  return append_tlv(destination, tag, HMG4V23_TLV_U64, bytes, 8);
}

static int append_rule(
    buffer *list,
    uint32_t ordinal,
    hmg4v23_span name,
    hmg4v23_span value) {
  uint8_t member_bytes[4352];
  uint8_t member_length[4];
  buffer member = {member_bytes, sizeof(member_bytes), 0};
  if (name.length > UINT32_MAX || value.length > UINT32_MAX ||
      !append_u32(&member, 0x7101, ordinal) ||
      !append_tlv(&member, 0x7102, HMG4V23_TLV_BYTES,
                  name.bytes, (uint32_t)name.length) ||
      !append_tlv(&member, 0x7103, HMG4V23_TLV_BYTES,
                  value.length == 0 ? member_bytes : value.bytes,
                  (uint32_t)value.length)) {
    return 0;
  }
  put_u32(member_length, (uint32_t)member.length);
  return append(list, member_length, sizeof(member_length)) &&
         append(list, member.bytes, member.length);
}

static int canonical_xattr_hash(
    const hmg4v23_xattr *rules,
    uint32_t count,
    uint8_t digest[32]) {
  static uint8_t stream[HMG4V23_XATTR_POLICY_MAX_STREAM_LENGTH];
  size_t written = 0;
  if (hmg4v23_xattr_set_stream_encode(
          rules, count, hmg4v23_canonical_xattr_policy_bounds(),
          stream, sizeof(stream), &written) != HMG4V23_CANONICAL_OK) {
    return 0;
  }
  return hmg4v23_xattr_set_stream_sha256(
             stream, written, hmg4v23_canonical_xattr_policy_bounds(), digest) ==
         HMG4V23_CANONICAL_OK;
}

static int build_policy(
    const hmg4v23_xattr *rules,
    const uint32_t *ordinals,
    uint32_t count,
    int exact_empty,
    const uint8_t specification[32],
    const uint8_t canonical_hash_override[32],
    buffer *frame) {
  static uint8_t payload_bytes[400000];
  static uint8_t list_bytes[350000];
  uint8_t canonical_hash[32];
  uint8_t list_count[4];
  uint8_t bool_value = exact_empty ? 1 : 0;
  uint8_t header[HMG4V23_AUTHORITY_HEADER_SIZE];
  buffer payload = {payload_bytes, sizeof(payload_bytes), 0};
  buffer list = {list_bytes, sizeof(list_bytes), 0};
  uint32_t index = 0;
  if (frame == NULL || specification == NULL) return 0;
  put_u32(list_count, count);
  if (!append(&list, list_count, sizeof(list_count))) return 0;
  for (index = 0; index < count; ++index) {
    const uint32_t ordinal = ordinals == NULL ? index : ordinals[index];
    if (!append_rule(&list, ordinal,
                     (hmg4v23_span){rules[index].name, rules[index].name_length},
                     (hmg4v23_span){rules[index].value,
                                    (size_t)rules[index].value_length})) {
      return 0;
    }
  }
  if (canonical_hash_override != NULL) {
    memcpy(canonical_hash, canonical_hash_override, sizeof(canonical_hash));
  } else if (!canonical_xattr_hash(rules, count, canonical_hash)) {
    return 0;
  }
  if (!append_tlv(&payload, 0x7001, HMG4V23_TLV_SHA256,
                  specification, 32) ||
      !append_u32(&payload, 0x7002, 2) ||
      !append_u32(&payload, 0x7003, 1) ||
      !append_u32(&payload, 0x7004, count) ||
      !append_tlv(&payload, 0x7005, HMG4V23_TLV_LIST,
                  list.bytes, (uint32_t)list.length) ||
      !append_tlv(&payload, 0x7006, HMG4V23_TLV_SHA256,
                  canonical_hash, 32) ||
      !append_u32(&payload, 0x7007, 127) ||
      !append_u64(&payload, 0x7008, 4096) ||
      !append_u64(&payload, 0x7009, 65536) ||
      !append_u64(&payload, 0x700a, 524288) ||
      !append_tlv(&payload, 0x700b, HMG4V23_TLV_BOOL, &bool_value, 1) ||
      !append_u64(&payload, 0x700c, 0)) {
    return 0;
  }
  memset(header, 0, sizeof(header));
  memcpy(header, "HMG4Y2", 6);
  put_u32(header + 8, 2);
  put_u32(header + 12, 1);
  put_u64(header + 16, (uint64_t)payload.length);
  if (CC_SHA256(payload.bytes, (CC_LONG)payload.length, header + 24) == NULL) {
    return 0;
  }
  frame->length = 0;
  return append(frame, header, sizeof(header)) &&
         append(frame, payload.bytes, payload.length);
}

int main(void) {
  static uint8_t frame_storage[450000];
  static uint8_t mutation_storage[450000];
  static uint8_t large_value[4096];
  static hmg4v23_xattr large_rules[17];
  static const uint8_t name_a[] = "com.example.a";
  static const uint8_t name_b[] = "com.example.b";
  static const uint8_t value_a[] = {0x00, 0x01};
  static const uint8_t value_b[] = {0xfe, 0xff, 0x00};
  hmg4v23_xattr rules[2];
  hmg4v23_xattr reversed[2];
  hmg4v23_xattr_policy_view view;
  buffer frame = {frame_storage, sizeof(frame_storage), 0};
  buffer mutation = {mutation_storage, sizeof(mutation_storage), 0};
  uint8_t bad_spec[32];
  uint8_t bad_hash[32];
  uint32_t bad_ordinals[2] = {0, 0};
  uint32_t index = 0;

  memset(rules, 0, sizeof(rules));
  rules[0] = (hmg4v23_xattr){name_a, sizeof(name_a) - 1,
                            value_a, sizeof(value_a)};
  rules[1] = (hmg4v23_xattr){name_b, sizeof(name_b) - 1,
                            value_b, sizeof(value_b)};

  CHECK(hmg4v23_xattr_bounds_are_exact_policy(
      hmg4v23_canonical_xattr_policy_bounds()));
  CHECK(build_policy(rules, NULL, 2, 0, hmg4v23_successor_sha256, NULL, &frame));
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){frame.bytes, frame.length}, &view) ==
        HMG4V23_XATTR_POLICY_OK);
  CHECK(view.attribute_count == 2 && view.total_value_length == 5);
  CHECK(view.canonical_xattr_set_stream_length ==
        16 + 4 + sizeof(name_a) - 1 + 8 + sizeof(value_a) +
             4 + sizeof(name_b) - 1 + 8 + sizeof(value_b));
  CHECK(view.exact_empty_set == 0);
  CHECK(view.attributes[0].ordinal == 0 &&
        view.attributes[1].ordinal == 1);

  frame.length = 0;
  CHECK(build_policy(NULL, NULL, 0, 1, hmg4v23_successor_sha256, NULL, &frame));
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){frame.bytes, frame.length}, &view) ==
        HMG4V23_XATTR_POLICY_OK);
  CHECK(view.attribute_count == 0 && view.exact_empty_set == 1 &&
        view.canonical_xattr_set_stream_length == 16);

  memcpy(mutation.bytes, frame.bytes, frame.length);
  mutation.length = frame.length;
  mutation.bytes[24] ^= 1;
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){mutation.bytes, mutation.length}, &view) ==
        HMG4V23_XATTR_POLICY_ENVELOPE_INVALID);

  memset(bad_spec, 0xa5, sizeof(bad_spec));
  frame.length = 0;
  CHECK(build_policy(NULL, NULL, 0, 1, bad_spec, NULL, &frame));
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){frame.bytes, frame.length}, &view) ==
        HMG4V23_XATTR_POLICY_SPECIFICATION_MISMATCH);

  frame.length = 0;
  CHECK(build_policy(rules, bad_ordinals, 2, 0,
                     hmg4v23_successor_sha256, NULL, &frame));
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){frame.bytes, frame.length}, &view) ==
        HMG4V23_XATTR_POLICY_ORDINAL_INVALID);

  memset(bad_hash, 0x7b, sizeof(bad_hash));
  reversed[0] = rules[1];
  reversed[1] = rules[0];
  frame.length = 0;
  CHECK(build_policy(reversed, NULL, 2, 0,
                     hmg4v23_successor_sha256, bad_hash, &frame));
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){frame.bytes, frame.length}, &view) ==
        HMG4V23_XATTR_POLICY_NAME_ORDER_INVALID);

  frame.length = 0;
  CHECK(build_policy(rules, NULL, 2, 0,
                     hmg4v23_successor_sha256, bad_hash, &frame));
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){frame.bytes, frame.length}, &view) ==
        HMG4V23_XATTR_POLICY_STREAM_HASH_MISMATCH);

  frame.length = 0;
  CHECK(build_policy(NULL, NULL, 0, 0,
                     hmg4v23_successor_sha256, NULL, &frame));
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){frame.bytes, frame.length}, &view) ==
        HMG4V23_XATTR_POLICY_EMPTY_FLAG_MISMATCH);

  memset(large_value, 0x6d, sizeof(large_value));
  for (index = 0; index < 17; ++index) {
    static uint8_t names[17][2];
    names[index][0] = (uint8_t)('A' + index);
    names[index][1] = 0;
    large_rules[index] = (hmg4v23_xattr){names[index], 1,
                                         large_value, sizeof(large_value)};
  }
  frame.length = 0;
  CHECK(build_policy(large_rules, NULL, 17, 0,
                     hmg4v23_successor_sha256, bad_hash, &frame));
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){frame.bytes, frame.length}, &view) ==
        HMG4V23_XATTR_POLICY_BOUND_EXCEEDED);

  CHECK(hmg4v23_validate_xattr_policy((hmg4v23_span){NULL, 1}, &view) ==
        HMG4V23_XATTR_POLICY_NULL_ARGUMENT);
  CHECK(hmg4v23_validate_xattr_policy(
            (hmg4v23_span){frame.bytes, frame.length}, NULL) ==
        HMG4V23_XATTR_POLICY_NULL_ARGUMENT);
  CHECK(strcmp(hmg4v23_xattr_policy_result_name(
                   HMG4V23_XATTR_POLICY_STREAM_HASH_MISMATCH),
               "stream_hash_mismatch") == 0);
  CHECK(strcmp(hmg4v23_xattr_policy_result_name(
                   (hmg4v23_xattr_policy_result)999),
               "unknown") == 0);

  printf("xattr_policy assertions=%llu\n",
         (unsigned long long)assertions);
  return 0;
}
