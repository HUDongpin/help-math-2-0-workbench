#include "bundle_codec.h"

#include <stdio.h>
#include <string.h>

enum {
  TEST_TABLE_CAPACITY = 131072,
  TEST_BUNDLE_CAPACITY = 1048576
};

typedef struct {
  uint8_t *bytes;
  size_t capacity;
  size_t length;
} test_buffer;

typedef struct {
  int duplicate_path;
  int case_collision;
  int bad_path;
  int bad_index;
  int bad_type;
  int misaligned_offset;
  int overlapping_range;
  int zero_size;
  int oversized_blob;
  uint32_t list_count;
} build_options;

static uint8_t g_table[TEST_TABLE_CAPACITY];
static uint8_t g_bundle[TEST_BUNDLE_CAPACITY];
static int g_failures = 0;

#define EXPECT_TRUE(condition)                                                \
  do {                                                                        \
    if (!(condition)) {                                                       \
      (void)fprintf(stderr, "FAIL %s:%d: %s\n", __FILE__, __LINE__,          \
                    #condition);                                              \
      g_failures += 1;                                                        \
    }                                                                         \
  } while (0)

#define EXPECT_RESULT(actual, expected)                                       \
  do {                                                                        \
    const hmg4v27_bundle_result actual_result = (actual);                       \
    const hmg4v27_bundle_result expected_result = (expected);                   \
    if (actual_result != expected_result) {                                    \
      (void)fprintf(stderr,                                                    \
                    "FAIL %s:%d: got %s, expected %s\n", __FILE__, __LINE__, \
                    hmg4v27_bundle_result_name(actual_result),                  \
                    hmg4v27_bundle_result_name(expected_result));               \
      g_failures += 1;                                                        \
    }                                                                         \
  } while (0)

static int append_bytes(test_buffer *buffer, const void *bytes, size_t length) {
  if (buffer == NULL || bytes == NULL ||
      !hmg4v27_range_within(buffer->length, length, buffer->capacity)) {
    return 0;
  }
  memcpy(buffer->bytes + buffer->length, bytes, length);
  buffer->length += length;
  return 1;
}

static int append_u32_raw(test_buffer *buffer, uint32_t value) {
  uint8_t bytes[4];
  hmg4v27_write_u32_be(bytes, value);
  return append_bytes(buffer, bytes, sizeof(bytes));
}

static int append_tlv(
    test_buffer *buffer,
    uint16_t tag,
    uint8_t type,
    const void *value,
    size_t value_length) {
  uint8_t header[8];
  if (value_length > UINT32_MAX) return 0;
  hmg4v27_write_u16_be(header, tag);
  header[2] = type;
  header[3] = 0;
  hmg4v27_write_u32_be(header + 4, (uint32_t)value_length);
  return append_bytes(buffer, header, sizeof(header)) &&
         append_bytes(buffer, value, value_length);
}

static int append_tlv_u32(test_buffer *buffer, uint16_t tag, uint32_t value) {
  uint8_t bytes[4];
  hmg4v27_write_u32_be(bytes, value);
  return append_tlv(buffer, tag, 0x01, bytes, sizeof(bytes));
}

static int append_tlv_u64(test_buffer *buffer, uint16_t tag, uint64_t value) {
  uint8_t bytes[8];
  hmg4v27_write_u64_be(bytes, value);
  return append_tlv(buffer, tag, 0x02, bytes, sizeof(bytes));
}

static int append_tlv_sha(
    test_buffer *buffer,
    uint16_t tag,
    const uint8_t digest[32]) {
  return append_tlv(buffer, tag, 0x04, digest, 32);
}

static int build_table(const build_options *options, size_t *table_length) {
  test_buffer table = {g_table, sizeof(g_table), 0};
  uint32_t entry_index = 0;
  if (options == NULL || table_length == NULL) return 0;
  if (!append_u32_raw(&table, options->list_count)) return 0;
  for (entry_index = 0; entry_index < HMG4V27_BUNDLE_ENTRY_COUNT;
       entry_index += 1) {
    uint8_t entry_bytes[1024];
    test_buffer entry = {entry_bytes, sizeof(entry_bytes), 0};
    char path[128];
    int path_length = 0;
    uint8_t blob_byte = (uint8_t)(entry_index + 1u);
    uint8_t blob_sha256[32];
    uint8_t metadata_sha256[32];
    uint64_t offset = (uint64_t)entry_index * HMG4V27_BUNDLE_ALIGNMENT;
    uint64_t size = 1;
    uint32_t encoded_index = entry_index;
    uint8_t path_type = 0x06;
    hmg4v27_span blob = {&blob_byte, 1};
    if (hmg4v27_sha256(blob, blob_sha256) != HMG4V27_OK) return 0;
    memset(metadata_sha256, (int)(entry_index & 0xffu),
           sizeof(metadata_sha256));
    if (options->duplicate_path && entry_index == 1) {
      path_length = snprintf(path, sizeof(path),
                             "migrations/course-g04-l10-vb-003/output-000.bin");
    } else if (options->case_collision && entry_index == 1) {
      path_length = snprintf(path, sizeof(path),
                             "migrations/course-g04-l10-vb-003/Output-000.bin");
    } else if (options->bad_path && entry_index == 0) {
      path_length = snprintf(path, sizeof(path), "../escape.bin");
    } else {
      path_length = snprintf(path, sizeof(path),
                             "migrations/course-g04-l10-vb-003/output-%03u.bin",
                             entry_index);
    }
    if (path_length <= 0 || (size_t)path_length >= sizeof(path)) return 0;
    if (options->bad_index && entry_index == 3) encoded_index = 4;
    if (options->bad_type && entry_index == 0) path_type = 0x05;
    if (options->misaligned_offset && entry_index == 2) offset += 1;
    if (options->overlapping_range && entry_index == 1) offset = 0;
    if (options->zero_size && entry_index == 0) size = 0;
    if (options->oversized_blob && entry_index == 0) {
      size = HMG4V27_BUNDLE_MAX_BLOB_SIZE + 1;
    }
    if (!append_tlv_u32(&entry, 0x0401, encoded_index) ||
        !append_tlv(&entry, 0x0402, path_type, path, (size_t)path_length) ||
        !append_tlv_u64(&entry, 0x0403, offset) ||
        !append_tlv_u64(&entry, 0x0404, size) ||
        !append_tlv_sha(&entry, 0x0405, blob_sha256) ||
        !append_tlv_u32(&entry, 0x0406, 0644) ||
        !append_tlv_u32(&entry, 0x0407, 501) ||
        !append_tlv_u32(&entry, 0x0408, 20) ||
        !append_tlv_u32(&entry, 0x0409, 0) ||
        !append_tlv_sha(&entry, 0x040a, metadata_sha256) ||
        !append_tlv_sha(&entry, 0x040b, metadata_sha256) ||
        !append_u32_raw(&table, (uint32_t)entry.length) ||
        !append_bytes(&table, entry.bytes, entry.length)) {
      return 0;
    }
  }
  *table_length = table.length;
  return 1;
}

static int build_bundle(
    const build_options *options,
    hmg4v27_span *bundle,
    size_t *data_start) {
  static const uint8_t k_magic[8] = {
      0x48, 0x4d, 0x47, 0x34, 0x42, 0x32, 0x00, 0x00};
  size_t table_length = 0;
  size_t unaligned_start = 0;
  size_t aligned_start = 0;
  size_t data_length =
      (size_t)HMG4V27_BUNDLE_ENTRY_COUNT * (size_t)HMG4V27_BUNDLE_ALIGNMENT;
  size_t file_length = 0;
  uint8_t table_sha256[32];
  uint8_t data_sha256[32];
  uint32_t index = 0;
  hmg4v27_span span;
  if (bundle == NULL || data_start == NULL || !build_table(options, &table_length)) {
    return 0;
  }
  if (!hmg4v27_checked_add_size(HMG4V27_BUNDLE_HEADER_SIZE, table_length,
                              &unaligned_start)) {
    return 0;
  }
  aligned_start = (unaligned_start + 4095u) & ~(size_t)4095u;
  if (!hmg4v27_checked_add_size(aligned_start, data_length, &file_length) ||
      file_length > sizeof(g_bundle)) {
    return 0;
  }
  memset(g_bundle, 0, file_length);
  memcpy(g_bundle + HMG4V27_BUNDLE_HEADER_SIZE, g_table, table_length);
  for (index = 0; index < HMG4V27_BUNDLE_ENTRY_COUNT; index += 1) {
    g_bundle[aligned_start + (size_t)index * 4096u] =
        (uint8_t)(index + 1u);
  }
  span.bytes = g_table;
  span.length = table_length;
  if (hmg4v27_sha256(span, table_sha256) != HMG4V27_OK) return 0;
  span.bytes = g_bundle + aligned_start;
  span.length = data_length;
  if (hmg4v27_sha256(span, data_sha256) != HMG4V27_OK) return 0;
  memcpy(g_bundle, k_magic, sizeof(k_magic));
  hmg4v27_write_u32_be(g_bundle + 8, 2);
  hmg4v27_write_u32_be(g_bundle + 12, HMG4V27_BUNDLE_ENTRY_COUNT);
  hmg4v27_write_u64_be(g_bundle + 16, (uint64_t)table_length);
  hmg4v27_write_u64_be(g_bundle + 24, (uint64_t)data_length);
  memcpy(g_bundle + 32, table_sha256, sizeof(table_sha256));
  memcpy(g_bundle + 64, data_sha256, sizeof(data_sha256));
  bundle->bytes = g_bundle;
  bundle->length = file_length;
  *data_start = aligned_start;
  return 1;
}

static void refresh_table_hash(void) {
  const uint64_t table_length = hmg4v27_read_u64_be(g_bundle + 16);
  hmg4v27_span table = {g_bundle + HMG4V27_BUNDLE_HEADER_SIZE,
                       (size_t)table_length};
  uint8_t digest[32];
  EXPECT_TRUE(hmg4v27_sha256(table, digest) == HMG4V27_OK);
  memcpy(g_bundle + 32, digest, sizeof(digest));
}

static void refresh_data_hash(size_t data_start) {
  const uint64_t data_length = hmg4v27_read_u64_be(g_bundle + 24);
  hmg4v27_span data = {g_bundle + data_start, (size_t)data_length};
  uint8_t digest[32];
  EXPECT_TRUE(hmg4v27_sha256(data, digest) == HMG4V27_OK);
  memcpy(g_bundle + 64, digest, sizeof(digest));
}

static build_options default_options(void) {
  build_options options;
  memset(&options, 0, sizeof(options));
  options.list_count = HMG4V27_BUNDLE_ENTRY_COUNT;
  return options;
}

static void test_valid_bundle(void) {
  build_options options = default_options();
  hmg4v27_span bundle = {0};
  hmg4v27_bundle_view view;
  size_t data_start = 0;
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view), HMG4V27_BUNDLE_OK);
  EXPECT_TRUE(view.data_start == data_start);
  EXPECT_TRUE(view.header.table_length == view.table.length);
  EXPECT_TRUE(view.header.data_region_length == view.data_region.length);
  EXPECT_TRUE(view.entries[0].index == 0 && view.entries[113].index == 113);
  EXPECT_TRUE(view.entries[113].offset == UINT64_C(113) * 4096u);
  EXPECT_TRUE(view.entries[0].installed_mode == 0644);
  EXPECT_TRUE(view.entries[0].installed_owner_uid == 501);
  EXPECT_TRUE(view.entries[0].installed_group_gid == 20);
  EXPECT_TRUE(view.entries[0].installed_flags == 0);
}

