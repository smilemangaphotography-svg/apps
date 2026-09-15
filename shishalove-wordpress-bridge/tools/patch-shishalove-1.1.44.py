#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.44.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.43.py'), str(root)])


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

p = root / 'assets/customer.js'
t = p.read_text(encoding='utf-8')

# Customer-only release identity. Merchant stays exactly on approved 1.1.43 logic.
t = once(t, "var BUILD='1.1.37';", "var BUILD='1.1.44';", 'customer build')
t = once(t, "CFG.version='1.1.37';", "CFG.version='1.1.44';", 'customer cfg')
t = once(t, "slbfix','1.1.37'", "slbfix','1.1.44'", 'customer css bust')

# Customer 1.1.44: render any existing customer cache immediately, regardless of
# age, then let the existing async loaders revalidate in the background. This is
# deliberately narrow: no layout, navigation, sorting, category or product logic.
short = "cacheGet(key,10*60*1000)"
long = "cacheGet(key,30*60*1000)"
if t.count(short) != 4:
    raise SystemExit(f'customer 10-minute cache anchors: expected 4, found {t.count(short)}')
if t.count(long) != 1:
    raise SystemExit(f'customer 30-minute cache anchors: expected 1, found {t.count(long)}')
t = t.replace(short, "cacheGet(key,0)")
t = t.replace(long, "cacheGet(key,0)")

# Stable cache keys were introduced in 1.1.31. Keep them so this release can use
# the customer's already-populated cache instead of creating an empty new namespace.
if "var DATA_CACHE='stable-v1';" not in t:
    raise SystemExit('customer stable cache invariant missing')

p.write_text(t, encoding='utf-8')

final = p.read_text(encoding='utf-8')
assert "var BUILD='1.1.44';" in final
assert "CFG.version='1.1.44';" in final
assert final.count("cacheGet(key,0)") >= 5
assert "var DATA_CACHE='stable-v1';" in final
assert "setTimeout(function(){loadHomeFeed(state.homeFilter);},0);" in final
assert "setTimeout(loadCategory,0);" in final
assert "api('customer/bootstrap')" in final
print('ShishaLove Bridge 1.1.44: Customer instant stale-while-revalidate cache applied; Merchant unchanged')
