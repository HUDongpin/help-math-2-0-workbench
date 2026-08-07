#include "response_codec.h"

#include <stdio.h>
#include <string.h>

enum { TEST_FRAME_CAPACITY = 2048 };

static int g_failures = 0;
static int g_assertions = 0;

#define EXPECT_TRUE(condition)                                                \
  do {                                                                        \
    g_assertions += 1;                                                        \
    if (!(condition)) {                                                       \
      (void)fprintf(stderr, "FAIL %s:%d: %s\n", __FILE__, __LINE__,          \
                    #condition);                                              \
      g_failures += 1;                                                        \
    }                                                                         \
  } while (0)

#define EXPECT_RESULT(actual, expected)                                       \
  do {                                                                        \
    const hmg4v23_response_result actual_result = (actual);                    \
    const hmg4v23_response_result expected_result = (expected);                \
    g_assertions += 1;                                                        \
    if (actual_result != expected_result) {                                   \
      (void)fprintf(stderr,                                                    \
                    "FAIL %s:%d: got %s, expected %s\n", __FILE__, __LINE__, \
                    hmg4v23_response_result_name(actual_result),               \
                    hmg4v23_response_result_name(expected_result));            \
      g_failures += 1;                                                        \
    }                                                                         \
  } while (0)

typedef struct {
  hmg4v23_response_fields fields;
  char journal_leaf[192];
  char receipt_leaf[192];
} response_fixture;

static char lower_hex_digit(uint8_t value) {
  return value < 10 ? (char)('0' + value) : (char)('a' + (value - 10));
}

static void digest_hex(const uint8_t digest[32], char output[65]) {
  size_t index;
  for (index = 0; index < 32; ++index) {
    output[index * 2] = lower_hex_digit((uint8_t)(digest[index] >> 4));
    output[index * 2 + 1] =
        lower_hex_digit((uint8_t)(digest[index] & 0x0f));
  }
  output[64] = '\0';
}

static uint32_t diagnostic_for_status(uint32_t status) {
  static const uint32_t codes[] = {
      UINT32_C(0x00000000), UINT32_C(0x00020001),
      UINT32_C(0x00060001), UINT32_C(0x00040003),
      UINT32_C(0x00050001), UINT32_C(0x00010003),
      UINT32_C(0x00030001)};
  return status <= 6 ? codes[status] : UINT32_MAX;
}

static uint32_t fixture_presence(uint32_t operation,
                                 uint32_t status,
                                 int terminal_status_four) {
  if (operation == 1) {
    return status == 5 ? 0 : HMG4V23_RESPONSE_HAS_CAPABILITY;
  }
  if (operation == 2) {
    return status == 5
               ? 0
               : HMG4V23_RESPONSE_HAS_CURRENT_STATE |
                     (status == 6 ? HMG4V23_RESPONSE_HAS_CAPABILITY : 0u);
  }
  if (status == 0 || status == 2) {
    return HMG4V23_RESPONSE_HAS_TRANSACTION |
           HMG4V23_RESPONSE_HAS_CURRENT_STATE |
           HMG4V23_RESPONSE_HAS_TERMINAL;
  }
  if (status == 3 || status == 4) {
    return HMG4V23_RESPONSE_HAS_TRANSACTION |
           HMG4V23_RESPONSE_HAS_CURRENT_STATE |
           (status == 4 && terminal_status_four
                ? HMG4V23_RESPONSE_HAS_TERMINAL
                : 0u);
  }
  if (status == 1) return HMG4V23_RESPONSE_HAS_CURRENT_STATE;
  if (status == 6) {
    return HMG4V23_RESPONSE_HAS_CURRENT_STATE |
           HMG4V23_RESPONSE_HAS_CAPABILITY;
  }
  return 0;
}

static int make_fixture(uint32_t operation,
                        uint32_t status,
                        int terminal_status_four,
                        response_fixture *fixture) {
  char tx_hex[65];
  char sequence_hex[65];
  char receipt_hex[65];
  int journal_length;
  int receipt_length;
  size_t index;
  if (fixture == NULL) return 0;
  memset(fixture, 0, sizeof(*fixture));
  fixture->fields.operation = operation;
  fixture->fields.status = status;
  fixture->fields.diagnostic_code = diagnostic_for_status(status);
  fixture->fields.present_fields =
      fixture_presence(operation, status, terminal_status_four);
  for (index = 0; index < 32; ++index) {
    fixture->fields.request_payload_sha256[index] = (uint8_t)(0x10u + index);
    fixture->fields.transaction_id[index] = (uint8_t)(index + 1u);
    fixture->fields.journal_sha256[index] = (uint8_t)(0x31u + index);
    fixture->fields.sequence_zero_record_sha256[index] =
        (uint8_t)(0x51u + index);
    fixture->fields.observed_current_set_sha256[index] =
        (uint8_t)(0x71u + index);
    fixture->fields.terminal_receipt_sha256[index] =
        (uint8_t)(0x91u + index);
  }
  digest_hex(fixture->fields.transaction_id, tx_hex);
  digest_hex(fixture->fields.sequence_zero_record_sha256, sequence_hex);
  digest_hex(fixture->fields.terminal_receipt_sha256, receipt_hex);
  journal_length = snprintf(fixture->journal_leaf, sizeof(fixture->journal_leaf),
                            "tx-%s-journal-%s.log", tx_hex, sequence_hex);
  receipt_length = snprintf(fixture->receipt_leaf, sizeof(fixture->receipt_leaf),
                            "tx-%s-receipt-%s.receipt", tx_hex, receipt_hex);
  if (journal_length <= 0 || receipt_length <= 0 ||
      (size_t)journal_length >= sizeof(fixture->journal_leaf) ||
      (size_t)receipt_length >= sizeof(fixture->receipt_leaf)) {
    return 0;
  }
  fixture->fields.journal_leaf = (hmg4v23_span){
      (const uint8_t *)fixture->journal_leaf, (size_t)journal_length};
  fixture->fields.terminal_receipt_leaf = (hmg4v23_span){
      (const uint8_t *)fixture->receipt_leaf, (size_t)receipt_length};
  fixture->fields.capability_state = status == 6 ? 2u : 1u;
  fixture->fields.terminal_state =
      status == 2 ? 3u : status == 4 ? 4u : 1u;
  return 1;
}

static int operation_status_is_legal(uint32_t operation, uint32_t status) {
  if (operation == 1) {
    return status == 0 || status == 1 || status == 5 || status == 6;
  }
  if (operation == 2) return status != 2;
  return operation == 3 || operation == 4;
}

static void round_trip(response_fixture *fixture) {
  uint8_t frame[TEST_FRAME_CAPACITY];
  size_t payload_length = 0;
  size_t frame_length = 0;
  hmg4v23_response_frame_view view;
  const uint8_t *context =
      (fixture->fields.present_fields & HMG4V23_RESPONSE_HAS_TRANSACTION) != 0
          ? fixture->fields.sequence_zero_record_sha256
          : NULL;
  EXPECT_RESULT(hmg4v23_response_payload_length(&fixture->fields,
                                                &payload_length),
                HMG4V23_RESPONSE_OK);
  EXPECT_RESULT(hmg4v23_encode_response_frame(&fixture->fields, frame,
                                              sizeof(frame), &frame_length),
                HMG4V23_RESPONSE_OK);
  EXPECT_TRUE(frame_length == payload_length + HMG4V23_RESPONSE_HEADER_SIZE);
  EXPECT_TRUE(memcmp(frame, "HMG4R2\0\0", 8) == 0);
  EXPECT_TRUE(hmg4v23_read_u32_be(frame + 8) == 2);
  EXPECT_TRUE(hmg4v23_read_u32_be(frame + 12) == fixture->fields.status);
  EXPECT_TRUE(hmg4v23_read_u64_be(frame + 16) == payload_length);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    fixture->fields.operation,
                    (hmg4v23_span){frame, frame_length}, context, &view),
                HMG4V23_RESPONSE_OK);
  EXPECT_TRUE(view.fields.diagnostic_code == fixture->fields.diagnostic_code);
  EXPECT_TRUE(view.fields.present_fields == fixture->fields.present_fields);
  EXPECT_TRUE(memcmp(view.fields.request_payload_sha256,
                     fixture->fields.request_payload_sha256, 32) == 0);
  if (context != NULL) {
    EXPECT_TRUE(memcmp(view.fields.transaction_id,
                       fixture->fields.transaction_id, 32) == 0);
    EXPECT_TRUE(memcmp(view.fields.journal_sha256,
                       fixture->fields.journal_sha256, 32) == 0);
  }
}

