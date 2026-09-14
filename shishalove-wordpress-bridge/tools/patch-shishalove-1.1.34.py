#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.34.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.33.py'), str(root)])


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)

# Version/cache bust only; preserve all approved 1.1.33 behavior.
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = replace_once(customer, "var BUILD='1.1.33';", "var BUILD='1.1.34';", 'customer build')
customer = replace_once(customer, "CFG.version='1.1.33';", "CFG.version='1.1.34';", 'customer cfg')
customer = replace_once(customer, "slbfix','1.1.33'", "slbfix','1.1.34'", 'customer css bust')
customer_path.write_text(customer, encoding='utf-8')

merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = replace_once(merchant, "CFG.version='1.1.33';", "CFG.version='1.1.34';", 'merchant cfg')
merchant = replace_once(merchant, "slbfix','1.1.33'", "slbfix','1.1.34'", 'merchant css bust')
merchant = replace_once(merchant, 'Bridge 1.1.33', 'Bridge 1.1.34', 'merchant version label')
merchant_path.write_text(merchant, encoding='utf-8')

# Only remaining Bridge visual defect visible in the supplied Android screenshot:
# native Android select chrome clips the final letters of "Recommended order".
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.34 — Android select text parity only. */
html.slb-android-app body.slb-customer .slb-toolbar select{
  font-size:14px!important;
  padding-left:8px!important;
  padding-right:22px!important;
  text-overflow:clip!important;
}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.34 Bridge: Android Recommended-order clipping correction only')
