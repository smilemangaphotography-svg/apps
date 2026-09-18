#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1] / 'shishalove-mobile'
base_patch = ROOT / 'tools' / 'patch-merchant-context-1.1.43.py'
subprocess.check_call([sys.executable, str(base_patch)])

def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(
    t,
    'https://shishalove.eu/shishalove-merchant/?app=android&build=143',
    'https://shishalove.eu/shishalove-merchant-beta/?app=android&build=merchant-preview-1',
    'Merchant beta route'
)
t = t.replace('ShishaLoveMerchant/1.1.43', 'ShishaLoveMerchant/1.1.43-BetaPreview1')
main.write_text(t, encoding='utf-8')

gradle = ROOT / 'merchant/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 143', 'versionCode 14301', 'Merchant beta versionCode')
t = once(t, "versionName '1.1.43'", "versionName '1.1.43-preview1'", 'Merchant beta versionName')
gradle.write_text(t, encoding='utf-8')

manifest = ROOT / 'merchant/src/main/AndroidManifest.xml'
t = manifest.read_text(encoding='utf-8')
t = once(t, 'android:label="ShishaLove Merchant"', 'android:label="ShishaLove Merchant Beta"', 'Merchant beta label')
manifest.write_text(t, encoding='utf-8')

final_main = main.read_text(encoding='utf-8')
final_gradle = gradle.read_text(encoding='utf-8')
final_manifest = manifest.read_text(encoding='utf-8')
assert '/shishalove-merchant-beta/' in final_main
assert 'versionCode 14301' in final_gradle
assert "versionName '1.1.43-preview1'" in final_gradle
assert 'ShishaLove Merchant Beta' in final_manifest
assert 'POST_NOTIFICATIONS' in final_manifest
print('Side-by-side Merchant Beta Preview 1 prepared')
