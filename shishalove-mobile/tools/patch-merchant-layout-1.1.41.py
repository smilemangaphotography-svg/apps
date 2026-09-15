#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-merchant-runtime-1.1.40.py'))])


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
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

# MERCHANT ONLY.
# Device screenshots from 1.1.40 prove that the prior selector was not reliably
# owning the whole app height: Dashboard placed the nav after short content while
# Stock pushed it below long content. Use the actual Merchant body class (which is
# always present) and one explicit three-row grid: header / scrolling page / nav.
# Android still owns the real status/navigation-bar insets, so the 72dp Merchant
# nav is always inside the WebView and immediately above Samsung system controls.
activity = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
t = activity.read_text(encoding='utf-8')
t = replace_method(t, '    private void applyWebFix()', r'''    private void applyWebFix() {
        if (merchantWebView == null) return;
        String js = "(function(){"
                + "var d=document.documentElement,b=document.body;if(!d||!b)return;"
                + "d.style.setProperty('--safe-top','0px','important');"
                + "d.style.setProperty('--safe-bottom','0px','important');"
                + "d.style.setProperty('--slb-native-bottom','0px','important');"
                + "d.style.setProperty('height','100%','important');d.style.setProperty('min-height','0','important');d.style.setProperty('overflow','hidden','important');"
                + "b.style.setProperty('height','100%','important');b.style.setProperty('min-height','0','important');b.style.setProperty('overflow','hidden','important');b.style.setProperty('background','#fff','important');"
                + "var r=document.getElementById('slb-root');if(r){r.style.setProperty('height','100%','important');r.style.setProperty('min-height','0','important');r.style.setProperty('overflow','hidden','important');}"
                + "var s=document.getElementById('slm-native-layout-141');"
                + "if(!s){s=document.createElement('style');s.id='slm-native-layout-141';"
                + "s.textContent='body.slb-merchant .slm-app{height:100%!important;min-height:0!important;padding-bottom:0!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) 72px!important;overflow:hidden!important}body.slb-merchant .slm-top{position:relative!important;inset:auto!important;top:auto!important;bottom:auto!important;min-height:0!important}body.slb-merchant .slm-page{position:relative!important;inset:auto!important;min-height:0!important;height:auto!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;padding-bottom:28px!important}body.slb-merchant .slm-bottom{position:relative!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;margin:0!important;width:100%!important;height:72px!important;min-height:72px!important;padding:0!important;box-sizing:border-box!important;background:#fff!important;z-index:9999!important}';document.head.appendChild(s);}"
                + "})();";
        merchantWebView.evaluateJavascript(js, null);
    }''')
activity.write_text(t, encoding='utf-8')

# Version bump only for canonical Merchant. Customer and Bridge remain untouched.
gradle = ROOT / 'merchant/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 140', 'versionCode 141', 'merchant versionCode')
t = once(t, "versionName '1.1.40'", "versionName '1.1.41'", 'merchant versionName')
t = t.replace('ShishaLoveMerchant/1.1.40', 'ShishaLoveMerchant/1.1.41')
t = t.replace('slm-native-layout-136', 'slm-native-layout-141')
gradle.write_text(t, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=140', 'build=141', 'merchant cache bust')
t = t.replace('ShishaLoveMerchant/1.1.40', 'ShishaLoveMerchant/1.1.41')
main.write_text(t, encoding='utf-8')

final = activity.read_text(encoding='utf-8')
assert 'int systemBottom = Math.max(bars.bottom, nav.bottom);' in final
assert 'int safeBottom = Math.min(Math.max(0, systemBottom), dp(64)) + dp(6);' in final
assert "slm-native-layout-141" in final
assert "body.slb-merchant .slm-app{height:100%!important" in final
assert "display:grid!important" in final
assert "grid-template-rows:auto minmax(0,1fr) 72px!important" in final
assert "body.slb-merchant .slm-page{position:relative!important" in final
assert "overflow-y:auto!important" in final
assert "touch-action:pan-y!important" in final
assert "body.slb-merchant .slm-bottom{position:relative!important" in final
assert "height:72px!important" in final
assert 'versionCode 141' in gradle.read_text(encoding='utf-8')
assert "versionName '1.1.41'" in gradle.read_text(encoding='utf-8')
assert 'build=141' in main.read_text(encoding='utf-8')
print('ShishaLove Merchant 1.1.41: fixed header / scrollable content / bottom-nav grid applied')
