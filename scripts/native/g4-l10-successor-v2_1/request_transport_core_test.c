#include "request_transport_core.h"

#include <CommonCrypto/CommonDigest.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static unsigned assertions = 0;
#define CHECK(condition) do { assertions++; if (!(condition)) {                 \
  fprintf(stderr, "assertion failed at %s:%d: %s\n", __FILE__, __LINE__,       \
          #condition); exit(1); } } while (0)

static void put_u32(uint8_t bytes[4], uint32_t value) {
  bytes[0] = (uint8_t)(value >> 24);
  bytes[1] = (uint8_t)(value >> 16);
  bytes[2] = (uint8_t)(value >> 8);
  bytes[3] = (uint8_t)value;
}

static void put_u64(uint8_t bytes[8], uint64_t value) {
  put_u32(bytes, (uint32_t)(value >> 32));
  put_u32(bytes + 4, (uint32_t)value);
}

static void build_header(uint8_t header[56], uint32_t operation,
                         uint64_t payload_length, const uint8_t digest[32]) {
  memset(header, 0, 56);
  memcpy(header, "HMG4V2", 6);
  put_u32(header + 8, 2);
  put_u32(header + 12, operation);
  put_u64(header + 16, payload_length);
  memcpy(header + 24, digest, 32);
}

static void test_header_and_frame(void) {
  uint8_t digest[32];
  uint8_t frame_digest[32];
  uint8_t frame[59];
  hmg4v21_request_header header;
  hmg4v21_request_frame parsed;
  CC_SHA256("abc", 3, digest);
  build_header(frame, 3, 3, digest);
  memcpy(frame + 56, "abc", 3);
  CHECK(hmg4v21_parse_request_header(
      (hmg4v21_span){frame, 56}, &header) == HMG4V21_TRANSPORT_OK);
  CHECK(header.operation == 3 && header.payload_length == 3);
  CHECK(memcmp(header.payload_sha256, digest, 32) == 0);
  CHECK(hmg4v21_validate_buffered_request_frame(
      (hmg4v21_span){frame, sizeof(frame)}, &parsed) == HMG4V21_TRANSPORT_OK);
  CHECK(parsed.complete_frame.length == 59 && parsed.payload.length == 3);
  CHECK(memcmp(parsed.payload.bytes, "abc", 3) == 0);
  CC_SHA256(frame, sizeof(frame), frame_digest);
  CHECK(memcmp(parsed.request_frame_sha256, frame_digest, 32) == 0);

  CHECK(hmg4v21_parse_request_header(
      (hmg4v21_span){frame, 55}, &header) ==
      HMG4V21_TRANSPORT_HEADER_LENGTH_INVALID);
  frame[0] = 'X';
  CHECK(hmg4v21_parse_request_header(
      (hmg4v21_span){frame, 56}, &header) == HMG4V21_TRANSPORT_MAGIC_INVALID);
  frame[0] = 'H';
  put_u32(frame + 8, 1);
  CHECK(hmg4v21_parse_request_header(
      (hmg4v21_span){frame, 56}, &header) == HMG4V21_TRANSPORT_VERSION_INVALID);
  put_u32(frame + 8, 2);
  put_u32(frame + 12, 0);
  CHECK(hmg4v21_parse_request_header(
      (hmg4v21_span){frame, 56}, &header) == HMG4V21_TRANSPORT_OPERATION_INVALID);
  put_u32(frame + 12, 5);
  CHECK(hmg4v21_parse_request_header(
      (hmg4v21_span){frame, 56}, &header) == HMG4V21_TRANSPORT_OPERATION_INVALID);
  put_u32(frame + 12, 1);
  put_u64(frame + 16, HMG4V21_REQUEST_MAX_PAYLOAD);
  CHECK(hmg4v21_parse_request_header(
      (hmg4v21_span){frame, 56}, &header) == HMG4V21_TRANSPORT_OK);
  put_u64(frame + 16, HMG4V21_REQUEST_MAX_PAYLOAD + 1);
  CHECK(hmg4v21_parse_request_header(
      (hmg4v21_span){frame, 56}, &header) ==
      HMG4V21_TRANSPORT_PAYLOAD_TOO_LARGE);

  build_header(frame, 3, 3, digest);
  memcpy(frame + 56, "abc", 3);
  CHECK(hmg4v21_validate_buffered_request_frame(
      (hmg4v21_span){frame, 58}, &parsed) ==
      HMG4V21_TRANSPORT_FRAME_LENGTH_INVALID);
  frame[58] ^= 1;
  CHECK(hmg4v21_validate_buffered_request_frame(
      (hmg4v21_span){frame, 59}, &parsed) ==
      HMG4V21_TRANSPORT_PAYLOAD_HASH_INVALID);
  CHECK(hmg4v21_validate_buffered_request_frame(
      (hmg4v21_span){NULL, 1}, &parsed) == HMG4V21_TRANSPORT_NULL_ARGUMENT);
  CHECK(hmg4v21_parse_request_header(
      (hmg4v21_span){frame, 56}, NULL) == HMG4V21_TRANSPORT_NULL_ARGUMENT);
}

static void test_time_arithmetic(void) {
  uint64_t value;
  int timeout;
  CHECK(hmg4v21_checked_add_u64(5, 7, &value) && value == 12);
  CHECK(!hmg4v21_checked_add_u64(UINT64_MAX, 1, &value));
  CHECK(!hmg4v21_checked_add_u64(1, 1, NULL));
  CHECK(hmg4v21_timespec_parts_to_ns(2, 3, &value) ==
        HMG4V21_TRANSPORT_OK && value == UINT64_C(2000000003));
  CHECK(hmg4v21_timespec_parts_to_ns(0, -1, &value) ==
        HMG4V21_TRANSPORT_TIME_INVALID);
  CHECK(hmg4v21_timespec_parts_to_ns(0, INT64_C(1000000000), &value) ==
        HMG4V21_TRANSPORT_TIME_INVALID);
  CHECK(hmg4v21_timespec_parts_to_ns(UINT64_MAX, 0, &value) ==
        HMG4V21_TRANSPORT_TIME_INVALID);
  CHECK(hmg4v21_deadline_from_start(1, HMG4V21_REQUEST_DEADLINE_NS, &value) ==
        HMG4V21_TRANSPORT_OK && value == HMG4V21_REQUEST_DEADLINE_NS + 1);
  CHECK(hmg4v21_deadline_from_start(UINT64_MAX, 1, &value) ==
        HMG4V21_TRANSPORT_TIME_INVALID);
  CHECK(hmg4v21_poll_timeout_ms(9, 10, &timeout) == HMG4V21_TRANSPORT_OK &&
        timeout == 1);
  CHECK(hmg4v21_poll_timeout_ms(0, 1000000, &timeout) == HMG4V21_TRANSPORT_OK &&
        timeout == 1);
  CHECK(hmg4v21_poll_timeout_ms(0, 1000001, &timeout) == HMG4V21_TRANSPORT_OK &&
        timeout == 2);
  CHECK(hmg4v21_poll_timeout_ms(0, UINT64_MAX, &timeout) ==
        HMG4V21_TRANSPORT_OK && timeout == INT_MAX);
  CHECK(hmg4v21_poll_timeout_ms(10, 10, &timeout) ==
        HMG4V21_TRANSPORT_TIME_INVALID);
  CHECK(hmg4v21_poll_timeout_ms(11, 10, &timeout) ==
        HMG4V21_TRANSPORT_TIME_INVALID);
}

static void read_case(const hmg4v21_io_errno_symbols *symbols,
                      hmg4v21_read_phase phase, int deadline, int64_t result,
                      int error_value, size_t requested,
                      hmg4v21_io_decision expected) {
  hmg4v21_io_decision actual = 0;
  CHECK(hmg4v21_request_read_decide(symbols, phase, deadline, result,
                                    error_value, requested, &actual) ==
        HMG4V21_TRANSPORT_OK);
  CHECK(actual == expected);
}

static void write_case(const hmg4v21_io_errno_symbols *symbols,
                       int deadline, int64_t result, int error_value,
                       size_t remaining, hmg4v21_io_decision expected) {
  hmg4v21_io_decision actual = 0;
  CHECK(hmg4v21_response_write_decide(symbols, deadline, result, error_value,
                                      remaining, &actual) ==
        HMG4V21_TRANSPORT_OK);
  CHECK(actual == expected);
}

static void diagnostic_case(const hmg4v21_io_errno_symbols *symbols,
                            int deadline, int64_t result, int error_value,
                            hmg4v21_io_decision expected) {
  hmg4v21_io_decision actual = 0;
  CHECK(hmg4v21_diagnostic_write_decide(symbols, deadline, result,
                                        error_value, &actual) ==
        HMG4V21_TRANSPORT_OK);
  CHECK(actual == expected);
}

static void test_io_decisions(void) {
  const hmg4v21_io_errno_symbols symbols = {4, 35, 35};
  hmg4v21_io_errno_symbols invalid = symbols;
  hmg4v21_io_decision decision;
  read_case(&symbols, HMG4V21_READ_PHASE_HEADER, 1, 10, 0, 10,
            HMG4V21_IO_DEADLINE);
  read_case(&symbols, HMG4V21_READ_PHASE_HEADER, 0, -1, 4, 10,
            HMG4V21_IO_RETRY_DIRECT);
  read_case(&symbols, HMG4V21_READ_PHASE_HEADER, 0, -1, 35, 10,
            HMG4V21_IO_POLL);
  read_case(&symbols, HMG4V21_READ_PHASE_HEADER, 0, -1, 5, 10,
            HMG4V21_IO_TRANSPORT_ERROR);
  read_case(&symbols, HMG4V21_READ_PHASE_HEADER, 0, 0, 0, 10,
            HMG4V21_IO_INVALID_INCOMPLETE_HEADER);
  read_case(&symbols, HMG4V21_READ_PHASE_PAYLOAD, 0, 0, 0, 10,
            HMG4V21_IO_PAYLOAD_TRUNCATED);
  read_case(&symbols, HMG4V21_READ_PHASE_EOF_PROBE, 0, 0, 0, 1,
            HMG4V21_IO_EOF_CONFIRMED);
  read_case(&symbols, HMG4V21_READ_PHASE_HEADER, 0, 5, 0, 10,
            HMG4V21_IO_ADVANCE);
  read_case(&symbols, HMG4V21_READ_PHASE_PAYLOAD, 0, 10, 0, 10,
            HMG4V21_IO_ADVANCE);
  read_case(&symbols, HMG4V21_READ_PHASE_EOF_PROBE, 0, 1, 0, 1,
            HMG4V21_IO_TRAILING_OR_SECOND_FRAME);
  read_case(&symbols, HMG4V21_READ_PHASE_HEADER, 0, 11, 0, 10,
            HMG4V21_IO_REPRESENTATION_ERROR);
  read_case(&symbols, HMG4V21_READ_PHASE_HEADER, 0, -2, 0, 10,
            HMG4V21_IO_REPRESENTATION_ERROR);

  write_case(&symbols, 1, 5, 0, 10, HMG4V21_IO_DEADLINE);
  write_case(&symbols, 0, -1, 4, 10, HMG4V21_IO_RETRY_DIRECT);
  write_case(&symbols, 0, -1, 35, 10, HMG4V21_IO_POLL);
  write_case(&symbols, 0, -1, 5, 10, HMG4V21_IO_TRANSPORT_ERROR);
  write_case(&symbols, 0, 0, 0, 10, HMG4V21_IO_TRANSPORT_ERROR);
  write_case(&symbols, 0, 5, 0, 10, HMG4V21_IO_ADVANCE);
  write_case(&symbols, 0, 10, 0, 10, HMG4V21_IO_WRITE_COMPLETE);
  write_case(&symbols, 0, 11, 0, 10, HMG4V21_IO_REPRESENTATION_ERROR);

  diagnostic_case(&symbols, 1, 21, 0, HMG4V21_IO_DIAGNOSTIC_ABANDONED);
  diagnostic_case(&symbols, 0, -1, 4, HMG4V21_IO_RETRY_DIRECT);
  diagnostic_case(&symbols, 0, 21, 0, HMG4V21_IO_WRITE_COMPLETE);
  diagnostic_case(&symbols, 0, 20, 0, HMG4V21_IO_DIAGNOSTIC_ABANDONED);
  diagnostic_case(&symbols, 0, -1, 35, HMG4V21_IO_DIAGNOSTIC_ABANDONED);
  diagnostic_case(&symbols, 0, 22, 0, HMG4V21_IO_DIAGNOSTIC_ABANDONED);

  invalid.eintr_value = 35;
  CHECK(hmg4v21_request_read_decide(&invalid, HMG4V21_READ_PHASE_HEADER,
      0, 0, 0, 1, &decision) == HMG4V21_TRANSPORT_NULL_ARGUMENT);
  CHECK(hmg4v21_request_read_decide(&symbols, (hmg4v21_read_phase)4,
      0, 0, 0, 1, &decision) == HMG4V21_TRANSPORT_REPRESENTATION_INVALID);
  CHECK(hmg4v21_request_read_decide(&symbols, HMG4V21_READ_PHASE_HEADER,
      0, 0, 0, 0, &decision) == HMG4V21_TRANSPORT_REPRESENTATION_INVALID);
  CHECK(hmg4v21_response_write_decide(&symbols, 0, 0, 0, 0, &decision) ==
        HMG4V21_TRANSPORT_REPRESENTATION_INVALID);
}

static void test_result_names(void) {
  unsigned value;
  for (value = 0; value <= (unsigned)HMG4V21_TRANSPORT_TIME_INVALID; ++value) {
    CHECK(strcmp(hmg4v21_transport_result_name((hmg4v21_transport_result)value),
                 "UNKNOWN_TRANSPORT_RESULT") != 0);
  }
  CHECK(strcmp(hmg4v21_transport_result_name((hmg4v21_transport_result)999),
               "UNKNOWN_TRANSPORT_RESULT") == 0);
}

int main(void) {
  test_header_and_frame();
  test_time_arithmetic();
  test_io_decisions();
  test_result_names();
  printf("request-transport-core assertions=%u\n", assertions);
  return 0;
}
