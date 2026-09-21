#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-merchant-masterfix-staging.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parents[1] / 'shishalove-wordpress-bridge' / 'tools'
# When executed from the repository staging helper, fall back to the canonical tools path.
if not tools.exists():
    tools = Path(__file__).resolve().parents[1] / 'tools'
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.43.py'), str(root)])


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)


def replace_func(text, name, replacement):
    marker = 'function ' + name + '('
    s = text.find(marker)
    if s < 0:
        raise SystemExit('missing function ' + name)
    m = re.search(r'\nfunction\s+[A-Za-z0-9_]+\(', text[s + 1:])
    if not m:
        raise SystemExit('next function missing after ' + name)
    e = s + 1 + m.start() + 1
    return text[:s] + replacement.rstrip() + '\n' + text[e:]


# -----------------------------------------------------------------------------
# MERCHANT JS — live partial search + fresh order synchronization.
# No visual redesign. Existing layout, editor workflow, filters and safe-area logic
# stay frozen.
# -----------------------------------------------------------------------------
p = root / 'assets' / 'merchant.js'
t = p.read_text(encoding='utf-8')

# Isolated staging identity prevents old Merchant cache entries from being reused
# while this fix is tested.
t = once(t, "CFG.version='1.1.43';", "CFG.version='staging-merchant-sync-search-1';", 'staging merchant identity')

# Authenticated Merchant GETs must not be satisfied from WebView/browser cache.
old_api = "function api(path,opts){opts=opts||{};var h=opts.headers||{};if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;if(opts.body&&!h['Content-Type'])h['Content-Type']='application/json';opts.headers=h;opts.credentials='same-origin';return fetch(CFG.rest+path,opts).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}"
new_api = "function api(path,opts){opts=opts||{};var h=opts.headers||{};if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;if(opts.body&&!h['Content-Type'])h['Content-Type']='application/json';opts.headers=h;opts.credentials='same-origin';if(!opts.method||String(opts.method).toUpperCase()==='GET')opts.cache='no-store';return fetch(CFG.rest+path,opts).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}"
t = once(t, old_api, new_api, 'merchant no-store api')

# Search results return directly from the server's new partial index. This removes
# the old multi-page fan-out and makes short queries such as "moz" responsive.
search_helpers = r'''var merchantSearchRequest=0;
function renderKeepingProductSearchFocus(){
  var old=document.getElementById('slm-product-search'),focused=!!(old&&document.activeElement===old),pos=old&&typeof old.selectionStart==='number'?old.selectionStart:null;
  render();
  if(focused){
    var next=document.getElementById('slm-product-search');
    if(next){try{next.focus({preventScroll:true});}catch(e){next.focus();}if(pos!=null&&next.setSelectionRange){try{next.setSelectionRange(pos,pos);}catch(e){}}}
  }
}
'''
marker = 'function loadExactSearch('
pos = t.find(marker)
if pos < 0:
    raise SystemExit('loadExactSearch marker missing')
t = t[:pos] + search_helpers + t[pos:]

t = replace_func(t, 'loadExactSearch', r'''function loadExactSearch(stock,force){
  var name=stock?'stock':'products',requested=String(state.query||'').trim(),seq=++merchantSearchRequest,key=productCacheKey(stock),cached=cget(key,0);
  if(cached&&!force){state.productsByView[name]=cached;if(state.view===name)renderKeepingProductSearchFocus();}
  var url=buildProductUrl(stock,state.page,state.per)+'&_slm_fresh='+Date.now();
  api(url,{cache:'no-store'}).then(function(d){
    if(seq!==merchantSearchRequest||requested!==String(state.query||'').trim()||state.view!==name)return;
    state.searchPools[name]=null;state.productsByView[name]=d;cset(key,d);renderKeepingProductSearchFocus();
  }).catch(function(){
    if(seq!==merchantSearchRequest||requested!==String(state.query||'').trim()||state.view!==name)return;
    if(!state.productsByView[name])state.productsByView[name]={items:[],page:1,per_page:state.per,total:0,pages:1};
    renderKeepingProductSearchFocus();
  });
}''')

