#include "canonical_tlv.h"

#include <limits.h>
#include <string.h>

typedef struct {
  const char *prefix;
  size_t prefix_length;
  const char *suffix;
  size_t suffix_length;
} evidence_path_rule;

static int span_pointer_is_valid(hmg4v23_span span) {
  return span.length == 0 || span.bytes != NULL;
}

static int checked_add(size_t left, size_t right, size_t *result) {
  return result != NULL && left <= SIZE_MAX - right &&
         ((*result = left + right), 1);
}

static uint16_t read_u16_be(const uint8_t bytes[2]) {
  return (uint16_t)(((uint16_t)bytes[0] << 8) | (uint16_t)bytes[1]);
}

static int bytes_at_equal(const uint8_t *bytes, size_t length, size_t offset,
                          const char *literal, size_t literal_length) {
  size_t end = 0;
  return bytes != NULL && checked_add(offset, literal_length, &end) &&
         end <= length &&
         (literal_length == 0 || memcmp(bytes + offset, literal, literal_length) == 0);
}

static int is_lower_hex(uint8_t value) {
  return (value >= (uint8_t)'0' && value <= (uint8_t)'9') ||
         (value >= (uint8_t)'a' && value <= (uint8_t)'f');
}

static int is_lower_hex_span(const uint8_t *bytes, size_t length) {
  size_t index;
  if (bytes == NULL) return 0;
  for (index = 0; index < length; ++index) {
    if (!is_lower_hex(bytes[index])) return 0;
  }
  return 1;
}

static uint8_t lower_hex_digit(uint8_t value) {
  return value < 10 ? (uint8_t)((uint8_t)'0' + value)
                    : (uint8_t)((uint8_t)'a' + (uint8_t)(value - 10));
}

static int lower_hex_equals_digest(const uint8_t *hex, const uint8_t digest[32]) {
  size_t index;
  if (hex == NULL || digest == NULL) return 0;
  for (index = 0; index < 32; ++index) {
    if (hex[index * 2] != lower_hex_digit((uint8_t)(digest[index] >> 4)) ||
        hex[index * 2 + 1] != lower_hex_digit((uint8_t)(digest[index] & 0x0f))) {
      return 0;
    }
  }
  return 1;
}

static int component_is_dot_or_dot_dot(const uint8_t *bytes, size_t length) {
  return (length == 1 && bytes[0] == (uint8_t)'.') ||
         (length == 2 && bytes[0] == (uint8_t)'.' &&
          bytes[1] == (uint8_t)'.');
}

static int authority_component_is_safe(const uint8_t *bytes, size_t length) {
  size_t index;
  if (bytes == NULL || length == 0 ||
      length > HMG4V23_MAX_PATH_COMPONENT_BYTES ||
      component_is_dot_or_dot_dot(bytes, length)) {
    return 0;
  }
  for (index = 0; index < length; ++index) {
    const uint8_t value = bytes[index];
    if (value == 0 || value >= 0x80 || value == (uint8_t)'/' ||
        value == (uint8_t)'\\') {
      return 0;
    }
  }
  return 1;
}

static int safe_relative_path(hmg4v23_span path, size_t maximum_length) {
  size_t component_start = 0;
  size_t index;
  uint32_t component_count = 0;
  if (!span_pointer_is_valid(path) || path.length == 0 ||
      path.length > maximum_length || path.bytes[0] == (uint8_t)'/' ||
      path.bytes[path.length - 1] == (uint8_t)'/') {
    return 0;
  }
  for (index = 0; index <= path.length; ++index) {
    if (index == path.length || path.bytes[index] == (uint8_t)'/') {
      if (component_count == HMG4V23_MAX_PATH_COMPONENTS ||
          !authority_component_is_safe(path.bytes + component_start,
                                       index - component_start)) {
        return 0;
      }
      ++component_count;
      component_start = index + 1;
    }
  }
  return component_count != 0;
}

int hmg4v23_policy_rel_path_is_lexically_safe(hmg4v23_span path) {
  return safe_relative_path(path, 1024);
}

int hmg4v23_build_rel_path_is_lexically_safe(hmg4v23_span path) {
  return safe_relative_path(path, 1024);
}

int hmg4v23_approved_abs_root_is_lexically_safe(hmg4v23_span path) {
  hmg4v23_span relative;
  if (!span_pointer_is_valid(path) || path.length < 2 || path.length > 1024 ||
      path.bytes[0] != (uint8_t)'/') {
    return 0;
  }
  relative.bytes = path.bytes + 1;
  relative.length = path.length - 1;
  return safe_relative_path(relative, 1023);
}

