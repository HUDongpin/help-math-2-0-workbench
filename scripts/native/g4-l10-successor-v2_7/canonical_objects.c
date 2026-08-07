#include "canonical_objects.h"

#include <CommonCrypto/CommonDigest.h>
#include <limits.h>
#include <string.h>

enum {
  HMG4V27_CANONICAL_HEADER_LENGTH = 16,
  HMG4V27_ACL_ENTRY_LENGTH = 40
};

static const uint8_t k_acl_magic[8] = {
    0x48, 0x4d, 0x47, 0x34, 0x41, 0x32, 0x00, 0x00};
static const uint8_t k_xattr_magic[8] = {
    0x48, 0x4d, 0x47, 0x34, 0x58, 0x32, 0x00, 0x00};
static const uint8_t k_symlink_magic[8] = {
    0x48, 0x4d, 0x47, 0x34, 0x4c, 0x32, 0x00, 0x00};

static const hmg4v27_xattr_bounds k_xattr_policy_bounds = {
    HMG4V27_XATTR_POLICY_MAX_ATTRIBUTE_COUNT,
    HMG4V27_XATTR_POLICY_MAX_NAME_LENGTH,
    HMG4V27_XATTR_POLICY_MAX_VALUE_LENGTH,
    HMG4V27_XATTR_POLICY_MAX_TOTAL_VALUE_LENGTH,
    HMG4V27_XATTR_POLICY_MAX_STREAM_LENGTH};

const hmg4v27_xattr_bounds *hmg4v27_canonical_xattr_policy_bounds(void) {
  return &k_xattr_policy_bounds;
}

int hmg4v27_xattr_bounds_are_exact_policy(
    const hmg4v27_xattr_bounds *bounds) {
  return bounds != NULL &&
         bounds->maximum_attribute_count ==
             k_xattr_policy_bounds.maximum_attribute_count &&
         bounds->maximum_name_length ==
             k_xattr_policy_bounds.maximum_name_length &&
         bounds->maximum_value_length ==
             k_xattr_policy_bounds.maximum_value_length &&
         bounds->maximum_total_value_length ==
             k_xattr_policy_bounds.maximum_total_value_length &&
         bounds->maximum_stream_length ==
             k_xattr_policy_bounds.maximum_stream_length;
}

typedef struct {
  const uint8_t *bytes;
  size_t length;
  size_t offset;
} hmg4v27_read_cursor;

static int checked_add_size(size_t left, size_t right, size_t *result) {
  if (result == NULL || right > SIZE_MAX - left) return 0;
  *result = left + right;
  return 1;
}

static int checked_add_u64(uint64_t left, uint64_t right, uint64_t *result) {
  if (result == NULL || right > UINT64_MAX - left) return 0;
  *result = left + right;
  return 1;
}

static uint32_t read_u32_be(const uint8_t bytes[4]) {
  return ((uint32_t)bytes[0] << 24) | ((uint32_t)bytes[1] << 16) |
         ((uint32_t)bytes[2] << 8) | (uint32_t)bytes[3];
}

static uint64_t read_u64_be(const uint8_t bytes[8]) {
  return ((uint64_t)bytes[0] << 56) | ((uint64_t)bytes[1] << 48) |
         ((uint64_t)bytes[2] << 40) | ((uint64_t)bytes[3] << 32) |
         ((uint64_t)bytes[4] << 24) | ((uint64_t)bytes[5] << 16) |
         ((uint64_t)bytes[6] << 8) | (uint64_t)bytes[7];
}

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

static int cursor_take(
    hmg4v27_read_cursor *cursor,
    size_t byte_count,
    const uint8_t **result) {
  size_t end = 0;
  if (cursor == NULL || result == NULL ||
      !checked_add_size(cursor->offset, byte_count, &end) ||
      end > cursor->length) {
    return 0;
  }
  *result = cursor->bytes + cursor->offset;
  cursor->offset = end;
  return 1;
}

static int unsigned_name_compare(
    const uint8_t *left,
    uint32_t left_length,
    const uint8_t *right,
    uint32_t right_length) {
  const size_t common = left_length < right_length
                            ? (size_t)left_length
                            : (size_t)right_length;
  int compared = 0;
  if (common > 0) compared = memcmp(left, right, common);
  if (compared != 0) return compared;
  if (left_length < right_length) return -1;
  if (left_length > right_length) return 1;
  return 0;
}