static void test_header_rejections(void) {
  build_options options = default_options();
  hmg4v27_span bundle = {0};
  hmg4v27_bundle_view view;
  hmg4v27_bundle_header header;
  size_t data_start = 0;
  uint8_t saved = 0;
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  EXPECT_RESULT(hmg4v27_parse_bundle_header((hmg4v27_span){bundle.bytes, 95},
                                           &header),
                HMG4V27_BUNDLE_TRUNCATED_HEADER);
  EXPECT_RESULT(hmg4v27_parse_bundle_header((hmg4v27_span){bundle.bytes, 97},
                                           &header),
                HMG4V27_BUNDLE_HEADER_LENGTH_MISMATCH);
  saved = g_bundle[0];
  g_bundle[0] ^= 1u;
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_BAD_MAGIC);
  g_bundle[0] = saved;
  hmg4v27_write_u32_be(g_bundle + 8, 3);
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_BAD_VERSION);
  hmg4v27_write_u32_be(g_bundle + 8, 2);
  hmg4v27_write_u32_be(g_bundle + 12, 113);
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_BAD_ENTRY_COUNT);
  hmg4v27_write_u32_be(g_bundle + 12, 114);
  hmg4v27_write_u64_be(g_bundle + 16,
                      HMG4V27_BUNDLE_MAX_TABLE_LENGTH + 1);
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_TABLE_TOO_LARGE);
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  hmg4v27_write_u64_be(g_bundle + 24, HMG4V27_BUNDLE_MAX_DATA_LENGTH + 1);
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_DATA_TOO_LARGE);
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  bundle.length -= 1;
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_FILE_LENGTH_MISMATCH);
}

