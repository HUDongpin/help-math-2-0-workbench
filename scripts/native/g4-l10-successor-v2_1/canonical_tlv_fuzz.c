#include "canonical_tlv.h"

#include <stdint.h>
#include <stdio.h>

static uint64_t state = UINT64_C(0x6e693f152aef885a);

static uint32_t next_u32(void) {
  state ^= state << 13;
  state ^= state >> 7;
  state ^= state << 17;
  return (uint32_t)(state >> 16);
}

int main(void) {
  static const hmg4v21_tlv_field_rule rule = {
      0x5102, HMG4V21_TLV_BYTES, 0, HMG4V21_FIELD_OPTIONAL,
      0, 0, 0, 0, 0, 0, NULL};
  static const hmg4v21_tlv_schema schema = {&rule, 1, 1};
  uint8_t bytes[512];
  uint8_t digest[32] = {0};
  size_t iteration;
  for (iteration = 0; iteration < 300000; ++iteration) {
    const size_t length = (size_t)(next_u32() % (uint32_t)sizeof(bytes));
    hmg4v21_span span = {bytes, length};
    hmg4v21_tlv_cursor cursor;
    hmg4v21_tlv_view view;
    hmg4v21_custody_leaf custody;
    hmg4v21_fixture_root root;
    hmg4v21_fixture_attempt attempt;
    size_t index;
    int done = 0;
    for (index = 0; index < length; ++index) bytes[index] = (uint8_t)next_u32();
    hmg4v21_tlv_cursor_init(&cursor, span);
    while (!done) {
      if (hmg4v21_tlv_next_raw(&cursor, &view, &done) != HMG4V21_TLV_OK) break;
    }
    (void)hmg4v21_validate_tlv_schema(span, &schema, NULL, NULL);
    (void)hmg4v21_policy_rel_path_is_lexically_safe(span);
    (void)hmg4v21_approved_abs_root_is_lexically_safe(span);
    (void)hmg4v21_observed_custody_leaf_is_lexically_safe(span);
    (void)hmg4v21_build_rel_path_is_lexically_safe(span);
    (void)hmg4v21_parse_custody_leaf(span, &custody);
    (void)hmg4v21_validate_evidence_path(
        span, (hmg4v21_evidence_role)((next_u32() % 14) + 1), digest);
    (void)hmg4v21_parse_fixture_root(span, &root);
    (void)hmg4v21_validate_fixture_root(
        span, (hmg4v21_fixture_scope)((next_u32() % 3) + 1), digest);
    (void)hmg4v21_parse_fixture_attempt(span, &attempt);
    (void)hmg4v21_validate_fixture_claim(span, digest);
    (void)hmg4v21_tlv_result_name(
        (hmg4v21_tlv_result)(next_u32() % 32));
  }
  puts("canonical-tlv fuzz cases=300000");
  return 0;
}
