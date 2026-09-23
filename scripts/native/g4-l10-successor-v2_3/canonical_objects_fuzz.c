#include "canonical_objects.h"

#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

enum {
  HMG4V23_FUZZ_CASES = 120000,
  HMG4V23_FUZZ_STREAM_CAPACITY = 1024,
  HMG4V23_FUZZ_RAW_CAPACITY = 256,
  HMG4V23_FUZZ_MAX_ACL_ENTRIES = 6,
  HMG4V23_FUZZ_MAX_XATTRS = 5,
  HMG4V23_FUZZ_MAX_XATTR_NAME = 4,
  HMG4V23_FUZZ_MAX_XATTR_VALUE = 16,
  HMG4V23_FUZZ_MAX_SYMLINK_TARGET = 64
};

typedef struct {
  uint64_t state;
} hmg4v23_fuzz_rng;

typedef struct {
  uint64_t checksum;
  uint64_t validation_ok[3];
  uint64_t validation_rejected[3];
  uint64_t encode_ok[3];
  uint64_t encode_rejected[3];
  uint64_t aligned_calls;
  uint64_t misaligned_calls;
} hmg4v23_fuzz_stats;

static uint64_t rng_next(hmg4v23_fuzz_rng *rng) {
  uint64_t value = rng->state;
  value ^= value >> 12;
  value ^= value << 25;
  value ^= value >> 27;
  rng->state = value;
  return value * UINT64_C(2685821657736338717);
}

static size_t rng_bounded(hmg4v23_fuzz_rng *rng, size_t bound) {
  if (bound == 0) return 0;
  return (size_t)(rng_next(rng) % (uint64_t)bound);
}

static void fill_random(
    hmg4v23_fuzz_rng *rng,
    uint8_t *bytes,
    size_t length) {
  size_t offset = 0;
  while (offset < length) {
    uint64_t value = rng_next(rng);
    unsigned int byte_index = 0;
    for (byte_index = 0; byte_index < 8 && offset < length;
         byte_index += 1) {
      bytes[offset] = (uint8_t)value;
      value >>= 8;
      offset += 1;
    }
  }
}

static void fold_u64(hmg4v23_fuzz_stats *stats, uint64_t value) {
  stats->checksum ^= value + UINT64_C(0x9e3779b97f4a7c15) +
                     (stats->checksum << 6) + (stats->checksum >> 2);
}

static void fold_bytes(
    hmg4v23_fuzz_stats *stats,
    const uint8_t *bytes,
    size_t length) {
  size_t index = 0;
  for (index = 0; index < length; index += 1) {
    fold_u64(stats, bytes[index]);
  }
}

static void record_alignment(
    hmg4v23_fuzz_stats *stats,
    size_t pointer_offset) {
  if (pointer_offset == 0) {
    stats->aligned_calls += 1;
  } else {
    stats->misaligned_calls += 1;
  }
}

static void record_validation(
    hmg4v23_fuzz_stats *stats,
    size_t object_kind,
    hmg4v23_canonical_result result) {
  if (result == HMG4V23_CANONICAL_OK) {
    stats->validation_ok[object_kind] += 1;
  } else {
    stats->validation_rejected[object_kind] += 1;
  }
  fold_u64(stats, ((uint64_t)object_kind << 32) | (uint32_t)result);
}

static void record_encode(
    hmg4v23_fuzz_stats *stats,
    size_t object_kind,
    hmg4v23_canonical_result result) {
  if (result == HMG4V23_CANONICAL_OK) {
    stats->encode_ok[object_kind] += 1;
  } else {
    stats->encode_rejected[object_kind] += 1;
  }
  fold_u64(stats, UINT64_C(0xe000000000000000) |
                      ((uint64_t)object_kind << 32) | (uint32_t)result);
}

static size_t mutate_stream(
    hmg4v23_fuzz_rng *rng,
    const uint8_t *source,
    size_t source_length,
    uint8_t *destination,
    size_t destination_capacity) {
  const size_t mode = rng_bounded(rng, 6);
  size_t result_length = source_length;
  if (source_length > destination_capacity) return 0;
  if (source_length > 0) memcpy(destination, source, source_length);
  if (mode == 1 && result_length > 0) {
    destination[rng_bounded(rng, result_length)] ^=
        (uint8_t)(UINT8_C(1) << rng_bounded(rng, 8));
  } else if (mode == 2 && result_length > 0) {
    result_length -= 1;
  } else if (mode == 3 && result_length < destination_capacity) {
    destination[result_length] = (uint8_t)rng_next(rng);
    result_length += 1;
  } else if (mode == 4 && result_length >= 16) {
    destination[12 + rng_bounded(rng, 4)] ^= (uint8_t)rng_next(rng);
  } else if (mode == 5 && result_length > 16) {
    destination[16 + rng_bounded(rng, result_length - 16)] = 0;
  }
  return result_length;
}

