#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.23.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# OWNER LOCK: carry forward Bridge 1.1.22 and change ONLY Merchant Android
# header-logo sizing/alignment CSS. Customer + Merchant JS/data/navigation/business
# logic and the approved red-band Merchant artwork remain frozen.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.22.py'), str(root)])

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.23 PERMANENT Merchant header-logo size/alignment lock.
   Supersedes the 1.1.22 -20px lift that clipped the top of the artwork.
   The brand is now smaller and centered on the same visual axis as hamburger/refresh. */
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
  height:66px!important;
  min-height:66px!important;
  margin:0!important;
  transform:none!important;
  align-self:center!important;
  z-index:2!important;
}
body.slb-merchant.slb-platform-android .slm-brand-owner .slm-merchant-brand-lock{
  width:156px!important;
  max-width:156px!important;
  border-radius:8px!important;
}
body.slb-merchant.slb-platform-android .slm-brand-owner .slm-merchant-wordmark{
  height:46px!important;
  padding:2px 7px 0!important;
}
body.slb-merchant.slb-platform-android .slm-brand-owner .slm-merchant-wordmark img{
  width:142px!important;
  max-width:142px!important;
  max-height:44px!important;
}
body.slb-merchant.slb-platform-android .slm-brand-owner .slm-merchant-red-band{
  height:19px!important;
  font-size:11px!important;
  letter-spacing:1.5px!important;
}
'''
css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.23: Merchant header logo reduced and centered; top clipping removed; all logic/artwork frozen')
