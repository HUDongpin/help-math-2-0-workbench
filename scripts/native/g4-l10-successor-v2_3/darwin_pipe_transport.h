#ifndef HMG4V23_DARWIN_PIPE_TRANSPORT_H
#define HMG4V23_DARWIN_PIPE_TRANSPORT_H

#include "request_transport_core.h"
#include "response_codec.h"

#include <stddef.h>
#include <stdint.h>

typedef enum {
  HMG4V23_PIPE_OK = 0,
  HMG4V23_PIPE_NULL_ARGUMENT,
  HMG4V23_PIPE_SIGPIPE_BOOTSTRAP_FAILED,
  HMG4V23_PIPE_UNFRAMED_INVALID_HEADER,
  HMG4V23_PIPE_REQUEST_PAYLOAD_TRUNCATED,
  HMG4V23_PIPE_REQUEST_PAYLOAD_HASH_MISMATCH,
  HMG4V23_PIPE_REQUEST_TRANSPORT_ERROR,
  HMG4V23_PIPE_REQUEST_TRAILING_OR_SECOND_FRAME,
  HMG4V23_PIPE_REQUEST_DEADLINE_EXCEEDED,
  HMG4V23_PIPE_REPRESENTATION_FAILURE,
  HMG4V23_PIPE_ALLOCATION_FAILURE,
  HMG4V23_PIPE_SHA256_ENGINE_FAILURE,
  HMG4V23_PIPE_RESPONSE_FRAME_INVALID,
  HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED
} hmg4v23_pipe_result;

typedef struct {
  uint8_t *owned_frame_bytes;
  size_t owned_frame_length;
  hmg4v23_request_header header;
  hmg4v23_request_frame frame;
  int fixed_header_valid;
  int invalid_header_token_completed;
} hmg4v23_received_request;

/*
 * This must be called only after the two-pass startup FD attestation succeeds.
 * It installs SIG_IGN with sigaction and verifies the resulting disposition.
 */
hmg4v23_pipe_result hmg4v23_install_and_verify_sigpipe_ignore(void);

/*
 * Receives exactly one request from FD 0. On an unframed invalid-header result
 * it internally makes the sole permitted best-effort FD-2 token attempt.
 * No pathname or filesystem object is opened by this module.
 */
hmg4v23_pipe_result hmg4v23_receive_request_fd0(
    hmg4v23_received_request *request);

void hmg4v23_release_received_request(
    hmg4v23_received_request *request);

/*
 * Validates and emits exactly one HMG4R2 frame to FD 1. The caller owns the
 * higher-level proof that all filesystem activity has stopped before entry.
 * Any failure emits no second frame and maps to process exit 74.
 */
hmg4v23_pipe_result hmg4v23_emit_response_fd1(
    uint32_t expected_operation,
    hmg4v23_span response_frame,
    const uint8_t expected_sequence_zero_record_sha256[32]);

uint32_t hmg4v23_pipe_result_diagnostic_code(
    hmg4v23_pipe_result result);
int hmg4v23_pipe_result_exit_code(
    hmg4v23_pipe_result result,
    int success_response_exit_code);
const char *hmg4v23_pipe_result_name(hmg4v23_pipe_result result);

#endif
