#!/usr/bin/env python3
"""P003 text audit is source-pinned and never overwrites a peer output."""

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('build-g678-geo-l07-p003-text-audit.py')
EXPECTED = '6ea32d2365decbfcd640f03981d0dc77de428b4f6c17087ab7b22af24cfd0854'


class TextAuditTest(unittest.TestCase):
    def test_text_census_source_residency_and_exclusive_write(self) -> None:
        with tempfile.TemporaryDirectory(prefix='geo-l07-p003-text-') as directory:
            output = Path(directory) / 'text.json'
            command = [sys.executable, str(SCRIPT), '--write', '--output', str(output)]
            first = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            second = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            first_stdout, first_stderr = first.communicate(timeout=30)
            second_stdout, second_stderr = second.communicate(timeout=30)
            self.assertEqual(sorted((first.returncode, second.returncode)), [0, 1])
            self.assertIn('FileExistsError', first_stderr + second_stderr)
            self.assertIn('PASS GEO001 L7 P003 text audit', first_stdout + second_stdout)
            self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), EXPECTED)
            record = json.loads(output.read_text())
            self.assertEqual(record['textCharacterCount'], 41)
            self.assertEqual(len(record['texts']), 41)
            by_id = {item['characterId']: item for item in record['texts']}
            self.assertEqual(by_id[13]['segments'], ['3 layers ', 'x', ' 9 boxes = 27 boxes'])
            self.assertEqual(by_id[42]['depthResidentFrameRanges'], [[413, 1274]])
            self.assertEqual(by_id[14]['depthResidentFrameRanges'], [[142, 1274]])
            self.assertIn('reading order', record['claimBoundary'])
            check = subprocess.run([sys.executable, str(SCRIPT), '--check', '--output', str(output)],
                                   capture_output=True, text=True, timeout=30)
            self.assertEqual(check.returncode, 0, check.stderr)


if __name__ == '__main__':
    unittest.main()
