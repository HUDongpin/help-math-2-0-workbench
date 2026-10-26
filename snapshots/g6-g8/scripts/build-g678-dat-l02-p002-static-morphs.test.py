import importlib.util
from pathlib import Path
import tempfile
import unittest
import xml.etree.ElementTree as ET


SCRIPT = Path(__file__).with_name('build-g678-dat-l02-p002-static-morphs.py')
spec = importlib.util.spec_from_file_location('dat_p002_morphs', SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class StaticMorphTest(unittest.TestCase):
    def test_exact_scheduled_ratio_set_has_no_autonomous_animation(self):
        files, manifest = audit.render()
        audit.check_existing(files, manifest)
        packet = audit.json.loads(manifest)
        self.assertEqual(len(files), 66)
        self.assertEqual({id: sum(row['characterId'] == id for row in packet['assets'])
                          for id in audit.EXPORT_SHA}, {103: 8, 107: 18, 109: 24, 111: 16})
        for row in packet['assets']:
            data = files[row['file']]
            self.assertEqual(audit.sha(data), row['sha256'])
            self.assertFalse(any(node.tag == f'{audit.SVG}animate'
                                 for node in ET.fromstring(data).iter()))

    def test_endpoint_and_intermediate_geometry_are_distinct(self):
        source = audit.pinned(audit.EXPORT / '103.svg', audit.EXPORT_SHA[103])
        start = ET.fromstring(audit.static_svg(source, 0))
        middle = ET.fromstring(audit.static_svg(source, 32768))
        end = ET.fromstring(audit.static_svg(source, 65535))
        paths = lambda root: [node.get('d') for node in root.iter(f'{audit.SVG}path')]
        self.assertNotEqual(paths(start), paths(middle))
        self.assertNotEqual(paths(middle), paths(end))
        self.assertNotEqual(paths(start), paths(end))
        with self.assertRaises(ValueError):
            audit.interpolate('M0 0', 'L1 1', 0.5, 'd')

    def test_existing_output_stays_unmodified(self):
        with tempfile.TemporaryDirectory() as temporary:
            original_output, original_manifest = audit.OUTPUT, audit.MANIFEST
            try:
                audit.OUTPUT = Path(temporary) / 'morphs'
                audit.MANIFEST = Path(temporary) / 'manifest.json'
                audit.MANIFEST.write_bytes(b'peer-owned')
                with self.assertRaises(FileExistsError):
                    audit.write_new({'103-00000.svg': b'new'}, b'new')
                self.assertEqual(audit.MANIFEST.read_bytes(), b'peer-owned')
                self.assertFalse(audit.OUTPUT.exists())
            finally:
                audit.OUTPUT, audit.MANIFEST = original_output, original_manifest


if __name__ == '__main__':
    unittest.main()
