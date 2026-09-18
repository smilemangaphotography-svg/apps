#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.46.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.45.py'), str(root)])

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

# ---------------------------------------------------------------------------
# Merchant 1.1.46 — approved staging fixes only.
# Customer 1.1.45 remains frozen.
# ---------------------------------------------------------------------------
merchant = root / 'assets' / 'merchant.js'
t = merchant.read_text(encoding='utf-8')

t = once(t, "CFG.version='1.1.43';", "CFG.version='1.1.46';", 'merchant cfg')
t = once(t, "slbfix','1.1.43'", "slbfix','1.1.46'", 'merchant css bust')
t = once(t, 'Bridge 1.1.43', 'Bridge 1.1.46', 'merchant bridge label')
t = once(t, "var DATA_CACHE='stable-v1';", "var DATA_CACHE='merchant-v146';", 'merchant cache generation')

old_api = "function api(path,opts){opts=opts||{};var h=opts.headers||{};if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;if(opts.body&&!h['Content-Type'])h['Content-Type']='application/json';opts.headers=h;opts.credentials='same-origin';return fetch(CFG.rest+path,opts).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}"
new_api = "function api(path,opts){opts=opts||{};var h=opts.headers||{};if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;if(opts.body&&!h['Content-Type'])h['Content-Type']='application/json';opts.headers=h;opts.credentials='same-origin';if(!opts.method||String(opts.method).toUpperCase()==='GET')opts.cache='no-store';return fetch(CFG.rest+path,opts).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}"
t = once(t, old_api, new_api, 'merchant no-store api')

# Product list thumbnails: request the lightweight WP thumbnail first, then fall
# back to the exact source URL if that derivative does not exist.
image_helper = r'''function fastProductImage(src){src=String(src||'');return src.replace(/-\d+x\d+(\.[a-z0-9]+)(\?.*)?$/i,'-150x150$1$2');}
'''
t = once(t, 'function productRows(items){', image_helper + 'function productRows(items){', 'product image helper')
t = once(
    t,
    '''<img src="'+esc(p.image)+'" alt="">''',
    '''<img src="'+esc(fastProductImage(p.image))+'" data-fallback="'+esc(p.image)+'" loading="eager" decoding="async" fetchpriority="high" onerror="this.onerror=null;this.src=this.dataset.fallback" alt="">''',
    'fast product thumbnail'
)

# Stock management is an owner rule: always enabled in the phone editor.
t = once(
    t,
    "var p=state.editor,creating=!p.id,busy=!!p._mediaBusy,manage=!!p.manage_stock;",
    "var p=state.editor,creating=!p.id,busy=!!p._mediaBusy,manage=true;",
    'stock management render'
)
t = t.replace("manage_stock:false,stock_quantity:''", "manage_stock:true,stock_quantity:''")
t = once(
    t,
    "var ms=document.getElementById('slm-manage-stock'),manage=!!(ms&&ms.checked);",
    "var ms=document.getElementById('slm-manage-stock'),manage=true;if(ms)ms.checked=true;",
    'stock management save'
)
t = once(
    t,
    "var ms=document.getElementById('slm-manage-stock');if(ms)ms.onchange=function(){var q=document.getElementById('slm-stock-qty-wrap');if(q)q.style.display=this.checked?'block':'none';};",
    "var ms=document.getElementById('slm-manage-stock');if(ms){ms.checked=true;ms.onchange=function(){this.checked=true;var q=document.getElementById('slm-stock-qty-wrap');if(q)q.style.display='block';};}",
    'stock management lock'
)

# Fast server-backed partial search; typing updates Products and Stock after 220ms.
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

# Fresh orders + one shared last-seen key for duplicate-safe native notifications.
order_helpers = r'''var ORDER_SEEN_KEY='slm-last-order-id-v1';
var merchantOrderBusy=false,merchantOrderTimer=0;
function lastSeenOrderId(){try{return Number(localStorage.getItem(ORDER_SEEN_KEY)||0)||0;}catch(e){return 0;}}
function rememberOrderId(id){try{localStorage.setItem(ORDER_SEEN_KEY,String(Number(id)||0));}catch(e){}}
function notifyNativeOrder(o){
  if(!o)return;
  try{
    if(window.ShishaLoveNative&&typeof window.ShishaLoveNative.notifyOrder==='function'){
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

# Declare dashboard state after function replacement so the helper is not lost
# between loadOrders() and loadDashboardStats().
t = once(
    t,
    'function loadDashboardStats(force){',
    'var dashboardStats=null,dashboardStatsLoading=false;\nfunction loadDashboardStats(force){',
    'dashboard state'
)

t = once(t, 'render();bootstrap(false);', 'render();bootstrap(false);startMerchantOrderSync();', 'merchant order sync bootstrap')

merchant.write_text(t, encoding='utf-8')

# Server-side partial Merchant search + explicit no-store Merchant REST responses.
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
                $like, $like
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
qs = php.find('function slb_query_products(')
if qs < 0:
    raise SystemExit('slb_query_products missing')
qe = php.find('\nfunction ', qs + 1)
if qe < 0:
    raise SystemExit('slb_query_products end missing')
fn = php[qs:qe]
if fn.count(old_search) != 1:
    raise SystemExit(f'merchant partial search backend: expected 1 anchor, found {fn.count(old_search)}')
fn = fn.replace(old_search, new_search, 1)
php = php[:qs] + fn + php[qe:]

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

final_js = merchant.read_text(encoding='utf-8')
final_php = php_path.read_text(encoding='utf-8')
customer = (root / 'assets' / 'customer.js').read_text(encoding='utf-8')

assert "CFG.version='1.1.46'" in final_js
assert "var DATA_CACHE='merchant-v146';" in final_js
assert "var dashboardStats=null,dashboardStatsLoading=false;" in final_js
assert "var p=state.editor,creating=!p.id,busy=!!p._mediaBusy,manage=true;" in final_js
assert "manage=true;if(ms)ms.checked=true" in final_js
assert "fastProductImage" in final_js
assert "s.oninput=function()" in final_js and "},220);" in final_js
assert "window.SLM_CHECK_ORDERS=function(){loadOrders(true,true);};" in final_js
assert "window.__SLM_ORDER_WATCH_INSTALLED=true;" in final_js
assert "ShishaLoveNative.notifyOrder" in final_js
assert "p.post_title LIKE %s OR pm.meta_value LIKE %s" in final_php
assert "t.name LIKE %s" in final_php
assert "Cloudflare-CDN-Cache-Control" in final_php
assert "merchantReturnScroll" in final_js
assert ">Filter · All<" in final_js
assert "var BUILD='1.1.45';" in customer
assert "function frontPageMarkup()" in customer
print('ShishaLove Bridge 1.1.46: approved Merchant staging fixes finalized; Customer 1.1.45 preserved')
