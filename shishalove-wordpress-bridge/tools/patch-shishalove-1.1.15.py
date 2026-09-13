#!/usr/bin/env python3
from pathlib import Path
import base64
import hashlib
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.15.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
repo_root = tools.parent.parent

# OWNER LOCK: 1.1.14 Customer is approved and frozen. Start from it and modify
# Merchant presentation only. Customer JS/PHP behaviour must not be touched here.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.14.py'), str(root)])

merchant_path = root / 'assets' / 'merchant.js'
css_path = root / 'assets' / 'bridge.css'
merchant = merchant_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

# Use the exact owner-approved ShishaLove script artwork already locked for Customer.
# Merchant gets the same exact wordmark, presented as a dedicated Merchant lockup
# with a red MERCHANT band. Do not use CFG.logo, a site icon, Georgia fallback text,
# or the old tiny square WebView logo.
parts = sorted((repo_root / 'shishalove-branding').glob('customer-wordmark-exact-1.1.14.part*'))
if len(parts) != 6:
    raise SystemExit(f'1.1.15 patch failed: expected 6 exact wordmark parts, got {len(parts)}')
wordmark_b64 = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
wordmark_raw = base64.b64decode(wordmark_b64)
if hashlib.sha256(wordmark_raw).hexdigest() != 'a2ef59bc4a09e339246ae2e5ef77089097eb2056d833c1a163c3a481e8a7bfb9':
    raise SystemExit('1.1.15 patch failed: exact ShishaLove wordmark checksum mismatch')
wordmark_data = 'data:image/png;base64,' + wordmark_b64

needle = "var CFG=window.SHISHALOVE_BRIDGE||{};"
if needle not in merchant:
    raise SystemExit('1.1.15 patch failed: merchant config anchor missing')
merchant = merchant.replace(needle, needle + "\nvar MERCHANT_WORDMARK=" + repr(wordmark_data) + ";", 1)

old_logo = "function logo(){var mark=CFG.logo?'<img class=\"slb-brand-mark\" src=\"'+esc(CFG.logo)+'\" alt=\"ShishaLove\">':'';return '<span class=\"slb-brand-lockup\">'+mark+'<span class=\"slb-brand-word\">shishalove</span></span>'; }"
# Source currently has no space before the closing brace; handle exact canonical text.
old_logo_exact = "function logo(){var mark=CFG.logo?'<img class=\"slb-brand-mark\" src=\"'+esc(CFG.logo)+'\" alt=\"ShishaLove\">':'';return '<span class=\"slb-brand-lockup\">'+mark+'<span class=\"slb-brand-word\">shishalove</span></span>';}"
new_logo = "function logo(){return '<span class=\"slm-merchant-brand-lock\"><span class=\"slm-merchant-wordmark\"><img src=\"'+esc(MERCHANT_WORDMARK)+'\" alt=\"ShishaLove\"></span><span class=\"slm-merchant-red-band\">MERCHANT</span></span>';}"
if old_logo_exact not in merchant:
    raise SystemExit('1.1.15 patch failed: canonical Merchant logo() not found')
merchant = merchant.replace(old_logo_exact, new_logo, 1)

old_top = "function top(){return '<header class=\"slm-top\"><button data-act=\"menu\">☰</button><div class=\"slm-brand\">'+logo()+'<small>Merchant</small></div><button data-act=\"refresh\">↻</button></header>'; }"
old_top_exact = "function top(){return '<header class=\"slm-top\"><button data-act=\"menu\">☰</button><div class=\"slm-brand\">'+logo()+'<small>Merchant</small></div><button data-act=\"refresh\">↻</button></header>';}"
new_top = "function top(){return '<header class=\"slm-top\"><button data-act=\"menu\" aria-label=\"Open merchant menu\">☰</button><div class=\"slm-brand\">'+logo()+'</div><button data-act=\"refresh\" aria-label=\"Refresh\">↻</button></header>';}"
if old_top_exact not in merchant:
    raise SystemExit('1.1.15 patch failed: canonical Merchant top() not found')
merchant = merchant.replace(old_top_exact, new_top, 1)