int hmg4v23_observed_custody_leaf_is_lexically_safe(hmg4v23_span leaf) {
  size_t index;
  if (!span_pointer_is_valid(leaf) || leaf.length == 0 || leaf.length > 255 ||
      component_is_dot_or_dot_dot(leaf.bytes, leaf.length)) {
    return 0;
  }
  for (index = 0; index < leaf.length; ++index) {
    if (leaf.bytes[index] == 0 || leaf.bytes[index] == (uint8_t)'/') return 0;
  }
  return 1;
}

static int parse_three_digit_index(const uint8_t bytes[3], uint32_t *result) {
  uint32_t value;
  if (bytes == NULL || result == NULL ||
      bytes[0] < (uint8_t)'0' || bytes[0] > (uint8_t)'9' ||
      bytes[1] < (uint8_t)'0' || bytes[1] > (uint8_t)'9' ||
      bytes[2] < (uint8_t)'0' || bytes[2] > (uint8_t)'9') {
    return 0;
  }
  value = ((uint32_t)(bytes[0] - (uint8_t)'0') * UINT32_C(100)) +
          ((uint32_t)(bytes[1] - (uint8_t)'0') * UINT32_C(10)) +
          (uint32_t)(bytes[2] - (uint8_t)'0');
  if (value > 113) return 0;
  *result = value;
  return 1;
}

static int parse_custody_nonindexed(hmg4v23_span encoded,
                                    const char *middle, size_t middle_length,
                                    const char *suffix, size_t suffix_length,
                                    hmg4v23_custody_variant variant,
                                    hmg4v23_custody_leaf *result) {
  const size_t expected = 3 + 64 + middle_length + 64 + suffix_length;
  const size_t middle_offset = 3 + 64;
  const size_t digest_offset = middle_offset + middle_length;
  if (encoded.length != expected ||
      !bytes_at_equal(encoded.bytes, encoded.length, 0, "tx-", 3) ||
      !is_lower_hex_span(encoded.bytes + 3, 64) ||
      !bytes_at_equal(encoded.bytes, encoded.length, middle_offset, middle,
                      middle_length) ||
      !is_lower_hex_span(encoded.bytes + digest_offset, 64) ||
      !bytes_at_equal(encoded.bytes, encoded.length, digest_offset + 64,
                      suffix, suffix_length)) {
    return 0;
  }
  result->variant = variant;
  result->transaction_id_hex = (hmg4v23_span){encoded.bytes + 3, 64};
  result->managed_index = HMG4V23_NO_INDEX;
  result->digest_hex = (hmg4v23_span){encoded.bytes + digest_offset, 64};
  return 1;
}

static int parse_custody_indexed(hmg4v23_span encoded,
                                 const char *middle, size_t middle_length,
                                 hmg4v23_custody_variant variant,
                                 hmg4v23_custody_leaf *result) {
  const size_t expected = 3 + 64 + middle_length + 3 + 1 + 64;
  const size_t middle_offset = 3 + 64;
  const size_t index_offset = middle_offset + middle_length;
  const size_t digest_offset = index_offset + 4;
  uint32_t managed_index;
  if (encoded.length != expected ||
      !bytes_at_equal(encoded.bytes, encoded.length, 0, "tx-", 3) ||
      !is_lower_hex_span(encoded.bytes + 3, 64) ||
      !bytes_at_equal(encoded.bytes, encoded.length, middle_offset, middle,
                      middle_length) ||
      !parse_three_digit_index(encoded.bytes + index_offset, &managed_index) ||
      encoded.bytes[index_offset + 3] != (uint8_t)'-' ||
      !is_lower_hex_span(encoded.bytes + digest_offset, 64)) {
    return 0;
  }
  result->variant = variant;
  result->transaction_id_hex = (hmg4v23_span){encoded.bytes + 3, 64};
  result->managed_index = managed_index;
  result->digest_hex = (hmg4v23_span){encoded.bytes + digest_offset, 64};
  return 1;
}

int hmg4v23_parse_custody_leaf(hmg4v23_span encoded,
                               hmg4v23_custody_leaf *result) {
  if (result == NULL || !span_pointer_is_valid(encoded) || encoded.length > 255) {
    return 0;
  }
  if (parse_custody_nonindexed(encoded, "-request-", 9, ".bin", 4,
                               HMG4V23_CUSTODY_REQUEST, result) ||
      parse_custody_nonindexed(encoded, "-journal-", 9, ".log", 4,
                               HMG4V23_CUSTODY_JOURNAL, result) ||
      parse_custody_nonindexed(encoded, "-receipt-", 9, ".receipt", 8,
                               HMG4V23_CUSTODY_RECEIPT, result) ||
      parse_custody_indexed(encoded, "-stage-", 7,
                            HMG4V23_CUSTODY_STAGE, result) ||
      parse_custody_indexed(encoded, "-archive-", 9,
                            HMG4V23_CUSTODY_ARCHIVE, result) ||
      parse_custody_indexed(encoded, "-preimage-", 10,
                            HMG4V23_CUSTODY_PREIMAGE, result) ||
      parse_custody_indexed(encoded, "-rollback-", 10,
                            HMG4V23_CUSTODY_ROLLBACK, result)) {
    return 1;
  }
  return 0;
}

