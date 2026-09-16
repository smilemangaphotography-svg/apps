#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-customer-instant-1.1.44.py'))])


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

# Narrow in-place update: preserve every approved 1.1.44 cache/safe-area behavior,
# bump identity and the canonical shell URL only so the restored front page is fetched.
gradle = ROOT / 'customer/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 144', 'versionCode 145', 'customer versionCode')
t = once(t, "versionName '1.1.44'", "versionName '1.1.45'", 'customer versionName')
t = t.replace('ShishaLoveCustomer/1.1.44', 'ShishaLoveCustomer/1.1.45')
gradle.write_text(t, encoding='utf-8')

main = ROOT / 'customer/src/main/java/eu/shishalove/customer/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=144', 'build=145', 'customer URL cache bust')
t = t.replace('ShishaLoveCustomer/1.1.44', 'ShishaLoveCustomer/1.1.45')
main.write_text(t, encoding='utf-8')

activity = ROOT / 'customer/src/main/java/eu/shishalove/customer/CustomerActivityV134.java'
final_activity = activity.read_text(encoding='utf-8')
assert 'getWindow().setDecorFitsSystemWindows(false);' in final_activity
assert 'refreshInsetsAndViewport();' in final_activity
assert '.setInsets(WindowInsets.Type.systemBars(), android.graphics.Insets.NONE)' in final_activity
assert 'v.setPadding(bars.left, bars.top, bars.right, bars.bottom);' in final_activity
assert 'bottomInsetCssPx = 0;' in final_activity

final_gradle = gradle.read_text(encoding='utf-8')
final_main = main.read_text(encoding='utf-8')
assert 'versionCode 145' in final_gradle
assert "versionName '1.1.45'" in final_gradle
assert 'build=145' in final_main
assert 'WebSettings.LOAD_CACHE_ELSE_NETWORK' in final_main
print('ShishaLove Customer 1.1.45: front-page cache bust + all approved 1.1.44 behavior preserved')
