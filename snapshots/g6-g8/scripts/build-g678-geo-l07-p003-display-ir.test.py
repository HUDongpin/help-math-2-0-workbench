#!/usr/bin/env python3
"""P003 source-event census and no-replace output regression."""

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('build-g678-geo-l07-p003-display-ir.py')
EXPECTED = 'b77c5d9248479e72fa794ba02b8e8db12a181e93371fb309a57cd7c3f8c9b1a9'


class SourceDisplayIrTest(unittest.TestCase):
    def test_full_source_event_census_and_exclusive_write(self) -> None:
        with tempfile.TemporaryDirectory(prefix='geo-l07-p003-display-') as directory:
            output = Path(directory) / 'display.json'
            command = [sys.executable, str(SCRIPT), '--write', '--output', str(output)]
            first = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            second = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            first_stdout, first_stderr = first.communicate(timeout=30)
            second_stdout, second_stderr = second.communicate(timeout=30)
            self.assertEqual(sorted((first.returncode, second.returncode)), [0, 1])
            self.assertIn('FileExistsError', first_stderr + second_stderr)
            self.assertIn('PASS GEO001 L7 P003 display IR', first_stdout + second_stdout)
            self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), EXPECTED)
            record = json.loads(output.read_text())
            self.assertEqual(record['mainFrameCount'], 1274)
            self.assertEqual(len(record['displayEvents']), 621)
            self.assertEqual(len(record['soundBlocks']), 1126)
            self.assertEqual([button['sourceKeyAttribute'] for button in record['glossaryButtons']],
                             ['Measurement', 'Three dimensional', 'Figure', 'Cubic unit',
                              'Cubic foot', 'Unit', 'volume'])
            self.assertEqual(record['glossaryButtons'][4]['depthResidentFrameRanges'], [[1168, 1274]])
            self.assertNotIn('activeFrameRanges', record['glossaryButtons'][4])
            check = subprocess.run([sys.executable, str(SCRIPT), '--check', '--output', str(output)],
                                   capture_output=True, text=True, timeout=30)
            self.assertEqual(check.returncode, 0, check.stderr)


if __name__ == '__main__':
    unittest.main()
