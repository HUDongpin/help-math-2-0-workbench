#include "response_codec.h"

#include <stdio.h>
#include <string.h>

enum {
  FUZZ_CASES = 300000,
  FUZZ_BUFFER_CAPACITY = 2048,
  BASE_FRAME_COUNT = 4
};

typedef struct {
  hmg4v23_response_fields fields;
  char journal_leaf[192];
  char receipt_leaf[192];
  uint8_t frame[FUZZ_BUFFER_CAPACITY];
  size_t frame_length;
} fuzz_fixture;

static uint64_t g_state = UINT64_C(0x78c41d2eb5a609f3);

static uint64_t next_u64(void) {
  uint64_t value = g_state;
  value ^= value << 13;
  value ^= value >> 7;
  value ^= value << 17;
  g_state = value;
  return value;
}

static uint8_t next_u8(void) {
  return (uint8_t)(next_u64() >> 56);
}

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

static int build_fixture(uint32_t operation,
                         uint32_t status,
                         uint32_t diagnostic,
                         uint32_t presence,
                         uint32_t terminal_state,
                         fuzz_fixture *fixture) {
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
  fixture->fields.diagnostic_code = diagnostic;
  fixture->fields.present_fields = presence;
  fixture->fields.terminal_state = terminal_state;
  fixture->fields.capability_state = status == 6 ? 2u : 1u;
  for (index = 0; index < 32; ++index) {
    fixture->fields.request_payload_sha256[index] = (uint8_t)(index + 3u);
    fixture->fields.transaction_id[index] = (uint8_t)(index + 7u);
    fixture->fields.journal_sha256[index] = (uint8_t)(index + 41u);
    fixture->fields.sequence_zero_record_sha256[index] =
        (uint8_t)(index + 73u);
    fixture->fields.observed_current_set_sha256[index] =
        (uint8_t)(index + 109u);
    fixture->fields.terminal_receipt_sha256[index] =
        (uint8_t)(index + 151u);
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
  return hmg4v23_encode_response_frame(
             &fixture->fields, fixture->frame, sizeof(fixture->frame),
             &fixture->frame_length) == HMG4V23_RESPONSE_OK;
}

static int build_bases(fuzz_fixture bases[BASE_FRAME_COUNT]) {
  return build_fixture(1, 0, UINT32_C(0x00000000),
                       HMG4V23_RESPONSE_HAS_CAPABILITY, 0, &bases[0]) &&
         build_fixture(2, 4, UINT32_C(0x00050001),
                       HMG4V23_RESPONSE_HAS_CURRENT_STATE, 0, &bases[1]) &&
         build_fixture(3, 3, UINT32_C(0x00040003),
                       HMG4V23_RESPONSE_HAS_TRANSACTION |
                           HMG4V23_RESPONSE_HAS_CURRENT_STATE,
                       0, &bases[2]) &&
         build_fixture(4, 4, UINT32_C(0x00050004),
                       HMG4V23_RESPONSE_HAS_TRANSACTION |
                           HMG4V23_RESPONSE_HAS_CURRENT_STATE |
                           HMG4V23_RESPONSE_HAS_TERMINAL,
                       4, &bases[3]);
}

static int response_result_is_bounded(hmg4v23_response_result result) {
  return result >= HMG4V23_RESPONSE_OK &&
         result <= HMG4V23_RESPONSE_HASH_ENGINE_FAILURE;
}

int main(void) {
  fuzz_fixture bases[BASE_FRAME_COUNT];
  _Alignas(64) uint8_t storage[FUZZ_BUFFER_CAPACITY + 1];
  uint8_t encode_storage[FUZZ_BUFFER_CAPACITY];
  uint64_t checksum = 0;
  uint32_t random_cases = 0;
  uint32_t mutated_cases = 0;
  uint32_t field_cases = 0;
  uint32_t iteration;
  if (!build_bases(bases)) {
    (void)fprintf(stderr, "response_codec_fuzz: base construction failed\n");
    return 1;
  }
  memset(storage, 0, sizeof(storage));
  memset(encode_storage, 0, sizeof(encode_storage));
  for (iteration = 0; iteration < FUZZ_CASES; ++iteration) {
    const uint32_t family = iteration % 3u;
    if (family == 0) {
      const size_t length = (size_t)(next_u64() % FUZZ_BUFFER_CAPACITY);
      uint8_t *const bytes = storage + (iteration & 1u);
      hmg4v23_response_frame_view view;
      hmg4v23_response_result result;
      size_t index;
      for (index = 0; index < length; ++index) bytes[index] = next_u8();
      if ((iteration % 11u) == 0u && length >= 8) {
        memcpy(bytes, "HMG4R2\0\0", 8);
      }
      result = hmg4v23_validate_response_frame(
          (iteration % 4u) + 1u, (hmg4v23_span){bytes, length},
          (iteration & 4u) != 0u ? bases[2].fields.sequence_zero_record_sha256
                                 : NULL,
          &view);
      if (!response_result_is_bounded(result)) return 2;
      checksum ^= ((uint64_t)result << (iteration % 56u)) ^ length;
      random_cases += 1;
    } else if (family == 1) {
      fuzz_fixture *const base = &bases[iteration % BASE_FRAME_COUNT];
      uint8_t *const bytes = storage + (iteration & 1u);
      hmg4v23_response_frame_view view;
      hmg4v23_response_result result;
      const uint8_t *context =
          (base->fields.present_fields & HMG4V23_RESPONSE_HAS_TRANSACTION) != 0
              ? base->fields.sequence_zero_record_sha256
              : NULL;
      size_t mutations = (size_t)(next_u64() % 5u) + 1u;
      size_t index;
      memcpy(bytes, base->frame, base->frame_length);
      for (index = 0; index < mutations; ++index) {
        const size_t offset = (size_t)(next_u64() % base->frame_length);
        bytes[offset] ^= (uint8_t)(next_u8() | 1u);
      }
      if ((iteration % 7u) == 0u &&
          base->frame_length >= HMG4V23_RESPONSE_HEADER_SIZE) {
        uint8_t payload_hash[32];
        const size_t payload_length =
            base->frame_length - HMG4V23_RESPONSE_HEADER_SIZE;
        if (hmg4v23_sha256(
                (hmg4v23_span){bytes + HMG4V23_RESPONSE_HEADER_SIZE,
                               payload_length},
                payload_hash) != HMG4V23_OK) {
          return 3;
        }
        memcpy(bytes + 24, payload_hash, 32);
      }
      result = hmg4v23_validate_response_frame(
          base->fields.operation,
          (hmg4v23_span){bytes, base->frame_length}, context, &view);
      if (!response_result_is_bounded(result)) return 4;
      checksum ^= ((uint64_t)result << (iteration % 48u)) ^ mutations;
      mutated_cases += 1;
    } else {
      fuzz_fixture mutated = bases[iteration % BASE_FRAME_COUNT];
      hmg4v23_response_result result;
      size_t output_length = 0;
      const uint32_t selector = (uint32_t)(next_u64() % 10u);
      if (selector == 0) mutated.fields.operation = (uint32_t)next_u64();
      if (selector == 1) mutated.fields.status = (uint32_t)next_u64();
      if (selector == 2) mutated.fields.diagnostic_code = (uint32_t)next_u64();
      if (selector == 3) mutated.fields.present_fields = (uint32_t)next_u64();
      if (selector == 4) mutated.fields.capability_state = (uint32_t)next_u64();
      if (selector == 5) mutated.fields.terminal_state = (uint32_t)next_u64();
      if (selector == 6) memset(mutated.fields.transaction_id, 0, 32);
      if (selector == 7) memset(mutated.fields.journal_sha256, 0, 32);
      if (selector == 8) memset(mutated.fields.observed_current_set_sha256, 0, 32);
      if (selector == 9) {
        mutated.fields.journal_leaf =
            (hmg4v23_span){storage, (size_t)(next_u64() % 300u)};
      }
      result = hmg4v23_encode_response_frame(
          &mutated.fields, encode_storage, sizeof(encode_storage),
          &output_length);
      if (!response_result_is_bounded(result)) return 5;
      checksum ^= ((uint64_t)result << (iteration % 40u)) ^ output_length;
      field_cases += 1;
    }
  }
  (void)printf(
      "response_codec_fuzz: total=%u random=%u mutated=%u fields=%u checksum=%016llx\n",
      FUZZ_CASES, random_cases, mutated_cases, field_cases,
      (unsigned long long)checksum);
  return 0;
}
