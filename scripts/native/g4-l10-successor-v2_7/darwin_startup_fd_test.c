#include "darwin_startup_fd.h"

#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/proc_info.h>

static uint64_t assertions = 0;

#define ASSERT_TRUE(expression)                                                \
  do {                                                                         \
    ++assertions;                                                              \
    if (!(expression)) {                                                       \
      fprintf(stderr, "assertion failed at %s:%d: %s\n", __FILE__, __LINE__, \
              #expression);                                                    \
      return 1;                                                                \
    }                                                                          \
  } while (0)

static void make_valid(hmg4v27_startup_fd_record records[3], uint32_t bytes) {
  size_t index = 0;
  memset(records, 0, sizeof(*records) * 3);
  for (index = 0; index < 3; ++index) {
    records[index].fd = (int32_t)index;
    records[index].fdtype = PROX_FDTYPE_PIPE;
    records[index].status_flags =
        (uint32_t)(((index == 0) ? O_RDONLY : O_WRONLY) | O_NONBLOCK);
    records[index].descriptor_flags = 0;
    records[index].pipe.observation_version = 1;
    records[index].pipe.returned_byte_count = bytes;
    records[index].pipe.proc_fileinfo_openflags = (uint32_t)(0x20 + index);
    records[index].pipe.proc_fileinfo_status = (uint32_t)(0x30 + index);
    records[index].pipe.proc_fileinfo_offset_bits = (uint64_t)(0x40 + index);
    records[index].pipe.proc_fileinfo_type_bits = (uint32_t)(0x50 + index);
    records[index].pipe.proc_fileinfo_guardflags = (uint32_t)(0x60 + index);
    records[index].pipe.pipe_handle = (uint64_t)(100 + index * 2);
    records[index].pipe.pipe_peer_handle = (uint64_t)(101 + index * 2);
    records[index].pipe.pipe_status_bits = (uint32_t)(0x70 + index);
    records[index].pipe.endpoint_access_mode = index == 0 ? 1 : 2;
    records[index].pipe.result = 1;
  }
}

int main(void) {
  hmg4v27_startup_fd_record records[3];
  hmg4v27_startup_fd_record copy[3];
  const uint32_t bytes = UINT32_C(424);

  make_valid(records, bytes);
  memcpy(copy, records, sizeof(records));
  ASSERT_TRUE(hmg4v27_validate_startup_fd_pass(
                  records, 3, PROX_FDTYPE_PIPE, bytes) ==
              HMG4V27_STARTUP_FD_OK);
  ASSERT_TRUE(hmg4v27_startup_fd_passes_equal(records, copy, 3) == 1);
  ASSERT_TRUE(hmg4v27_startup_fd_passes_equal(NULL, copy, 3) == 0);
  ASSERT_TRUE(hmg4v27_startup_fd_passes_equal(records, copy, 2) == 0);
  ASSERT_TRUE(hmg4v27_validate_startup_fd_pass(
                  NULL, 3, PROX_FDTYPE_PIPE, bytes) ==
              HMG4V27_STARTUP_FD_NULL_ARGUMENT);
  ASSERT_TRUE(hmg4v27_validate_startup_fd_pass(
                  records, 2, PROX_FDTYPE_PIPE, bytes) ==
              HMG4V27_STARTUP_FD_COUNT_INVALID);

#define MUTATE_EXPECT(field, value, expected)                                 \
  do {                                                                         \
    make_valid(records, bytes);                                                 \
    records[1].field = (value);                                                 \
    ASSERT_TRUE(hmg4v27_validate_startup_fd_pass(                              \
                    records, 3, PROX_FDTYPE_PIPE, bytes) == (expected));        \
  } while (0)

  MUTATE_EXPECT(fd, 9, HMG4V27_STARTUP_FD_NUMBER_INVALID);
  MUTATE_EXPECT(fdtype, 1, HMG4V27_STARTUP_FD_TYPE_INVALID);
  MUTATE_EXPECT(status_flags, O_WRONLY, HMG4V27_STARTUP_FD_STATUS_FLAGS_INVALID);
  MUTATE_EXPECT(descriptor_flags, 1,
                HMG4V27_STARTUP_FD_DESCRIPTOR_FLAGS_INVALID);
  MUTATE_EXPECT(pipe.observation_version, 2,
                HMG4V27_STARTUP_FD_PIPE_INFO_SIZE_INVALID);
  MUTATE_EXPECT(pipe.returned_byte_count, bytes - 1,
                HMG4V27_STARTUP_FD_PIPE_INFO_SIZE_INVALID);
  MUTATE_EXPECT(pipe.endpoint_access_mode, 3,
                HMG4V27_STARTUP_FD_STATUS_FLAGS_INVALID);
  MUTATE_EXPECT(pipe.result, 0, HMG4V27_STARTUP_FD_PIPE_INFO_SIZE_INVALID);
  MUTATE_EXPECT(pipe.pipe_handle, 0, HMG4V27_STARTUP_FD_HANDLE_INVALID);
  MUTATE_EXPECT(pipe.pipe_peer_handle, 0,
                HMG4V27_STARTUP_FD_HANDLE_INVALID);
  make_valid(records, bytes);
  records[1].pipe.pipe_peer_handle = records[0].pipe.pipe_handle;
  ASSERT_TRUE(hmg4v27_validate_startup_fd_pass(
                  records, 3, PROX_FDTYPE_PIPE, bytes) ==
              HMG4V27_STARTUP_FD_HANDLE_ALIAS);

  make_valid(records, bytes);
  memcpy(copy, records, sizeof(records));
  copy[2].pipe.proc_fileinfo_status ^= 1;
  ASSERT_TRUE(hmg4v27_startup_fd_passes_equal(records, copy, 3) == 0);
  memcpy(copy, records, sizeof(records));
  copy[2].pipe.pipe_peer_handle ^= 1;
  ASSERT_TRUE(hmg4v27_startup_fd_passes_equal(records, copy, 3) == 0);

  ASSERT_TRUE(strcmp(hmg4v27_startup_fd_result_name(HMG4V27_STARTUP_FD_OK),
                     "ok") == 0);
  ASSERT_TRUE(strcmp(hmg4v27_startup_fd_result_name((hmg4v27_startup_fd_result)999),
                     "unknown") == 0);
  printf("darwin_startup_fd deterministic assertions: %llu\n",
         (unsigned long long)assertions);
  return 0;
}
