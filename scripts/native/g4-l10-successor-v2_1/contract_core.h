#ifndef HMG4V21_CONTRACT_CORE_H
#define HMG4V21_CONTRACT_CORE_H

#include <stddef.h>
#include <stdint.h>

#define HMG4V21_AUTHORITY_HEADER_SIZE ((size_t)56)
#define HMG4V21_REQUEST_MAX_PAYLOAD UINT64_C(1048576)
#define HMG4V21_INVALID_HEADER_TOKEN "HMG4V2_INVALID_HEADER"
#define HMG4V21_INVALID_HEADER_TOKEN_SIZE ((size_t)21)
#define HMG4V21_STARTUP_EXIT ((int)64)
#define HMG4V21_RESPONSE_FAILURE_EXIT ((int)74)
#define HMG4V21_DIAGNOSTIC_COUNT ((size_t)82)
#define HMG4V21_ROLLBACK_REASON_COUNT ((size_t)3)
#define HMG4V21_DIRECTION_COUNT ((size_t)4)

#define HMG4V21_SUCCESSOR_SHA256_HEX                                      \
  "170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab"
#define HMG4V21_PREDECESSOR_SHA256_HEX                                    \
  "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583"
#define HMG4V21_GATE_A_SHA256_HEX                                         \
  "7fa23b8b5c4506e9e519c2bc22d063445491295bab27ec433cf6749ee2f70123"

extern const uint8_t hmg4v21_successor_sha256[32];
extern const uint8_t hmg4v21_predecessor_sha256[32];
extern const uint8_t hmg4v21_gate_a_sha256[32];

typedef struct {
  const uint8_t *bytes;
  size_t length;
} hmg4v21_span;

typedef enum {
  HMG4V21_OK = 0,
  HMG4V21_NULL_ARGUMENT,
  HMG4V21_TRUNCATED_HEADER,
  HMG4V21_BAD_MAGIC,
  HMG4V21_BAD_VERSION,
  HMG4V21_BAD_KIND,
  HMG4V21_PAYLOAD_TOO_LARGE,
  HMG4V21_SIZE_OVERFLOW,
  HMG4V21_FRAME_LENGTH_MISMATCH,
  HMG4V21_PAYLOAD_HASH_MISMATCH,
  HMG4V21_BAD_TLV_TYPE_SITE,
  HMG4V21_UNKNOWN_DIAGNOSTIC,
  HMG4V21_DIAGNOSTIC_STATUS_MISMATCH,
  HMG4V21_UNKNOWN_ROLLBACK_REASON,
  HMG4V21_UNKNOWN_DIRECTION,
  HMG4V21_BAD_POLL_SYMBOLS,
  HMG4V21_BAD_POLL_ENDPOINT
} hmg4v21_result;

typedef struct {
  uint8_t magic[8];
  uint32_t kind;
  uint64_t payload_length;
  uint8_t payload_sha256[32];
} hmg4v21_authority_header;

typedef struct {
  hmg4v21_authority_header header;
  hmg4v21_span payload;
} hmg4v21_authority_envelope;

typedef struct {
  uint32_t code;
  uint32_t status;
  const char *name;
} hmg4v21_diagnostic;

typedef struct {
  uint32_t reason;
  const char *name;
} hmg4v21_rollback_reason;

typedef struct {
  uint32_t direction;
  uint32_t source_role;
  uint32_t destination_role;
  uint32_t predecessor_state_mask;
  uint32_t requires_prior_direction;
  const char *name;
} hmg4v21_direction;

typedef enum {
  HMG4V21_POLL_ENDPOINT_REQUEST = 1,
  HMG4V21_POLL_ENDPOINT_RESPONSE = 2
} hmg4v21_poll_endpoint;

typedef struct {
  uint16_t pollin;
  uint16_t pollout;
  uint16_t pollerr;
  uint16_t pollhup;
  uint16_t pollnval;
  int eintr_value;
} hmg4v21_poll_symbols;

typedef enum {
  HMG4V21_POLL_DEADLINE = 1,
  HMG4V21_POLL_AGAIN,
  HMG4V21_POLL_TRANSPORT_ERROR,
  HMG4V21_POLL_REQUEST_RETRY_READ,
  HMG4V21_POLL_REQUEST_EOF_READ,
  HMG4V21_POLL_REQUEST_DRAIN_READ,
  HMG4V21_POLL_RESPONSE_RETRY_WRITE
} hmg4v21_poll_decision;

typedef struct {
  uint32_t maximum_attribute_count;
  uint32_t maximum_name_bytes;
  uint32_t maximum_value_bytes;
  uint32_t maximum_total_value_bytes;
  uint32_t maximum_stream_bytes;
} hmg4v21_xattr_limits;

int hmg4v21_checked_add_size(size_t left, size_t right, size_t *result);
uint32_t hmg4v21_read_u32_be(const uint8_t bytes[4]);
uint64_t hmg4v21_read_u64_be(const uint8_t bytes[8]);

hmg4v21_result hmg4v21_parse_authority_header(
    hmg4v21_span header_bytes,
    hmg4v21_authority_header *result);
hmg4v21_result hmg4v21_validate_authority_envelope(
    hmg4v21_span frame_bytes,
    hmg4v21_authority_envelope *result);

int hmg4v21_tlv_type_site_is_legal(uint8_t type, uint16_t tag);
const hmg4v21_xattr_limits *hmg4v21_xattr_policy_limits(void);

const hmg4v21_diagnostic *hmg4v21_diagnostic_at(size_t ordinal);
hmg4v21_result hmg4v21_lookup_diagnostic(
    uint32_t code,
    const hmg4v21_diagnostic **result);
hmg4v21_result hmg4v21_validate_diagnostic_status(
    uint32_t code,
    uint32_t status);

const hmg4v21_rollback_reason *hmg4v21_rollback_reason_at(size_t ordinal);
hmg4v21_result hmg4v21_lookup_rollback_reason(
    uint32_t reason,
    const hmg4v21_rollback_reason **result);

const hmg4v21_direction *hmg4v21_direction_at(size_t ordinal);
hmg4v21_result hmg4v21_lookup_direction(
    uint32_t direction,
    const hmg4v21_direction **result);

hmg4v21_result hmg4v21_poll_decide(
    const hmg4v21_poll_symbols *symbols,
    hmg4v21_poll_endpoint endpoint,
    int post_at_or_after_deadline,
    int poll_return,
    int poll_errno,
    uint16_t revents,
    hmg4v21_poll_decision *decision);

const char *hmg4v21_result_name(hmg4v21_result result);

#endif
