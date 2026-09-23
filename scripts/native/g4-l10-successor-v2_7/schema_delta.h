#ifndef HMG4V27_SCHEMA_DELTA_H
#define HMG4V27_SCHEMA_DELTA_H

#include "canonical_tlv.h"

#include <stddef.h>
#include <stdint.h>

/* These contexts are the v2.4-v2.6 successor deltas that must be closed before
 * the complete generated context-qualified catalog can be admitted. They are
 * deliberately not a global tag registry. */
typedef enum {
  HMG4V27_SCHEMA_XATTR_RULE = 1,
  HMG4V27_SCHEMA_ROOT_IDENTITY_EXTENSION,
  HMG4V27_SCHEMA_VIOLATION,
  HMG4V27_SCHEMA_RECOVERY_AUTHORIZATION_EXTENSION,
  HMG4V27_SCHEMA_ROLLBACK_BEGIN_EXTENSION,
  HMG4V27_SCHEMA_DERIVED_PATH_ALLOWLIST_MEMBER,
  HMG4V27_SCHEMA_DERIVED_PREDECESSOR_MEMBER,
  HMG4V27_SCHEMA_DERIVED_DESIRED_MEMBER,
  HMG4V27_SCHEMA_DERIVED_MOUNT_MEMBER,
  HMG4V27_SCHEMA_CAPABILITY_TARGET_OBSERVATION,
  HMG4V27_SCHEMA_EXTERNAL_REPRESENTATION_EXPECTATION,
  HMG4V27_SCHEMA_CFERROR_OBSERVATION,
  HMG4V27_SCHEMA_CFNUMBER_OBSERVATION,
  HMG4V27_SCHEMA_SECITEM_OBSERVATION,
  HMG4V27_SCHEMA_HELD_FD_OBSERVATION,
  HMG4V27_SCHEMA_FINAL_ENTRY
} hmg4v27_schema_context;

typedef enum {
  HMG4V27_SIGNED_NONE = 0,
  HMG4V27_SIGNED_EXACT,
  HMG4V27_SIGNED_RANGE
} hmg4v27_signed_constraint_kind;

typedef struct {
  hmg4v27_schema_context context;
  uint16_t tag;
  uint8_t type;
  uint8_t reserved;
  hmg4v27_signed_constraint_kind signed_constraint;
  int64_t signed_minimum;
  int64_t signed_maximum;
  const char *context_name;
  const char *field_name;
} hmg4v27_schema_delta_entry;

#define HMG4V27_SCHEMA_DELTA_FIXED_COUNT ((size_t)47)
#define HMG4V27_SCHEMA_REGRESSION_TAG_COUNT ((size_t)41)
#define HMG4V27_SCHEMA_S64_SITE_COUNT ((size_t)6)

const hmg4v27_schema_delta_entry *hmg4v27_schema_delta_at(size_t ordinal);

/* Returns 1 only for an exact fixed successor-delta context/tag site. The
 * FinalEntry.0503 branch is intentionally handled by the separate function. */
int hmg4v27_schema_delta_lookup(
    hmg4v27_schema_context context,
    uint16_t tag,
    const hmg4v27_schema_delta_entry **result);

/* location_role must already have been decoded and range-validated as 1..8. */
int hmg4v27_final_entry_path_type(uint32_t location_role, uint8_t *type);

int hmg4v27_schema_delta_validate_s64(
    const hmg4v27_schema_delta_entry *entry,
    hmg4v27_span value,
    int64_t *decoded);

#endif
