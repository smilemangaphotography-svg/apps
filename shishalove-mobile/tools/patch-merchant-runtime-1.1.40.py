#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable, str(Path(__file__).with_name('patch-merchant-safezone-1.1.39.py'))])


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

activity = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java'
t = activity.read_text(encoding='utf-8')

# 1.1.39 over-reserved the bottom by taking tappable/gesture insets. Samsung can
# report those much larger than the actual three-button navigation bar. Use the
# true navigation/system bottom only, clamp pathological values, then add 6dp.
t = once(t,
'''                android.graphics.Insets nav = insets.getInsets(WindowInsets.Type.navigationBars());
                android.graphics.Insets tappable = insets.getInsets(WindowInsets.Type.tappableElement());
                android.graphics.Insets gestures = insets.getInsets(WindowInsets.Type.systemGestures());

                // Samsung/Android can report the navigation region through different
                // inset types. Use the largest bottom value and add a small physical
                // clearance so Merchant controls never share pixels with system buttons.
                int systemBottom = Math.max(Math.max(bars.bottom, nav.bottom),
                        Math.max(tappable.bottom, gestures.bottom));
                int safeBottom = Math.max(0, systemBottom) + dp(10);''',
'''                android.graphics.Insets nav = insets.getInsets(WindowInsets.Type.navigationBars());

                // Reserve only the real Android navigation bar. Gesture/tappable
                // insets are intentionally excluded because Samsung may report a much
                // taller region, which caused the large white dead zone in 1.1.39.
                int systemBottom = Math.max(bars.bottom, nav.bottom);
                int safeBottom = Math.min(Math.max(0, systemBottom), dp(64)) + dp(6);''',
'merchant real navigation safe bottom')

# Make exactly one element own vertical scrolling. The page flexes to the remaining
# WebView height; header and nav stay stable. #slb-root is explicitly height-locked.
t = once(t,
"html.slb-android-app body.slb-merchant{height:100%!important;min-height:0!important;overflow:hidden!important}html.slb-android-app body.slb-merchant .slm-app{height:100%!important;min-height:0!important;padding-bottom:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}html.slb-android-app body.slb-merchant .slm-top{position:relative!important;top:auto!important;flex:0 0 auto!important}html.slb-android-app body.slb-merchant .slm-page{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding-bottom:28px!important}",
"html.slb-android-app,html.slb-android-app body,html.slb-android-app #slb-root{height:100%!important;min-height:0!important;overflow:hidden!important}html.slb-android-app body.slb-merchant{height:100%!important;min-height:0!important;overflow:hidden!important}html.slb-android-app body.slb-merchant .slm-app{height:100%!important;min-height:0!important;padding-bottom:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}html.slb-android-app body.slb-merchant .slm-top{position:relative!important;top:auto!important;flex:0 0 auto!important}html.slb-android-app body.slb-merchant .slm-page{flex:1 1 0%!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;padding-bottom:28px!important}",
'merchant single scroll surface')

activity.write_text(t, encoding='utf-8')

# Version bump on the canonical Merchant package only.
gradle = ROOT / 'merchant/build.gradle'
t = gradle.read_text(encoding='utf-8')
t = once(t, 'versionCode 139', 'versionCode 140', 'merchant versionCode')
t = once(t, "versionName '1.1.39'", "versionName '1.1.40'", 'merchant versionName')
t = t.replace('ShishaLoveMerchant/1.1.39', 'ShishaLoveMerchant/1.1.40')
t = t.replace(
    "if (!permanentSource.contains('WindowInsets.Type.tappableElement()')) throw new GradleException('Merchant Samsung tappable safe-zone probe missing')",
    "if (!permanentSource.contains('Math.min(Math.max(0, systemBottom), dp(64)) + dp(6)')) throw new GradleException('Merchant bounded navigation safe zone missing')"
)
gradle.write_text(t, encoding='utf-8')

main = ROOT / 'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'
t = main.read_text(encoding='utf-8')
t = once(t, 'build=139', 'build=140', 'merchant cache bust')
t = t.replace('ShishaLoveMerchant/1.1.39', 'ShishaLoveMerchant/1.1.40')
main.write_text(t, encoding='utf-8')

final = activity.read_text(encoding='utf-8')
assert 'WindowInsets.Type.tappableElement()' not in final
assert 'WindowInsets.Type.systemGestures()' not in final
assert 'int systemBottom = Math.max(bars.bottom, nav.bottom);' in final
assert 'int safeBottom = Math.min(Math.max(0, systemBottom), dp(64)) + dp(6);' in final
assert 'html.slb-android-app #slb-root{height:100%!important' in final
assert 'flex:1 1 0%!important' in final
assert 'touch-action:pan-y!important' in final
assert 'versionCode 140' in gradle.read_text(encoding='utf-8')
assert "versionName '1.1.40'" in gradle.read_text(encoding='utf-8')
assert 'build=140' in main.read_text(encoding='utf-8')
print('ShishaLove Merchant 1.1.40: bounded bottom safe zone + single scroll owner applied')
