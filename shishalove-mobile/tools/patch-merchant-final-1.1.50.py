#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2:
    raise SystemExit('usage: patch-merchant-final-1.1.50.py <built-bridge-plugin-dir>')
bridge_root = Path(sys.argv[1])

subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-merchant-final-1.1.49.py')), str(bridge_root)])

def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

gradle = ROOT / 'merchant/build.gradle'
g = gradle.read_text(encoding='utf-8')
g = once(g, 'versionCode 149', 'versionCode 150', 'merchant versionCode')
g = once(g, "versionName '1.1.49'", "versionName '1.1.50'", 'merchant versionName')
g = g.replace('ShishaLoveMerchant/1.1.49', 'ShishaLoveMerchant/1.1.50')
gradle.write_text(g, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=149', 'build=150', 'merchant cache bust')
t, ua_count = re.subn(r'ShishaLoveMerchant/[0-9.]+', 'ShishaLoveMerchant/1.1.50', t)
if ua_count < 1:
    raise SystemExit('Merchant user agent marker missing')

# ROOT CAUSE: production WebView was allowed to reuse a stale cached Merchant shell
# across Bridge updates. Beta works because it uses a different URL namespace.
# Production must invalidate its WebView resource cache once on this runtime build
# and then return to normal HTTP-aware caching.
t = once(
    t,
    'settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);',
    'settings.setCacheMode(WebSettings.LOAD_DEFAULT);',
    'production WebView cache policy'
)

runtime_methods = r'''    private boolean refreshOfficialRuntimeCache() {
        final int expectedBuild = 150;
        android.content.SharedPreferences prefs =
                getSharedPreferences("shishalove_runtime", MODE_PRIVATE);
        int seen = prefs.getInt("merchant_web_runtime_build", 0);
        if (seen == expectedBuild) return false;
        try {
            webView.stopLoading();
            webView.clearCache(true);
            webView.clearHistory();
        } catch (Throwable ignored) {}
        prefs.edit().putInt("merchant_web_runtime_build", expectedBuild).apply();
        return true;
    }

    private void loadFreshStartUrl() {
        java.util.Map<String, String> headers = new java.util.HashMap<>();
        headers.put("Cache-Control", "no-cache, no-store, max-age=0");
        headers.put("Pragma", "no-cache");
        webView.loadUrl(START_URL, headers);
    }

'''
t = once(
    t,
    '    private int dp(int value) {',
    runtime_methods + '    private int dp(int value) {',
    'runtime cache reset methods'
)

t = once(
    t,
    '''        captureOrderIntent(getIntent());
        if (savedInstanceState == null) {
            webView.loadUrl(START_URL);
        } else {
            launchOverlay.setVisibility(View.GONE);
            webView.restoreState(savedInstanceState);
        }''',
    '''        boolean runtimeReset = refreshOfficialRuntimeCache();
        captureOrderIntent(getIntent());
        if (savedInstanceState == null || runtimeReset) {
            loadFreshStartUrl();
        } else {
            launchOverlay.setVisibility(View.GONE);
            webView.restoreState(savedInstanceState);
        }''',
    'fresh production cold start'
)

main.write_text(t, encoding='utf-8')

final_main = main.read_text(encoding='utf-8')
final_gradle = gradle.read_text(encoding='utf-8')
final_manifest = (ROOT / 'merchant/src/main/AndroidManifest.xml').read_text(encoding='utf-8')
final_activity = (ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java').read_text(encoding='utf-8')

assert 'build=150' in final_main
assert 'ShishaLoveMerchant/1.1.50' in final_main
assert 'WebSettings.LOAD_DEFAULT' in final_main
assert 'WebSettings.LOAD_CACHE_ELSE_NETWORK' not in final_main
assert 'refreshOfficialRuntimeCache()' in final_main
assert 'webView.clearCache(true)' in final_main
assert 'merchant_web_runtime_build' in final_main
assert 'loadFreshStartUrl()' in final_main
assert 'Cache-Control", "no-cache, no-store, max-age=0' in final_main
assert 'versionCode 150' in final_gradle
assert "versionName '1.1.50'" in final_gradle
assert 'OrderPollReceiver' in final_manifest
assert 'android:launchMode="singleTop"' in final_manifest
assert 'slm-native-layout-147' in final_activity
print('ShishaLove Merchant Android 1.1.50: approved Beta runtime + one-time production WebView cache purge prepared')
