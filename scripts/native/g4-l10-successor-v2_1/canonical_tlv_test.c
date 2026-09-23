#include "canonical_tlv.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static unsigned assertions = 0;
#define CHECK(condition) do { assertions++; if (!(condition)) {                 \
  fprintf(stderr, "assertion failed at %s:%d: %s\n", __FILE__, __LINE__,       \
          #condition); exit(1); } } while (0)

typedef struct {
  uint8_t bytes[65536];
  size_t length;
} byte_builder;

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

static void append_bytes(byte_builder *builder, const void *bytes, size_t length) {
  CHECK(builder != NULL);
  CHECK(length <= sizeof(builder->bytes) - builder->length);
  if (length != 0) memcpy(builder->bytes + builder->length, bytes, length);
  builder->length += length;
}

static void append_tlv(byte_builder *builder, uint16_t tag, uint8_t type,
                       const void *value, size_t length) {
  uint8_t header[8];
  CHECK(length <= UINT32_MAX);
  put_u16(header, tag);
  header[2] = type;
  header[3] = 0;
  put_u32(header + 4, (uint32_t)length);
  append_bytes(builder, header, sizeof(header));
  append_bytes(builder, value, length);
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

static void test_authority_paths(void) {
  static const struct {
    hmg4v21_evidence_role role;
    const char *prefix;
    const char *suffix;
  } evidence[] = {
      {HMG4V21_EVIDENCE_PLAN, "plans/g4-l10-", ".plan"},
      {HMG4V21_EVIDENCE_BUNDLE, "bundles/g4-l10-", ".bundle"},
      {HMG4V21_EVIDENCE_CAP_TARGET, "receipts/cap-target-", ".receipt"},
      {HMG4V21_EVIDENCE_CAP_SYSTEM, "receipts/cap-system-", ".receipt"},
      {HMG4V21_EVIDENCE_QUIESCENCE, "receipts/quiescence-", ".receipt"},
      {HMG4V21_EVIDENCE_RECOVER, "authorizations/recover-", ".auth"},
      {HMG4V21_EVIDENCE_BUILD, "receipts/build-", ".receipt"},
      {HMG4V21_EVIDENCE_INSTALL, "receipts/install-", ".receipt"},
      {HMG4V21_EVIDENCE_XATTR, "xattr/g4-l10-", ".xattr"},
      {HMG4V21_EVIDENCE_APPLY, "authorizations/apply-", ".auth"},
      {HMG4V21_EVIDENCE_INSTALL_AUTH, "authorizations/install-", ".auth"},
      {HMG4V21_EVIDENCE_REVIEW, "receipts/review-", ".manifest"}};
  uint8_t digest[32];
  char hex[65];
  char path[512];
  hmg4v21_custody_leaf custody;
  hmg4v21_fixture_root root;
  hmg4v21_fixture_attempt attempt;
  size_t index;
  memset(digest, 0xab, sizeof(digest));
  digest_hex(digest, hex);

  CHECK(hmg4v21_policy_rel_path_is_lexically_safe(
      (hmg4v21_span){(const uint8_t *)"a/b", 3}));
  CHECK(hmg4v21_policy_rel_path_is_lexically_safe(
      (hmg4v21_span){(const uint8_t *)"Lesson_10/report.json", 21}));
  for (index = 0; index < 8; ++index) {
    static const char *bad[] = {"/a", "a/", "a//b", "a/./b", "a/../b",
                                "a\\b", ".", ".."};
    CHECK(!hmg4v21_policy_rel_path_is_lexically_safe(
        (hmg4v21_span){(const uint8_t *)bad[index], strlen(bad[index])}));
  }
  CHECK(hmg4v21_approved_abs_root_is_lexically_safe(
      (hmg4v21_span){(const uint8_t *)"/Volumes/WestWorld/HELP MATH 2.0", 32}));
  CHECK(!hmg4v21_approved_abs_root_is_lexically_safe(
      (hmg4v21_span){(const uint8_t *)"Volumes/WestWorld", 17}));
  CHECK(hmg4v21_observed_custody_leaf_is_lexically_safe(
      (hmg4v21_span){(const uint8_t *)"raw\\name", 8}));
  CHECK(!hmg4v21_observed_custody_leaf_is_lexically_safe(
      (hmg4v21_span){(const uint8_t *)"raw/name", 8}));

  CHECK(snprintf(path, sizeof(path), "tx-%s-request-%s.bin", hex, hex) > 0);
  CHECK(hmg4v21_parse_custody_leaf(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &custody));
  CHECK(custody.variant == HMG4V21_CUSTODY_REQUEST);
  CHECK(custody.managed_index == HMG4V21_NO_INDEX);
  CHECK(custody.transaction_id_hex.length == 64 && custody.digest_hex.length == 64);
  CHECK(snprintf(path, sizeof(path), "tx-%s-journal-%s.log", hex, hex) > 0);
  CHECK(hmg4v21_parse_custody_leaf(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &custody) &&
      custody.variant == HMG4V21_CUSTODY_JOURNAL);
  CHECK(snprintf(path, sizeof(path), "tx-%s-receipt-%s.receipt", hex, hex) > 0);
  CHECK(hmg4v21_parse_custody_leaf(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &custody) &&
      custody.variant == HMG4V21_CUSTODY_RECEIPT);
  CHECK(snprintf(path, sizeof(path), "tx-%s-stage-000-%s", hex, hex) > 0);
  CHECK(hmg4v21_parse_custody_leaf(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &custody) &&
      custody.variant == HMG4V21_CUSTODY_STAGE && custody.managed_index == 0);
  CHECK(snprintf(path, sizeof(path), "tx-%s-archive-113-%s", hex, hex) > 0);
  CHECK(hmg4v21_parse_custody_leaf(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &custody) &&
      custody.variant == HMG4V21_CUSTODY_ARCHIVE && custody.managed_index == 113);
  CHECK(snprintf(path, sizeof(path), "tx-%s-preimage-009-%s", hex, hex) > 0);
  CHECK(hmg4v21_parse_custody_leaf(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &custody) &&
      custody.variant == HMG4V21_CUSTODY_PREIMAGE && custody.managed_index == 9);
  CHECK(snprintf(path, sizeof(path), "tx-%s-rollback-110-%s", hex, hex) > 0);
  CHECK(hmg4v21_parse_custody_leaf(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &custody) &&
      custody.variant == HMG4V21_CUSTODY_ROLLBACK && custody.managed_index == 110);
  CHECK(snprintf(path, sizeof(path), "tx-%s-stage-114-%s", hex, hex) > 0);
  CHECK(!hmg4v21_parse_custody_leaf(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &custody));
  path[3] = 'A';
  CHECK(!hmg4v21_parse_custody_leaf(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &custody));

  for (index = 0; index < sizeof(evidence) / sizeof(evidence[0]); ++index) {
    CHECK(snprintf(path, sizeof(path), "%s%s%s", evidence[index].prefix, hex,
                   evidence[index].suffix) > 0);
    CHECK(hmg4v21_validate_evidence_path(
        (hmg4v21_span){(const uint8_t *)path, strlen(path)},
        evidence[index].role, digest));
    CHECK(!hmg4v21_validate_evidence_path(
        (hmg4v21_span){(const uint8_t *)path, strlen(path)},
        evidence[index].role == HMG4V21_EVIDENCE_PLAN
            ? HMG4V21_EVIDENCE_BUNDLE
            : HMG4V21_EVIDENCE_PLAN,
        digest));
  }

  CHECK(snprintf(path, sizeof(path), "capability-fixtures/target-%s", hex) > 0);
  CHECK(hmg4v21_parse_fixture_root(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &root));
  CHECK(root.scope == HMG4V21_FIXTURE_SCOPE_TARGET);
  CHECK(hmg4v21_validate_fixture_root(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)},
      HMG4V21_FIXTURE_SCOPE_TARGET, digest));
  CHECK(!hmg4v21_validate_fixture_root(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)},
      HMG4V21_FIXTURE_SCOPE_SYSTEM_LOCK, digest));
  CHECK(snprintf(path, sizeof(path), "capability-fixtures/system-lock-%s", hex) > 0);
  CHECK(hmg4v21_parse_fixture_root(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &root) &&
      root.scope == HMG4V21_FIXTURE_SCOPE_SYSTEM_LOCK);

  CHECK(snprintf(path, sizeof(path),
                 "capability-fixtures/target-%s/op-018/attempt-2", hex) > 0);
  CHECK(hmg4v21_parse_fixture_attempt(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &attempt));
  CHECK(attempt.kind == HMG4V21_FIXTURE_ATTEMPT_CAPABILITY &&
        attempt.scope == HMG4V21_FIXTURE_SCOPE_TARGET &&
        attempt.operation == 18 && attempt.attempt == 2);
  CHECK(snprintf(path, sizeof(path),
                 "capability-fixtures/system-lock-%s/op-105/attempt-0", hex) > 0);
  CHECK(hmg4v21_parse_fixture_attempt(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &attempt) &&
      attempt.operation == 105);
  CHECK(snprintf(path, sizeof(path),
                 "capability-fixtures/target-%s/deny-11-scenario-2/attempt-5", hex) > 0);
  CHECK(hmg4v21_parse_fixture_attempt(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &attempt));
  CHECK(attempt.kind == HMG4V21_FIXTURE_ATTEMPT_DENIAL &&
        attempt.operation == 11 && attempt.scenario == 2 && attempt.attempt == 5);
  path[strlen(path) - 1] = '6';
  CHECK(!hmg4v21_parse_fixture_attempt(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, &attempt));

  CHECK(snprintf(path, sizeof(path), "fixture-reservation-%s.claim", hex) > 0);
  CHECK(hmg4v21_validate_fixture_claim(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, digest));
  path[20] = 'c';
  CHECK(!hmg4v21_validate_fixture_claim(
      (hmg4v21_span){(const uint8_t *)path, strlen(path)}, digest));
}

