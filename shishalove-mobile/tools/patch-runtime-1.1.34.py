#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
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
# CUSTOMER: permanent Android 15/16 viewport fix.
# Native root owns only the status-bar inset. WebView reaches the bottom edge,
# and the fixed Customer nav owns the navigation-bar inset. This removes the
# large white gap on reopen without moving any Customer business UI.
# ---------------------------------------------------------------------------
customer_activity = ROOT / 'customer/src/main/java/eu/shishalove/customer/CustomerActivityV134.java'
customer_activity.write_text(r'''package eu.shishalove.customer;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.WebView;

/** Permanent Android viewport correction for ShishaLove Customer 1.1.34. */
public class CustomerActivityV134 extends MainActivity {
    private WebView customerWebView;
    private View appRoot;
    private int bottomInsetCssPx = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setNavigationBarColor(Color.WHITE);
        }
        installViewportFix();
    }

    @Override
    protected void onResume() {
        super.onResume();
        scheduleWebFixes();
    }

    private void installViewportFix() {
        View content = findViewById(android.R.id.content);
        if (content instanceof ViewGroup && ((ViewGroup) content).getChildCount() > 0) {
            appRoot = ((ViewGroup) content).getChildAt(0);
        } else {
            appRoot = content;
        }
        customerWebView = findWebView(appRoot);

        if (Build.VERSION.SDK_INT >= 35 && appRoot != null) {
            appRoot.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                float density = getResources().getDisplayMetrics().density;
                bottomInsetCssPx = Math.max(0, Math.round(bars.bottom / Math.max(1f, density)));
                // Exactly one top safe area. No native bottom padding: the WebView/nav
                // paints through the system navigation area itself.
                v.setPadding(bars.left, bars.top, bars.right, 0);
                v.setBackgroundColor(Color.WHITE);
                scheduleWebFixes();
                return insets;
            });
            appRoot.requestApplyInsets();
        }
        scheduleWebFixes();
    }

    private WebView findWebView(View view) {
        if (view == null) return null;
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }

    private void scheduleWebFixes() {
        if (customerWebView == null) return;
        customerWebView.postDelayed(this::applyWebFix, 60);
        customerWebView.postDelayed(this::applyWebFix, 450);
        customerWebView.postDelayed(this::applyWebFix, 1400);
    }

    private void applyWebFix() {
        if (customerWebView == null) return;
        final int inset = Math.max(0, bottomInsetCssPx);
        String js = "(function(){"
                + "var inset='" + inset + "px',d=document.documentElement,b=document.body;"
                + "if(!d)return;"
                + "d.style.setProperty('--safe-top','0px','important');"
                + "d.style.setProperty('--safe-bottom',inset,'important');"
                + "d.style.setProperty('--slb-native-bottom','0px','important');"
                + "if(b){b.style.setProperty('overflow-x','hidden','important');}"
                + "var s=document.getElementById('slb-customer-native-viewport');"
                + "if(!s){s=document.createElement('style');s.id='slb-customer-native-viewport';"
                + "s.textContent='html.slb-android-app body.slb-customer .slb-bottom{bottom:0!important;height:calc(72px + var(--safe-bottom))!important;padding-bottom:var(--safe-bottom)!important;box-sizing:border-box!important;background:#fff!important}html.slb-android-app body.slb-customer .slb-app{padding-bottom:calc(76px + var(--safe-bottom))!important}html.slb-android-app body.slb-customer .slb-toast{bottom:calc(92px + var(--safe-bottom))!important}';document.head.appendChild(s);}"
                + "})();";
        customerWebView.evaluateJavascript(js, null);
    }
}
''', encoding='utf-8')

customer_manifest = ROOT / 'customer/src/main/AndroidManifest.xml'
text = customer_manifest.read_text(encoding='utf-8')
text = replace_once(text, 'android:name=".MainActivity"', 'android:name=".CustomerActivityV134"', 'customer launcher activity')
customer_manifest.write_text(text, encoding='utf-8')

customer_gradle = ROOT / 'customer/build.gradle'
text = customer_gradle.read_text(encoding='utf-8')
text = replace_once(text, "versionCode 124", "versionCode 134", 'customer versionCode')
text = replace_once(text, "versionName '1.1.22'", "versionName '1.1.34'", 'customer versionName')
text = replace_once(text,
    "'v.setPadding(bars.left, bars.top + dp(6), bars.right, Math.max(dp(10), bars.bottom - dp(28)));'",
    "'v.setPadding(bars.left, bars.top, bars.right, 0);'",
    'customer prebuild inset target')
text = text.replace("'ShishaLoveCustomer/1.1.20')", "'ShishaLoveCustomer/1.1.34')")
customer_gradle.write_text(text, encoding='utf-8')


# ---------------------------------------------------------------------------
# MERCHANT: remove the real reload regression.
# The canonical Bridge must never receive the legacy DOM-polish payload, and
# progress callbacks must not inject scripts dozens of times during one load.
# ---------------------------------------------------------------------------
merchant_main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
text = merchant_main.read_text(encoding='utf-8')
if 'CANONICAL_BRIDGE_PATH' not in text:
    text = replace_once(text,
        'private static final String SHOP_HOST = "shishalove.eu";',
        'private static final String SHOP_HOST = "shishalove.eu";\n    private static final String CANONICAL_BRIDGE_PATH = "/shishalove-merchant";',
        'merchant canonical path')

