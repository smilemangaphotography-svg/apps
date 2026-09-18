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
# SIDE-BY-SIDE BETA IDENTITY — Preview 3
# ---------------------------------------------------------------------------
main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(
    t,
    'https://shishalove.eu/shishalove-merchant/?app=android&build=143',
    'https://shishalove.eu/shishalove-merchant-beta/?app=android&build=merchant-preview-3',
    'Merchant beta route'
)
t = t.replace('ShishaLoveMerchant/1.1.43', 'ShishaLoveMerchant/1.1.43-BetaPreview3')

# Faster first paint/reload: the HTML shell may paint from cache immediately;
# Merchant REST calls still bypass cache in the staged Bridge.
t = once(
    t,
    'settings.setCacheMode(WebSettings.LOAD_DEFAULT);',
    'settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);',
    'Merchant shell cache mode'
)

# Never expose a blank white reload. If no in-memory snapshot exists yet, keep a
# lightweight native ShishaLove placeholder until the WebView is genuinely ready.
t = replace_method(t, '    private void showLastSnapshot()', r'''    private void showLastSnapshot() {
        snapshotOverlay.setBackgroundColor(Color.WHITE);
        snapshotOverlay.setAlpha(1f);
        if (lastSnapshot != null && !lastSnapshot.isRecycled()) {
            snapshotOverlay.setScaleType(ImageView.ScaleType.FIT_XY);
            snapshotOverlay.setImageBitmap(lastSnapshot);
        } else {
            snapshotOverlay.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
            snapshotOverlay.setImageResource(R.drawable.ic_shishalove);
            snapshotOverlay.setPadding(120, 120, 120, 120);
        }
        snapshotOverlay.setVisibility(View.VISIBLE);
    }''')

# Do not hide the previous frame at first visual commit; Bridge data/layout may
# still be hydrating. Hide only after onPageFinished and a short paint window.
t = replace_method(t, '            public void onPageCommitVisible(WebView view, String url)', r'''            public void onPageCommitVisible(WebView view, String url) {
                super.onPageCommitVisible(view, url);
                applyRuntimeJs(view);
                progressBar.setVisibility(View.GONE);
            }''')

t = replace_method(t, '            public void onPageFinished(WebView view, String url)', r'''            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                applyRuntimeJs(view);
                progressBar.setVisibility(View.GONE);
                view.postDelayed(() -> {
                    applyRuntimeJs(view);
                    hideLastSnapshot();
                    captureSnapshot();
                }, 220);
            }''')
main.write_text(t, encoding='utf-8')

# ---------------------------------------------------------------------------
# FIRST-PAINT CSS + EDITOR ACTION PLACEMENT.
# Runs through MainActivity.applyRuntimeJs() at page start/commit/finish and is
# intentionally idempotent. It fixes the cold-open nav before the delayed native
# viewport guard and moves CANCEL/UPDATE directly below Stock management.
# ---------------------------------------------------------------------------
polish = ROOT / 'merchant/src/main/assets/merchant_phone_polish.js'
pt = polish.read_text(encoding='utf-8')
preview3 = r'''
;(function(){
  function installPreview3(){
    if(!document.head)return;
    var s=document.getElementById('slm-preview3-first-paint');
    if(!s){
      s=document.createElement('style');
      s.id='slm-preview3-first-paint';
      s.textContent='body.slb-merchant{--safe-bottom:0px!important}body.slb-merchant .slm-app{height:auto!important;min-height:100vh!important;overflow:visible!important;padding-bottom:92px!important}body.slb-merchant .slm-page{height:auto!important;max-height:none!important;overflow:visible!important;padding-bottom:118px!important}body.slb-merchant .slm-bottom{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;height:72px!important;min-height:72px!important;padding:0!important;margin:0!important;transform:none!important;background:#fff!important;z-index:9999!important}body.slb-merchant .slm-bottom button{font-size:11px!important;line-height:1.1!important;padding:0 2px!important}body.slb-merchant .slm-bottom button i{font-size:22px!important}.slm-panel .slm-form-actions{position:static!important;bottom:auto!important;margin:12px 0 6px!important;padding:0!important;background:#fff!important}';
      document.head.appendChild(s);
    }
    var panel=document.getElementById('slm-panel');
    if(panel){
      var stock=panel.querySelector('.slm-stock-management');
      var actions=panel.querySelector('.slm-form-actions');
      if(stock&&actions&&stock.nextElementSibling!==actions){
        stock.insertAdjacentElement('afterend',actions);
      }
    }
  }
  installPreview3();
  setTimeout(installPreview3,40);
  setTimeout(installPreview3,160);
  setTimeout(installPreview3,500);
  if(!window.__slmPreview3Observer&&document.documentElement){
    window.__slmPreview3Observer=new MutationObserver(function(){installPreview3();});
    window.__slmPreview3Observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
'''
if 'slm-preview3-first-paint' not in pt:
    pt += preview3
