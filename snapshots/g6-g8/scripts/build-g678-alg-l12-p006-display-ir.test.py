import importlib.util
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location('p006_ir', Path(__file__).with_name('build-g678-alg-l12-p006-display-ir.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DisplayIRTests(unittest.TestCase):
    def test_move_preserves_omitted_fields_and_same_frame_removal(self):
        tags = ET.fromstring('''<tags>
          <item type="PlaceObject2Tag" depth="1" characterId="9" placeFlagHasCharacter="true" placeFlagHasMatrix="true" placeFlagHasClipDepth="true" clipDepth="4"><matrix translateX="120" translateY="200"/></item>
          <item type="ShowFrameTag"/>
          <item type="PlaceObject2Tag" depth="1" placeFlagMove="true" placeFlagHasRatio="true" ratio="300"/>
          <item type="ShowFrameTag"/>
          <item type="RemoveObject2Tag" depth="1"/>
          <item type="PlaceObject2Tag" depth="1" characterId="10" placeFlagHasCharacter="true"/>
          <item type="ShowFrameTag"/>
        </tags>''')
        frames = module.reduce_timeline(tags, 3)
        self.assertEqual(frames[1][0]['matrix']['translateX'], '120')
        self.assertEqual(frames[1][0]['clipDepth'], 4)
        self.assertEqual(frames[1][0]['placedAtFrame'], 1)
        self.assertEqual(frames[0][0]['ratio'], 0)
        self.assertEqual(frames[2][0]['characterId'], 10)
        self.assertIsNone(frames[2][0]['clipDepth'])
        self.assertEqual(frames[2][0]['matrix']['translateX'], '0')

    def test_absent_move_is_rejected(self):
        with self.assertRaises(AssertionError):
            module.reduce_timeline(ET.fromstring('<tags><item type="PlaceObject2Tag" depth="1" placeFlagMove="true"/></tags>'), 0)

    def test_source_domains_root_composition_and_terminal(self):
        result = module.build()
        root, main, title = [t['frames'] for t in result['timelines']]
        self.assertEqual(root[:5], [[]] * 5)
        self.assertEqual([(s['depth'], s['characterId']) for s in root[5]], [(1, 53), (64, 54), (65, 56), (67, 57)])
        self.assertEqual(root[5], root[-1])
        self.assertEqual(len(main), 342)
        self.assertTrue(main[-1])
        self.assertEqual(title[0][0]['characterId'], 55)
        for frames in (root, main, title):
            for frame in frames:
                depths = [s['depth'] for s in frame]
                self.assertEqual(depths, sorted(set(depths)))
        self.assertFalse(result['registered'])


if __name__ == '__main__':
    unittest.main()
