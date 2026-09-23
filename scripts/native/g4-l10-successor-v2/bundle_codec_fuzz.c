#include "bundle_codec.h"

#include <stdio.h>
#include <string.h>

enum {
  FUZZ_ITERATIONS = 120000,
  RAW_VALID_MUTATIONS = 2048,
  REHASHED_TABLE_MUTATIONS = 512,
  REHASHED_DATA_MUTATIONS = 512,
  SMALL_BUFFER_CAPACITY = 4096,
  TABLE_CAPACITY = 131072,
  BUNDLE_CAPACITY = 1048576
};

typedef struct {
  uint8_t *bytes;
  size_t capacity;
  size_t length;
} byte_builder;

_Alignas(64) static uint8_t g_small_buffer[SMALL_BUFFER_CAPACITY + 1];
static uint8_t g_table[TABLE_CAPACITY];
static uint8_t g_valid_bundle[BUNDLE_CAPACITY];
static uint64_t g_prng_state = UINT64_C(0x5a17c9e3d42b608f);
static uint32_t g_aligned_malformed = 0;
static uint32_t g_misaligned_malformed = 0;
static uint32_t g_unexpected_valid_malformed = 0;

static uint64_t next_random_u64(void) {
  uint64_t value = g_prng_state;
  value ^= value << 13;
  value ^= value >> 7;
  value ^= value << 17;
  g_prng_state = value;
  return value;
}

static uint8_t next_random_u8(void) {
  return (uint8_t)(next_random_u64() >> 56);
}

static int append_bytes(
    byte_builder *builder,
    const void *bytes,
    size_t length) {
  if (builder == NULL || bytes == NULL ||
      !hmg4v2_range_within(builder->length, length, builder->capacity)) {
    return 0;
  }
  memcpy(builder->bytes + builder->length, bytes, length);
  builder->length += length;
  return 1;
}

static int append_raw_u32(byte_builder *builder, uint32_t value) {
  uint8_t encoded[4];
  hmg4v2_write_u32_be(encoded, value);
  return append_bytes(builder, encoded, sizeof(encoded));
}

static int append_tlv(
    byte_builder *builder,
    uint16_t tag,
    uint8_t type,
    const void *value,
    size_t value_length) {
  uint8_t header[8];
  if (value_length > UINT32_MAX) return 0;
  hmg4v2_write_u16_be(header, tag);
  header[2] = type;
  header[3] = 0;
  hmg4v2_write_u32_be(header + 4, (uint32_t)value_length);
  return append_bytes(builder, header, sizeof(header)) &&
         append_bytes(builder, value, value_length);
}

static int append_tlv_u32(
    byte_builder *builder,
    uint16_t tag,
    uint32_t value) {
  uint8_t encoded[4];
  hmg4v2_write_u32_be(encoded, value);
  return append_tlv(builder, tag, 0x01, encoded, sizeof(encoded));
}

static int append_tlv_u64(
    byte_builder *builder,
    uint16_t tag,
    uint64_t value) {
  uint8_t encoded[8];
  hmg4v2_write_u64_be(encoded, value);
  return append_tlv(builder, tag, 0x02, encoded, sizeof(encoded));
}

static int append_tlv_sha256(
    byte_builder *builder,
    uint16_t tag,
    const uint8_t digest[32]) {
  return append_tlv(builder, tag, 0x04, digest, 32);
}

