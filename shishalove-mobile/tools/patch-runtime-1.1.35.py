#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-runtime-1.1.34-final.py'))])


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)

# Customer: version bump + URL cache bust. Keep 1.1.34 native safe-area fix intact.
p = ROOT / 'customer/build.gradle'
text = p.read_text(encoding='utf-8')
text = replace_once(text, 'versionCode 134', 'versionCode 135', 'customer versionCode')
text = replace_once(text, "versionName '1.1.34'", "versionName '1.1.35'", 'customer versionName')
text = text.replace("ShishaLoveCustomer/1.1.34", "ShishaLoveCustomer/1.1.35")
p.write_text(text, encoding='utf-8')

p = ROOT / 'customer/src/main/java/eu/shishalove/customer/MainActivity.java'
text = p.read_text(encoding='utf-8')
text = replace_once(text,
    'https://shishalove.eu/shishalove-app/?app=android&build=119',
    'https://shishalove.eu/shishalove-app/?app=android&build=135',
    'customer start URL cache bust')
text = text.replace('ShishaLoveCustomer/1.1.9', 'ShishaLoveCustomer/1.1.35')
p.write_text(text, encoding='utf-8')

# Merchant: version bump + URL cache bust. Keep 1.1.34 bounded runtime injection fix intact.
p = ROOT / 'merchant/build.gradle'
text = p.read_text(encoding='utf-8')
text = replace_once(text, 'versionCode 134', 'versionCode 135', 'merchant versionCode')
text = replace_once(text, "versionName '1.1.34'", "versionName '1.1.35'", 'merchant versionName')
text = text.replace("ShishaLoveMerchant/1.1.34", "ShishaLoveMerchant/1.1.35")
p.write_text(text, encoding='utf-8')

p = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
text = p.read_text(encoding='utf-8')
text = replace_once(text,
    'https://shishalove.eu/shishalove-merchant/?app=android&build=116',
    'https://shishalove.eu/shishalove-merchant/?app=android&build=135',
    'merchant start URL cache bust')
text = text.replace('ShishaLoveMerchant/1.1.9', 'ShishaLoveMerchant/1.1.35')
p.write_text(text, encoding='utf-8')

assert 'versionCode 135' in (ROOT / 'customer/build.gradle').read_text(encoding='utf-8')
assert "versionName '1.1.35'" in (ROOT / 'customer/build.gradle').read_text(encoding='utf-8')
assert 'build=135' in (ROOT / 'customer/src/main/java/eu/shishalove/customer/MainActivity.java').read_text(encoding='utf-8')
assert 'versionCode 135' in (ROOT / 'merchant/build.gradle').read_text(encoding='utf-8')
assert "versionName '1.1.35'" in (ROOT / 'merchant/build.gradle').read_text(encoding='utf-8')
assert 'build=135' in (ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java').read_text(encoding='utf-8')
print('ShishaLove Android 1.1.35: version/cache-bust update applied over 1.1.34 runtime fixes')
