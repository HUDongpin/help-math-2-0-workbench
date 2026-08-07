#include "bundle_codec.h"

#include <CommonCrypto/CommonDigest.h>
#include <limits.h>
#include <string.h>

enum {
  HMG4V2_TYPE_U32 = 0x01,
  HMG4V2_TYPE_U64 = 0x02,
  HMG4V2_TYPE_SHA256 = 0x04,
  HMG4V2_TYPE_POLICY_REL_PATH = 0x06
};

static const uint8_t k_bundle_magic[8] = {
    0x48, 0x4d, 0x47, 0x34, 0x42, 0x32, 0x00, 0x00};

static int span_pointer_is_valid(hmg4v2_span span) {
  return span.length == 0 || span.bytes != NULL;
}

static int checked_align_up_size(
    size_t value,
    size_t alignment,
    size_t *result) {
  size_t remainder = 0;
  size_t increment = 0;
  if (result == NULL || alignment == 0) return 0;
  remainder = value % alignment;
  if (remainder == 0) {
    *result = value;
    return 1;
  }
  increment = alignment - remainder;
  return hmg4v2_checked_add_size(value, increment, result);
}

static hmg4v2_bundle_result sha256_streaming(
    hmg4v2_span input,
    uint8_t digest[32]) {
  static const uint8_t k_empty = 0;
  CC_SHA256_CTX context;
  const uint8_t *cursor = input.bytes;
  size_t remaining = input.length;
  if (digest == NULL || !span_pointer_is_valid(input)) {
    return HMG4V2_BUNDLE_NULL_ARGUMENT;
  }
  if (cursor == NULL) cursor = &k_empty;
  if (CC_SHA256_Init(&context) != 1) return HMG4V2_BUNDLE_HASH_FAILURE;
  while (remaining != 0) {
    const size_t chunk_size =
        remaining > (size_t)UINT32_MAX ? (size_t)UINT32_MAX : remaining;
    if (CC_SHA256_Update(&context, cursor, (CC_LONG)chunk_size) != 1) {
      return HMG4V2_BUNDLE_HASH_FAILURE;
    }
    cursor += chunk_size;
    remaining -= chunk_size;
  }
  if (CC_SHA256_Final(digest, &context) != 1) {
    return HMG4V2_BUNDLE_HASH_FAILURE;
  }
  return HMG4V2_BUNDLE_OK;
}

static int bytes_are_zero(hmg4v2_span bytes) {
  size_t index = 0;
  for (index = 0; index < bytes.length; index += 1) {
    if (bytes.bytes[index] != 0) return 0;
  }
  return 1;
}

static uint8_t ascii_lower(uint8_t value) {
  if (value >= (uint8_t)'A' && value <= (uint8_t)'Z') {
    return (uint8_t)(value + ((uint8_t)'a' - (uint8_t)'A'));
  }
  return value;
}

static int spans_equal(hmg4v2_span left, hmg4v2_span right) {
  return left.length == right.length &&
         (left.length == 0 || memcmp(left.bytes, right.bytes, left.length) == 0);
}

static int spans_ascii_lower_equal(hmg4v2_span left, hmg4v2_span right) {
  size_t index = 0;
  if (left.length != right.length) return 0;
  for (index = 0; index < left.length; index += 1) {
    if (ascii_lower(left.bytes[index]) != ascii_lower(right.bytes[index])) {
      return 0;
    }
  }
  return 1;
}

