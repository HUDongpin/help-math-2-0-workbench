#include "darwin_startup_fd.h"

#include <fcntl.h>
#include <libproc.h>
#include <limits.h>
#include <stdlib.h>
#include <string.h>
#include <sys/proc_info.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

_Static_assert(sizeof(int32_t) == 4, "contract requires 32-bit int32_t");
_Static_assert(sizeof(uint32_t) == 4, "contract requires 32-bit uint32_t");
_Static_assert(sizeof(uint64_t) == 8, "contract requires 64-bit uint64_t");
_Static_assert(sizeof(off_t) == 8, "selected Darwin SDK requires 64-bit off_t");
_Static_assert(sizeof(struct proc_fdinfo) == PROC_PIDLISTFD_SIZE,
               "proc_fdinfo SDK size mismatch");
_Static_assert(sizeof(struct pipe_fdinfo) == PROC_PIDFDPIPEINFO_SIZE,
               "pipe_fdinfo SDK size mismatch");
_Static_assert(sizeof(((struct proc_fdinfo *)0)->proc_fd) == sizeof(int32_t),
               "proc_fd width mismatch");
_Static_assert(sizeof(((struct proc_fdinfo *)0)->proc_fdtype) == sizeof(uint32_t),
               "proc_fdtype width mismatch");
_Static_assert(sizeof(((struct pipe_fdinfo *)0)->pipeinfo.pipe_handle) ==
                   sizeof(uint64_t),
               "pipe handle width mismatch");
_Static_assert(sizeof(((struct pipe_fdinfo *)0)->pipeinfo.pipe_peerhandle) ==
                   sizeof(uint64_t),
               "pipe peer handle width mismatch");

typedef enum {
  HMG4V23_COLLECT_OK = 0,
  HMG4V23_COLLECT_RETRY,
  HMG4V23_COLLECT_BLOCK
} hmg4v23_collect_disposition;

typedef struct {
  hmg4v23_collect_disposition disposition;
  hmg4v23_startup_fd_result result;
} hmg4v23_collect_result;

static uint64_t hmg4v23_u64_bits_from_off_t(off_t value) {
  uint64_t bits = 0;
  memcpy(&bits, &value, sizeof(bits));
  return bits;
}

static uint32_t hmg4v23_u32_bits_from_int(int value) {
  uint32_t bits = 0;
  _Static_assert(sizeof(value) == sizeof(bits), "Darwin int must be 32-bit");
  memcpy(&bits, &value, sizeof(bits));
  return bits;
}

static int hmg4v23_proc_fd_less(
    const struct proc_fdinfo *left,
    const struct proc_fdinfo *right) {
  if (left->proc_fd != right->proc_fd) {
    return left->proc_fd < right->proc_fd;
  }
  return left->proc_fdtype < right->proc_fdtype;
}

static void hmg4v23_sort_proc_fds(
    struct proc_fdinfo *records,
    size_t record_count) {
  size_t outer = 0;
  for (outer = 1; outer < record_count; ++outer) {
    struct proc_fdinfo selected = records[outer];
    size_t inner = outer;
    while (inner > 0 && hmg4v23_proc_fd_less(&selected, &records[inner - 1])) {
      records[inner] = records[inner - 1];
      --inner;
    }
    records[inner] = selected;
  }
}

static int hmg4v23_has_duplicate_proc_fd(
    const struct proc_fdinfo *records,
    size_t record_count) {
  size_t index = 1;
  for (; index < record_count; ++index) {
    if (records[index - 1].proc_fd == records[index].proc_fd) {
      return 1;
    }
  }
  return 0;
}

static int hmg4v23_expected_status_flags(size_t ordinal) {
  return (ordinal == 0 ? O_RDONLY : O_WRONLY) | O_NONBLOCK;
}

static uint32_t hmg4v23_expected_access_mode(size_t ordinal) {
  return ordinal == 0 ? UINT32_C(1) : UINT32_C(2);
}

