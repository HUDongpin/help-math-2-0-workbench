#ifndef HMG4V27_CONTRACT_CORE_H
#define HMG4V27_CONTRACT_CORE_H

#include <stddef.h>
#include <stdint.h>

#define HMG4V27_AUTHORITY_HEADER_SIZE ((size_t)56)
#define HMG4V27_REQUEST_MAX_PAYLOAD UINT64_C(1048576)
#define HMG4V27_INVALID_HEADER_TOKEN "HMG4V2_INVALID_HEADER"
#define HMG4V27_INVALID_HEADER_TOKEN_SIZE ((size_t)21)
#define HMG4V27_STARTUP_EXIT ((int)64)
#define HMG4V27_RESPONSE_FAILURE_EXIT ((int)74)
#define HMG4V27_DIAGNOSTIC_COUNT ((size_t)82)
#define HMG4V27_ROLLBACK_REASON_COUNT ((size_t)3)
#define HMG4V27_DIRECTION_COUNT ((size_t)4)

#define HMG4V27_SUCCESSOR_SHA256_HEX                                      \
  "72b28827b7c7baff358abea33c0b919c32953ec9bcb02f4f56a7534a4f78e4cc"
#define HMG4V27_PREDECESSOR_SHA256_HEX                                    \
  "3ce5bf0d79c003a78115be85828b0d36ca8e182e65d4329c58ba9aa3393c436a"
#define HMG4V27_GATE_A_SHA256_HEX                                         \
  "cf919fe4478795140157c603348064c17b2c8c65519a2735c842759f59b68826"

extern const uint8_t hmg4v27_successor_sha256[32];
extern const uint8_t hmg4v27_predecessor_sha256[32];
extern const uint8_t hmg4v27_gate_a_sha256[32];

typedef struct {
  const uint8_t *bytes;
  size_t length;
} hmg4v27_span;

typedef enum {
  HMG4V27_OK = 0,
  HMG4V27_NULL_ARGUMENT,
  HMG4V27_TRUNCATED_HEADER,
  HMG4V27_BAD_MAGIC,
  HMG4V27_BAD_VERSION,
  HMG4V27_BAD_KIND,
  HMG4V27_PAYLOAD_TOO_LARGE,
  HMG4V27_SIZE_OVERFLOW,
  HMG4V27_FRAME_LENGTH_MISMATCH,
  HMG4V27_PAYLOAD_HASH_MISMATCH,
  HMG4V27_BAD_TLV_TYPE_SITE,
  HMG4V27_UNKNOWN_DIAGNOSTIC,
  HMG4V27_DIAGNOSTIC_STATUS_MISMATCH,
  HMG4V27_UNKNOWN_ROLLBACK_REASON,
  HMG4V27_UNKNOWN_DIRECTION,
  HMG4V27_BAD_POLL_SYMBOLS,
  HMG4V27_BAD_POLL_ENDPOINT
} hmg4v27_result;

typedef struct {
  uint8_t magic[8];
  uint32_t kind;
  uint64_t payload_length;
  uint8_t payload_sha256[32];
} hmg4v27_authority_header;

typedef struct {
  hmg4v27_authority_header header;
  hmg4v27_span payload;
} hmg4v27_authority_envelope;

typedef struct {
  uint32_t code;
  uint32_t status;
  const char *name;
} hmg4v27_diagnostic;

typedef struct {
  uint32_t reason;
  const char *name;
} hmg4v27_rollback_reason;

typedef struct {
  uint32_t direction;
  uint32_t source_role;
  uint32_t destination_role;
  uint32_t predecessor_state_mask;
  uint32_t requires_prior_direction;
  const char *name;
} hmg4v27_direction;

typedef enum {
  HMG4V27_POLL_ENDPOINT_REQUEST = 1,
  HMG4V27_POLL_ENDPOINT_RESPONSE = 2
} hmg4v27_poll_endpoint;

typedef struct {
  uint16_t pollin;
  uint16_t pollout;
  uint16_t pollerr;
  uint16_t pollhup;
  uint16_t pollnval;
  int eintr_value;
} hmg4v27_poll_symbols;

typedef enum {
  HMG4V27_POLL_DEADLINE = 1,
  HMG4V27_POLL_AGAIN,
  HMG4V27_POLL_TRANSPORT_ERROR,
  HMG4V27_POLL_REQUEST_RETRY_READ,
  HMG4V27_POLL_REQUEST_EOF_READ,
  HMG4V27_POLL_REQUEST_DRAIN_READ,
  HMG4V27_POLL_RESPONSE_RETRY_WRITE
} hmg4v27_poll_decision;

typedef struct {
  uint32_t maximum_attribute_count;
  uint32_t maximum_name_bytes;
  uint32_t maximum_value_bytes;
  uint32_t maximum_total_value_bytes;
  uint32_t maximum_stream_bytes;
} hmg4v27_xattr_limits;

int hmg4v27_checked_add_size(size_t left, size_t right, size_t *result);
int hmg4v27_checked_mul_size(size_t left, size_t right, size_t *result);
int hmg4v27_range_within(size_t offset, size_t length, size_t total);
uint16_t hmg4v27_read_u16_be(const uint8_t bytes[2]);
uint32_t hmg4v27_read_u32_be(const uint8_t bytes[4]);
uint64_t hmg4v27_read_u64_be(const uint8_t bytes[8]);
int64_t hmg4v27_read_s64_be(const uint8_t bytes[8]);
void hmg4v27_write_u16_be(uint8_t bytes[2], uint16_t value);
void hmg4v27_write_u32_be(uint8_t bytes[4], uint32_t value);
void hmg4v27_write_u64_be(uint8_t bytes[8], uint64_t value);
void hmg4v27_write_s64_be(uint8_t bytes[8], int64_t value);
hmg4v27_result hmg4v27_sha256(
    hmg4v27_span input,
    uint8_t digest[32]);

hmg4v27_result hmg4v27_parse_authority_header(
    hmg4v27_span header_bytes,
    hmg4v27_authority_header *result);
hmg4v27_result hmg4v27_validate_authority_envelope(
    hmg4v27_span frame_bytes,
    hmg4v27_authority_envelope *result);

/* This predicate proves only that the type byte is in the closed 0x01..0x11
 * registry. Exact tag/type legality is owned by the enclosing schema. */
int hmg4v27_tlv_type_is_known(uint8_t type);
const hmg4v27_xattr_limits *hmg4v27_xattr_policy_limits(void);

const hmg4v27_diagnostic *hmg4v27_diagnostic_at(size_t ordinal);
hmg4v27_result hmg4v27_lookup_diagnostic(
    uint32_t code,
    const hmg4v27_diagnostic **result);
hmg4v27_result hmg4v27_validate_diagnostic_status(
    uint32_t code,
    uint32_t status);

const hmg4v27_rollback_reason *hmg4v27_rollback_reason_at(size_t ordinal);
hmg4v27_result hmg4v27_lookup_rollback_reason(
    uint32_t reason,
    const hmg4v27_rollback_reason **result);

const hmg4v27_direction *hmg4v27_direction_at(size_t ordinal);
hmg4v27_result hmg4v27_lookup_direction(
    uint32_t direction,
    const hmg4v27_direction **result);

hmg4v27_result hmg4v27_poll_decide(
    const hmg4v27_poll_symbols *symbols,
    hmg4v27_poll_endpoint endpoint,
    int post_at_or_after_deadline,
    int poll_return,
    int poll_errno,
    uint16_t revents,
    hmg4v27_poll_decision *decision);

const char *hmg4v27_result_name(hmg4v27_result result);

#endif
