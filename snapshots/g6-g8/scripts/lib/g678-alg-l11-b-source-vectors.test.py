import importlib.util
import pathlib
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("vectors", pathlib.Path(__file__).with_name("g678-alg-l11-b-source-vectors.py"))
vectors = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vectors)


class SourceVectorTests(unittest.TestCase):
    def imported(self, body):
        with tempfile.TemporaryDirectory() as directory:
            file = pathlib.Path(directory) / "source.svg"
            file.write_text('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><use xlink:href="#a"/></g><defs>' + body + '</defs></svg>')
            library = vectors.VectorLibrary()
            output = library.import_svg(file, [1, 0, 0, 1, 412.4, 283.3])
            return output, library.definitions

    def test_native_transform_and_css_retained(self):
        output, definitions = self.imported('<g id="a"><path d="M0 0L1 1"/></g><style>.button-frame-hittest {opacity:0}</style>')
        self.assertIn('matrix(1 0 0 1 412.4 283.3)', output)
        self.assertTrue(any('.button-frame-hittest {opacity:0}' in item for item in definitions.values()))

    def test_rejects_external_and_active_content(self):
        for body in ['<image id="a" xlink:href="https://example.test/p.png"/>', '<g id="a" onclick="alert(1)"/>',
                     '<g id="a"><script>alert(1)</script></g>', '<g id="a"/><style>@import "bad.css"</style>',
                     '<image id="a" xlink:href="data:image/png;base64,YmFk"/>']:
            with self.subTest(body=body), self.assertRaises((ValueError, AssertionError)):
                self.imported(body)

    def test_definitions_deduplicate_by_content_not_ffdec_number(self):
        output, definitions = self.imported('<g id="a"><use xlink:href="#b"/></g><g id="b"><path d="M1 2L3 4"/></g>')
        self.assertEqual(len(definitions),2)
        self.assertNotIn('href="#b"',output)
        self.assertTrue(all('v_' in value for value in definitions.values()))


if __name__ == '__main__':
    unittest.main()
