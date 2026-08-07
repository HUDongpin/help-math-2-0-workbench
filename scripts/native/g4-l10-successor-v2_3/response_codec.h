#ifndef HMG4V23_RESPONSE_CODEC_H
#define HMG4V23_RESPONSE_CODEC_H

#include "canonical_tlv.h"

#include <stddef.h>
#include <stdint.h>

#define HMG4V23_RESPONSE_HEADER_SIZE ((size_t)56)
#define HMG4V23_RESPONSE_MAX_PAYLOAD UINT64_C(16777216)
#define HMG4V23_RESPONSE_MAX_FRAME ((size_t)16777272)

enum {
  HMG4V23_RESPONSE_HAS_TRANSACTION = UINT32_C(1) << 0,
  HMG4V23_RESPONSE_HAS_CURRENT_STATE = UINT32_C(1) << 1,
  HMG4V23_RESPONSE_HAS_CAPABILITY = UINT32_C(1) << 2,
  HMG4V23_RESPONSE_HAS_TERMINAL = UINT32_C(1) << 3
};

typedef enum {
  HMG4V23_RESPONSE_OK = 0,
  HMG4V23_RESPONSE_NULL_ARGUMENT,
  HMG4V23_RESPONSE_OPERATION_INVALID,
  HMG4V23_RESPONSE_STATUS_INVALID,
  HMG4V23_RESPONSE_STATUS_OPERATION_INVALID,
  HMG4V23_RESPONSE_DIAGNOSTIC_INVALID,
  HMG4V23_RESPONSE_PRESENCE_INVALID,
  HMG4V23_RESPONSE_CAPABILITY_INVALID,
  HMG4V23_RESPONSE_CURRENT_STATE_INVALID,
  HMG4V23_RESPONSE_TRANSACTION_INVALID,
  HMG4V23_RESPONSE_JOURNAL_LEAF_INVALID,
  HMG4V23_RESPONSE_TERMINAL_INVALID,
  HMG4V23_RESPONSE_RECEIPT_LEAF_INVALID,
  HMG4V23_RESPONSE_CONTEXT_REQUIRED,
  HMG4V23_RESPONSE_CONTEXT_FORBIDDEN,
  HMG4V23_RESPONSE_OUTPUT_TOO_SMALL,
  HMG4V23_RESPONSE_FRAME_TOO_SHORT,
  HMG4V23_RESPONSE_MAGIC_INVALID,
  HMG4V23_RESPONSE_VERSION_INVALID,
  HMG4V23_RESPONSE_PAYLOAD_TOO_LARGE,
  HMG4V23_RESPONSE_FRAME_LENGTH_INVALID,
  HMG4V23_RESPONSE_PAYLOAD_HASH_INVALID,
  HMG4V23_RESPONSE_TLV_INVALID,
  HMG4V23_RESPONSE_HASH_ENGINE_FAILURE
} hmg4v23_response_result;

typedef struct {
  uint32_t operation;
  uint32_t status;
  uint32_t diagnostic_code;
  uint32_t present_fields;
  uint8_t request_payload_sha256[32];
  uint8_t transaction_id[32];
  hmg4v23_span journal_leaf;
  uint8_t journal_sha256[32];
  uint8_t sequence_zero_record_sha256[32];
  uint8_t observed_current_set_sha256[32];
  hmg4v23_span terminal_receipt_leaf;
  uint8_t terminal_receipt_sha256[32];
  uint32_t terminal_state;
  uint32_t capability_state;
} hmg4v23_response_fields;

typedef struct {
  hmg4v23_response_fields fields;
  hmg4v23_span complete_frame;
  hmg4v23_span payload;
  uint8_t response_frame_sha256[32];
} hmg4v23_response_frame_view;

hmg4v23_response_result hmg4v23_response_payload_length(
    const hmg4v23_response_fields *fields,
    size_t *payload_length);

hmg4v23_response_result hmg4v23_encode_response_frame(
    const hmg4v23_response_fields *fields,
    uint8_t *output,
    size_t output_capacity,
    size_t *output_length);

hmg4v23_response_result hmg4v23_validate_response_frame(
    uint32_t expected_operation,
    hmg4v23_span complete_frame,
    const uint8_t expected_sequence_zero_record_sha256[32],
    hmg4v23_response_frame_view *view);

int hmg4v23_response_exit_code(uint32_t status, int *exit_code);

const char *hmg4v23_response_result_name(hmg4v23_response_result result);

#endif
