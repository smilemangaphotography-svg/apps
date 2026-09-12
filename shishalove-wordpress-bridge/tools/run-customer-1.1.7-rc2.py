#!/usr/bin/env python3
from pathlib import Path

base = Path(__file__).with_name('patch-customer-1.1.7-rc2.py')
src = base.read_text(encoding='utf-8')

fixes = {
    "feed_block = r'''function feedTabs(){.*?\\\\n}\\\\nfunction updateHomeFeed'''":
        "feed_block = r'''function feedTabs\\(\\)\\{.*?function updateHomeFeed'''",
    "category_pattern = r'''function categoryRequest\\\\(cat\\\\)\\\\{.*?\\\\n}\\\\nfunction loadCategory'''":
        "category_pattern = r'''function categoryRequest\\(cat\\)\\{.*?function loadCategory'''",
    "product_pattern = r'''function productView\\\\(\\\\)\\\\{.*?\\\\n}\\\\nfunction openProduct'''":
        "product_pattern = r'''function productView\\(\\)\\{.*?function openProduct'''",
}

for old, new in fixes.items():
    if old not in src:
        raise SystemExit('RC2 runner could not locate expected regex source')
    src = src.replace(old, new, 1)

code = compile(src, str(base), 'exec')
exec(code, {'__name__': '__main__', '__file__': str(base)})