hmg4v2_bundle_result hmg4v2_parse_bundle_header(
    hmg4v2_span header_bytes,
    hmg4v2_bundle_header *result) {
  hmg4v2_bundle_header candidate;
  uint32_t version = 0;
  uint32_t entry_count = 0;
  if (result == NULL || !span_pointer_is_valid(header_bytes)) {
    return HMG4V2_BUNDLE_NULL_ARGUMENT;
  }
  if (header_bytes.length < HMG4V2_BUNDLE_HEADER_SIZE) {
    return HMG4V2_BUNDLE_TRUNCATED_HEADER;
  }
  if (header_bytes.length != HMG4V2_BUNDLE_HEADER_SIZE) {
    return HMG4V2_BUNDLE_HEADER_LENGTH_MISMATCH;
  }
  if (memcmp(header_bytes.bytes, k_bundle_magic, sizeof(k_bundle_magic)) != 0) {
    return HMG4V2_BUNDLE_BAD_MAGIC;
  }
  version = hmg4v2_read_u32_be(header_bytes.bytes + 8);
  if (version != 2) return HMG4V2_BUNDLE_BAD_VERSION;
  entry_count = hmg4v2_read_u32_be(header_bytes.bytes + 12);
  if (entry_count != HMG4V2_MANAGED_ENTRY_COUNT) {
    return HMG4V2_BUNDLE_BAD_ENTRY_COUNT;
  }
  candidate.table_length = hmg4v2_read_u64_be(header_bytes.bytes + 16);
  candidate.data_region_length = hmg4v2_read_u64_be(header_bytes.bytes + 24);
  if (candidate.table_length > HMG4V2_BUNDLE_MAX_TABLE_LENGTH) {
    return HMG4V2_BUNDLE_TABLE_TOO_LARGE;
  }
  if (candidate.data_region_length > HMG4V2_BUNDLE_MAX_DATA_LENGTH) {
    return HMG4V2_BUNDLE_DATA_TOO_LARGE;
  }
  memcpy(candidate.table_sha256, header_bytes.bytes + 32,
         sizeof(candidate.table_sha256));
  memcpy(candidate.data_region_sha256, header_bytes.bytes + 64,
         sizeof(candidate.data_region_sha256));
  *result = candidate;
  return HMG4V2_BUNDLE_OK;
}

static hmg4v2_bundle_result next_expected(
    hmg4v2_tlv_cursor *cursor,
    uint16_t tag,
    uint8_t type,
    hmg4v2_tlv_view *view) {
  int done = 0;
  hmg4v2_core_result core_result = hmg4v2_tlv_next(cursor, view, &done);
  if (core_result == HMG4V2_CORE_BAD_PATH) return HMG4V2_BUNDLE_BAD_PATH;
  if (core_result != HMG4V2_CORE_OK || done) return HMG4V2_BUNDLE_BAD_ENTRY;
  if (view->tag != tag || view->type != type) {
    return HMG4V2_BUNDLE_BAD_ENTRY;
  }
  return HMG4V2_BUNDLE_OK;
}

