import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('build-g678-dat-l02-p002-nested-domains.py')
spec = importlib.util.spec_from_file_location('dat_p002_nested', SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class NestedDomainAuditTest(unittest.TestCase):
    def test_exact_source_and_six_child_lifetimes(self):
        packet = audit.render_packet()
        self.assertEqual(packet['root']['mainEntryFrame'], 6)
        self.assertEqual(packet['main']['soundStreamBlockFrames'], 276)
        self.assertEqual(len(packet['instances']), 6)
        self.assertEqual(
            [(item['characterId'], item['depth'], item['lastParentFrame'])
             for item in packet['instances'] if item['presentAtParentStop']],
            [(49, 253, 276), (41, 162, 276), (53, 325, 276)],
        )
        self.assertEqual(
            [item['synchronousChildFrameAtLastParentFrame']
             for item in packet['instances'] if item['presentAtParentStop']],
            [14, 217, 66],
        )
        audit.check_existing(audit.OUTPUT, audit.encoded_packet())

    def test_exclusive_write_and_drift_fail_closed(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / 'packet.json'
            output.write_bytes(b'peer-owned')
            with self.assertRaises(FileExistsError):
                audit.write_new(output, b'new packet')
            self.assertEqual(output.read_bytes(), b'peer-owned')
            with self.assertRaises(ValueError):
                audit.check_existing(output, b'new packet')


if __name__ == '__main__':
    unittest.main()