# Keep normal catalogue loading intact, but all searches now use the fast path above.
# Typing itself triggers the query after a short debounce; Search/Enter still work.
old_search_bind = "var s=document.getElementById('slm-product-search');if(s)s.onkeydown=function(e){if(e.key==='Enter')document.querySelector('[data-act=\"search-products\"]').click();};"
new_search_bind = r'''var s=document.getElementById('slm-product-search');if(s){
  s.oninput=function(){
    var input=this,viewAtType=state.view;
    clearTimeout(window.__slmProductSearchTimer);
    window.__slmProductSearchTimer=setTimeout(function(){
      if(state.view!==viewAtType)return;
      merchantReturnScroll=null;state.query=String(input.value||'').trim();state.page=1;resetProductResults(state.view);
      loadProducts(state.view==='stock',true);
    },220);
  };
  s.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();clearTimeout(window.__slmProductSearchTimer);document.querySelector('[data-act="search-products"]').click();}};
}'''
t = once(t, old_search_bind, new_search_bind, 'merchant live search binding')

# -----------------------------------------------------------------------------
# ORDERS — one fresh source of truth for list synchronization + native notification.
# Same localStorage key as the existing Android watcher, so notification state is
# preserved across app sessions and duplicate alerts are avoided.
# -----------------------------------------------------------------------------
order_helpers = r'''var ORDER_SEEN_KEY='slm-last-order-id-v1';
var merchantOrderBusy=false,merchantOrderTimer=0;
function lastSeenOrderId(){try{return Number(localStorage.getItem(ORDER_SEEN_KEY)||0)||0;}catch(e){return 0;}}
function rememberOrderId(id){try{localStorage.setItem(ORDER_SEEN_KEY,String(Number(id)||0));}catch(e){}}
function notifyNativeOrder(o){
  if(!o)return;
  try{
    if(window.ShishaLoveNative&&typeof window.ShishaLoveNative.notifyOrderWithId==='function'){
      window.ShishaLoveNative.notifyOrderWithId(String(o.id||0),String(o.number||o.id||''),String(o.customer||'Customer'),String(o.total||''));
    }else if(window.ShishaLoveNative&&typeof window.ShishaLoveNative.notifyOrder==='function'){
      window.ShishaLoveNative.notifyOrder(String(o.number||o.id||''),String(o.customer||'Customer'),String(o.total||''));
    }
  }catch(e){}
}
function acceptFreshOrders(d,allowNotify){
  var items=d&&d.items||[],latest=0,previous=lastSeenOrderId();
  items.forEach(function(o){latest=Math.max(latest,Number(o.id)||0);});
  state.orders=d;cset(ordersKey(),d);
  if(latest>0){
    if(previous>0&&allowNotify!==false&&latest>previous){
      items.filter(function(o){return (Number(o.id)||0)>previous;}).sort(function(a,b){return Number(a.id)-Number(b.id);}).forEach(notifyNativeOrder);
    }
    if(latest>previous)rememberOrderId(latest);
  }
  if(state.view==='orders')render();
}
function startMerchantOrderSync(){
  if(!CFG.merchantAllowed||!CFG.rest)return;
  window.__SLM_BRIDGE_ORDER_SYNC=true;
  // Blocks the older Android injected watcher when it is injected after Bridge JS.
  // Both implementations also share ORDER_SEEN_KEY as a duplicate-alert guard.
  window.__SLM_ORDER_WATCH_INSTALLED=true;
  window.SLM_CHECK_ORDERS=function(){loadOrders(true,true);};
  if(!merchantOrderTimer)merchantOrderTimer=window.setInterval(function(){if(!document.hidden)loadOrders(true,true);},10000);
  if(!window.__SLM_ORDER_SYNC_EVENTS){
    window.__SLM_ORDER_SYNC_EVENTS=true;
    document.addEventListener('visibilitychange',function(){if(!document.hidden)loadOrders(true,true);});
    window.addEventListener('focus',function(){loadOrders(true,true);});
  }
  loadOrders(true,true);
}
'''
marker = 'function loadOrders('
pos = t.find(marker)
if pos < 0:
    raise SystemExit('loadOrders marker missing')
t = t[:pos] + order_helpers + t[pos:]

t = replace_func(t, 'loadOrders', r'''function loadOrders(force,allowNotify){
  var key=ordersKey(),cached=cget(key,0);
  if(cached&&!force){state.orders=cached;if(state.view==='orders')render();}
  if(merchantOrderBusy)return;
  merchantOrderBusy=true;
  api('merchant/orders?page=1&per_page=20&_slm_fresh='+Date.now(),{cache:'no-store'}).then(function(d){
    acceptFreshOrders(d,allowNotify);
  }).catch(function(){
    if(!state.orders){state.orders={items:[]};if(state.view==='orders')render();}
  }).finally(function(){merchantOrderBusy=false;});
}''')

