#ifndef HMG4V27_DARWIN_STARTUP_FD_H
#define HMG4V27_DARWIN_STARTUP_FD_H

#include <stddef.h>
#include <stdint.h>

#define HMG4V27_STARTUP_FD_COUNT ((size_t)3)
#define HMG4V27_STARTUP_MAX_FD_RECORDS ((size_t)65536)
#define HMG4V27_STARTUP_MAX_PASSES ((uint32_t)8)

typedef enum {
  HMG4V27_STARTUP_FD_OK = 0,
  HMG4V27_STARTUP_FD_NULL_ARGUMENT,
  HMG4V27_STARTUP_FD_ARGUMENT_COUNT_INVALID,
  HMG4V27_STARTUP_FD_SIZE_QUERY_FAILED,
  HMG4V27_STARTUP_FD_SIZE_INVALID,
  HMG4V27_STARTUP_FD_RECORD_LIMIT_EXCEEDED,
  HMG4V27_STARTUP_FD_ALLOCATION_OVERFLOW,
  HMG4V27_STARTUP_FD_ALLOCATION_FAILED,
  HMG4V27_STARTUP_FD_ENUMERATION_FAILED,
  HMG4V27_STARTUP_FD_ENUMERATION_SHORT,
  HMG4V27_STARTUP_FD_ENUMERATION_RETRY,
  HMG4V27_STARTUP_FD_RETRY_EXHAUSTED,
  HMG4V27_STARTUP_FD_COUNT_INVALID,
  HMG4V27_STARTUP_FD_NUMBER_INVALID,
  HMG4V27_STARTUP_FD_TYPE_INVALID,
  HMG4V27_STARTUP_FD_FSTAT_FAILED,
  HMG4V27_STARTUP_FD_NOT_ANONYMOUS_PIPE,
  HMG4V27_STARTUP_FD_STATUS_FLAGS_FAILED,
  HMG4V27_STARTUP_FD_STATUS_FLAGS_INVALID,
  HMG4V27_STARTUP_FD_DESCRIPTOR_FLAGS_FAILED,
  HMG4V27_STARTUP_FD_DESCRIPTOR_FLAGS_INVALID,
  HMG4V27_STARTUP_FD_PIPE_INFO_FAILED,
  HMG4V27_STARTUP_FD_PIPE_INFO_SIZE_INVALID,
  HMG4V27_STARTUP_FD_PIPE_INFO_RESERVED_INVALID,
  HMG4V27_STARTUP_FD_HANDLE_INVALID,
  HMG4V27_STARTUP_FD_HANDLE_ALIAS,
  HMG4V27_STARTUP_FD_PASS_DRIFT
} hmg4v27_startup_fd_result;

/*
 * This is the padding-free, public-field projection of Darwin pipe_fdinfo
 * consumed by the successor contract's PipeEndpointObservation. Signed SDK
 * values are retained as their exact unsigned bit patterns.
 */
typedef struct {
  uint32_t observation_version;
  uint32_t returned_byte_count;
  uint32_t proc_fileinfo_openflags;
  uint32_t proc_fileinfo_status;
  uint64_t proc_fileinfo_offset_bits;
  uint32_t proc_fileinfo_type_bits;
  uint32_t proc_fileinfo_guardflags;
  uint64_t pipe_handle;
  uint64_t pipe_peer_handle;
  uint32_t pipe_status_bits;
  uint32_t endpoint_access_mode;
  uint32_t result;
} hmg4v27_pipe_endpoint_observation;

typedef struct {
  int32_t fd;
  uint32_t fdtype;
  uint32_t status_flags;
  uint32_t descriptor_flags;
  hmg4v27_pipe_endpoint_observation pipe;
} hmg4v27_startup_fd_record;

typedef struct {
  uint32_t passes_started;
  uint32_t stable_pass_count;
  hmg4v27_startup_fd_record records[HMG4V27_STARTUP_FD_COUNT];
} hmg4v27_startup_fd_attestation;

/* Pure validators used by the syscall adapter and deterministic tests. */
hmg4v27_startup_fd_result hmg4v27_validate_startup_fd_pass(
    const hmg4v27_startup_fd_record *records,
    size_t record_count,
    uint32_t expected_pipe_fdtype,
    uint32_t expected_pipe_info_size);
int hmg4v27_startup_fd_passes_equal(
    const hmg4v27_startup_fd_record *left,
    const hmg4v27_startup_fd_record *right,
    size_t record_count);

/*
 * Darwin syscall-bound startup proof. It emits no bytes and opens no path.
 * Callers must exit 64 without diagnostics on every non-OK result.
 */
hmg4v27_startup_fd_result hmg4v27_attest_darwin_startup_fds(
    int argc,
    hmg4v27_startup_fd_attestation *attestation);

const char *hmg4v27_startup_fd_result_name(hmg4v27_startup_fd_result result);

#endif
