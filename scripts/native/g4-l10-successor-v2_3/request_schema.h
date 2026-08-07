#ifndef HMG4V23_REQUEST_SCHEMA_H
#define HMG4V23_REQUEST_SCHEMA_H

#include "canonical_tlv.h"

#include <stddef.h>
#include <stdint.h>

#define HMG4V23_MANAGED_ENTRY_COUNT ((size_t)114)
#define HMG4V23_REQUEST_COMPLETE_FRAME_MAX ((size_t)1048632)

typedef enum {
  HMG4V23_REQUEST_OK = 0,
  HMG4V23_REQUEST_NULL_ARGUMENT,
  HMG4V23_REQUEST_BAD_OPERATION,
  HMG4V23_REQUEST_PAYLOAD_TOO_LARGE,
  HMG4V23_REQUEST_AUTHORITY_CONTEXT_INVALID,
  HMG4V23_REQUEST_TLV_SCHEMA_INVALID,
  HMG4V23_REQUEST_PROTOCOL_SPEC_MISMATCH,
  HMG4V23_REQUEST_ROOT_PATH_MISMATCH,
  HMG4V23_REQUEST_ENTRY_INDEX_MISMATCH,
  HMG4V23_REQUEST_ENTRY_PATH_MISMATCH,
  HMG4V23_REQUEST_ENTRY_ROLE_ORDER_INVALID,
  HMG4V23_REQUEST_ENTRY_STATE_INVALID,
  HMG4V23_REQUEST_ENTRY_RANGE_INVALID,
  HMG4V23_REQUEST_ENTRY_COUNT_INVALID,
  HMG4V23_REQUEST_SCALAR_INVALID,
  HMG4V23_REQUEST_CUSTODY_BINDING_INVALID,
  HMG4V23_REQUEST_EVIDENCE_BINDING_INVALID
} hmg4v23_request_result;

typedef struct {
  hmg4v23_span approved_root_path;
  const hmg4v23_span *managed_paths;
  size_t managed_path_count;
} hmg4v23_request_path_authority;

typedef struct {
  uint32_t operation;
  uint32_t verify_target;
  uint32_t predecessor_present_count;
  uint32_t expected_transition_count;
  hmg4v23_tlv_result tlv_result;
} hmg4v23_request_summary;

hmg4v23_request_result hmg4v23_validate_request_payload(
    uint32_t operation,
    hmg4v23_span payload,
    const hmg4v23_request_path_authority *path_authority,
    hmg4v23_request_summary *summary);

const char *hmg4v23_request_result_name(hmg4v23_request_result result);

#endif
