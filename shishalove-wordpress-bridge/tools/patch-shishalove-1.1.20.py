#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.20.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# OWNER LOCK: carry forward the fully approved 1.1.19 Customer + Merchant bridge.
# This revision changes ONLY Android WebView safe-area handling.
# No catalogue/category/sort/order/search/editor/logo/navigation/data behaviour changes.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.19.py'), str(root)])

main_path = root / 'shishalove-app-bridge.php'
main = main_path.read_text(encoding='utf-8')

anchor = "    $is_merchant = $mode === 'merchant';\n"
platform = (
    "    $is_merchant = $mode === 'merchant';\n"
    "    $platform = isset($_GET['app']) ? sanitize_key(wp_unslash($_GET['app'])) : 'web';\n"
    "    if (!in_array($platform, array('android','ios','web'), true)) { $platform = 'web'; }\n"
)
if anchor not in main:
    raise SystemExit('render-shell anchor not found')
main = main.replace(anchor, platform, 1)

old_body = '<body class="slb slb-<?php echo esc_attr($mode); ?>">'
new_body = '<body class="slb slb-<?php echo esc_attr($mode); ?> slb-platform-<?php echo esc_attr($platform); ?>">'
if old_body not in main:
    raise SystemExit('body-class anchor not found')
main = main.replace(old_body, new_body, 1)
main_path.write_text(main, encoding='utf-8')

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.20 Android WebView safe-area correction only.
   Android native wrapper already owns status/navigation bar insets.
   Do not apply env(safe-area-inset-*) a second time inside the Bridge. */
body.slb-platform-android{
  --safe-top:0px!important;
  --safe-bottom:0px!important;
}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.20: Android duplicate safe-area insets removed; 1.1.19 app UI/logic otherwise frozen')
