import unittest

from verify_g678_geo_l06_p002_symbol_sheet import SHEET, SHEET_SHA256, inspect_sheet


class SymbolSheetAuditTest(unittest.TestCase):
    def test_canonical_sheet_has_only_internal_graphics(self):
        import hashlib

        sheet = SHEET.read_bytes()
        self.assertEqual(hashlib.sha256(sheet).hexdigest(), SHEET_SHA256)
        report = inspect_sheet(sheet)
        self.assertEqual(report["characters"], 207)
        self.assertEqual(report["externalResources"], 0)
        self.assertEqual(report["executableElementsOrAttributes"], 0)

    def test_rejects_active_and_external_content(self):
        template = '<svg xmlns="http://www.w3.org/2000/svg"><defs><g id="geo-p002-character-1">{}</g></defs></svg>'
        for payload in ('<script/>', '<path onload="alert(1)"/>',
                        '<image href="https://example.test/p.png"/>',
                        '<use href="#missing"/>', '<path fill="url(https://example.test/x)"/>',
                        '<path style="fill:url(#safe);color:red"/>'):
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                inspect_sheet(template.format(payload).encode(), expected_characters=1)

    def test_rejects_duplicate_ids_and_entities(self):
        duplicate = '<svg xmlns="http://www.w3.org/2000/svg"><defs><g id="geo-p002-character-1"><path id="geo-p002-character-1"/></g></defs></svg>'
        with self.assertRaises(ValueError):
            inspect_sheet(duplicate.encode(), expected_characters=1)
        with self.assertRaises(ValueError):
            inspect_sheet(b'<!DOCTYPE svg [<!ENTITY x "bad">]>' + duplicate.encode(), expected_characters=1)


if __name__ == "__main__":
    unittest.main()