int hmg4v23_validate_evidence_path(
    hmg4v23_span encoded,
    hmg4v23_evidence_role role,
    const uint8_t complete_object_sha256[32]) {
#define EVIDENCE_RULE(prefix_literal, suffix_literal)                         \
  {(prefix_literal), sizeof(prefix_literal) - 1, (suffix_literal),             \
   sizeof(suffix_literal) - 1}
  static const evidence_path_rule rules[] = {
      EVIDENCE_RULE("plans/g4-l10-", ".plan"),
      EVIDENCE_RULE("bundles/g4-l10-", ".bundle"),
      EVIDENCE_RULE("receipts/cap-target-", ".receipt"),
      EVIDENCE_RULE("receipts/cap-system-", ".receipt"),
      EVIDENCE_RULE("receipts/quiescence-", ".receipt"),
      EVIDENCE_RULE("authorizations/recover-", ".auth"),
      EVIDENCE_RULE("receipts/build-", ".receipt"),
      EVIDENCE_RULE("receipts/install-", ".receipt"),
      EVIDENCE_RULE("xattr/g4-l10-", ".xattr"),
      EVIDENCE_RULE("authorizations/apply-", ".auth"),
      EVIDENCE_RULE("authorizations/install-", ".auth"),
      EVIDENCE_RULE("receipts/review-", ".manifest")};
#undef EVIDENCE_RULE
  const evidence_path_rule *rule;
  size_t expected;
  if (!span_pointer_is_valid(encoded) || complete_object_sha256 == NULL ||
      role < HMG4V23_EVIDENCE_PLAN || role > HMG4V23_EVIDENCE_REVIEW) {
    return 0;
  }
  rule = &rules[(size_t)role - 1];
  if (!checked_add(rule->prefix_length, 64, &expected) ||
      !checked_add(expected, rule->suffix_length, &expected) ||
      encoded.length != expected ||
      !bytes_at_equal(encoded.bytes, encoded.length, 0, rule->prefix,
                      rule->prefix_length) ||
      !lower_hex_equals_digest(encoded.bytes + rule->prefix_length,
                               complete_object_sha256) ||
      !bytes_at_equal(encoded.bytes, encoded.length, rule->prefix_length + 64,
                      rule->suffix, rule->suffix_length)) {
    return 0;
  }
  return 1;
}

int hmg4v23_parse_fixture_root(hmg4v23_span encoded,
                               hmg4v23_fixture_root *result) {
  static const char target_prefix[] = "capability-fixtures/target-";
  static const char system_prefix[] = "capability-fixtures/system-lock-";
  size_t prefix_length;
  hmg4v23_fixture_scope scope;
  if (result == NULL || !span_pointer_is_valid(encoded)) return 0;
  if (encoded.length == sizeof(target_prefix) - 1 + 64 &&
      bytes_at_equal(encoded.bytes, encoded.length, 0, target_prefix,
                     sizeof(target_prefix) - 1)) {
    scope = HMG4V23_FIXTURE_SCOPE_TARGET;
    prefix_length = sizeof(target_prefix) - 1;
  } else if (encoded.length == sizeof(system_prefix) - 1 + 64 &&
             bytes_at_equal(encoded.bytes, encoded.length, 0, system_prefix,
                            sizeof(system_prefix) - 1)) {
    scope = HMG4V23_FIXTURE_SCOPE_SYSTEM_LOCK;
    prefix_length = sizeof(system_prefix) - 1;
  } else {
    return 0;
  }
  if (!is_lower_hex_span(encoded.bytes + prefix_length, 64)) return 0;
  result->scope = scope;
  result->nonce_hex = (hmg4v23_span){encoded.bytes + prefix_length, 64};
  return 1;
}

int hmg4v23_validate_fixture_root(hmg4v23_span encoded,
                                  hmg4v23_fixture_scope scope,
                                  const uint8_t nonce[32]) {
  hmg4v23_fixture_root parsed;
  return nonce != NULL && hmg4v23_parse_fixture_root(encoded, &parsed) &&
         parsed.scope == scope && lower_hex_equals_digest(parsed.nonce_hex.bytes, nonce);
}

static int parse_fixed_decimal(const uint8_t *bytes, size_t length,
                               uint32_t *value) {
  size_t index;
  uint32_t parsed = 0;
  if (bytes == NULL || value == NULL || length == 0) return 0;
  for (index = 0; index < length; ++index) {
    if (bytes[index] < (uint8_t)'0' || bytes[index] > (uint8_t)'9') return 0;
    parsed = parsed * UINT32_C(10) +
             (uint32_t)(bytes[index] - (uint8_t)'0');
  }
  *value = parsed;
  return 1;
}