static int build_valid_table(size_t *table_length) {
  byte_builder table = {g_table, sizeof(g_table), 0};
  uint32_t index = 0;
  if (table_length == NULL ||
      !append_raw_u32(&table, HMG4V2_MANAGED_ENTRY_COUNT)) {
    return 0;
  }
  for (index = 0; index < HMG4V2_MANAGED_ENTRY_COUNT; index += 1) {
    uint8_t entry_bytes[512];
    byte_builder entry = {entry_bytes, sizeof(entry_bytes), 0};
    char path[64];
    int path_length = 0;
    uint8_t blob_byte = (uint8_t)(index + 1u);
    uint8_t blob_sha256[32];
    uint8_t metadata_sha256[32];
    const hmg4v2_span blob = {&blob_byte, 1};
    path_length = snprintf(path, sizeof(path), "bundle/output-%03u.bin", index);
    if (path_length <= 0 || (size_t)path_length >= sizeof(path) ||
        hmg4v2_sha256(blob, blob_sha256) != HMG4V2_CORE_OK) {
      return 0;
    }
    memset(metadata_sha256, (int)(index & 0xffu), sizeof(metadata_sha256));
    if (!append_tlv_u32(&entry, 0x0401, index) ||
        !append_tlv(&entry, 0x0402, 0x06, path, (size_t)path_length) ||
        !append_tlv_u64(&entry, 0x0403,
                        (uint64_t)index * HMG4V2_BUNDLE_ALIGNMENT) ||
        !append_tlv_u64(&entry, 0x0404, 1) ||
        !append_tlv_sha256(&entry, 0x0405, blob_sha256) ||
        !append_tlv_u32(&entry, 0x0406, 0644) ||
        !append_tlv_u32(&entry, 0x0407, 501) ||
        !append_tlv_u32(&entry, 0x0408, 20) ||
        !append_tlv_u32(&entry, 0x0409, 0) ||
        !append_tlv_sha256(&entry, 0x040a, metadata_sha256) ||
        !append_tlv_sha256(&entry, 0x040b, metadata_sha256) ||
        !append_raw_u32(&table, (uint32_t)entry.length) ||
        !append_bytes(&table, entry.bytes, entry.length)) {
      return 0;
    }
  }
  *table_length = table.length;
  return 1;
}

static int build_valid_bundle(hmg4v2_span *bundle, size_t *data_start) {
  static const uint8_t magic[8] = {
      0x48, 0x4d, 0x47, 0x34, 0x42, 0x32, 0x00, 0x00};
  size_t table_length = 0;
  size_t table_end = 0;
  size_t aligned_start = 0;
  const size_t data_length =
      (size_t)HMG4V2_MANAGED_ENTRY_COUNT * (size_t)HMG4V2_BUNDLE_ALIGNMENT;
  size_t file_length = 0;
  uint8_t table_sha256[32];
  uint8_t data_sha256[32];
  uint32_t index = 0;
  hmg4v2_span span;
  if (bundle == NULL || data_start == NULL ||
      !build_valid_table(&table_length) ||
      !hmg4v2_checked_add_size(HMG4V2_BUNDLE_HEADER_SIZE, table_length,
                              &table_end) ||
      !hmg4v2_checked_add_size(table_end, 4095u, &aligned_start)) {
    return 0;
  }
  aligned_start &= ~(size_t)4095u;
  if (!hmg4v2_checked_add_size(aligned_start, data_length, &file_length) ||
      file_length > sizeof(g_valid_bundle)) {
    return 0;
  }
  memset(g_valid_bundle, 0, file_length);
  memcpy(g_valid_bundle + HMG4V2_BUNDLE_HEADER_SIZE, g_table, table_length);
  for (index = 0; index < HMG4V2_MANAGED_ENTRY_COUNT; index += 1) {
    g_valid_bundle[aligned_start + (size_t)index * 4096u] =
        (uint8_t)(index + 1u);
  }
  span.bytes = g_table;
  span.length = table_length;
  if (hmg4v2_sha256(span, table_sha256) != HMG4V2_CORE_OK) return 0;
  span.bytes = g_valid_bundle + aligned_start;
  span.length = data_length;
  if (hmg4v2_sha256(span, data_sha256) != HMG4V2_CORE_OK) return 0;
  memcpy(g_valid_bundle, magic, sizeof(magic));
  hmg4v2_write_u32_be(g_valid_bundle + 8, 2);
  hmg4v2_write_u32_be(g_valid_bundle + 12, HMG4V2_MANAGED_ENTRY_COUNT);
  hmg4v2_write_u64_be(g_valid_bundle + 16, (uint64_t)table_length);
  hmg4v2_write_u64_be(g_valid_bundle + 24, (uint64_t)data_length);
  memcpy(g_valid_bundle + 32, table_sha256, sizeof(table_sha256));
  memcpy(g_valid_bundle + 64, data_sha256, sizeof(data_sha256));
  bundle->bytes = g_valid_bundle;
  bundle->length = file_length;
  *data_start = aligned_start;
  return 1;
}

