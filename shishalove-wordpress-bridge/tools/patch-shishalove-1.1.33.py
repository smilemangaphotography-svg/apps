#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.33.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.32.py'), str(root)])


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)

# Version/cache-bust only. No functional JS changes.
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = replace_once(customer, "var BUILD='1.1.32';", "var BUILD='1.1.33';", 'customer build')
customer = replace_once(customer, "CFG.version='1.1.32';", "CFG.version='1.1.33';", 'customer cfg')
customer = replace_once(customer, "slbfix','1.1.32'", "slbfix','1.1.33'", 'customer css bust')
customer_path.write_text(customer, encoding='utf-8')

merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = replace_once(merchant, "CFG.version='1.1.32';", "CFG.version='1.1.33';", 'merchant cfg')
merchant = replace_once(merchant, "slbfix','1.1.32'", "slbfix','1.1.33'", 'merchant css bust')
merchant = replace_once(merchant, 'Bridge 1.1.32', 'Bridge 1.1.33', 'merchant version label')
merchant_path.write_text(merchant, encoding='utf-8')

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.33 — FINAL bottom-navigation parity only.
   Customer Android matches browser/WebView labels.
   Merchant browser/WebView matches installed Android bottom bar.
   No other UI or behavior is changed. */

/* Customer: browser reference has solid-black bold labels on every tab,
   while active icon remains red. Apply that exact label treatment to Android. */
html.slb-android-app body.slb-customer .slb-bottom button{
  opacity:1!important;
  filter:none!important;
}
html.slb-android-app body.slb-customer .slb-bottom button .slb-bottom-label,
html.slb-android-app body.slb-customer .slb-bottom button.active .slb-bottom-label{
  color:#000!important;
  -webkit-text-fill-color:#000!important;
  opacity:1!important;
  filter:none!important;
  font-size:12px!important;
  font-weight:900!important;
  line-height:1.05!important;
}

/* Merchant: leave installed Android exactly untouched. Make browser/iPhone
   WebView use the installed-app bar proportions and typography. */
html:not(.slb-android-app) body.slb-merchant .slm-bottom{
  height:76px!important;
  padding-bottom:0!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-bottom button{
  font-size:13px!important;
  font-weight:900!important;
  gap:4px!important;
  opacity:1!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-bottom button i{
  font-size:22px!important;
  line-height:1!important;
}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.33: final Customer/Merchant bottom-nav parity only')