hmg4v23_startup_fd_result hmg4v23_validate_startup_fd_pass(
    const hmg4v23_startup_fd_record *records,
    size_t record_count,
    uint32_t expected_pipe_fdtype,
    uint32_t expected_pipe_info_size) {
  uint64_t handles[HMG4V23_STARTUP_FD_COUNT * 2];
  size_t index = 0;
  size_t other = 0;

  if (records == NULL) {
    return HMG4V23_STARTUP_FD_NULL_ARGUMENT;
  }
  if (record_count != HMG4V23_STARTUP_FD_COUNT) {
    return HMG4V23_STARTUP_FD_COUNT_INVALID;
  }
  memset(handles, 0, sizeof(handles));
  for (index = 0; index < record_count; ++index) {
    const hmg4v23_startup_fd_record *record = &records[index];
    const hmg4v23_pipe_endpoint_observation *pipe = &record->pipe;
    if (record->fd != (int32_t)index) {
      return HMG4V23_STARTUP_FD_NUMBER_INVALID;
    }
    if (record->fdtype != expected_pipe_fdtype) {
      return HMG4V23_STARTUP_FD_TYPE_INVALID;
    }
    if (record->status_flags !=
        hmg4v23_u32_bits_from_int(hmg4v23_expected_status_flags(index))) {
      return HMG4V23_STARTUP_FD_STATUS_FLAGS_INVALID;
    }
    if (record->descriptor_flags != 0) {
      return HMG4V23_STARTUP_FD_DESCRIPTOR_FLAGS_INVALID;
    }
    if (pipe->observation_version != 1 || pipe->result != 1) {
      return HMG4V23_STARTUP_FD_PIPE_INFO_SIZE_INVALID;
    }
    if (pipe->returned_byte_count != expected_pipe_info_size) {
      return HMG4V23_STARTUP_FD_PIPE_INFO_SIZE_INVALID;
    }
    if (pipe->endpoint_access_mode != hmg4v23_expected_access_mode(index)) {
      return HMG4V23_STARTUP_FD_STATUS_FLAGS_INVALID;
    }
    if (pipe->pipe_handle == 0 || pipe->pipe_peer_handle == 0 ||
        pipe->pipe_handle == pipe->pipe_peer_handle) {
      return HMG4V23_STARTUP_FD_HANDLE_INVALID;
    }
    handles[index * 2] = pipe->pipe_handle;
    handles[index * 2 + 1] = pipe->pipe_peer_handle;
  }
  for (index = 0; index < HMG4V23_STARTUP_FD_COUNT * 2; ++index) {
    for (other = index + 1; other < HMG4V23_STARTUP_FD_COUNT * 2; ++other) {
      if (handles[index] == handles[other]) {
        return HMG4V23_STARTUP_FD_HANDLE_ALIAS;
      }
    }
  }
  return HMG4V23_STARTUP_FD_OK;
}

int hmg4v23_startup_fd_passes_equal(
    const hmg4v23_startup_fd_record *left,
    const hmg4v23_startup_fd_record *right,
    size_t record_count) {
  size_t index = 0;
  if (left == NULL || right == NULL ||
      record_count != HMG4V23_STARTUP_FD_COUNT) {
    return 0;
  }
  for (index = 0; index < record_count; ++index) {
    if (left[index].fd != right[index].fd ||
        left[index].fdtype != right[index].fdtype ||
        left[index].status_flags != right[index].status_flags ||
        left[index].descriptor_flags != right[index].descriptor_flags ||
        left[index].pipe.observation_version !=
            right[index].pipe.observation_version ||
        left[index].pipe.returned_byte_count !=
            right[index].pipe.returned_byte_count ||
        left[index].pipe.proc_fileinfo_openflags !=
            right[index].pipe.proc_fileinfo_openflags ||
        left[index].pipe.proc_fileinfo_status !=
            right[index].pipe.proc_fileinfo_status ||
        left[index].pipe.proc_fileinfo_offset_bits !=
            right[index].pipe.proc_fileinfo_offset_bits ||
        left[index].pipe.proc_fileinfo_type_bits !=
            right[index].pipe.proc_fileinfo_type_bits ||
        left[index].pipe.proc_fileinfo_guardflags !=
            right[index].pipe.proc_fileinfo_guardflags ||
        left[index].pipe.pipe_handle != right[index].pipe.pipe_handle ||
        left[index].pipe.pipe_peer_handle !=
            right[index].pipe.pipe_peer_handle ||
        left[index].pipe.pipe_status_bits !=
            right[index].pipe.pipe_status_bits ||
        left[index].pipe.endpoint_access_mode !=
            right[index].pipe.endpoint_access_mode ||
        left[index].pipe.result != right[index].pipe.result) {
      return 0;
    }
  }
  return 1;
}

