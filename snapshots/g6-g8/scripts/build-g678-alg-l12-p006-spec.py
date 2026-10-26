"""Build source-bound inventories and pending coverage plan; no acceptance effects."""
from pathlib import Path
import csv
import hashlib
import io
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'migrations/shared-alg001-l12-p006'
SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6'
assert len(sys.argv) == 2 and sys.argv[1] in ('--write', '--check')
xml_path = WORK / 'audit/ffdec-26.2.1/movie.xml'
raw = xml_path.read_bytes()
receipt = json.loads((xml_path.parent / 'extraction-receipt.json').read_text())
assert receipt['sourceSha256'] == SHA
assert next(f['sha256'] for f in receipt['files'] if f['path'] == 'movie.xml') == hashlib.sha256(raw).hexdigest()
movie = ET.fromstring(raw)
structure = json.loads((WORK / 'audit/source-structure-v1.json').read_text())
assert structure['xmlSha256'] == hashlib.sha256(raw).hexdigest()
domains = [('root', 10, None, 'initial load; frame1 preloader Stop; frame6 begin Stop'),
           ('sprite-53', 342, 'root', 'root frame6 depth1, independent main playhead; terminal Stop at342'),
           ('sprite-56', 1, 'root', 'root frame6 depth65, static title')]

def save(name, text):
    file = WORK / name
    if sys.argv[1] == '--check':
        assert file.read_text() == text, name + ' drift'
    else:
        file.write_text(text)


def json_text(value):
    return json.dumps(value, indent=2) + '\n'


def csv_text(fields, rows):
    out = io.StringIO(newline='')
    writer = csv.DictWriter(out, fieldnames=fields, lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
    return out.getvalue()


assets = []
for node in movie.find('tags'):
    kind = node.get('type')
    if not kind.startswith('Define'):
        continue
    char_id = next((node.get(k) for k in ['shapeId', 'characterID', 'characterId', 'fontID', 'fontId', 'textId', 'spriteId', 'buttonId'] if node.get(k) is not None), '')
    assets.append({'asset_id': kind + '-' + char_id, 'swf_character_id': char_id,
                   'type': kind, 'source_file': 'G6-G8-shared/ALG001/L12/RW/L12RW06.swf',
                   'exported_file': 'audit/ffdec-26.2.1/movie.xml',
                   'sha256': hashlib.sha256(ET.tostring(node)).hexdigest(),
                   'format': 'FFDec XML tag', 'transformation': 'XML-library serialization of source definition',
                   'confidence': 'verified', 'license_or_provenance': 'owner-provided',
                   'notes': 'Hash binds serialized definition, not standalone asset bytes; runtime appearance unverified'})
asset_fields = 'asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,dimensions_or_bounds,font_glyphs,transformation,confidence,license_or_provenance,notes'.split(',')
save('asset-inventory.csv', csv_text(asset_fields, assets))

requirements = []
for domain, count, parent, control in domains:
    for lang in ['en', 'es']:
        entry = {'kind': 'initial-load' if parent is None else 'source-placement', 'language': lang}
        if parent:
            entry.update({'parentFrameDomainId': parent, 'parentFrame': 6,
                          'depth': 1 if domain == 'sprite-53' else 65, 'localFrame': 1})
        entry_sha = hashlib.sha256(json.dumps(entry, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        requirements.append({'requirementId': f'req-default-{domain}-{lang}', 'scenario': 'default',
            'frameDomainId': domain, 'traceId': f'default-{domain}-{lang}', 'language': lang, 'seed': '0',
            'requiredRange': {'firstFrame': 1, 'lastFrame': count}, 'entryState': entry,
            'entryStateSha256': entry_sha, 'baselineAuthorityRequirement':
                'original-runtime-natural-trace' if parent else 'original-runtime-frame-accurate',
            'baselineAuthority': 'unresolved', 'status': 'pending', 'capturedFrameCount': 0,
            'missingFrames': list(range(1, count + 1)), 'baselineCaptureManifest': '',
            'baselineCaptureManifestSha256': '', 'captureManifest': '', 'captureManifestSha256': '',
            'metricsFile': '', 'metricsSha256': ''})
save('evidence/full-frame-coverage.json', json_text({'schemaVersion': 2,
    'animationId': 'shared-alg001-l12-p006', 'requirements': requirements}))
save('audit/frame-domain-disposition.json', json_text({'schemaVersion': 1,
    'animationId': 'shared-alg001-l12-p006', 'sourceSwfSha256': SHA,
    'status': 'structurally-enumerated-runtime-unverified', 'timelines': [
        {'timelineId': name, 'frameCount': count, 'structuralReachability': control,
         'disposition': 'declared-frame-domain', 'frameDomainId': name, 'control': control}
        for name, count, parent, control in domains],
    'definedSpriteCount': 2, 'rootReachableTimelineCount': 3, 'excludedTimelineCount': 0,
    'undeclaredReachableTimelineCount': 0,
    'unresolved': ['Original host preloader continuation', 'Natural stream timing and terminal audio behavior',
                   'Glossary source definitions, pause/resume/replay trace specifications',
                   'Spanish source-content/language disposition and human review'],
    'acceptanceEffect': 'none; interaction trace requirements remain to be specified before acceptance'}))
key_fields = 'frame,requirement_id,frame_domain_id,trace_id,entry_state_sha256,time_ms,scenario,language,kind,expected_state,trigger,baseline_file,baseline_sha256,implementation_file,implementation_sha256,diff_file,diff_sha256,normalized_rmse,timing_result,visual_result,evidence_source,reviewer,notes'.split(',')
keys = []
for t in structure['timelines']:
    by_frame = {}
    for event in t['events']:
        by_frame.setdefault(event['frame'], set()).add(event['type'])
    for requirement in [r for r in requirements if r['frameDomainId'] == t['id']]:
        for frame in sorted(set([1, t['frameCount']]) | set(by_frame)):
            keys.append({'frame': frame, 'requirement_id': requirement['requirementId'],
                'frame_domain_id': t['id'], 'trace_id': requirement['traceId'],
                'entry_state_sha256': requirement['entryStateSha256'], 'time_ms': (frame - 1) * 1000 / 12,
                'scenario': 'default', 'language': requirement['language'], 'kind': 'structural-boundary',
                'expected_state': '|'.join(sorted(by_frame.get(frame, {'domain-boundary'}))),
                'trigger': 'source tag sequence; original host trace pending', 'timing_result': 'pending',
                'visual_result': 'pending', 'evidence_source': 'audit/source-structure-v1.json',
                'notes': 'Static planning row only; ES does not claim translated source pixels'})
save('keyframes.csv', csv_text(key_fields, keys))
print(json.dumps({'assetDefinitions': len(assets), 'plannedRequirements': len(requirements),
                  'keyframeRows': len(keys), 'capturedFrames': 0, 'registered': False}))
