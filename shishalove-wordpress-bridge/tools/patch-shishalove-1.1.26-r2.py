#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.26-r2.py <plugin-dir>')

here = Path(__file__).resolve().parent
original = here / 'patch-shishalove-1.1.26.py'
src = original.read_text(encoding='utf-8')

old_nav = r'''merchant = replace_once(
    merchant,
    "function navigate(view){var changed=view!==state.view;if(changed&&(view==='products'||view==='stock')){state.query='';state.categoryId=0;state.stockStatus='all';state.searchPools[view]=null;}state.view=view;state.page=1;hydrateViewFromCache(view);render();if(view==='products')loadProducts(false,false);if(view==='stock')loadProducts(true,false);if(view==='orders')loadOrders(false);}",
    "function navigate(view){var changed=view!==state.view;if(changed&&(view==='products'||view==='stock')){state.query='';state.categoryId=0;state.stockStatus='all';state.searchPools[view]=null;}state.view=view;state.page=1;hydrateViewFromCache(view);render();if(view==='products')loadProducts(false,false);if(view==='stock')loadProducts(true,false);if(view==='orders')loadOrders(false);if(view==='media-library')loadMediaManager(false);}",
    'merchant navigate media library view'
)
'''
new_nav = r'''nav_start = merchant.find("function navigate(view){")
nav_end = merchant.find("function refresh(){", nav_start)
if nav_start < 0 or nav_end < 0:
    raise SystemExit('merchant navigate function range not found')
nav_block = merchant[nav_start:nav_end]
if "loadMediaManager(false)" not in nav_block:
    close = nav_block.rfind('}')
    if close < 0:
        raise SystemExit('merchant navigate close not found')
    nav_block = nav_block[:close] + "if(view==='media-library')loadMediaManager(false);" + nav_block[close:]
merchant = merchant[:nav_start] + nav_block + merchant[nav_end:]
'''

old_refresh = r'''merchant = replace_once(
    merchant,
    "function refresh(){if(state.view==='products')loadProducts(false,true);else if(state.view==='stock')loadProducts(true,true);else if(state.view==='orders')loadOrders(true);else bootstrap(true);}",
    "function refresh(){if(state.view==='products')loadProducts(false,true);else if(state.view==='stock')loadProducts(true,true);else if(state.view==='orders')loadOrders(true);else if(state.view==='media-library')loadMediaManager(true);else bootstrap(true);}",
    'merchant refresh media library view'
)
'''
new_refresh = r'''if "function refresh(){" not in merchant:
    raise SystemExit('merchant refresh function not found')
merchant = merchant.replace("function refresh(){", "function refresh(){if(state.view==='media-library'){loadMediaManager(true);return;}", 1)
'''

if old_nav not in src:
    raise SystemExit('1.1.26 navigate patch source anchor missing')
if old_refresh not in src:
    raise SystemExit('1.1.26 refresh patch source anchor missing')
src = src.replace(old_nav, new_nav, 1).replace(old_refresh, new_refresh, 1)

# Execute the corrected 1.1.26 patch with __file__ pointing at the original so
# relative patch-chain paths remain canonical.
ns = {'__name__': '__main__', '__file__': str(original)}
exec(compile(src, str(original), 'exec'), ns, ns)