static hmg4v23_startup_fd_result hmg4v23_classify_pipe_fd(
    int pid,
    const struct proc_fdinfo *source,
    size_t ordinal,
    hmg4v23_startup_fd_record *result) {
  struct stat stat_result;
  struct pipe_fdinfo pipe_info;
  int status_flags = 0;
  int descriptor_flags = 0;
  int returned_bytes = 0;

  memset(&stat_result, 0, sizeof(stat_result));
  if (fstat(source->proc_fd, &stat_result) != 0) {
    return HMG4V23_STARTUP_FD_FSTAT_FAILED;
  }
  if ((stat_result.st_mode & S_IFMT) != S_IFIFO || stat_result.st_nlink != 0) {
    return HMG4V23_STARTUP_FD_NOT_ANONYMOUS_PIPE;
  }
  status_flags = fcntl(source->proc_fd, F_GETFL);
  if (status_flags < 0) {
    return HMG4V23_STARTUP_FD_STATUS_FLAGS_FAILED;
  }
  if (status_flags != hmg4v23_expected_status_flags(ordinal)) {
    return HMG4V23_STARTUP_FD_STATUS_FLAGS_INVALID;
  }
  descriptor_flags = fcntl(source->proc_fd, F_GETFD);
  if (descriptor_flags < 0) {
    return HMG4V23_STARTUP_FD_DESCRIPTOR_FLAGS_FAILED;
  }
  if (descriptor_flags != 0) {
    return HMG4V23_STARTUP_FD_DESCRIPTOR_FLAGS_INVALID;
  }

  memset(&pipe_info, 0, sizeof(pipe_info));
  returned_bytes = proc_pidfdinfo(
      pid,
      source->proc_fd,
      PROC_PIDFDPIPEINFO,
      &pipe_info,
      (int)sizeof(pipe_info));
  if (returned_bytes <= 0) {
    return HMG4V23_STARTUP_FD_PIPE_INFO_FAILED;
  }
  if ((size_t)returned_bytes != sizeof(pipe_info)) {
    return HMG4V23_STARTUP_FD_PIPE_INFO_SIZE_INVALID;
  }
  if (pipe_info.pipeinfo.rfu_1 != 0) {
    return HMG4V23_STARTUP_FD_PIPE_INFO_RESERVED_INVALID;
  }

  memset(result, 0, sizeof(*result));
  result->fd = source->proc_fd;
  result->fdtype = source->proc_fdtype;
  result->status_flags = hmg4v23_u32_bits_from_int(status_flags);
  result->descriptor_flags = hmg4v23_u32_bits_from_int(descriptor_flags);
  result->pipe.observation_version = 1;
  result->pipe.returned_byte_count = (uint32_t)returned_bytes;
  result->pipe.proc_fileinfo_openflags = pipe_info.pfi.fi_openflags;
  result->pipe.proc_fileinfo_status = pipe_info.pfi.fi_status;
  result->pipe.proc_fileinfo_offset_bits =
      hmg4v23_u64_bits_from_off_t(pipe_info.pfi.fi_offset);
  result->pipe.proc_fileinfo_type_bits =
      hmg4v23_u32_bits_from_int(pipe_info.pfi.fi_type);
  result->pipe.proc_fileinfo_guardflags = pipe_info.pfi.fi_guardflags;
  result->pipe.pipe_handle = pipe_info.pipeinfo.pipe_handle;
  result->pipe.pipe_peer_handle = pipe_info.pipeinfo.pipe_peerhandle;
  result->pipe.pipe_status_bits =
      hmg4v23_u32_bits_from_int(pipe_info.pipeinfo.pipe_status);
  result->pipe.endpoint_access_mode = hmg4v23_expected_access_mode(ordinal);
  result->pipe.result = 1;
  return HMG4V23_STARTUP_FD_OK;
}

