#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.22.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# OWNER LOCK: carry forward Bridge 1.1.21 and correct ONLY Merchant Android
# viewport/header CSS. Customer and Merchant JS/data/navigation/business logic stay frozen.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.21.py'), str(root)])

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.22 PERMANENT Merchant Android header + scroll correction.
   Supersedes the 1.1.21 Merchant Android viewport overrides. */
html:has(body.slb-merchant.slb-platform-android),
body.slb-merchant.slb-platform-android{
  height:auto!important;
  min-height:100%!important;
  overflow-x:hidden!important;
  overflow-y:scroll!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-y:auto!important;
  touch-action:pan-y!important;
}
body.slb-merchant.slb-platform-android #slb-root,
body.slb-merchant.slb-platform-android .slm-app{
  position:relative!important;
  height:auto!important;
  min-height:calc(100dvh + 1px)!important;
  overflow:visible!important;
  touch-action:pan-y!important;
}

/* Compact real header row. 1.1.21 incorrectly made this 104px and moved the
   brand DOWN. Keep hamburger + refresh on their normal row and lift the
   Merchant brand so the red MERCHANT band sits on the controls' visual axis. */
body.slb-merchant.slb-platform-android .slm-top{
  height:88px!important;
  min-height:88px!important;
  padding:0 22px!important;
  align-items:center!important;
  overflow:visible!important;
}
body.slb-merchant.slb-platform-android .slm-top>button{
  align-self:center!important;
  margin:0!important;
  transform:none!important;
}
body.slb-merchant.slb-platform-android .slm-brand-owner{
  height:74px!important;
  min-height:74px!important;
  margin:0!important;
  transform:translateY(-20px)!important;
  align-self:center!important;
  z-index:2!important;
}

/* Make long Merchant pages genuinely scrollable. The fixed bottom nav does not
   own document height, so reserve enough content clearance above it. */
body.slb-merchant.slb-platform-android .slm-page{
  position:relative!important;
  height:auto!important;
  min-height:calc(100dvh - 88px)!important;
  padding-bottom:150px!important;
  overflow:visible!important;
  touch-action:pan-y!important;
}
body.slb-merchant.slb-platform-android #slm-orders,
body.slb-merchant.slb-platform-android #slm-product-list,
body.slb-merchant.slb-platform-android .slm-order,
body.slb-merchant.slb-platform-android .slm-product-row{
  touch-action:pan-y!important;
}
body.slb-merchant.slb-platform-android .slm-bottom{
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  z-index:100!important;
}
'''
css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.22: Merchant brand lifted into compact header row; document scrolling permanently restored')
