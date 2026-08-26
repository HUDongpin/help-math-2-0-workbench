#include "schema_delta.h"

#include <limits.h>

#define ENTRY(context_value, tag_value, type_value, context_text, field_text) \
  {(context_value), (tag_value), (type_value), 0, HMG4V27_SIGNED_NONE, 0, 0, \
   (context_text), (field_text)}
#define S64_EXACT(context_value, tag_value, exact_value, context_text, field_text) \
  {(context_value), (tag_value), HMG4V27_TLV_S64, 0, HMG4V27_SIGNED_EXACT, \
   (exact_value), (exact_value), (context_text), (field_text)}
#define S64_RANGE(context_value, tag_value, minimum_value, maximum_value, context_text, field_text) \
  {(context_value), (tag_value), HMG4V27_TLV_S64, 0, HMG4V27_SIGNED_RANGE, \
   (minimum_value), (maximum_value), (context_text), (field_text)}

static const hmg4v27_schema_delta_entry entries[] = {
    ENTRY(HMG4V27_SCHEMA_XATTR_RULE, 0x7101, HMG4V27_TLV_U32,
          "HMG4Y2.attributes.XattrRule", "ordinal"),
    ENTRY(HMG4V27_SCHEMA_XATTR_RULE, 0x7102, HMG4V27_TLV_BYTES,
          "HMG4Y2.attributes.XattrRule", "name"),
    ENTRY(HMG4V27_SCHEMA_XATTR_RULE, 0x7103, HMG4V27_TLV_BYTES,
          "HMG4Y2.attributes.XattrRule", "value"),
    ENTRY(HMG4V27_SCHEMA_ROOT_IDENTITY_EXTENSION, 0x020a, HMG4V27_TLV_U32,
          "RootIdentity", "authority_root_slot"),
    ENTRY(HMG4V27_SCHEMA_ROOT_IDENTITY_EXTENSION, 0x020b, HMG4V27_TLV_SHA256,
          "RootIdentity", "parent_child_edge_set_sha256"),
    ENTRY(HMG4V27_SCHEMA_VIOLATION, 0x0301, HMG4V27_TLV_U32,
          "Violation", "code"),
    ENTRY(HMG4V27_SCHEMA_VIOLATION, 0x0302, HMG4V27_TLV_U32,
          "Violation", "entry_index"),
    ENTRY(HMG4V27_SCHEMA_VIOLATION, 0x0303, HMG4V27_TLV_SHA256,
          "Violation", "evidence_sha256"),
    ENTRY(HMG4V27_SCHEMA_RECOVERY_AUTHORIZATION_EXTENSION, 0x0f17,
          HMG4V27_TLV_STRUCT, "HMG4O2.recovery_authorization", "operator_identity"),
    ENTRY(HMG4V27_SCHEMA_RECOVERY_AUTHORIZATION_EXTENSION, 0x0f18,
          HMG4V27_TLV_SHA256, "HMG4O2.recovery_authorization", "authorization_statement_sha256"),
    ENTRY(HMG4V27_SCHEMA_RECOVERY_AUTHORIZATION_EXTENSION, 0x0f19,
          HMG4V27_TLV_U32, "HMG4O2.recovery_authorization", "signature_algorithm"),
    ENTRY(HMG4V27_SCHEMA_RECOVERY_AUTHORIZATION_EXTENSION, 0x0f1a,
          HMG4V27_TLV_BYTES, "HMG4O2.recovery_authorization", "detached_signature"),
    ENTRY(HMG4V27_SCHEMA_RECOVERY_AUTHORIZATION_EXTENSION, 0x0f1b,
          HMG4V27_TLV_SHA256, "HMG4O2.recovery_authorization", "recovery_admission_snapshot_sha256"),
    ENTRY(HMG4V27_SCHEMA_RECOVERY_AUTHORIZATION_EXTENSION, 0x0f1c,
          HMG4V27_TLV_STRUCT, "HMG4O2.recovery_authorization", "recovery_admission_snapshot"),
    ENTRY(HMG4V27_SCHEMA_ROLLBACK_BEGIN_EXTENSION, 0xa605,
          HMG4V27_TLV_SHA256, "Journal.ROLLBACK_BEGIN", "reason_evidence_sha256"),
    ENTRY(HMG4V27_SCHEMA_ROLLBACK_BEGIN_EXTENSION, 0xa606,
          HMG4V27_TLV_STRUCT, "Journal.ROLLBACK_BEGIN", "reason_evidence"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_PATH_ALLOWLIST_MEMBER, 0xd101,
          HMG4V27_TLV_U32, "HMG4D2.kind1.member", "index"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_PATH_ALLOWLIST_MEMBER, 0xd102,
          HMG4V27_TLV_POLICY_REL_PATH, "HMG4D2.kind1.member", "path"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_PREDECESSOR_MEMBER, 0xd201,
          HMG4V27_TLV_U32, "HMG4D2.kind2.member", "index"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_PREDECESSOR_MEMBER, 0xd202,
          HMG4V27_TLV_POLICY_REL_PATH, "HMG4D2.kind2.member", "path"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_PREDECESSOR_MEMBER, 0xd204,
          HMG4V27_TLV_U64, "HMG4D2.kind2.member", "size"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_PREDECESSOR_MEMBER, 0xd205,
          HMG4V27_TLV_SHA256, "HMG4D2.kind2.member", "sha256"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd301,
          HMG4V27_TLV_U32, "HMG4D2.kind3.member", "index"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd302,
          HMG4V27_TLV_U32, "HMG4D2.kind3.member", "role"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd303,
          HMG4V27_TLV_POLICY_REL_PATH, "HMG4D2.kind3.member", "path"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd304,
          HMG4V27_TLV_U64, "HMG4D2.kind3.member", "bundle_offset"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd305,
          HMG4V27_TLV_U64, "HMG4D2.kind3.member", "size"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd306,
          HMG4V27_TLV_SHA256, "HMG4D2.kind3.member", "sha256"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd308,
          HMG4V27_TLV_U32, "HMG4D2.kind3.member", "owner"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd309,
          HMG4V27_TLV_U32, "HMG4D2.kind3.member", "group"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd30a,
          HMG4V27_TLV_U32, "HMG4D2.kind3.member", "flags"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd30c,
          HMG4V27_TLV_SHA256, "HMG4D2.kind3.member", "xattr_policy_sha256"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER, 0xd30d,
          HMG4V27_TLV_U32, "HMG4D2.kind3.member", "link_count"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_MOUNT_MEMBER, 0xd401,
          HMG4V27_TLV_BYTES, "HMG4D2.kind4.member", "volume_uuid"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_MOUNT_MEMBER, 0xd402,
          HMG4V27_TLV_BYTES, "HMG4D2.kind4.member", "filesystem_type"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_MOUNT_MEMBER, 0xd403,
          HMG4V27_TLV_BYTES, "HMG4D2.kind4.member", "statfs_fsid"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_MOUNT_MEMBER, 0xd404,
          HMG4V27_TLV_U64, "HMG4D2.kind4.member", "raw_statfs_mount_flags"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_MOUNT_MEMBER, 0xd405,
          HMG4V27_TLV_U64, "HMG4D2.kind4.member", "semantic_mount_flags"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_MOUNT_MEMBER, 0xd406,
          HMG4V27_TLV_BYTES, "HMG4D2.kind4.member", "volume_capability_valid_words"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_MOUNT_MEMBER, 0xd407,
          HMG4V27_TLV_U64, "HMG4D2.kind4.member", "root_device"),
    ENTRY(HMG4V27_SCHEMA_DERIVED_MOUNT_MEMBER, 0xd408,
          HMG4V27_TLV_BYTES, "HMG4D2.kind4.member", "mount_point"),
    S64_EXACT(HMG4V27_SCHEMA_CAPABILITY_TARGET_OBSERVATION, 0x8dec,
              INT64_C(1048576), "CapabilityTargetObservation", "arg_max_sysconf_return"),
    S64_EXACT(HMG4V27_SCHEMA_EXTERNAL_REPRESENTATION_EXPECTATION, 0x61c5,
              INT64_C(-25316), "ExternalRepresentationExpectation", "expected_external_representation_error_code"),
    S64_EXACT(HMG4V27_SCHEMA_CFERROR_OBSERVATION, 0x8d29,
              INT64_C(-25316), "CFErrorObservation", "cferror_code"),
    S64_EXACT(HMG4V27_SCHEMA_CFNUMBER_OBSERVATION, 0x9746,
              INT64_C(3072), "CFNumberObservation", "number_s32_value"),
    S64_EXACT(HMG4V27_SCHEMA_SECITEM_OBSERVATION, 0x8dcf,
              INT64_C(0), "SecItemObservation", "secitem_status"),
    S64_RANGE(HMG4V27_SCHEMA_HELD_FD_OBSERVATION, 0x8749,
              INT64_C(0), INT64_MAX, "HeldFDObservation", "return_value")};

