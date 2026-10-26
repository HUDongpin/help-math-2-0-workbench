import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('build-g678-dat-l02-p002-visual-layout.py')
spec = importlib.util.spec_from_file_location('dat_p002_visual_layout', SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class VisualLayoutTest(unittest.TestCase):
    def test_exact_source_geometry_and_asset_coverage(self):
        data = audit.render()
        audit.check_outputs(data)
        packet = audit.json.loads(data)
        symbols = packet['symbols']
        self.assertEqual(len(symbols), 107)
        self.assertEqual({kind: sum(item['kind'] == kind for item in symbols)
                          for kind in ('shape', 'text', 'morph')},
                         {'shape': 98, 'text': 5, 'morph': 4})
        self.assertEqual(sum(len(item['states']) for item in symbols if item['kind'] == 'morph'), 66)
        self.assertEqual([item['characterId'] for item in packet['bitmapEvidence']], [2, 5, 6, 7])
        self.assertEqual([item['boundsAuthority'] for item in symbols if item['kind'] == 'morph'],
                         ['FFDec morph SVG envelope only'] * 4)

    def test_existing_output_cannot_be_overwritten(self):
        with tempfile.TemporaryDirectory() as temporary:
            first = Path(temporary) / 'audit.json'
            second = Path(temporary) / 'product.json'
            first.write_bytes(b'peer-owned')
            with self.assertRaises(FileExistsError):
                audit.write_outputs(b'new', (first, second))
            self.assertEqual(first.read_bytes(), b'peer-owned')
            self.assertFalse(second.exists())
            with self.assertRaises(ValueError):
                audit.check_outputs(b'new', (first, second))


if __name__ == '__main__':
    unittest.main()
