#!/usr/bin/env python3
from pathlib import Path
import hashlib
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.14.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
repo_root = tools.parent.parent

# Preserve every approved 1.1.13 behaviour, then correct only the Customer drawer wordmark.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.13.py'), str(root)])

js_path = root / 'assets' / 'customer.js'
css_path = root / 'assets' / 'bridge.css'
js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

parts = sorted((repo_root / 'shishalove-branding').glob('customer-wordmark-exact-1.1.14.part*'))
if len(parts) != 6:
    raise SystemExit(f'1.1.14 patch failed: expected 6 exact wordmark parts, got {len(parts)}')
logo_b64 = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
import base64
logo_raw = base64.b64decode(logo_b64)
if hashlib.sha256(logo_raw).hexdigest() != 'a2ef59bc4a09e339246ae2e5ef77089097eb2056d833c1a163c3a481e8a7bfb9':
    raise SystemExit('1.1.14 patch failed: exact wordmark checksum mismatch')
logo_data = 'data:image/png;base64,' + logo_b64

js = js.replace("var BUILD='1.1.13';", "var BUILD='1.1.14';", 1)
js, count = re.subn(
    r"var CUSTOMER_DRAWER_LOGO='https://shishalove\.eu/wp-content/uploads/2023/08/Shishalove-Transparent-Logo-01-min-1024x456\.png';",
    "var CUSTOMER_DRAWER_LOGO=" + repr(logo_data) + ";",
    js,
    count=1,
)
if count != 1:
    raise SystemExit('1.1.14 patch failed: current website-logo source not found')

old_markup = '<div class="slb-drawer-logo slb-drawer-logo-final"><span class="slb-drawer-art"><img class="slb-drawer-logo-white" src="\'+esc(CUSTOMER_DRAWER_LOGO)+\'" alt="ShishaLove"><img class="slb-drawer-logo-red" src="\'+esc(CUSTOMER_DRAWER_LOGO)+\'" alt="" aria-hidden="true"></span></div>'
new_markup = '<div class="slb-drawer-logo slb-drawer-logo-final"><img class="slb-drawer-owner-logo-exact" src="\'+esc(CUSTOMER_DRAWER_LOGO)+\'" alt="ShishaLove"></div>'
if old_markup not in js:
    raise SystemExit('1.1.14 patch failed: layered 1.1.13 logo markup not found')
js = js.replace(old_markup, new_markup, 1)

# Hard override: use the supplied artwork itself. No font recreation, no website-logo
# substitution, no filters, no recolouring, no clipping. Black surrounding field stays intact.
css += r'''

/* ShishaLove 1.1.14 exact supplied wordmark lock */
.slb-drawer-logo-final{width:300px!important;height:132px!important;overflow:visible!important;background:#000!important;border:0!important;border-radius:0!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;padding:0!important}
.slb-drawer-logo-final .slb-drawer-owner-logo-exact{position:static!important;display:block!important;width:300px!important;height:auto!important;max-width:300px!important;object-fit:contain!important;filter:none!important;clip-path:none!important;transform:none!important;background:#000!important;border:0!important;border-radius:0!important;margin:0!important}
.slb-drawer-art,.slb-drawer-logo-white,.slb-drawer-logo-red{display:none!important}
'''

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.14 exact supplied Customer wordmark applied')
