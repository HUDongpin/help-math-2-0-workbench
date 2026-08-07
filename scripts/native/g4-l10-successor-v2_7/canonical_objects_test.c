#include "canonical_objects.h"

#include <limits.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#define REQUIRE(condition)                                                     \
  do {                                                                         \
    if (!(condition)) return __LINE__;                                         \
  } while (0)

static int hex_nibble(char value, uint8_t *result) {
  if (value >= '0' && value <= '9') {
    *result = (uint8_t)(value - '0');
    return 1;
  }
  if (value >= 'a' && value <= 'f') {
    *result = (uint8_t)(value - 'a' + 10);
    return 1;
  }
  return 0;
}

static int decode_hex(
    const char *hex,
    uint8_t *output,
    size_t output_capacity,
    size_t *output_length) {
  size_t hex_length = 0;
  size_t index = 0;
  if (hex == NULL || output == NULL || output_length == NULL) return 0;
  hex_length = strlen(hex);
  if ((hex_length % 2) != 0 || hex_length / 2 > output_capacity) return 0;
  for (index = 0; index < hex_length / 2; index += 1) {
    uint8_t high = 0;
    uint8_t low = 0;
    if (!hex_nibble(hex[index * 2], &high) ||
        !hex_nibble(hex[index * 2 + 1], &low)) {
      return 0;
    }
    output[index] = (uint8_t)((high << 4) | low);
  }
  *output_length = hex_length / 2;
  return 1;
}

static void write_u32_be(uint8_t bytes[4], uint32_t value) {
  bytes[0] = (uint8_t)(value >> 24);
  bytes[1] = (uint8_t)(value >> 16);
  bytes[2] = (uint8_t)(value >> 8);
  bytes[3] = (uint8_t)value;
}