static void test_digest_padding_gap_and_blob_rejections(void) {
  build_options options = default_options();
  hmg4v27_span bundle = {0};
  hmg4v27_bundle_view view;
  size_t data_start = 0;
  size_t table_end = 0;
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  g_bundle[32] ^= 1u;
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_TABLE_HASH_MISMATCH);
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  g_bundle[64] ^= 1u;
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_DATA_HASH_MISMATCH);
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  table_end = HMG4V27_BUNDLE_HEADER_SIZE +
              (size_t)hmg4v27_read_u64_be(g_bundle + 16);
  EXPECT_TRUE(table_end < data_start);
  g_bundle[table_end] = 1;
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_NONZERO_PREDATA_PADDING);
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  g_bundle[data_start + 1] = 1;
  refresh_data_hash(data_start);
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_NONZERO_DATA_GAP);
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  g_bundle[data_start] ^= 1u;
  refresh_data_hash(data_start);
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_BLOB_HASH_MISMATCH);
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  g_bundle[bundle.length - 1] = 1;
  refresh_data_hash(data_start);
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_NONZERO_DATA_GAP);
}

static void expect_build_rejection(
    build_options options,
    hmg4v27_bundle_result expected) {
  hmg4v27_span bundle = {0};
  hmg4v27_bundle_view view;
  size_t data_start = 0;
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view), expected);
}