static void validate_and_hash_acl(
    hmg4v23_fuzz_stats *stats,
    const uint8_t *stream,
    size_t stream_length,
    size_t pointer_offset) {
  uint8_t digest[HMG4V23_CANONICAL_SHA256_LENGTH];
  const hmg4v23_canonical_result result =
      hmg4v23_acl_stream_validate(stream, stream_length, NULL);
  record_alignment(stats, pointer_offset);
  record_validation(stats, 0, result);
  if (result == HMG4V23_CANONICAL_OK) {
    const hmg4v23_canonical_result hash_result =
        hmg4v23_acl_stream_sha256(stream, stream_length, digest);
    fold_u64(stats, (uint32_t)hash_result);
    if (hash_result == HMG4V23_CANONICAL_OK) {
      fold_bytes(stats, digest, sizeof(digest));
    }
  }
}

static void exercise_acl(
    hmg4v23_fuzz_rng *rng,
    uint32_t iteration,
    hmg4v23_fuzz_stats *stats) {
  hmg4v23_acl_entry entries[HMG4V23_FUZZ_MAX_ACL_ENTRIES];
  uint8_t qualifiers[HMG4V23_FUZZ_MAX_ACL_ENTRIES][16];
  _Alignas(max_align_t)
      uint8_t output_storage[HMG4V23_FUZZ_STREAM_CAPACITY + 2];
  _Alignas(max_align_t)
      uint8_t mutation_storage[HMG4V23_FUZZ_STREAM_CAPACITY + 2];
  _Alignas(max_align_t) uint8_t raw_storage[HMG4V23_FUZZ_RAW_CAPACITY + 2];
  const size_t pointer_offset = iteration & 1u;
  const size_t mutation_offset = pointer_offset == 0 ? 1 : 0;
  const uint32_t entry_count =
      (uint32_t)rng_bounded(rng, HMG4V23_FUZZ_MAX_ACL_ENTRIES + 1);
  uint8_t *output = output_storage + pointer_offset;
  uint8_t *mutation = mutation_storage + mutation_offset;
  uint8_t *raw = raw_storage + pointer_offset;
  size_t output_capacity = sizeof(output_storage) - pointer_offset;
  size_t encoded_size = 0;
  size_t written = 0;
  size_t mutated_length = 0;
  size_t raw_length = rng_bounded(rng, HMG4V23_FUZZ_RAW_CAPACITY + 1);
  uint32_t index = 0;
  hmg4v23_canonical_result size_result;
  hmg4v23_canonical_result encode_result;
  for (index = 0; index < entry_count; index += 1) {
    fill_random(rng, qualifiers[index], sizeof(qualifiers[index]));
    qualifiers[index][0] = (uint8_t)index;
    entries[index].tag = (rng_next(rng) & 1) != 0
                             ? HMG4V23_ACL_TAG_ALLOW_NAMED_UUID
                             : HMG4V23_ACL_TAG_DENY_NAMED_UUID;
    entries[index].qualifier = qualifiers[index];
    entries[index].qualifier_length = HMG4V23_ACL_NAMED_UUID_LENGTH;
    entries[index].permissions =
        rng_next(rng) & HMG4V23_ACL_ALLOWED_PERMISSION_MASK;
    entries[index].flags = rng_next(rng) & HMG4V23_ACL_ALLOWED_FLAG_MASK;
  }
  if (entry_count > 0) {
    switch (rng_bounded(rng, 9)) {
      case 1:
        entries[0].tag = 3;
        break;
      case 2:
        entries[0].qualifier_length = 15;
        break;
      case 3:
        entries[0].permissions |= UINT64_C(1) << 14;
        break;
      case 4:
        entries[0].flags |= UINT64_C(1) << 5;
        break;
      case 5:
        entries[0].qualifier = NULL;
        break;
      case 6:
        if (entry_count > 1) {
          memcpy(qualifiers[1], qualifiers[0], sizeof(qualifiers[0]));
        }
        break;
      default:
        break;
    }
  }
  size_result =
      hmg4v23_acl_stream_size(entries, entry_count, &encoded_size);
  fold_u64(stats, UINT64_C(0xa100000000000000) | (uint32_t)size_result);
  if (rng_bounded(rng, 5) == 0) {
    output_capacity = rng_bounded(rng, output_capacity + 1);
  }
  encode_result = hmg4v23_acl_stream_encode(
      entries, entry_count, output, output_capacity, &written);
  record_encode(stats, 0, encode_result);
  record_alignment(stats, pointer_offset);
  if (encode_result == HMG4V23_CANONICAL_OK) {
    fold_u64(stats, encoded_size);
    validate_and_hash_acl(stats, output, written, pointer_offset);
    mutated_length = mutate_stream(
        rng, output, written, mutation,
        sizeof(mutation_storage) - mutation_offset);
    validate_and_hash_acl(stats, mutation, mutated_length, mutation_offset);
  }
  fill_random(rng, raw, raw_length);
  validate_and_hash_acl(stats, raw, raw_length, pointer_offset);
}