static hmg4v2_bundle_result parse_bundle_entry(
    hmg4v2_span encoded_struct,
    uint32_t expected_index,
    hmg4v2_bundle_entry_view *result) {
  static const uint8_t k_types[11] = {
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_POLICY_REL_PATH,
      HMG4V2_TYPE_U64,
      HMG4V2_TYPE_U64,
      HMG4V2_TYPE_SHA256,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_U32,
      HMG4V2_TYPE_SHA256,
      HMG4V2_TYPE_SHA256};
  hmg4v2_tlv_cursor cursor;
  hmg4v2_tlv_view fields[11];
  size_t field_index = 0;
  int done = 0;
  hmg4v2_tlv_view extra;
  hmg4v2_core_result core_result;
  if (result == NULL || !span_pointer_is_valid(encoded_struct)) {
    return HMG4V2_BUNDLE_NULL_ARGUMENT;
  }
  hmg4v2_tlv_cursor_init(&cursor, encoded_struct);
  for (field_index = 0; field_index < 11; field_index += 1) {
    hmg4v2_bundle_result status = next_expected(
        &cursor, (uint16_t)(0x0401u + field_index), k_types[field_index],
        &fields[field_index]);
    if (status != HMG4V2_BUNDLE_OK) return status;
  }
  core_result = hmg4v2_tlv_next(&cursor, &extra, &done);
  if (core_result != HMG4V2_CORE_OK || !done) {
    return HMG4V2_BUNDLE_BAD_ENTRY;
  }
  result->index = hmg4v2_read_u32_be(fields[0].value.bytes);
  if (result->index != expected_index) return HMG4V2_BUNDLE_BAD_ENTRY;
  result->path = fields[1].value;
  if (!hmg4v2_policy_rel_path_is_lexically_safe(result->path)) {
    return HMG4V2_BUNDLE_BAD_PATH;
  }
  result->offset = hmg4v2_read_u64_be(fields[2].value.bytes);
  result->size = hmg4v2_read_u64_be(fields[3].value.bytes);
  memcpy(result->sha256, fields[4].value.bytes, sizeof(result->sha256));
  result->installed_mode = hmg4v2_read_u32_be(fields[5].value.bytes);
  result->installed_owner_uid = hmg4v2_read_u32_be(fields[6].value.bytes);
  result->installed_group_gid = hmg4v2_read_u32_be(fields[7].value.bytes);
  result->installed_flags = hmg4v2_read_u32_be(fields[8].value.bytes);
  memcpy(result->installed_acl_sha256, fields[9].value.bytes,
         sizeof(result->installed_acl_sha256));
  memcpy(result->installed_xattr_policy_sha256, fields[10].value.bytes,
         sizeof(result->installed_xattr_policy_sha256));
  if ((result->offset % HMG4V2_BUNDLE_ALIGNMENT) != 0 || result->size == 0 ||
      result->size > HMG4V2_BUNDLE_MAX_BLOB_SIZE ||
      result->offset > HMG4V2_BUNDLE_MAX_DATA_LENGTH ||
      result->size > HMG4V2_BUNDLE_MAX_DATA_LENGTH - result->offset) {
    return HMG4V2_BUNDLE_BAD_RANGE;
  }
  return HMG4V2_BUNDLE_OK;
}

static hmg4v2_bundle_result parse_bundle_table(
    hmg4v2_span table,
    uint64_t data_region_length,
    hmg4v2_bundle_entry_view entries[HMG4V2_MANAGED_ENTRY_COUNT]) {
  size_t offset = 0;
  uint32_t count = 0;
  uint32_t index = 0;
  uint64_t previous_end = 0;
  if (entries == NULL || !span_pointer_is_valid(table)) {
    return HMG4V2_BUNDLE_NULL_ARGUMENT;
  }
  if (table.length < 4) return HMG4V2_BUNDLE_BAD_TABLE;
  count = hmg4v2_read_u32_be(table.bytes);
  if (count != HMG4V2_MANAGED_ENTRY_COUNT) {
    return HMG4V2_BUNDLE_BAD_ENTRY_COUNT;
  }
  offset = 4;
  for (index = 0; index < count; index += 1) {
    uint32_t member_length = 0;
    hmg4v2_span member;
    uint32_t prior_index = 0;
    hmg4v2_bundle_result status;
    if (!hmg4v2_range_within(offset, 4, table.length)) {
      return HMG4V2_BUNDLE_BAD_TABLE;
    }
    member_length = hmg4v2_read_u32_be(table.bytes + offset);
    if (!hmg4v2_checked_add_size(offset, 4, &offset) ||
        !hmg4v2_range_within(offset, (size_t)member_length, table.length)) {
      return HMG4V2_BUNDLE_BAD_TABLE;
    }
    member.bytes = table.bytes + offset;
    member.length = (size_t)member_length;
    status = parse_bundle_entry(member, index, &entries[index]);
    if (status != HMG4V2_BUNDLE_OK) return status;
    if (index != 0 && entries[index].offset < previous_end) {
      return HMG4V2_BUNDLE_BAD_RANGE;
    }
    if (entries[index].offset > data_region_length ||
        entries[index].size > data_region_length - entries[index].offset) {
      return HMG4V2_BUNDLE_BAD_RANGE;
    }
    previous_end = entries[index].offset + entries[index].size;
    for (prior_index = 0; prior_index < index; prior_index += 1) {
      if (spans_equal(entries[prior_index].path, entries[index].path)) {
        return HMG4V2_BUNDLE_DUPLICATE_PATH;
      }
      if (spans_ascii_lower_equal(entries[prior_index].path,
                                  entries[index].path)) {
        return HMG4V2_BUNDLE_CASE_COLLISION;
      }
    }
    if (!hmg4v2_checked_add_size(offset, (size_t)member_length, &offset)) {
      return HMG4V2_BUNDLE_SIZE_OVERFLOW;
    }
  }
  return offset == table.length ? HMG4V2_BUNDLE_OK
                                : HMG4V2_BUNDLE_BAD_TABLE;
}

