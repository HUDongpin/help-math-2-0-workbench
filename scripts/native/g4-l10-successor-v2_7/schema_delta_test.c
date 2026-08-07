#include "schema_delta.h"

#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static unsigned assertions;
#define CHECK(expression) do { assertions++; if (!(expression)) { \
  fprintf(stderr, "assertion failed at %s:%d: %s\n", __FILE__, __LINE__, #expression); \
  exit(1); } } while (0)

static void test_fixed_delta(void) {
  size_t ordinal;
  size_t s64_count = 0;
  size_t regression_count = 0;
  for (ordinal = 0; ordinal < HMG4V27_SCHEMA_DELTA_FIXED_COUNT; ++ordinal) {
    const hmg4v27_schema_delta_entry *entry = hmg4v27_schema_delta_at(ordinal);
    const hmg4v27_schema_delta_entry *found = NULL;
    CHECK(entry != NULL);
    CHECK(entry->reserved == 0);
    CHECK(entry->context_name != NULL && entry->context_name[0] != '\0');
    CHECK(entry->field_name != NULL && entry->field_name[0] != '\0');
    CHECK(hmg4v27_tlv_type_is_known(entry->type));
    CHECK(hmg4v27_schema_delta_lookup(entry->context, entry->tag, &found));
    CHECK(found == entry);
    if (entry->type == HMG4V27_TLV_S64) s64_count++;
    else regression_count++;
  }
  CHECK(hmg4v27_schema_delta_at(HMG4V27_SCHEMA_DELTA_FIXED_COUNT) == NULL);
  CHECK(regression_count == HMG4V27_SCHEMA_REGRESSION_TAG_COUNT);
  CHECK(s64_count == HMG4V27_SCHEMA_S64_SITE_COUNT);
}

static void test_final_entry_matrix(void) {
  uint32_t role;
  uint32_t type;
  for (role = 1; role <= 8; ++role) {
    uint8_t expected = 0;
    CHECK(hmg4v27_final_entry_path_type(role, &expected));
    for (type = 1; type <= 0x11; ++type) {
      const int should_pass =
          (role == 1 && type == HMG4V27_TLV_POLICY_REL_PATH) ||
          (role >= 2 && role <= 7 && type == HMG4V27_TLV_SAFE_CUSTODY_LEAF) ||
          (role == 8 && type == HMG4V27_TLV_OBSERVED_CUSTODY_LEAF);
      CHECK((type == expected) == should_pass);
    }
  }
  CHECK(!hmg4v27_final_entry_path_type(0, &(uint8_t){0}));
  CHECK(!hmg4v27_final_entry_path_type(9, &(uint8_t){0}));
  CHECK(!hmg4v27_final_entry_path_type(1, NULL));
}

static void test_s64_sites(void) {
  size_t ordinal;
  static const int64_t roundtrips[] = {
      INT64_MIN, INT64_C(-25316), INT64_C(-1), INT64_C(0), INT64_C(1),
      INT64_C(3072), INT64_C(1048576), INT64_MAX};
  for (ordinal = 0; ordinal < sizeof(roundtrips) / sizeof(roundtrips[0]); ++ordinal) {
    uint8_t encoded[8];
    hmg4v27_write_s64_be(encoded, roundtrips[ordinal]);
    CHECK(hmg4v27_read_s64_be(encoded) == roundtrips[ordinal]);
  }
  for (ordinal = 0; ordinal < HMG4V27_SCHEMA_DELTA_FIXED_COUNT; ++ordinal) {
    const hmg4v27_schema_delta_entry *entry = hmg4v27_schema_delta_at(ordinal);
    if (entry->type == HMG4V27_TLV_S64) {
      uint8_t encoded[8];
      int64_t decoded = 0;
      hmg4v27_write_s64_be(encoded, entry->signed_minimum);
      CHECK(hmg4v27_schema_delta_validate_s64(
          entry, (hmg4v27_span){encoded, sizeof(encoded)}, &decoded));
      CHECK(decoded == entry->signed_minimum);
      if (entry->signed_minimum == entry->signed_maximum &&
          entry->signed_minimum != INT64_MAX) {
        hmg4v27_write_s64_be(encoded, entry->signed_minimum + 1);
        CHECK(!hmg4v27_schema_delta_validate_s64(
            entry, (hmg4v27_span){encoded, sizeof(encoded)}, &decoded));
      }
      CHECK(!hmg4v27_schema_delta_validate_s64(
          entry, (hmg4v27_span){encoded, 7}, &decoded));
    }
  }
}

int main(void) {
  test_fixed_delta();
  test_final_entry_matrix();
  test_s64_sites();
  printf("schema-delta assertions=%u\n", assertions);
  return 0;
}
