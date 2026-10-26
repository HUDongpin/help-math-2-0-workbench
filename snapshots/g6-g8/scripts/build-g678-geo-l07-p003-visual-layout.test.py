#!/usr/bin/env python3
"""Rebuild and exclusive-write checks for the P003 SVG coordinate plan."""

import hashlib
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('build-g678-geo-l07-p003-visual-layout.py')
EXPECTED_SHA = '7b1c537e4f599ca22634d51ecdc78705483fe99c6dc3f64a5699d60d662fc34c'


class VisualLayoutTest(unittest.TestCase):
    def test_rebuild_and_no_replace(self):
        with tempfile.TemporaryDirectory(prefix='g678-p003-visual-layout-', dir=SCRIPT.parent) as directory:
            output = Path(directory) / 'layout.json'
            command = [sys.executable, str(SCRIPT)]
            self.assertEqual(subprocess.run(command + ['--write', '--output', str(output)],
                                            capture_output=True).returncode, 0)
            self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), EXPECTED_SHA)
            self.assertEqual(subprocess.run(command + ['--check', '--output', str(output)],
                                            capture_output=True).returncode, 0)
            self.assertNotEqual(subprocess.run(command + ['--write', '--output', str(output)],
                                               capture_output=True).returncode, 0)
            output.write_bytes(output.read_bytes() + b' ')
            self.assertNotEqual(subprocess.run(command + ['--check', '--output', str(output)],
                                               capture_output=True).returncode, 0)


if __name__ == '__main__':
    unittest.main()
