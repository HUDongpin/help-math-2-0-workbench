#include "request_schema.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static unsigned assertions = 0;
#define CHECK(condition) do { assertions++; if (!(condition)) {                 \
  fprintf(stderr, "assertion failed at %s:%d: %s\n", __FILE__, __LINE__,       \
          #condition); exit(1); } } while (0)

typedef struct {
  uint8_t bytes[262144];
  size_t length;
} builder;

typedef struct {
  char path_bytes[HMG4V21_MANAGED_ENTRY_COUNT][32];
  hmg4v21_span paths[HMG4V21_MANAGED_ENTRY_COUNT];
  hmg4v21_request_path_authority authority;
} authority_fixture;

typedef enum {
  ENTRY_GOOD = 0,
  ENTRY_BAD_INDEX,
  ENTRY_BAD_STATE,
  ENTRY_BAD_RANGE,
  ENTRY_BAD_ROLE_ORDER
} entry_profile;

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

static void append_bytes(builder *output, const void *bytes, size_t length) {
  CHECK(output != NULL);
  CHECK(length <= sizeof(output->bytes) - output->length);
  if (length != 0) memcpy(output->bytes + output->length, bytes, length);
  output->length += length;
}

static void append_tlv(builder *output, uint16_t tag, uint8_t type,
                       const void *value, size_t length) {
  uint8_t header[8];
  CHECK(length <= UINT32_MAX);
  put_u16(header, tag);
  header[2] = type;
  header[3] = 0;
  put_u32(header + 4, (uint32_t)length);
  append_bytes(output, header, sizeof(header));
  append_bytes(output, value, length);
}

static void append_u32(builder *output, uint16_t tag, uint32_t value) {
  uint8_t bytes[4];
  put_u32(bytes, value);
  append_tlv(output, tag, HMG4V21_TLV_U32, bytes, sizeof(bytes));
}

static void append_u64(builder *output, uint16_t tag, uint64_t value) {
  uint8_t bytes[8];
  put_u64(bytes, value);
  append_tlv(output, tag, HMG4V21_TLV_U64, bytes, sizeof(bytes));
}

static void append_hash(builder *output, uint16_t tag, uint8_t fill) {
  uint8_t hash[32];
  memset(hash, fill, sizeof(hash));
  append_tlv(output, tag, HMG4V21_TLV_SHA256, hash, sizeof(hash));
}

static void append_exact_hash(builder *output, uint16_t tag,
                              const uint8_t hash[32]) {
  append_tlv(output, tag, HMG4V21_TLV_SHA256, hash, 32);
}

static void digest_hex(const uint8_t digest[32], char output[65]) {
  static const char alphabet[] = "0123456789abcdef";
  size_t index;
  for (index = 0; index < 32; ++index) {
    output[index * 2] = alphabet[digest[index] >> 4];
    output[index * 2 + 1] = alphabet[digest[index] & 0x0f];
  }
  output[64] = '\0';
}

static void initialize_authority(authority_fixture *fixture) {
  size_t index;
  CHECK(fixture != NULL);
  for (index = 0; index < HMG4V21_MANAGED_ENTRY_COUNT; ++index) {
    const int written = snprintf(fixture->path_bytes[index],
                                 sizeof(fixture->path_bytes[index]),
                                 "lesson10/member-%03zu.swf", index);
    CHECK(written > 0);
    CHECK((size_t)written < sizeof(fixture->path_bytes[index]));
    fixture->paths[index] = (hmg4v21_span){
        (const uint8_t *)fixture->path_bytes[index], (size_t)written};
  }
  fixture->authority.approved_root_path = (hmg4v21_span){
      (const uint8_t *)"/Volumes/WestWorld/HELP MATH 2.0", 32};
  fixture->authority.managed_paths = fixture->paths;
  fixture->authority.managed_path_count = HMG4V21_MANAGED_ENTRY_COUNT;
}

static void build_root(builder *root,
                       const hmg4v21_request_path_authority *authority) {
  uint8_t fsid[16];
  memset(fsid, 0x51, sizeof(fsid));
  root->length = 0;
  append_u64(root, 0x0201, 100);
  append_u64(root, 0x0202, 200);
  append_u32(root, 0x0203, 501);
  append_u32(root, 0x0204, 20);
  append_u32(root, 0x0205, 0755);
  append_u32(root, 0x0206, 0);
  append_tlv(root, 0x0207, HMG4V21_TLV_BYTES, fsid, sizeof(fsid));
  append_hash(root, 0x0208, 0x52);
  append_tlv(root, 0x0209, HMG4V21_TLV_APPROVED_ABS_ROOT_PATH,
             authority->approved_root_path.bytes,
             authority->approved_root_path.length);
}

static void build_entry(builder *entry, size_t ordinal,
                        const hmg4v21_request_path_authority *authority,
                        entry_profile profile) {
  uint8_t predecessor_hash[32];
  const uint32_t state = (ordinal % 2) == 0 ? 1 : 0;
  uint32_t index = (uint32_t)ordinal;
  uint32_t role = ordinal == HMG4V21_MANAGED_ENTRY_COUNT - 1 ? 2 : 1;
  uint64_t desired_size = 1;
  entry->length = 0;
  if (profile == ENTRY_BAD_INDEX && ordinal == 3) index = 4;
  if (profile == ENTRY_BAD_ROLE_ORDER) {
    if (ordinal == 0) role = 2;
    if (ordinal == 1) role = 1;
  }
  if (profile == ENTRY_BAD_RANGE && ordinal == 4) desired_size = 0;
  append_u32(entry, 0x0101, index);
  append_u32(entry, 0x0102, role);
  append_tlv(entry, 0x0103, HMG4V21_TLV_POLICY_REL_PATH,
             authority->managed_paths[ordinal].bytes,
             authority->managed_paths[ordinal].length);
  append_u32(entry, 0x0104, state);
  append_u64(entry, 0x0105, state == 1 ? 10 : 0);
  memset(predecessor_hash, state == 1 ? 0x61 : 0, sizeof(predecessor_hash));
  if (profile == ENTRY_BAD_STATE && ordinal == 1) predecessor_hash[0] = 1;
  append_exact_hash(entry, 0x0106, predecessor_hash);
  append_u64(entry, 0x0107, (uint64_t)ordinal * UINT64_C(4096));
  append_u64(entry, 0x0108, desired_size);
  append_hash(entry, 0x0109, 0x62);
  append_u32(entry, 0x010a, 0644);
  append_u32(entry, 0x010b, 501);
  append_u32(entry, 0x010c, 20);
  append_u32(entry, 0x010d, 0);
  append_hash(entry, 0x010e, 0x63);
  append_hash(entry, 0x010f, 0x64);
  append_u32(entry, 0x0110, 1);
}

static void build_entries(builder *list,
                          const hmg4v21_request_path_authority *authority,
                          entry_profile profile) {
  builder entry = {{0}, 0};
  uint8_t count[4];
  size_t ordinal;
  list->length = 0;
  put_u32(count, (uint32_t)HMG4V21_MANAGED_ENTRY_COUNT);
  append_bytes(list, count, sizeof(count));
  for (ordinal = 0; ordinal < HMG4V21_MANAGED_ENTRY_COUNT; ++ordinal) {
    build_entry(&entry, ordinal, authority, profile);
    put_u32(count, (uint32_t)entry.length);
    append_bytes(list, count, sizeof(count));
    append_bytes(list, entry.bytes, entry.length);
  }
}

static void append_common(builder *payload, const builder *root,
                          const builder *entries) {
  append_exact_hash(payload, 0x0001, hmg4v21_successor_sha256);
  append_u32(payload, 0x0002, 2);
  append_hash(payload, 0x0003, 0x03);
  append_hash(payload, 0x0004, 0x04);
  append_hash(payload, 0x0005, 0x05);
  append_hash(payload, 0x0006, 0x06);
  append_tlv(payload, 0x0007, HMG4V21_TLV_STRUCT, root->bytes, root->length);
  append_hash(payload, 0x0008, 0x08);
  append_hash(payload, 0x0009, 0x09);
  append_hash(payload, 0x000a, 0x0a);
  append_u64(payload, 0x000b, 0);
  append_u32(payload, 0x000c, 114);
  append_tlv(payload, 0x000d, HMG4V21_TLV_LIST,
             entries->bytes, entries->length);
}

static void append_shared_runtime_fields(builder *payload, uint32_t durability) {
  append_hash(payload, 0x0016, 0x16);
  append_hash(payload, 0x0017, 0x17);
  append_hash(payload, 0x0018, 0x18);
  append_u32(payload, 0x0019, durability);
  append_hash(payload, 0x001a, 0x1a);
}

static void append_successor_common(builder *payload) {
  append_hash(payload, 0x0023, 0x23);
  append_hash(payload, 0x0024, 0x24);
}

static void build_probe(builder *payload, const builder *root, int omit_build) {
  payload->length = 0;
  append_exact_hash(payload, 0x0001, hmg4v21_successor_sha256);
  append_u32(payload, 0x0002, 2);
  append_hash(payload, 0x0003, 0x03);
  append_hash(payload, 0x0004, 0x04);
  append_tlv(payload, 0x0007, HMG4V21_TLV_STRUCT, root->bytes, root->length);
  if (!omit_build) append_hash(payload, 0x0023, 0x23);
  append_hash(payload, 0x0024, 0x24);
}

static void build_verify(builder *payload, const builder *root,
                         const builder *entries, uint32_t target,
                         int bad_receipt_digest) {
  uint8_t receipt_hash[32];
  char hex[65];
  char leaf[256];
  payload->length = 0;
  append_common(payload, root, entries);
  append_u32(payload, 0x000e, target);
  if (target == 2) {
    memset(receipt_hash, 0x10, sizeof(receipt_hash));
    digest_hex(receipt_hash, hex);
    CHECK(snprintf(leaf, sizeof(leaf),
                   "tx-%064x-receipt-%s.receipt", 1, hex) > 0);
    if (bad_receipt_digest) leaf[3 + 64 + 9] = '2';
    append_tlv(payload, 0x000f, HMG4V21_TLV_SAFE_CUSTODY_LEAF,
               leaf, strlen(leaf));
    append_exact_hash(payload, 0x0010, receipt_hash);
  }
  append_shared_runtime_fields(payload, 1);
  append_successor_common(payload);
  append_u32(payload, 0x0027, 12);
  append_hash(payload, 0x0028, 0x28);
}

static void build_apply(builder *payload, const builder *root,
                        const builder *entries, int wrong_auth_role) {
  uint8_t auth_hash[32];
  char hex[65];
  char path[256];
  payload->length = 0;
  append_common(payload, root, entries);
  append_shared_runtime_fields(payload, 2);
  append_hash(payload, 0x001b, 0x1b);
  append_u32(payload, 0x001c, 171);
  append_hash(payload, 0x001d, 0x1d);
  append_u32(payload, 0x001e, 171);
  append_successor_common(payload);
  memset(auth_hash, 0x25, sizeof(auth_hash));
  append_exact_hash(payload, 0x0025, auth_hash);
  digest_hex(auth_hash, hex);
  CHECK(snprintf(path, sizeof(path),
                 wrong_auth_role ? "authorizations/install-%s.auth"
                                 : "authorizations/apply-%s.auth", hex) > 0);
  append_tlv(payload, 0x0026, HMG4V21_TLV_APPROVED_EVIDENCE_REL_PATH,
             path, strlen(path));
  append_u32(payload, 0x0027, 12);
  append_hash(payload, 0x0028, 0x28);
}

static void build_recover(builder *payload, const builder *root,
                          const builder *entries, int wrong_transaction,
                          int omit_snapshot) {
  uint8_t transaction_id[32];
  uint8_t authorization_hash[32];
  uint8_t zero[32];
  char transaction_hex[65];
  char authorization_hex[65];
  char leaf[256];
  char path[256];
  payload->length = 0;
  append_common(payload, root, entries);
  memset(transaction_id, 0x11, sizeof(transaction_id));
  digest_hex(transaction_id, transaction_hex);
  append_tlv(payload, 0x0011, HMG4V21_TLV_BYTES,
             transaction_id, sizeof(transaction_id));
  CHECK(snprintf(leaf, sizeof(leaf), "tx-%s-journal-%064x.log",
                 transaction_hex, wrong_transaction ? 2 : 1) > 0);
  if (wrong_transaction) leaf[3] = '2';
  append_tlv(payload, 0x0012, HMG4V21_TLV_SAFE_CUSTODY_LEAF,
             leaf, strlen(leaf));
  append_hash(payload, 0x0013, 0x13);
  memset(authorization_hash, 0x15, sizeof(authorization_hash));
  digest_hex(authorization_hash, authorization_hex);
  CHECK(snprintf(path, sizeof(path), "authorizations/recover-%s.auth",
                 authorization_hex) > 0);
  append_tlv(payload, 0x0014, HMG4V21_TLV_APPROVED_EVIDENCE_REL_PATH,
             path, strlen(path));
  append_exact_hash(payload, 0x0015, authorization_hash);
  append_shared_runtime_fields(payload, 2);
  append_hash(payload, 0x001b, 0x1b);
  append_u32(payload, 0x001c, 171);
  append_hash(payload, 0x001d, 0x1d);
  append_u32(payload, 0x001e, 171);
  append_u32(payload, 0x001f, 1);
  append_hash(payload, 0x0020, 0x20);
  append_u32(payload, 0x0021, 1);
  memset(zero, 0, sizeof(zero));
  append_exact_hash(payload, 0x0022, zero);
  append_successor_common(payload);
  append_u32(payload, 0x0027, 12);
  append_hash(payload, 0x0028, 0x28);
  if (!omit_snapshot) append_hash(payload, 0x002b, 0x2b);
}

static hmg4v21_request_result validate(
    uint32_t operation, const builder *payload,
    const hmg4v21_request_path_authority *authority,
    hmg4v21_request_summary *summary) {
  return hmg4v21_validate_request_payload(
      operation, (hmg4v21_span){payload->bytes, payload->length},
      authority, summary);
}

static void test_positive_matrices(void) {
  authority_fixture fixture;
  builder root = {{0}, 0};
  builder entries = {{0}, 0};
  builder payload = {{0}, 0};
  hmg4v21_request_summary summary;
  initialize_authority(&fixture);
  build_root(&root, &fixture.authority);
  build_entries(&entries, &fixture.authority, ENTRY_GOOD);
  build_probe(&payload, &root, 0);
  CHECK(validate(1, &payload, &fixture.authority, &summary) == HMG4V21_REQUEST_OK);
  CHECK(summary.operation == 1 && summary.expected_transition_count == 0);
  build_verify(&payload, &root, &entries, 1, 0);
  CHECK(validate(2, &payload, &fixture.authority, &summary) == HMG4V21_REQUEST_OK);
  CHECK(summary.verify_target == 1 && summary.predecessor_present_count == 57);
  build_verify(&payload, &root, &entries, 2, 0);
  CHECK(validate(2, &payload, &fixture.authority, &summary) == HMG4V21_REQUEST_OK);
  CHECK(summary.verify_target == 2 && summary.expected_transition_count == 171);
  build_apply(&payload, &root, &entries, 0);
  CHECK(validate(3, &payload, &fixture.authority, &summary) == HMG4V21_REQUEST_OK);
  CHECK(summary.expected_transition_count == 171);
  build_recover(&payload, &root, &entries, 0, 0);
  CHECK(validate(4, &payload, &fixture.authority, &summary) == HMG4V21_REQUEST_OK);
  CHECK(summary.predecessor_present_count == 57 && summary.tlv_result == HMG4V21_TLV_OK);
}

static void test_fail_closed_cases(void) {
  authority_fixture fixture;
  authority_fixture altered;
  builder root = {{0}, 0};
  builder entries = {{0}, 0};
  builder payload = {{0}, 0};
  hmg4v21_request_summary summary;
  size_t index;
  initialize_authority(&fixture);
  build_root(&root, &fixture.authority);
  build_entries(&entries, &fixture.authority, ENTRY_GOOD);

  build_probe(&payload, &root, 1);
  CHECK(validate(1, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_TLV_SCHEMA_INVALID);
  build_probe(&payload, &root, 0);
  payload.bytes[8] ^= 1;
  CHECK(validate(1, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_PROTOCOL_SPEC_MISMATCH);
  payload.bytes[8] ^= 1;
  CHECK(validate(0, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_BAD_OPERATION);
  CHECK(hmg4v21_validate_request_payload(1,
      (hmg4v21_span){payload.bytes, payload.length}, &fixture.authority, NULL) ==
      HMG4V21_REQUEST_NULL_ARGUMENT);

  altered = fixture;
  for (index = 0; index < HMG4V21_MANAGED_ENTRY_COUNT; ++index) {
    altered.paths[index] = (hmg4v21_span){
        (const uint8_t *)altered.path_bytes[index],
        strlen(altered.path_bytes[index])};
  }
  altered.authority.managed_paths = altered.paths;
  altered.path_bytes[7][7] = 'X';
  CHECK(validate(1, &payload, &altered.authority, &summary) == HMG4V21_REQUEST_OK);
  build_verify(&payload, &root, &entries, 1, 0);
  CHECK(validate(2, &payload, &altered.authority, &summary) ==
        HMG4V21_REQUEST_ENTRY_PATH_MISMATCH);

  altered = fixture;
  for (index = 0; index < HMG4V21_MANAGED_ENTRY_COUNT; ++index) {
    altered.paths[index] = fixture.paths[index];
  }
  altered.authority = fixture.authority;
  altered.authority.approved_root_path = (hmg4v21_span){
      (const uint8_t *)"/Volumes/Other", 14};
  CHECK(validate(2, &payload, &altered.authority, &summary) ==
        HMG4V21_REQUEST_ROOT_PATH_MISMATCH);
  payload.bytes[8] ^= 1;
  CHECK(validate(2, &payload, &altered.authority, &summary) ==
        HMG4V21_REQUEST_PROTOCOL_SPEC_MISMATCH);
  payload.bytes[8] ^= 1;

  build_entries(&entries, &fixture.authority, ENTRY_BAD_INDEX);
  build_apply(&payload, &root, &entries, 0);
  CHECK(validate(3, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_ENTRY_INDEX_MISMATCH);
  build_entries(&entries, &fixture.authority, ENTRY_BAD_STATE);
  build_apply(&payload, &root, &entries, 0);
  CHECK(validate(3, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_ENTRY_STATE_INVALID);
  build_entries(&entries, &fixture.authority, ENTRY_BAD_RANGE);
  build_apply(&payload, &root, &entries, 0);
  CHECK(validate(3, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_ENTRY_RANGE_INVALID);
  build_entries(&entries, &fixture.authority, ENTRY_BAD_ROLE_ORDER);
  build_apply(&payload, &root, &entries, 0);
  CHECK(validate(3, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_ENTRY_ROLE_ORDER_INVALID);

  build_entries(&entries, &fixture.authority, ENTRY_GOOD);
  build_verify(&payload, &root, &entries, 2, 1);
  CHECK(validate(2, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_CUSTODY_BINDING_INVALID);
  build_apply(&payload, &root, &entries, 1);
  CHECK(validate(3, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_EVIDENCE_BINDING_INVALID);
  build_recover(&payload, &root, &entries, 1, 0);
  CHECK(validate(4, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_CUSTODY_BINDING_INVALID);
  build_recover(&payload, &root, &entries, 0, 1);
  CHECK(validate(4, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_TLV_SCHEMA_INVALID);

  fixture.authority.managed_path_count = 113;
  CHECK(validate(4, &payload, &fixture.authority, &summary) ==
        HMG4V21_REQUEST_AUTHORITY_CONTEXT_INVALID);
}

static void test_result_names(void) {
  unsigned value;
  for (value = 0; value <= (unsigned)HMG4V21_REQUEST_EVIDENCE_BINDING_INVALID;
       ++value) {
    CHECK(strcmp(hmg4v21_request_result_name((hmg4v21_request_result)value),
                 "UNKNOWN_REQUEST_RESULT") != 0);
  }
  CHECK(strcmp(hmg4v21_request_result_name((hmg4v21_request_result)999),
               "UNKNOWN_REQUEST_RESULT") == 0);
}

int main(void) {
  test_positive_matrices();
  test_fail_closed_cases();
  test_result_names();
  printf("request-schema assertions=%u\n", assertions);
  return 0;
}