typedef struct {
  hmg4v21_span accepted;
  unsigned calls;
  int reject;
} path_context;

static hmg4v21_tlv_result authorize_path(void *opaque, uint16_t tag,
                                         uint8_t type, hmg4v21_span value) {
  path_context *context = (path_context *)opaque;
  if (context == NULL || tag != 0x300b ||
      type != HMG4V21_TLV_CAPABILITY_FIXTURE_ROOT_REL_PATH) {
    return HMG4V21_TLV_PATH_CONTEXT_REJECTED;
  }
  ++context->calls;
  if (context->reject || value.length != context->accepted.length ||
      memcmp(value.bytes, context->accepted.bytes, value.length) != 0) {
    return HMG4V21_TLV_PATH_CONTEXT_REJECTED;
  }
  return HMG4V21_TLV_OK;
}

static void build_child(byte_builder *child, size_t byte_count) {
  uint8_t one[4] = {0, 0, 0, 1};
  uint8_t content[5001];
  memset(content, 0x5a, sizeof(content));
  child->length = 0;
  append_tlv(child, 0x5101, HMG4V21_TLV_U32, one, sizeof(one));
  append_tlv(child, 0x5102, HMG4V21_TLV_BYTES, content, byte_count);
}

static void test_raw_cursor(void) {
  byte_builder builder = {{0}, 0};
  hmg4v21_tlv_cursor cursor;
  hmg4v21_tlv_view view;
  uint8_t value[4] = {0, 0, 0, 1};
  int done = 0;
  append_tlv(&builder, 0x1001, HMG4V21_TLV_U32, value, sizeof(value));
  hmg4v21_tlv_cursor_init(&cursor,
      (hmg4v21_span){builder.bytes, builder.length});
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) == HMG4V21_TLV_OK);
  CHECK(!done && view.tag == 0x1001 && view.type == HMG4V21_TLV_U32 &&
        view.value.length == 4);
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) == HMG4V21_TLV_OK && done);
  builder.bytes[3] = 1;
  hmg4v21_tlv_cursor_init(&cursor, (hmg4v21_span){builder.bytes, builder.length});
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) ==
        HMG4V21_TLV_RESERVED_NONZERO);
  builder.bytes[3] = 0;
  builder.bytes[2] = 0x11;
  hmg4v21_tlv_cursor_init(&cursor, (hmg4v21_span){builder.bytes, builder.length});
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) ==
        HMG4V21_TLV_TYPE_SITE_FORBIDDEN);
  builder.bytes[2] = HMG4V21_TLV_U32;
  hmg4v21_tlv_cursor_init(&cursor, (hmg4v21_span){builder.bytes, 7});
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) == HMG4V21_TLV_TRUNCATED);
  put_u32(builder.bytes + 4, 5);
  hmg4v21_tlv_cursor_init(&cursor, (hmg4v21_span){builder.bytes, builder.length});
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) == HMG4V21_TLV_TRUNCATED);

  builder.length = 0;
  value[0] = 2;
  append_tlv(&builder, 0x1001, HMG4V21_TLV_BOOL, value, 1);
  hmg4v21_tlv_cursor_init(&cursor, (hmg4v21_span){builder.bytes, builder.length});
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) == HMG4V21_TLV_BOOL_INVALID);

  builder.length = 0;
  value[0] = 0;
  append_tlv(&builder, 0x1002, HMG4V21_TLV_U32, value, 4);
  append_tlv(&builder, 0x1001, HMG4V21_TLV_U32, value, 4);
  hmg4v21_tlv_cursor_init(&cursor, (hmg4v21_span){builder.bytes, builder.length});
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) == HMG4V21_TLV_OK);
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) == HMG4V21_TLV_ORDER_INVALID);

  builder.length = 0;
  append_tlv(&builder, 0x790b, HMG4V21_TLV_CAPABILITY_FIXTURE_ROOT_REL_PATH,
             "capability-fixtures/target-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
             sizeof("capability-fixtures/target-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") - 1);
  hmg4v21_tlv_cursor_init(&cursor, (hmg4v21_span){builder.bytes, builder.length});
  CHECK(hmg4v21_tlv_next_raw(&cursor, &view, &done) ==
        HMG4V21_TLV_TYPE_SITE_FORBIDDEN);
  CHECK(hmg4v21_tlv_next_raw(NULL, &view, &done) == HMG4V21_TLV_NULL_ARGUMENT);
}

