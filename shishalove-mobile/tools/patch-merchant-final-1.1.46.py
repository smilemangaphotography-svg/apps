#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-merchant-context-1.1.43.py'))])

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

# Exact device-approved Beta Preview 2 layout behavior:
# one document scroll owner, fixed 72px Merchant nav, enough content clearance.
activity = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
t = activity.read_text(encoding='utf-8')
t = replace_method(t, '    private void applyWebFix()', r'''    private void applyWebFix() {
        if (merchantWebView == null) return;
        String js = "(function(){"
                + "var d=document.documentElement,b=document.body,r=document.getElementById('slb-root');if(!d||!b)return;"
                + "d.style.setProperty('--safe-top','0px','important');"
                + "d.style.setProperty('--safe-bottom','0px','important');"
                + "d.style.setProperty('--slb-native-bottom','0px','important');"
                + "d.style.setProperty('height','auto','important');d.style.setProperty('min-height','100%','important');d.style.setProperty('overflow-x','hidden','important');d.style.setProperty('overflow-y','auto','important');d.style.setProperty('touch-action','pan-y','important');"
                + "b.style.setProperty('position','static','important');b.style.setProperty('height','auto','important');b.style.setProperty('min-height','100%','important');b.style.setProperty('overflow-x','hidden','important');b.style.setProperty('overflow-y','auto','important');b.style.setProperty('touch-action','pan-y','important');b.style.setProperty('-webkit-overflow-scrolling','touch','important');b.style.setProperty('overscroll-behavior-y','auto','important');"
                + "if(r){r.style.setProperty('position','static','important');r.style.setProperty('height','auto','important');r.style.setProperty('min-height','100%','important');r.style.setProperty('overflow','visible','important');r.style.setProperty('touch-action','pan-y','important');}"
                + "['slm-native-layout-141','slm-native-layout-142','slm-native-layout-146'].forEach(function(id){var x=document.getElementById(id);if(x)x.remove();});"
                + "var s=document.createElement('style');s.id='slm-native-layout-146';"
                + "s.textContent='body.slb-merchant .slm-app{position:relative!important;height:auto!important;min-height:100vh!important;display:block!important;overflow:visible!important;padding-bottom:92px!important}body.slb-merchant .slm-top{position:sticky!important;top:0!important;z-index:80!important}body.slb-merchant .slm-page{position:relative!important;height:auto!important;min-height:calc(100vh - 160px)!important;max-height:none!important;overflow:visible!important;touch-action:pan-y!important;padding-bottom:118px!important}body.slb-merchant .slm-bottom{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%!important;height:72px!important;min-height:72px!important;padding:0!important;margin:0!important;transform:none!important;box-sizing:border-box!important;background:#fff!important;z-index:9999!important}body.slb-merchant .slm-bottom button{font-size:11px!important;line-height:1.1!important;padding:0 2px!important;min-width:0!important}body.slb-merchant .slm-bottom button i{font-size:22px!important;line-height:1!important}body.slb-merchant .slm-product-row,body.slb-merchant .slm-order{touch-action:pan-y!important}';"
                + "document.head.appendChild(s);"
                + "})();";
        merchantWebView.evaluateJavascript(js, null);
    }''')
activity.write_text(t, encoding='utf-8')

gradle = ROOT / 'merchant/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 143', 'versionCode 146', 'merchant versionCode')
t = once(t, "versionName '1.1.43'", "versionName '1.1.46'", 'merchant versionName')
t = t.replace('ShishaLoveMerchant/1.1.43', 'ShishaLoveMerchant/1.1.46')
gradle.write_text(t, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=143', 'build=146', 'merchant cache bust')
t = t.replace('ShishaLoveMerchant/1.1.43', 'ShishaLoveMerchant/1.1.46')
main.write_text(t, encoding='utf-8')

final_activity = activity.read_text(encoding='utf-8')
final_gradle = gradle.read_text(encoding='utf-8')
final_main = main.read_text(encoding='utf-8')
manifest = (ROOT / 'merchant/src/main/AndroidManifest.xml').read_text(encoding='utf-8')

assert "slm-native-layout-146" in final_activity
assert "overflow-y','auto','important'" in final_activity
assert "body.slb-merchant .slm-page{position:relative!important" in final_activity
assert "overflow:visible!important" in final_activity
assert "padding-bottom:118px!important" in final_activity
assert "body.slb-merchant .slm-bottom{position:fixed!important" in final_activity
assert "height:72px!important" in final_activity
assert ".slm-bottom button{font-size:11px!important" in final_activity
assert 'versionCode 146' in final_gradle
assert "versionName '1.1.46'" in final_gradle
assert 'build=146' in final_main
assert 'android.permission.POST_NOTIFICATIONS' in manifest
assert 'ShishaLoveNative' in final_main
assert 'ORDER_CHANNEL_ID' in final_main
print('ShishaLove Merchant Android 1.1.46: device-approved scrolling/nav + notification shell finalized')