int hmg4v23_parse_fixture_attempt(hmg4v23_span encoded,
                                  hmg4v23_fixture_attempt *result) {
  hmg4v23_fixture_root root;
  size_t root_length;
  size_t offset;
  uint32_t operation;
  uint32_t scenario;
  uint32_t attempt;
  if (result == NULL || !span_pointer_is_valid(encoded)) return 0;
  root_length = sizeof("capability-fixtures/target-") - 1 + 64;
  if (encoded.length >= root_length &&
      hmg4v23_parse_fixture_root((hmg4v23_span){encoded.bytes, root_length},
                                 &root)) {
    offset = root_length;
  } else {
    root_length = sizeof("capability-fixtures/system-lock-") - 1 + 64;
    if (encoded.length < root_length ||
        !hmg4v23_parse_fixture_root(
            (hmg4v23_span){encoded.bytes, root_length}, &root)) {
      return 0;
    }
    offset = root_length;
  }
  if (bytes_at_equal(encoded.bytes, encoded.length, offset, "/op-", 4) &&
      bytes_at_equal(encoded.bytes, encoded.length, offset + 7, "/attempt-", 9) &&
      encoded.length == offset + 17 &&
      parse_fixed_decimal(encoded.bytes + offset + 4, 3, &operation) &&
      parse_fixed_decimal(encoded.bytes + offset + 16, 1, &attempt) &&
      attempt <= 2 &&
      ((root.scope == HMG4V23_FIXTURE_SCOPE_TARGET && operation >= 1 &&
        operation <= 18) ||
       (root.scope == HMG4V23_FIXTURE_SCOPE_SYSTEM_LOCK && operation >= 101 &&
        operation <= 105))) {
    result->kind = HMG4V23_FIXTURE_ATTEMPT_CAPABILITY;
    result->scope = root.scope;
    result->nonce_hex = root.nonce_hex;
    result->operation = operation;
    result->scenario = 0;
    result->attempt = attempt;
    return 1;
  }
  if (root.scope == HMG4V23_FIXTURE_SCOPE_TARGET &&
      bytes_at_equal(encoded.bytes, encoded.length, offset, "/deny-", 6) &&
      bytes_at_equal(encoded.bytes, encoded.length, offset + 8, "-scenario-", 10) &&
      bytes_at_equal(encoded.bytes, encoded.length, offset + 19, "/attempt-", 9) &&
      encoded.length == offset + 29 &&
      parse_fixed_decimal(encoded.bytes + offset + 6, 2, &operation) &&
      parse_fixed_decimal(encoded.bytes + offset + 18, 1, &scenario) &&
      parse_fixed_decimal(encoded.bytes + offset + 28, 1, &attempt) &&
      operation >= 1 && operation <= 11 && scenario <= 2 && attempt <= 5) {
    result->kind = HMG4V23_FIXTURE_ATTEMPT_DENIAL;
    result->scope = root.scope;
    result->nonce_hex = root.nonce_hex;
    result->operation = operation;
    result->scenario = scenario;
    result->attempt = attempt;
    return 1;
  }
  return 0;
}

int hmg4v23_validate_fixture_claim(hmg4v23_span encoded,
                                   const uint8_t nonce[32]) {
  static const char prefix[] = "fixture-reservation-";
  static const char suffix[] = ".claim";
  const size_t prefix_length = sizeof(prefix) - 1;
  if (!span_pointer_is_valid(encoded) || nonce == NULL ||
      encoded.length != prefix_length + 64 + sizeof(suffix) - 1 ||
      !bytes_at_equal(encoded.bytes, encoded.length, 0, prefix, prefix_length) ||
      !lower_hex_equals_digest(encoded.bytes + prefix_length, nonce) ||
      !bytes_at_equal(encoded.bytes, encoded.length, prefix_length + 64,
                      suffix, sizeof(suffix) - 1)) {
    return 0;
  }
  return 1;
}

static int is_zero_sha256(hmg4v23_span value) {
  size_t index;
  if (value.length != 32) return 0;
  for (index = 0; index < value.length; ++index) {
    if (value.bytes[index] != 0) return 0;
  }
  return 1;
}