static hmg4v23_xattr_bounds fuzz_xattr_bounds(void) {
  hmg4v23_xattr_bounds bounds;
  bounds.maximum_attribute_count = HMG4V23_FUZZ_MAX_XATTRS;
  bounds.maximum_name_length = HMG4V23_FUZZ_MAX_XATTR_NAME;
  bounds.maximum_value_length = HMG4V23_FUZZ_MAX_XATTR_VALUE;
  bounds.maximum_total_value_length =
      HMG4V23_FUZZ_MAX_XATTRS * HMG4V23_FUZZ_MAX_XATTR_VALUE;
  bounds.maximum_stream_length = HMG4V23_FUZZ_STREAM_CAPACITY;
  return bounds;
}

static void validate_and_hash_xattrs(
    hmg4v23_fuzz_stats *stats,
    const uint8_t *stream,
    size_t stream_length,
    size_t pointer_offset,
    const hmg4v23_xattr_bounds *bounds) {
  uint8_t digest[HMG4V23_CANONICAL_SHA256_LENGTH];
  const hmg4v23_canonical_result result =
      hmg4v23_xattr_set_stream_validate(
          stream, stream_length, bounds, NULL);
  record_alignment(stats, pointer_offset);
  record_validation(stats, 1, result);
  if (result == HMG4V23_CANONICAL_OK) {
    const hmg4v23_canonical_result hash_result =
        hmg4v23_xattr_set_stream_sha256(
            stream, stream_length, bounds, digest);
    fold_u64(stats, (uint32_t)hash_result);
    if (hash_result == HMG4V23_CANONICAL_OK) {
      fold_bytes(stats, digest, sizeof(digest));
    }
  }
}

