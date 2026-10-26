#!/usr/bin/env python3
"""Frame-domain IR reproduction and exclusive-output regression."""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('build-g678-geo-l06-p002-display-ir.py')


class DisplayIrTest(unittest.TestCase):
    def test_source_events_and_exclusive_write(self) -> None:
        with tempfile.TemporaryDirectory(prefix='geo-l06-p002-ir-') as directory:
            output = Path(directory) / 'display-ir.json'
            command = [sys.executable, str(SCRIPT), '--write', '--output', str(output)]
            first = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            second = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            first_stdout, first_stderr = first.communicate(timeout=30)
            second_stdout, second_stderr = second.communicate(timeout=30)
            self.assertEqual(sorted((first.returncode, second.returncode)), [0, 1])
            self.assertIn('FileExistsError', first_stderr + second_stderr)
            self.assertIn('PASS GEO001 L6 P002 display IR', first_stdout + second_stdout)
            check = subprocess.run([sys.executable, str(SCRIPT), '--check', '--output', str(output)],
                                   capture_output=True, text=True, timeout=30)
            self.assertEqual(check.returncode, 0, check.stderr)
            document = json.loads(output.read_text())
            self.assertEqual(document['mainFrameCount'], 1216)
            self.assertEqual(document['rootEntry']['frame'], 6)
            self.assertEqual(len(document['displayEvents']), 1763)
            self.assertEqual(len(document['soundBlocks']), 1200)
            buttons = [(event['frame'], event['attributes'].get('objectID'))
                       for event in document['displayEvents'] if event['op'] == 'place'
                       and event['attributes'].get('objectID') in ('211', '212', '213', '214')]
            self.assertEqual(buttons, [(987, str(button)) for button in (211, 212, 213, 214)])
            self.assertEqual(document['soundBlocks'][0]['frame'], 7)
            self.assertEqual(document['soundBlocks'][-1]['frame'], 1216)


if __name__ == '__main__':
    unittest.main()
