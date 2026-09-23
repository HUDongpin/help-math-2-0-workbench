#include "request_transport_core.h"

#include <CommonCrypto/CommonDigest.h>
#include <limits.h>
#include <string.h>

static const uint8_t request_magic[8] = {
    'H', 'M', 'G', '4', 'V', '2', 0, 0};

static int span_pointer_is_valid(hmg4v21_span span) {
  return span.length == 0 || span.bytes != NULL;
}

static int errno_symbols_are_valid(const hmg4v21_io_errno_symbols *symbols) {
  return symbols != NULL && symbols->eintr_value > 0 &&
         symbols->eagain_value > 0 && symbols->ewouldblock_value > 0 &&
         symbols->eintr_value != symbols->eagain_value &&
         symbols->eintr_value != symbols->ewouldblock_value;
}

static int errno_is_again(const hmg4v21_io_errno_symbols *symbols,
                          int error_value) {
  return error_value == symbols->eagain_value ||
         error_value == symbols->ewouldblock_value;
}

int hmg4v21_checked_add_u64(uint64_t left, uint64_t right, uint64_t *result) {
  if (result == NULL || left > UINT64_MAX - right) return 0;
  *result = left + right;
  return 1;
}

hmg4v21_transport_result hmg4v21_timespec_parts_to_ns(
    uint64_t seconds,
    int64_t nanoseconds,
    uint64_t *result) {
  uint64_t seconds_ns;
  if (result == NULL) return HMG4V21_TRANSPORT_NULL_ARGUMENT;
  if (nanoseconds < 0 || nanoseconds >= INT64_C(1000000000) ||
      seconds > UINT64_MAX / UINT64_C(1000000000)) {
    return HMG4V21_TRANSPORT_TIME_INVALID;
  }
  seconds_ns = seconds * UINT64_C(1000000000);
  if (!hmg4v21_checked_add_u64(seconds_ns, (uint64_t)nanoseconds, result)) {
    return HMG4V21_TRANSPORT_TIME_INVALID;
  }
  return HMG4V21_TRANSPORT_OK;
}

hmg4v21_transport_result hmg4v21_deadline_from_start(
    uint64_t start_ns,
    uint64_t duration_ns,
    uint64_t *deadline_ns) {
  if (deadline_ns == NULL) return HMG4V21_TRANSPORT_NULL_ARGUMENT;
  return hmg4v21_checked_add_u64(start_ns, duration_ns, deadline_ns)
             ? HMG4V21_TRANSPORT_OK
             : HMG4V21_TRANSPORT_TIME_INVALID;
}

hmg4v21_transport_result hmg4v21_poll_timeout_ms(
    uint64_t now_ns,
    uint64_t deadline_ns,
    int *timeout_ms) {
  uint64_t remaining;
  uint64_t milliseconds;
  if (timeout_ms == NULL) return HMG4V21_TRANSPORT_NULL_ARGUMENT;
  if (now_ns >= deadline_ns) return HMG4V21_TRANSPORT_TIME_INVALID;
  remaining = deadline_ns - now_ns;
  milliseconds = remaining / UINT64_C(1000000);
  if ((remaining % UINT64_C(1000000)) != 0) ++milliseconds;
  *timeout_ms = milliseconds > (uint64_t)INT_MAX ? INT_MAX : (int)milliseconds;
  return HMG4V21_TRANSPORT_OK;
}

hmg4v21_transport_result hmg4v21_parse_request_header(
    hmg4v21_span header_bytes,
    hmg4v21_request_header *result) {
  if (result == NULL || !span_pointer_is_valid(header_bytes)) {
    return HMG4V21_TRANSPORT_NULL_ARGUMENT;
  }
  if (header_bytes.length != HMG4V21_REQUEST_HEADER_SIZE) {
    return HMG4V21_TRANSPORT_HEADER_LENGTH_INVALID;
  }
  if (memcmp(header_bytes.bytes, request_magic, sizeof(request_magic)) != 0) {
    return HMG4V21_TRANSPORT_MAGIC_INVALID;
  }
  if (hmg4v21_read_u32_be(header_bytes.bytes + 8) != 2) {
    return HMG4V21_TRANSPORT_VERSION_INVALID;
  }
  result->operation = hmg4v21_read_u32_be(header_bytes.bytes + 12);
  if (result->operation < 1 || result->operation > 4) {
    return HMG4V21_TRANSPORT_OPERATION_INVALID;
  }
  result->payload_length = hmg4v21_read_u64_be(header_bytes.bytes + 16);
  if (result->payload_length > HMG4V21_REQUEST_MAX_PAYLOAD) {
    return HMG4V21_TRANSPORT_PAYLOAD_TOO_LARGE;
  }
  memcpy(result->payload_sha256, header_bytes.bytes + 24,
         sizeof(result->payload_sha256));
  return HMG4V21_TRANSPORT_OK;
}

