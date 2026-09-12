#!/usr/bin/env python3
from pathlib import Path
import re

base = Path(__file__).with_name('patch-customer-1.1.7-rc2.py')
src = base.read_text(encoding='utf-8')

replacements = [
    (r"^feed_block\s*=.*$", "feed_block = r'''function feedTabs\\(\\)\\{.*?function updateHomeFeed'''") ,
    (r"^category_pattern\s*=.*$", "category_pattern = r'''function categoryRequest\\(cat\\)\\{.*?function loadCategory'''") ,
    (r"^product_pattern\s*=.*$", "product_pattern = r'''function productView\\(\\)\\{.*?function openProduct'''") ,
]

for pattern, replacement in replacements:
    src, count = re.subn(pattern, replacement, src, count=1, flags=re.M)
    if count != 1:
        raise SystemExit(f'RC2 runner could not rewrite: {pattern}')

code = compile(src, str(base), 'exec')
exec(code, {'__name__': '__main__', '__file__': str(base)})
