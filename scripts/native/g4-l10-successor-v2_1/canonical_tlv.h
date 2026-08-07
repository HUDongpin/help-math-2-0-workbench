#ifndef HMG4V21_CANONICAL_TLV_H
#define HMG4V21_CANONICAL_TLV_H

#include "contract_core.h"

#include <stddef.h>
#include <stdint.h>

#define HMG4V21_TLV_HEADER_SIZE ((size_t)8)
#define HMG4V21_DEFAULT_BYTES_MAX ((uint32_t)4096)
#define HMG4V21_MAX_PATH_COMPONENTS ((uint32_t)64)
#define HMG4V21_MAX_PATH_COMPONENT_BYTES ((uint32_t)255)
#define HMG4V21_NO_INDEX UINT32_C(0xffffffff)

typedef enum {
  HMG4V21_TLV_U32 = 0x01,
  HMG4V21_TLV_U64 = 0x02,
  HMG4V21_TLV_BOOL = 0x03,
  HMG4V21_TLV_SHA256 = 0x04,
  HMG4V21_TLV_BYTES = 0x05,
  HMG4V21_TLV_POLICY_REL_PATH = 0x06,
  HMG4V21_TLV_STRUCT = 0x07,
  HMG4V21_TLV_LIST = 0x08,
  HMG4V21_TLV_APPROVED_ABS_ROOT_PATH = 0x09,
  HMG4V21_TLV_SAFE_CUSTODY_LEAF = 0x0a,
  HMG4V21_TLV_APPROVED_EVIDENCE_REL_PATH = 0x0b,
  HMG4V21_TLV_OBSERVED_CUSTODY_LEAF = 0x0c,
  HMG4V21_TLV_CAPABILITY_FIXTURE_ROOT_REL_PATH = 0x0d,
  HMG4V21_TLV_CAPABILITY_FIXTURE_REL_PATH = 0x0e,
  HMG4V21_TLV_CAPABILITY_FIXTURE_CLAIM_REL_PATH = 0x0f,
  HMG4V21_TLV_BUILD_REL_PATH = 0x10
} hmg4v21_tlv_type;

typedef enum {
  HMG4V21_TLV_OK = 0,
  HMG4V21_TLV_NULL_ARGUMENT,
  HMG4V21_TLV_TRUNCATED,
  HMG4V21_TLV_RESERVED_NONZERO,
  HMG4V21_TLV_TYPE_SITE_FORBIDDEN,
  HMG4V21_TLV_LENGTH_INVALID,
  HMG4V21_TLV_ORDER_INVALID,
  HMG4V21_TLV_BOOL_INVALID,
  HMG4V21_TLV_SHA256_ZERO_FORBIDDEN,
  HMG4V21_TLV_PATH_SYNTAX_INVALID,
  HMG4V21_TLV_PATH_CONTEXT_REQUIRED,
  HMG4V21_TLV_PATH_CONTEXT_REJECTED,
  HMG4V21_TLV_SCHEMA_INVALID,
  HMG4V21_TLV_UNKNOWN_FIELD,
  HMG4V21_TLV_REQUIRED_FIELD_MISSING,
  HMG4V21_TLV_FIELD_TYPE_MISMATCH,
  HMG4V21_TLV_NUMERIC_RANGE_INVALID,
  HMG4V21_TLV_LIST_FRAMING_INVALID,
  HMG4V21_TLV_LIST_COUNT_INVALID,
  HMG4V21_TLV_NESTED_SCHEMA_INVALID,
  HMG4V21_TLV_MAXIMUM_DEPTH_EXCEEDED
} hmg4v21_tlv_result;

typedef struct {
  uint16_t tag;
  uint8_t type;
  hmg4v21_span value;
} hmg4v21_tlv_view;

typedef struct {
  hmg4v21_span encoded;
  size_t offset;
  uint16_t previous_tag;
  int has_previous_tag;
} hmg4v21_tlv_cursor;

typedef enum {
  HMG4V21_CUSTODY_REQUEST = 1,
  HMG4V21_CUSTODY_JOURNAL = 2,
  HMG4V21_CUSTODY_RECEIPT = 3,
  HMG4V21_CUSTODY_STAGE = 4,
  HMG4V21_CUSTODY_ARCHIVE = 5,
  HMG4V21_CUSTODY_PREIMAGE = 6,
  HMG4V21_CUSTODY_ROLLBACK = 7
} hmg4v21_custody_variant;

typedef struct {
  hmg4v21_custody_variant variant;
  hmg4v21_span transaction_id_hex;
  uint32_t managed_index;
  hmg4v21_span digest_hex;
} hmg4v21_custody_leaf;

