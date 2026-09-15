#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-merchant-layout-1.1.41.py'))])


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
# 1.1.41 proved the nested .slm-page overflow scroller is not reliable in the
# Samsung WebView. Restore the WebView document as the single scroll owner and
# keep the Merchant nav fixed to the bottom of the already-safe native viewport.
# Native Android still owns the real status/navigation bar insets exactly once.
activity = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
t = activity.read_text(encoding='utf-8')
t = replace_method(t, '    private void applyWebFix()', r'''    private void applyWebFix() {
        if (merchantWebView == null) return;
        String js = "(function(){"
                + "var d=document.documentElement,b=document.body;if(!d||!b)return;"
                + "d.style.setProperty('--safe-top','0px','important');"
                + "d.style.setProperty('--safe-bottom','0px','important');"
                + "d.style.setProperty('--slb-native-bottom','0px','important');"
                + "d.style.setProperty('height','auto','important');d.style.setProperty('min-height','100%','important');d.style.setProperty('overflow-y','auto','important');d.style.setProperty('overflow-x','hidden','important');d.style.setProperty('touch-action','pan-y','important');"
                + "b.style.setProperty('height','auto','important');b.style.setProperty('min-height','100%','important');b.style.setProperty('overflow-y','auto','important');b.style.setProperty('overflow-x','hidden','important');b.style.setProperty('touch-action','pan-y','important');b.style.setProperty('-webkit-overflow-scrolling','touch','important');b.style.setProperty('background','#fff','important');"
                + "var r=document.getElementById('slb-root');if(r){r.style.setProperty('height','auto','important');r.style.setProperty('min-height','100%','important');r.style.setProperty('overflow','visible','important');}"
                + "var old=document.getElementById('slm-native-layout-141');if(old)old.remove();"
                + "var s=document.getElementById('slm-native-layout-142');"
                + "if(!s){s=document.createElement('style');s.id='slm-native-layout-142';"
                + "s.textContent='body.slb-merchant .slm-app{height:auto!important;min-height:100vh!important;padding-bottom:92px!important;display:block!important;overflow:visible!important}body.slb-merchant .slm-top{position:sticky!important;top:0!important;bottom:auto!important;z-index:80!important}body.slb-merchant .slm-page{position:relative!important;inset:auto!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important;touch-action:pan-y!important;padding-bottom:104px!important}body.slb-merchant .slm-bottom{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;transform:none!important;margin:0!important;width:100%!important;height:72px!important;min-height:72px!important;padding:0!important;box-sizing:border-box!important;background:#fff!important;z-index:9999!important}';document.head.appendChild(s);}"
                + "})();";
        merchantWebView.evaluateJavascript(js, null);
    }''')
activity.write_text(t, encoding='utf-8')

# Version bump only for canonical Merchant. Customer and Bridge remain untouched.
gradle = ROOT / 'merchant/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 141', 'versionCode 142', 'merchant versionCode')
t = once(t, "versionName '1.1.41'", "versionName '1.1.42'", 'merchant versionName')
t = t.replace('ShishaLoveMerchant/1.1.41', 'ShishaLoveMerchant/1.1.42')
t = t.replace('slm-native-layout-141', 'slm-native-layout-142')
# 1.1.36 locked scrolling to a nested-page CSS literal. 1.1.42 intentionally
# moves scrolling back to the WebView document, so update that invariant too.
t = t.replace(
    "if (!permanentSource.contains('overflow-y:auto!important')) throw new GradleException('Permanent Merchant scrolling fix missing')",
    "if (!permanentSource.contains(\"overflow-y','auto','important'\")) throw new GradleException('Permanent Merchant document scrolling fix missing')"
)
gradle.write_text(t, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=141', 'build=142', 'merchant cache bust')
t = t.replace('ShishaLoveMerchant/1.1.41', 'ShishaLoveMerchant/1.1.42')
main.write_text(t, encoding='utf-8')

final = activity.read_text(encoding='utf-8')
assert 'int systemBottom = Math.max(bars.bottom, nav.bottom);' in final
assert 'int safeBottom = Math.min(Math.max(0, systemBottom), dp(64)) + dp(6);' in final
assert "slm-native-layout-142" in final
assert "overflow-y','auto','important'" in final
assert "body.slb-merchant .slm-page{position:relative!important" in final
assert "overflow:visible!important" in final
assert "body.slb-merchant .slm-bottom{position:fixed!important" in final
assert "bottom:0!important" in final
assert "height:72px!important" in final
assert "Permanent Merchant document scrolling fix missing" in gradle.read_text(encoding='utf-8')
assert 'versionCode 142' in gradle.read_text(encoding='utf-8')
assert "versionName '1.1.42'" in gradle.read_text(encoding='utf-8')
assert 'build=142' in main.read_text(encoding='utf-8')
print('ShishaLove Merchant 1.1.42: document scrolling + fixed bottom navigation applied')