static void exercise_xattrs(
    hmg4v23_fuzz_rng *rng,
    uint32_t iteration,
    hmg4v23_fuzz_stats *stats) {
  hmg4v23_xattr attributes[HMG4V23_FUZZ_MAX_XATTRS];
  uint8_t names[HMG4V23_FUZZ_MAX_XATTRS][HMG4V23_FUZZ_MAX_XATTR_NAME];
  uint8_t values[HMG4V23_FUZZ_MAX_XATTRS][HMG4V23_FUZZ_MAX_XATTR_VALUE];
  _Alignas(max_align_t)
      uint8_t output_storage[HMG4V23_FUZZ_STREAM_CAPACITY + 2];
  _Alignas(max_align_t)
      uint8_t mutation_storage[HMG4V23_FUZZ_STREAM_CAPACITY + 2];
  _Alignas(max_align_t) uint8_t raw_storage[HMG4V23_FUZZ_RAW_CAPACITY + 2];
  hmg4v23_xattr_bounds bounds = fuzz_xattr_bounds();
  const size_t pointer_offset = (iteration + 1u) & 1u;
  const size_t mutation_offset = pointer_offset == 0 ? 1 : 0;
  const uint32_t attribute_count =
      (uint32_t)rng_bounded(rng, HMG4V23_FUZZ_MAX_XATTRS + 1);
  uint8_t *output = output_storage + pointer_offset;
  uint8_t *mutation = mutation_storage + mutation_offset;
  uint8_t *raw = raw_storage + pointer_offset;
  size_t output_capacity = sizeof(output_storage) - pointer_offset;
  size_t encoded_size = 0;
  size_t written = 0;
  size_t mutated_length = 0;
  size_t raw_length = rng_bounded(rng, HMG4V23_FUZZ_RAW_CAPACITY + 1);
  uint32_t index = 0;
  hmg4v23_canonical_result size_result;
  hmg4v23_canonical_result encode_result;
  for (index = 0; index < attribute_count; index += 1) {
    const uint32_t name_length =
        (uint32_t)(1 + rng_bounded(rng, HMG4V23_FUZZ_MAX_XATTR_NAME));
    const uint64_t value_length =
        (uint64_t)rng_bounded(rng, HMG4V23_FUZZ_MAX_XATTR_VALUE + 1);
    fill_random(rng, names[index], sizeof(names[index]));
    fill_random(rng, values[index], sizeof(values[index]));
    names[index][0] = (uint8_t)(0x10u + index * 0x20u);
    if (name_length > 1 && names[index][1] == 0) names[index][1] = 1;
    if (name_length > 2 && names[index][2] == 0) names[index][2] = 1;
    if (name_length > 3 && names[index][3] == 0) names[index][3] = 1;
    attributes[index].name = names[index];
    attributes[index].name_length = name_length;
    attributes[index].value = value_length == 0 ? NULL : values[index];
    attributes[index].value_length = value_length;
  }
  if (attribute_count > 0) {
    switch (rng_bounded(rng, 11)) {
      case 1:
        names[0][0] = 0;
        break;
      case 2:
        attributes[0].name_length = UINT32_MAX;
        break;
      case 3:
        attributes[0].value_length =
            (uint64_t)bounds.maximum_value_length + 1;
        break;
      case 4:
        attributes[0].value = NULL;
        attributes[0].value_length = 1;
        break;
      case 5:
        bounds.maximum_attribute_count = attribute_count - 1;
        break;
      case 6:
        bounds.maximum_stream_length = 15;
        break;
      case 7:
        if (attribute_count > 1) {
          memcpy(names[1], names[0], sizeof(names[0]));
          attributes[1].name_length = attributes[0].name_length;
        }
        break;
      case 8:
        if (attribute_count > 1) {
          hmg4v23_xattr temporary = attributes[0];
          attributes[0] = attributes[1];
          attributes[1] = temporary;
        }
        break;
      default:
        break;
    }
  }
  size_result = hmg4v23_xattr_set_stream_size(
      attributes, attribute_count, &bounds, &encoded_size);
  fold_u64(stats, UINT64_C(0xa200000000000000) | (uint32_t)size_result);
  if (rng_bounded(rng, 5) == 0) {
    output_capacity = rng_bounded(rng, output_capacity + 1);
  }
  encode_result = hmg4v23_xattr_set_stream_encode(
      attributes, attribute_count, &bounds, output, output_capacity, &written);
  record_encode(stats, 1, encode_result);
  record_alignment(stats, pointer_offset);
  if (encode_result == HMG4V23_CANONICAL_OK) {
    fold_u64(stats, encoded_size);
    validate_and_hash_xattrs(
        stats, output, written, pointer_offset, &bounds);
    mutated_length = mutate_stream(
        rng, output, written, mutation,
        sizeof(mutation_storage) - mutation_offset);
    validate_and_hash_xattrs(
        stats, mutation, mutated_length, mutation_offset, &bounds);
  }
  fill_random(rng, raw, raw_length);
  validate_and_hash_xattrs(
      stats, raw, raw_length, pointer_offset, &bounds);
}

static void validate_and_hash_symlink(
    hmg4v23_fuzz_stats *stats,
    const uint8_t *stream,
    size_t stream_length,
    size_t pointer_offset) {
  uint8_t digest[HMG4V23_CANONICAL_SHA256_LENGTH];
  const hmg4v23_canonical_result result =
      hmg4v23_symlink_target_stream_validate(
          stream, stream_length, NULL);
  record_alignment(stats, pointer_offset);
  record_validation(stats, 2, result);
  if (result == HMG4V23_CANONICAL_OK) {
    const hmg4v23_canonical_result hash_result =
        hmg4v23_symlink_target_stream_sha256(
            stream, stream_length, digest);
    fold_u64(stats, (uint32_t)hash_result);
    if (hash_result == HMG4V23_CANONICAL_OK) {
      fold_bytes(stats, digest, sizeof(digest));
    }
  }
}

