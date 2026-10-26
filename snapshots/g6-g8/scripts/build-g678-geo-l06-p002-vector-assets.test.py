#!/usr/bin/env python3
"""Source vector inventory and no-replace output regression."""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('build-g678-geo-l06-p002-vector-assets.py')


class VectorAssetsTest(unittest.TestCase):
    def test_complete_source_assets_and_exclusive_output(self) -> None:
        with tempfile.TemporaryDirectory(prefix='geo-l06-p002-vector-') as directory:
            output = Path(directory) / 'visual-assets'
            command = [sys.executable, str(SCRIPT), '--write', '--output', str(output)]
            first = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            second = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            first_stdout, first_stderr = first.communicate(timeout=30)
            second_stdout, second_stderr = second.communicate(timeout=30)
            self.assertEqual(sorted((first.returncode, second.returncode)), [0, 1])
            self.assertIn('FileExistsError', first_stderr + second_stderr)
            self.assertIn('PASS GEO001 L6 P002 vector audit', first_stdout + second_stdout)
            check = subprocess.run([sys.executable, str(SCRIPT), '--check', '--output', str(output)],
                                   capture_output=True, text=True, timeout=30)
            self.assertEqual(check.returncode, 0, check.stderr)
            manifest = json.loads((output / 'manifest.json').read_text())
            self.assertEqual(len(manifest['records']), 207)
            self.assertEqual(sum(record['kind'] == 'shape' for record in manifest['records']), 200)
            self.assertEqual(sum(record['kind'] == 'decorative-text' for record in manifest['records']), 7)
            self.assertNotIn(209, [record['characterId'] for record in manifest['records']])


if __name__ == '__main__':
    unittest.main()