static void refresh_payload_hash(uint8_t *frame, size_t frame_length) {
  uint8_t digest[32];
  const size_t payload_length = frame_length - HMG4V23_RESPONSE_HEADER_SIZE;
  EXPECT_TRUE(hmg4v23_sha256(
                  (hmg4v23_span){frame + HMG4V23_RESPONSE_HEADER_SIZE,
                                 payload_length},
                  digest) == HMG4V23_OK);
  memcpy(frame + 24, digest, 32);
}

static void test_operation_status_matrix(void) {
  uint32_t operation;
  uint32_t status;
  for (operation = 1; operation <= 4; ++operation) {
    for (status = 0; status <= 6; ++status) {
      response_fixture fixture;
      uint8_t frame[TEST_FRAME_CAPACITY];
      size_t frame_length = 0;
      EXPECT_TRUE(make_fixture(operation, status, 0, &fixture));
      if (operation_status_is_legal(operation, status)) {
        round_trip(&fixture);
      } else {
        EXPECT_RESULT(hmg4v23_encode_response_frame(
                          &fixture.fields, frame, sizeof(frame), &frame_length),
                      HMG4V23_RESPONSE_STATUS_OPERATION_INVALID);
      }
    }
  }
  for (operation = 3; operation <= 4; ++operation) {
    response_fixture fixture;
    EXPECT_TRUE(make_fixture(operation, 4, 1, &fixture));
    round_trip(&fixture);
  }
}