old_login = "function login(){return '<div class=\"slm-login\"><div class=\"slm-login-card\"><div class=\"slm-login-brand\">'+logo()+'<div>MERCHANT BETA</div></div><h1>Store control<br>from your phone.</h1><p>Sign in with an authorized WordPress account to manage WooCommerce.</p><a href=\"'+esc(CFG.loginUrl)+'\">SIGN IN WITH WORDPRESS</a><div class=\"slm-footer-note\">Secure WordPress session · no separate product database</div></div></div>'; }"
old_login_exact = "function login(){return '<div class=\"slm-login\"><div class=\"slm-login-card\"><div class=\"slm-login-brand\">'+logo()+'<div>MERCHANT BETA</div></div><h1>Store control<br>from your phone.</h1><p>Sign in with an authorized WordPress account to manage WooCommerce.</p><a href=\"'+esc(CFG.loginUrl)+'\">SIGN IN WITH WORDPRESS</a><div class=\"slm-footer-note\">Secure WordPress session · no separate product database</div></div></div>'; }".replace("'; }", "';}")
if old_login_exact not in merchant:
    # Fallback to the exact text as emitted in the canonical source.
    old_login_exact = "function login(){return '<div class=\"slm-login\"><div class=\"slm-login-card\"><div class=\"slm-login-brand\">'+logo()+'<div>MERCHANT BETA</div></div><h1>Store control<br>from your phone.</h1><p>Sign in with an authorized WordPress account to manage WooCommerce.</p><a href=\"'+esc(CFG.loginUrl)+'\">SIGN IN WITH WORDPRESS</a><div class=\"slm-footer-note\">Secure WordPress session · no separate product database</div></div></div>'; }"
if old_login_exact in merchant:
    new_login = old_login_exact.replace("'+logo()+'<div>MERCHANT BETA</div>", "'+logo()+'")
    merchant = merchant.replace(old_login_exact, new_login, 1)
else:
    # Robust regex for minified/canonical spacing variants; content otherwise unchanged.
    merchant, count = re.subn(r"(function login\(\)\{return '<div class=\"slm-login\"><div class=\"slm-login-card\"><div class=\"slm-login-brand\">'\+logo\(\)\+)'<div>MERCHANT BETA</div>", r"\1'", merchant, count=1)
    if count != 1:
        raise SystemExit('1.1.15 patch failed: Merchant login brand anchor not found')

# Merchant-only visual lock. The approved Customer CSS remains untouched; these
# selectors apply only inside Merchant header/login.
css += r'''

/* ShishaLove 1.1.15 Merchant-only exact brand lock — Customer 1.1.14 frozen */
.slm-brand .slm-merchant-brand-lock{display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:center!important;width:174px!important;max-width:174px!important;background:#000!important;border-radius:9px!important;overflow:hidden!important;box-shadow:none!important}
.slm-brand .slm-merchant-wordmark{display:flex!important;align-items:center!important;justify-content:center!important;height:53px!important;background:#000!important;padding:2px 8px 0!important;overflow:hidden!important}
.slm-brand .slm-merchant-wordmark img{display:block!important;width:158px!important;height:auto!important;max-width:158px!important;max-height:51px!important;object-fit:contain!important;filter:none!important;transform:none!important;margin:0!important;background:#000!important;border:0!important;border-radius:0!important}
.slm-brand .slm-merchant-red-band{display:flex!important;align-items:center!important;justify-content:center!important;height:21px!important;background:var(--sl-red)!important;color:#fff!important;font-size:12px!important;line-height:1!important;font-weight:900!important;letter-spacing:1.6px!important}
.slm-brand>small{display:none!important}
.slm-login-brand .slm-merchant-brand-lock{display:flex!important;flex-direction:column!important;align-items:stretch!important;width:248px!important;max-width:100%!important;background:#000!important;border-radius:12px!important;overflow:hidden!important}
.slm-login-brand .slm-merchant-wordmark{display:flex!important;align-items:center!important;justify-content:center!important;height:88px!important;background:#000!important;padding:5px 12px 0!important;overflow:hidden!important}
.slm-login-brand .slm-merchant-wordmark img{display:block!important;width:224px!important;height:auto!important;max-width:224px!important;max-height:84px!important;object-fit:contain!important;filter:none!important;transform:none!important;margin:0!important;background:#000!important;border:0!important;border-radius:0!important}
.slm-login-brand .slm-merchant-red-band{display:flex!important;align-items:center!important;justify-content:center!important;height:31px!important;background:var(--sl-red)!important;color:#fff!important;font-size:16px!important;line-height:1!important;font-weight:900!important;letter-spacing:2px!important}
.slm-login-brand>div{display:none!important}
'''

merchant_path.write_text(merchant, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.15 Merchant-only exact branding applied; Customer 1.1.14 untouched')
