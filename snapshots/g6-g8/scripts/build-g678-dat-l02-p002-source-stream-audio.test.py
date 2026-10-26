import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name('build-g678-dat-l02-p002-source-stream-audio.py')
spec = importlib.util.spec_from_file_location('dat_p002_source_stream', SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class SourceStreamTest(unittest.TestCase):
    def test_exact_continuous_stream_and_block_schedule(self):
        mp3, manifest = audit.render()
        audit.check_outputs(mp3, manifest)
        packet = audit.json.loads(manifest)
        self.assertEqual(audit.sha(mp3), '3b3f98778ff20ab738989560ddade4b28f065dc09dade6c4477afdce708c4536')
        self.assertEqual(packet['mp3']['frameCount'], 879)
        self.assertEqual(packet['declaredSampleCount'], 506304)
        self.assertEqual(packet['streamHeader']['sampleRateHz'], 22050)
        self.assertEqual(packet['streamHeader']['latencySeekSamples'], 1680)
        self.assertEqual([row['parentFrame'] for row in packet['blocks']], list(range(1, 277)))
        self.assertEqual([row['sampleCount'] for row in packet['blocks'][:3]], [3456, 0, 1728])
        self.assertEqual([row['mp3ByteOffset'] for row in packet['blocks'][:3]], [0, 468, 468])
        self.assertEqual(packet['blocks'][-1]['mp3ByteOffset'] + packet['blocks'][-1]['payloadBytes'], len(mp3))
        self.assertEqual(packet['blocks'][-1]['declaredSampleOffset'] + packet['blocks'][-1]['sampleCount'], 506304)

    def test_existing_peer_output_cannot_be_overwritten(self):
        with tempfile.TemporaryDirectory() as temporary:
            first = Path(temporary) / 'stream.mp3'
            second = Path(temporary) / 'manifest.json'
            first.write_bytes(b'peer-owned')
            with self.assertRaises(FileExistsError):
                audit.write_outputs(b'new-audio', b'new-manifest', (first, second))
            self.assertEqual(first.read_bytes(), b'peer-owned')
            self.assertFalse(second.exists())
            with self.assertRaises(ValueError):
                audit.check_outputs(b'new-audio', b'new-manifest', (first, second))

    def test_nonphysical_and_wrong_hash_source_inputs_fail(self):
        with tempfile.TemporaryDirectory(dir=Path(tempfile.gettempdir()).resolve()) as temporary:
            real = Path(temporary) / 'source'
            link = Path(temporary) / 'link'
            real.write_bytes(b'source')
            link.symlink_to(real)
            with self.assertRaisesRegex(ValueError, 'nonphysical source input'):
                audit.pinned(link, audit.sha(b'source'))
            with self.assertRaisesRegex(ValueError, 'source input drift'):
                audit.pinned(real, audit.sha(b'other'))


if __name__ == '__main__':
    unittest.main()
