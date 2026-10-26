import importlib.util
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("build-g678-geo-l07-p001-ir.py")
SPEC = importlib.util.spec_from_file_location("geo_l07_ir_builder", SCRIPT)
assert SPEC and SPEC.loader
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


class GeoL07IntroIrTests(unittest.TestCase):
    def test_source_bound_output_is_stable(self):
        self.assertEqual(BUILDER.build(), BUILDER.OUTPUT.read_bytes())

    def test_exclusive_creation_rejects_second_writer(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "ir.json"

            def attempt(payload):
                try:
                    BUILDER.write_exclusive(output, payload)
                    return "created"
                except FileExistsError:
                    return "rejected"

            with ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(attempt, (b"first", b"second")))
            self.assertCountEqual(results, ("created", "rejected"))
            self.assertIn(output.read_bytes(), (b"first", b"second"))


if __name__ == "__main__":
    unittest.main()
