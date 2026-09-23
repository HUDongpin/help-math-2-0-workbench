#ifndef HMG4V23_XATTR_POLICY_H
#define HMG4V23_XATTR_POLICY_H

#include "canonical_objects.h"
#include "canonical_tlv.h"

#include <stddef.h>
#include <stdint.h>

#define HMG4V23_XATTR_POLICY_RULE_COUNT_MAX ((size_t)64)

typedef enum {
  HMG4V23_XATTR_POLICY_OK = 0,
  HMG4V23_XATTR_POLICY_NULL_ARGUMENT,
  HMG4V23_XATTR_POLICY_ENVELOPE_INVALID,
  HMG4V23_XATTR_POLICY_SCHEMA_INVALID,
  HMG4V23_XATTR_POLICY_SPECIFICATION_MISMATCH,
  HMG4V23_XATTR_POLICY_CONSTANT_MISMATCH,
  HMG4V23_XATTR_POLICY_LIST_INVALID,
  HMG4V23_XATTR_POLICY_ORDINAL_INVALID,
  HMG4V23_XATTR_POLICY_NAME_INVALID,
  HMG4V23_XATTR_POLICY_NAME_ORDER_INVALID,
  HMG4V23_XATTR_POLICY_ARITHMETIC_OVERFLOW,
  HMG4V23_XATTR_POLICY_BOUND_EXCEEDED,
  HMG4V23_XATTR_POLICY_STREAM_HASH_FAILURE,
  HMG4V23_XATTR_POLICY_STREAM_HASH_MISMATCH,
  HMG4V23_XATTR_POLICY_EMPTY_FLAG_MISMATCH
} hmg4v23_xattr_policy_result;

typedef struct {
  uint32_t ordinal;
  hmg4v23_span name;
  hmg4v23_span value;
} hmg4v23_xattr_policy_rule_view;

typedef struct {
  uint32_t attribute_count;
  hmg4v23_xattr_policy_rule_view
      attributes[HMG4V23_XATTR_POLICY_RULE_COUNT_MAX];
  uint8_t canonical_xattr_set_sha256[32];
  uint64_t canonical_xattr_set_stream_length;
  uint64_t total_value_length;
  int exact_empty_set;
  hmg4v23_span payload;
} hmg4v23_xattr_policy_view;

/*
 * Validates one complete HMG4Y2 kind-1 authority envelope. The returned view
 * points only into caller-owned immutable bytes and performs no allocation,
 * filesystem operation, or mutation.
 */
hmg4v23_xattr_policy_result hmg4v23_validate_xattr_policy(
    hmg4v23_span frame,
    hmg4v23_xattr_policy_view *result);

const char *hmg4v23_xattr_policy_result_name(
    hmg4v23_xattr_policy_result result);

#endif