typedef enum {
  HMG4V21_EVIDENCE_PLAN = 1,
  HMG4V21_EVIDENCE_BUNDLE = 2,
  HMG4V21_EVIDENCE_CAP_TARGET = 3,
  HMG4V21_EVIDENCE_CAP_SYSTEM = 4,
  HMG4V21_EVIDENCE_QUIESCENCE = 5,
  HMG4V21_EVIDENCE_RECOVER = 6,
  HMG4V21_EVIDENCE_BUILD = 7,
  HMG4V21_EVIDENCE_INSTALL = 8,
  HMG4V21_EVIDENCE_XATTR = 9,
  HMG4V21_EVIDENCE_APPLY = 10,
  HMG4V21_EVIDENCE_INSTALL_AUTH = 11,
  HMG4V21_EVIDENCE_REVIEW = 12
} hmg4v21_evidence_role;

typedef enum {
  HMG4V21_FIXTURE_SCOPE_TARGET = 1,
  HMG4V21_FIXTURE_SCOPE_SYSTEM_LOCK = 2
} hmg4v21_fixture_scope;

typedef struct {
  hmg4v21_fixture_scope scope;
  hmg4v21_span nonce_hex;
} hmg4v21_fixture_root;

typedef enum {
  HMG4V21_FIXTURE_ATTEMPT_CAPABILITY = 1,
  HMG4V21_FIXTURE_ATTEMPT_DENIAL = 2
} hmg4v21_fixture_attempt_kind;

typedef struct {
  hmg4v21_fixture_attempt_kind kind;
  hmg4v21_fixture_scope scope;
  hmg4v21_span nonce_hex;
  uint32_t operation;
  uint32_t scenario;
  uint32_t attempt;
} hmg4v21_fixture_attempt;

struct hmg4v21_tlv_schema;

enum {
  HMG4V21_FIELD_OPTIONAL = UINT32_C(1) << 0,
  HMG4V21_FIELD_LENGTH_RANGE = UINT32_C(1) << 1,
  HMG4V21_FIELD_BYTES_BOUND_OVERRIDE = UINT32_C(1) << 2,
  HMG4V21_FIELD_NUMERIC_RANGE = UINT32_C(1) << 3,
  HMG4V21_FIELD_LIST_COUNT_RANGE = UINT32_C(1) << 4,
  HMG4V21_FIELD_ALLOW_ZERO_SHA256 = UINT32_C(1) << 5
};

typedef struct {
  uint16_t tag;
  uint8_t type;
  uint8_t reserved;
  uint32_t flags;
  uint32_t minimum_length;
  uint32_t maximum_length;
  uint64_t minimum_numeric_value;
  uint64_t maximum_numeric_value;
  uint32_t minimum_list_count;
  uint32_t maximum_list_count;
  const struct hmg4v21_tlv_schema *nested_schema;
} hmg4v21_tlv_field_rule;

typedef struct hmg4v21_tlv_schema {
  const hmg4v21_tlv_field_rule *fields;
  size_t field_count;
  uint32_t maximum_depth;
} hmg4v21_tlv_schema;

typedef hmg4v21_tlv_result (*hmg4v21_path_authorizer)(
    void *context,
    uint16_t tag,
    uint8_t type,
    hmg4v21_span value);

void hmg4v21_tlv_cursor_init(
    hmg4v21_tlv_cursor *cursor,
    hmg4v21_span encoded);
hmg4v21_tlv_result hmg4v21_tlv_next_raw(
    hmg4v21_tlv_cursor *cursor,
    hmg4v21_tlv_view *view,
    int *done);

hmg4v21_tlv_result hmg4v21_validate_tlv_schema(
    hmg4v21_span encoded,
    const hmg4v21_tlv_schema *schema,
    hmg4v21_path_authorizer path_authorizer,
    void *path_context);

int hmg4v21_policy_rel_path_is_lexically_safe(hmg4v21_span path);
int hmg4v21_approved_abs_root_is_lexically_safe(hmg4v21_span path);
int hmg4v21_observed_custody_leaf_is_lexically_safe(hmg4v21_span leaf);
int hmg4v21_build_rel_path_is_lexically_safe(hmg4v21_span path);

int hmg4v21_parse_custody_leaf(
    hmg4v21_span encoded,
    hmg4v21_custody_leaf *result);
int hmg4v21_validate_evidence_path(
    hmg4v21_span encoded,
    hmg4v21_evidence_role role,
    const uint8_t complete_object_sha256[32]);
int hmg4v21_parse_fixture_root(
    hmg4v21_span encoded,
    hmg4v21_fixture_root *result);
int hmg4v21_validate_fixture_root(
    hmg4v21_span encoded,
    hmg4v21_fixture_scope scope,
    const uint8_t nonce[32]);
int hmg4v21_parse_fixture_attempt(
    hmg4v21_span encoded,
    hmg4v21_fixture_attempt *result);
int hmg4v21_validate_fixture_claim(
    hmg4v21_span encoded,
    const uint8_t nonce[32]);

const char *hmg4v21_tlv_result_name(hmg4v21_tlv_result result);

#endif
