#include "protocol_core.h"

#include <stdint.h>
#include <stdio.h>
#include <string.h>

/*
 * Development-only deterministic malformed-input harness.
 *
 * This program performs pure in-memory parsing.  It has no filesystem,
 * process, dynamic-symbol, network, response, installation, transaction, or
 * original-runtime capability.  Its fixed seed and bounded buffers make the
 * run reproducible under AddressSanitizer and UndefinedBehaviorSanitizer.
 */

enum {
  FUZZ_CASE_COUNT = 200000,
  FUZZ_MAX_INPUT = 4095,
  FUZZ_TLV_STEP_LIMIT = 520
};

static uint64_t fuzz_state = UINT64_C(0x6a09e667f3bcc909);
static unsigned int check_count = 0;

#define CHECK(condition)                                                       \
  do {                                                                         \
    check_count += 1;                                                          \
    if (!(condition)) {                                                        \
      fprintf(stderr, "HMG4V2_FUZZ_FAIL line=%d check=%u\n", __LINE__,       \
              check_count);                                                    \
      return 1;                                                                \
    }                                                                          \
  } while (0)

static uint64_t fuzz_next_u64(void) {
  uint64_t value = fuzz_state;
  value ^= value << 13;
  value ^= value >> 7;
  value ^= value << 17;
  fuzz_state = value;
  return value;
}

static hmg4v2_span fuzz_span(const void *bytes, size_t length) {
  hmg4v2_span span;
  span.bytes = (const uint8_t *)bytes;
  span.length = length;
  return span;
}

static hmg4v2_core_result drain_tlv_stream(hmg4v2_span input) {
  hmg4v2_tlv_cursor cursor;
  hmg4v2_tlv_view view;
  size_t step = 0;
  int done = 0;
  hmg4v2_tlv_cursor_init(&cursor, input);
  for (step = 0; step < FUZZ_TLV_STEP_LIMIT; step += 1) {
    const hmg4v2_core_result result =
        hmg4v2_tlv_next(&cursor, &view, &done);
    if (result != HMG4V2_CORE_OK || done) return result;
  }
  return HMG4V2_CORE_SIZE_OVERFLOW;
}