_Static_assert(sizeof(entries) / sizeof(entries[0]) ==
                   HMG4V27_SCHEMA_DELTA_FIXED_COUNT,
               "successor schema delta count");

const hmg4v27_schema_delta_entry *hmg4v27_schema_delta_at(size_t ordinal) {
  return ordinal < HMG4V27_SCHEMA_DELTA_FIXED_COUNT ? &entries[ordinal] : NULL;
}

int hmg4v27_schema_delta_lookup(
    hmg4v27_schema_context context,
    uint16_t tag,
    const hmg4v27_schema_delta_entry **result) {
  size_t ordinal;
  if (result == NULL || context == HMG4V27_SCHEMA_FINAL_ENTRY) return 0;
  *result = NULL;
  for (ordinal = 0; ordinal < HMG4V27_SCHEMA_DELTA_FIXED_COUNT; ++ordinal) {
    if (entries[ordinal].context == context && entries[ordinal].tag == tag) {
      *result = &entries[ordinal];
      return 1;
    }
  }
  return 0;
}

int hmg4v27_final_entry_path_type(uint32_t location_role, uint8_t *type) {
  if (type == NULL || location_role < 1 || location_role > 8) return 0;
  if (location_role == 1) {
    *type = HMG4V27_TLV_POLICY_REL_PATH;
  } else if (location_role <= 7) {
    *type = HMG4V27_TLV_SAFE_CUSTODY_LEAF;
  } else {
    *type = HMG4V27_TLV_OBSERVED_CUSTODY_LEAF;
  }
  return 1;
}

int hmg4v27_schema_delta_validate_s64(
    const hmg4v27_schema_delta_entry *entry,
    hmg4v27_span value,
    int64_t *decoded) {
  int64_t signed_value;
  uint8_t reencoded[8];
  if (entry == NULL || decoded == NULL || entry->type != HMG4V27_TLV_S64 ||
      entry->signed_constraint == HMG4V27_SIGNED_NONE || value.bytes == NULL ||
      value.length != 8) {
    return 0;
  }
  signed_value = hmg4v27_read_s64_be(value.bytes);
  hmg4v27_write_s64_be(reencoded, signed_value);
  if (memcmp(reencoded, value.bytes, sizeof(reencoded)) != 0 ||
      signed_value < entry->signed_minimum ||
      signed_value > entry->signed_maximum) {
    return 0;
  }
  *decoded = signed_value;
  return 1;
}