static void exercise_symlink(
    hmg4v23_fuzz_rng *rng,
    uint32_t iteration,
    hmg4v23_fuzz_stats *stats) {
  uint8_t target[HMG4V23_FUZZ_MAX_SYMLINK_TARGET];
  _Alignas(max_align_t)
      uint8_t output_storage[HMG4V23_FUZZ_STREAM_CAPACITY + 2];
  _Alignas(max_align_t)
      uint8_t mutation_storage[HMG4V23_FUZZ_STREAM_CAPACITY + 2];
  _Alignas(max_align_t) uint8_t raw_storage[HMG4V23_FUZZ_RAW_CAPACITY + 2];
  const size_t pointer_offset = iteration & 1u;
  const size_t mutation_offset = pointer_offset == 0 ? 1 : 0;
  const uint32_t target_length =
      (uint32_t)rng_bounded(rng, HMG4V23_FUZZ_MAX_SYMLINK_TARGET + 1);
  const uint8_t *target_pointer = target_length == 0 ? NULL : target;
  uint8_t *output = output_storage + pointer_offset;
  uint8_t *mutation = mutation_storage + mutation_offset;
  uint8_t *raw = raw_storage + pointer_offset;
  size_t output_capacity = sizeof(output_storage) - pointer_offset;
  size_t encoded_size = 0;
  size_t written = 0;
  size_t mutated_length = 0;
  size_t raw_length = rng_bounded(rng, HMG4V23_FUZZ_RAW_CAPACITY + 1);
  hmg4v23_canonical_result size_result;
  hmg4v23_canonical_result encode_result;
  fill_random(rng, target, sizeof(target));
  size_result =
      hmg4v23_symlink_target_stream_size(target_length, &encoded_size);
  fold_u64(stats, UINT64_C(0xa300000000000000) | (uint32_t)size_result);
  if (rng_bounded(rng, 13) == 0 && target_length > 0) {
    target_pointer = NULL;
  }
  if (rng_bounded(rng, 5) == 0) {
    output_capacity = rng_bounded(rng, output_capacity + 1);
  }
  encode_result = hmg4v23_symlink_target_stream_encode(
      target_pointer, target_length, output, output_capacity, &written);
  record_encode(stats, 2, encode_result);
  record_alignment(stats, pointer_offset);
  if (encode_result == HMG4V23_CANONICAL_OK) {
    uint8_t direct_digest[HMG4V23_CANONICAL_SHA256_LENGTH];
    const hmg4v23_canonical_result direct_hash_result =
        hmg4v23_symlink_target_sha256(
            target_pointer, target_length, direct_digest);
    fold_u64(stats, encoded_size);
    fold_u64(stats, (uint32_t)direct_hash_result);
    if (direct_hash_result == HMG4V23_CANONICAL_OK) {
      fold_bytes(stats, direct_digest, sizeof(direct_digest));
    }
    validate_and_hash_symlink(stats, output, written, pointer_offset);
    mutated_length = mutate_stream(
        rng, output, written, mutation,
        sizeof(mutation_storage) - mutation_offset);
    validate_and_hash_symlink(
        stats, mutation, mutated_length, mutation_offset);
  }
  fill_random(rng, raw, raw_length);
  validate_and_hash_symlink(stats, raw, raw_length, pointer_offset);
}

int main(void) {
  hmg4v23_fuzz_rng rng = {UINT64_C(0x6a09e667f3bcc909)};
  hmg4v23_fuzz_stats stats;
  uint32_t iteration = 0;
  size_t object_kind = 0;
  memset(&stats, 0, sizeof(stats));
  stats.checksum = UINT64_C(0xcbf29ce484222325);
  for (iteration = 0; iteration < HMG4V23_FUZZ_CASES; iteration += 1) {
    exercise_acl(&rng, iteration, &stats);
    exercise_xattrs(&rng, iteration, &stats);
    exercise_symlink(&rng, iteration, &stats);
  }
  for (object_kind = 0; object_kind < 3; object_kind += 1) {
    if (stats.validation_ok[object_kind] == 0 ||
        stats.validation_rejected[object_kind] == 0 ||
        stats.encode_ok[object_kind] == 0 ||
        stats.encode_rejected[object_kind] == 0) {
      return 2;
    }
  }
  if (stats.aligned_calls == 0 || stats.misaligned_calls == 0) return 3;
  printf(
      "canonical_objects_fuzz cases=%u checksum=%016llx "
      "acl=%llu/%llu/%llu/%llu "
      "xattr=%llu/%llu/%llu/%llu "
      "symlink=%llu/%llu/%llu/%llu aligned=%llu misaligned=%llu\n",
      (unsigned int)HMG4V23_FUZZ_CASES,
      (unsigned long long)stats.checksum,
      (unsigned long long)stats.validation_ok[0],
      (unsigned long long)stats.validation_rejected[0],
      (unsigned long long)stats.encode_ok[0],
      (unsigned long long)stats.encode_rejected[0],
      (unsigned long long)stats.validation_ok[1],
      (unsigned long long)stats.validation_rejected[1],
      (unsigned long long)stats.encode_ok[1],
      (unsigned long long)stats.encode_rejected[1],
      (unsigned long long)stats.validation_ok[2],
      (unsigned long long)stats.validation_rejected[2],
      (unsigned long long)stats.encode_ok[2],
      (unsigned long long)stats.encode_rejected[2],
      (unsigned long long)stats.aligned_calls,
      (unsigned long long)stats.misaligned_calls);
  return 0;
}