# Install synchronization once Bridge JS is active. Existing bootstrap/navigation
# calls to loadOrders remain valid and now use the fresh implementation.
t = once(t, 'render();bootstrap(false);', 'render();bootstrap(false);startMerchantOrderSync();', 'merchant order sync bootstrap')

# -----------------------------------------------------------------------------
# ORDER DETAIL / RELOAD BEHAVIOR
# - Order detail always owns Orders context, so bottom navigation cannot show
#   Products/Stock while an order is open.
# - Cached detail paints immediately, then refreshes silently from WooCommerce.
# - Refresh while an order is open refreshes only that order, never the whole app.
# - Native notification taps can open the exact order without reloading WebView.
# -----------------------------------------------------------------------------
order_detail_helpers = r'''function orderDetailKey(id){return vkey('slm-order-detail-'+String(Number(id)||0));}
function openOrder(id,force){
  id=Number(id)||0;if(!id)return;
  merchantReturnScroll=null;state.menuOpen=false;state.editor=null;state.catSearch='';
  state.view='orders';state.page=1;hydrateViewFromCache('orders');
  var key=orderDetailKey(id),cached=cget(key,0);
  state.orderDetail=cached||{id:id,loading:true};
  render();
  api('merchant/order/'+encodeURIComponent(id)+(force?'?_slm_fresh='+Date.now():''),
      {cache:'no-store'}).then(function(d){
        state.orderDetail=d;cset(key,d);render();
      }).catch(function(){
        if(!cached){state.orderDetail=null;render();}
      });
}
window.SLM_OPEN_ORDER=function(id){openOrder(id,true);return true;};
'''
marker = 'function openOrder('
pos = t.find(marker)
if pos < 0:
    raise SystemExit('openOrder marker missing')
next_fn = t.find('\nfunction saveOrderStatus(', pos)
if next_fn < 0:
    raise SystemExit('saveOrderStatus marker missing')
t = t[:pos] + order_detail_helpers + t[next_fn+1:]

t = replace_func(t, 'saveOrderStatus', r'''function saveOrderStatus(status){
  var d=state.orderDetail;if(!d||!d.id)return;
  api('merchant/order/'+d.id,{method:'POST',body:JSON.stringify({status:status})}).then(function(next){
    state.orderDetail=next;cset(orderDetailKey(next.id||d.id),next);
    cdelPrefix(vkey('slm-orders-'));state.orders=null;render();loadOrders(true);
  });
}''')

t = replace_func(t, 'navigate', r'''function navigate(view){
  merchantReturnScroll=null;state.menuOpen=false;state.orderDetail=null;
  var changed=view!==state.view;
  if(changed&&(view==='products'||view==='stock')){state.query='';state.categoryId=0;state.stockStatus='all';state.searchPools[view]=null;}
  state.view=view;state.page=1;hydrateViewFromCache(view);
  if(view==='media-library'){mediaManager.page=1;mediaManager.search='';hydrateMediaManagerCache();}
  render();
  if(view==='products')loadProducts(false,false);
  if(view==='stock')loadProducts(true,false);
  if(view==='orders')loadOrders(false);
  if(view==='media-library')loadMediaManager(false);
}''')

t = replace_func(t, 'refresh', r'''function refresh(){
  if(state.orderDetail&&state.orderDetail.id){openOrder(state.orderDetail.id,true);return;}
  if(state.view==='media-library'){loadMediaManager(true);return;}
  if(state.view==='products')loadProducts(false,true);
  else if(state.view==='stock')loadProducts(true,true);
  else if(state.view==='orders')loadOrders(true);
  else bootstrap(true);
}''')

p.write_text(t, encoding='utf-8')

# -----------------------------------------------------------------------------
# PHP — robust partial Merchant search and explicit no-store REST headers.
# -----------------------------------------------------------------------------
php_path = root / 'shishalove-app-bridge.php'
php = php_path.read_text(encoding='utf-8')

