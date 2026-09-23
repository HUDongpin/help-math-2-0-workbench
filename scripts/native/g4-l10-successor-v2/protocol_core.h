#ifndef HMG4V2_PROTOCOL_CORE_H
#define HMG4V2_PROTOCOL_CORE_H

#include <stddef.h>
#include <stdint.h>

#define HMG4V2_HEADER_SIZE ((size_t)56)
#define HMG4V2_MAX_PAYLOAD ((uint64_t)16777216)
#define HMG4V2_MANAGED_ENTRY_COUNT ((uint32_t)114)
#define HMG4V2_PROTOCOL_SPEC_SHA256_HEX                                      \
  "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583"

extern const uint8_t hmg4v2_protocol_spec_sha256[32];

/*
 * This is a workspace-only, non-authoritative parser API.  Its result codes
 * are local development diagnostics; they are deliberately not the unfrozen
 * production response diagnostic_code registry.
 */
typedef enum {
  HMG4V2_CORE_OK = 0,
  HMG4V2_CORE_NULL_ARGUMENT,
  HMG4V2_CORE_TRUNCATED_HEADER,
  HMG4V2_CORE_BAD_MAGIC,
  HMG4V2_CORE_BAD_VERSION,
  HMG4V2_CORE_BAD_OPERATION,
  HMG4V2_CORE_PAYLOAD_TOO_LARGE,
  HMG4V2_CORE_SIZE_OVERFLOW,
  HMG4V2_CORE_FRAME_LENGTH_MISMATCH,
  HMG4V2_CORE_PAYLOAD_HASH_MISMATCH,
  HMG4V2_CORE_TRUNCATED_TLV,
  HMG4V2_CORE_BAD_RESERVED_BYTE,
  HMG4V2_CORE_BAD_TLV_TYPE,
  HMG4V2_CORE_BAD_TLV_LENGTH,
  HMG4V2_CORE_BAD_TLV_ORDER,
  HMG4V2_CORE_BAD_SCALAR_VALUE,
  HMG4V2_CORE_BAD_PATH,
  HMG4V2_CORE_TOO_MANY_TOP_LEVEL_FIELDS,
  HMG4V2_CORE_WRONG_TAG_SET,
  HMG4V2_CORE_WRONG_FIELD_TYPE,
  HMG4V2_CORE_BAD_ROOT_IDENTITY,
  HMG4V2_CORE_BAD_LIST,
  HMG4V2_CORE_BAD_ENTRY,
  HMG4V2_CORE_DUPLICATE_PATH,
  HMG4V2_CORE_CASE_COLLISION,
  HMG4V2_CORE_BAD_ROLE_ORDER,
  HMG4V2_CORE_BAD_RANGE_ORDER,
  HMG4V2_CORE_UNFROZEN_AUTHORITY
} hmg4v2_core_result;

typedef struct {
  const uint8_t *bytes;
  size_t length;
} hmg4v2_span;

typedef struct {
  uint32_t operation;
  uint64_t payload_length;
  uint8_t payload_sha256[32];
} hmg4v2_request_header;

typedef struct {
  uint16_t tag;
  uint8_t type;
  hmg4v2_span value;
} hmg4v2_tlv_view;

typedef struct {
  hmg4v2_span bytes;
  size_t offset;
  uint16_t last_tag;
  int has_last_tag;
} hmg4v2_tlv_cursor;

typedef struct {
  hmg4v2_request_header header;
  hmg4v2_span payload;
} hmg4v2_request_frame;

int hmg4v2_checked_add_size(size_t left, size_t right, size_t *result);
int hmg4v2_checked_mul_size(size_t left, size_t right, size_t *result);
int hmg4v2_range_within(size_t offset, size_t length, size_t total);

uint16_t hmg4v2_read_u16_be(const uint8_t bytes[2]);
uint32_t hmg4v2_read_u32_be(const uint8_t bytes[4]);
uint64_t hmg4v2_read_u64_be(const uint8_t bytes[8]);
void hmg4v2_write_u16_be(uint8_t bytes[2], uint16_t value);
void hmg4v2_write_u32_be(uint8_t bytes[4], uint32_t value);
void hmg4v2_write_u64_be(uint8_t bytes[8], uint64_t value);
hmg4v2_core_result hmg4v2_sha256(
    hmg4v2_span input,
    uint8_t digest[32]);

hmg4v2_core_result hmg4v2_parse_request_header(
    hmg4v2_span header_bytes,
    hmg4v2_request_header *result);
hmg4v2_core_result hmg4v2_validate_buffered_request_frame(
    hmg4v2_span frame_bytes,
    hmg4v2_request_frame *result);

void hmg4v2_tlv_cursor_init(hmg4v2_tlv_cursor *cursor, hmg4v2_span bytes);
hmg4v2_core_result hmg4v2_tlv_next(
    hmg4v2_tlv_cursor *cursor,
    hmg4v2_tlv_view *view,
    int *done);

int hmg4v2_policy_rel_path_is_lexically_safe(hmg4v2_span path);
int hmg4v2_approved_abs_root_is_lexically_safe(hmg4v2_span path);
int hmg4v2_leaf_is_common_lexically_safe(hmg4v2_span leaf);

hmg4v2_core_result hmg4v2_validate_root_identity_syntax(
    hmg4v2_span encoded_struct);
hmg4v2_core_result hmg4v2_validate_entry_list_syntax(
    hmg4v2_span encoded_list,
    uint32_t *predecessor_present_count);
hmg4v2_core_result hmg4v2_validate_request_payload_syntax(
    uint32_t operation,
    hmg4v2_span payload);
hmg4v2_core_result hmg4v2_authority_validation_status(void);

const char *hmg4v2_core_result_name(hmg4v2_core_result result);

#endif
