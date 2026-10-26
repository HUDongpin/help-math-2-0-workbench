#!/usr/bin/env python3
"""Regression checks for the exact P001 root-reachable title timeline."""

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / 'scripts/build-g678-alg-l06-p001-title-ir.py'
IR = ROOT / 'migrations/shared-alg001-l06-p001/audit/title-timeline-v1.json'
SOURCE_ROOT = os.environ.get('HELP_MATH_G678_SOURCE_ROOT')


@unittest.skipUnless(SOURCE_ROOT, 'real G6-G8 source root not configured')
class TitleIrTest(unittest.TestCase):
    def run_script(self, *args, source_root=SOURCE_ROOT):
        return subprocess.run([sys.executable, str(SCRIPT), *args],
                              env={**os.environ, 'HELP_MATH_G678_SOURCE_ROOT': str(source_root)},
                              capture_output=True, text=True)

    def test_source_timeline_and_no_overwrite(self):
        current = self.run_script('--check')
        self.assertEqual(current.returncode, 0, current.stderr)
        ir = json.loads(IR.read_text())
        self.assertEqual(ir['rootTitlePlacement']['frame'], 6)
        self.assertEqual([text['characterId'] for text in ir['textObjects']], [140, 141])
        self.assertEqual({text['text'] for text in ir['textObjects']},
                         {'Understanding Functions: Introduction'})
        self.assertEqual(len(ir['frames']), 134)
        self.assertEqual(sum(frame['soundBlock']['sampleCount'] for frame in ir['frames']),
                         245952)
        self.assertEqual([layer['alpha256'] for layer in ir['frames'][0]['layers']], [0, 0])
        self.assertEqual([layer['alpha256'] for layer in ir['frames'][132]['layers']],
                         [256, 256])
        self.assertEqual(ir['frames'][132]['layers'], ir['frames'][133]['layers'])

        with TemporaryDirectory(prefix='g678-p001-title-ir-test-') as directory:
            output = Path(directory) / 'title.json'
            first = self.run_script('--write', '--output', str(output))
            self.assertEqual(first.returncode, 0, first.stderr)
            initial_hash = hashlib.sha256(output.read_bytes()).hexdigest()
            second = self.run_script('--write', '--output', str(output))
            self.assertNotEqual(second.returncode, 0)
            self.assertIn('FileExistsError', second.stderr)
            self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), initial_hash)

    def test_symlink_source_root_is_rejected(self):
        with TemporaryDirectory(prefix='g678-p001-source-link-test-') as directory:
            link = Path(directory) / 'linked-source'
            link.symlink_to(SOURCE_ROOT, target_is_directory=True)
            result = self.run_script('--check', source_root=link)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('real directory, not symlink', result.stderr)


if __name__ == '__main__':
    unittest.main()
