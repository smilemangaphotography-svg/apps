#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-runtime-1.1.35.py'))])


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)


def replace_method(text, signature, replacement):
    start = text.find(signature)
    if start < 0:
        raise SystemExit('missing method: ' + signature)
    brace = text.find('{', start)
    if brace < 0:
        raise SystemExit('missing opening brace: ' + signature)
    depth = 0
    end = None
    for i in range(brace, len(text)):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        raise SystemExit('missing closing brace: ' + signature)
    return text[:start] + replacement.rstrip() + text[end:]

# ---------------------------------------------------------------------------
# CUSTOMER: preserve the current installed package line and the proven 1.1.34
# safe-area runtime. Only bump version/cache key so this is an in-place update.
# ---------------------------------------------------------------------------
p = ROOT / 'customer/build.gradle'
text = p.read_text(encoding='utf-8')
text = replace_once(text, 'versionCode 135', 'versionCode 136', 'customer versionCode')
text = replace_once(text, "versionName '1.1.35'", "versionName '1.1.36'", 'customer versionName')
text = text.replace('ShishaLoveCustomer/1.1.35', 'ShishaLoveCustomer/1.1.36')
p.write_text(text, encoding='utf-8')

p = ROOT / 'customer/src/main/java/eu/shishalove/customer/MainActivity.java'
text = p.read_text(encoding='utf-8')
text = replace_once(text, 'build=135', 'build=136', 'customer URL cache bust')
text = text.replace('ShishaLoveCustomer/1.1.35', 'ShishaLoveCustomer/1.1.36')
p.write_text(text, encoding='utf-8')

# ---------------------------------------------------------------------------
# MERCHANT: permanent single-owner safe-area model.
# Android owns BOTH system-bar insets at the native root. Inside the WebView,
# Merchant uses a three-row layout (header / scrollable content / nav). The
# web UI therefore never needs to guess Android's navigation-bar height and
# product rows can never sit behind the bottom navigation.
# ---------------------------------------------------------------------------
p = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
text = p.read_text(encoding='utf-8')
text = replace_once(
    text,
    'v.setPadding(bars.left, bars.top, bars.right, 0);',
    'v.setPadding(bars.left, bars.top, bars.right, bars.bottom);\n                bottomInsetCssPx = 0;',
    'merchant native bottom inset ownership'
)
text = replace_method(text, '    private void applyWebFix()', r'''    private void applyWebFix() {
        if (merchantWebView == null) return;
        String js = "(function(){"
                + "var d=document.documentElement,b=document.body;if(!d)return;"
                + "d.style.setProperty('--safe-top','0px','important');"
                + "d.style.setProperty('--safe-bottom','0px','important');"
                + "d.style.setProperty('--slb-native-bottom','0px','important');"
                + "d.style.setProperty('height','100%','important');d.style.setProperty('overflow','hidden','important');"
                + "if(b){b.style.setProperty('height','100%','important');b.style.setProperty('overflow','hidden','important');b.style.setProperty('background','#fff','important');}"
                + "var s=document.getElementById('slm-native-layout-136');"
                + "if(!s){s=document.createElement('style');s.id='slm-native-layout-136';"
                + "s.textContent='html.slb-android-app body.slb-merchant{height:100%!important;min-height:0!important;overflow:hidden!important}html.slb-android-app body.slb-merchant .slm-app{height:100%!important;min-height:0!important;padding-bottom:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}html.slb-android-app body.slb-merchant .slm-top{position:relative!important;top:auto!important;flex:0 0 auto!important}html.slb-android-app body.slb-merchant .slm-page{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding-bottom:28px!important}html.slb-android-app body.slb-merchant .slm-bottom{position:relative!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:100%!important;height:72px!important;min-height:72px!important;flex:0 0 72px!important;padding:0!important;box-sizing:border-box!important;background:#fff!important;z-index:90!important}';document.head.appendChild(s);}"
                + "})();";
        merchantWebView.evaluateJavascript(js, null);
    }''')
p.write_text(text, encoding='utf-8')

p = ROOT / 'merchant/build.gradle'
text = p.read_text(encoding='utf-8')
text = replace_once(text, 'versionCode 135', 'versionCode 136', 'merchant versionCode')
text = replace_once(text, "versionName '1.1.35'", "versionName '1.1.36'", 'merchant versionName')
text = text.replace('ShishaLoveMerchant/1.1.35', 'ShishaLoveMerchant/1.1.36')
p.write_text(text, encoding='utf-8')

p = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
text = p.read_text(encoding='utf-8')
text = replace_once(text, 'build=135', 'build=136', 'merchant URL cache bust')
text = text.replace('ShishaLoveMerchant/1.1.35', 'ShishaLoveMerchant/1.1.36')
p.write_text(text, encoding='utf-8')

# Build-time invariants: safe areas must have exactly one owner.
merchant_activity = (ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java').read_text(encoding='utf-8')
assert 'v.setPadding(bars.left, bars.top, bars.right, bars.bottom);' in merchant_activity
assert "--safe-bottom','0px','important'" in merchant_activity
assert 'slm-native-layout-136' in merchant_activity
assert 'position:relative!important' in merchant_activity
assert '__slmPermanentScrollGuard' not in merchant_activity

assert 'versionCode 136' in (ROOT / 'customer/build.gradle').read_text(encoding='utf-8')
assert "versionName '1.1.36'" in (ROOT / 'customer/build.gradle').read_text(encoding='utf-8')
assert 'build=136' in (ROOT / 'customer/src/main/java/eu/shishalove/customer/MainActivity.java').read_text(encoding='utf-8')
assert 'versionCode 136' in (ROOT / 'merchant/build.gradle').read_text(encoding='utf-8')
assert "versionName '1.1.36'" in (ROOT / 'merchant/build.gradle').read_text(encoding='utf-8')
assert 'build=136' in (ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java').read_text(encoding='utf-8')
print('ShishaLove Android 1.1.36: permanent single-owner safe areas + in-place update versions applied')