static hmg4v23_tlv_result validate_basic_value(uint8_t type,
                                               hmg4v23_span value) {
  hmg4v23_custody_leaf custody;
  hmg4v23_fixture_root fixture_root;
  hmg4v23_fixture_attempt fixture_attempt;
  switch (type) {
    case HMG4V23_TLV_U32:
      return value.length == 4 ? HMG4V23_TLV_OK
                               : HMG4V23_TLV_LENGTH_INVALID;
    case HMG4V23_TLV_U64:
      return value.length == 8 ? HMG4V23_TLV_OK
                               : HMG4V23_TLV_LENGTH_INVALID;
    case HMG4V23_TLV_BOOL:
      if (value.length != 1) return HMG4V23_TLV_LENGTH_INVALID;
      return value.bytes[0] <= 1 ? HMG4V23_TLV_OK
                                 : HMG4V23_TLV_BOOL_INVALID;
    case HMG4V23_TLV_SHA256:
      return value.length == 32 ? HMG4V23_TLV_OK
                                : HMG4V23_TLV_LENGTH_INVALID;
    case HMG4V23_TLV_BYTES:
    case HMG4V23_TLV_STRUCT:
      return HMG4V23_TLV_OK;
    case HMG4V23_TLV_POLICY_REL_PATH:
    case HMG4V23_TLV_APPROVED_EVIDENCE_REL_PATH:
      return hmg4v23_policy_rel_path_is_lexically_safe(value)
                 ? HMG4V23_TLV_OK
                 : HMG4V23_TLV_PATH_SYNTAX_INVALID;
    case HMG4V23_TLV_LIST:
      return value.length >= 4 ? HMG4V23_TLV_OK
                               : HMG4V23_TLV_LENGTH_INVALID;
    case HMG4V23_TLV_APPROVED_ABS_ROOT_PATH:
      return hmg4v23_approved_abs_root_is_lexically_safe(value)
                 ? HMG4V23_TLV_OK
                 : HMG4V23_TLV_PATH_SYNTAX_INVALID;
    case HMG4V23_TLV_SAFE_CUSTODY_LEAF:
      return hmg4v23_parse_custody_leaf(value, &custody)
                 ? HMG4V23_TLV_OK
                 : HMG4V23_TLV_PATH_SYNTAX_INVALID;
    case HMG4V23_TLV_OBSERVED_CUSTODY_LEAF:
      return hmg4v23_observed_custody_leaf_is_lexically_safe(value)
                 ? HMG4V23_TLV_OK
                 : HMG4V23_TLV_PATH_SYNTAX_INVALID;
    case HMG4V23_TLV_CAPABILITY_FIXTURE_ROOT_REL_PATH:
      return hmg4v23_parse_fixture_root(value, &fixture_root)
                 ? HMG4V23_TLV_OK
                 : HMG4V23_TLV_PATH_SYNTAX_INVALID;
    case HMG4V23_TLV_CAPABILITY_FIXTURE_REL_PATH:
      return hmg4v23_parse_fixture_attempt(value, &fixture_attempt)
                 ? HMG4V23_TLV_OK
                 : HMG4V23_TLV_PATH_SYNTAX_INVALID;
    case HMG4V23_TLV_CAPABILITY_FIXTURE_CLAIM_REL_PATH:
      if (value.length != sizeof("fixture-reservation-") - 1 + 64 +
                              sizeof(".claim") - 1 ||
          !bytes_at_equal(value.bytes, value.length, 0, "fixture-reservation-",
                          sizeof("fixture-reservation-") - 1) ||
          !is_lower_hex_span(value.bytes + sizeof("fixture-reservation-") - 1,
                             64) ||
          !bytes_at_equal(value.bytes, value.length,
                          sizeof("fixture-reservation-") - 1 + 64,
                          ".claim", sizeof(".claim") - 1)) {
        return HMG4V23_TLV_PATH_SYNTAX_INVALID;
      }
      return HMG4V23_TLV_OK;
    case HMG4V23_TLV_BUILD_REL_PATH:
      return hmg4v23_build_rel_path_is_lexically_safe(value)
                 ? HMG4V23_TLV_OK
                 : HMG4V23_TLV_PATH_SYNTAX_INVALID;
    default:
      return HMG4V23_TLV_TYPE_SITE_FORBIDDEN;
  }
}

void hmg4v23_tlv_cursor_init(hmg4v23_tlv_cursor *cursor,
                             hmg4v23_span encoded) {
  if (cursor == NULL) return;
  cursor->encoded = encoded;
  cursor->offset = 0;
  cursor->previous_tag = 0;
  cursor->has_previous_tag = 0;
}