static hmg4v23_collect_result hmg4v23_collect_startup_fd_pass(
    int pid,
    hmg4v23_startup_fd_record
        result_records[HMG4V23_STARTUP_FD_COUNT]) {
  hmg4v23_collect_result result = {
      HMG4V23_COLLECT_BLOCK, HMG4V23_STARTUP_FD_ENUMERATION_FAILED};
  struct proc_fdinfo *records = NULL;
  int queried_bytes = 0;
  int read_bytes = 0;
  size_t queried_size = 0;
  size_t capacity = 0;
  size_t record_count = 0;
  size_t index = 0;
  hmg4v23_startup_fd_result classify_result = HMG4V23_STARTUP_FD_OK;

  queried_bytes = proc_pidinfo(pid, PROC_PIDLISTFDS, 0, NULL, 0);
  if (queried_bytes <= 0) {
    result.result = HMG4V23_STARTUP_FD_SIZE_QUERY_FAILED;
    return result;
  }
  queried_size = (size_t)queried_bytes;
  if (queried_size % sizeof(struct proc_fdinfo) != 0) {
    result.result = HMG4V23_STARTUP_FD_SIZE_INVALID;
    return result;
  }
  record_count = queried_size / sizeof(struct proc_fdinfo);
  if (record_count > HMG4V23_STARTUP_MAX_FD_RECORDS) {
    result.result = HMG4V23_STARTUP_FD_RECORD_LIMIT_EXCEEDED;
    return result;
  }
  if (queried_size > SIZE_MAX - sizeof(struct proc_fdinfo)) {
    result.result = HMG4V23_STARTUP_FD_ALLOCATION_OVERFLOW;
    return result;
  }
  capacity = queried_size + sizeof(struct proc_fdinfo);
  if (capacity > (size_t)INT_MAX) {
    result.result = HMG4V23_STARTUP_FD_ALLOCATION_OVERFLOW;
    return result;
  }
  records = (struct proc_fdinfo *)malloc(capacity);
  if (records == NULL) {
    result.result = HMG4V23_STARTUP_FD_ALLOCATION_FAILED;
    return result;
  }
  memset(records, 0, capacity);
  read_bytes = proc_pidinfo(
      pid, PROC_PIDLISTFDS, 0, records, (int)capacity);
  if (read_bytes <= 0) {
    result.result = HMG4V23_STARTUP_FD_ENUMERATION_FAILED;
    free(records);
    return result;
  }
  if ((size_t)read_bytes > capacity ||
      (size_t)read_bytes == capacity ||
      (size_t)read_bytes % sizeof(struct proc_fdinfo) != 0) {
    result.disposition = HMG4V23_COLLECT_RETRY;
    result.result = HMG4V23_STARTUP_FD_ENUMERATION_RETRY;
    free(records);
    return result;
  }
  record_count = (size_t)read_bytes / sizeof(struct proc_fdinfo);
  hmg4v23_sort_proc_fds(records, record_count);
  if (hmg4v23_has_duplicate_proc_fd(records, record_count)) {
    result.disposition = HMG4V23_COLLECT_RETRY;
    result.result = HMG4V23_STARTUP_FD_ENUMERATION_RETRY;
    free(records);
    return result;
  }
  if (record_count != HMG4V23_STARTUP_FD_COUNT) {
    result.result = HMG4V23_STARTUP_FD_COUNT_INVALID;
    free(records);
    return result;
  }
  for (index = 0; index < record_count; ++index) {
    if (records[index].proc_fd != (int32_t)index) {
      result.result = HMG4V23_STARTUP_FD_NUMBER_INVALID;
      free(records);
      return result;
    }
    if (records[index].proc_fdtype != PROX_FDTYPE_PIPE) {
      result.result = HMG4V23_STARTUP_FD_TYPE_INVALID;
      free(records);
      return result;
    }
    classify_result = hmg4v23_classify_pipe_fd(
        pid, &records[index], index, &result_records[index]);
    if (classify_result != HMG4V23_STARTUP_FD_OK) {
      result.result = classify_result;
      free(records);
      return result;
    }
  }
  free(records);
  classify_result = hmg4v23_validate_startup_fd_pass(
      result_records,
      HMG4V23_STARTUP_FD_COUNT,
      PROX_FDTYPE_PIPE,
      (uint32_t)sizeof(struct pipe_fdinfo));
  if (classify_result != HMG4V23_STARTUP_FD_OK) {
    result.result = classify_result;
    return result;
  }
  result.disposition = HMG4V23_COLLECT_OK;
  result.result = HMG4V23_STARTUP_FD_OK;
  return result;
}

