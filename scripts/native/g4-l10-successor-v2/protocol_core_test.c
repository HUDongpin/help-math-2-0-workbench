#include "protocol_core.h"

#include <stdio.h>
#include <string.h>

enum {
  TYPE_U32 = 0x01,
  TYPE_U64 = 0x02,
  TYPE_SHA256 = 0x04,
  TYPE_BYTES = 0x05,
  TYPE_POLICY_REL_PATH = 0x06,
  TYPE_STRUCT = 0x07,
  TYPE_LIST = 0x08,
  TYPE_APPROVED_ABS_ROOT_PATH = 0x09
};

typedef struct {
  uint8_t *bytes;
  size_t capacity;
  size_t length;
  int failed;
} test_builder;

typedef struct {
  int duplicate_path;
  int case_collision;
  int bad_role_order;
  int overlapping_range;
  int bad_absent_hash;
  int nonzero_acceptance;
} build_options;

static unsigned int assertion_count = 0;

#define REQUIRE(condition)                                                     \
  do {                                                                         \
    assertion_count += 1;                                                      \
    if (!(condition)) {                                                        \
      fprintf(stderr, "FAIL line %d: %s\n", __LINE__, #condition);           \
      return 1;                                                                \
    }                                                                          \
  } while (0)

static hmg4v2_span span_of(const void *bytes, size_t length) {
  hmg4v2_span result;
  result.bytes = (const uint8_t *)bytes;
  result.length = length;
  return result;
}

static void builder_init(test_builder *builder, uint8_t *bytes, size_t capacity) {
  builder->bytes = bytes;
  builder->capacity = capacity;
  builder->length = 0;
  builder->failed = 0;
}

static void builder_put(test_builder *builder, const void *bytes, size_t length) {
  if (builder->failed || (length > 0 && bytes == NULL) ||
      length > builder->capacity - builder->length) {
    builder->failed = 1;
    return;
  }
  if (length > 0) memcpy(builder->bytes + builder->length, bytes, length);
  builder->length += length;
}

static void builder_put_u16(test_builder *builder, uint16_t value) {
  uint8_t bytes[2];
  hmg4v2_write_u16_be(bytes, value);
  builder_put(builder, bytes, sizeof(bytes));
}

static void builder_put_u32(test_builder *builder, uint32_t value) {
  uint8_t bytes[4];
  hmg4v2_write_u32_be(bytes, value);
  builder_put(builder, bytes, sizeof(bytes));
}

static void builder_put_u64(test_builder *builder, uint64_t value) {
  uint8_t bytes[8];
  hmg4v2_write_u64_be(bytes, value);
  builder_put(builder, bytes, sizeof(bytes));
}

static void builder_put_tlv(
    test_builder *builder,
    uint16_t tag,
    uint8_t type,
    const void *value,
    size_t length) {
  const uint8_t reserved = 0;
  if (length > UINT32_MAX) {
    builder->failed = 1;
    return;
  }
  builder_put_u16(builder, tag);
  builder_put(builder, &type, 1);
  builder_put(builder, &reserved, 1);
  builder_put_u32(builder, (uint32_t)length);
  builder_put(builder, value, length);
}

static void builder_put_u32_tlv(
    test_builder *builder,
    uint16_t tag,
    uint32_t value) {
  uint8_t bytes[4];
  hmg4v2_write_u32_be(bytes, value);
  builder_put_tlv(builder, tag, TYPE_U32, bytes, sizeof(bytes));
}

static void builder_put_u64_tlv(
    test_builder *builder,
    uint16_t tag,
    uint64_t value) {
  uint8_t bytes[8];
  hmg4v2_write_u64_be(bytes, value);
  builder_put_tlv(builder, tag, TYPE_U64, bytes, sizeof(bytes));
}

static void build_root(uint8_t *bytes, size_t capacity, size_t *length) {
  static const uint8_t zero16[16] = {0};
  static const uint8_t zero32[32] = {0};
  static const char root_path[] = "/Volumes/WestWorld/HELP MATH 2.0";
  test_builder builder;
  builder_init(&builder, bytes, capacity);
  builder_put_u64_tlv(&builder, 0x0201, 1);
  builder_put_u64_tlv(&builder, 0x0202, 2);
  builder_put_u32_tlv(&builder, 0x0203, 501);
  builder_put_u32_tlv(&builder, 0x0204, 20);
  builder_put_u32_tlv(&builder, 0x0205, 040755);
  builder_put_u32_tlv(&builder, 0x0206, 0);
  builder_put_tlv(&builder, 0x0207, TYPE_BYTES, zero16, sizeof(zero16));
  builder_put_tlv(&builder, 0x0208, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x0209, TYPE_APPROVED_ABS_ROOT_PATH,
                  root_path, sizeof(root_path) - 1);
  *length = builder.failed ? 0 : builder.length;
}

static void build_entry(
    uint8_t *bytes,
    size_t capacity,
    size_t *length,
    uint32_t index,
    build_options options) {
  uint8_t zero32[32] = {0};
  char path[32];
  uint32_t role = index == 113 ? 2u : 1u;
  uint64_t desired_offset = (uint64_t)index * UINT64_C(4096);
  test_builder builder;
  int path_length = 0;
  if (options.duplicate_path && index == 113) {
    path_length = snprintf(path, sizeof(path), "file-%03u", 0u);
  } else if (options.case_collision && index == 113) {
    path_length = snprintf(path, sizeof(path), "FILE-%03u", 0u);
  } else {
    path_length = snprintf(path, sizeof(path), "file-%03u", index);
  }
  if (options.bad_role_order) {
    if (index == 0) role = 2;
    if (index == 1) role = 1;
  }
  if (options.overlapping_range && index == 1) desired_offset = 0;
  if (options.bad_absent_hash && index == 0) zero32[31] = 1;
  builder_init(&builder, bytes, capacity);
  if (path_length <= 0 || (size_t)path_length >= sizeof(path)) builder.failed = 1;
  builder_put_u32_tlv(&builder, 0x0101, index);
  builder_put_u32_tlv(&builder, 0x0102, role);
  builder_put_tlv(&builder, 0x0103, TYPE_POLICY_REL_PATH, path,
                  (size_t)path_length);
  builder_put_u32_tlv(&builder, 0x0104, 0);
  builder_put_u64_tlv(&builder, 0x0105, 0);
  builder_put_tlv(&builder, 0x0106, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_u64_tlv(&builder, 0x0107, desired_offset);
  builder_put_u64_tlv(&builder, 0x0108, 1);
  builder_put_tlv(&builder, 0x0109, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_u32_tlv(&builder, 0x010a, 0644);
  builder_put_u32_tlv(&builder, 0x010b, 501);
  builder_put_u32_tlv(&builder, 0x010c, 20);
  builder_put_u32_tlv(&builder, 0x010d, 0);
  builder_put_tlv(&builder, 0x010e, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x010f, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_u32_tlv(&builder, 0x0110, 1);
  *length = builder.failed ? 0 : builder.length;
}

static void build_entry_list(
    uint8_t *bytes,
    size_t capacity,
    size_t *length,
    build_options options) {
  uint8_t entry[1024];
  size_t entry_length = 0;
  uint32_t index = 0;
  test_builder builder;
  builder_init(&builder, bytes, capacity);
  builder_put_u32(&builder, HMG4V2_MANAGED_ENTRY_COUNT);
  for (index = 0; index < HMG4V2_MANAGED_ENTRY_COUNT; index += 1) {
    build_entry(entry, sizeof(entry), &entry_length, index, options);
    builder_put_u32(&builder, (uint32_t)entry_length);
    builder_put(&builder, entry, entry_length);
  }
  *length = builder.failed ? 0 : builder.length;
}

static void build_apply_payload(
    uint8_t *bytes,
    size_t capacity,
    size_t *length,
    build_options options) {
  static const uint8_t zero32[32] = {0};
  uint8_t root[2048];
  uint8_t entries[65536];
  size_t root_length = 0;
  size_t entries_length = 0;
  test_builder builder;
  build_root(root, sizeof(root), &root_length);
  build_entry_list(entries, sizeof(entries), &entries_length, options);
  builder_init(&builder, bytes, capacity);
  builder_put_tlv(&builder, 0x0001, TYPE_SHA256,
                  hmg4v2_protocol_spec_sha256,
                  sizeof(hmg4v2_protocol_spec_sha256));
  builder_put_u32_tlv(&builder, 0x0002, 2);
  builder_put_tlv(&builder, 0x0003, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x0004, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x0005, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x0006, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x0007, TYPE_STRUCT, root, root_length);
  builder_put_tlv(&builder, 0x0008, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x0009, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x000a, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_u64_tlv(&builder, 0x000b, options.nonzero_acceptance ? 1 : 0);
  builder_put_u32_tlv(&builder, 0x000c, HMG4V2_MANAGED_ENTRY_COUNT);
  builder_put_tlv(&builder, 0x000d, TYPE_LIST, entries, entries_length);
  builder_put_tlv(&builder, 0x0016, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x0017, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x0018, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_u32_tlv(&builder, 0x0019, 2);
  builder_put_tlv(&builder, 0x001a, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x001b, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_u32_tlv(&builder, 0x001c, HMG4V2_MANAGED_ENTRY_COUNT);
  builder_put_tlv(&builder, 0x001d, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_u32_tlv(&builder, 0x001e, HMG4V2_MANAGED_ENTRY_COUNT);
  *length = builder.failed ? 0 : builder.length;
}

static void build_request_payload(
    uint8_t *bytes,
    size_t capacity,
    size_t *length,
    uint32_t operation,
    uint32_t verify_target,
    build_options options) {
  static const uint8_t zero32[32] = {0};
  static const char custody_leaf[] = "tx-abc.log";
  static const char evidence_path[] = "operator/authorization.bin";
  uint8_t root[2048];
  uint8_t entries[65536];
  size_t root_length = 0;
  size_t entries_length = 0;
  test_builder builder;
  if (operation == 3) {
    build_apply_payload(bytes, capacity, length, options);
    return;
  }
  build_root(root, sizeof(root), &root_length);
  build_entry_list(entries, sizeof(entries), &entries_length, options);
  builder_init(&builder, bytes, capacity);
  builder_put_tlv(&builder, 0x0001, TYPE_SHA256,
                  hmg4v2_protocol_spec_sha256,
                  sizeof(hmg4v2_protocol_spec_sha256));
  builder_put_u32_tlv(&builder, 0x0002, 2);
  builder_put_tlv(&builder, 0x0003, TYPE_SHA256, zero32, sizeof(zero32));
  builder_put_tlv(&builder, 0x0004, TYPE_SHA256, zero32, sizeof(zero32));
  if (operation != 1) {
    builder_put_tlv(&builder, 0x0005, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_tlv(&builder, 0x0006, TYPE_SHA256, zero32, sizeof(zero32));
  }
  builder_put_tlv(&builder, 0x0007, TYPE_STRUCT, root, root_length);
  if (operation != 1) {
    builder_put_tlv(&builder, 0x0008, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_tlv(&builder, 0x0009, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_tlv(&builder, 0x000a, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_u64_tlv(&builder, 0x000b, options.nonzero_acceptance ? 1 : 0);
    builder_put_u32_tlv(&builder, 0x000c, HMG4V2_MANAGED_ENTRY_COUNT);
    builder_put_tlv(&builder, 0x000d, TYPE_LIST, entries, entries_length);
  }
  if (operation == 2) {
    builder_put_u32_tlv(&builder, 0x000e, verify_target);
    if (verify_target == 2) {
      builder_put_tlv(&builder, 0x000f, 0x0a, custody_leaf,
                      sizeof(custody_leaf) - 1);
      builder_put_tlv(&builder, 0x0010, TYPE_SHA256, zero32, sizeof(zero32));
    }
  }
  if (operation == 4) {
    builder_put_tlv(&builder, 0x0011, TYPE_BYTES, zero32, sizeof(zero32));
    builder_put_tlv(&builder, 0x0012, 0x0a, custody_leaf,
                    sizeof(custody_leaf) - 1);
    builder_put_tlv(&builder, 0x0013, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_tlv(&builder, 0x0014, 0x0b, evidence_path,
                    sizeof(evidence_path) - 1);
    builder_put_tlv(&builder, 0x0015, TYPE_SHA256, zero32, sizeof(zero32));
  }
  if (operation == 2 || operation == 4) {
    builder_put_tlv(&builder, 0x0016, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_tlv(&builder, 0x0017, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_tlv(&builder, 0x0018, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_u32_tlv(&builder, 0x0019, 2);
    builder_put_tlv(&builder, 0x001a, TYPE_SHA256, zero32, sizeof(zero32));
  }
  if (operation == 4) {
    builder_put_tlv(&builder, 0x001b, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_u32_tlv(&builder, 0x001c, HMG4V2_MANAGED_ENTRY_COUNT);
    builder_put_tlv(&builder, 0x001d, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_u32_tlv(&builder, 0x001e, HMG4V2_MANAGED_ENTRY_COUNT);
    builder_put_u32_tlv(&builder, 0x001f, 4);
    builder_put_tlv(&builder, 0x0020, TYPE_SHA256, zero32, sizeof(zero32));
    builder_put_u32_tlv(&builder, 0x0021, 0);
    builder_put_tlv(&builder, 0x0022, TYPE_SHA256, zero32, sizeof(zero32));
  }
  *length = builder.failed ? 0 : builder.length;
}

static void build_frame(
    uint8_t *bytes,
    size_t capacity,
    size_t *length,
    uint32_t operation,
    const uint8_t *payload,
    size_t payload_length) {
  static const uint8_t magic[8] = {
      0x48, 0x4d, 0x47, 0x34, 0x56, 0x32, 0x00, 0x00};
  uint8_t digest[32];
  test_builder builder;
  if (hmg4v2_sha256(span_of(payload, payload_length), digest) != HMG4V2_CORE_OK) {
    *length = 0;
    return;
  }
  builder_init(&builder, bytes, capacity);
  builder_put(&builder, magic, sizeof(magic));
  builder_put_u32(&builder, 2);
  builder_put_u32(&builder, operation);
  builder_put_u64(&builder, (uint64_t)payload_length);
  builder_put(&builder, digest, sizeof(digest));
  builder_put(&builder, payload, payload_length);
  *length = builder.failed ? 0 : builder.length;
}

static hmg4v2_core_result drain_tlvs(hmg4v2_span bytes) {
  hmg4v2_tlv_cursor cursor;
  hmg4v2_tlv_view view;
  int done = 0;
  hmg4v2_core_result status;
  hmg4v2_tlv_cursor_init(&cursor, bytes);
  while (1) {
    status = hmg4v2_tlv_next(&cursor, &view, &done);
    if (status != HMG4V2_CORE_OK || done) return status;
  }
}

static int find_tlv_offsets(
    hmg4v2_span bytes,
    uint16_t wanted_tag,
    size_t *header_offset,
    size_t *value_offset) {
  hmg4v2_tlv_cursor cursor;
  hmg4v2_tlv_view view;
  int done = 0;
  hmg4v2_core_result status;
  hmg4v2_tlv_cursor_init(&cursor, bytes);
  while (1) {
    const size_t before = cursor.offset;
    status = hmg4v2_tlv_next(&cursor, &view, &done);
    if (status != HMG4V2_CORE_OK || done) return 0;
    if (view.tag == wanted_tag) {
      *header_offset = before;
      *value_offset = (size_t)(view.value.bytes - bytes.bytes);
      return 1;
    }
  }
}

static int test_checked_arithmetic_and_endian(void) {
  uint8_t bytes[8];
  size_t result = 0;
  REQUIRE(hmg4v2_checked_add_size(2, 3, &result) && result == 5);
  REQUIRE(!hmg4v2_checked_add_size(SIZE_MAX, 1, &result));
  REQUIRE(hmg4v2_checked_mul_size(7, 9, &result) && result == 63);
  REQUIRE(!hmg4v2_checked_mul_size(SIZE_MAX, 2, &result));
  REQUIRE(hmg4v2_range_within(5, 4, 9));
  REQUIRE(!hmg4v2_range_within(SIZE_MAX, 1, SIZE_MAX));
  hmg4v2_write_u64_be(bytes, UINT64_C(0x0102030405060708));
  REQUIRE(hmg4v2_read_u64_be(bytes) == UINT64_C(0x0102030405060708));
  hmg4v2_write_u32_be(bytes, UINT32_C(0x89abcdef));
  REQUIRE(hmg4v2_read_u32_be(bytes) == UINT32_C(0x89abcdef));
  hmg4v2_write_u16_be(bytes, UINT16_C(0x1234));
  REQUIRE(hmg4v2_read_u16_be(bytes) == UINT16_C(0x1234));
  return 0;
}

static int test_hash_and_frame(void) {
  static const uint8_t empty_sha256[32] = {
      0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
      0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
      0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
      0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55};
  uint8_t digest[32];
  uint8_t frame[128];
  static const uint8_t exact_empty_probe_header[HMG4V2_HEADER_SIZE] = {
      0x48, 0x4d, 0x47, 0x34, 0x56, 0x32, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
      0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
      0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
      0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55};
  size_t frame_length = 0;
  size_t cut = 0;
  hmg4v2_request_frame parsed;
  build_frame(frame, sizeof(frame), &frame_length, 1, NULL, 0);
  REQUIRE(frame_length == HMG4V2_HEADER_SIZE);
  REQUIRE(memcmp(frame, exact_empty_probe_header, HMG4V2_HEADER_SIZE) == 0);
  REQUIRE(hmg4v2_sha256(span_of(NULL, 0), digest) == HMG4V2_CORE_OK);
  REQUIRE(memcmp(digest, empty_sha256, sizeof(digest)) == 0);
  REQUIRE(hmg4v2_validate_buffered_request_frame(
              span_of(frame, frame_length), &parsed) == HMG4V2_CORE_OK);
  REQUIRE(parsed.header.operation == 1 && parsed.payload.length == 0);
  REQUIRE(hmg4v2_validate_request_payload_syntax(1, parsed.payload) ==
          HMG4V2_CORE_WRONG_TAG_SET);
  frame[0] ^= 1;
  REQUIRE(hmg4v2_validate_buffered_request_frame(
              span_of(frame, frame_length), &parsed) == HMG4V2_CORE_BAD_MAGIC);
  frame[0] ^= 1;
  frame[24] ^= 1;
  REQUIRE(hmg4v2_validate_buffered_request_frame(
              span_of(frame, frame_length), &parsed) ==
          HMG4V2_CORE_PAYLOAD_HASH_MISMATCH);
  frame[24] ^= 1;
  for (cut = 0; cut < HMG4V2_HEADER_SIZE; cut += 1) {
    REQUIRE(hmg4v2_validate_buffered_request_frame(
                span_of(frame, cut), &parsed) == HMG4V2_CORE_TRUNCATED_HEADER);
  }
  frame[8 + 3] = 1;
  REQUIRE(hmg4v2_validate_buffered_request_frame(
              span_of(frame, frame_length), &parsed) == HMG4V2_CORE_BAD_VERSION);
  frame[8 + 3] = 2;
  frame[12 + 3] = 0;
  REQUIRE(hmg4v2_validate_buffered_request_frame(
              span_of(frame, frame_length), &parsed) ==
          HMG4V2_CORE_BAD_OPERATION);
  frame[12 + 3] = 5;
  REQUIRE(hmg4v2_validate_buffered_request_frame(
              span_of(frame, frame_length), &parsed) ==
          HMG4V2_CORE_BAD_OPERATION);
  frame[12 + 3] = 1;
  hmg4v2_write_u64_be(frame + 16, HMG4V2_MAX_PAYLOAD + 1);
  REQUIRE(hmg4v2_validate_buffered_request_frame(
              span_of(frame, frame_length), &parsed) ==
          HMG4V2_CORE_PAYLOAD_TOO_LARGE);
  hmg4v2_write_u64_be(frame + 16, 0);
  frame[frame_length] = 0;
  REQUIRE(hmg4v2_validate_buffered_request_frame(
              span_of(frame, frame_length + 1), &parsed) ==
          HMG4V2_CORE_FRAME_LENGTH_MISMATCH);
  return 0;
}

static int test_paths(void) {
  static const char rel_good[] = "Lesson_10/report.json";
  static const char rel_bad_dot[] = "a/../b";
  static const char rel_bad_repeat[] = "a//b";
  static const char rel_bad_backslash[] = "a\\b";
  static const char abs_good[] = "/Volumes/WestWorld/HELP MATH 2.0";
  static const char abs_bad[] = "Volumes/WestWorld";
  static const char leaf_good[] = "tx-abc.log";
  static const char leaf_bad[] = "..";
  static const uint8_t rel_nul[] = {'a', 0, 'b'};
  static const uint8_t rel_non_ascii[] = {'a', 0x80, 'b'};
  static const uint8_t observed_non_ascii_tlv[] = {
      0x00, 0x01, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x01, 0xff};
  REQUIRE(hmg4v2_policy_rel_path_is_lexically_safe(
      span_of(rel_good, sizeof(rel_good) - 1)));
  REQUIRE(!hmg4v2_policy_rel_path_is_lexically_safe(
      span_of(rel_bad_dot, sizeof(rel_bad_dot) - 1)));
  REQUIRE(!hmg4v2_policy_rel_path_is_lexically_safe(
      span_of(rel_bad_repeat, sizeof(rel_bad_repeat) - 1)));
  REQUIRE(!hmg4v2_policy_rel_path_is_lexically_safe(
      span_of(rel_bad_backslash, sizeof(rel_bad_backslash) - 1)));
  REQUIRE(!hmg4v2_policy_rel_path_is_lexically_safe(
      span_of(rel_nul, sizeof(rel_nul))));
  REQUIRE(!hmg4v2_policy_rel_path_is_lexically_safe(
      span_of(rel_non_ascii, sizeof(rel_non_ascii))));
  REQUIRE(hmg4v2_approved_abs_root_is_lexically_safe(
      span_of(abs_good, sizeof(abs_good) - 1)));
  REQUIRE(!hmg4v2_approved_abs_root_is_lexically_safe(
      span_of(abs_bad, sizeof(abs_bad) - 1)));
  REQUIRE(hmg4v2_leaf_is_common_lexically_safe(
      span_of(leaf_good, sizeof(leaf_good) - 1)));
  REQUIRE(!hmg4v2_leaf_is_common_lexically_safe(
      span_of(leaf_bad, sizeof(leaf_bad) - 1)));
  REQUIRE(drain_tlvs(span_of(observed_non_ascii_tlv,
                             sizeof(observed_non_ascii_tlv))) ==
          HMG4V2_CORE_OK);
  return 0;
}

static int test_tlv_canonical_rules(void) {
  uint8_t bytes[64];
  uint8_t misaligned[65];
  uint8_t boolean_tlv[9] = {
      0x00, 0x01, 0x03, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02};
  test_builder builder;
  hmg4v2_tlv_cursor cursor;
  hmg4v2_tlv_view view;
  int done = 0;
  size_t cut = 0;
  builder_init(&builder, bytes, sizeof(bytes));
  builder_put_u32_tlv(&builder, 0x0001, 2);
  builder_put_u32_tlv(&builder, 0x0002, 3);
  hmg4v2_tlv_cursor_init(&cursor, span_of(bytes, builder.length));
  REQUIRE(hmg4v2_tlv_next(&cursor, &view, &done) == HMG4V2_CORE_OK &&
          !done && view.tag == 1);
  REQUIRE(hmg4v2_tlv_next(&cursor, &view, &done) == HMG4V2_CORE_OK &&
          !done && view.tag == 2);
  REQUIRE(hmg4v2_tlv_next(&cursor, &view, &done) == HMG4V2_CORE_OK && done);
  for (cut = 0; cut <= builder.length; cut += 1) {
    const hmg4v2_core_result status = drain_tlvs(span_of(bytes, cut));
    if (cut == 0 || cut == 12 || cut == 24) {
      REQUIRE(status == HMG4V2_CORE_OK);
    } else {
      REQUIRE(status == HMG4V2_CORE_TRUNCATED_TLV);
    }
  }
  misaligned[0] = 0xaa;
  memcpy(misaligned + 1, bytes, builder.length);
  REQUIRE(drain_tlvs(span_of(misaligned + 1, builder.length)) ==
          HMG4V2_CORE_OK);
  bytes[3] = 1;
  hmg4v2_tlv_cursor_init(&cursor, span_of(bytes, builder.length));
  REQUIRE(hmg4v2_tlv_next(&cursor, &view, &done) ==
          HMG4V2_CORE_BAD_RESERVED_BYTE);
  bytes[3] = 0;
  bytes[2] = 0xff;
  hmg4v2_tlv_cursor_init(&cursor, span_of(bytes, builder.length));
  REQUIRE(hmg4v2_tlv_next(&cursor, &view, &done) == HMG4V2_CORE_BAD_TLV_TYPE);
  bytes[2] = TYPE_U32;
  hmg4v2_write_u32_be(bytes + 4, 3);
  hmg4v2_tlv_cursor_init(&cursor, span_of(bytes, builder.length));
  REQUIRE(hmg4v2_tlv_next(&cursor, &view, &done) ==
          HMG4V2_CORE_BAD_TLV_LENGTH);
  hmg4v2_write_u32_be(bytes + 4, 4);
  REQUIRE(drain_tlvs(span_of(boolean_tlv, sizeof(boolean_tlv))) ==
          HMG4V2_CORE_BAD_SCALAR_VALUE);
  boolean_tlv[8] = 1;
  REQUIRE(drain_tlvs(span_of(boolean_tlv, sizeof(boolean_tlv))) ==
          HMG4V2_CORE_OK);
  bytes[12] = 0;
  bytes[13] = 1;
  hmg4v2_tlv_cursor_init(&cursor, span_of(bytes, builder.length));
  REQUIRE(hmg4v2_tlv_next(&cursor, &view, &done) == HMG4V2_CORE_OK);
  REQUIRE(hmg4v2_tlv_next(&cursor, &view, &done) ==
          HMG4V2_CORE_BAD_TLV_ORDER);
  return 0;
}

static int test_list_bounds(void) {
  uint8_t list[65537];
  size_t list_length = 0;
  uint32_t present = 0;
  build_options options = {0};
  build_entry_list(list, sizeof(list), &list_length, options);
  REQUIRE(list_length > 8);
  REQUIRE(hmg4v2_validate_entry_list_syntax(
              span_of(list, list_length), &present) == HMG4V2_CORE_OK);
  REQUIRE(present == 0);
  hmg4v2_write_u32_be(list, 113);
  REQUIRE(hmg4v2_validate_entry_list_syntax(
              span_of(list, list_length), &present) == HMG4V2_CORE_BAD_LIST);
  hmg4v2_write_u32_be(list, HMG4V2_MANAGED_ENTRY_COUNT);
  hmg4v2_write_u32_be(list + 4, UINT32_MAX);
  REQUIRE(hmg4v2_validate_entry_list_syntax(
              span_of(list, list_length), &present) == HMG4V2_CORE_BAD_LIST);
  build_entry_list(list, sizeof(list) - 1, &list_length, options);
  list[list_length] = 0;
  REQUIRE(hmg4v2_validate_entry_list_syntax(
              span_of(list, list_length + 1), &present) ==
          HMG4V2_CORE_BAD_LIST);
  return 0;
}

static int test_all_operation_schemas(void) {
  uint8_t payload[131072];
  uint8_t mutated[131100];
  size_t payload_length = 0;
  size_t header_offset = 0;
  size_t value_offset = 0;
  uint32_t operation = 0;
  build_options options = {0};
  for (operation = 1; operation <= 4; operation += 1) {
    const uint32_t verify_target = operation == 2 ? 1u : 0u;
    build_request_payload(payload, sizeof(payload), &payload_length,
                          operation, verify_target, options);
    REQUIRE(payload_length > 0);
    REQUIRE(hmg4v2_validate_request_payload_syntax(
                operation, span_of(payload, payload_length)) ==
            HMG4V2_CORE_OK);
    memcpy(mutated, payload, payload_length);
    REQUIRE(find_tlv_offsets(span_of(payload, payload_length), 0x0002,
                             &header_offset, &value_offset));
    mutated[header_offset + 2] = TYPE_BYTES;
    REQUIRE(hmg4v2_validate_request_payload_syntax(
                operation, span_of(mutated, payload_length)) ==
            HMG4V2_CORE_WRONG_FIELD_TYPE);
    REQUIRE(hmg4v2_validate_request_payload_syntax(
                operation, span_of(payload, payload_length - 1)) ==
            HMG4V2_CORE_TRUNCATED_TLV);
    memcpy(mutated, payload, payload_length);
    {
      test_builder extra;
      builder_init(&extra, mutated + payload_length,
                   sizeof(mutated) - payload_length);
      builder_put_u32_tlv(&extra, 0x0030, 0);
      REQUIRE(!extra.failed);
      REQUIRE(hmg4v2_validate_request_payload_syntax(
                  operation,
                  span_of(mutated, payload_length + extra.length)) ==
              HMG4V2_CORE_WRONG_TAG_SET);
    }
  }
  build_request_payload(payload, sizeof(payload), &payload_length, 2, 2, options);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              2, span_of(payload, payload_length)) == HMG4V2_CORE_OK);
  memcpy(mutated, payload, payload_length);
  REQUIRE(find_tlv_offsets(span_of(payload, payload_length), 0x0001,
                           &header_offset, &value_offset));
  mutated[value_offset] ^= 1;
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              2, span_of(mutated, payload_length)) ==
          HMG4V2_CORE_BAD_SCALAR_VALUE);
  build_request_payload(payload, sizeof(payload), &payload_length, 2, 3, options);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              2, span_of(payload, payload_length)) ==
          HMG4V2_CORE_BAD_SCALAR_VALUE);
  return 0;
}

static int test_apply_schema_and_negative_matrix(void) {
  uint8_t payload[131072];
  size_t payload_length = 0;
  build_options options = {0};
  uint8_t frame[131200];
  size_t frame_length = 0;
  hmg4v2_request_frame parsed;
  build_apply_payload(payload, sizeof(payload), &payload_length, options);
  REQUIRE(payload_length > 0);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              3, span_of(payload, payload_length)) == HMG4V2_CORE_OK);
  build_frame(frame, sizeof(frame), &frame_length, 3, payload, payload_length);
  REQUIRE(frame_length == payload_length + HMG4V2_HEADER_SIZE);
  REQUIRE(hmg4v2_validate_buffered_request_frame(
              span_of(frame, frame_length), &parsed) == HMG4V2_CORE_OK);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              parsed.header.operation, parsed.payload) == HMG4V2_CORE_OK);

  options.duplicate_path = 1;
  build_apply_payload(payload, sizeof(payload), &payload_length, options);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              3, span_of(payload, payload_length)) ==
          HMG4V2_CORE_DUPLICATE_PATH);
  options = (build_options){0};
  options.case_collision = 1;
  build_apply_payload(payload, sizeof(payload), &payload_length, options);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              3, span_of(payload, payload_length)) ==
          HMG4V2_CORE_CASE_COLLISION);
  options = (build_options){0};
  options.bad_role_order = 1;
  build_apply_payload(payload, sizeof(payload), &payload_length, options);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              3, span_of(payload, payload_length)) ==
          HMG4V2_CORE_BAD_ROLE_ORDER);
  options = (build_options){0};
  options.overlapping_range = 1;
  build_apply_payload(payload, sizeof(payload), &payload_length, options);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              3, span_of(payload, payload_length)) ==
          HMG4V2_CORE_BAD_RANGE_ORDER);
  options = (build_options){0};
  options.bad_absent_hash = 1;
  build_apply_payload(payload, sizeof(payload), &payload_length, options);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              3, span_of(payload, payload_length)) == HMG4V2_CORE_BAD_ENTRY);
  options = (build_options){0};
  options.nonzero_acceptance = 1;
  build_apply_payload(payload, sizeof(payload), &payload_length, options);
  REQUIRE(hmg4v2_validate_request_payload_syntax(
              3, span_of(payload, payload_length)) ==
          HMG4V2_CORE_BAD_SCALAR_VALUE);
  return 0;
}

int main(void) {
  REQUIRE(hmg4v2_authority_validation_status() ==
          HMG4V2_CORE_UNFROZEN_AUTHORITY);
  REQUIRE(strcmp(hmg4v2_core_result_name(HMG4V2_CORE_UNFROZEN_AUTHORITY),
                 "unfrozen-authority") == 0);
  if (test_checked_arithmetic_and_endian() != 0) return 1;
  if (test_hash_and_frame() != 0) return 1;
  if (test_paths() != 0) return 1;
  if (test_tlv_canonical_rules() != 0) return 1;
  if (test_list_bounds() != 0) return 1;
  if (test_all_operation_schemas() != 0) return 1;
  if (test_apply_schema_and_negative_matrix() != 0) return 1;
  printf("HMG4V2_PROTOCOL_CORE_TEST_PASS assertions=%u\n", assertion_count);
  return 0;
}
