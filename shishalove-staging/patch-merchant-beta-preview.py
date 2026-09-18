#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1] / 'shishalove-mobile'
base_patch = ROOT / 'tools' / 'patch-merchant-context-1.1.43.py'
subprocess.check_call([sys.executable, str(base_patch)])

# Package the exact approved Merchant wordmark used by the WebView header as a
# native splash resource.
import base64
import re
repo_root = Path(__file__).resolve().parents[1]
merchant_runtime = (repo_root / 'shishalove-staging' / 'merchant-generated.js').read_text(encoding='utf-8')
wordmark_match = re.search(r"var MERCHANT_WORDMARK='data:image/png;base64,([^']+)'", merchant_runtime)
if not wordmark_match:
    raise SystemExit('MERCHANT_WORDMARK data URI missing from staging runtime')
drawable_dir = ROOT / 'merchant/src/main/res/drawable-nodpi'
drawable_dir.mkdir(parents=True, exist_ok=True)
(drawable_dir / 'merchant_splash_wordmark.png').write_bytes(base64.b64decode(wordmark_match.group(1)))

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
# SIDE-BY-SIDE BETA IDENTITY — Preview 5
# ---------------------------------------------------------------------------
main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')

# Native splash dependencies.
t = once(t, 'import android.graphics.Color;\n', 'import android.graphics.Color;\nimport android.graphics.drawable.GradientDrawable;\n', 'splash drawable import')
t = once(t, 'import android.view.ViewGroup;\n', 'import android.view.ViewGroup;\nimport android.view.Gravity;\n', 'splash gravity import')
t = once(t, 'import android.widget.ImageView;\n', 'import android.widget.ImageView;\nimport android.widget.Button;\nimport android.widget.LinearLayout;\nimport android.widget.TextView;\n', 'splash widget imports')

t = once(
    t,
    '    private ImageView snapshotOverlay;\n',
    '    private ImageView snapshotOverlay;\n    private FrameLayout launchOverlay;\n    private Button enterButton;\n    private boolean merchantPageReady = false;\n    private boolean enterRequested = false;\n',
    'splash fields'
)

# Add the branded splash above the WebView/snapshot layer.
t = once(
    t,
    '''        root.addView(snapshotOverlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        progressBar = new ProgressBar''',
    '''        root.addView(snapshotOverlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        createLaunchOverlay();

        progressBar = new ProgressBar''',
    'launch overlay insertion'
)

# Show branded splash only on a true cold start.
t = once(
    t,
    '        if (savedInstanceState == null) webView.loadUrl(START_URL);\n        else webView.restoreState(savedInstanceState);',
    '''        if (savedInstanceState == null) {
            webView.loadUrl(START_URL);
        } else {
            launchOverlay.setVisibility(View.GONE);
            webView.restoreState(savedInstanceState);
        }''',
    'cold start splash state'
)

splash_methods = r'''    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private GradientDrawable roundedBackground(int color, int radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radiusDp));
        return d;
    }

    private void createLaunchOverlay() {
        launchOverlay = new FrameLayout(this);
        launchOverlay.setBackgroundColor(Color.WHITE);
        launchOverlay.setClickable(true);
        launchOverlay.setFocusable(true);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER_HORIZONTAL);

        LinearLayout logoCard = new LinearLayout(this);
        logoCard.setOrientation(LinearLayout.VERTICAL);
        logoCard.setGravity(Gravity.CENTER);
        logoCard.setBackground(roundedBackground(Color.rgb(5, 5, 5), 14));

        ImageView wordmark = new ImageView(this);
        wordmark.setImageResource(R.drawable.merchant_splash_wordmark);
        wordmark.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        LinearLayout.LayoutParams wordmarkLp = new LinearLayout.LayoutParams(dp(286), dp(74));
        wordmarkLp.setMargins(dp(12), dp(10), dp(12), 0);
        logoCard.addView(wordmark, wordmarkLp);

        TextView merchantBand = new TextView(this);
        merchantBand.setText("MERCHANT");
        merchantBand.setTextColor(Color.WHITE);
        merchantBand.setTextSize(20);
        merchantBand.setGravity(Gravity.CENTER);
        merchantBand.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        merchantBand.setLetterSpacing(0.08f);
        merchantBand.setBackgroundColor(Color.rgb(219, 35, 66));
        logoCard.addView(merchantBand, new LinearLayout.LayoutParams(dp(310), dp(42)));

        content.addView(logoCard, new LinearLayout.LayoutParams(dp(310), dp(126)));

        enterButton = new Button(this);
        enterButton.setText("ENTER");
        enterButton.setTextColor(Color.WHITE);
        enterButton.setTextSize(17);
        enterButton.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        enterButton.setBackground(roundedBackground(Color.rgb(17, 17, 17), 16));
        LinearLayout.LayoutParams enterLp = new LinearLayout.LayoutParams(dp(210), dp(56));
        enterLp.setMargins(0, dp(34), 0, 0);
        content.addView(enterButton, enterLp);

        enterButton.setOnClickListener(v -> {
            enterRequested = true;
            if (merchantPageReady) {
                hideLaunchOverlay();
            } else {
                enterButton.setText("LOADING…");
                enterButton.setEnabled(false);
            }
        });

        FrameLayout.LayoutParams contentLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
        );
        launchOverlay.addView(content, contentLp);
        root.addView(launchOverlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
    }

    private void hideLaunchOverlay() {
        if (launchOverlay == null || launchOverlay.getVisibility() != View.VISIBLE) return;
        launchOverlay.animate().alpha(0f).setDuration(140).withEndAction(() -> {
            launchOverlay.setVisibility(View.GONE);
            launchOverlay.setAlpha(1f);
        }).start();
    }

'''
t = once(t, '    private void createOrderNotificationChannel() {', splash_methods + '    private void createOrderNotificationChannel() {', 'splash methods')

