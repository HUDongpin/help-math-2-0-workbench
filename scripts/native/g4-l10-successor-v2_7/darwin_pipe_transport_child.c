#include "darwin_pipe_transport.h"
#include "darwin_startup_fd.h"

#include <signal.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char **argv) {
  uint8_t response_bytes[512];
  size_t response_length = 0;
  size_t index = 0;
  int exit_code = HMG4V27_RESPONSE_FAILURE_EXIT;
  hmg4v27_startup_fd_attestation attestation;
  hmg4v27_startup_fd_result startup_result;
  hmg4v27_received_request request;
  hmg4v27_response_fields response;
  hmg4v27_pipe_result pipe_result;
  (void)argv;

  memset(&attestation, 0, sizeof(attestation));
  startup_result = hmg4v27_attest_darwin_startup_fds(argc, &attestation);
  if (startup_result != HMG4V27_STARTUP_FD_OK ||
      attestation.stable_pass_count != 2) {
#if defined(HMG4V27_TEST_ENCODE_FAILURE_EXIT)
    return 100 + (int)startup_result;
#else
    return HMG4V27_STARTUP_EXIT;
#endif
  }
  if (hmg4v27_install_and_verify_sigpipe_ignore() != HMG4V27_PIPE_OK) {
#if defined(HMG4V27_TEST_ENCODE_FAILURE_EXIT)
    return 190;
#else
    return HMG4V27_STARTUP_EXIT;
#endif
  }
  if (kill(getppid(), SIGUSR1) != 0) return HMG4V27_STARTUP_EXIT;
  pipe_result = hmg4v27_receive_request_fd0(&request);
  if (pipe_result != HMG4V27_PIPE_OK) {
    return hmg4v27_pipe_result_exit_code(pipe_result, 20);
  }

  memset(&response, 0, sizeof(response));
  response.operation = request.header.operation;
  response.status = 5;
  response.diagnostic_code = UINT32_C(0x00010001);
  for (index = 0; index < sizeof(response.request_payload_sha256); ++index) {
    response.request_payload_sha256[index] =
        request.header.payload_sha256[index];
  }
  if (hmg4v27_encode_response_frame(
          &response,
          response_bytes,
          sizeof(response_bytes),
          &response_length) != HMG4V27_RESPONSE_OK ||
      !hmg4v27_response_exit_code(response.status, &exit_code)) {
    hmg4v27_release_received_request(&request);
    return HMG4V27_RESPONSE_FAILURE_EXIT;
  }
  hmg4v27_release_received_request(&request);
  pipe_result = hmg4v27_emit_response_fd1(
      response.operation,
      (hmg4v27_span){response_bytes, response_length},
      NULL);
  return pipe_result == HMG4V27_PIPE_OK ? exit_code
                                       : HMG4V27_RESPONSE_FAILURE_EXIT;
}