old_search = "    if ($search !== '') { $args['s'] = $search; }"
new_search = r'''    if ($search !== '') {
        if ($merchant) {
            global $wpdb;
            $like = '%' . $wpdb->esc_like($search) . '%';
            $title_sku_ids = $wpdb->get_col($wpdb->prepare(
                "SELECT DISTINCT p.ID
                 FROM {$wpdb->posts} p
                 LEFT JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_sku'
                 WHERE p.post_type = 'product'
                   AND p.post_status IN ('publish','draft','pending','private')
                   AND (p.post_title LIKE %s OR pm.meta_value LIKE %s)
                 LIMIT 1000",
                $like,
                $like
            ));
            $term_product_ids = $wpdb->get_col($wpdb->prepare(
                "SELECT DISTINCT tr.object_id
                 FROM {$wpdb->terms} t
                 INNER JOIN {$wpdb->term_taxonomy} tt ON tt.term_id = t.term_id
                 INNER JOIN {$wpdb->term_relationships} tr ON tr.term_taxonomy_id = tt.term_taxonomy_id
                 INNER JOIN {$wpdb->posts} p ON p.ID = tr.object_id
                 WHERE p.post_type = 'product'
                   AND p.post_status IN ('publish','draft','pending','private')
                   AND t.name LIKE %s
                 LIMIT 1000",
                $like
            ));
            $matched_ids = array_values(array_unique(array_filter(array_map('absint', array_merge((array) $title_sku_ids, (array) $term_product_ids)))));
            $args['post__in'] = $matched_ids ? $matched_ids : array(0);
        } else {
            $args['s'] = $search;
        }
    }'''
query_start = php.find('function slb_query_products(')
if query_start < 0:
    raise SystemExit('slb_query_products missing')
query_end = php.find('\nfunction ', query_start + 1)
if query_end < 0:
    raise SystemExit('slb_query_products end missing')
query_fn = php[query_start:query_end]
if query_fn.count(old_search) != 1:
    raise SystemExit(f'merchant partial search backend: expected 1 anchor in slb_query_products, found {query_fn.count(old_search)}')
query_fn = query_fn.replace(old_search, new_search, 1)
php = php[:query_start] + query_fn + php[query_end:]

rest_marker = "add_action('rest_api_init', function() {"
rest_guard = r'''function slb_merchant_rest_no_store($response, $server, $request) {
    $route = is_object($request) && method_exists($request, 'get_route') ? (string) $request->get_route() : '';
    if (strpos($route, '/shishalove/v1/merchant/') === 0 && is_object($response) && method_exists($response, 'header')) {
        $response->header('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');
        $response->header('CDN-Cache-Control', 'no-store');
        $response->header('Cloudflare-CDN-Cache-Control', 'no-store');
    }
    return $response;
}
add_filter('rest_post_dispatch', 'slb_merchant_rest_no_store', 10, 3);

'''
if rest_marker not in php:
    raise SystemExit('rest_api_init marker missing')
php = php.replace(rest_marker, rest_guard + rest_marker, 1)
php_path.write_text(php, encoding='utf-8')

# Regression invariants.
final_js = p.read_text(encoding='utf-8')
final_php = php_path.read_text(encoding='utf-8')
assert "CFG.version='staging-merchant-sync-search-1'" in final_js
assert "s.oninput=function()" in final_js
assert "},220);" in final_js
assert "api('merchant/orders?page=1&per_page=20&_slm_fresh='" in final_js
assert "window.SLM_CHECK_ORDERS=function(){loadOrders(true,true);};" in final_js
assert "window.__SLM_ORDER_WATCH_INSTALLED=true;" in final_js
assert "ShishaLoveNative.notifyOrder" in final_js
assert "ShishaLoveNative.notifyOrderWithId" in final_js
assert "window.SLM_OPEN_ORDER=function(id)" in final_js
assert "function orderDetailKey(id)" in final_js
assert "state.view='orders';state.page=1" in final_js
assert "if(state.orderDetail&&state.orderDetail.id){openOrder(state.orderDetail.id,true);return;}" in final_js
assert "p.post_title LIKE %s OR pm.meta_value LIKE %s" in final_php
assert "t.name LIKE %s" in final_php
assert "Cloudflare-CDN-Cache-Control" in final_php
assert "merchantReturnScroll" in final_js
assert ">Filter · All<" in final_js
print('Merchant staging MASTER FIX: notification deep-link + instant order detail reload + Orders context + existing sync/search applied')