static int exercise_exact_vectors(void) {
  static const uint8_t empty_probe_header[HMG4V2_HEADER_SIZE] = {
      0x48, 0x4d, 0x47, 0x34, 0x56, 0x32, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
      0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
      0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
      0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55};
  static const uint8_t canonical_u32_tlv[] = {
      0x00, 0x02, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x04, 0x00, 0x00, 0x00, 0x02};
  static const uint8_t observed_non_ascii_tlv[] = {
      0x00, 0x01, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x01, 0xff};
  static const uint8_t safe_non_ascii_tlv[] = {
      0x00, 0x01, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x01, 0xff};
  static const uint8_t rel_nul[] = {'a', 0x00, 'b'};
  static const uint8_t rel_non_ascii[] = {'a', 0x80, 'b'};
  static const char rel_good[] = "Lesson_10/report.json";
  static const char rel_dot[] = "a/../b";
  static const char rel_repeat[] = "a//b";
  static const char rel_backslash[] = "a\\b";
  static const char abs_good[] = "/Volumes/WestWorld/HELP MATH 2.0";
  uint8_t mutated[HMG4V2_HEADER_SIZE + 1];
  hmg4v2_request_frame frame;
  hmg4v2_tlv_cursor cursor;
  hmg4v2_tlv_view view;
  size_t cut = 0;
  size_t byte_index = 0;
  unsigned int bit = 0;
  int done = 0;

  CHECK(hmg4v2_validate_buffered_request_frame(
            fuzz_span(empty_probe_header, sizeof(empty_probe_header)),
            &frame) == HMG4V2_CORE_OK);
  CHECK(frame.header.operation == 1 && frame.payload.length == 0);
  CHECK(hmg4v2_validate_request_payload_syntax(1, frame.payload) ==
        HMG4V2_CORE_WRONG_TAG_SET);

  for (cut = 0; cut < HMG4V2_HEADER_SIZE; cut += 1) {
    CHECK(hmg4v2_validate_buffered_request_frame(
              fuzz_span(empty_probe_header, cut), &frame) ==
          HMG4V2_CORE_TRUNCATED_HEADER);
  }
  memcpy(mutated, empty_probe_header, HMG4V2_HEADER_SIZE);
  mutated[HMG4V2_HEADER_SIZE] = 0;
  CHECK(hmg4v2_validate_buffered_request_frame(
            fuzz_span(mutated, sizeof(mutated)), &frame) ==
        HMG4V2_CORE_FRAME_LENGTH_MISMATCH);

  for (byte_index = 0; byte_index < HMG4V2_HEADER_SIZE; byte_index += 1) {
    for (bit = 0; bit < 8; bit += 1) {
      memcpy(mutated, empty_probe_header, HMG4V2_HEADER_SIZE);
      mutated[byte_index] ^= (uint8_t)(1u << bit);
      (void)hmg4v2_validate_buffered_request_frame(
          fuzz_span(mutated, HMG4V2_HEADER_SIZE), &frame);
    }
  }

  for (cut = 1; cut < sizeof(canonical_u32_tlv); cut += 1) {
    CHECK(drain_tlv_stream(fuzz_span(canonical_u32_tlv, cut)) !=
          HMG4V2_CORE_OK);
  }
  CHECK(drain_tlv_stream(
            fuzz_span(canonical_u32_tlv, sizeof(canonical_u32_tlv))) ==
        HMG4V2_CORE_OK);
  CHECK(drain_tlv_stream(
            fuzz_span(observed_non_ascii_tlv,
                      sizeof(observed_non_ascii_tlv))) == HMG4V2_CORE_OK);

  hmg4v2_tlv_cursor_init(
      &cursor, fuzz_span(safe_non_ascii_tlv, sizeof(safe_non_ascii_tlv)));
  CHECK(hmg4v2_tlv_next(&cursor, &view, &done) == HMG4V2_CORE_BAD_PATH);

  CHECK(hmg4v2_policy_rel_path_is_lexically_safe(
      fuzz_span(rel_good, sizeof(rel_good) - 1)));
  CHECK(!hmg4v2_policy_rel_path_is_lexically_safe(
      fuzz_span(rel_dot, sizeof(rel_dot) - 1)));
  CHECK(!hmg4v2_policy_rel_path_is_lexically_safe(
      fuzz_span(rel_repeat, sizeof(rel_repeat) - 1)));
  CHECK(!hmg4v2_policy_rel_path_is_lexically_safe(
      fuzz_span(rel_backslash, sizeof(rel_backslash) - 1)));
  CHECK(!hmg4v2_policy_rel_path_is_lexically_safe(
      fuzz_span(rel_nul, sizeof(rel_nul))));
  CHECK(!hmg4v2_policy_rel_path_is_lexically_safe(
      fuzz_span(rel_non_ascii, sizeof(rel_non_ascii))));
  CHECK(hmg4v2_approved_abs_root_is_lexically_safe(
      fuzz_span(abs_good, sizeof(abs_good) - 1)));
  return 0;
}

static int exercise_random_malformed_inputs(void) {
  uint8_t storage[FUZZ_MAX_INPUT + 2];
  size_t iteration = 0;
  for (iteration = 0; iteration < FUZZ_CASE_COUNT; iteration += 1) {
    const size_t length = (size_t)(fuzz_next_u64() % (FUZZ_MAX_INPUT + 1u));
    const size_t misalignment = (size_t)(fuzz_next_u64() & 1u);
    hmg4v2_span input;
    hmg4v2_request_frame frame;
    size_t index = 0;
    for (index = 0; index < length; index += 1) {
      storage[misalignment + index] = (uint8_t)fuzz_next_u64();
    }
    input = fuzz_span(storage + misalignment, length);
    if (hmg4v2_validate_buffered_request_frame(input, &frame) ==
        HMG4V2_CORE_OK) {
      (void)hmg4v2_validate_request_payload_syntax(
          frame.header.operation, frame.payload);
    }
    (void)drain_tlv_stream(input);
    (void)hmg4v2_policy_rel_path_is_lexically_safe(input);
    (void)hmg4v2_approved_abs_root_is_lexically_safe(input);
    (void)hmg4v2_leaf_is_common_lexically_safe(input);
  }
  return 0;
}

int main(void) {
  if (exercise_exact_vectors() != 0) return 1;
  if (exercise_random_malformed_inputs() != 0) return 1;
  CHECK(hmg4v2_authority_validation_status() ==
        HMG4V2_CORE_UNFROZEN_AUTHORITY);
  printf("HMG4V2_PROTOCOL_CORE_FUZZ_PASS cases=%u checks=%u seed_final=%016llx\n",
         FUZZ_CASE_COUNT, check_count, (unsigned long long)fuzz_state);
  return 0;
}