static void test_every_registered_diagnostic(void) {
  size_t ordinal;
  for (ordinal = 0; ordinal < HMG4V23_DIAGNOSTIC_COUNT; ++ordinal) {
    const hmg4v23_diagnostic *diagnostic = hmg4v23_diagnostic_at(ordinal);
    response_fixture fixture;
    uint32_t operation;
    EXPECT_TRUE(diagnostic != NULL);
    if (diagnostic == NULL) continue;
    operation = diagnostic->status == 0 || diagnostic->status == 1 ||
                        diagnostic->status == 5 || diagnostic->status == 6
                    ? 1u
                : diagnostic->status == 2
                    ? 3u
                    : 2u;
    EXPECT_TRUE(make_fixture(operation, diagnostic->status, 0, &fixture));
    fixture.fields.diagnostic_code = diagnostic->code;
    round_trip(&fixture);
  }
}

static void test_semantic_rejections(void) {
  response_fixture fixture;
  uint8_t frame[TEST_FRAME_CAPACITY];
  size_t frame_length = 0;
  size_t payload_length = 0;
  hmg4v23_response_frame_view view;
  uint8_t wrong_context[32];
  int exit_code = -1;

  EXPECT_TRUE(make_fixture(3, 3, 0, &fixture));
  fixture.fields.present_fields |= HMG4V23_RESPONSE_HAS_TERMINAL;
  EXPECT_RESULT(hmg4v23_response_payload_length(&fixture.fields,
                                                &payload_length),
                HMG4V23_RESPONSE_PRESENCE_INVALID);

  EXPECT_TRUE(make_fixture(1, 6, 0, &fixture));
  fixture.fields.capability_state = 1;
  EXPECT_RESULT(hmg4v23_response_payload_length(&fixture.fields,
                                                &payload_length),
                HMG4V23_RESPONSE_CAPABILITY_INVALID);

  EXPECT_TRUE(make_fixture(2, 0, 0, &fixture));
  memset(fixture.fields.observed_current_set_sha256, 0, 32);
  EXPECT_RESULT(hmg4v23_response_payload_length(&fixture.fields,
                                                &payload_length),
                HMG4V23_RESPONSE_CURRENT_STATE_INVALID);

  EXPECT_TRUE(make_fixture(3, 0, 0, &fixture));
  fixture.fields.terminal_state = 3;
  EXPECT_RESULT(hmg4v23_response_payload_length(&fixture.fields,
                                                &payload_length),
                HMG4V23_RESPONSE_TERMINAL_INVALID);

  EXPECT_TRUE(make_fixture(3, 2, 0, &fixture));
  fixture.fields.terminal_state = 2;
  EXPECT_RESULT(hmg4v23_response_payload_length(&fixture.fields,
                                                &payload_length),
                HMG4V23_RESPONSE_TERMINAL_INVALID);

  EXPECT_TRUE(make_fixture(3, 4, 1, &fixture));
  fixture.fields.terminal_state = 1;
  EXPECT_RESULT(hmg4v23_response_payload_length(&fixture.fields,
                                                &payload_length),
                HMG4V23_RESPONSE_TERMINAL_INVALID);

  EXPECT_TRUE(make_fixture(3, 3, 0, &fixture));
  fixture.journal_leaf[3] = fixture.journal_leaf[3] == '0' ? '1' : '0';
  EXPECT_RESULT(hmg4v23_response_payload_length(&fixture.fields,
                                                &payload_length),
                HMG4V23_RESPONSE_JOURNAL_LEAF_INVALID);

  EXPECT_TRUE(make_fixture(3, 0, 0, &fixture));
  fixture.receipt_leaf[80] = fixture.receipt_leaf[80] == '0' ? '1' : '0';
  EXPECT_RESULT(hmg4v23_response_payload_length(&fixture.fields,
                                                &payload_length),
                HMG4V23_RESPONSE_RECEIPT_LEAF_INVALID);

  EXPECT_TRUE(make_fixture(1, 5, 0, &fixture));
  memset(fixture.fields.request_payload_sha256, 0, 32);
  EXPECT_RESULT(hmg4v23_encode_response_frame(
                    &fixture.fields, frame, sizeof(frame), &frame_length),
                HMG4V23_RESPONSE_OK);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_OK);

  EXPECT_TRUE(make_fixture(3, 3, 0, &fixture));
  EXPECT_RESULT(hmg4v23_encode_response_frame(
                    &fixture.fields, frame, sizeof(frame), &frame_length),
                HMG4V23_RESPONSE_OK);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    3, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_CONTEXT_REQUIRED);
  memcpy(wrong_context, fixture.fields.sequence_zero_record_sha256, 32);
  wrong_context[0] ^= 1u;
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    3, (hmg4v23_span){frame, frame_length}, wrong_context,
                    &view),
                HMG4V23_RESPONSE_JOURNAL_LEAF_INVALID);

  EXPECT_TRUE(make_fixture(1, 0, 0, &fixture));
  EXPECT_RESULT(hmg4v23_encode_response_frame(
                    &fixture.fields, frame, sizeof(frame), &frame_length),
                HMG4V23_RESPONSE_OK);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length},
                    fixture.fields.sequence_zero_record_sha256, &view),
                HMG4V23_RESPONSE_CONTEXT_FORBIDDEN);

  EXPECT_TRUE(make_fixture(3, 3, 0, &fixture));
  memset(frame, 0xa5, sizeof(frame));
  EXPECT_RESULT(hmg4v23_encode_response_frame(
                    &fixture.fields, frame, 55, &frame_length),
                HMG4V23_RESPONSE_OUTPUT_TOO_SMALL);
  EXPECT_TRUE(frame[0] == 0xa5);

  for (fixture.fields.status = 0; fixture.fields.status <= 6;
       fixture.fields.status += 1) {
    static const int expected[] = {0, 20, 20, 30, 40, 64, 70};
    EXPECT_TRUE(hmg4v23_response_exit_code(fixture.fields.status, &exit_code));
    EXPECT_TRUE(exit_code == expected[fixture.fields.status]);
  }
  EXPECT_TRUE(!hmg4v23_response_exit_code(7, &exit_code));
  EXPECT_TRUE(!hmg4v23_response_exit_code(0, NULL));
}

