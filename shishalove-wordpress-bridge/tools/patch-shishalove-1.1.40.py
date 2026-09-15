#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.40.py <plugin-dir>')
root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.37.py'), str(root)])


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

p = root / 'assets/merchant.js'
t = p.read_text(encoding='utf-8')

# Merchant 1.1.40: preserve visible data while refreshing and accept stale cache
# immediately on app reopen. Network calls still revalidate in the background.
t = once(t, "CFG.version='1.1.37';", "CFG.version='1.1.40';", 'merchant cfg')
t = once(t, "slbfix','1.1.37'", "slbfix','1.1.40'", 'merchant bust')
t = once(t, 'Bridge 1.1.37', 'Bridge 1.1.40', 'merchant label')

old_hydrate = "function hydrateViewFromCache(view){if(view==='products'){state.productsByView.products=cget(productCacheKey(false),30*60*1000)||state.productsByView.products;}else if(view==='stock'){state.productsByView.stock=cget(productCacheKey(true),30*60*1000)||state.productsByView.stock;}else if(view==='orders'){state.orders=cget(ordersKey(),15*60*1000)||state.orders;}}"
new_hydrate = "function hydrateViewFromCache(view){if(view==='products'){state.productsByView.products=cget(productCacheKey(false),0)||state.productsByView.products;}else if(view==='stock'){state.productsByView.stock=cget(productCacheKey(true),0)||state.productsByView.stock;}else if(view==='orders'){state.orders=cget(ordersKey(),0)||state.orders;}}"
t = once(t, old_hydrate, new_hydrate, 'merchant stale cache hydration')

# All remaining per-view cache lookups become stale-while-revalidate reads.
t = t.replace("cget(productCacheKey(stock),30*60*1000)", "cget(productCacheKey(stock),0)")
t = t.replace("cget(ordersKey(),15*60*1000)", "cget(ordersKey(),0)")

old_bootstrap = "function bootstrap(force){var key=vkey('slm-bootstrap'),cached=cget(key,60*60*1000);if(cached&&!force){state.bootstrap=cached;CFG.restNonce=cached.nonce||CFG.restNonce;hydrateViewFromCache('products');render();loadProducts(false,false);setTimeout(prefetchMediaManager,0);}api('merchant/bootstrap').then(function(d){state.bootstrap=d;cset(key,d);CFG.restNonce=d.nonce||CFG.restNonce;hydrateViewFromCache(state.view);render();if(state.view==='products')loadProducts(false,false);else if(state.view==='stock')loadProducts(true,false);else if(state.view==='orders')loadOrders(false);setTimeout(prefetchMediaManager,0);}).catch(function(){if(!state.bootstrap)render();});}"
new_bootstrap = "function bootstrap(force){var key=vkey('slm-bootstrap'),cached=cget(key,0);if(cached){state.bootstrap=cached;CFG.restNonce=cached.nonce||CFG.restNonce;hydrateViewFromCache(state.view);render();if(state.view==='products')loadProducts(false,false);else if(state.view==='stock')loadProducts(true,false);else if(state.view==='orders')loadOrders(false);if(state.view!=='orders')loadOrders(false);setTimeout(prefetchMediaManager,0);}api('merchant/bootstrap').then(function(d){state.bootstrap=d;cset(key,d);CFG.restNonce=d.nonce||CFG.restNonce;hydrateViewFromCache(state.view);render();if(state.view==='products')loadProducts(false,false);else if(state.view==='stock')loadProducts(true,false);else if(state.view==='orders')loadOrders(false);if(!cached&&state.view!=='orders')loadOrders(false);setTimeout(prefetchMediaManager,0);}).catch(function(){if(!state.bootstrap)render();});}"
t = once(t, old_bootstrap, new_bootstrap, 'merchant instant bootstrap/prefetch')

# Existing 1.1.26 Refresh is already non-destructive and includes Media Library.
expected_refresh = "function refresh(){if(state.view==='products')loadProducts(false,true);else if(state.view==='stock')loadProducts(true,true);else if(state.view==='orders')loadOrders(true);else if(state.view==='media-library')loadMediaManager(true);else bootstrap(true);}"
if expected_refresh not in t:
    raise SystemExit('merchant nonblanking refresh invariant missing')

p.write_text(t, encoding='utf-8')

# Runtime assertions for the exact regressions seen on device.
final = p.read_text(encoding='utf-8')
assert "CFG.version='1.1.40'" in final
assert "cget(productCacheKey(stock),0)" in final
assert "cget(ordersKey(),0)" in final
assert "state.productsByView[state.view==='stock'?'stock':'products']=null" not in final
assert "if(state.view!=='orders')loadOrders(false);" in final
assert 'setTimeout(prefetchMediaManager,0);' in final
assert expected_refresh in final
print('ShishaLove Bridge 1.1.40: Merchant instant stale-while-revalidate + orders prefetch applied')
