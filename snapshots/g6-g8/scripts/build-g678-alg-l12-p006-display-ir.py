"""Source-only display-list reduction. No ActionScript execution or audio clock."""
from pathlib import Path
import copy
import hashlib
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'migrations/shared-alg001-l12-p006/audit'
SOURCE_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6'


def reduce_timeline(tags, frame_count):
    """Apply source tag order; omitted move fields retain previous values."""
    live, frames = {}, []
    for tag in tags:
        kind = tag.get('type')
        if kind == 'PlaceObject2Tag':
            depth = int(tag.get('depth'))
            move = tag.get('placeFlagMove') == 'true'
            has_character = tag.get('placeFlagHasCharacter') == 'true'
            if move:
                assert depth in live, ('move of absent depth', depth, len(frames) + 1)
                state = copy.deepcopy(live[depth])
            else:
                assert has_character and depth not in live, ('invalid new placement', depth)
                state = {'depth': depth, 'matrix': {'scaleX': '1', 'scaleY': '1',
                         'rotateSkew0': '0', 'rotateSkew1': '0', 'translateX': '0', 'translateY': '0'},
                         'colorTransform': None, 'ratio': 0, 'clipDepth': None, 'name': None}
            if has_character:
                state['characterId'] = int(tag.get('characterId'))
                state['placedAtFrame'] = len(frames) + 1
            if tag.get('placeFlagHasMatrix') == 'true':
                matrix = tag.find('matrix')
                assert matrix is not None
                state['matrix'] = {key: matrix.get(key, default) for key, default in
                    [('scaleX', '1'), ('scaleY', '1'), ('rotateSkew0', '0'), ('rotateSkew1', '0'),
                     ('translateX', '0'), ('translateY', '0')]}
            if tag.get('placeFlagHasColorTransform') == 'true':
                transform = tag.find('colorTransform')
                assert transform is not None
                state['colorTransform'] = dict(transform.attrib)
            for flag, key, converter in [('placeFlagHasRatio', 'ratio', int),
                                         ('placeFlagHasClipDepth', 'clipDepth', int),
                                         ('placeFlagHasName', 'name', str)]:
                if tag.get(flag) == 'true':
                    state[key] = converter(tag.get(key))
            assert tag.get('placeFlagHasClipActions') != 'true', 'clip actions need explicit handling'
            live[depth] = state
        elif kind == 'RemoveObject2Tag':
            depth = int(tag.get('depth'))
            assert depth in live, ('removal of absent depth', depth)
            del live[depth]
        elif kind == 'ShowFrameTag':
            frames.append(copy.deepcopy([live[d] for d in sorted(live)]))
        elif kind.startswith(('PlaceObject', 'RemoveObject')):
            raise AssertionError('unsupported placement tag ' + kind)
    assert len(frames) == frame_count
    return frames


def build():
    xml = AUDIT / 'ffdec-26.2.1/movie.xml'
    raw = xml.read_bytes()
    receipt = json.loads((xml.parent / 'extraction-receipt.json').read_text())
    assert receipt['sourceSha256'] == SOURCE_SHA
    xml_sha = hashlib.sha256(raw).hexdigest()
    assert next(f['sha256'] for f in receipt['files'] if f['path'] == 'movie.xml') == xml_sha
    movie = ET.fromstring(raw)
    result = []
    for node in [movie] + movie.findall('.//item[@type="DefineSpriteTag"]'):
        name = 'root' if node is movie else 'sprite-' + node.get('spriteId')
        frames = reduce_timeline(node.find('tags' if node is movie else 'subTags'), int(node.get('frameCount')))
        result.append({'id': name, 'frameCount': len(frames), 'frames': frames})
    assert [(t['id'], t['frameCount']) for t in result] == [('root', 10), ('sprite-53', 342), ('sprite-56', 1)]
    return {'schemaVersion': 1, 'animationId': 'shared-alg001-l12-p006', 'sourceSha256': SOURCE_SHA,
            'xmlSha256': xml_sha, 'coordinates': 'source twips; matrix coefficients unscaled',
            'evidence': 'complete structural display lists, not pixel or original-runtime acceptance',
            'registered': False, 'timelines': result}


if __name__ == '__main__':
    assert len(sys.argv) == 2 and sys.argv[1] in ('--write', '--check')
    text = json.dumps(build(), separators=(',', ':')) + '\n'
    output = AUDIT / 'display-ir-v1.json'
    if sys.argv[1] == '--check':
        assert output.read_text() == text
    else:
        with output.open('x') as handle:
            handle.write(text)
    print(json.dumps({'bytes': len(text.encode()), 'frames': 353, 'registered': False}))
