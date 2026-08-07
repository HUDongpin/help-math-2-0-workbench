#include "darwin_startup_fd.h"

#include <unistd.h>

int main(int argc, char **argv) {
  static const char success[] = "FD_ATTEST_OK\n";
  hmg4v23_startup_fd_attestation attestation;
  hmg4v23_startup_fd_result result;
  (void)argv;
  result = hmg4v23_attest_darwin_startup_fds(argc, &attestation);
  if (result != HMG4V23_STARTUP_FD_OK) {
#if defined(HMG4V23_TEST_ENCODE_FAILURE_EXIT)
    return 100 + (int)result;
#else
    return 64;
#endif
  }
  if (attestation.stable_pass_count != 2 ||
      attestation.passes_started < 2 ||
      write(STDOUT_FILENO, success, sizeof(success) - 1) !=
          (ssize_t)(sizeof(success) - 1)) {
    return 65;
  }
  return 0;
}
