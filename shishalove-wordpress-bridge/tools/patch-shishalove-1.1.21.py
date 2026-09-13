#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.21.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# OWNER LOCK: carry forward Bridge 1.1.20 and change Merchant Android viewport CSS only.
# No Customer code, Merchant JS/data/navigation/order/product/editor behaviour changes.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.20.py'), str(root)])

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.21 Merchant Android viewport correction only.
   The native Android wrapper already places the WebView below the system status bar.
   Give the Merchant header a deliberate internal breathing zone and explicitly restore
   vertical panning/scrolling for long Orders/Products/Stock pages. */
body.slb-merchant.slb-platform-android{
  overflow-x:hidden!important;
  overflow-y:auto!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-y:auto!important;
  touch-action:pan-y!important;
}
body.slb-merchant.slb-platform-android #slb-root,
body.slb-merchant.slb-platform-android .slm-app{
  height:auto!important;
  min-height:100dvh!important;
  overflow:visible!important;
  touch-action:pan-y!important;
}
body.slb-merchant.slb-platform-android .slm-top{
  height:104px!important;
  padding:12px 22px 0!important;
  align-items:center!important;
}
body.slb-merchant.slb-platform-android .slm-brand-owner{
  height:80px!important;
  transform:translateY(2px)!important;
}
body.slb-merchant.slb-platform-android .slm-page{
  min-height:auto!important;
  padding-bottom:96px!important;
  overflow:visible!important;
  touch-action:pan-y!important;
}
body.slb-merchant.slb-platform-android #slm-orders,
body.slb-merchant.slb-platform-android .slm-order,
body.slb-merchant.slb-platform-android #slm-product-list{
  overflow:visible!important;
  touch-action:pan-y!important;
}
body.slb-merchant.slb-platform-android .slm-bottom{
  bottom:0!important;
}
'''
css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.21: Merchant Android header spacing + vertical scrolling restored; app logic untouched')
