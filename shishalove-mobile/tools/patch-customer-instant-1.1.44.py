#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-customer-resume-1.1.38.py'))])


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

# Preserve every approved Customer safe-area/resume fix from 1.1.38. This release
# only bumps identity/cache-bust and allows cached WebView resources to paint first.
gradle = ROOT / 'customer/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 138', 'versionCode 144', 'customer versionCode')
t = once(t, "versionName '1.1.38'", "versionName '1.1.44'", 'customer versionName')
t = t.replace('ShishaLoveCustomer/1.1.38', 'ShishaLoveCustomer/1.1.44')
gradle.write_text(t, encoding='utf-8')

main = ROOT / 'customer/src/main/java/eu/shishalove/customer/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=137', 'build=144', 'customer URL cache bust')
t = t.replace('ShishaLoveCustomer/1.1.37', 'ShishaLoveCustomer/1.1.44')
# Prefer an already-cached canonical shell on repeat launches; 1.1.44's URL bust
# guarantees the first launch after this update fetches the new bridge, while later
# launches can paint that shell immediately and the bridge revalidates data itself.
t = once(t, 'settings.setCacheMode(WebSettings.LOAD_DEFAULT);', 'settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);', 'customer WebView cache-first shell')
main.write_text(t, encoding='utf-8')

activity = ROOT / 'customer/src/main/java/eu/shishalove/customer/CustomerActivityV134.java'
final_activity = activity.read_text(encoding='utf-8')
assert 'getWindow().setDecorFitsSystemWindows(false);' in final_activity
assert 'refreshInsetsAndViewport();' in final_activity
assert 'appRoot.postDelayed(appRoot::requestApplyInsets, 280);' in final_activity
assert '.setInsets(WindowInsets.Type.systemBars(), android.graphics.Insets.NONE)' in final_activity
assert 'v.setPadding(bars.left, bars.top, bars.right, bars.bottom);' in final_activity
assert 'bottomInsetCssPx = 0;' in final_activity

final_gradle = gradle.read_text(encoding='utf-8')
final_main = main.read_text(encoding='utf-8')
assert 'versionCode 144' in final_gradle
assert "versionName '1.1.44'" in final_gradle
assert 'build=144' in final_main
assert 'WebSettings.LOAD_CACHE_ELSE_NETWORK' in final_main
print('ShishaLove Customer 1.1.44: instant cached shell + all approved 1.1.38 safe-area fixes preserved')
