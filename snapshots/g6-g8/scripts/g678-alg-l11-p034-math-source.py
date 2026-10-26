"""Static card/text/glyph/line evidence. Does not modify or execute source."""
import hashlib
import json
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
symbols = {int(x.get('objectID')): x for x in root.iter()
           if x.tag.startswith('Define') and x.get('objectID') and x.tag != 'DefineFontName'}

def digest(node):
    return hashlib.sha256(ET.tostring(node, encoding='utf-8')).hexdigest()

def first_frame(sprite):
    items = []
    for x in symbols[sprite].find('tags'):
        if x.tag == 'ShowFrame':
            break
        if x.tag == 'PlaceObject2':
            items.append({'depth': int(x.get('depth')), 'characterId': int(x.get('objectID')),
                          'transform': dict(x.find('./transform/Transform').attrib)})
    return items

def text_info(symbol):
    font_id, x, y, height = None, 0, 0, None
    glyphs = []
    for item in symbol.iter('TextRecord6'):
        if item.get('isSetup') == '1':
            font_id = int(item.get('objectID', font_id))
            x, y = int(item.get('x', x)), int(item.get('y', y))
            height = int(item.get('fontHeight', height))
        else:
            for entry in item.iter('TextEntry'):
                glyph_index = int(entry.get('glyph'))
                font = symbols[font_id]
                glyph = font.find('glyphs')[glyph_index]
                code = int(glyph.get('map'))
                glyphs.append({'fontId': font_id, 'fontName': font.get('name'), 'glyphIndex': glyph_index,
                               'unicode': code, 'character': chr(code), 'x': x, 'y': y, 'fontHeight': height,
                               'advance': int(entry.get('advance')), 'glyphSubtreeSha256': digest(glyph)})
                x += int(entry.get('advance'))
    return {'text': ''.join(g['character'] for g in glyphs), 'glyphs': glyphs}

cards = []
main = symbols[225]
frame = 1
for tag in main.find('tags'):
    if tag.tag == 'ShowFrame':
        frame += 1
    if tag.tag != 'PlaceObject2' or frame not in (2, 4):
        continue
    name = tag.get('name', '')
    if not (name.startswith('Mc') and name[-2:] in ('_1', '_2')):
        continue
    character_id = int(tag.get('objectID'))
    items = first_frame(character_id)
    texts, vectors = [], []
    for item in items:
        symbol = symbols[item['characterId']]
        info = {**item, 'kind': symbol.tag, 'symbolSubtreeSha256': digest(symbol)}
        if symbol.tag.startswith('DefineText'):
            texts.append({**info, **text_info(symbol)})
        elif symbol.tag.startswith('DefineShape'):
            segments = []
            for edges in symbol.findall('.//edges'):
                x, y = 0, 0
                for edge in edges:
                    if edge.tag == 'ShapeSetup':
                        x, y = int(edge.get('x', x)), int(edge.get('y', y))
                    elif edge.tag == 'LineTo':
                        dx, dy = int(edge.get('x', 0)), int(edge.get('y', 0))
                        if dy == 0 and 80 <= abs(dx) <= 450:
                            segments.append({'from': [x, y], 'to': [x+dx, y+dy]})
                        x, y = x+dx, y+dy
                    elif edge.tag == 'CurveTo':
                        x += int(edge.get('x1', 0)) + int(edge.get('x2', 0))
                        y += int(edge.get('y1', 0)) + int(edge.get('y2', 0))
            vectors.append({**info, 'shortHorizontalSegmentsTwips': segments})
        else:
            raise AssertionError(f'unexpected first-frame card symbol {symbol.tag}')
    cards.append({'level': 1 if frame == 2 else 2, 'sourceMainFrame': frame,
                  'sourceInstanceName': name, 'sourceCharacterId': character_id,
                  'sourceSpriteSubtreeSha256': digest(symbols[character_id]),
                  'sourcePlacement': dict(tag.attrib), 'texts': texts, 'vectors': vectors})
assert len(cards) == 24
print(json.dumps({'schemaVersion': 1, 'subtreeHashEncoding': 'xml.etree.ElementTree.tostring utf-8',
                  'coordinates': 'Source twips, local to placed text or vector symbol; placement transforms are separate.',
                  'cards': cards}, sort_keys=True))
