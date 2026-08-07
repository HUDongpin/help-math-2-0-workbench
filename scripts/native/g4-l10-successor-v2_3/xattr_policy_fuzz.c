#include "xattr_policy.h"

#include <CommonCrypto/CommonDigest.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static void put_u16(uint8_t bytes[2], uint16_t value) {
  bytes[0] = (uint8_t)(value >> 8);
  bytes[1] = (uint8_t)value;
}

static void put_u32(uint8_t bytes[4], uint32_t value) {
  bytes[0] = (uint8_t)(value >> 24);
  bytes[1] = (uint8_t)(value >> 16);
  bytes[2] = (uint8_t)(value >> 8);
  bytes[3] = (uint8_t)value;
}

static void put_u64(uint8_t bytes[8], uint64_t value) {
  bytes[0] = (uint8_t)(value >> 56);
  bytes[1] = (uint8_t)(value >> 48);
  bytes[2] = (uint8_t)(value >> 40);
  bytes[3] = (uint8_t)(value >> 32);
  bytes[4] = (uint8_t)(value >> 24);
  bytes[5] = (uint8_t)(value >> 16);
  bytes[6] = (uint8_t)(value >> 8);
  bytes[7] = (uint8_t)value;
}

static size_t append_tlv(
    uint8_t *output,
    size_t offset,
    uint16_t tag,
    uint8_t type,
    const uint8_t *value,
    uint32_t length) {
  put_u16(output + offset, tag);
  output[offset + 2] = type;
  output[offset + 3] = 0;
  put_u32(output + offset + 4, length);
  if (length > 0) memcpy(output + offset + 8, value, length);
  return offset + 8 + (size_t)length;
}

static size_t append_u32(
    uint8_t *output, size_t offset, uint16_t tag, uint32_t value) {
  uint8_t bytes[4];
  put_u32(bytes, value);
  return append_tlv(output, offset, tag, HMG4V23_TLV_U32, bytes, 4);
}

static size_t append_u64(
    uint8_t *output, size_t offset, uint16_t tag, uint64_t value) {
  uint8_t bytes[8];
  put_u64(bytes, value);
  return append_tlv(output, offset, tag, HMG4V23_TLV_U64, bytes, 8);
}

static size_t make_empty_policy(uint8_t frame[512], uint8_t empty_hash[32]) {
  uint8_t empty_stream[16] = {
      0x48, 0x4d, 0x47, 0x34, 0x58, 0x32, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00};
  uint8_t payload[384];
  uint8_t list[4] = {0, 0, 0, 0};
  uint8_t one = 1;
  size_t offset = 0;
  size_t total = 0;
  (void)CC_SHA256(empty_stream, (CC_LONG)sizeof(empty_stream), empty_hash);
  offset = append_tlv(payload, offset, 0x7001, HMG4V23_TLV_SHA256,
                      hmg4v23_successor_sha256, 32);
  offset = append_u32(payload, offset, 0x7002, 2);
  offset = append_u32(payload, offset, 0x7003, 1);
  offset = append_u32(payload, offset, 0x7004, 0);
  offset = append_tlv(payload, offset, 0x7005, HMG4V23_TLV_LIST, list, 4);
  offset = append_tlv(payload, offset, 0x7006, HMG4V23_TLV_SHA256,
                      empty_hash, 32);
  offset = append_u32(payload, offset, 0x7007, 127);
  offset = append_u64(payload, offset, 0x7008, 4096);
  offset = append_u64(payload, offset, 0x7009, 65536);
  offset = append_u64(payload, offset, 0x700a, 524288);
  offset = append_tlv(payload, offset, 0x700b, HMG4V23_TLV_BOOL, &one, 1);
  offset = append_u64(payload, offset, 0x700c, 0);
  memset(frame, 0, 56);
  memcpy(frame, "HMG4Y2", 6);
  put_u32(frame + 8, 2);
  put_u32(frame + 12, 1);
  put_u64(frame + 16, (uint64_t)offset);
  (void)CC_SHA256(payload, (CC_LONG)offset, frame + 24);
  memcpy(frame + 56, payload, offset);
  total = 56 + offset;
  return total;
}

static uint64_t next_random(uint64_t *state) {
  uint64_t value = *state;
  value ^= value << 13;
  value ^= value >> 7;
  value ^= value << 17;
  *state = value;
  return value;
}

int main(void) {
  uint8_t seed[512];
  uint8_t candidate[514];
  uint8_t empty_hash[32];
  uint64_t state = UINT64_C(0xbf0abed59f8db5be);
  uint64_t iteration = 0;
  uint64_t accepted = 0;
  uint64_t rejected = 0;
  size_t seed_length = make_empty_policy(seed, empty_hash);

  for (iteration = 0; iteration < UINT64_C(300000); ++iteration) {
    hmg4v23_xattr_policy_view view;
    hmg4v23_xattr_policy_result result;
    size_t mutation_count = (size_t)(next_random(&state) % 9);
    size_t mutation = 0;
    size_t length = seed_length;
    memcpy(candidate + 1, seed, seed_length);
    candidate[0] = 0xa5;
    candidate[seed_length + 1] = 0x5a;
    for (mutation = 0; mutation < mutation_count; ++mutation) {
      const size_t offset = (size_t)(next_random(&state) % seed_length);
      candidate[1 + offset] ^=
          (uint8_t)(UINT8_C(1) << (next_random(&state) % 8));
    }
    if ((iteration % 17) == 0 && length > 0) --length;
    result = hmg4v23_validate_xattr_policy(
        (hmg4v23_span){candidate + 1, length}, &view);
    if (result == HMG4V23_XATTR_POLICY_OK) {
      if (view.attribute_count != 0 || view.total_value_length != 0 ||
          view.canonical_xattr_set_stream_length != 16 ||
          view.exact_empty_set != 1 ||
          memcmp(view.canonical_xattr_set_sha256, empty_hash, 32) != 0) {
        return 2;
      }
      ++accepted;
    } else {
      ++rejected;
    }
    if (candidate[0] != 0xa5 || candidate[seed_length + 1] != 0x5a) return 3;
  }
  printf("xattr_policy fuzz cases=%llu accepted=%llu rejected=%llu\n",
         (unsigned long long)iteration,
         (unsigned long long)accepted,
         (unsigned long long)rejected);
  return 0;
}
