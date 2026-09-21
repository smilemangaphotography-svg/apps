#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2:
    raise SystemExit('usage: patch-merchant-final-1.1.50.py <built-bridge-plugin-dir>')
bridge_root = Path(sys.argv[1])

subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-merchant-final-1.1.49.py')), str(bridge_root)])

def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

gradle = ROOT / 'merchant/build.gradle'
g = gradle.read_text(encoding='utf-8')
g = once(g, 'versionCode 149', 'versionCode 150', 'merchant versionCode')
g = once(g, "versionName '1.1.49'", "versionName '1.1.50'", 'merchant versionName')
g = g.replace('ShishaLoveMerchant/1.1.49', 'ShishaLoveMerchant/1.1.50')
gradle.write_text(g, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=149', 'build=150', 'merchant cache bust')
t, ua_count = re.subn(r'ShishaLoveMerchant/[0-9.]+', 'ShishaLoveMerchant/1.1.50', t)
if ua_count < 1:
    raise SystemExit('Merchant user agent marker missing')
main.write_text(t, encoding='utf-8')

final_main = main.read_text(encoding='utf-8')
final_gradle = gradle.read_text(encoding='utf-8')
final_manifest = (ROOT / 'merchant/src/main/AndroidManifest.xml').read_text(encoding='utf-8')
final_activity = (ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java').read_text(encoding='utf-8')

assert 'build=150' in final_main
assert 'ShishaLoveMerchant/1.1.50' in final_main
assert 'versionCode 150' in final_gradle
assert "versionName '1.1.50'" in final_gradle
assert 'OrderPollReceiver' in final_manifest
assert 'android:launchMode="singleTop"' in final_manifest
assert 'slm-native-layout-147' in final_activity
print('ShishaLove Merchant Android 1.1.50: production shell versioned; approved Beta runtime comes from Bridge 1.1.50')