t = once(
    t,
    'https://shishalove.eu/shishalove-merchant/?app=android&build=143',
    'https://shishalove.eu/shishalove-merchant-beta/?app=android&build=merchant-preview-5',
    'Merchant beta route'
)
t = t.replace('ShishaLoveMerchant/1.1.43', 'ShishaLoveMerchant/1.1.43-BetaPreview5')

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
        if (launchOverlay != null && launchOverlay.getVisibility() == View.VISIBLE) return;
        if (lastSnapshot == null || lastSnapshot.isRecycled()) return;
        snapshotOverlay.animate().cancel();
        snapshotOverlay.setBackgroundColor(Color.WHITE);
        snapshotOverlay.setAlpha(1f);
        snapshotOverlay.setScaleType(ImageView.ScaleType.FIT_XY);
        snapshotOverlay.setImageBitmap(lastSnapshot);
        snapshotOverlay.setPadding(0, 0, 0, 0);
        snapshotOverlay.setVisibility(View.VISIBLE);
        snapshotOverlay.removeCallbacks(hideSnapshotFailsafe);
        snapshotOverlay.postDelayed(hideSnapshotFailsafe, 1400);
    }''')

# Insert a reusable hard timeout runnable before hideLastSnapshot().
t = t.replace(
    '    private void hideLastSnapshot() {',
    '''    private final Runnable hideSnapshotFailsafe = () -> {
        if (snapshotOverlay != null && snapshotOverlay.getVisibility() == View.VISIBLE) {
            hideLastSnapshot();
        }
    };

    private void hideLastSnapshot() {'''
)

# Do not hide the previous frame at first visual commit; Bridge data/layout may
# still be hydrating. Hide only after onPageFinished and a short paint window.
t = replace_method(t, '            public void onPageStarted(WebView view, String url, Bitmap favicon)', r'''            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                merchantPageReady = false;
                showLastSnapshot();
                applyRuntimeJs(view, url);
                view.postDelayed(() -> applyRuntimeJs(view, url), 60);
                view.postDelayed(() -> applyRuntimeJs(view, url), 180);
            }''')

t = replace_method(t, '            public void onPageCommitVisible(WebView view, String url)', r'''            public void onPageCommitVisible(WebView view, String url) {
                super.onPageCommitVisible(view, url);
                applyRuntimeJs(view, url);
                progressBar.setVisibility(View.GONE);
                merchantPageReady = true;
                if (enterButton != null) {
                    enterButton.setEnabled(true);
                    enterButton.setText("ENTER");
                }
                if (enterRequested) hideLaunchOverlay();
                view.postDelayed(() -> {
                    applyRuntimeJs(view, url);
                    hideLastSnapshot();
                }, 120);
            }''')

t = replace_method(t, '            public void onPageFinished(WebView view, String url)', r'''            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                applyRuntimeJs(view, url);
                progressBar.setVisibility(View.GONE);
                merchantPageReady = true;
                if (enterButton != null) {
                    enterButton.setEnabled(true);
                    enterButton.setText("ENTER");
                }
                snapshotOverlay.removeCallbacks(hideSnapshotFailsafe);
                hideLastSnapshot();
                if (enterRequested) hideLaunchOverlay();
                view.postDelayed(() -> {
                    applyRuntimeJs(view, url);
                    captureSnapshot();
                }, 180);
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
preview5 = r'''
;(function(){
  function installPreview3(){
    if(!document.head)return;
    var s=document.getElementById('slm-preview5-first-paint');
    if(!s){
      s=document.createElement('style');
      s.id='slm-preview5-first-paint';
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
if 'slm-preview5-first-paint' not in pt:
    pt += preview5
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
                + "['slm-native-layout-141','slm-native-layout-142','slm-native-layout-beta2','slm-native-layout-beta5'].forEach(function(id){var x=document.getElementById(id);if(x)x.remove();});"
                + "var s=document.createElement('style');s.id='slm-native-layout-beta5';"
                + "s.textContent='body.slb-merchant{--safe-bottom:0px!important}body.slb-merchant .slm-app{position:relative!important;height:auto!important;min-height:100vh!important;display:block!important;overflow:visible!important;padding-bottom:92px!important}body.slb-merchant .slm-top{position:sticky!important;top:0!important;z-index:80!important}body.slb-merchant .slm-page{position:relative!important;height:auto!important;min-height:calc(100vh - 160px)!important;max-height:none!important;overflow:visible!important;touch-action:pan-y!important;padding-bottom:118px!important}body.slb-merchant .slm-bottom{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%!important;height:72px!important;min-height:72px!important;padding:0!important;margin:0!important;transform:none!important;box-sizing:border-box!important;background:#fff!important;z-index:9999!important}body.slb-merchant .slm-bottom button{font-size:11px!important;line-height:1.1!important;padding:0 2px!important;min-width:0!important}body.slb-merchant .slm-bottom button i{font-size:22px!important;line-height:1!important}body.slb-merchant .slm-product-row,body.slb-merchant .slm-order{touch-action:pan-y!important}.slm-panel .slm-form-actions{position:static!important;bottom:auto!important;margin:12px 0 6px!important;padding:0!important}';"
                + "document.head.appendChild(s);"
                + "var panel=document.getElementById('slm-panel'),stock=panel&&panel.querySelector('.slm-stock-management'),actions=panel&&panel.querySelector('.slm-form-actions');if(stock&&actions&&stock.nextElementSibling!==actions)stock.insertAdjacentElement('afterend',actions);"
                + "})();";
        merchantWebView.evaluateJavascript(js, null);
    }''')
