#ifndef HMG4V23_CANONICAL_OBJECTS_H
#define HMG4V23_CANONICAL_OBJECTS_H

#include <stddef.h>
#include <stdint.h>

#define HMG4V23_CANONICAL_SHA256_LENGTH ((size_t)32)
#define HMG4V23_ACL_TAG_ALLOW_NAMED_UUID ((uint32_t)1)
#define HMG4V23_ACL_TAG_DENY_NAMED_UUID ((uint32_t)2)
#define HMG4V23_ACL_NAMED_UUID_LENGTH ((uint32_t)16)
#define HMG4V23_ACL_ALLOWED_PERMISSION_MASK UINT64_C(0x3fff)
#define HMG4V23_ACL_ALLOWED_FLAG_MASK UINT64_C(0x1f)
#define HMG4V23_CANONICAL_MAX_ACL_ENTRIES ((uint32_t)1024)
#define HMG4V23_XATTR_POLICY_MAX_ATTRIBUTE_COUNT ((uint32_t)64)
#define HMG4V23_XATTR_POLICY_MAX_NAME_LENGTH ((uint32_t)127)
#define HMG4V23_XATTR_POLICY_MAX_VALUE_LENGTH UINT64_C(4096)
#define HMG4V23_XATTR_POLICY_MAX_TOTAL_VALUE_LENGTH UINT64_C(65536)
#define HMG4V23_XATTR_POLICY_MAX_STREAM_LENGTH UINT64_C(524288)

/*
 * Canonical predecessor-format codec bound to the successor whose SHA-256 is
 * bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320.
 * These result values are local library diagnostics.  They are not the
 * production response diagnostic_code registry.
 */
typedef enum {
  HMG4V23_CANONICAL_OK = 0,
  HMG4V23_CANONICAL_NULL_ARGUMENT,
  HMG4V23_CANONICAL_SIZE_OVERFLOW,
  HMG4V23_CANONICAL_BUFFER_TOO_SMALL,
  HMG4V23_CANONICAL_TRUNCATED,
  HMG4V23_CANONICAL_BAD_MAGIC,
  HMG4V23_CANONICAL_BAD_VERSION,
  HMG4V23_CANONICAL_BAD_COUNT,
  HMG4V23_CANONICAL_BAD_TAG,
  HMG4V23_CANONICAL_BAD_QUALIFIER,
  HMG4V23_CANONICAL_BAD_PERMISSION_MASK,
  HMG4V23_CANONICAL_BAD_FLAG_MASK,
  HMG4V23_CANONICAL_BAD_NAME,
  HMG4V23_CANONICAL_BAD_ORDER,
  HMG4V23_CANONICAL_DUPLICATE,
  HMG4V23_CANONICAL_BOUND_EXCEEDED,
  HMG4V23_CANONICAL_TRAILING_BYTES,
  HMG4V23_CANONICAL_HASH_FAILURE
} hmg4v23_canonical_result;

typedef struct {
  uint32_t tag;
  const uint8_t *qualifier;
  uint32_t qualifier_length;
  uint64_t permissions;
  uint64_t flags;
} hmg4v23_acl_entry;

typedef struct {
  const uint8_t *name;
  uint32_t name_length;
  const uint8_t *value;
  uint64_t value_length;
} hmg4v23_xattr;

/*
 * Numeric limits are explicit so the codec can validate a policy-bound stream
 * without ambient configuration. Production callers use the single frozen
 * v2.3 bound set returned below. Tests may pass narrower bounds.
 */
typedef struct {
  uint32_t maximum_attribute_count;
  uint32_t maximum_name_length;
  uint64_t maximum_value_length;
  uint64_t maximum_total_value_length;
  uint64_t maximum_stream_length;
} hmg4v23_xattr_bounds;

const hmg4v23_xattr_bounds *hmg4v23_canonical_xattr_policy_bounds(void);
int hmg4v23_xattr_bounds_are_exact_policy(
    const hmg4v23_xattr_bounds *bounds);

hmg4v23_canonical_result hmg4v23_acl_stream_size(
    const hmg4v23_acl_entry *entries,
    uint32_t entry_count,
    size_t *encoded_size);

hmg4v23_canonical_result hmg4v23_acl_stream_encode(
    const hmg4v23_acl_entry *entries,
    uint32_t entry_count,
    uint8_t *output,
    size_t output_capacity,
    size_t *bytes_written);

hmg4v23_canonical_result hmg4v23_acl_stream_validate(
    const uint8_t *stream,
    size_t stream_length,
    uint32_t *entry_count);

hmg4v23_canonical_result hmg4v23_acl_stream_sha256(
    const uint8_t *stream,
    size_t stream_length,
    uint8_t digest[HMG4V23_CANONICAL_SHA256_LENGTH]);

/* Input attributes must already be in strict unsigned-name-byte order. */
hmg4v23_canonical_result hmg4v23_xattr_set_stream_size(
    const hmg4v23_xattr *attributes,
    uint32_t attribute_count,
    const hmg4v23_xattr_bounds *bounds,
    size_t *encoded_size);

hmg4v23_canonical_result hmg4v23_xattr_set_stream_encode(
    const hmg4v23_xattr *attributes,
    uint32_t attribute_count,
    const hmg4v23_xattr_bounds *bounds,
    uint8_t *output,
    size_t output_capacity,
    size_t *bytes_written);

hmg4v23_canonical_result hmg4v23_xattr_set_stream_validate(
    const uint8_t *stream,
    size_t stream_length,
    const hmg4v23_xattr_bounds *bounds,
    uint32_t *attribute_count);

hmg4v23_canonical_result hmg4v23_xattr_set_stream_sha256(
    const uint8_t *stream,
    size_t stream_length,
    const hmg4v23_xattr_bounds *bounds,
    uint8_t digest[HMG4V23_CANONICAL_SHA256_LENGTH]);

hmg4v23_canonical_result hmg4v23_symlink_target_stream_size(
    uint32_t target_length,
    size_t *encoded_size);

hmg4v23_canonical_result hmg4v23_symlink_target_stream_encode(
    const uint8_t *target,
    uint32_t target_length,
    uint8_t *output,
    size_t output_capacity,
    size_t *bytes_written);

hmg4v23_canonical_result hmg4v23_symlink_target_stream_validate(
    const uint8_t *stream,
    size_t stream_length,
    uint32_t *target_length);

hmg4v23_canonical_result hmg4v23_symlink_target_stream_sha256(
    const uint8_t *stream,
    size_t stream_length,
    uint8_t digest[HMG4V23_CANONICAL_SHA256_LENGTH]);

hmg4v23_canonical_result hmg4v23_symlink_target_sha256(
    const uint8_t *target,
    uint32_t target_length,
    uint8_t digest[HMG4V23_CANONICAL_SHA256_LENGTH]);

#endif
