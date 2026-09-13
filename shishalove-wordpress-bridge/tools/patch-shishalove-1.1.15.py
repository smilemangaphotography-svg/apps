#!/usr/bin/env python3
from pathlib import Path
import base64
import hashlib
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.15.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
repo_root = tools.parent.parent

# OWNER LOCK: start from approved 1.1.14 and change Merchant branding only.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.14.py'), str(root)])

merchant_path = root / 'assets' / 'merchant.js'
css_path = root / 'assets' / 'bridge.css'
merchant = merchant_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

# Reuse the exact approved ShishaLove script artwork from Customer 1.1.14.
parts = sorted((repo_root / 'shishalove-branding').glob('customer-wordmark-exact-1.1.14.part*'))
if len(parts) != 6:
    raise SystemExit(f'1.1.15 patch failed: expected 6 exact wordmark parts, got {len(parts)}')
wordmark_b64 = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
wordmark_raw = base64.b64decode(wordmark_b64)
if hashlib.sha256(wordmark_raw).hexdigest() != 'a2ef59bc4a09e339246ae2e5ef77089097eb2056d833c1a163c3a481e8a7bfb9':
    raise SystemExit('1.1.15 patch failed: exact ShishaLove wordmark checksum mismatch')
wordmark_data = 'data:image/png;base64,' + wordmark_b64

cfg_anchor = "var CFG=window.SHISHALOVE_BRIDGE||{};"
if cfg_anchor not in merchant:
    raise SystemExit('1.1.15 patch failed: Merchant config anchor missing')
merchant = merchant.replace(cfg_anchor, cfg_anchor + "\nvar MERCHANT_WORDMARK=" + repr(wordmark_data) + ";", 1)

# 1.1.10 already routes both Merchant header and Merchant login through this helper.
# Replace only that helper: no Merchant navigation/order/product behaviour changes.
old_helper = "function merchantOwnerLogo(){return '<img class=\"slm-owner-logo\" src=\"'+esc(MERCHANT_BRAND_LOGO)+'\" alt=\"ShishaLove Merchant\">';}"
new_helper = "function merchantOwnerLogo(){return '<span class=\"slm-merchant-brand-lock\"><span class=\"slm-merchant-wordmark\"><img src=\"'+esc(MERCHANT_WORDMARK)+'\" alt=\"ShishaLove\"></span><span class=\"slm-merchant-red-band\">MERCHANT</span></span>'; }".replace("'; }", "';}")
if old_helper not in merchant:
    raise SystemExit('1.1.15 patch failed: existing Merchant owner-logo helper not found')
merchant = merchant.replace(old_helper, new_helper, 1)

# Merchant-only visual override. Customer selectors are not changed.
css += r'''

/* ShishaLove 1.1.15 Merchant-only exact brand lock — Customer 1.1.14 frozen */
.slm-brand-owner{height:74px!important;display:flex!important;align-items:center!important;justify-content:center!important}
.slm-brand-owner .slm-merchant-brand-lock{display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:center!important;width:176px!important;max-width:176px!important;background:#000!important;border-radius:9px!important;overflow:hidden!important}
.slm-brand-owner .slm-merchant-wordmark{display:flex!important;align-items:center!important;justify-content:center!important;height:52px!important;background:#000!important;padding:2px 8px 0!important;overflow:hidden!important}
.slm-brand-owner .slm-merchant-wordmark img{display:block!important;width:160px!important;height:auto!important;max-width:160px!important;max-height:50px!important;object-fit:contain!important;filter:none!important;transform:none!important;background:#000!important;border:0!important;border-radius:0!important;margin:0!important}
.slm-brand-owner .slm-merchant-red-band{display:flex!important;align-items:center!important;justify-content:center!important;height:22px!important;background:var(--sl-red)!important;color:#fff!important;font-size:12px!important;line-height:1!important;font-weight:900!important;letter-spacing:1.7px!important}
.slm-login-owner{display:flex!important;align-items:center!important;justify-content:center!important}
.slm-login-owner .slm-merchant-brand-lock{display:flex!important;flex-direction:column!important;align-items:stretch!important;width:250px!important;max-width:100%!important;background:#000!important;border-radius:12px!important;overflow:hidden!important;margin:0 auto 8px!important}
.slm-login-owner .slm-merchant-wordmark{display:flex!important;align-items:center!important;justify-content:center!important;height:88px!important;background:#000!important;padding:5px 12px 0!important;overflow:hidden!important}
.slm-login-owner .slm-merchant-wordmark img{display:block!important;width:226px!important;height:auto!important;max-width:226px!important;max-height:84px!important;object-fit:contain!important;filter:none!important;transform:none!important;background:#000!important;border:0!important;border-radius:0!important;margin:0!important}
.slm-login-owner .slm-merchant-red-band{display:flex!important;align-items:center!important;justify-content:center!important;height:32px!important;background:var(--sl-red)!important;color:#fff!important;font-size:16px!important;line-height:1!important;font-weight:900!important;letter-spacing:2px!important}
.slm-brand-owner .slm-owner-logo,.slm-login-owner .slm-owner-logo{display:none!important}
'''

merchant_path.write_text(merchant, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.15 Merchant-only exact branding applied; Customer 1.1.14 untouched')