polish.write_text(pt, encoding='utf-8')

# ---------------------------------------------------------------------------
# ANDROID DOCUMENT SCROLL + BOTTOM NAV — same approved Preview 2 behavior,
# applied more aggressively on cold opens where the first document can arrive late.
# ---------------------------------------------------------------------------
activity = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
t = activity.read_text(encoding='utf-8')
t = replace_method(t, '    private void scheduleWebFixes()', r'''    private void scheduleWebFixes() {
        if (merchantWebView == null) return;
        merchantWebView.post(this::applyWebFix);
        merchantWebView.postDelayed(this::applyWebFix, 40);
        merchantWebView.postDelayed(this::applyWebFix, 120);
        merchantWebView.postDelayed(this::applyWebFix, 300);
        merchantWebView.postDelayed(this::applyWebFix, 700);
        merchantWebView.postDelayed(this::applyWebFix, 1400);
        merchantWebView.postDelayed(this::applyWebFix, 2600);
        merchantWebView.postDelayed(this::applyWebFix, 5000);
        merchantWebView.postDelayed(this::applyWebFix, 8000);
    }''')
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
                + "['slm-native-layout-141','slm-native-layout-142','slm-native-layout-beta2','slm-native-layout-beta3'].forEach(function(id){var x=document.getElementById(id);if(x)x.remove();});"
                + "var s=document.createElement('style');s.id='slm-native-layout-beta3';"
                + "s.textContent='body.slb-merchant{--safe-bottom:0px!important}body.slb-merchant .slm-app{position:relative!important;height:auto!important;min-height:100vh!important;display:block!important;overflow:visible!important;padding-bottom:92px!important}body.slb-merchant .slm-top{position:sticky!important;top:0!important;z-index:80!important}body.slb-merchant .slm-page{position:relative!important;height:auto!important;min-height:calc(100vh - 160px)!important;max-height:none!important;overflow:visible!important;touch-action:pan-y!important;padding-bottom:118px!important}body.slb-merchant .slm-bottom{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%!important;height:72px!important;min-height:72px!important;padding:0!important;margin:0!important;transform:none!important;box-sizing:border-box!important;background:#fff!important;z-index:9999!important}body.slb-merchant .slm-bottom button{font-size:11px!important;line-height:1.1!important;padding:0 2px!important;min-width:0!important}body.slb-merchant .slm-bottom button i{font-size:22px!important;line-height:1!important}body.slb-merchant .slm-product-row,body.slb-merchant .slm-order{touch-action:pan-y!important}.slm-panel .slm-form-actions{position:static!important;bottom:auto!important;margin:12px 0 6px!important;padding:0!important}';"
                + "document.head.appendChild(s);"
                + "var panel=document.getElementById('slm-panel'),stock=panel&&panel.querySelector('.slm-stock-management'),actions=panel&&panel.querySelector('.slm-form-actions');if(stock&&actions&&stock.nextElementSibling!==actions)stock.insertAdjacentElement('afterend',actions);"
                + "})();";
        merchantWebView.evaluateJavascript(js, null);
    }''')
activity.write_text(t, encoding='utf-8')

gradle = ROOT / 'merchant/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 143', 'versionCode 14303', 'Merchant beta versionCode')
t = once(t, "versionName '1.1.43'", "versionName '1.1.43-preview3'", 'Merchant beta versionName')
gradle.write_text(t, encoding='utf-8')

manifest = ROOT / 'merchant/src/main/AndroidManifest.xml'
t = manifest.read_text(encoding='utf-8')
t = once(t, 'android:label="ShishaLove Merchant"', 'android:label="ShishaLove Merchant Beta"', 'Merchant beta label')
manifest.write_text(t, encoding='utf-8')

final_main = main.read_text(encoding='utf-8')
final_activity = activity.read_text(encoding='utf-8')
final_gradle = gradle.read_text(encoding='utf-8')
final_manifest = manifest.read_text(encoding='utf-8')
final_polish = polish.read_text(encoding='utf-8')

assert '/shishalove-merchant-beta/' in final_main
assert 'merchant-preview-3' in final_main
assert 'WebSettings.LOAD_CACHE_ELSE_NETWORK' in final_main
assert 'view.postDelayed(() -> {' in final_main
assert 'versionCode 14303' in final_gradle
assert "versionName '1.1.43-preview3'" in final_gradle
assert 'ShishaLove Merchant Beta' in final_manifest
assert 'POST_NOTIFICATIONS' in final_manifest
assert 'slm-native-layout-beta3' in final_activity
assert "padding-bottom:118px!important" in final_activity
assert "height:72px!important" in final_activity
assert "slm-preview3-first-paint" in final_polish
assert "stock.insertAdjacentElement('afterend',actions)" in final_polish
assert ".slm-panel .slm-form-actions{position:static!important" in final_polish
print('Merchant Beta Preview 3: cold-open nav + instant reload + editor actions MASTER FIX prepared')
