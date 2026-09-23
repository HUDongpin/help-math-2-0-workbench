#!/bin/sh

# Read-only execution-closure fixture. The control-readiness builder hashes this
# file so it can rediscover the dedicated runner's static module graph without
# relying on the absent production helper. It must never be used as a replay
# lock implementation or production authority.
exit 97
