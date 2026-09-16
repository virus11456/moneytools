"""python scripts/taiwan_sources.py --output /path/out [--download]

Without --download, read audit fixtures named <source>.json from --input.
No US snapshot writes, GitHub pushes, publication or scheduling.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from moneytools.taiwan.official import SOURCES, assemble, download


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--download', action='store_true')
    args = parser.parse_args()
    if not args.download and args.input is None:
        parser.error('--input required without --download')
    datasets = {}; provenance = {}
    for name, url in SOURCES.items():
        if args.download:
            meta = download(name, args.output / 'raw')
            raw = (args.output / 'raw' / meta['file']).read_bytes()
        else:
            raw = (args.input / (name + '.json')).read_bytes()
            meta = {'url': url, 'retrievedAt': None, 'sha256': hashlib.sha256(raw).hexdigest(),
                    'note': 'Imported capture; original retrieval timestamp not recorded'}
        datasets[name] = json.loads(raw); provenance[name] = meta
    snapshot = assemble(datasets, provenance)
    args.output.mkdir(parents=True, exist_ok=True)
    target = args.output / 'source-audit.json'; temp = target.with_suffix('.tmp')
    temp.write_text(json.dumps(snapshot, ensure_ascii=False, allow_nan=False, indent=2))
    temp.replace(target)
    print(json.dumps({'coverage': snapshot['coverage'], 'stage': snapshot['stage'], 'output': str(target)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
