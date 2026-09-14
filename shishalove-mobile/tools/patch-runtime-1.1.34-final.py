#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-runtime-1.1.34.py'))])

p = ROOT / 'merchant/build.gradle'
text = p.read_text(encoding='utf-8')
old1 = '''        if (!permanentSource.contains("nav.style.setProperty('bottom','0','important')")) throw new GradleException('Permanent Merchant bottom navigation lock missing')'''
old2 = '''        if (!permanentSource.contains("nav.style.setProperty('padding-bottom',inset,'important')")) throw new GradleException('Permanent Merchant navigation safe-area padding missing')'''
new1 = '''        if (!permanentSource.contains("slm-native-viewport-style")) throw new GradleException('Permanent Merchant bottom navigation stylesheet missing')'''
new2 = '''        if (!permanentSource.contains("--safe-bottom',inset,'important'")) throw new GradleException('Permanent Merchant navigation safe-area padding missing')'''
if old1 not in text or old2 not in text:
    raise SystemExit('merchant permanent-runtime guards not found')
text = text.replace(old1, new1, 1).replace(old2, new2, 1)
p.write_text(text, encoding='utf-8')

# Explicit final assertions for the build workspace.
assert 'versionCode 134' in (ROOT / 'customer/build.gradle').read_text(encoding='utf-8')
assert "versionName '1.1.34'" in (ROOT / 'customer/build.gradle').read_text(encoding='utf-8')
assert 'android:name=".CustomerActivityV134"' in (ROOT / 'customer/src/main/AndroidManifest.xml').read_text(encoding='utf-8')
assert 'versionCode 134' in (ROOT / 'merchant/build.gradle').read_text(encoding='utf-8')
assert "versionName '1.1.34'" in (ROOT / 'merchant/build.gradle').read_text(encoding='utf-8')
assert '__slmPermanentScrollGuard' not in (ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java').read_text(encoding='utf-8')
print('ShishaLove Android 1.1.34 final guards applied')