static void test_table_and_entry_rejections(void) {
  build_options options = default_options();
  options.list_count = 113;
  expect_build_rejection(options, HMG4V27_BUNDLE_BAD_ENTRY_COUNT);
  options = default_options();
  options.bad_index = 1;
  expect_build_rejection(options, HMG4V27_BUNDLE_BAD_ENTRY);
  options = default_options();
  options.bad_type = 1;
  expect_build_rejection(options, HMG4V27_BUNDLE_BAD_ENTRY);
  options = default_options();
  options.bad_path = 1;
  expect_build_rejection(options, HMG4V27_BUNDLE_BAD_PATH);
  options = default_options();
  options.duplicate_path = 1;
  expect_build_rejection(options, HMG4V27_BUNDLE_DUPLICATE_PATH);
  options = default_options();
  options.case_collision = 1;
  expect_build_rejection(options, HMG4V27_BUNDLE_CASE_COLLISION);
  options = default_options();
  options.misaligned_offset = 1;
  expect_build_rejection(options, HMG4V27_BUNDLE_BAD_RANGE);
  options = default_options();
  options.overlapping_range = 1;
  expect_build_rejection(options, HMG4V27_BUNDLE_BAD_RANGE);
  options = default_options();
  options.zero_size = 1;
  expect_build_rejection(options, HMG4V27_BUNDLE_BAD_RANGE);
  options = default_options();
  options.oversized_blob = 1;
  expect_build_rejection(options, HMG4V27_BUNDLE_BAD_RANGE);
}

static void test_table_structure_mutations(void) {
  build_options options = default_options();
  hmg4v27_span bundle = {0};
  hmg4v27_bundle_view view;
  size_t data_start = 0;
  size_t first_member = HMG4V27_BUNDLE_HEADER_SIZE + 8;
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  g_bundle[first_member + 3] = 1;
  refresh_table_hash();
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_BAD_ENTRY);
  EXPECT_TRUE(build_bundle(&options, &bundle, &data_start));
  g_bundle[first_member + 1] = 2;
  refresh_table_hash();
  EXPECT_RESULT(hmg4v27_validate_bundle(bundle, &view),
                HMG4V27_BUNDLE_BAD_ENTRY);
}

int main(void) {
  test_valid_bundle();
  test_header_rejections();
  test_digest_padding_gap_and_blob_rejections();
  test_table_and_entry_rejections();
  test_table_structure_mutations();
  if (g_failures != 0) {
    (void)fprintf(stderr, "bundle_codec_test: %d failure(s)\n", g_failures);
    return 1;
  }
  (void)printf("bundle_codec_test: all checks passed\n");
  return 0;
}
