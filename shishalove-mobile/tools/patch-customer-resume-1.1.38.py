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


activity = ROOT / 'customer/src/main/java/eu/shishalove/customer/CustomerActivityV134.java'
text = activity.read_text(encoding='utf-8')

# Keep edge-to-edge mode stable across cold launch, task-switch resume and focus regain.
text = once(
    text,
    '''        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setNavigationBarColor(Color.WHITE);
        }
        installViewportFix();''',
    '''        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setNavigationBarColor(Color.WHITE);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        }
        installViewportFix();''',
    'customer stable edge-to-edge mode'
)

# On resume, force a fresh inset pass instead of reusing Samsung/WebView's stale viewport.
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

    private void refreshInsetsAndViewport() {
        if (appRoot == null) return;
        appRoot.requestApplyInsets();
        appRoot.postDelayed(appRoot::requestApplyInsets, 80);
        appRoot.postDelayed(appRoot::requestApplyInsets, 280);
        if (customerWebView != null) {
            customerWebView.requestLayout();
            customerWebView.invalidate();
        }
    }''',
    'customer resume refresh'
)

# Root owns system-bar space once. Do not pass those same insets to WebView again.
text = once(
    text,
    '''                scheduleWebFixes();
                return insets;''',
    '''                scheduleWebFixes();
                v.post(() -> {
                    v.requestLayout();
                    if (customerWebView != null) customerWebView.requestLayout();
                });
                return new WindowInsets.Builder(insets)
                        .setInsets(WindowInsets.Type.systemBars(), android.graphics.Insets.NONE)
                        .build();''',
    'customer consume system bars'
)

activity.write_text(text, encoding='utf-8')

# Customer-only version bump. Bridge stays at 1.1.37 and Merchant is untouched.
gradle = ROOT / 'customer/build.gradle'
text = gradle.read_text(encoding='utf-8')
text = once(text, 'versionCode 137', 'versionCode 138', 'customer versionCode')
text = once(text, "versionName '1.1.37'", "versionName '1.1.38'", 'customer versionName')
text = text.replace('ShishaLoveCustomer/1.1.37', 'ShishaLoveCustomer/1.1.38')
gradle.write_text(text, encoding='utf-8')

# Regression locks for this exact issue.
final_activity = activity.read_text(encoding='utf-8')
assert 'getWindow().setDecorFitsSystemWindows(false);' in final_activity
assert 'refreshInsetsAndViewport();' in final_activity
assert 'appRoot.postDelayed(appRoot::requestApplyInsets, 280);' in final_activity
assert '.setInsets(WindowInsets.Type.systemBars(), android.graphics.Insets.NONE)' in final_activity
assert 'v.setPadding(bars.left, bars.top, bars.right, bars.bottom);' in final_activity
assert "bottomInsetCssPx = 0;" in final_activity
assert 'versionCode 138' in gradle.read_text(encoding='utf-8')
assert "versionName '1.1.38'" in gradle.read_text(encoding='utf-8')

print('ShishaLove Customer 1.1.38: resume/reopen viewport stale-inset fix applied')