static hmg4v2_bundle_result validate_data_region(
    hmg4v2_span data_region,
    const hmg4v2_bundle_entry_view entries[HMG4V2_MANAGED_ENTRY_COUNT],
    const uint8_t expected_data_sha256[32]) {
  uint8_t actual_data_sha256[32];
  size_t cursor = 0;
  uint32_t index = 0;
  hmg4v2_bundle_result status =
      sha256_streaming(data_region, actual_data_sha256);
  if (status != HMG4V2_BUNDLE_OK) return status;
  if (memcmp(actual_data_sha256, expected_data_sha256,
             sizeof(actual_data_sha256)) != 0) {
    return HMG4V2_BUNDLE_DATA_HASH_MISMATCH;
  }
  for (index = 0; index < HMG4V2_MANAGED_ENTRY_COUNT; index += 1) {
    hmg4v2_span gap;
    hmg4v2_span blob;
    uint8_t actual_blob_sha256[32];
    size_t entry_offset = 0;
    size_t entry_size = 0;
    size_t entry_end = 0;
    if (entries[index].offset > SIZE_MAX || entries[index].size > SIZE_MAX) {
      return HMG4V2_BUNDLE_SIZE_OVERFLOW;
    }
    entry_offset = (size_t)entries[index].offset;
    entry_size = (size_t)entries[index].size;
    if (!hmg4v2_range_within(entry_offset, entry_size, data_region.length) ||
        entry_offset < cursor ||
        !hmg4v2_checked_add_size(entry_offset, entry_size, &entry_end)) {
      return HMG4V2_BUNDLE_BAD_RANGE;
    }
    gap.bytes = data_region.bytes + cursor;
    gap.length = entry_offset - cursor;
    if (!bytes_are_zero(gap)) return HMG4V2_BUNDLE_NONZERO_DATA_GAP;
    blob.bytes = data_region.bytes + entry_offset;
    blob.length = entry_size;
    status = sha256_streaming(blob, actual_blob_sha256);
    if (status != HMG4V2_BUNDLE_OK) return status;
    if (memcmp(actual_blob_sha256, entries[index].sha256,
               sizeof(actual_blob_sha256)) != 0) {
      return HMG4V2_BUNDLE_BLOB_HASH_MISMATCH;
    }
    cursor = entry_end;
  }
  if (cursor > data_region.length) return HMG4V2_BUNDLE_BAD_RANGE;
  {
    hmg4v2_span trailing_gap;
    trailing_gap.bytes = data_region.bytes + cursor;
    trailing_gap.length = data_region.length - cursor;
    if (!bytes_are_zero(trailing_gap)) {
      return HMG4V2_BUNDLE_NONZERO_DATA_GAP;
    }
  }
  return HMG4V2_BUNDLE_OK;
}

