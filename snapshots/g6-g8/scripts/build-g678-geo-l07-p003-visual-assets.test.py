#!/usr/bin/env python3
"""Regression checks for the source-locked P003 SVG export inventory."""

import hashlib
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('build-g678-geo-l07-p003-visual-assets.py')
EXPECTED_SHA = '36c9a39468f5aae0f6767c80999a5c420c085b268e3ee5f5f659e9d0c0af5ce1'


class VisualAssetsTest(unittest.TestCase):
    def test_reproducible_and_exclusive(self):
        with tempfile.TemporaryDirectory(prefix='g678-p003-visual-assets-', dir=SCRIPT.parent) as directory:
            output = Path(directory) / 'visual-assets.json'
            command = [sys.executable, str(SCRIPT)]
            self.assertEqual(subprocess.run(command + ['--write', '--output', str(output)],
                                            capture_output=True).returncode, 0)
            self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), EXPECTED_SHA)
            self.assertEqual(subprocess.run(command + ['--check', '--output', str(output)],
                                            capture_output=True).returncode, 0)
            self.assertNotEqual(subprocess.run(command + ['--write', '--output', str(output)],
                                               capture_output=True).returncode, 0)
            output.write_bytes(output.read_bytes() + b' ')  # corrupt only the disposable copy
            self.assertNotEqual(subprocess.run(command + ['--check', '--output', str(output)],
                                               capture_output=True).returncode, 0)


if __name__ == '__main__':
    unittest.main()