activity.write_text(t, encoding='utf-8')

gradle = ROOT / 'merchant/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 143', 'versionCode 14305', 'Merchant beta versionCode')
t = once(t, "versionName '1.1.43'", "versionName '1.1.43-preview5'", 'Merchant beta versionName')
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
assert 'merchant-preview-5' in final_main
assert 'WebSettings.LOAD_CACHE_ELSE_NETWORK' in final_main
assert 'hideSnapshotFailsafe' in final_main
assert 'postDelayed(hideSnapshotFailsafe, 1400)' in final_main
assert 'snapshotOverlay.removeCallbacks(hideSnapshotFailsafe)' in final_main
assert 'merchant_splash_wordmark' in final_main
assert 'merchantBand.setText("MERCHANT")' in final_main
assert 'enterButton.setText("ENTER")' in final_main
assert 'createLaunchOverlay()' in final_main
assert 'view.postDelayed(() -> {' in final_main
assert 'versionCode 14305' in final_gradle
assert "versionName '1.1.43-preview5'" in final_gradle
assert 'ShishaLove Merchant Beta' in final_manifest
assert 'POST_NOTIFICATIONS' in final_manifest
assert 'slm-native-layout-beta5' in final_activity
assert "padding-bottom:118px!important" in final_activity
assert "height:72px!important" in final_activity
assert "slm-preview5-first-paint" in final_polish
assert "stock.insertAdjacentElement('afterend',actions)" in final_polish
assert ".slm-panel .slm-form-actions{position:static!important" in final_polish
print('Merchant Beta Preview 5: branded Merchant splash + ENTER + cold-open nav + instant reload + editor actions MASTER FIX prepared')