hmg4v23_tlv_result hmg4v23_tlv_next_raw(hmg4v23_tlv_cursor *cursor,
                                        hmg4v23_tlv_view *view,
                                        int *done) {
  size_t value_offset;
  size_t next_offset;
  uint16_t tag;
  uint8_t type;
  uint32_t length;
  hmg4v23_tlv_result validated;
  if (cursor == NULL || view == NULL || done == NULL ||
      !span_pointer_is_valid(cursor->encoded)) {
    return HMG4V23_TLV_NULL_ARGUMENT;
  }
  if (cursor->offset == cursor->encoded.length) {
    *done = 1;
    return HMG4V23_TLV_OK;
  }
  *done = 0;
  if (cursor->offset > cursor->encoded.length ||
      cursor->encoded.length - cursor->offset < HMG4V23_TLV_HEADER_SIZE) {
    return HMG4V23_TLV_TRUNCATED;
  }
  tag = read_u16_be(cursor->encoded.bytes + cursor->offset);
  type = cursor->encoded.bytes[cursor->offset + 2];
  if (cursor->encoded.bytes[cursor->offset + 3] != 0) {
    return HMG4V23_TLV_RESERVED_NONZERO;
  }
  if (!hmg4v23_tlv_type_site_is_legal(type, tag)) {
    return HMG4V23_TLV_TYPE_SITE_FORBIDDEN;
  }
  if (cursor->has_previous_tag && tag <= cursor->previous_tag) {
    return HMG4V23_TLV_ORDER_INVALID;
  }
  length = hmg4v23_read_u32_be(cursor->encoded.bytes + cursor->offset + 4);
  if (!checked_add(cursor->offset, HMG4V23_TLV_HEADER_SIZE, &value_offset) ||
      !checked_add(value_offset, (size_t)length, &next_offset)) {
    return HMG4V23_TLV_LENGTH_INVALID;
  }
  if (next_offset > cursor->encoded.length) return HMG4V23_TLV_TRUNCATED;
  view->tag = tag;
  view->type = type;
  view->value = (hmg4v23_span){cursor->encoded.bytes + value_offset,
                              (size_t)length};
  validated = validate_basic_value(type, view->value);
  if (validated != HMG4V23_TLV_OK) return validated;
  cursor->offset = next_offset;
  cursor->previous_tag = tag;
  cursor->has_previous_tag = 1;
  return HMG4V23_TLV_OK;
}

static int is_authority_path_type(uint8_t type) {
  return type == HMG4V23_TLV_POLICY_REL_PATH ||
         type == HMG4V23_TLV_APPROVED_ABS_ROOT_PATH ||
         type == HMG4V23_TLV_SAFE_CUSTODY_LEAF ||
         type == HMG4V23_TLV_APPROVED_EVIDENCE_REL_PATH ||
         type == HMG4V23_TLV_CAPABILITY_FIXTURE_ROOT_REL_PATH ||
         type == HMG4V23_TLV_CAPABILITY_FIXTURE_REL_PATH ||
         type == HMG4V23_TLV_CAPABILITY_FIXTURE_CLAIM_REL_PATH ||
         type == HMG4V23_TLV_BUILD_REL_PATH;
}

static hmg4v23_tlv_result validate_rule_definition(
    const hmg4v23_tlv_field_rule *rule) {
  const uint32_t known_flags =
      HMG4V23_FIELD_OPTIONAL | HMG4V23_FIELD_LENGTH_RANGE |
      HMG4V23_FIELD_BYTES_BOUND_OVERRIDE | HMG4V23_FIELD_NUMERIC_RANGE |
      HMG4V23_FIELD_LIST_COUNT_RANGE | HMG4V23_FIELD_ALLOW_ZERO_SHA256;
  if (rule == NULL || rule->reserved != 0 ||
      (rule->flags & ~known_flags) != 0 ||
      !hmg4v23_tlv_type_site_is_legal(rule->type, rule->tag)) {
    return HMG4V23_TLV_SCHEMA_INVALID;
  }
  if ((rule->flags & HMG4V23_FIELD_LENGTH_RANGE) != 0 &&
      rule->minimum_length > rule->maximum_length) {
    return HMG4V23_TLV_SCHEMA_INVALID;
  }
  if ((rule->flags & HMG4V23_FIELD_BYTES_BOUND_OVERRIDE) != 0 &&
      (rule->type != HMG4V23_TLV_BYTES ||
       (rule->flags & HMG4V23_FIELD_LENGTH_RANGE) == 0)) {
    return HMG4V23_TLV_SCHEMA_INVALID;
  }
  if ((rule->flags & HMG4V23_FIELD_NUMERIC_RANGE) != 0 &&
      (rule->minimum_numeric_value > rule->maximum_numeric_value ||
       (rule->type != HMG4V23_TLV_U32 && rule->type != HMG4V23_TLV_U64))) {
    return HMG4V23_TLV_SCHEMA_INVALID;
  }
  if (rule->type == HMG4V23_TLV_STRUCT) {
    if (rule->nested_schema == NULL ||
        (rule->flags & HMG4V23_FIELD_LIST_COUNT_RANGE) != 0) {
      return HMG4V23_TLV_SCHEMA_INVALID;
    }
  } else if (rule->type == HMG4V23_TLV_LIST) {
    if (rule->nested_schema == NULL ||
        (rule->flags & HMG4V23_FIELD_LIST_COUNT_RANGE) == 0 ||
        rule->minimum_list_count > rule->maximum_list_count) {
      return HMG4V23_TLV_SCHEMA_INVALID;
    }
  } else if (rule->nested_schema != NULL ||
             (rule->flags & HMG4V23_FIELD_LIST_COUNT_RANGE) != 0) {
    return HMG4V23_TLV_SCHEMA_INVALID;
  }
  if ((rule->flags & HMG4V23_FIELD_ALLOW_ZERO_SHA256) != 0 &&
      rule->type != HMG4V23_TLV_SHA256) {
    return HMG4V23_TLV_SCHEMA_INVALID;
  }
  return HMG4V23_TLV_OK;
}

