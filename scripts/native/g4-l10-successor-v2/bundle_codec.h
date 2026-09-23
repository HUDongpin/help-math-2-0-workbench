#ifndef HMG4V2_BUNDLE_CODEC_H
#define HMG4V2_BUNDLE_CODEC_H

#include "protocol_core.h"

#include <stddef.h>
#include <stdint.h>

#define HMG4V2_BUNDLE_HEADER_SIZE ((size_t)96)
#define HMG4V2_BUNDLE_MAX_TABLE_LENGTH UINT64_C(16777216)
#define HMG4V2_BUNDLE_MAX_DATA_LENGTH UINT64_C(68719476736)
#define HMG4V2_BUNDLE_MAX_BLOB_SIZE UINT64_C(4294967296)
#define HMG4V2_BUNDLE_ALIGNMENT UINT64_C(4096)

/*
 * These are workspace-development diagnostics only.  They are not values for
 * response tag 0x8001, whose production diagnostic-code registry is not
 * frozen by the current security contract.
 */
typedef enum {
  HMG4V2_BUNDLE_OK = 0,
  HMG4V2_BUNDLE_NULL_ARGUMENT,
  HMG4V2_BUNDLE_TRUNCATED_HEADER,
  HMG4V2_BUNDLE_HEADER_LENGTH_MISMATCH,
  HMG4V2_BUNDLE_BAD_MAGIC,
  HMG4V2_BUNDLE_BAD_VERSION,
  HMG4V2_BUNDLE_BAD_ENTRY_COUNT,
  HMG4V2_BUNDLE_TABLE_TOO_LARGE,
  HMG4V2_BUNDLE_DATA_TOO_LARGE,
  HMG4V2_BUNDLE_SIZE_OVERFLOW,
  HMG4V2_BUNDLE_FILE_LENGTH_MISMATCH,
  HMG4V2_BUNDLE_TABLE_HASH_MISMATCH,
  HMG4V2_BUNDLE_DATA_HASH_MISMATCH,
  HMG4V2_BUNDLE_NONZERO_PREDATA_PADDING,
  HMG4V2_BUNDLE_BAD_TABLE,
  HMG4V2_BUNDLE_BAD_ENTRY,
  HMG4V2_BUNDLE_BAD_PATH,
  HMG4V2_BUNDLE_DUPLICATE_PATH,
  HMG4V2_BUNDLE_CASE_COLLISION,
  HMG4V2_BUNDLE_BAD_RANGE,
  HMG4V2_BUNDLE_NONZERO_DATA_GAP,
  HMG4V2_BUNDLE_BLOB_HASH_MISMATCH,
  HMG4V2_BUNDLE_HASH_FAILURE
} hmg4v2_bundle_result;

typedef struct {
  uint64_t table_length;
  uint64_t data_region_length;
  uint8_t table_sha256[32];
  uint8_t data_region_sha256[32];
} hmg4v2_bundle_header;

/*
 * Every span points into the caller-owned bundle bytes.  The view never owns
 * storage and remains valid only while those bytes remain unchanged.
 */
typedef struct {
  uint32_t index;
  hmg4v2_span path;
  uint64_t offset;
  uint64_t size;
  uint8_t sha256[32];
  uint32_t installed_mode;
  uint32_t installed_owner_uid;
  uint32_t installed_group_gid;
  uint32_t installed_flags;
  uint8_t installed_acl_sha256[32];
  uint8_t installed_xattr_policy_sha256[32];
} hmg4v2_bundle_entry_view;

typedef struct {
  hmg4v2_bundle_header header;
  hmg4v2_span table;
  hmg4v2_span predata_padding;
  hmg4v2_span data_region;
  size_t data_start;
  hmg4v2_bundle_entry_view entries[HMG4V2_MANAGED_ENTRY_COUNT];
} hmg4v2_bundle_view;

hmg4v2_bundle_result hmg4v2_parse_bundle_header(
    hmg4v2_span header_bytes,
    hmg4v2_bundle_header *result);

/*
 * Performs syntax, exact-length, digest, range, padding/gap, and per-blob
 * validation over one immutable in-memory byte span.  It does not validate a
 * compiled policy, request-to-bundle equality, protected locations, or any
 * filesystem authority.
 */
hmg4v2_bundle_result hmg4v2_validate_bundle(
    hmg4v2_span bundle_bytes,
    hmg4v2_bundle_view *result);

const char *hmg4v2_bundle_result_name(hmg4v2_bundle_result result);

#endif