static void test_schema_engine(void) {
  static const hmg4v21_tlv_field_rule child_rules[] = {
      {0x5101, HMG4V21_TLV_U32, 0, HMG4V21_FIELD_NUMERIC_RANGE,
       0, 0, 1, 1, 0, 0, NULL},
      {0x5102, HMG4V21_TLV_BYTES, 0,
       HMG4V21_FIELD_LENGTH_RANGE | HMG4V21_FIELD_BYTES_BOUND_OVERRIDE,
       5000, 5000, 0, 0, 0, 0, NULL}};
  static const hmg4v21_tlv_schema child_schema = {
      child_rules, sizeof(child_rules) / sizeof(child_rules[0]), 4};
  static const hmg4v21_tlv_field_rule top_rules[] = {
      {0x300b, HMG4V21_TLV_CAPABILITY_FIXTURE_ROOT_REL_PATH, 0, 0,
       0, 0, 0, 0, 0, 0, NULL},
      {0x4001, HMG4V21_TLV_SHA256, 0, 0,
       0, 0, 0, 0, 0, 0, NULL},
      {0x4002, HMG4V21_TLV_STRUCT, 0, 0,
       0, 0, 0, 0, 0, 0, &child_schema},
      {0x4003, HMG4V21_TLV_LIST, 0, HMG4V21_FIELD_LIST_COUNT_RANGE,
       0, 0, 0, 0, 2, 2, &child_schema},
      {0x4004, HMG4V21_TLV_BOOL, 0, HMG4V21_FIELD_OPTIONAL,
       0, 0, 0, 0, 0, 0, NULL},
      {0x4005, HMG4V21_TLV_U64, 0, HMG4V21_FIELD_NUMERIC_RANGE,
       0, 0, 7, 9, 0, 0, NULL}};
  static const hmg4v21_tlv_schema top_schema = {
      top_rules, sizeof(top_rules) / sizeof(top_rules[0]), 4};
  byte_builder child = {{0}, 0};
  byte_builder list = {{0}, 0};
  byte_builder top = {{0}, 0};
  byte_builder mutated;
  uint8_t count[4];
  uint8_t hash[32];
  uint8_t number[8];
  char fixture[128];
  path_context context;
  hmg4v21_tlv_result status;
  size_t fixture_length;
  memset(hash, 0x11, sizeof(hash));
  build_child(&child, 5000);
  put_u32(count, 2);
  append_bytes(&list, count, sizeof(count));
  put_u32(count, (uint32_t)child.length);
  append_bytes(&list, count, sizeof(count));
  append_bytes(&list, child.bytes, child.length);
  append_bytes(&list, count, sizeof(count));
  append_bytes(&list, child.bytes, child.length);
  CHECK(snprintf(fixture, sizeof(fixture),
                 "capability-fixtures/target-%064x", 0x11) > 0);
  fixture_length = strlen(fixture);
  append_tlv(&top, 0x300b, HMG4V21_TLV_CAPABILITY_FIXTURE_ROOT_REL_PATH,
             fixture, fixture_length);
  append_tlv(&top, 0x4001, HMG4V21_TLV_SHA256, hash, sizeof(hash));
  append_tlv(&top, 0x4002, HMG4V21_TLV_STRUCT, child.bytes, child.length);
  append_tlv(&top, 0x4003, HMG4V21_TLV_LIST, list.bytes, list.length);
  put_u64(number, 8);
  append_tlv(&top, 0x4005, HMG4V21_TLV_U64, number, sizeof(number));
  context.accepted = (hmg4v21_span){(const uint8_t *)fixture, fixture_length};
  context.calls = 0;
  context.reject = 0;
  status = hmg4v21_validate_tlv_schema(
      (hmg4v21_span){top.bytes, top.length}, &top_schema,
      authorize_path, &context);
  CHECK(status == HMG4V21_TLV_OK);
  CHECK(context.calls == 1);
  CHECK(hmg4v21_validate_tlv_schema(
      (hmg4v21_span){top.bytes, top.length}, &top_schema, NULL, NULL) ==
      HMG4V21_TLV_PATH_CONTEXT_REQUIRED);
  context.reject = 1;
  CHECK(hmg4v21_validate_tlv_schema(
      (hmg4v21_span){top.bytes, top.length}, &top_schema,
      authorize_path, &context) == HMG4V21_TLV_PATH_CONTEXT_REJECTED);
  context.reject = 0;

  mutated = top;
  memset(mutated.bytes + 8 + fixture_length + 8, 0, 32);
  CHECK(hmg4v21_validate_tlv_schema(
      (hmg4v21_span){mutated.bytes, mutated.length}, &top_schema,
      authorize_path, &context) == HMG4V21_TLV_SHA256_ZERO_FORBIDDEN);
  {
    hmg4v21_tlv_field_rule allow_rules[sizeof(top_rules) / sizeof(top_rules[0])];
    hmg4v21_tlv_schema allow_schema = top_schema;
    memcpy(allow_rules, top_rules, sizeof(top_rules));
    allow_rules[1].flags |= HMG4V21_FIELD_ALLOW_ZERO_SHA256;
    allow_schema.fields = allow_rules;
    CHECK(hmg4v21_validate_tlv_schema(
        (hmg4v21_span){mutated.bytes, mutated.length}, &allow_schema,
        authorize_path, &context) == HMG4V21_TLV_OK);
  }

  mutated = top;
  put_u64(mutated.bytes + mutated.length - 8, 10);
  CHECK(hmg4v21_validate_tlv_schema(
      (hmg4v21_span){mutated.bytes, mutated.length}, &top_schema,
      authorize_path, &context) == HMG4V21_TLV_NUMERIC_RANGE_INVALID);

  mutated = top;
  put_u32(mutated.bytes + 8 + fixture_length + 8 + 32 + 4, 0);
  CHECK(hmg4v21_validate_tlv_schema(
      (hmg4v21_span){mutated.bytes, mutated.length}, &top_schema,
      authorize_path, &context) == HMG4V21_TLV_NESTED_SCHEMA_INVALID);

  mutated = top;
  {
    const size_t list_header = 8 + fixture_length + 8 + 32 + 8 + child.length;
    put_u32(mutated.bytes + list_header + 8, 3);
  }
  CHECK(hmg4v21_validate_tlv_schema(
      (hmg4v21_span){mutated.bytes, mutated.length}, &top_schema,
      authorize_path, &context) == HMG4V21_TLV_LIST_COUNT_INVALID);

  {
    static const hmg4v21_tlv_field_rule default_bytes_rule = {
        0x5102, HMG4V21_TLV_BYTES, 0, 0, 0, 0, 0, 0, 0, 0, NULL};
    static const hmg4v21_tlv_schema default_bytes_schema = {
        &default_bytes_rule, 1, 1};
    byte_builder bytes_only = {{0}, 0};
    uint8_t content[4097];
    memset(content, 0, sizeof(content));
    append_tlv(&bytes_only, 0x5102, HMG4V21_TLV_BYTES,
               content, sizeof(content));
    CHECK(hmg4v21_validate_tlv_schema(
        (hmg4v21_span){bytes_only.bytes, bytes_only.length},
        &default_bytes_schema, NULL, NULL) == HMG4V21_TLV_LENGTH_INVALID);
  }

  {
    hmg4v21_tlv_field_rule broken = child_rules[1];
    hmg4v21_tlv_schema broken_schema = {&broken, 1, 1};
    byte_builder only = {{0}, 0};
    uint8_t content[5000];
    memset(content, 1, sizeof(content));
    append_tlv(&only, 0x5102, HMG4V21_TLV_BYTES, content, sizeof(content));
    broken.flags = HMG4V21_FIELD_BYTES_BOUND_OVERRIDE;
    CHECK(hmg4v21_validate_tlv_schema(
        (hmg4v21_span){only.bytes, only.length}, &broken_schema, NULL, NULL) ==
        HMG4V21_TLV_SCHEMA_INVALID);
    broken = child_rules[1];
    broken.reserved = 1;
    CHECK(hmg4v21_validate_tlv_schema(
        (hmg4v21_span){only.bytes, only.length}, &broken_schema, NULL, NULL) ==
        HMG4V21_TLV_SCHEMA_INVALID);
  }

  CHECK(hmg4v21_validate_tlv_schema(
      (hmg4v21_span){top.bytes, top.length - 16}, &top_schema,
      authorize_path, &context) == HMG4V21_TLV_REQUIRED_FIELD_MISSING);
  CHECK(hmg4v21_validate_tlv_schema(
      (hmg4v21_span){top.bytes, top.length}, NULL,
      authorize_path, &context) == HMG4V21_TLV_NULL_ARGUMENT);
}

static void test_result_names(void) {
  unsigned value;
  for (value = 0; value <= (unsigned)HMG4V21_TLV_MAXIMUM_DEPTH_EXCEEDED;
       ++value) {
    CHECK(strcmp(hmg4v21_tlv_result_name((hmg4v21_tlv_result)value),
                 "UNKNOWN_TLV_RESULT") != 0);
  }
  CHECK(strcmp(hmg4v21_tlv_result_name((hmg4v21_tlv_result)999),
               "UNKNOWN_TLV_RESULT") == 0);
}

int main(void) {
  test_authority_paths();
  test_raw_cursor();
  test_schema_engine();
  test_result_names();
  printf("canonical-tlv assertions=%u\n", assertions);
  return 0;
}
