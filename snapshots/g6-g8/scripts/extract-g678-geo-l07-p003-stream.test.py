#!/usr/bin/env python3
"""Source identity, complete extraction, and exclusive-write race regression."""

import hashlib
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('extract-g678-geo-l07-p003-stream.py')
EXPECTED = '17b1d24e26ca2b225a421bdcaa1250a22a1f311b34d35e6b7880c4946a546e90'


class SourceStreamTest(unittest.TestCase):
    def test_exclusive_write_and_full_recheck(self) -> None:
        with tempfile.TemporaryDirectory(prefix='geo-l07-p003-stream-') as directory:
            output = Path(directory) / 'source.mp3'
            command = [sys.executable, str(SCRIPT), '--write', '--output', str(output)]
            first = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            second = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            first_stdout, first_stderr = first.communicate(timeout=30)
            second_stdout, second_stderr = second.communicate(timeout=30)
            self.assertEqual(sorted((first.returncode, second.returncode)), [0, 1])
            self.assertIn('FileExistsError', first_stderr + second_stderr)
            self.assertIn('PASS sprite-140', first_stdout + second_stdout)
            self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), EXPECTED)
            check = subprocess.run([sys.executable, str(SCRIPT), '--check', '--output', str(output)],
                                   capture_output=True, text=True, timeout=30)
            self.assertEqual(check.returncode, 0, check.stderr)


if __name__ == '__main__':
    unittest.main()
