#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-runtime-1.1.37.py'))])


def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)


def replace_between(text, start_marker, end_marker, replacement, label):
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f'{label}: start marker missing')
    end = text.find(end_marker, start)
    if end < 0:
        raise SystemExit(f'{label}: end marker missing')
    end += len(end_marker)
    return text[:start] + replacement + text[end:]


# MERCHANT ONLY: keep the approved Bridge/UI intact. Android owns the safe area.
activity = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
text = activity.read_text(encoding='utf-8')

text = once(
    text,
    '''        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setNavigationBarColor(Color.WHITE);
        }
        installPermanentViewportFix();''',
    '''        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setNavigationBarColor(Color.WHITE);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        }
        installPermanentViewportFix();''',
    'merchant edge-to-edge mode'
)

text = once(
    text,
    '''    @Override
    protected void onResume() {
        super.onResume();
        scheduleWebFixes();
    }''',
    '''    @Override
    protected void onResume() {
        super.onResume();
        refreshInsetsAndViewport();
        scheduleWebFixes();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            refreshInsetsAndViewport();
            scheduleWebFixes();
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void refreshInsetsAndViewport() {
        if (appRoot == null) return;
        appRoot.requestApplyInsets();
        appRoot.postDelayed(appRoot::requestApplyInsets, 80);
        appRoot.postDelayed(appRoot::requestApplyInsets, 280);
        if (merchantWebView != null) {
            merchantWebView.requestLayout();
            merchantWebView.invalidate();
        }
    }''',
    'merchant resume safe-area refresh'
)

start = '                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());'
end = '                return insets;'
replacement = '''                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                android.graphics.Insets nav = insets.getInsets(WindowInsets.Type.navigationBars());
                android.graphics.Insets tappable = insets.getInsets(WindowInsets.Type.tappableElement());
                android.graphics.Insets gestures = insets.getInsets(WindowInsets.Type.systemGestures());

                // Samsung/Android can report the navigation region through different
                // inset types. Use the largest bottom value and add a small physical
                // clearance so Merchant controls never share pixels with system buttons.
                int systemBottom = Math.max(Math.max(bars.bottom, nav.bottom),
                        Math.max(tappable.bottom, gestures.bottom));
                int safeBottom = Math.max(0, systemBottom) + dp(10);
                bottomInsetCssPx = 0;

                // One owner only: native root reserves top + bottom safe zones.
                // The Bridge receives zero bottom inset and its 72dp nav stays fully
                // inside the WebView, above Samsung's navigation controls.
                v.setPadding(bars.left, bars.top, bars.right, safeBottom);
                v.setBackgroundColor(Color.WHITE);
                scheduleWebFixes();
                v.post(() -> {
                    v.requestLayout();
                    if (merchantWebView != null) merchantWebView.requestLayout();
                });
                return new WindowInsets.Builder(insets)
                        .setInsets(WindowInsets.Type.systemBars(), android.graphics.Insets.NONE)
                        .build();'''
text = replace_between(text, start, end, replacement, 'merchant inset listener')
activity.write_text(text, encoding='utf-8')

# Merchant-only version bump. Customer 1.1.38 and WordPress Bridge are untouched.
gradle = ROOT / 'merchant/build.gradle'
text = gradle.read_text(encoding='utf-8')
text = once(text, 'versionCode 137', 'versionCode 139', 'merchant versionCode')
text = once(text, "versionName '1.1.37'", "versionName '1.1.39'", 'merchant versionName')
text = text.replace('ShishaLoveMerchant/1.1.37', 'ShishaLoveMerchant/1.1.39')
text = once(
    text,
    "if (!permanentSource.contains('v.setPadding(bars.left, bars.top, bars.right, bars.bottom)')) throw new GradleException('Permanent Merchant native inset ownership missing')",
    "if (!permanentSource.contains('v.setPadding(bars.left, bars.top, bars.right, safeBottom)')) throw new GradleException('Permanent Merchant safe-bottom ownership missing')\n        if (!permanentSource.contains('getWindow().setDecorFitsSystemWindows(false)')) throw new GradleException('Merchant edge-to-edge ownership missing')\n        if (!permanentSource.contains('refreshInsetsAndViewport()')) throw new GradleException('Merchant resume inset refresh missing')\n        if (!permanentSource.contains('WindowInsets.Type.tappableElement()')) throw new GradleException('Merchant Samsung tappable safe-zone probe missing')",
    'merchant Gradle safe-zone guard'
)
gradle.write_text(text, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
text = main.read_text(encoding='utf-8')
text = once(text, 'build=137', 'build=139', 'merchant cache bust')
text = text.replace('ShishaLoveMerchant/1.1.37', 'ShishaLoveMerchant/1.1.39')
main.write_text(text, encoding='utf-8')

# Regression locks for this exact screenshot issue.
final_activity = activity.read_text(encoding='utf-8')
assert 'getWindow().setDecorFitsSystemWindows(false);' in final_activity
assert 'refreshInsetsAndViewport();' in final_activity
assert 'WindowInsets.Type.navigationBars()' in final_activity
assert 'WindowInsets.Type.tappableElement()' in final_activity
assert 'WindowInsets.Type.systemGestures()' in final_activity
assert 'int safeBottom = Math.max(0, systemBottom) + dp(10);' in final_activity
assert 'v.setPadding(bars.left, bars.top, bars.right, safeBottom);' in final_activity
assert '.setInsets(WindowInsets.Type.systemBars(), android.graphics.Insets.NONE)' in final_activity
assert "--safe-bottom','0px','important'" in final_activity
assert 'versionCode 139' in gradle.read_text(encoding='utf-8')
assert "versionName '1.1.39'" in gradle.read_text(encoding='utf-8')
assert 'build=139' in main.read_text(encoding='utf-8')

print('ShishaLove Merchant 1.1.39: permanent Samsung bottom safe-zone fix applied')
