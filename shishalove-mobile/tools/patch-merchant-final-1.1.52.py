#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2:
    raise SystemExit('usage: patch-merchant-final-1.1.52.py <built-bridge-plugin-dir>')
bridge_root = Path(sys.argv[1])

# Preserve the complete approved Android release chain through 1.1.51.
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-merchant-final-1.1.51.py')), str(bridge_root)])

def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

def replace_java_method(text, signature, replacement):
    s = text.find(signature)
    if s < 0:
        raise SystemExit('missing Java method: ' + signature)
    brace = text.find('{', s)
    if brace < 0:
        raise SystemExit('missing opening brace: ' + signature)
    depth = 0
    i = brace
    in_string = False
    quote = ''
    escaped = False
    while i < len(text):
        ch = text[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                in_string = False
        else:
            if ch in ('"', "'"):
                in_string = True
                quote = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return text[:s] + replacement.rstrip() + text[i + 1:]
        i += 1
    raise SystemExit('unclosed Java method: ' + signature)

gradle = ROOT / 'merchant/build.gradle'
g = gradle.read_text(encoding='utf-8')
g = once(g, 'versionCode 151', 'versionCode 152', 'merchant versionCode')
g = once(g, "versionName '1.1.51'", "versionName '1.1.52'", 'merchant versionName')
g = g.replace('ShishaLoveMerchant/1.1.51', 'ShishaLoveMerchant/1.1.52')
gradle.write_text(g, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=151', 'build=152', 'merchant URL cache bust')
t, ua_count = re.subn(r'ShishaLoveMerchant/[0-9.]+', 'ShishaLoveMerchant/1.1.52', t)
if ua_count < 1:
    raise SystemExit('Merchant user agent marker missing')

# ROOT CAUSE — legacy phone polish/order-watch JavaScript was injected many times
# during one document load (page started, progress callbacks, commit, finish and
# delayed callbacks). Keep the exact scripts, but install them once per document.
field_anchor = '    private String orderWatchJs;'
t = once(
    t,
    field_anchor,
    field_anchor + '\n    private String runtimeJsDocumentUrl = "";',
    'one-per-document runtime field'
)

method_anchor = '    private void applyRuntimeJs('
pos = t.find(method_anchor)
if pos < 0:
    raise SystemExit('applyRuntimeJs method missing')
helper = r'''    private void applyRuntimeJsOnce(WebView view, String url) {
        String key = url == null ? "" : url;
        if (key.equals(runtimeJsDocumentUrl)) return;
        runtimeJsDocumentUrl = key;
        applyRuntimeJs(view, url);
    }

'''
t = t[:pos] + helper + t[pos:]

t = replace_java_method(
    t,
    '            public void onPageStarted(WebView view, String url, Bitmap favicon)',
    r'''            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                merchantPageReady = false;
                runtimeJsDocumentUrl = "";
                showLastSnapshot();
            }'''
)

t = replace_java_method(
    t,
    '            public void onPageCommitVisible(WebView view, String url)',
    r'''            public void onPageCommitVisible(WebView view, String url) {
                super.onPageCommitVisible(view, url);
                applyRuntimeJsOnce(view, url);
                progressBar.setVisibility(View.GONE);
                merchantPageReady = true;
                if (enterButton != null) {
                    enterButton.setEnabled(true);
                    enterButton.setText("ENTER");
                }
                if (enterRequested && pendingOpenOrderId <= 0L) hideLaunchOverlay();
                view.postDelayed(() -> MainActivity.this.tryOpenPendingOrder(), 90);
                view.postDelayed(() -> registerBackgroundOrderChannel(view, url), 350);
                view.postDelayed(() -> MainActivity.this.hideLastSnapshot(), 120);
            }'''
)

t = replace_java_method(
    t,
    '            public void onPageFinished(WebView view, String url)',
    r'''            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                applyRuntimeJsOnce(view, url);
                progressBar.setVisibility(View.GONE);
                merchantPageReady = true;
                if (enterButton != null) {
                    enterButton.setEnabled(true);
                    enterButton.setText("ENTER");
                }
                snapshotOverlay.removeCallbacks(hideSnapshotFailsafe);
                hideLastSnapshot();
                if (enterRequested && pendingOpenOrderId <= 0L) hideLaunchOverlay();
                tryOpenPendingOrder();
                registerBackgroundOrderChannel(view, url);
                view.postDelayed(() -> {
                    registerBackgroundOrderChannel(view, url);
                    captureSnapshot();
                }, 600);
            }'''
)

t = replace_java_method(
    t,
    '            public void onProgressChanged(WebView view, int newProgress)',
    r'''            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(View.GONE);
            }'''
)

main.write_text(t, encoding='utf-8')

final_main = main.read_text(encoding='utf-8')
final_gradle = gradle.read_text(encoding='utf-8')
final_manifest = (ROOT / 'merchant/src/main/AndroidManifest.xml').read_text(encoding='utf-8')
final_activity = (ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java').read_text(encoding='utf-8')

assert 'build=152' in final_main
assert 'ShishaLoveMerchant/1.1.52' in final_main
assert 'runtimeJsDocumentUrl' in final_main
assert 'private void applyRuntimeJsOnce(WebView view, String url)' in final_main
assert 'applyRuntimeJsOnce(view, url);' in final_main
assert 'view.postDelayed(() -> applyRuntimeJs(view, url)' not in final_main
assert 'if (newProgress >= 5) applyRuntimeJs' not in final_main
assert 'versionCode 152' in final_gradle
assert "versionName '1.1.52'" in final_gradle
assert "applicationId 'eu.shishalove.merchant'" in final_gradle
assert 'OrderPollReceiver' in final_manifest
assert 'android:launchMode="singleTop"' in final_manifest
assert 'slm-native-layout-147' in final_activity

print('ShishaLove Merchant Android 1.1.52: one-per-document runtime injection + update-in-place identity prepared')