hmg4v23_startup_fd_result hmg4v23_attest_darwin_startup_fds(
    int argc,
    hmg4v23_startup_fd_attestation *attestation) {
  hmg4v23_startup_fd_record previous[HMG4V23_STARTUP_FD_COUNT];
  hmg4v23_startup_fd_record current[HMG4V23_STARTUP_FD_COUNT];
  uint32_t pass = 0;
  int have_previous = 0;

  if (attestation == NULL) {
    return HMG4V23_STARTUP_FD_NULL_ARGUMENT;
  }
  memset(attestation, 0, sizeof(*attestation));
  if (argc != 1) {
    return HMG4V23_STARTUP_FD_ARGUMENT_COUNT_INVALID;
  }
  memset(previous, 0, sizeof(previous));
  memset(current, 0, sizeof(current));
  for (pass = 0; pass < HMG4V23_STARTUP_MAX_PASSES; ++pass) {
    hmg4v23_collect_result collected;
    memset(current, 0, sizeof(current));
    ++attestation->passes_started;
    collected = hmg4v23_collect_startup_fd_pass(getpid(), current);
    if (collected.disposition == HMG4V23_COLLECT_RETRY) {
      have_previous = 0;
      memset(previous, 0, sizeof(previous));
      continue;
    }
    if (collected.disposition == HMG4V23_COLLECT_BLOCK) {
      return collected.result;
    }
    if (have_previous && hmg4v23_startup_fd_passes_equal(
                             previous,
                             current,
                             HMG4V23_STARTUP_FD_COUNT)) {
      attestation->stable_pass_count = 2;
      memcpy(attestation->records, current, sizeof(current));
      return HMG4V23_STARTUP_FD_OK;
    }
    memcpy(previous, current, sizeof(previous));
    have_previous = 1;
  }
  return have_previous ? HMG4V23_STARTUP_FD_PASS_DRIFT
                       : HMG4V23_STARTUP_FD_RETRY_EXHAUSTED;
}

const char *hmg4v23_startup_fd_result_name(hmg4v23_startup_fd_result result) {
  static const char *const names[] = {
      "ok",
      "null_argument",
      "argument_count_invalid",
      "size_query_failed",
      "size_invalid",
      "record_limit_exceeded",
      "allocation_overflow",
      "allocation_failed",
      "enumeration_failed",
      "enumeration_short",
      "enumeration_retry",
      "retry_exhausted",
      "count_invalid",
      "number_invalid",
      "type_invalid",
      "fstat_failed",
      "not_anonymous_pipe",
      "status_flags_failed",
      "status_flags_invalid",
      "descriptor_flags_failed",
      "descriptor_flags_invalid",
      "pipe_info_failed",
      "pipe_info_size_invalid",
      "pipe_info_reserved_invalid",
      "handle_invalid",
      "handle_alias",
      "pass_drift"};
  size_t index = (size_t)result;
  if (index >= sizeof(names) / sizeof(names[0])) {
    return "unknown";
  }
  return names[index];
}
