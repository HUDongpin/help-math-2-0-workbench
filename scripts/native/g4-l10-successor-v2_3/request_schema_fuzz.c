#include "request_schema.h"

#include <stdint.h>
#include <stdio.h>
#include <string.h>

static uint64_t state = UINT64_C(0x9b2d4328f5032cc6);

static uint32_t next_u32(void) {
  state ^= state << 13;
  state ^= state >> 7;
  state ^= state << 17;
  return (uint32_t)(state >> 16);
}

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
  put_u32(bytes, (uint32_t)(value >> 32));
  put_u32(bytes + 4, (uint32_t)value);
}

static size_t append_tlv(uint8_t *output, size_t offset, uint16_t tag,
                         uint8_t type, const uint8_t *value, size_t length) {
  put_u16(output + offset, tag);
  output[offset + 2] = type;
  output[offset + 3] = 0;
  put_u32(output + offset + 4, (uint32_t)length);
  if (length != 0) memcpy(output + offset + 8, value, length);
  return offset + 8 + length;
}

static size_t append_u32(uint8_t *output, size_t offset, uint16_t tag,
                         uint32_t value) {
  uint8_t bytes[4];
  put_u32(bytes, value);
  return append_tlv(output, offset, tag, HMG4V23_TLV_U32, bytes, sizeof(bytes));
}

static size_t append_u64(uint8_t *output, size_t offset, uint16_t tag,
                         uint64_t value) {
  uint8_t bytes[8];
  put_u64(bytes, value);
  return append_tlv(output, offset, tag, HMG4V23_TLV_U64, bytes, sizeof(bytes));
}

static size_t append_hash(uint8_t *output, size_t offset, uint16_t tag,
                          uint8_t fill) {
  uint8_t hash[32];
  memset(hash, fill, sizeof(hash));
  return append_tlv(output, offset, tag, HMG4V23_TLV_SHA256,
                    hash, sizeof(hash));
}

static size_t build_probe(uint8_t output[1024], hmg4v23_span root_path) {
  uint8_t root[512];
  uint8_t fsid[16];
  size_t root_length = 0;
  size_t length = 0;
  memset(fsid, 0x41, sizeof(fsid));
  root_length = append_u64(root, root_length, 0x0201, 1);
  root_length = append_u64(root, root_length, 0x0202, 2);
  root_length = append_u32(root, root_length, 0x0203, 501);
  root_length = append_u32(root, root_length, 0x0204, 20);
  root_length = append_u32(root, root_length, 0x0205, 0755);
  root_length = append_u32(root, root_length, 0x0206, 0);
  root_length = append_tlv(root, root_length, 0x0207, HMG4V23_TLV_BYTES,
                           fsid, sizeof(fsid));
  root_length = append_hash(root, root_length, 0x0208, 0x42);
  root_length = append_tlv(root, root_length, 0x0209,
                           HMG4V23_TLV_APPROVED_ABS_ROOT_PATH,
                           root_path.bytes, root_path.length);
  length = append_tlv(output, length, 0x0001, HMG4V23_TLV_SHA256,
                      hmg4v23_successor_sha256, 32);
  length = append_u32(output, length, 0x0002, 2);
  length = append_hash(output, length, 0x0003, 3);
  length = append_hash(output, length, 0x0004, 4);
  length = append_tlv(output, length, 0x0007, HMG4V23_TLV_STRUCT,
                      root, root_length);
  length = append_hash(output, length, 0x0023, 0x23);
  length = append_hash(output, length, 0x0024, 0x24);
  return length;
}

int main(void) {
  char path_bytes[HMG4V23_MANAGED_ENTRY_COUNT][32];
  hmg4v23_span paths[HMG4V23_MANAGED_ENTRY_COUNT];
  hmg4v23_request_path_authority authority;
  hmg4v23_request_summary summary;
  uint8_t canonical[1024];
  uint8_t candidate[2048];
  size_t canonical_length;
  size_t iteration;
  size_t index;
  authority.approved_root_path = (hmg4v23_span){
      (const uint8_t *)"/Volumes/WestWorld/HELP MATH 2.0", 32};
  authority.managed_paths = paths;
  authority.managed_path_count = HMG4V23_MANAGED_ENTRY_COUNT;
  for (index = 0; index < HMG4V23_MANAGED_ENTRY_COUNT; ++index) {
    const int written = snprintf(path_bytes[index], sizeof(path_bytes[index]),
                                 "lesson10/member-%03zu.swf", index);
    if (written <= 0 || (size_t)written >= sizeof(path_bytes[index])) return 2;
    paths[index] = (hmg4v23_span){(const uint8_t *)path_bytes[index],
                                  (size_t)written};
  }
  canonical_length = build_probe(canonical, authority.approved_root_path);
  for (iteration = 0; iteration < 1024; ++iteration) {
    size_t length;
    uint32_t operation;
    if ((iteration & 1) == 0) {
      length = canonical_length;
      memcpy(candidate, canonical, length);
      candidate[(size_t)(next_u32() % (uint32_t)length)] ^=
          (uint8_t)(UINT32_C(1) << (next_u32() & 7));
      operation = (next_u32() % 4) + 1;
    } else {
      length = (size_t)(next_u32() % (uint32_t)sizeof(candidate));
      for (index = 0; index < length; ++index) candidate[index] = (uint8_t)next_u32();
      operation = next_u32() % 6;
    }
    (void)hmg4v23_validate_request_payload(
        operation, (hmg4v23_span){candidate, length}, &authority, &summary);
    (void)hmg4v23_request_result_name(
        (hmg4v23_request_result)(next_u32() % 24));
  }
  puts("request-schema fuzz cases=1024");
  return 0;
}
