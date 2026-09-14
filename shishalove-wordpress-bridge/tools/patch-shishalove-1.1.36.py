#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.36.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.35.py'), str(root)])


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)

customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = replace_once(customer, "var BUILD='1.1.35';", "var BUILD='1.1.36';", 'customer build')
customer = replace_once(customer, "CFG.version='1.1.35';", "CFG.version='1.1.36';", 'customer cfg')
customer = replace_once(customer, "slbfix','1.1.35'", "slbfix','1.1.36'", 'customer css bust')
customer_path.write_text(customer, encoding='utf-8')

merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = replace_once(merchant, "CFG.version='1.1.35';", "CFG.version='1.1.36';", 'merchant cfg')
merchant = replace_once(merchant, "slbfix','1.1.35'", "slbfix','1.1.36'", 'merchant css bust')
merchant = replace_once(merchant, 'Bridge 1.1.35', 'Bridge 1.1.36', 'merchant version label')
merchant_path.write_text(merchant, encoding='utf-8')

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.36 — permanent Merchant viewport ownership.
   Browser/PWA: the bottom bar occupies its own layout row. Product/order rows
   scroll only inside the middle row, so content can never appear underneath it. */
html:not(.slb-android-app) body.slb-merchant{
  height:100dvh!important;
  min-height:100dvh!important;
  overflow:hidden!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-app{
  height:100dvh!important;
  min-height:0!important;
  padding-bottom:0!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-top{
  position:relative!important;
  top:auto!important;
  flex:0 0 auto!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-page{
  flex:1 1 auto!important;
  min-height:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  padding-bottom:28px!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-bottom{
  position:relative!important;
  inset:auto!important;
  left:auto!important;
  right:auto!important;
  top:auto!important;
  bottom:auto!important;
  transform:none!important;
  margin:0!important;
  width:100%!important;
  height:calc(76px + var(--safe-bottom))!important;
  min-height:calc(76px + var(--safe-bottom))!important;
  flex:0 0 calc(76px + var(--safe-bottom))!important;
  padding:0 0 var(--safe-bottom)!important;
  box-sizing:border-box!important;
  background:#fff!important;
  z-index:90!important;
}

/* The full-screen product editor remains independently scrollable. */
html:not(.slb-android-app) body.slb-merchant .slm-panel{
  overscroll-behavior:contain!important;
}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.36 Bridge: Merchant three-row safe viewport layout applied')