if 'private boolean isCanonicalBridge(String url)' not in text:
    anchor = '    private void configureWebView() {'
    helper = r'''    private boolean isCanonicalBridge(String url) {
        if (url == null || url.isEmpty()) return false;
        try {
            Uri uri = Uri.parse(url);
            String host = uri.getHost();
            String path = uri.getPath();
            boolean ownHost = host != null && (SHOP_HOST.equalsIgnoreCase(host) || ("www." + SHOP_HOST).equalsIgnoreCase(host));
            return ownHost && path != null && (path.equalsIgnoreCase(CANONICAL_BRIDGE_PATH) || path.equalsIgnoreCase(CANONICAL_BRIDGE_PATH + "/"));
        } catch (Exception ignored) {
            return false;
        }
    }

'''
    text = replace_once(text, anchor, helper + anchor, 'merchant canonical helper')

text = replace_once(text,
'''            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                showLastSnapshot();
                applyRuntimeJs(view);
            }''',
'''            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                showLastSnapshot();
            }''',
'merchant page started injection')
text = text.replace('applyRuntimeJs(view);', 'applyRuntimeJs(view, url);')
text = replace_once(text,
'''            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(View.GONE);
                if (newProgress >= 5) applyRuntimeJs(view, url);
            }''',
'''            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(View.GONE);
            }''',
'merchant progress injection') if 'if (newProgress >= 5) applyRuntimeJs(view, url);' in text else text
# Handle the original signature if the generic replacement did not touch progress.
text = text.replace('                if (newProgress >= 5) applyRuntimeJs(view);\n', '')

text = replace_method(text, '    private void applyRuntimeJs(', r'''    private void applyRuntimeJs(WebView view, String url) {
        // Canonical Bridge already owns its UI. The legacy DOM-polish payload is
        // intentionally skipped here; repeatedly injecting it was the reload slowdown.
        if (!isCanonicalBridge(url) && phonePolishJs != null && !phonePolishJs.isEmpty()) {
            view.evaluateJavascript(phonePolishJs, null);
        }
        if (orderWatchJs != null && !orderWatchJs.isEmpty()) {
            view.evaluateJavascript(orderWatchJs, null);
        }
    }''')
merchant_main.write_text(text, encoding='utf-8')

merchant_permanent = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
text = merchant_permanent.read_text(encoding='utf-8')
text = replace_method(text, '    private void scheduleWebFixes()', r'''    private void scheduleWebFixes() {
        if (merchantWebView == null) return;
        // Lightweight, bounded passes only. The persistent CSS below survives
        // Bridge rerenders, so no document-wide MutationObserver is necessary.
        merchantWebView.postDelayed(this::applyWebFix, 60);
        merchantWebView.postDelayed(this::applyWebFix, 500);
        merchantWebView.postDelayed(this::applyWebFix, 1500);
    }''')
text = replace_method(text, '    private void applyWebFix()', r'''    private void applyWebFix() {
        if (merchantWebView == null) return;
        final int inset = Math.max(0, bottomInsetCssPx);
        String js = "(function(){"
                + "var inset='" + inset + "px',d=document.documentElement,b=document.body;if(!d)return;"
                + "d.style.setProperty('--safe-bottom',inset,'important');"
                + "d.style.setProperty('--slb-native-bottom','0px','important');"
                + "d.style.setProperty('overflow-y','auto','important');d.style.setProperty('overflow-x','hidden','important');"
                + "if(b){b.style.setProperty('overflow-y','auto','important');b.style.setProperty('overflow-x','hidden','important');b.style.setProperty('-webkit-overflow-scrolling','touch','important');}"
                + "var s=document.getElementById('slm-native-viewport-style');"
                + "if(!s){s=document.createElement('style');s.id='slm-native-viewport-style';"
                + "s.textContent='html.slb-android-app body.slb-merchant .slm-bottom{bottom:0!important;height:calc(72px + var(--safe-bottom))!important;padding-bottom:var(--safe-bottom)!important;box-sizing:border-box!important;background:#fff!important}html.slb-android-app body.slb-merchant .slm-app{padding-bottom:calc(82px + var(--safe-bottom))!important}html.slb-android-app body.slb-merchant .slm-page{padding-bottom:calc(108px + var(--safe-bottom))!important}';document.head.appendChild(s);}"
                + "})();";
        merchantWebView.evaluateJavascript(js, null);
    }''')
if '__slmPermanentScrollGuard' in text:
    raise SystemExit('Merchant MutationObserver survived runtime patch')
merchant_permanent.write_text(text, encoding='utf-8')

merchant_gradle = ROOT / 'merchant/build.gradle'
text = merchant_gradle.read_text(encoding='utf-8')
text = replace_once(text, 'versionCode 128', 'versionCode 134', 'merchant versionCode')
text = replace_once(text, "versionName '1.1.26'", "versionName '1.1.34'", 'merchant versionName')
text = text.replace("'ShishaLoveMerchant/1.1.22')", "'ShishaLoveMerchant/1.1.34')")
merchant_gradle.write_text(text, encoding='utf-8')

print('ShishaLove Android 1.1.34 runtime patch applied: Customer viewport + Merchant reload path')
