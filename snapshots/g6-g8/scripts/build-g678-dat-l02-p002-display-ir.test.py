import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('build-g678-dat-l02-p002-display-ir.py')
spec = importlib.util.spec_from_file_location('dat_p002_display_ir', SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class DisplayIrTest(unittest.TestCase):
    def test_source_ir_is_reproducible_and_complete(self):
        data = audit.render()
        audit.check_outputs(data)
        packet = audit.json.loads(data)
        self.assertEqual(packet['sourceSwfSha256'], audit.SOURCE_SHA)
        self.assertEqual(len(packet['definitions']), 117)
        self.assertEqual(sum(len(item['displayEvents']) for item in packet['domains'].values()),
                         3166)
        self.assertEqual(len(packet['domains']['sprite-113']['soundBlocks']), 276)
        self.assertEqual([action['frame'] for action in packet['domains']['sprite-113']['actions']],
                         [276])

    def test_existing_peer_output_cannot_be_overwritten(self):
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