hmg4v2_bundle_result hmg4v2_validate_bundle(
    hmg4v2_span bundle_bytes,
    hmg4v2_bundle_view *result) {
  hmg4v2_bundle_view candidate;
  hmg4v2_span header_span;
  hmg4v2_bundle_header header;
  hmg4v2_bundle_result status;
  size_t table_length = 0;
  size_t data_length = 0;
  size_t table_end = 0;
  size_t data_start = 0;
  size_t exact_file_length = 0;
  uint8_t actual_table_sha256[32];
  if (result == NULL || !span_pointer_is_valid(bundle_bytes)) {
    return HMG4V2_BUNDLE_NULL_ARGUMENT;
  }
  if (bundle_bytes.length < HMG4V2_BUNDLE_HEADER_SIZE) {
    return HMG4V2_BUNDLE_TRUNCATED_HEADER;
  }
  header_span.bytes = bundle_bytes.bytes;
  header_span.length = HMG4V2_BUNDLE_HEADER_SIZE;
  status = hmg4v2_parse_bundle_header(header_span, &header);
  if (status != HMG4V2_BUNDLE_OK) return status;
  if (header.table_length > SIZE_MAX || header.data_region_length > SIZE_MAX) {
    return HMG4V2_BUNDLE_SIZE_OVERFLOW;
  }
  table_length = (size_t)header.table_length;
  data_length = (size_t)header.data_region_length;
  if (!hmg4v2_checked_add_size(HMG4V2_BUNDLE_HEADER_SIZE, table_length,
                              &table_end) ||
      !checked_align_up_size(table_end, (size_t)HMG4V2_BUNDLE_ALIGNMENT,
                             &data_start) ||
      !hmg4v2_checked_add_size(data_start, data_length, &exact_file_length)) {
    return HMG4V2_BUNDLE_SIZE_OVERFLOW;
  }
  if (exact_file_length != bundle_bytes.length) {
    return HMG4V2_BUNDLE_FILE_LENGTH_MISMATCH;
  }
  candidate.header = header;
  candidate.table.bytes = bundle_bytes.bytes + HMG4V2_BUNDLE_HEADER_SIZE;
  candidate.table.length = table_length;
  candidate.predata_padding.bytes = bundle_bytes.bytes + table_end;
  candidate.predata_padding.length = data_start - table_end;
  candidate.data_region.bytes = bundle_bytes.bytes + data_start;
  candidate.data_region.length = data_length;
  candidate.data_start = data_start;
  if (!bytes_are_zero(candidate.predata_padding)) {
    return HMG4V2_BUNDLE_NONZERO_PREDATA_PADDING;
  }
  status = sha256_streaming(candidate.table, actual_table_sha256);
  if (status != HMG4V2_BUNDLE_OK) return status;
  if (memcmp(actual_table_sha256, header.table_sha256,
             sizeof(actual_table_sha256)) != 0) {
    return HMG4V2_BUNDLE_TABLE_HASH_MISMATCH;
  }
  status = parse_bundle_table(candidate.table, header.data_region_length,
                              candidate.entries);
  if (status != HMG4V2_BUNDLE_OK) return status;
  status = validate_data_region(candidate.data_region, candidate.entries,
                                header.data_region_sha256);
  if (status != HMG4V2_BUNDLE_OK) return status;
  *result = candidate;
  return HMG4V2_BUNDLE_OK;
}

const char *hmg4v2_bundle_result_name(hmg4v2_bundle_result result) {
  static const char *const k_names[] = {
      "ok",
      "null-argument",
      "truncated-header",
      "header-length-mismatch",
      "bad-magic",
      "bad-version",
      "bad-entry-count",
      "table-too-large",
      "data-too-large",
      "size-overflow",
      "file-length-mismatch",
      "table-hash-mismatch",
      "data-hash-mismatch",
      "nonzero-predata-padding",
      "bad-table",
      "bad-entry",
      "bad-path",
      "duplicate-path",
      "case-collision",
      "bad-range",
      "nonzero-data-gap",
      "blob-hash-mismatch",
      "hash-failure"};
  const size_t count = sizeof(k_names) / sizeof(k_names[0]);
  if ((size_t)result >= count) return "unknown-bundle-result";
  return k_names[(size_t)result];
}
