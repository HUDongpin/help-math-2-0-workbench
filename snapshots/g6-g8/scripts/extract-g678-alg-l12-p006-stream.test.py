"""Focused in-memory parser and existing-artifact checks for P006's stream."""

import contextlib
from io import StringIO
import json
import sys
import unittest
import xml.etree.ElementTree as ET

import importlib.util
from pathlib import Path


SPEC = importlib.util.spec_from_file_location(
    'p006_stream', Path(__file__).with_name('extract-g678-alg-l12-p006-stream.py'))
stream = importlib.util.module_from_spec(SPEC)
sys.dont_write_bytecode = True
SPEC.loader.exec_module(stream)


def fixture(missing_frame=None):
    movie = ET.Element('swf', {'_generator': 'JPEXS Free Flash Decompiler v.26.2.1',
                                'frameCount': '10'})
    root_tags = ET.SubElement(movie, 'tags')
    sprite = ET.SubElement(root_tags, 'item', {'type': 'DefineSpriteTag',
                                               'spriteId': '53', 'frameCount': '342'})
    tags = ET.SubElement(sprite, 'subTags')
    ET.SubElement(tags, 'item', {'type': 'SoundStreamHeadTag',
                                 'streamSoundCompression': '2', 'streamSoundRate': '2',
                                 'streamSoundType': 'false', 'streamSoundSampleCount': '1837',
                                 'latencySeek': '1673'})
    for frame in range(1, 343):
        if frame >= 3 and frame != missing_frame:
            wrapper = (3456 if frame == 3 else 0 if frame == 4 else 1728).to_bytes(2, 'little')
            wrapper += (-4 if frame == 3 else 0 if frame == 4 else 54).to_bytes(2, 'little', signed=True)
            payload = b'' if frame == 4 else bytes([frame % 256])
            ET.SubElement(tags, 'item', {'type': 'SoundStreamBlockTag',
                                         'streamSoundData': (wrapper + payload).hex()})
        ET.SubElement(tags, 'item', {'type': 'ShowFrameTag'})
    return ET.tostring(movie)


class P006StreamTest(unittest.TestCase):
    def test_wrapper_is_recorded_and_payload_only_is_joined(self):
        _, blocks, payload = stream.extract(fixture())
        self.assertEqual(len(blocks), 340)
        self.assertEqual(payload, bytes(frame % 256 for frame in range(3, 343) if frame != 4))
        self.assertEqual((blocks[0]['spriteFrame'], blocks[-1]['spriteFrame']), (3, 342))
        self.assertEqual((blocks[0]['sampleCount'], blocks[0]['signedSeekSamples']), (3456, -4))
        self.assertEqual((blocks[1]['payloadOffset'], blocks[1]['payloadBytes']), (1, 0))
        self.assertEqual(blocks[0]['tagBodySha256'], stream.sha(bytes.fromhex('800dfcff03')))

    def test_missing_block_fails_closed(self):
        with self.assertRaises(AssertionError):
            stream.extract(fixture(missing_frame=10))

    def test_block_headers_match_prior_structural_audit(self):
        structural = json.loads((stream.WORKSPACE / 'audit/source-structure-v1.json').read_text())
        events = next(item['events'] for item in structural['timelines'] if item['id'] == 'sprite-53')
        prior = [item for item in events if item['type'] == 'SoundStreamBlockTag']
        current = json.loads((stream.OUTPUT / 'stream-source-receipt.json').read_text())['blocks']
        self.assertEqual(len(prior), len(current))
        for old, new in zip(prior, current):
            self.assertEqual((old['frame'], old['bytes'], old['sha256'], old['sampleCount'], old['seekSamples']),
                             (new['spriteFrame'], new['tagBodyBytes'], new['tagBodySha256'],
                              new['sampleCount'], new['signedSeekSamples']))

    def test_written_outputs_match_and_write_refuses_overwrite(self):
        with contextlib.redirect_stdout(StringIO()):
            stream.main('--check')
        with self.assertRaisesRegex(AssertionError, 'output already exists'):
            with contextlib.redirect_stdout(StringIO()):
                stream.main('--write')
        with contextlib.redirect_stdout(StringIO()):
            stream.main('--check')


if __name__ == '__main__':
    unittest.main()
