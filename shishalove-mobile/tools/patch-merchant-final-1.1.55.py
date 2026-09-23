#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2:
    raise SystemExit('usage: patch-merchant-final-1.1.55.py <built-bridge-plugin-dir>')
bridge_root = Path(sys.argv[1])

# Preserve the approved Android release chain through 1.1.52.
subprocess.check_call([
    sys.executable,
    str(Path(__file__).with_name('patch-merchant-final-1.1.52.py')),
    str(bridge_root),
])

def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {count}')
    return text.replace(old, new, 1)

gradle = ROOT / 'merchant/build.gradle'
g = gradle.read_text(encoding='utf-8')
g = once(g, 'versionCode 152', 'versionCode 155', 'merchant versionCode')
g = once(g, "versionName '1.1.52'", "versionName '1.1.55'", 'merchant versionName')
g = g.replace('ShishaLoveMerchant/1.1.52', 'ShishaLoveMerchant/1.1.55')
gradle.write_text(g, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=152', 'build=155', 'merchant URL cache bust')
t, ua_count = re.subn(r'ShishaLoveMerchant/[0-9.]+', 'ShishaLoveMerchant/1.1.55', t)
if ua_count < 1:
    raise SystemExit('Merchant user agent marker missing')

# The production cache reset introduced in 1.1.50 was incorrectly pinned to build 150.
# Advance it for this runtime so update-in-place cannot restore a stale WebView document.
t = once(t, 'final int expectedBuild = 150;', 'final int expectedBuild = 155;', 'runtime cache generation')

main.write_text(t, encoding='utf-8')

final_gradle = gradle.read_text(encoding='utf-8')
final_main = main.read_text(encoding='utf-8')
final_manifest = (ROOT / 'merchant/src/main/AndroidManifest.xml').read_text(encoding='utf-8')

assert "applicationId 'eu.shishalove.merchant'" in final_gradle
assert 'versionCode 155' in final_gradle
assert "versionName '1.1.55'" in final_gradle
assert 'build=155' in final_main
assert 'ShishaLoveMerchant/1.1.55' in final_main
assert 'final int expectedBuild = 155;' in final_main
assert 'webView.clearCache(true)' in final_main
assert 'loadFreshStartUrl()' in final_main
assert 'Cache-Control", "no-cache, no-store, max-age=0' in final_main
assert 'private void applyRuntimeJsOnce(WebView view, String url)' in final_main
assert 'android:launchMode="singleTop"' in final_manifest

print('ShishaLove Merchant Android 1.1.55: runtime-generation cache reset + current remote URL prepared')
