#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.50.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
bridge_root = tools.parent

# Preserve every approved production fix through 1.1.49 first.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.49.py'), str(root)])

# ROOT CAUSE FIX:
# The approved Beta did not use the canonical patched merchant.js at all.
# It used merchant-generated.js + the staging product/order routes.
# Promote that exact tested runtime into production instead of approximating it
# with more incremental patches.
approved_js = bridge_root / 'runtime' / 'merchant-approved-beta-1.1.50.js'
approved_routes = bridge_root / 'runtime' / 'merchant-approved-beta-routes-1.1.50.php.inc'
if not approved_js.exists():
    raise SystemExit('approved Beta runtime snapshot missing')
if not approved_routes.exists():
    raise SystemExit('approved Beta REST route snapshot missing')

merchant = root / 'assets' / 'merchant.js'
merchant.write_text(approved_js.read_text(encoding='utf-8'), encoding='utf-8')

php_path = root / 'shishalove-app-bridge.php'
php = php_path.read_text(encoding='utf-8')
routes = approved_routes.read_text(encoding='utf-8').strip() + '\n\n'
anchor = 'function slb_render_shell($mode) {'
if anchor not in php:
    raise SystemExit('render shell anchor missing')
if 'shishalove-production/v1' in php:
    raise SystemExit('production Beta mirror routes already present unexpectedly')
php = php.replace(anchor, routes + anchor, 1)
php_path.write_text(php, encoding='utf-8')

final_js = merchant.read_text(encoding='utf-8')
final_php = php_path.read_text(encoding='utf-8')
customer = (root / 'assets' / 'customer.js').read_text(encoding='utf-8')

# Exact-Beta runtime lock.
assert "CFG.version='1.1.50';" in final_js
assert "var MERCHANT_STAGING_REST=location.origin+'/wp-json/shishalove-production/v1/';" in final_js
assert "var DATA_CACHE='production-beta-lock-v1';" in final_js
assert "function api(path,opts)" in final_js
assert "function dashboardBody()" in final_js
assert "function navigate(view)" in final_js
assert "root.querySelectorAll('[data-view]')" in final_js
assert "function loadOrders(force,allowNotify)" in final_js
assert "api('merchant/orders?page=1&per_page=20&_slm_fresh='+Date.now()" in final_js
assert "Bridge 1.1.50" in final_js

# Exact staging-proven REST mirror lock.
assert "function slb_prod_beta_merchant_products($request)" in final_php
assert "function slb_prod_beta_merchant_orders($request)" in final_php
assert "shishalove-production/v1" in final_php
assert "'/merchant/products'" in final_php
assert "'/merchant/orders'" in final_php

# Customer remains frozen.
assert "var BUILD='1.1.45';" in customer
assert "function frontPageMarkup()" in customer

print('ShishaLove Bridge 1.1.50: exact approved Beta Merchant runtime promoted to production; Customer 1.1.45 preserved')