static int refresh_hash(
    hmg4v2_span bytes,
    uint8_t destination[32]) {
  uint8_t digest[32];
  if (hmg4v2_sha256(bytes, digest) != HMG4V2_CORE_OK) return 0;
  memcpy(destination, digest, sizeof(digest));
  return 1;
}

static void fill_random(uint8_t *bytes, size_t length) {
  size_t index = 0;
  for (index = 0; index < length; index += 1) {
    bytes[index] = next_random_u8();
  }
}

static uint64_t run_malformed_buffer_fuzz(void) {
  static const uint8_t magic[8] = {
      0x48, 0x4d, 0x47, 0x34, 0x42, 0x32, 0x00, 0x00};
  uint64_t accumulator = 0;
  uint32_t iteration = 0;
  for (iteration = 0; iteration < FUZZ_ITERATIONS; iteration += 1) {
    size_t length = HMG4V2_BUNDLE_HEADER_SIZE +
                    (size_t)(next_random_u64() %
                             (SMALL_BUFFER_CAPACITY -
                              HMG4V2_BUNDLE_HEADER_SIZE));
    size_t header_length = HMG4V2_BUNDLE_HEADER_SIZE;
    uint8_t *const case_bytes =
        g_small_buffer + (((iteration & 1u) == 0u) ? 0u : 1u);
    hmg4v2_span input;
    hmg4v2_bundle_header header;
    hmg4v2_bundle_view view;
    hmg4v2_bundle_result header_result;
    hmg4v2_bundle_result bundle_result;
    uint64_t table_length = 0;
    uint64_t data_length = 0;
    const uint64_t aligned =
        (uint64_t)(next_random_u64() % 4u) * HMG4V2_BUNDLE_ALIGNMENT;
    fill_random(case_bytes, length);
    memcpy(case_bytes, magic, sizeof(magic));
    hmg4v2_write_u32_be(case_bytes + 8,
                        (iteration % 11u) == 0u ? 3u : 2u);
    hmg4v2_write_u32_be(case_bytes + 12,
                        (iteration % 13u) == 0u ? 113u : 114u);
    if ((iteration & 1u) == 0u) {
      table_length = aligned;
      g_aligned_malformed += 1;
    } else {
      table_length = aligned + 1u + (next_random_u64() % 4095u);
      g_misaligned_malformed += 1;
    }
    data_length = next_random_u64() % 8192u;
    hmg4v2_write_u64_be(case_bytes + 16, table_length);
    hmg4v2_write_u64_be(case_bytes + 24, data_length);
    if ((iteration % 7u) == 0u) case_bytes[0] ^= 1u;
    if ((iteration % 17u) == 0u) {
      header_length = (size_t)(next_random_u64() %
                               HMG4V2_BUNDLE_HEADER_SIZE);
    } else if ((iteration % 19u) == 0u) {
      header_length = HMG4V2_BUNDLE_HEADER_SIZE + 1u;
    }
    input.bytes = case_bytes;
    input.length = length;
    header_result = hmg4v2_parse_bundle_header(
        (hmg4v2_span){case_bytes, header_length}, &header);
    bundle_result = hmg4v2_validate_bundle(input, &view);
    if (bundle_result == HMG4V2_BUNDLE_OK) {
      g_unexpected_valid_malformed += 1;
    }
    accumulator = accumulator * UINT64_C(0x9e3779b185ebca87) +
                  (uint64_t)header_result * 257u +
                  (uint64_t)bundle_result + (uint64_t)length;
  }
  return accumulator;
}

