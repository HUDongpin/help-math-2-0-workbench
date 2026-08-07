#include "darwin_startup_fd.h"

#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <sys/proc_info.h>

static uint64_t next_u64(uint64_t *state) {
  uint64_t value = *state;
  value ^= value << 13;
  value ^= value >> 7;
  value ^= value << 17;
  *state = value;
  return value;
}

static void make_valid(hmg4v23_startup_fd_record records[3]) {
  size_t index = 0;
  memset(records, 0, sizeof(*records) * 3);
  for (index = 0; index < 3; ++index) {
    records[index].fd = (int32_t)index;
    records[index].fdtype = PROX_FDTYPE_PIPE;
    records[index].status_flags =
        (uint32_t)(((index == 0) ? O_RDONLY : O_WRONLY) | O_NONBLOCK);
    records[index].pipe.observation_version = 1;
    records[index].pipe.returned_byte_count = 424;
    records[index].pipe.pipe_handle = (uint64_t)(100 + index * 2);
    records[index].pipe.pipe_peer_handle = (uint64_t)(101 + index * 2);
    records[index].pipe.endpoint_access_mode = index == 0 ? 1 : 2;
    records[index].pipe.result = 1;
  }
}

int main(void) {
  uint64_t state = UINT64_C(0x5b4c9e17a2d3816f);
  uint64_t iteration = 0;
  hmg4v23_startup_fd_record records[3];
  unsigned char *bytes = (unsigned char *)records;
  const size_t byte_count = sizeof(records);

  for (iteration = 0; iteration < UINT64_C(300000); ++iteration) {
    uint64_t random = 0;
    size_t mutation_count = 0;
    size_t mutation = 0;
    make_valid(records);
    random = next_u64(&state);
    mutation_count = (size_t)(random % 9);
    for (mutation = 0; mutation < mutation_count; ++mutation) {
      size_t offset = (size_t)(next_u64(&state) % byte_count);
      bytes[offset] ^= (unsigned char)(1U << (next_u64(&state) % 8));
    }
    (void)hmg4v23_validate_startup_fd_pass(
        records, 3, PROX_FDTYPE_PIPE, 424);
    (void)hmg4v23_startup_fd_passes_equal(records, records, 3);
  }
  printf("darwin_startup_fd deterministic fuzz cases: %llu\n",
         (unsigned long long)iteration);
  return 0;
}
