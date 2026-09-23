#include "request_transport_core.h"

#include <CommonCrypto/CommonDigest.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static uint64_t state = UINT64_C(0x620a41dcf49a884a);

static uint32_t next_u32(void) {
  state ^= state << 13;
  state ^= state >> 7;
  state ^= state << 17;
  return (uint32_t)(state >> 16);
}

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

int main(void) {
  const hmg4v23_io_errno_symbols symbols = {4, 35, 35};
  uint8_t bytes[512];
  size_t iteration;
  for (iteration = 0; iteration < 300000; ++iteration) {
    size_t length = (size_t)(next_u32() % (uint32_t)sizeof(bytes));
    size_t index;
    hmg4v23_request_header header;
    hmg4v23_request_frame frame;
    hmg4v23_io_decision decision;
    uint64_t time_value;
    int timeout;
    for (index = 0; index < length; ++index) bytes[index] = (uint8_t)next_u32();
    if ((iteration % 17) == 0) {
      size_t payload_length;
      if (length < 56) length = 56;
      payload_length = length - 56;
      memset(bytes, 0, 56);
      memcpy(bytes, "HMG4V2", 6);
      put_u32(bytes + 8, 2);
      put_u32(bytes + 12, (next_u32() % 4) + 1);
      put_u64(bytes + 16, payload_length);
      CC_SHA256(bytes + 56, (CC_LONG)payload_length, bytes + 24);
    }
    if (length >= 56) {
      (void)hmg4v23_parse_request_header((hmg4v23_span){bytes, 56}, &header);
    }
    (void)hmg4v23_validate_buffered_request_frame(
        (hmg4v23_span){bytes, length}, &frame);
    (void)hmg4v23_request_read_decide(
        &symbols, (hmg4v23_read_phase)((next_u32() % 5) + 1),
        (int)(next_u32() & 1), (int64_t)(int32_t)next_u32(),
        (int)(next_u32() % 64), (size_t)(next_u32() % 1024), &decision);
    (void)hmg4v23_response_write_decide(
        &symbols, (int)(next_u32() & 1), (int64_t)(int32_t)next_u32(),
        (int)(next_u32() % 64), (size_t)(next_u32() % 1024), &decision);
    (void)hmg4v23_diagnostic_write_decide(
        &symbols, (int)(next_u32() & 1), (int64_t)(int32_t)next_u32(),
        (int)(next_u32() % 64), &decision);
    (void)hmg4v23_timespec_parts_to_ns(
        (uint64_t)next_u32(), (int64_t)(int32_t)next_u32(), &time_value);
    (void)hmg4v23_deadline_from_start(
        ((uint64_t)next_u32() << 32) | next_u32(),
        (uint64_t)next_u32(), &time_value);
    (void)hmg4v23_poll_timeout_ms(
        (uint64_t)next_u32(), (uint64_t)next_u32(), &timeout);
    (void)hmg4v23_transport_result_name(
        (hmg4v23_transport_result)(next_u32() % 16));
  }
  puts("request-transport-core fuzz cases=300000");
  return 0;
}
