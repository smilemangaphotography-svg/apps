#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.13.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
repo_root = tools.parent.parent

# Start from the live-tested 1.1.12 bridge, then apply only the two
# owner-confirmed corrections from the latest web-view screenshots.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.12.py'), str(root)])

js_path = root / 'assets' / 'customer.js'
css_path = root / 'assets' / 'bridge.css'
php_path = root / 'shishalove-app-bridge.php'

js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
php = php_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'1.1.13 patch failed: {label}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label):
    out, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'1.1.13 patch failed: {label} ({count})')
    return out


# New runtime/cache namespace so no 1.1.12 catalogue/logo cache survives.
js = replace_once(js, "var BUILD='1.1.12';", "var BUILD='1.1.13';", 'customer build key')

# OWNER LOGO LOCK
# Use the exact uploaded third-image artwork (black field + white ShishaLove + red heart),
# stored as a repository source asset. Do not fall back to launcher artwork or site icon.
logo_b64 = (repo_root / 'shishalove-branding' / 'customer-drawer-logo-1.1.13.b64').read_text(encoding='utf-8').strip()
logo_data = 'data:image/png;base64,' + logo_b64
js = sub_once(
    js,
    r"var CUSTOMER_DRAWER_LOGO='data:image/png;base64,[^']+';",
    "var CUSTOMER_DRAWER_LOGO=" + repr(logo_data) + ";",
    'exact owner drawer logo data'
)
js = replace_once(
    js,
    '<div class="slb-drawer-logo slb-drawer-logo-final"><span class="slb-drawer-logo-crop"><img class="slb-drawer-owner-logo" src="\'+esc(CUSTOMER_DRAWER_LOGO)+\'" alt="ShishaLove"></span></div>',
    '<div class="slb-drawer-logo slb-drawer-logo-final"><img class="slb-drawer-owner-logo" src="\'+esc(CUSTOMER_DRAWER_LOGO)+\'" alt="ShishaLove"></div>',
    'exact owner logo markup'
)

# HOOKAH CATALOGUE LOCK
# These four terms are not Hookah brands in the ShishaLove storefront and must remain
# in their original WooCommerce catalogues. We exclude them only from the Hookah brand
# collection; no categories/products are deleted or moved in WooCommerce.
php = replace_once(
    php,
    "        'Silicone','Merchandise','Laser Engravable Products','Mega Deals','Uncategorized',\n        'XMAS OFFERS','LOVE & HOOKAH BUNDLES','Hookah'",
    "        'Silicone','Merchandise','Laser Engravable Products','Mega Deals','Uncategorized',\n        'XMAS OFFERS','LOVE & HOOKAH BUNDLES','Hookah','KRAKEN','FRNKN STEIN','Shishalove','Wind Cover'",
    'exclude non-brand Hookah terms'
)
php = replace_once(
    php,
    "        'BATR','Pushka','DSH','Tempus','Retrofit','First','KRAKEN','FRNKN STEIN','Octopuz','Shishalove'",
    "        'BATR','Pushka','DSH','Tempus','Retrofit','First','Octopuz'",
    'remove non-brands from retained preferred list'
)

# Exact wide logo presentation: preserve the black around the supplied artwork.
css += r'''

/* ShishaLove 1.1.13 exact owner drawer logo lock */
.slb-drawer-logo-final{width:270px!important;height:118px!important;overflow:visible!important;background:#000!important;border:0!important;border-radius:0!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;padding:0!important}
.slb-drawer-logo-final .slb-drawer-owner-logo{position:static!important;display:block!important;width:270px!important;height:auto!important;max-width:270px!important;transform:none!important;object-fit:contain!important;background:#000!important;border-radius:0!important;margin:0!important}
.slb-drawer-logo-crop{display:contents!important}
'''

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
php_path.write_text(php, encoding='utf-8')

print('ShishaLove 1.1.13 owner logo and Hookah catalogue corrections applied')