hmg4v21_transport_result hmg4v21_validate_buffered_request_frame(
    hmg4v21_span complete_frame,
    hmg4v21_request_frame *result) {
  hmg4v21_transport_result parsed;
  size_t expected_length;
  uint8_t payload_hash[CC_SHA256_DIGEST_LENGTH];
  if (result == NULL || !span_pointer_is_valid(complete_frame)) {
    return HMG4V21_TRANSPORT_NULL_ARGUMENT;
  }
  if (complete_frame.length < HMG4V21_REQUEST_HEADER_SIZE) {
    return HMG4V21_TRANSPORT_HEADER_LENGTH_INVALID;
  }
  parsed = hmg4v21_parse_request_header(
      (hmg4v21_span){complete_frame.bytes, HMG4V21_REQUEST_HEADER_SIZE},
      &result->header);
  if (parsed != HMG4V21_TRANSPORT_OK) return parsed;
  if (result->header.payload_length > (uint64_t)SIZE_MAX ||
      !hmg4v21_checked_add_size(HMG4V21_REQUEST_HEADER_SIZE,
                               (size_t)result->header.payload_length,
                               &expected_length)) {
    return HMG4V21_TRANSPORT_REPRESENTATION_INVALID;
  }
  if (complete_frame.length != expected_length) {
    return HMG4V21_TRANSPORT_FRAME_LENGTH_INVALID;
  }
  result->complete_frame = complete_frame;
  result->payload = (hmg4v21_span){
      complete_frame.bytes + HMG4V21_REQUEST_HEADER_SIZE,
      (size_t)result->header.payload_length};
  if (CC_SHA256(result->payload.bytes, (CC_LONG)result->payload.length,
                payload_hash) == NULL ||
      CC_SHA256(complete_frame.bytes, (CC_LONG)complete_frame.length,
                result->request_frame_sha256) == NULL) {
    return HMG4V21_TRANSPORT_REPRESENTATION_INVALID;
  }
  if (memcmp(payload_hash, result->header.payload_sha256,
             sizeof(payload_hash)) != 0) {
    return HMG4V21_TRANSPORT_PAYLOAD_HASH_INVALID;
  }
  return HMG4V21_TRANSPORT_OK;
}

hmg4v21_transport_result hmg4v21_request_read_decide(
    const hmg4v21_io_errno_symbols *symbols,
    hmg4v21_read_phase phase,
    int post_at_or_after_deadline,
    int64_t read_result,
    int read_errno,
    size_t requested_bytes,
    hmg4v21_io_decision *decision) {
  if (!errno_symbols_are_valid(symbols) || decision == NULL) {
    return HMG4V21_TRANSPORT_NULL_ARGUMENT;
  }
  if (phase < HMG4V21_READ_PHASE_HEADER ||
      phase > HMG4V21_READ_PHASE_EOF_PROBE || requested_bytes == 0) {
    return HMG4V21_TRANSPORT_REPRESENTATION_INVALID;
  }
  if (post_at_or_after_deadline) {
    *decision = HMG4V21_IO_DEADLINE;
    return HMG4V21_TRANSPORT_OK;
  }
  if (read_result == -1) {
    if (read_errno == symbols->eintr_value) {
      *decision = HMG4V21_IO_RETRY_DIRECT;
    } else if (errno_is_again(symbols, read_errno)) {
      *decision = HMG4V21_IO_POLL;
    } else {
      *decision = HMG4V21_IO_TRANSPORT_ERROR;
    }
    return HMG4V21_TRANSPORT_OK;
  }
  if (read_result < -1 || (uint64_t)read_result > (uint64_t)requested_bytes) {
    *decision = HMG4V21_IO_REPRESENTATION_ERROR;
    return HMG4V21_TRANSPORT_OK;
  }
  if (read_result == 0) {
    *decision = phase == HMG4V21_READ_PHASE_HEADER
                    ? HMG4V21_IO_INVALID_INCOMPLETE_HEADER
                : phase == HMG4V21_READ_PHASE_PAYLOAD
                    ? HMG4V21_IO_PAYLOAD_TRUNCATED
                    : HMG4V21_IO_EOF_CONFIRMED;
    return HMG4V21_TRANSPORT_OK;
  }
  *decision = phase == HMG4V21_READ_PHASE_EOF_PROBE
                  ? HMG4V21_IO_TRAILING_OR_SECOND_FRAME
                  : HMG4V21_IO_ADVANCE;
  return HMG4V21_TRANSPORT_OK;
}

