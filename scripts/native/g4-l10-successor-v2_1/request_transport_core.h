#ifndef HMG4V21_REQUEST_TRANSPORT_CORE_H
#define HMG4V21_REQUEST_TRANSPORT_CORE_H

#include "contract_core.h"

#include <stddef.h>
#include <stdint.h>

#define HMG4V21_REQUEST_HEADER_SIZE ((size_t)56)
#define HMG4V21_REQUEST_DEADLINE_NS UINT64_C(30000000000)
#define HMG4V21_DIAGNOSTIC_DEADLINE_NS UINT64_C(100000000)

typedef enum {
  HMG4V21_TRANSPORT_OK = 0,
  HMG4V21_TRANSPORT_NULL_ARGUMENT,
  HMG4V21_TRANSPORT_HEADER_LENGTH_INVALID,
  HMG4V21_TRANSPORT_MAGIC_INVALID,
  HMG4V21_TRANSPORT_VERSION_INVALID,
  HMG4V21_TRANSPORT_OPERATION_INVALID,
  HMG4V21_TRANSPORT_PAYLOAD_TOO_LARGE,
  HMG4V21_TRANSPORT_FRAME_LENGTH_INVALID,
  HMG4V21_TRANSPORT_PAYLOAD_HASH_INVALID,
  HMG4V21_TRANSPORT_REPRESENTATION_INVALID,
  HMG4V21_TRANSPORT_TIME_INVALID
} hmg4v21_transport_result;

typedef struct {
  uint32_t operation;
  uint64_t payload_length;
  uint8_t payload_sha256[32];
} hmg4v21_request_header;

typedef struct {
  hmg4v21_request_header header;
  hmg4v21_span complete_frame;
  hmg4v21_span payload;
  uint8_t request_frame_sha256[32];
} hmg4v21_request_frame;

typedef enum {
  HMG4V21_READ_PHASE_HEADER = 1,
  HMG4V21_READ_PHASE_PAYLOAD = 2,
  HMG4V21_READ_PHASE_EOF_PROBE = 3
} hmg4v21_read_phase;

typedef enum {
  HMG4V21_IO_DEADLINE = 1,
  HMG4V21_IO_RETRY_DIRECT,
  HMG4V21_IO_POLL,
  HMG4V21_IO_ADVANCE,
  HMG4V21_IO_INVALID_INCOMPLETE_HEADER,
  HMG4V21_IO_PAYLOAD_TRUNCATED,
  HMG4V21_IO_EOF_CONFIRMED,
  HMG4V21_IO_TRAILING_OR_SECOND_FRAME,
  HMG4V21_IO_TRANSPORT_ERROR,
  HMG4V21_IO_REPRESENTATION_ERROR,
  HMG4V21_IO_WRITE_COMPLETE,
  HMG4V21_IO_DIAGNOSTIC_ABANDONED
} hmg4v21_io_decision;

typedef struct {
  int eintr_value;
  int eagain_value;
  int ewouldblock_value;
} hmg4v21_io_errno_symbols;

int hmg4v21_checked_add_u64(uint64_t left, uint64_t right, uint64_t *result);
hmg4v21_transport_result hmg4v21_timespec_parts_to_ns(
    uint64_t seconds,
    int64_t nanoseconds,
    uint64_t *result);
hmg4v21_transport_result hmg4v21_deadline_from_start(
    uint64_t start_ns,
    uint64_t duration_ns,
    uint64_t *deadline_ns);
hmg4v21_transport_result hmg4v21_poll_timeout_ms(
    uint64_t now_ns,
    uint64_t deadline_ns,
    int *timeout_ms);

hmg4v21_transport_result hmg4v21_parse_request_header(
    hmg4v21_span header_bytes,
    hmg4v21_request_header *result);
hmg4v21_transport_result hmg4v21_validate_buffered_request_frame(
    hmg4v21_span complete_frame,
    hmg4v21_request_frame *result);

hmg4v21_transport_result hmg4v21_request_read_decide(
    const hmg4v21_io_errno_symbols *symbols,
    hmg4v21_read_phase phase,
    int post_at_or_after_deadline,
    int64_t read_result,
    int read_errno,
    size_t requested_bytes,
    hmg4v21_io_decision *decision);
hmg4v21_transport_result hmg4v21_response_write_decide(
    const hmg4v21_io_errno_symbols *symbols,
    int post_at_or_after_deadline,
    int64_t write_result,
    int write_errno,
    size_t remaining_bytes,
    hmg4v21_io_decision *decision);
hmg4v21_transport_result hmg4v21_diagnostic_write_decide(
    const hmg4v21_io_errno_symbols *symbols,
    int post_at_or_after_deadline,
    int64_t write_result,
    int write_errno,
    hmg4v21_io_decision *decision);

const char *hmg4v21_transport_result_name(hmg4v21_transport_result result);

#endif
