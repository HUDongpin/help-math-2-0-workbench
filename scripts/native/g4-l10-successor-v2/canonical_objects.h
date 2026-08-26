#ifndef HMG4V2_CANONICAL_OBJECTS_H
#define HMG4V2_CANONICAL_OBJECTS_H

#include <stddef.h>
#include <stdint.h>

#define HMG4V2_CANONICAL_SHA256_LENGTH ((size_t)32)
#define HMG4V2_ACL_TAG_ALLOW_NAMED_UUID ((uint32_t)1)
#define HMG4V2_ACL_TAG_DENY_NAMED_UUID ((uint32_t)2)
#define HMG4V2_ACL_NAMED_UUID_LENGTH ((uint32_t)16)
#define HMG4V2_ACL_ALLOWED_PERMISSION_MASK UINT64_C(0x3fff)
#define HMG4V2_ACL_ALLOWED_FLAG_MASK UINT64_C(0x1f)
/*
 * Defensive workspace-implementation resource ceiling.  The current wire
 * contract does not assign semantic meaning to this number; streams above it
 * fail closed until a reviewed policy freezes a production ACL-count bound.
 */
#define HMG4V2_CANONICAL_MAX_ACL_ENTRIES ((uint32_t)1024)

/*
 * Workspace-only canonical-object codec for the contract whose SHA-256 is
 * 77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583.
 * These result values are local library diagnostics.  They are not the
 * production response diagnostic_code registry.
 */
typedef enum {
  HMG4V2_CANONICAL_OK = 0,
  HMG4V2_CANONICAL_NULL_ARGUMENT,
  HMG4V2_CANONICAL_SIZE_OVERFLOW,
  HMG4V2_CANONICAL_BUFFER_TOO_SMALL,
  HMG4V2_CANONICAL_TRUNCATED,
  HMG4V2_CANONICAL_BAD_MAGIC,
  HMG4V2_CANONICAL_BAD_VERSION,
  HMG4V2_CANONICAL_BAD_COUNT,
  HMG4V2_CANONICAL_BAD_TAG,
  HMG4V2_CANONICAL_BAD_QUALIFIER,
  HMG4V2_CANONICAL_BAD_PERMISSION_MASK,
  HMG4V2_CANONICAL_BAD_FLAG_MASK,
  HMG4V2_CANONICAL_BAD_NAME,
  HMG4V2_CANONICAL_BAD_ORDER,
  HMG4V2_CANONICAL_DUPLICATE,
  HMG4V2_CANONICAL_BOUND_EXCEEDED,
  HMG4V2_CANONICAL_TRAILING_BYTES,
  HMG4V2_CANONICAL_HASH_FAILURE
} hmg4v2_canonical_result;

typedef struct {
  uint32_t tag;
  const uint8_t *qualifier;
  uint32_t qualifier_length;
  uint64_t permissions;
  uint64_t flags;
} hmg4v2_acl_entry;

typedef struct {
  const uint8_t *name;
  uint32_t name_length;
  const uint8_t *value;
  uint64_t value_length;
} hmg4v2_xattr;

/*
 * Numeric limits are supplied by the caller because the contract freezes no
 * universal xattr bounds.  This codec does not decide the allowed name/value
 * set, whether an empty set is required, or any other xattr-policy meaning.
 */
typedef struct {
  uint32_t maximum_attribute_count;
  uint32_t maximum_name_length;
  uint64_t maximum_value_length;
  uint64_t maximum_total_value_length;
  uint64_t maximum_stream_length;
} hmg4v2_xattr_bounds;

hmg4v2_canonical_result hmg4v2_acl_stream_size(
    const hmg4v2_acl_entry *entries,
    uint32_t entry_count,
    size_t *encoded_size);

hmg4v2_canonical_result hmg4v2_acl_stream_encode(
    const hmg4v2_acl_entry *entries,
    uint32_t entry_count,
    uint8_t *output,
    size_t output_capacity,
    size_t *bytes_written);

hmg4v2_canonical_result hmg4v2_acl_stream_validate(
    const uint8_t *stream,
    size_t stream_length,
    uint32_t *entry_count);

hmg4v2_canonical_result hmg4v2_acl_stream_sha256(
    const uint8_t *stream,
    size_t stream_length,
    uint8_t digest[HMG4V2_CANONICAL_SHA256_LENGTH]);

/* Input attributes must already be in strict unsigned-name-byte order. */
hmg4v2_canonical_result hmg4v2_xattr_set_stream_size(
    const hmg4v2_xattr *attributes,
    uint32_t attribute_count,
    const hmg4v2_xattr_bounds *bounds,
    size_t *encoded_size);

hmg4v2_canonical_result hmg4v2_xattr_set_stream_encode(
    const hmg4v2_xattr *attributes,
    uint32_t attribute_count,
    const hmg4v2_xattr_bounds *bounds,
    uint8_t *output,
    size_t output_capacity,
    size_t *bytes_written);

hmg4v2_canonical_result hmg4v2_xattr_set_stream_validate(
    const uint8_t *stream,
    size_t stream_length,
    const hmg4v2_xattr_bounds *bounds,
    uint32_t *attribute_count);

hmg4v2_canonical_result hmg4v2_xattr_set_stream_sha256(
    const uint8_t *stream,
    size_t stream_length,
    const hmg4v2_xattr_bounds *bounds,
    uint8_t digest[HMG4V2_CANONICAL_SHA256_LENGTH]);

hmg4v2_canonical_result hmg4v2_symlink_target_stream_size(
    uint32_t target_length,
    size_t *encoded_size);

hmg4v2_canonical_result hmg4v2_symlink_target_stream_encode(
    const uint8_t *target,
    uint32_t target_length,
    uint8_t *output,
    size_t output_capacity,
    size_t *bytes_written);

hmg4v2_canonical_result hmg4v2_symlink_target_stream_validate(
    const uint8_t *stream,
    size_t stream_length,
    uint32_t *target_length);

hmg4v2_canonical_result hmg4v2_symlink_target_stream_sha256(
    const uint8_t *stream,
    size_t stream_length,
    uint8_t digest[HMG4V2_CANONICAL_SHA256_LENGTH]);

hmg4v2_canonical_result hmg4v2_symlink_target_sha256(
    const uint8_t *target,
    uint32_t target_length,
    uint8_t digest[HMG4V2_CANONICAL_SHA256_LENGTH]);

#endif
