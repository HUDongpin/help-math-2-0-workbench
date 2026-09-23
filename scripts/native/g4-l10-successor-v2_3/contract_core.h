#ifndef HMG4V23_CONTRACT_CORE_H
#define HMG4V23_CONTRACT_CORE_H

#include <stddef.h>
#include <stdint.h>

#define HMG4V23_AUTHORITY_HEADER_SIZE ((size_t)56)
#define HMG4V23_REQUEST_MAX_PAYLOAD UINT64_C(1048576)
#define HMG4V23_INVALID_HEADER_TOKEN "HMG4V2_INVALID_HEADER"
#define HMG4V23_INVALID_HEADER_TOKEN_SIZE ((size_t)21)
#define HMG4V23_STARTUP_EXIT ((int)64)
#define HMG4V23_RESPONSE_FAILURE_EXIT ((int)74)
#define HMG4V23_DIAGNOSTIC_COUNT ((size_t)82)
#define HMG4V23_ROLLBACK_REASON_COUNT ((size_t)3)
#define HMG4V23_DIRECTION_COUNT ((size_t)4)

#define HMG4V23_SUCCESSOR_SHA256_HEX                                      \
  "bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320"
#define HMG4V23_PREDECESSOR_SHA256_HEX                                    \
  "d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c"
#define HMG4V23_GATE_A_SHA256_HEX                                         \
  "eea802daf175c9235170e8758c564b52bef4371aa44b6746a8d89d2371c793c8"

extern const uint8_t hmg4v23_successor_sha256[32];
extern const uint8_t hmg4v23_predecessor_sha256[32];
extern const uint8_t hmg4v23_gate_a_sha256[32];

typedef struct {
  const uint8_t *bytes;
  size_t length;
} hmg4v23_span;

typedef enum {
  HMG4V23_OK = 0,
  HMG4V23_NULL_ARGUMENT,
  HMG4V23_TRUNCATED_HEADER,
  HMG4V23_BAD_MAGIC,
  HMG4V23_BAD_VERSION,
  HMG4V23_BAD_KIND,
  HMG4V23_PAYLOAD_TOO_LARGE,
  HMG4V23_SIZE_OVERFLOW,
  HMG4V23_FRAME_LENGTH_MISMATCH,
  HMG4V23_PAYLOAD_HASH_MISMATCH,
  HMG4V23_BAD_TLV_TYPE_SITE,
  HMG4V23_UNKNOWN_DIAGNOSTIC,
  HMG4V23_DIAGNOSTIC_STATUS_MISMATCH,
  HMG4V23_UNKNOWN_ROLLBACK_REASON,
  HMG4V23_UNKNOWN_DIRECTION,
  HMG4V23_BAD_POLL_SYMBOLS,
  HMG4V23_BAD_POLL_ENDPOINT
} hmg4v23_result;

typedef struct {
  uint8_t magic[8];
  uint32_t kind;
  uint64_t payload_length;
  uint8_t payload_sha256[32];
} hmg4v23_authority_header;

typedef struct {
  hmg4v23_authority_header header;
  hmg4v23_span payload;
} hmg4v23_authority_envelope;

typedef struct {
  uint32_t code;
  uint32_t status;
  const char *name;
} hmg4v23_diagnostic;

typedef struct {
  uint32_t reason;
  const char *name;
} hmg4v23_rollback_reason;

typedef struct {
  uint32_t direction;
  uint32_t source_role;
  uint32_t destination_role;
  uint32_t predecessor_state_mask;
  uint32_t requires_prior_direction;
  const char *name;
} hmg4v23_direction;

typedef enum {
  HMG4V23_POLL_ENDPOINT_REQUEST = 1,
  HMG4V23_POLL_ENDPOINT_RESPONSE = 2
} hmg4v23_poll_endpoint;

typedef struct {
  uint16_t pollin;
  uint16_t pollout;
  uint16_t pollerr;
  uint16_t pollhup;
  uint16_t pollnval;
  int eintr_value;
} hmg4v23_poll_symbols;

typedef enum {
  HMG4V23_POLL_DEADLINE = 1,
  HMG4V23_POLL_AGAIN,
  HMG4V23_POLL_TRANSPORT_ERROR,
  HMG4V23_POLL_REQUEST_RETRY_READ,
  HMG4V23_POLL_REQUEST_EOF_READ,
  HMG4V23_POLL_REQUEST_DRAIN_READ,
  HMG4V23_POLL_RESPONSE_RETRY_WRITE
} hmg4v23_poll_decision;

typedef struct {
  uint32_t maximum_attribute_count;
  uint32_t maximum_name_bytes;
  uint32_t maximum_value_bytes;
  uint32_t maximum_total_value_bytes;
  uint32_t maximum_stream_bytes;
} hmg4v23_xattr_limits;

int hmg4v23_checked_add_size(size_t left, size_t right, size_t *result);
int hmg4v23_checked_mul_size(size_t left, size_t right, size_t *result);
int hmg4v23_range_within(size_t offset, size_t length, size_t total);
uint16_t hmg4v23_read_u16_be(const uint8_t bytes[2]);
uint32_t hmg4v23_read_u32_be(const uint8_t bytes[4]);
uint64_t hmg4v23_read_u64_be(const uint8_t bytes[8]);
void hmg4v23_write_u16_be(uint8_t bytes[2], uint16_t value);
void hmg4v23_write_u32_be(uint8_t bytes[4], uint32_t value);
void hmg4v23_write_u64_be(uint8_t bytes[8], uint64_t value);
hmg4v23_result hmg4v23_sha256(
    hmg4v23_span input,
    uint8_t digest[32]);

hmg4v23_result hmg4v23_parse_authority_header(
    hmg4v23_span header_bytes,
    hmg4v23_authority_header *result);
hmg4v23_result hmg4v23_validate_authority_envelope(
    hmg4v23_span frame_bytes,
    hmg4v23_authority_envelope *result);

int hmg4v23_tlv_type_site_is_legal(uint8_t type, uint16_t tag);
const hmg4v23_xattr_limits *hmg4v23_xattr_policy_limits(void);

const hmg4v23_diagnostic *hmg4v23_diagnostic_at(size_t ordinal);
hmg4v23_result hmg4v23_lookup_diagnostic(
    uint32_t code,
    const hmg4v23_diagnostic **result);
hmg4v23_result hmg4v23_validate_diagnostic_status(
    uint32_t code,
    uint32_t status);

const hmg4v23_rollback_reason *hmg4v23_rollback_reason_at(size_t ordinal);
hmg4v23_result hmg4v23_lookup_rollback_reason(
    uint32_t reason,
    const hmg4v23_rollback_reason **result);

const hmg4v23_direction *hmg4v23_direction_at(size_t ordinal);
hmg4v23_result hmg4v23_lookup_direction(
    uint32_t direction,
    const hmg4v23_direction **result);

hmg4v23_result hmg4v23_poll_decide(
    const hmg4v23_poll_symbols *symbols,
    hmg4v23_poll_endpoint endpoint,
    int post_at_or_after_deadline,
    int poll_return,
    int poll_errno,
    uint16_t revents,
    hmg4v23_poll_decision *decision);

const char *hmg4v23_result_name(hmg4v23_result result);

#endif