hmg4v21_transport_result hmg4v21_response_write_decide(
    const hmg4v21_io_errno_symbols *symbols,
    int post_at_or_after_deadline,
    int64_t write_result,
    int write_errno,
    size_t remaining_bytes,
    hmg4v21_io_decision *decision) {
  if (!errno_symbols_are_valid(symbols) || decision == NULL) {
    return HMG4V21_TRANSPORT_NULL_ARGUMENT;
  }
  if (remaining_bytes == 0) return HMG4V21_TRANSPORT_REPRESENTATION_INVALID;
  if (post_at_or_after_deadline) {
    *decision = HMG4V21_IO_DEADLINE;
    return HMG4V21_TRANSPORT_OK;
  }
  if (write_result == -1) {
    if (write_errno == symbols->eintr_value) {
      *decision = HMG4V21_IO_RETRY_DIRECT;
    } else if (errno_is_again(symbols, write_errno)) {
      *decision = HMG4V21_IO_POLL;
    } else {
      *decision = HMG4V21_IO_TRANSPORT_ERROR;
    }
    return HMG4V21_TRANSPORT_OK;
  }
  if (write_result <= 0 || (uint64_t)write_result > (uint64_t)remaining_bytes) {
    *decision = write_result < -1 ||
                        (write_result > 0 &&
                         (uint64_t)write_result > (uint64_t)remaining_bytes)
                    ? HMG4V21_IO_REPRESENTATION_ERROR
                    : HMG4V21_IO_TRANSPORT_ERROR;
    return HMG4V21_TRANSPORT_OK;
  }
  *decision = (uint64_t)write_result == (uint64_t)remaining_bytes
                  ? HMG4V21_IO_WRITE_COMPLETE
                  : HMG4V21_IO_ADVANCE;
  return HMG4V21_TRANSPORT_OK;
}

hmg4v21_transport_result hmg4v21_diagnostic_write_decide(
    const hmg4v21_io_errno_symbols *symbols,
    int post_at_or_after_deadline,
    int64_t write_result,
    int write_errno,
    hmg4v21_io_decision *decision) {
  if (!errno_symbols_are_valid(symbols) || decision == NULL) {
    return HMG4V21_TRANSPORT_NULL_ARGUMENT;
  }
  if (post_at_or_after_deadline) {
    *decision = HMG4V21_IO_DIAGNOSTIC_ABANDONED;
  } else if (write_result == -1 && write_errno == symbols->eintr_value) {
    *decision = HMG4V21_IO_RETRY_DIRECT;
  } else if (write_result == (int64_t)HMG4V21_INVALID_HEADER_TOKEN_SIZE) {
    *decision = HMG4V21_IO_WRITE_COMPLETE;
  } else {
    *decision = HMG4V21_IO_DIAGNOSTIC_ABANDONED;
  }
  return HMG4V21_TRANSPORT_OK;
}

const char *hmg4v21_transport_result_name(hmg4v21_transport_result result) {
  static const char *const names[] = {
      "OK", "NULL_ARGUMENT", "HEADER_LENGTH_INVALID", "MAGIC_INVALID",
      "VERSION_INVALID", "OPERATION_INVALID", "PAYLOAD_TOO_LARGE",
      "FRAME_LENGTH_INVALID", "PAYLOAD_HASH_INVALID",
      "REPRESENTATION_INVALID", "TIME_INVALID"};
  const size_t ordinal = (size_t)result;
  return ordinal < sizeof(names) / sizeof(names[0])
             ? names[ordinal]
             : "UNKNOWN_TRANSPORT_RESULT";
}
