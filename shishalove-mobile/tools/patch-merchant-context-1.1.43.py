#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-merchant-scroll-1.1.42.py'))])


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

# Merchant Android behavior/layout stays exactly on the working 1.1.42 scroll fix.
# This release only bumps identity/cache-bust so the phone immediately loads the
# Bridge 1.1.43 Merchant workflow changes.
gradle = ROOT / 'merchant/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 142', 'versionCode 143', 'merchant versionCode')
t = once(t, "versionName '1.1.42'", "versionName '1.1.43'", 'merchant versionName')
t = t.replace('ShishaLoveMerchant/1.1.42', 'ShishaLoveMerchant/1.1.43')
gradle.write_text(t, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=142', 'build=143', 'merchant cache bust')
t = t.replace('ShishaLoveMerchant/1.1.42', 'ShishaLoveMerchant/1.1.43')
main.write_text(t, encoding='utf-8')

activity = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
final = activity.read_text(encoding='utf-8')
assert 'slm-native-layout-142' in final
assert "overflow-y','auto','important'" in final
assert "body.slb-merchant .slm-bottom{position:fixed!important" in final
assert 'versionCode 143' in gradle.read_text(encoding='utf-8')
assert "versionName '1.1.43'" in gradle.read_text(encoding='utf-8')
assert 'build=143' in main.read_text(encoding='utf-8')
print('ShishaLove Merchant 1.1.43: 1.1.42 scrolling retained + Bridge cache bust applied')