static hmg4v23_tlv_result validate_schema_at_depth(
    hmg4v23_span encoded,
    const hmg4v23_tlv_schema *schema,
    hmg4v23_path_authorizer path_authorizer,
    void *path_context,
    uint32_t depth,
    uint32_t maximum_depth);

static hmg4v23_tlv_result validate_list(
    hmg4v23_span encoded,
    const hmg4v23_tlv_field_rule *rule,
    hmg4v23_path_authorizer path_authorizer,
    void *path_context,
    uint32_t depth,
    uint32_t maximum_depth) {
  uint32_t count;
  uint32_t ordinal;
  size_t offset = 4;
  if (encoded.length < 4) return HMG4V23_TLV_LIST_FRAMING_INVALID;
  count = hmg4v23_read_u32_be(encoded.bytes);
  if (count < rule->minimum_list_count || count > rule->maximum_list_count) {
    return HMG4V23_TLV_LIST_COUNT_INVALID;
  }
  for (ordinal = 0; ordinal < count; ++ordinal) {
    uint32_t member_length;
    size_t member_offset;
    size_t next_offset;
    hmg4v23_tlv_result nested;
    if (offset > encoded.length || encoded.length - offset < 4) {
      return HMG4V23_TLV_LIST_FRAMING_INVALID;
    }
    member_length = hmg4v23_read_u32_be(encoded.bytes + offset);
    if (!checked_add(offset, 4, &member_offset) ||
        !checked_add(member_offset, (size_t)member_length, &next_offset) ||
        next_offset > encoded.length) {
      return HMG4V23_TLV_LIST_FRAMING_INVALID;
    }
    nested = validate_schema_at_depth(
        (hmg4v23_span){encoded.bytes + member_offset, (size_t)member_length},
        rule->nested_schema, path_authorizer, path_context, depth + 1,
        maximum_depth);
    if (nested != HMG4V23_TLV_OK) return HMG4V23_TLV_NESTED_SCHEMA_INVALID;
    offset = next_offset;
  }
  return offset == encoded.length ? HMG4V23_TLV_OK
                                  : HMG4V23_TLV_LIST_FRAMING_INVALID;
}

static hmg4v23_tlv_result validate_field_value(
    const hmg4v23_tlv_field_rule *rule,
    hmg4v23_tlv_view view,
    hmg4v23_path_authorizer path_authorizer,
    void *path_context,
    uint32_t depth,
    uint32_t maximum_depth) {
  uint64_t numeric;
  hmg4v23_tlv_result contextual;
  if (view.type != rule->type) return HMG4V23_TLV_FIELD_TYPE_MISMATCH;
  if (view.type == HMG4V23_TLV_BYTES &&
      (rule->flags & HMG4V23_FIELD_BYTES_BOUND_OVERRIDE) == 0 &&
      view.value.length > HMG4V23_DEFAULT_BYTES_MAX) {
    return HMG4V23_TLV_LENGTH_INVALID;
  }
  if ((rule->flags & HMG4V23_FIELD_LENGTH_RANGE) != 0 &&
      (view.value.length < (size_t)rule->minimum_length ||
       view.value.length > (size_t)rule->maximum_length)) {
    return HMG4V23_TLV_LENGTH_INVALID;
  }
  if (view.type == HMG4V23_TLV_SHA256 &&
      (rule->flags & HMG4V23_FIELD_ALLOW_ZERO_SHA256) == 0 &&
      is_zero_sha256(view.value)) {
    return HMG4V23_TLV_SHA256_ZERO_FORBIDDEN;
  }
  if ((rule->flags & HMG4V23_FIELD_NUMERIC_RANGE) != 0) {
    numeric = view.type == HMG4V23_TLV_U32
                  ? (uint64_t)hmg4v23_read_u32_be(view.value.bytes)
                  : hmg4v23_read_u64_be(view.value.bytes);
    if (numeric < rule->minimum_numeric_value ||
        numeric > rule->maximum_numeric_value) {
      return HMG4V23_TLV_NUMERIC_RANGE_INVALID;
    }
  }
  if (is_authority_path_type(view.type)) {
    if (path_authorizer == NULL) return HMG4V23_TLV_PATH_CONTEXT_REQUIRED;
    contextual = path_authorizer(path_context, view.tag, view.type, view.value);
    if (contextual != HMG4V23_TLV_OK) {
      return contextual == HMG4V23_TLV_PATH_CONTEXT_REQUIRED
                 ? contextual
                 : HMG4V23_TLV_PATH_CONTEXT_REJECTED;
    }
  }
  if (view.type == HMG4V23_TLV_STRUCT) {
    contextual = validate_schema_at_depth(view.value, rule->nested_schema,
                                          path_authorizer, path_context,
                                          depth + 1, maximum_depth);
    return contextual == HMG4V23_TLV_OK
               ? HMG4V23_TLV_OK
               : HMG4V23_TLV_NESTED_SCHEMA_INVALID;
  }
  if (view.type == HMG4V23_TLV_LIST) {
    return validate_list(view.value, rule, path_authorizer, path_context, depth,
                         maximum_depth);
  }
  return HMG4V23_TLV_OK;
}

