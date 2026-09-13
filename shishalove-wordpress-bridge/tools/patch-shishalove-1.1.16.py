#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.16.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# OWNER LOCK: start from approved Merchant 1.1.15 / Customer 1.1.14.
# This revision changes ONLY the Merchant side-menu logo size.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.15.py'), str(root)])

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')

css += r'''

/* ShishaLove 1.1.16 Merchant side-menu logo size only — all behaviour frozen */
.slm-menu-logo{display:flex!important;align-items:center!important;justify-content:flex-start!important;min-height:82px!important;overflow:visible!important}
.slm-menu-logo .slm-merchant-brand-lock{display:inline-flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-start!important;width:142px!important;max-width:142px!important;overflow:hidden!important;background:#000!important;transform:none!important;margin:0!important}
.slm-menu-logo .slm-merchant-wordmark{display:block!important;width:142px!important;max-width:142px!important;height:auto!important;overflow:hidden!important;background:#000!important;padding:0!important;margin:0!important}
.slm-menu-logo .slm-merchant-wordmark img{display:block!important;width:142px!important;max-width:142px!important;height:auto!important;max-height:none!important;object-fit:contain!important;filter:none!important;transform:none!important;margin:0!important;padding:0!important;background:#000!important}
.slm-menu-logo .slm-merchant-red-band{max-width:142px!important}
'''

css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.16 Merchant side-menu logo reduced to compact 142px; all other code untouched')
