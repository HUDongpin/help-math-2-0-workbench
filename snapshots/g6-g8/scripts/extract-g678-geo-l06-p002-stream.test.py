#!/usr/bin/env python3
"""Source-bound extractor and no-replace write regression."""

import hashlib
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('extract-g678-geo-l06-p002-stream.py')
EXPECTED = '2109aaa85e801d9a5bddbf2c0f30184e078a9eab75785580f477d51147fe325e'


class SourceStreamTest(unittest.TestCase):
    def test_exclusive_write_race(self) -> None:
        with tempfile.TemporaryDirectory(prefix='geo-l06-p002-stream-') as directory:
            output = Path(directory) / 'source.mp3'
            command = [sys.executable, str(SCRIPT), '--write', '--output', str(output)]
            first = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            second = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            first_stdout, first_stderr = first.communicate(timeout=30)
            second_stdout, second_stderr = second.communicate(timeout=30)
            self.assertEqual(sorted((first.returncode, second.returncode)), [0, 1])
            self.assertIn('FileExistsError', first_stderr + second_stderr)
            self.assertIn('PASS sprite-230', first_stdout + second_stdout)
            self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), EXPECTED)
            check = subprocess.run([sys.executable, str(SCRIPT), '--check', '--output', str(output)],
                                   capture_output=True, text=True, timeout=30)
            self.assertEqual(check.returncode, 0, check.stderr)


if __name__ == '__main__':
    unittest.main()