static hmg4v23_tlv_result validate_schema_at_depth(
    hmg4v23_span encoded,
    const hmg4v23_tlv_schema *schema,
    hmg4v23_path_authorizer path_authorizer,
    void *path_context,
    uint32_t depth,
    uint32_t maximum_depth) {
  hmg4v23_tlv_cursor cursor;
  hmg4v23_tlv_view view;
  size_t rule_index = 0;
  size_t index;
  int done;
  if (!span_pointer_is_valid(encoded) || schema == NULL ||
      (schema->field_count != 0 && schema->fields == NULL) ||
      schema->maximum_depth == 0 || maximum_depth == 0) {
    return HMG4V23_TLV_SCHEMA_INVALID;
  }
  if (depth >= maximum_depth) return HMG4V23_TLV_MAXIMUM_DEPTH_EXCEEDED;
  for (index = 0; index < schema->field_count; ++index) {
    hmg4v23_tlv_result definition = validate_rule_definition(&schema->fields[index]);
    if (definition != HMG4V23_TLV_OK ||
        (index != 0 && schema->fields[index - 1].tag >= schema->fields[index].tag)) {
      return HMG4V23_TLV_SCHEMA_INVALID;
    }
  }
  hmg4v23_tlv_cursor_init(&cursor, encoded);
  for (;;) {
    hmg4v23_tlv_result next = hmg4v23_tlv_next_raw(&cursor, &view, &done);
    if (next != HMG4V23_TLV_OK) return next;
    if (done) break;
    while (rule_index < schema->field_count &&
           schema->fields[rule_index].tag < view.tag) {
      if ((schema->fields[rule_index].flags & HMG4V23_FIELD_OPTIONAL) == 0) {
        return HMG4V23_TLV_REQUIRED_FIELD_MISSING;
      }
      ++rule_index;
    }
    if (rule_index == schema->field_count ||
        schema->fields[rule_index].tag != view.tag) {
      return HMG4V23_TLV_UNKNOWN_FIELD;
    }
    next = validate_field_value(&schema->fields[rule_index], view,
                                path_authorizer, path_context, depth,
                                maximum_depth);
    if (next != HMG4V23_TLV_OK) return next;
    ++rule_index;
  }
  while (rule_index < schema->field_count) {
    if ((schema->fields[rule_index].flags & HMG4V23_FIELD_OPTIONAL) == 0) {
      return HMG4V23_TLV_REQUIRED_FIELD_MISSING;
    }
    ++rule_index;
  }
  return HMG4V23_TLV_OK;
}

hmg4v23_tlv_result hmg4v23_validate_tlv_schema(
    hmg4v23_span encoded,
    const hmg4v23_tlv_schema *schema,
    hmg4v23_path_authorizer path_authorizer,
    void *path_context) {
  if (schema == NULL) return HMG4V23_TLV_NULL_ARGUMENT;
  return validate_schema_at_depth(encoded, schema, path_authorizer, path_context,
                                  0, schema->maximum_depth);
}

const char *hmg4v23_tlv_result_name(hmg4v23_tlv_result result) {
  static const char *const names[] = {
      "OK", "NULL_ARGUMENT", "TRUNCATED", "RESERVED_NONZERO",
      "TYPE_SITE_FORBIDDEN", "LENGTH_INVALID", "ORDER_INVALID",
      "BOOL_INVALID", "SHA256_ZERO_FORBIDDEN", "PATH_SYNTAX_INVALID",
      "PATH_CONTEXT_REQUIRED", "PATH_CONTEXT_REJECTED", "SCHEMA_INVALID",
      "UNKNOWN_FIELD", "REQUIRED_FIELD_MISSING", "FIELD_TYPE_MISMATCH",
      "NUMERIC_RANGE_INVALID", "LIST_FRAMING_INVALID", "LIST_COUNT_INVALID",
      "NESTED_SCHEMA_INVALID", "MAXIMUM_DEPTH_EXCEEDED"};
  const size_t ordinal = (size_t)result;
  return ordinal < sizeof(names) / sizeof(names[0]) ? names[ordinal]
                                                    : "UNKNOWN_TLV_RESULT";
}