static int bytes_have_nul(const uint8_t *bytes, uint32_t length) {
  uint32_t index = 0;
  for (index = 0; index < length; index += 1) {
    if (bytes[index] == 0) return 1;
  }
  return 0;
}

static hmg4v27_canonical_result validate_acl_entry_fields(
    uint32_t tag,
    const uint8_t *qualifier,
    uint32_t qualifier_length,
    uint64_t permissions,
    uint64_t flags) {
  if (tag != HMG4V27_ACL_TAG_ALLOW_NAMED_UUID &&
      tag != HMG4V27_ACL_TAG_DENY_NAMED_UUID) {
    return HMG4V27_CANONICAL_BAD_TAG;
  }
  if (qualifier_length != HMG4V27_ACL_NAMED_UUID_LENGTH || qualifier == NULL) {
    return HMG4V27_CANONICAL_BAD_QUALIFIER;
  }
  if ((permissions & ~HMG4V27_ACL_ALLOWED_PERMISSION_MASK) != 0) {
    return HMG4V27_CANONICAL_BAD_PERMISSION_MASK;
  }
  if ((flags & ~HMG4V27_ACL_ALLOWED_FLAG_MASK) != 0) {
    return HMG4V27_CANONICAL_BAD_FLAG_MASK;
  }
  return HMG4V27_CANONICAL_OK;
}

static hmg4v27_canonical_result validate_acl_entries(
    const hmg4v27_acl_entry *entries,
    uint32_t entry_count) {
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  uint32_t index = 0;
  if (entry_count > 0 && entries == NULL) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  for (index = 0; index < entry_count; index += 1) {
    uint32_t prior = 0;
    status = validate_acl_entry_fields(
        entries[index].tag,
        entries[index].qualifier,
        entries[index].qualifier_length,
        entries[index].permissions,
        entries[index].flags);
    if (status != HMG4V27_CANONICAL_OK) return status;
    for (prior = 0; prior < index; prior += 1) {
      if (memcmp(
              entries[prior].qualifier,
              entries[index].qualifier,
              HMG4V27_ACL_NAMED_UUID_LENGTH) == 0) {
        return HMG4V27_CANONICAL_DUPLICATE;
      }
    }
  }
  return HMG4V27_CANONICAL_OK;
}

static hmg4v27_canonical_result sha256_update_bytes(
    CC_SHA256_CTX *context,
    const uint8_t *bytes,
    size_t length) {
  static const uint8_t empty = 0;
  const uint8_t *cursor = bytes;
  size_t remaining = length;
  if (context == NULL || (length > 0 && bytes == NULL)) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  if (cursor == NULL) cursor = &empty;
  while (remaining > 0) {
    const size_t chunk = remaining > (size_t)UINT32_MAX
                             ? (size_t)UINT32_MAX
                             : remaining;
    if (CC_SHA256_Update(context, cursor, (CC_LONG)chunk) != 1) {
      return HMG4V27_CANONICAL_HASH_FAILURE;
    }
    cursor += chunk;
    remaining -= chunk;
  }
  return HMG4V27_CANONICAL_OK;
}

static hmg4v27_canonical_result sha256_two_parts(
    const uint8_t *first,
    size_t first_length,
    const uint8_t *second,
    size_t second_length,
    uint8_t digest[HMG4V27_CANONICAL_SHA256_LENGTH]) {
  CC_SHA256_CTX context;
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  uint8_t local_digest[HMG4V27_CANONICAL_SHA256_LENGTH];
  if (digest == NULL || (first_length > 0 && first == NULL) ||
      (second_length > 0 && second == NULL)) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  if (CC_SHA256_Init(&context) != 1) return HMG4V27_CANONICAL_HASH_FAILURE;
  status = sha256_update_bytes(&context, first, first_length);
  if (status != HMG4V27_CANONICAL_OK) return status;
  status = sha256_update_bytes(&context, second, second_length);
  if (status != HMG4V27_CANONICAL_OK) return status;
  if (CC_SHA256_Final(local_digest, &context) != 1) {
    return HMG4V27_CANONICAL_HASH_FAILURE;
  }
  memcpy(digest, local_digest, sizeof(local_digest));
  return HMG4V27_CANONICAL_OK;
}

