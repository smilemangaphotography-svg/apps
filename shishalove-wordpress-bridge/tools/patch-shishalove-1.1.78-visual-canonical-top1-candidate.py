#!/usr/bin/env python3
from pathlib import Path
import sys,json,zlib,base64,hashlib
if len(sys.argv)!=2: raise SystemExit("usage: patch-shishalove-1.1.78-visual-canonical-top1-candidate.py <plugin-dir>")
root=Path(sys.argv[1])
payload=json.loads(zlib.decompress(base64.b64decode("eNq9V21z4jYQ/isOQ892Y4jBQDiIYTptPtxce3dteu2HJOORbTnoYss+SSahIf+9K8nGmCSXm+lM84Eg7bOrfXm0Wh46fEX4CqX5GvdQUfRCRuIb3C9WRWf2AELUmXXwFJ0m3mjgDcde+HY8xHHoTcfjJBqiaDyOR+MJiieDxI2TUYxHo3AaD2M3Cr0kRN7p8DTpOJ284J3Z5eXQm5468DF1Ogb8dUV+i6nPESWC/IMDge9FkBCcxpbFBSP0xu4y/LXEXPQWN1gEBWIos0ylZtr2nCRWZcP3TdNmWJSMGhTfGX9/Cs4Zy5llrgkvURpkOcMBoWuUkth0zL/UrpEhEa0MZcIg3MgI53Bq33QQY2hjmVwgUXLTX4xcF87rFii69aUngiHKCabC4mkY7J9xizfB4HRaOaadPCI80BaVBXu7tQgVtl5dmiW4dL1cuvaRr4xHJWNgOig5ZgGJLfv1yPB9QRiWkf0Ux5DNnEJ0670gMTdWaI2NCtg3/iipUWXhAiMGaUA3iNDnYh+o2Fl+x31IEBa133LHvLbfvGmHtxMsW8uZhtjzkucMbMhdJylpJL21usjphvZDF3HfStIcyewgUEX0Vudm3g33RGFLVKVHKvs+4JbuDLT5Qn7tDWYDe/4I+kTgjPu1F13h+hmJWC5Ihi3BSmzPE0glilbaNwNxQ7lU+Hs1jhCNSYwEBjJuwJk4GExcS5VTOlWwPC4jEciKOrvdNWIEyTCrfR2FDuJOboR5nqp1lFN1C1TNIIWK4gU4kRCoqN/SlOEDJcE8wXcBL4sC8mpe+82xrX0FlVrA8IBHECpgWV7S2NLWnZGtMGrxvYigwCwCstbnaniG7i237zoZodYA/mt12/5x4Lp1JS6v/W4xf3ysilezrowizCXtZEkcU0FhpXUcSFAJh/kL9d/Su7ZjrjYx0xlWaO2FdVDfHtRcueA6Q2D0Fe1cO5fD0WDswMek6knaEjSjp/Q4ZJC8eXt8yosAeOPTMk33mAQJx/GOS636+kf7JUdwEdaQ8e32CGeF2Fh7wooJR/Uh0lJNxNfZ+YSYz3CyIWPbR83And1vMXEH+n5G7qm8ysw97CsMfR7535i6s9kUuhvOZaoILTHQGKccPyhKALwi817S/cXzPaJdhz3UQX1UcUB82Dp09g8Esh5OO9n7lltFcA56DgB1NzqgweNj1bdliP9n396jN1QwCVAMrD71muy27r7z9NI3N1pf/qcmuXoAtVUihxEQVFpxUB0Dpls9p7r/QTXDNBa5kNtKpuYA+a1uDwhYo9SXdb00wdzrS5OTjKRQdLGBtxIoqVX0bXtRqXUTtBZMTjm98esDF23fpKy6D7I1fDsXQPqckghE+hxpUp/lVJdu5yJcvF09K/Yftu4mXXKzWVWSg86u0uaYlcc1N6voHFO50mSsbvl11OCOxuwnqAWqvYYnhsb4fnd8V32pd3dDUD2QWl25BZ2lkgCRTWj18ca0ZRwxTgHcmglhS6davzjXj04HySmKn2TQkFaIiv4X3kzbbz0cuQiPxmN3PMETz3uL4hHM3Ml04g0ng8HIHSVuiPF0hBEKp244wYOR53noNI6n4XTcTNswpDvetHrXwjzeHPt8ld/RfoYKa3eBmUPsB2g2BvAWhtsLFabF+mpZxb/dwnQ934F+RSFOfY2HwZtQ9dVcmu+oBpiznTAvRZ7U8o+lMPLkKYaGMCfmLMZMgqjRLDVIHV1Ewv9QZiFm4N0zff1IvbzLZ2UzGdCOLfXudus2pDXPEBMkSrERpVAf/6rD06ynq9hjmJepuOoszkh2Y3AWgdg8xjwCu2IFTlFEUpWlY/OqY6BUAEDCY7J+2V4vg4FbolbeQluLcQR8OYdHRRDMwThFGVZ2wfDZicLJUG7LpXlWLC7ef54ZtR+wqUDFwpwpR86K1tEqkz1dUFCynqlfAyP0pRo2GNiGk5o1xSX8LEp1DhZX5XAcJZV3DW0gmAu5MCpHSorWkDsUptis3D/wu0oZ3D9Mb8QKTP+mfrWpAoN94MWx+YNSPIF0v5hzpPjOZb7DUoicGmJTYMDoFZQNnndUo/MCurosMlHRfPx0/uHsRCNf1K8PLRjJENscWPxaEkhnY/L3z+9+fm+c//Luz8awDuCkYuLChPev/yWH0UTeP909Hv8FKXJmYA==")))
for rel,spec in payload.items():
 p=root/rel; data=p.read_bytes()
 if hashlib.sha256(data).hexdigest()!=spec["sha"]: raise SystemExit("unexpected Visual Top-1 candidate baseline: "+rel)
 lines=data.decode("utf-8").splitlines(keepends=True)
 for i1,i2,text in reversed(spec["ops"]): lines[i1:i2]=text.splitlines(keepends=True)
 p.write_text("".join(lines),encoding="utf-8")
p=(root/"shishalove-app-bridge.php").read_text();m=(root/"assets/merchant.js").read_text()
for token in ["Version: 1.1.78","final_score_percent","canonical_final_top_score","Match score ","Show more matches ↓","Show fewer matches ↑"]:
 if token not in p+m: raise SystemExit("missing required token: "+token)
if "Version: 1.1.79" in p: raise SystemExit("version bump forbidden")
print("Bridge 1.1.78 canonical Top-1 score candidate applied; version intentionally unchanged")