static void test_frame_rejections(void) {
  response_fixture fixture;
  uint8_t frame[TEST_FRAME_CAPACITY];
  uint8_t original[TEST_FRAME_CAPACITY];
  size_t frame_length = 0;
  hmg4v23_response_frame_view view;
  EXPECT_TRUE(make_fixture(1, 0, 0, &fixture));
  EXPECT_RESULT(hmg4v23_encode_response_frame(
                    &fixture.fields, frame, sizeof(frame), &frame_length),
                HMG4V23_RESPONSE_OK);
  memcpy(original, frame, frame_length);

  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, 55}, NULL, &view),
                HMG4V23_RESPONSE_FRAME_TOO_SHORT);
  frame[0] ^= 1u;
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_MAGIC_INVALID);
  memcpy(frame, original, frame_length);
  hmg4v23_write_u32_be(frame + 8, 3);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_VERSION_INVALID);
  memcpy(frame, original, frame_length);
  hmg4v23_write_u32_be(frame + 12, 7);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_STATUS_INVALID);
  memcpy(frame, original, frame_length);
  hmg4v23_write_u64_be(frame + 16, HMG4V23_RESPONSE_MAX_PAYLOAD + 1);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE);
  memcpy(frame, original, frame_length);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length - 1}, NULL, &view),
                HMG4V23_RESPONSE_FRAME_LENGTH_INVALID);
  memcpy(frame, original, frame_length);
  frame[24] ^= 1u;
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_PAYLOAD_HASH_INVALID);
  memcpy(frame, original, frame_length);
  frame[HMG4V23_RESPONSE_HEADER_SIZE + 3] = 1;
  refresh_payload_hash(frame, frame_length);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_TLV_INVALID);
  memcpy(frame, original, frame_length);
  frame[HMG4V23_RESPONSE_HEADER_SIZE + 2] = HMG4V23_TLV_U64;
  refresh_payload_hash(frame, frame_length);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_TLV_INVALID);
  memcpy(frame, original, frame_length);
  frame[HMG4V23_RESPONSE_HEADER_SIZE + 1] = 2;
  refresh_payload_hash(frame, frame_length);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_TLV_INVALID);

  EXPECT_TRUE(make_fixture(1, 5, 0, &fixture));
  EXPECT_RESULT(hmg4v23_encode_response_frame(
                    &fixture.fields, frame, sizeof(frame), &frame_length),
                HMG4V23_RESPONSE_OK);
  hmg4v23_write_u16_be(frame + frame_length, 0x8004);
  frame[frame_length + 2] = HMG4V23_TLV_SAFE_CUSTODY_LEAF;
  frame[frame_length + 3] = 0;
  hmg4v23_write_u32_be(frame + frame_length + 4,
                       (uint32_t)fixture.fields.journal_leaf.length);
  memcpy(frame + frame_length + HMG4V23_TLV_HEADER_SIZE,
         fixture.fields.journal_leaf.bytes, fixture.fields.journal_leaf.length);
  frame_length += HMG4V23_TLV_HEADER_SIZE + fixture.fields.journal_leaf.length;
  hmg4v23_write_u64_be(frame + 16,
                       (uint64_t)(frame_length - HMG4V23_RESPONSE_HEADER_SIZE));
  refresh_payload_hash(frame, frame_length);
  EXPECT_RESULT(hmg4v23_validate_response_frame(
                    1, (hmg4v23_span){frame, frame_length}, NULL, &view),
                HMG4V23_RESPONSE_PRESENCE_INVALID);
}

int main(void) {
  test_operation_status_matrix();
  test_every_registered_diagnostic();
  test_semantic_rejections();
  test_frame_rejections();
  if (g_failures != 0) {
    (void)fprintf(stderr, "response_codec_test: %d failure(s), %d assertions\n",
                  g_failures, g_assertions);
    return 1;
  }
  (void)printf("response_codec_test: all checks passed (assertions=%d)\n",
               g_assertions);
  return 0;
}
