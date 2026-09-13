#!/usr/bin/env python3
from pathlib import Path

base = Path(__file__).with_name('patch-shishalove-1.1.10.py')
src = base.read_text(encoding='utf-8')
replacements = [
    ("r'''function top\\(\\)\\{.*?\\n\\}'''", "r'''function top\\(\\)\\{.*?\\}'''") ,
    ("r'''function login\\(\\)\\{.*?\\n\\}'''", "r'''function login\\(\\)\\{.*?\\}'''") ,
]
for old, new in replacements:
    if old not in src:
        raise SystemExit('1.1.10 runner could not adjust merchant matcher: ' + old)
    src = src.replace(old, new, 1)
code = compile(src, str(base), 'exec')
exec(code, {'__name__': '__main__', '__file__': str(base)})