static int run_valid_bundle_mutations(uint64_t *accumulator) {
  hmg4v2_span bundle;
  hmg4v2_bundle_view view;
  size_t data_start = 0;
  size_t table_length = 0;
  uint8_t original_table_hash[32];
  uint8_t original_data_hash[32];
  uint32_t iteration = 0;
  if (accumulator == NULL || !build_valid_bundle(&bundle, &data_start) ||
      hmg4v2_validate_bundle(bundle, &view) != HMG4V2_BUNDLE_OK) {
    return 0;
  }
  table_length = (size_t)hmg4v2_read_u64_be(g_valid_bundle + 16);
  memcpy(original_table_hash, g_valid_bundle + 32, sizeof(original_table_hash));
  memcpy(original_data_hash, g_valid_bundle + 64, sizeof(original_data_hash));

  for (iteration = 0; iteration < RAW_VALID_MUTATIONS; iteration += 1) {
    const size_t offset = (size_t)(next_random_u64() % bundle.length);
    const uint8_t saved = g_valid_bundle[offset];
    hmg4v2_bundle_result status;
    g_valid_bundle[offset] ^= (uint8_t)(1u << (iteration & 7u));
    status = hmg4v2_validate_bundle(bundle, &view);
    *accumulator = *accumulator * UINT64_C(1099511628211) + (uint64_t)status;
    g_valid_bundle[offset] = saved;
  }

  for (iteration = 0; iteration < REHASHED_TABLE_MUTATIONS; iteration += 1) {
    const size_t relative = (size_t)(next_random_u64() % table_length);
    const size_t offset = HMG4V2_BUNDLE_HEADER_SIZE + relative;
    const uint8_t saved = g_valid_bundle[offset];
    const hmg4v2_span table = {
        g_valid_bundle + HMG4V2_BUNDLE_HEADER_SIZE, table_length};
    hmg4v2_bundle_result status;
    g_valid_bundle[offset] ^= (uint8_t)(1u << (iteration & 7u));
    if (!refresh_hash(table, g_valid_bundle + 32)) return 0;
    status = hmg4v2_validate_bundle(bundle, &view);
    *accumulator = *accumulator * UINT64_C(1099511628211) + (uint64_t)status;
    g_valid_bundle[offset] = saved;
    memcpy(g_valid_bundle + 32, original_table_hash,
           sizeof(original_table_hash));
  }

  for (iteration = 0; iteration < REHASHED_DATA_MUTATIONS; iteration += 1) {
    const size_t data_length = bundle.length - data_start;
    const size_t relative = (size_t)(next_random_u64() % data_length);
    const size_t offset = data_start + relative;
    const uint8_t saved = g_valid_bundle[offset];
    const hmg4v2_span data = {g_valid_bundle + data_start, data_length};
    hmg4v2_bundle_result status;
    g_valid_bundle[offset] ^= (uint8_t)(1u << (iteration & 7u));
    if (!refresh_hash(data, g_valid_bundle + 64)) return 0;
    status = hmg4v2_validate_bundle(bundle, &view);
    *accumulator = *accumulator * UINT64_C(1099511628211) + (uint64_t)status;
    g_valid_bundle[offset] = saved;
    memcpy(g_valid_bundle + 64, original_data_hash, sizeof(original_data_hash));
  }

  return hmg4v2_validate_bundle(bundle, &view) == HMG4V2_BUNDLE_OK;
}

int main(void) {
  uint64_t accumulator = run_malformed_buffer_fuzz();
  if (g_aligned_malformed + g_misaligned_malformed != FUZZ_ITERATIONS ||
      g_unexpected_valid_malformed != 0 ||
      !run_valid_bundle_mutations(&accumulator)) {
    (void)fprintf(stderr, "bundle_codec_fuzz: invariant/setup failure\n");
    return 1;
  }
  (void)printf(
      "bundle_codec_fuzz: malformed=%u aligned=%u misaligned=%u "
      "raw-valid-mutations=%u "
      "rehash-table=%u rehash-data=%u checksum=%016llx\n",
      (unsigned)FUZZ_ITERATIONS, (unsigned)g_aligned_malformed,
      (unsigned)g_misaligned_malformed, (unsigned)RAW_VALID_MUTATIONS,
      (unsigned)REHASHED_TABLE_MUTATIONS,
      (unsigned)REHASHED_DATA_MUTATIONS,
      (unsigned long long)accumulator);
  return 0;
}