static int check_acl_vector(
    const hmg4v27_acl_entry *entries,
    uint32_t entry_count,
    const char *expected_stream_hex,
    const char *expected_sha256_hex) {
  uint8_t encoded[256];
  uint8_t expected_stream[256];
  uint8_t actual_digest[HMG4V27_CANONICAL_SHA256_LENGTH];
  uint8_t expected_digest[HMG4V27_CANONICAL_SHA256_LENGTH];
  size_t encoded_size = 0;
  size_t bytes_written = 0;
  size_t expected_stream_length = 0;
  size_t expected_digest_length = 0;
  uint32_t parsed_count = UINT32_MAX;
  REQUIRE(decode_hex(expected_stream_hex, expected_stream,
                     sizeof(expected_stream), &expected_stream_length));
  REQUIRE(decode_hex(expected_sha256_hex, expected_digest,
                     sizeof(expected_digest), &expected_digest_length));
  REQUIRE(expected_digest_length == HMG4V27_CANONICAL_SHA256_LENGTH);
  REQUIRE(hmg4v27_acl_stream_size(entries, entry_count, &encoded_size) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(encoded_size == expected_stream_length);
  memset(encoded, 0xa5, sizeof(encoded));
  REQUIRE(hmg4v27_acl_stream_encode(entries, entry_count, encoded,
                                   sizeof(encoded), &bytes_written) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(bytes_written == expected_stream_length);
  REQUIRE(memcmp(encoded, expected_stream, expected_stream_length) == 0);
  REQUIRE(hmg4v27_acl_stream_validate(encoded, bytes_written, &parsed_count) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(parsed_count == entry_count);
  REQUIRE(hmg4v27_acl_stream_sha256(encoded, bytes_written, actual_digest) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(memcmp(actual_digest, expected_digest, sizeof(actual_digest)) == 0);
  return 0;
}

static int test_acl_normative_vectors(void) {
  static const uint8_t qualifier_allow[16] = {
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
      0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f};
  static const uint8_t qualifier_deny[16] = {
      0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7,
      0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff};
  const hmg4v27_acl_entry one[] = {{
      HMG4V27_ACL_TAG_ALLOW_NAMED_UUID,
      qualifier_allow,
      sizeof(qualifier_allow),
      UINT64_C(1),
      UINT64_C(0)}};
  const hmg4v27_acl_entry two[] = {
      {HMG4V27_ACL_TAG_ALLOW_NAMED_UUID,
       qualifier_allow,
       sizeof(qualifier_allow),
       UINT64_C(1),
       UINT64_C(0)},
      {HMG4V27_ACL_TAG_DENY_NAMED_UUID,
       qualifier_deny,
       sizeof(qualifier_deny),
       UINT64_C(3),
       UINT64_C(1)}};
  REQUIRE(check_acl_vector(
              NULL,
              0,
              "484d4734413200000000000200000000",
              "663092dea145f9bee33eb67efabb79e6a6016efe74d8ebaba259186a31c75701") ==
          0);
  REQUIRE(check_acl_vector(
              one,
              1,
              "484d47344132000000000002000000010000000100000010000102030405060708090a0b0c0d0e0f00000000000000010000000000000000",
              "378ca51cd3ef4c63eaa7262b68856bb70bc3748ebccfa8d20b544a71a7b5c406") ==
          0);
  REQUIRE(check_acl_vector(
              two,
              2,
              "484d47344132000000000002000000020000000100000010000102030405060708090a0b0c0d0e0f000000000000000100000000000000000000000200000010f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff00000000000000030000000000000001",
              "b253324ae5014bf8ea839017a93b0b86df894343ec7a3d668a06e2a9ae9027b0") ==
          0);
  return 0;
}

static int test_acl_rejections_and_order(void) {
  static const char one_hex[] =
      "484d47344132000000000002000000010000000100000010000102030405060708090a0b0c0d0e0f00000000000000010000000000000000";
  static const char two_hex[] =
      "484d47344132000000000002000000020000000100000010000102030405060708090a0b0c0d0e0f000000000000000100000000000000000000000200000010f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff00000000000000030000000000000001";
  static const uint8_t qualifier_allow[16] = {
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
      0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f};
  static const uint8_t qualifier_deny[16] = {
      0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7,
      0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff};
  uint8_t one[128];
  uint8_t two[192];
  uint8_t mutated[193];
  uint8_t output[128];
  uint8_t digest[32];
  uint8_t huge_count_header[16];
  static uint8_t over_bound_stream[
      16 + ((HMG4V27_CANONICAL_MAX_ACL_ENTRIES + 1u) * 40u)];
  size_t one_length = 0;
  size_t two_length = 0;
  size_t bounded_size = 0;
  size_t bytes_written = 99;
  const hmg4v27_acl_entry reversed[] = {
      {HMG4V27_ACL_TAG_DENY_NAMED_UUID,
       qualifier_deny,
       sizeof(qualifier_deny),
       UINT64_C(3),
       UINT64_C(1)},
      {HMG4V27_ACL_TAG_ALLOW_NAMED_UUID,
       qualifier_allow,
       sizeof(qualifier_allow),
       UINT64_C(1),
       UINT64_C(0)}};
  const hmg4v27_acl_entry duplicate[] = {
      {HMG4V27_ACL_TAG_ALLOW_NAMED_UUID,
       qualifier_allow,
       sizeof(qualifier_allow),
       UINT64_C(1),
       UINT64_C(0)},
      {HMG4V27_ACL_TAG_DENY_NAMED_UUID,
       qualifier_allow,
       sizeof(qualifier_allow),
       UINT64_C(1),
       UINT64_C(0)}};
  hmg4v27_acl_entry bad = reversed[0];
  REQUIRE(decode_hex(one_hex, one, sizeof(one), &one_length));
  REQUIRE(decode_hex(two_hex, two, sizeof(two), &two_length));

  memcpy(huge_count_header, one, sizeof(huge_count_header));
  write_u32_be(huge_count_header + 12, UINT32_MAX);
  REQUIRE(hmg4v27_acl_stream_validate(
              huge_count_header, sizeof(huge_count_header), NULL) ==
          HMG4V27_CANONICAL_TRUNCATED);
  memset(over_bound_stream, 0, sizeof(over_bound_stream));
  memcpy(over_bound_stream, one, 12);
  write_u32_be(over_bound_stream + 12,
               HMG4V27_CANONICAL_MAX_ACL_ENTRIES + 1u);
  REQUIRE(hmg4v27_acl_stream_validate(
              over_bound_stream, sizeof(over_bound_stream), NULL) ==
          HMG4V27_CANONICAL_BOUND_EXCEEDED);
  REQUIRE(hmg4v27_acl_stream_size(
              NULL, HMG4V27_CANONICAL_MAX_ACL_ENTRIES + 1u, &bounded_size) ==
          HMG4V27_CANONICAL_BOUND_EXCEEDED);
  REQUIRE(bounded_size == 0);

  memcpy(mutated, one, one_length);
  mutated[0] ^= 1;
  REQUIRE(hmg4v27_acl_stream_validate(mutated, one_length, NULL) ==
          HMG4V27_CANONICAL_BAD_MAGIC);
  memcpy(mutated, one, one_length);
  mutated[11] = 3;
  REQUIRE(hmg4v27_acl_stream_validate(mutated, one_length, NULL) ==
          HMG4V27_CANONICAL_BAD_VERSION);
  memcpy(mutated, one, one_length);
  mutated[19] = 3;
  REQUIRE(hmg4v27_acl_stream_validate(mutated, one_length, NULL) ==
          HMG4V27_CANONICAL_BAD_TAG);
  memcpy(mutated, one, one_length);
  mutated[23] = 0;
  REQUIRE(hmg4v27_acl_stream_validate(mutated, one_length, NULL) ==
          HMG4V27_CANONICAL_BAD_QUALIFIER);
  memcpy(mutated, one, one_length);
  mutated[46] = 0x40;
  REQUIRE(hmg4v27_acl_stream_validate(mutated, one_length, NULL) ==
          HMG4V27_CANONICAL_BAD_PERMISSION_MASK);
  memcpy(mutated, one, one_length);
  mutated[55] = 0x20;
  REQUIRE(hmg4v27_acl_stream_validate(mutated, one_length, NULL) ==
          HMG4V27_CANONICAL_BAD_FLAG_MASK);
  memcpy(mutated, one, one_length);
  write_u32_be(mutated + 12, 2);
  REQUIRE(hmg4v27_acl_stream_validate(mutated, one_length, NULL) ==
          HMG4V27_CANONICAL_TRUNCATED);
  memcpy(mutated, one, one_length);
  mutated[one_length] = 0;
  REQUIRE(hmg4v27_acl_stream_validate(mutated, one_length + 1, NULL) ==
          HMG4V27_CANONICAL_TRAILING_BYTES);
  memcpy(mutated, two, two_length);
  memcpy(mutated + 64, mutated + 24, 16);
  REQUIRE(hmg4v27_acl_stream_validate(mutated, two_length, NULL) ==
          HMG4V27_CANONICAL_DUPLICATE);

  memset(output, 0xa5, sizeof(output));
  REQUIRE(hmg4v27_acl_stream_encode(duplicate, 2, output, sizeof(output),
                                   &bytes_written) ==
          HMG4V27_CANONICAL_DUPLICATE);
  REQUIRE(bytes_written == 0);
  REQUIRE(output[0] == 0xa5 && output[sizeof(output) - 1] == 0xa5);
  bad.tag = 3;
  REQUIRE(hmg4v27_acl_stream_encode(&bad, 1, output, sizeof(output),
                                   &bytes_written) ==
          HMG4V27_CANONICAL_BAD_TAG);
  bad = reversed[0];
  bad.qualifier_length = 0;
  REQUIRE(hmg4v27_acl_stream_size(&bad, 1, &one_length) ==
          HMG4V27_CANONICAL_BAD_QUALIFIER);
  bad = reversed[0];
  bad.permissions = UINT64_C(1) << 14;
  REQUIRE(hmg4v27_acl_stream_size(&bad, 1, &one_length) ==
          HMG4V27_CANONICAL_BAD_PERMISSION_MASK);
  bad = reversed[0];
  bad.flags = UINT64_C(1) << 5;
  REQUIRE(hmg4v27_acl_stream_size(&bad, 1, &one_length) ==
          HMG4V27_CANONICAL_BAD_FLAG_MASK);

  REQUIRE(hmg4v27_acl_stream_encode(reversed, 2, output, sizeof(output),
                                   &bytes_written) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(hmg4v27_acl_stream_validate(output, bytes_written, NULL) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(memcmp(output, two, two_length) != 0);
  memset(digest, 0x5a, sizeof(digest));
  REQUIRE(hmg4v27_acl_stream_sha256(mutated, two_length, digest) ==
          HMG4V27_CANONICAL_DUPLICATE);
  REQUIRE(digest[0] == 0x5a && digest[31] == 0x5a);
  return 0;
}

static hmg4v27_xattr_bounds ordinary_xattr_bounds(void) {
  hmg4v27_xattr_bounds bounds;
  bounds.maximum_attribute_count = 4;
  bounds.maximum_name_length = 16;
  bounds.maximum_value_length = 8;
  bounds.maximum_total_value_length = 6;
  bounds.maximum_stream_length = 256;
  return bounds;
}

static int test_xattr_vector_and_hash(void) {
  static const uint8_t name_a_upper[] = {'A'};
  static const uint8_t name_a_lower[] = {'a'};
  static const uint8_t name_7f[] = {0x7f};
  static const uint8_t name_80[] = {0x80};
  static const uint8_t value_two[] = {0x00, 0x01};
  static const uint8_t value_one[] = {0xff};
  static const uint8_t value_three[] = {0x01, 0x02, 0x03};
  static const char expected_hex[] =
      "484d473458320000000000020000000400000001410000000000000000000000016100000000000000020001000000017f0000000000000001ff00000001800000000000000003010203";
  static const char expected_hash_hex[] =
      "f98f5f94aae0aab2693c7d7f120896a42721b6060eae7a92d18503b6f416be13";
  const hmg4v27_xattr attributes[] = {
      {name_a_upper, sizeof(name_a_upper), NULL, 0},
      {name_a_lower, sizeof(name_a_lower), value_two, sizeof(value_two)},
      {name_7f, sizeof(name_7f), value_one, sizeof(value_one)},
      {name_80, sizeof(name_80), value_three, sizeof(value_three)}};
  const hmg4v27_xattr_bounds bounds = ordinary_xattr_bounds();
  uint8_t encoded[256];
  uint8_t expected[256];
  uint8_t digest[32];
  uint8_t expected_digest[32];
  size_t encoded_size = 0;
  size_t bytes_written = 0;
  size_t expected_length = 0;
  size_t expected_digest_length = 0;
  uint32_t parsed_count = 0;
  REQUIRE(decode_hex(expected_hex, expected, sizeof(expected),
                     &expected_length));
  REQUIRE(decode_hex(expected_hash_hex, expected_digest,
                     sizeof(expected_digest), &expected_digest_length));
  REQUIRE(expected_length == 74);
  REQUIRE(expected_digest_length == sizeof(expected_digest));
  REQUIRE(hmg4v27_xattr_set_stream_size(attributes, 4, &bounds,
                                       &encoded_size) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(encoded_size == expected_length);
  REQUIRE(hmg4v27_xattr_set_stream_encode(attributes, 4, &bounds, encoded,
                                         sizeof(encoded), &bytes_written) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(bytes_written == expected_length);
  REQUIRE(memcmp(encoded, expected, expected_length) == 0);
  REQUIRE(hmg4v27_xattr_set_stream_validate(encoded, bytes_written, &bounds,
                                           &parsed_count) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(parsed_count == 4);
  REQUIRE(hmg4v27_xattr_set_stream_sha256(encoded, bytes_written, &bounds,
                                         digest) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(memcmp(digest, expected_digest, sizeof(digest)) == 0);
  return 0;
}

static int test_xattr_rejections_and_bounds(void) {
  static const uint8_t name_a[] = {'a'};
  static const uint8_t name_b[] = {'b'};
  static const uint8_t name_nul[] = {'a', 0x00, 'b'};
  static const uint8_t value_one[] = {1};
  static const uint8_t value_three[] = {1, 2, 3};
  hmg4v27_xattr_bounds bounds = ordinary_xattr_bounds();
  hmg4v27_xattr_bounds changed = bounds;
  const hmg4v27_xattr sorted[] = {
      {name_a, sizeof(name_a), value_one, sizeof(value_one)},
      {name_b, sizeof(name_b), value_three, sizeof(value_three)}};
  const hmg4v27_xattr unsorted[] = {
      {name_b, sizeof(name_b), value_one, sizeof(value_one)},
      {name_a, sizeof(name_a), value_one, sizeof(value_one)}};
  const hmg4v27_xattr duplicate[] = {
      {name_a, sizeof(name_a), value_one, sizeof(value_one)},
      {name_a, sizeof(name_a), value_three, sizeof(value_three)}};
  hmg4v27_xattr invalid = sorted[0];
  uint8_t encoded[128];
  uint8_t mutated[129];
  uint8_t digest[32];
  size_t encoded_size = 0;
  size_t bytes_written = 0;
  REQUIRE(hmg4v27_xattr_set_stream_size(unsorted, 2, &bounds, &encoded_size) ==
          HMG4V27_CANONICAL_BAD_ORDER);
  REQUIRE(hmg4v27_xattr_set_stream_size(duplicate, 2, &bounds, &encoded_size) ==
          HMG4V27_CANONICAL_DUPLICATE);
  invalid.name = name_nul;
  invalid.name_length = sizeof(name_nul);
  REQUIRE(hmg4v27_xattr_set_stream_size(&invalid, 1, &bounds, &encoded_size) ==
          HMG4V27_CANONICAL_BAD_NAME);
  invalid = sorted[0];
  invalid.name_length = 0;
  REQUIRE(hmg4v27_xattr_set_stream_size(&invalid, 1, &bounds, &encoded_size) ==
          HMG4V27_CANONICAL_BAD_NAME);

  changed.maximum_attribute_count = 1;
  REQUIRE(hmg4v27_xattr_set_stream_size(sorted, 2, &changed, &encoded_size) ==
          HMG4V27_CANONICAL_BOUND_EXCEEDED);
  changed = bounds;
  changed.maximum_name_length = 0;
  REQUIRE(hmg4v27_xattr_set_stream_size(sorted, 2, &changed, &encoded_size) ==
          HMG4V27_CANONICAL_BOUND_EXCEEDED);
  invalid = sorted[0];
  invalid.name_length = UINT32_MAX;
  REQUIRE(hmg4v27_xattr_set_stream_size(&invalid, 1, &bounds, &encoded_size) ==
          HMG4V27_CANONICAL_BOUND_EXCEEDED);
  changed = bounds;
  changed.maximum_value_length = 2;
  REQUIRE(hmg4v27_xattr_set_stream_size(sorted, 2, &changed, &encoded_size) ==
          HMG4V27_CANONICAL_BOUND_EXCEEDED);
  changed = bounds;
  changed.maximum_total_value_length = 3;
  REQUIRE(hmg4v27_xattr_set_stream_size(sorted, 2, &changed, &encoded_size) ==
          HMG4V27_CANONICAL_BOUND_EXCEEDED);
  REQUIRE(hmg4v27_xattr_set_stream_size(sorted, 2, &bounds, &encoded_size) ==
          HMG4V27_CANONICAL_OK);
  changed = bounds;
  changed.maximum_stream_length = encoded_size - 1;
  REQUIRE(hmg4v27_xattr_set_stream_size(sorted, 2, &changed, &bytes_written) ==
          HMG4V27_CANONICAL_BOUND_EXCEEDED);

  memset(encoded, 0xa5, sizeof(encoded));
  REQUIRE(hmg4v27_xattr_set_stream_encode(unsorted, 2, &bounds, encoded,
                                         sizeof(encoded), &bytes_written) ==
          HMG4V27_CANONICAL_BAD_ORDER);
  REQUIRE(bytes_written == 0 && encoded[0] == 0xa5);
  REQUIRE(hmg4v27_xattr_set_stream_encode(sorted, 2, &bounds, encoded,
                                         encoded_size - 1, &bytes_written) ==
          HMG4V27_CANONICAL_BUFFER_TOO_SMALL);
  REQUIRE(bytes_written == 0 && encoded[0] == 0xa5);
  REQUIRE(hmg4v27_xattr_set_stream_encode(sorted, 2, &bounds, encoded,
                                         sizeof(encoded), &bytes_written) ==
          HMG4V27_CANONICAL_OK);

  memcpy(mutated, encoded, bytes_written);
  mutated[0] ^= 1;
  REQUIRE(hmg4v27_xattr_set_stream_validate(mutated, bytes_written, &bounds,
                                           NULL) ==
          HMG4V27_CANONICAL_BAD_MAGIC);
  memcpy(mutated, encoded, bytes_written);
  mutated[11] = 3;
  REQUIRE(hmg4v27_xattr_set_stream_validate(mutated, bytes_written, &bounds,
                                           NULL) ==
          HMG4V27_CANONICAL_BAD_VERSION);
  memcpy(mutated, encoded, bytes_written);
  mutated[20] = 'b';
  mutated[34] = 'a';
  REQUIRE(hmg4v27_xattr_set_stream_validate(mutated, bytes_written, &bounds,
                                           NULL) ==
          HMG4V27_CANONICAL_BAD_ORDER);
  mutated[34] = 'b';
  REQUIRE(hmg4v27_xattr_set_stream_validate(mutated, bytes_written, &bounds,
                                           NULL) ==
          HMG4V27_CANONICAL_DUPLICATE);
  memcpy(mutated, encoded, bytes_written);
  mutated[20] = 0;
  REQUIRE(hmg4v27_xattr_set_stream_validate(mutated, bytes_written, &bounds,
                                           NULL) ==
          HMG4V27_CANONICAL_BAD_NAME);
  memcpy(mutated, encoded, bytes_written);
  mutated[28] = 9;
  REQUIRE(hmg4v27_xattr_set_stream_validate(mutated, bytes_written, &bounds,
                                           NULL) ==
          HMG4V27_CANONICAL_BOUND_EXCEEDED);
  memcpy(mutated, encoded, bytes_written);
  mutated[bytes_written] = 0;
  REQUIRE(hmg4v27_xattr_set_stream_validate(mutated, bytes_written + 1, &bounds,
                                           NULL) ==
          HMG4V27_CANONICAL_TRAILING_BYTES);
  REQUIRE(hmg4v27_xattr_set_stream_validate(encoded, bytes_written - 1, &bounds,
                                           NULL) ==
          HMG4V27_CANONICAL_TRUNCATED);
  memset(digest, 0x5a, sizeof(digest));
  REQUIRE(hmg4v27_xattr_set_stream_sha256(mutated, bytes_written + 1, &bounds,
                                         digest) ==
          HMG4V27_CANONICAL_TRAILING_BYTES);
  REQUIRE(digest[0] == 0x5a && digest[31] == 0x5a);

  invalid.name = name_a;
  invalid.name_length = sizeof(name_a);
  invalid.value = value_one;
  invalid.value_length = UINT64_MAX;
  changed.maximum_attribute_count = UINT32_MAX;
  changed.maximum_name_length = UINT32_MAX;
  changed.maximum_value_length = UINT64_MAX;
  changed.maximum_total_value_length = UINT64_MAX;
  changed.maximum_stream_length = UINT64_MAX;
  REQUIRE(hmg4v27_xattr_set_stream_size(&invalid, 1, &changed, &encoded_size) ==
          HMG4V27_CANONICAL_SIZE_OVERFLOW);
  return 0;
}

static int test_symlink_vector_hash_and_rejections(void) {
  static const uint8_t target[] = "../target with spaces";
  static const char expected_hex[] =
      "484d47344c32000000000002000000152e2e2f746172676574207769746820737061636573";
  static const char expected_hash_hex[] =
      "a6b5cb1303af8c4771e115769e8f5f9f56b4e989d585e26995586d91cbc3d5cc";
  static const uint8_t target_with_nul[] = {'a', 0x00, 'b'};
  uint8_t encoded[128];
  uint8_t expected[128];
  uint8_t expected_digest[32];
  uint8_t stream_digest[32];
  uint8_t direct_digest[32];
  size_t encoded_size = 0;
  size_t bytes_written = 0;
  size_t expected_length = 0;
  size_t digest_length = 0;
  uint32_t parsed_length = 0;
  REQUIRE(sizeof(target) - 1 == 21);
  REQUIRE(decode_hex(expected_hex, expected, sizeof(expected),
                     &expected_length));
  REQUIRE(decode_hex(expected_hash_hex, expected_digest,
                     sizeof(expected_digest), &digest_length));
  REQUIRE(digest_length == sizeof(expected_digest));
  REQUIRE(hmg4v27_symlink_target_stream_size(sizeof(target) - 1,
                                            &encoded_size) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(encoded_size == expected_length);
  REQUIRE(hmg4v27_symlink_target_stream_encode(
              target, sizeof(target) - 1, encoded, sizeof(encoded),
              &bytes_written) == HMG4V27_CANONICAL_OK);
  REQUIRE(bytes_written == expected_length);
  REQUIRE(memcmp(encoded, expected, expected_length) == 0);
  REQUIRE(hmg4v27_symlink_target_stream_validate(encoded, bytes_written,
                                                &parsed_length) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(parsed_length == sizeof(target) - 1);
  REQUIRE(hmg4v27_symlink_target_stream_sha256(encoded, bytes_written,
                                              stream_digest) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(hmg4v27_symlink_target_sha256(target, sizeof(target) - 1,
                                      direct_digest) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(memcmp(stream_digest, expected_digest, sizeof(stream_digest)) == 0);
  REQUIRE(memcmp(direct_digest, expected_digest, sizeof(direct_digest)) == 0);

  encoded[0] ^= 1;
  REQUIRE(hmg4v27_symlink_target_stream_validate(encoded, bytes_written, NULL) ==
          HMG4V27_CANONICAL_BAD_MAGIC);
  encoded[0] ^= 1;
  encoded[11] = 3;
  REQUIRE(hmg4v27_symlink_target_stream_validate(encoded, bytes_written, NULL) ==
          HMG4V27_CANONICAL_BAD_VERSION);
  encoded[11] = 2;
  write_u32_be(encoded + 12, 22);
  REQUIRE(hmg4v27_symlink_target_stream_validate(encoded, bytes_written, NULL) ==
          HMG4V27_CANONICAL_TRUNCATED);
  write_u32_be(encoded + 12, 20);
  REQUIRE(hmg4v27_symlink_target_stream_validate(encoded, bytes_written, NULL) ==
          HMG4V27_CANONICAL_TRAILING_BYTES);
  write_u32_be(encoded + 12, 21);
  REQUIRE(hmg4v27_symlink_target_stream_validate(encoded, bytes_written - 1,
                                                NULL) ==
          HMG4V27_CANONICAL_TRUNCATED);

  REQUIRE(hmg4v27_symlink_target_stream_encode(NULL, 0, encoded,
                                              sizeof(encoded),
                                              &bytes_written) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(bytes_written == 16);
  REQUIRE(hmg4v27_symlink_target_stream_validate(encoded, bytes_written,
                                                &parsed_length) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(parsed_length == 0);
  REQUIRE(hmg4v27_symlink_target_stream_encode(
              target_with_nul, sizeof(target_with_nul), encoded,
              sizeof(encoded), &bytes_written) == HMG4V27_CANONICAL_OK);
  REQUIRE(bytes_written == 19);
  REQUIRE(encoded[17] == 0);
  REQUIRE(hmg4v27_symlink_target_stream_validate(encoded, bytes_written,
                                                &parsed_length) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(parsed_length == sizeof(target_with_nul));
  return 0;
}

static int test_null_and_capacity_contracts(void) {
  hmg4v27_xattr_bounds bounds = ordinary_xattr_bounds();
  uint8_t output[32];
  uint8_t digest[32];
  size_t size = 0;
  size_t written = 0;
  REQUIRE(hmg4v27_acl_stream_size(NULL, 0, NULL) ==
          HMG4V27_CANONICAL_NULL_ARGUMENT);
  REQUIRE(hmg4v27_acl_stream_encode(NULL, 0, NULL, 0, &written) ==
          HMG4V27_CANONICAL_NULL_ARGUMENT);
  REQUIRE(written == 0);
  memset(output, 0xa5, sizeof(output));
  REQUIRE(hmg4v27_acl_stream_encode(NULL, 0, output, 15, &written) ==
          HMG4V27_CANONICAL_BUFFER_TOO_SMALL);
  REQUIRE(written == 0 && output[0] == 0xa5);
  REQUIRE(hmg4v27_acl_stream_validate(NULL, 0, NULL) ==
          HMG4V27_CANONICAL_TRUNCATED);
  REQUIRE(hmg4v27_acl_stream_sha256(NULL, 0, digest) ==
          HMG4V27_CANONICAL_TRUNCATED);

  REQUIRE(hmg4v27_xattr_set_stream_size(NULL, 0, NULL, &size) ==
          HMG4V27_CANONICAL_NULL_ARGUMENT);
  REQUIRE(hmg4v27_xattr_set_stream_size(NULL, 0, &bounds, &size) ==
          HMG4V27_CANONICAL_OK);
  REQUIRE(size == 16);
  REQUIRE(hmg4v27_xattr_set_stream_validate(NULL, 0, &bounds, NULL) ==
          HMG4V27_CANONICAL_TRUNCATED);

  REQUIRE(hmg4v27_symlink_target_stream_size(0, NULL) ==
          HMG4V27_CANONICAL_NULL_ARGUMENT);
  REQUIRE(hmg4v27_symlink_target_stream_encode(NULL, 1, output,
                                              sizeof(output), &written) ==
          HMG4V27_CANONICAL_NULL_ARGUMENT);
  REQUIRE(hmg4v27_symlink_target_sha256(NULL, 1, digest) ==
          HMG4V27_CANONICAL_NULL_ARGUMENT);
  return 0;
}

int main(void) {
  int result = 0;
  result = test_acl_normative_vectors();
  if (result != 0) return result;
  result = test_acl_rejections_and_order();
  if (result != 0) return result;
  result = test_xattr_vector_and_hash();
  if (result != 0) return result;
  result = test_xattr_rejections_and_bounds();
  if (result != 0) return result;
  result = test_symlink_vector_hash_and_rejections();
  if (result != 0) return result;
  result = test_null_and_capacity_contracts();
  if (result != 0) return result;
  return 0;
}