static hmg4v27_canonical_result sha256_bytes(
    const uint8_t *bytes,
    size_t length,
    uint8_t digest[HMG4V27_CANONICAL_SHA256_LENGTH]) {
  return sha256_two_parts(bytes, length, NULL, 0, digest);
}

hmg4v27_canonical_result hmg4v27_acl_stream_size(
    const hmg4v27_acl_entry *entries,
    uint32_t entry_count,
    size_t *encoded_size) {
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  size_t entries_size = 0;
  if (encoded_size == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  *encoded_size = 0;
  if (entry_count > HMG4V27_CANONICAL_MAX_ACL_ENTRIES) {
    return HMG4V27_CANONICAL_BOUND_EXCEEDED;
  }
  if ((size_t)entry_count > SIZE_MAX / HMG4V27_ACL_ENTRY_LENGTH) {
    return HMG4V27_CANONICAL_SIZE_OVERFLOW;
  }
  entries_size = (size_t)entry_count * HMG4V27_ACL_ENTRY_LENGTH;
  if (!checked_add_size(
          HMG4V27_CANONICAL_HEADER_LENGTH, entries_size, encoded_size)) {
    return HMG4V27_CANONICAL_SIZE_OVERFLOW;
  }
  status = validate_acl_entries(entries, entry_count);
  if (status != HMG4V27_CANONICAL_OK) {
    *encoded_size = 0;
    return status;
  }
  return status;
}

hmg4v27_canonical_result hmg4v27_acl_stream_encode(
    const hmg4v27_acl_entry *entries,
    uint32_t entry_count,
    uint8_t *output,
    size_t output_capacity,
    size_t *bytes_written) {
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  size_t required = 0;
  size_t offset = HMG4V27_CANONICAL_HEADER_LENGTH;
  uint32_t index = 0;
  if (bytes_written == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  *bytes_written = 0;
  status = hmg4v27_acl_stream_size(entries, entry_count, &required);
  if (status != HMG4V27_CANONICAL_OK) return status;
  if (output == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  if (output_capacity < required) return HMG4V27_CANONICAL_BUFFER_TOO_SMALL;
  memcpy(output, k_acl_magic, sizeof(k_acl_magic));
  write_u32_be(output + 8, 2);
  write_u32_be(output + 12, entry_count);
  for (index = 0; index < entry_count; index += 1) {
    write_u32_be(output + offset, entries[index].tag);
    offset += 4;
    write_u32_be(output + offset, entries[index].qualifier_length);
    offset += 4;
    memcpy(output + offset, entries[index].qualifier,
           HMG4V27_ACL_NAMED_UUID_LENGTH);
    offset += HMG4V27_ACL_NAMED_UUID_LENGTH;
    write_u64_be(output + offset, entries[index].permissions);
    offset += 8;
    write_u64_be(output + offset, entries[index].flags);
    offset += 8;
  }
  *bytes_written = offset;
  return HMG4V27_CANONICAL_OK;
}

hmg4v27_canonical_result hmg4v27_acl_stream_validate(
    const uint8_t *stream,
    size_t stream_length,
    uint32_t *entry_count) {
  hmg4v27_read_cursor cursor;
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  const uint8_t *bytes = NULL;
  size_t expected_length = 0;
  uint32_t count = 0;
  uint32_t index = 0;
  if (entry_count != NULL) *entry_count = 0;
  if (stream_length > 0 && stream == NULL) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  if (stream_length < HMG4V27_CANONICAL_HEADER_LENGTH) {
    return HMG4V27_CANONICAL_TRUNCATED;
  }
  if (memcmp(stream, k_acl_magic, sizeof(k_acl_magic)) != 0) {
    return HMG4V27_CANONICAL_BAD_MAGIC;
  }
  if (read_u32_be(stream + 8) != 2) return HMG4V27_CANONICAL_BAD_VERSION;
  count = read_u32_be(stream + 12);
  if ((size_t)count > SIZE_MAX / HMG4V27_ACL_ENTRY_LENGTH ||
      !checked_add_size(
          HMG4V27_CANONICAL_HEADER_LENGTH,
          (size_t)count * HMG4V27_ACL_ENTRY_LENGTH,
          &expected_length)) {
    return HMG4V27_CANONICAL_SIZE_OVERFLOW;
  }
  if (stream_length < expected_length) return HMG4V27_CANONICAL_TRUNCATED;
  if (stream_length > expected_length) {
    return HMG4V27_CANONICAL_TRAILING_BYTES;
  }
  if (count > HMG4V27_CANONICAL_MAX_ACL_ENTRIES) {
    return HMG4V27_CANONICAL_BOUND_EXCEEDED;
  }
  cursor.bytes = stream;
  cursor.length = stream_length;
  cursor.offset = HMG4V27_CANONICAL_HEADER_LENGTH;
  for (index = 0; index < count; index += 1) {
    uint32_t prior = 0;
    uint32_t tag = 0;
    uint32_t qualifier_length = 0;
    uint64_t permissions = 0;
    uint64_t flags = 0;
    const uint8_t *qualifier = NULL;
    if (!cursor_take(&cursor, 4, &bytes)) {
      return HMG4V27_CANONICAL_TRUNCATED;
    }
    tag = read_u32_be(bytes);
    if (!cursor_take(&cursor, 4, &bytes)) {
      return HMG4V27_CANONICAL_TRUNCATED;
    }
    qualifier_length = read_u32_be(bytes);
    if (qualifier_length != HMG4V27_ACL_NAMED_UUID_LENGTH) {
      return HMG4V27_CANONICAL_BAD_QUALIFIER;
    }
    if (!cursor_take(&cursor, qualifier_length, &qualifier) ||
        !cursor_take(&cursor, 8, &bytes)) {
      return HMG4V27_CANONICAL_TRUNCATED;
    }
    permissions = read_u64_be(bytes);
    if (!cursor_take(&cursor, 8, &bytes)) {
      return HMG4V27_CANONICAL_TRUNCATED;
    }
    flags = read_u64_be(bytes);
    status = validate_acl_entry_fields(
        tag, qualifier, qualifier_length, permissions, flags);
    if (status != HMG4V27_CANONICAL_OK) return status;
    for (prior = 0; prior < index; prior += 1) {
      const size_t prior_offset = HMG4V27_CANONICAL_HEADER_LENGTH +
          ((size_t)prior * HMG4V27_ACL_ENTRY_LENGTH) + 8;
      if (memcmp(stream + prior_offset, qualifier,
                 HMG4V27_ACL_NAMED_UUID_LENGTH) == 0) {
        return HMG4V27_CANONICAL_DUPLICATE;
      }
    }
  }
  if (cursor.offset != stream_length) {
    return HMG4V27_CANONICAL_TRAILING_BYTES;
  }
  if (entry_count != NULL) *entry_count = count;
  return HMG4V27_CANONICAL_OK;
}

hmg4v27_canonical_result hmg4v27_acl_stream_sha256(
    const uint8_t *stream,
    size_t stream_length,
    uint8_t digest[HMG4V27_CANONICAL_SHA256_LENGTH]) {
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  if (digest == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  status = hmg4v27_acl_stream_validate(stream, stream_length, NULL);
  if (status != HMG4V27_CANONICAL_OK) return status;
  return sha256_bytes(stream, stream_length, digest);
}

static hmg4v27_canonical_result validate_xattr_inputs(
    const hmg4v27_xattr *attributes,
    uint32_t attribute_count,
    const hmg4v27_xattr_bounds *bounds,
    size_t *encoded_size) {
  size_t required = HMG4V27_CANONICAL_HEADER_LENGTH;
  uint64_t total_value_length = 0;
  uint32_t index = 0;
  if (bounds == NULL || encoded_size == NULL) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  *encoded_size = 0;
  if (attribute_count > bounds->maximum_attribute_count) {
    return HMG4V27_CANONICAL_BOUND_EXCEEDED;
  }
  if (attribute_count > 0 && attributes == NULL) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  for (index = 0; index < attribute_count; index += 1) {
    const hmg4v27_xattr *attribute = &attributes[index];
    if (attribute->name_length == 0 || attribute->name == NULL) {
      return HMG4V27_CANONICAL_BAD_NAME;
    }
    if (attribute->name_length > bounds->maximum_name_length ||
        attribute->value_length > bounds->maximum_value_length) {
      return HMG4V27_CANONICAL_BOUND_EXCEEDED;
    }
    if (bytes_have_nul(attribute->name, attribute->name_length)) {
      return HMG4V27_CANONICAL_BAD_NAME;
    }
    if (attribute->value_length > 0 && attribute->value == NULL) {
      return HMG4V27_CANONICAL_NULL_ARGUMENT;
    }
    if (attribute->value_length > SIZE_MAX) {
      return HMG4V27_CANONICAL_SIZE_OVERFLOW;
    }
    if (!checked_add_u64(
            total_value_length,
            attribute->value_length,
            &total_value_length)) {
      return HMG4V27_CANONICAL_SIZE_OVERFLOW;
    }
    if (total_value_length > bounds->maximum_total_value_length) {
      return HMG4V27_CANONICAL_BOUND_EXCEEDED;
    }
    if (index > 0) {
      const hmg4v27_xattr *previous = &attributes[index - 1];
      const int order = unsigned_name_compare(
          previous->name,
          previous->name_length,
          attribute->name,
          attribute->name_length);
      if (order == 0) return HMG4V27_CANONICAL_DUPLICATE;
      if (order > 0) return HMG4V27_CANONICAL_BAD_ORDER;
    }
    if (!checked_add_size(required, 4, &required) ||
        !checked_add_size(required, attribute->name_length, &required) ||
        !checked_add_size(required, 8, &required) ||
        !checked_add_size(required, (size_t)attribute->value_length, &required)) {
      return HMG4V27_CANONICAL_SIZE_OVERFLOW;
    }
  }
  if ((uint64_t)required > bounds->maximum_stream_length) {
    return HMG4V27_CANONICAL_BOUND_EXCEEDED;
  }
  *encoded_size = required;
  return HMG4V27_CANONICAL_OK;
}

hmg4v27_canonical_result hmg4v27_xattr_set_stream_size(
    const hmg4v27_xattr *attributes,
    uint32_t attribute_count,
    const hmg4v27_xattr_bounds *bounds,
    size_t *encoded_size) {
  return validate_xattr_inputs(
      attributes, attribute_count, bounds, encoded_size);
}

hmg4v27_canonical_result hmg4v27_xattr_set_stream_encode(
    const hmg4v27_xattr *attributes,
    uint32_t attribute_count,
    const hmg4v27_xattr_bounds *bounds,
    uint8_t *output,
    size_t output_capacity,
    size_t *bytes_written) {
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  size_t required = 0;
  size_t offset = HMG4V27_CANONICAL_HEADER_LENGTH;
  uint32_t index = 0;
  if (bytes_written == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  *bytes_written = 0;
  status = validate_xattr_inputs(
      attributes, attribute_count, bounds, &required);
  if (status != HMG4V27_CANONICAL_OK) return status;
  if (output == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  if (output_capacity < required) return HMG4V27_CANONICAL_BUFFER_TOO_SMALL;
  memcpy(output, k_xattr_magic, sizeof(k_xattr_magic));
  write_u32_be(output + 8, 2);
  write_u32_be(output + 12, attribute_count);
  for (index = 0; index < attribute_count; index += 1) {
    write_u32_be(output + offset, attributes[index].name_length);
    offset += 4;
    memcpy(output + offset, attributes[index].name,
           attributes[index].name_length);
    offset += attributes[index].name_length;
    write_u64_be(output + offset, attributes[index].value_length);
    offset += 8;
    if (attributes[index].value_length > 0) {
      memcpy(output + offset, attributes[index].value,
             (size_t)attributes[index].value_length);
      offset += (size_t)attributes[index].value_length;
    }
  }
  *bytes_written = offset;
  return HMG4V27_CANONICAL_OK;
}

hmg4v27_canonical_result hmg4v27_xattr_set_stream_validate(
    const uint8_t *stream,
    size_t stream_length,
    const hmg4v27_xattr_bounds *bounds,
    uint32_t *attribute_count) {
  hmg4v27_read_cursor cursor;
  const uint8_t *bytes = NULL;
  const uint8_t *previous_name = NULL;
  uint32_t previous_name_length = 0;
  uint64_t total_value_length = 0;
  uint32_t count = 0;
  uint32_t index = 0;
  if (attribute_count != NULL) *attribute_count = 0;
  if (bounds == NULL || (stream_length > 0 && stream == NULL)) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  if ((uint64_t)stream_length > bounds->maximum_stream_length) {
    return HMG4V27_CANONICAL_BOUND_EXCEEDED;
  }
  if (stream_length < HMG4V27_CANONICAL_HEADER_LENGTH) {
    return HMG4V27_CANONICAL_TRUNCATED;
  }
  if (memcmp(stream, k_xattr_magic, sizeof(k_xattr_magic)) != 0) {
    return HMG4V27_CANONICAL_BAD_MAGIC;
  }
  if (read_u32_be(stream + 8) != 2) return HMG4V27_CANONICAL_BAD_VERSION;
  count = read_u32_be(stream + 12);
  if (count > bounds->maximum_attribute_count) {
    return HMG4V27_CANONICAL_BOUND_EXCEEDED;
  }
  cursor.bytes = stream;
  cursor.length = stream_length;
  cursor.offset = HMG4V27_CANONICAL_HEADER_LENGTH;
  for (index = 0; index < count; index += 1) {
    const uint8_t *name = NULL;
    uint32_t name_length = 0;
    uint64_t value_length = 0;
    if (!cursor_take(&cursor, 4, &bytes)) {
      return HMG4V27_CANONICAL_TRUNCATED;
    }
    name_length = read_u32_be(bytes);
    if (name_length == 0 || name_length > bounds->maximum_name_length) {
      return name_length == 0 ? HMG4V27_CANONICAL_BAD_NAME
                              : HMG4V27_CANONICAL_BOUND_EXCEEDED;
    }
    if (!cursor_take(&cursor, name_length, &name)) {
      return HMG4V27_CANONICAL_TRUNCATED;
    }
    if (bytes_have_nul(name, name_length)) return HMG4V27_CANONICAL_BAD_NAME;
    if (previous_name != NULL) {
      const int order = unsigned_name_compare(
          previous_name, previous_name_length, name, name_length);
      if (order == 0) return HMG4V27_CANONICAL_DUPLICATE;
      if (order > 0) return HMG4V27_CANONICAL_BAD_ORDER;
    }
    if (!cursor_take(&cursor, 8, &bytes)) {
      return HMG4V27_CANONICAL_TRUNCATED;
    }
    value_length = read_u64_be(bytes);
    if (value_length > bounds->maximum_value_length) {
      return HMG4V27_CANONICAL_BOUND_EXCEEDED;
    }
    if (!checked_add_u64(
            total_value_length, value_length, &total_value_length)) {
      return HMG4V27_CANONICAL_SIZE_OVERFLOW;
    }
    if (total_value_length > bounds->maximum_total_value_length) {
      return HMG4V27_CANONICAL_BOUND_EXCEEDED;
    }
    if (value_length > SIZE_MAX) return HMG4V27_CANONICAL_SIZE_OVERFLOW;
    if (!cursor_take(&cursor, (size_t)value_length, &bytes)) {
      return HMG4V27_CANONICAL_TRUNCATED;
    }
    previous_name = name;
    previous_name_length = name_length;
  }
  if (cursor.offset != stream_length) {
    return HMG4V27_CANONICAL_TRAILING_BYTES;
  }
  if (attribute_count != NULL) *attribute_count = count;
  return HMG4V27_CANONICAL_OK;
}

hmg4v27_canonical_result hmg4v27_xattr_set_stream_sha256(
    const uint8_t *stream,
    size_t stream_length,
    const hmg4v27_xattr_bounds *bounds,
    uint8_t digest[HMG4V27_CANONICAL_SHA256_LENGTH]) {
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  if (digest == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  status = hmg4v27_xattr_set_stream_validate(
      stream, stream_length, bounds, NULL);
  if (status != HMG4V27_CANONICAL_OK) return status;
  return sha256_bytes(stream, stream_length, digest);
}

hmg4v27_canonical_result hmg4v27_symlink_target_stream_size(
    uint32_t target_length,
    size_t *encoded_size) {
  if (encoded_size == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  *encoded_size = 0;
  if (!checked_add_size(
          HMG4V27_CANONICAL_HEADER_LENGTH,
          (size_t)target_length,
          encoded_size)) {
    return HMG4V27_CANONICAL_SIZE_OVERFLOW;
  }
  return HMG4V27_CANONICAL_OK;
}

hmg4v27_canonical_result hmg4v27_symlink_target_stream_encode(
    const uint8_t *target,
    uint32_t target_length,
    uint8_t *output,
    size_t output_capacity,
    size_t *bytes_written) {
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  size_t required = 0;
  if (bytes_written == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  *bytes_written = 0;
  if (target_length > 0 && target == NULL) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  status = hmg4v27_symlink_target_stream_size(target_length, &required);
  if (status != HMG4V27_CANONICAL_OK) return status;
  if (output == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  if (output_capacity < required) return HMG4V27_CANONICAL_BUFFER_TOO_SMALL;
  memcpy(output, k_symlink_magic, sizeof(k_symlink_magic));
  write_u32_be(output + 8, 2);
  write_u32_be(output + 12, target_length);
  if (target_length > 0) {
    memcpy(output + HMG4V27_CANONICAL_HEADER_LENGTH, target, target_length);
  }
  *bytes_written = required;
  return HMG4V27_CANONICAL_OK;
}

hmg4v27_canonical_result hmg4v27_symlink_target_stream_validate(
    const uint8_t *stream,
    size_t stream_length,
    uint32_t *target_length) {
  size_t expected_length = 0;
  uint32_t length = 0;
  if (target_length != NULL) *target_length = 0;
  if (stream_length > 0 && stream == NULL) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  if (stream_length < HMG4V27_CANONICAL_HEADER_LENGTH) {
    return HMG4V27_CANONICAL_TRUNCATED;
  }
  if (memcmp(stream, k_symlink_magic, sizeof(k_symlink_magic)) != 0) {
    return HMG4V27_CANONICAL_BAD_MAGIC;
  }
  if (read_u32_be(stream + 8) != 2) return HMG4V27_CANONICAL_BAD_VERSION;
  length = read_u32_be(stream + 12);
  if (!checked_add_size(
          HMG4V27_CANONICAL_HEADER_LENGTH,
          (size_t)length,
          &expected_length)) {
    return HMG4V27_CANONICAL_SIZE_OVERFLOW;
  }
  if (stream_length < expected_length) return HMG4V27_CANONICAL_TRUNCATED;
  if (stream_length > expected_length) {
    return HMG4V27_CANONICAL_TRAILING_BYTES;
  }
  if (target_length != NULL) *target_length = length;
  return HMG4V27_CANONICAL_OK;
}

hmg4v27_canonical_result hmg4v27_symlink_target_stream_sha256(
    const uint8_t *stream,
    size_t stream_length,
    uint8_t digest[HMG4V27_CANONICAL_SHA256_LENGTH]) {
  hmg4v27_canonical_result status = HMG4V27_CANONICAL_OK;
  if (digest == NULL) return HMG4V27_CANONICAL_NULL_ARGUMENT;
  status = hmg4v27_symlink_target_stream_validate(
      stream, stream_length, NULL);
  if (status != HMG4V27_CANONICAL_OK) return status;
  return sha256_bytes(stream, stream_length, digest);
}

hmg4v27_canonical_result hmg4v27_symlink_target_sha256(
    const uint8_t *target,
    uint32_t target_length,
    uint8_t digest[HMG4V27_CANONICAL_SHA256_LENGTH]) {
  uint8_t header[HMG4V27_CANONICAL_HEADER_LENGTH];
  if (digest == NULL || (target_length > 0 && target == NULL)) {
    return HMG4V27_CANONICAL_NULL_ARGUMENT;
  }
  memcpy(header, k_symlink_magic, sizeof(k_symlink_magic));
  write_u32_be(header + 8, 2);
  write_u32_be(header + 12, target_length);
  return sha256_two_parts(
      header, sizeof(header), target, target_length, digest);
}
