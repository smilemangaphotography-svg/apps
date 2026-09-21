#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.51.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.50.py'), str(root)])

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

merchant = root / 'assets' / 'merchant.js'
t = merchant.read_text(encoding='utf-8')

t = once(t, "CFG.version='1.1.50';", "CFG.version='1.1.51';", 'merchant runtime version')
t = t.replace('Bridge 1.1.50', 'Bridge 1.1.51')

# Orders: use the exact route that already works on the phone Beta.
# Bridge 1.1.51 also supplies this route as a permanent alias when the staging
# loader is absent, so the official app does not depend on that plugin forever.
insert_after = "var MERCHANT_STAGING_REST=location.origin+'/wp-json/shishalove-production/v1/';"
t = once(
    t,
    insert_after,
    insert_after + "\nvar MERCHANT_ORDER_REST=location.origin+'/wp-json/shishalove-staging/v1/';",
    'known-good order REST base'
)

api_old = "function api(path,opts){opts=opts||{};var h=opts.headers||{};if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;if(opts.body&&!h['Content-Type'])h['Content-Type']='application/json';opts.headers=h;opts.credentials='same-origin';if(!opts.method||String(opts.method).toUpperCase()==='GET')opts.cache='no-store';var base=/^merchant\\/(?:products|orders)(?:\\?|$)/.test(path)?MERCHANT_STAGING_REST:MERCHANT_CANONICAL_REST;return fetch(base+path,opts).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}"
api_new = "function api(path,opts){opts=opts||{};var h=opts.headers||{};if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;if(opts.body&&!h['Content-Type'])h['Content-Type']='application/json';opts.headers=h;opts.credentials='same-origin';if(!opts.method||String(opts.method).toUpperCase()==='GET')opts.cache='no-store';var base=/^merchant\\/orders(?:\\?|$)/.test(path)?MERCHANT_ORDER_REST:/^merchant\\/products(?:\\?|$)/.test(path)?MERCHANT_STAGING_REST:MERCHANT_CANONICAL_REST;return fetch(base+path,opts).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}"
t = once(t, api_old, api_new, 'route exact Beta Orders separately')

# Never leave Orders on skeleton indefinitely.
t = replace_func(t, 'ordersBody', r'''function ordersBody(){
  var data=state.orders||cget(ordersKey(),0),items=data&&data.items||[];
  var body;
  if(!data)body=ghostRows(5);
  else if(data._loadError)body='<div class="slm-empty" style="padding:36px 0;text-align:center"><p>Could not refresh orders.</p><button class="slb-primary" data-act="refresh">TRY AGAIN</button></div>';
  else body=orderRows(items);
  return '<main class="slm-page"><div class="slm-head"><div><h1>Orders</h1><div class="slm-muted">Latest WooCommerce orders</div></div></div><section id="slm-orders">'+body+'</section>'+pagerMarkup(data)+'</main>';
}''')

t = replace_func(t, 'loadOrders', r'''function loadOrders(force,allowNotify){
  var key=ordersKey(),cached=cget(key,0);
  if(cached){state.orders=cached;if(state.view==='orders')render();if(!force)return;}
  if(merchantOrderBusy)return;
  merchantOrderBusy=true;
  var settled=false;
  var timer=setTimeout(function(){
    if(settled)return;
    merchantOrderBusy=false;
    if(!state.orders){
      state.orders={items:[],page:1,per_page:20,total:0,pages:1,_loadError:true};
      if(state.view==='orders')render();
    }
  },6000);
  api('merchant/orders?page=1&per_page=20&_slm_fresh='+Date.now(),{cache:'no-store'}).then(function(d){
    settled=true;clearTimeout(timer);merchantOrderBusy=false;acceptFreshOrders(d,allowNotify);
  }).catch(function(){
    settled=true;clearTimeout(timer);merchantOrderBusy=false;
    if(!state.orders){
      state.orders={items:[],page:1,per_page:20,total:0,pages:1,_loadError:true};
      if(state.view==='orders')render();
    }
  });
}''')

# Product + Stock lists: newest modified product first.
# Search/filter still work, but default ordering is now "most recently updated".
# On a successful save, show the saved product at the top immediately and then
# silently reconcile with WooCommerce.
t = replace_func(t, 'saveProduct', r'''function saveProduct(){
  if(!state.editor||state.editor._mediaBusy)return;
  var brandIds=[];root.querySelectorAll('[data-brand-check]:checked').forEach(function(e){brandIds.push(Number(e.dataset.brandCheck));});
  var ms=document.getElementById('slm-manage-stock'),manage=true;if(ms)ms.checked=true;
  var body={name:val('slm-name'),sku:val('slm-sku'),status:val('slm-status'),visibility:val('slm-visibility'),catalog_visibility:val('slm-catalog'),regular_price:val('slm-price'),sale_price:val('slm-sale'),stock_status:val('slm-stock'),manage_stock:manage,stock_quantity:manage?val('slm-stock-qty'):'',short_description:val('slm-desc'),category_ids:state.selectedCats.slice(),brand_ids:brandIds,ensure_artwork:true,image_id:Number(state.editor.image_id)||0,gallery_ids:Array.isArray(state.editor.gallery_ids)?state.editor.gallery_ids.map(Number).filter(function(id){return id>0;}):[]};
  var btn=document.querySelector('[data-act="save-product"]');if(btn){btn.disabled=true;btn.textContent='SAVING…';}
  var path=state.editor.id?'merchant/product/'+state.editor.id:'merchant/product';
  api(path,{method:'POST',body:JSON.stringify(body)}).then(function(saved){
    var stockView=state.view==='stock',activeName=stockView?'stock':'products',activeData=state.productsByView[activeName]||cget(productCacheKey(stockView),0);
    state.page=1;
    state.query='';
    state.categoryId=0;
    state.stockStatus='all';
    cdelPrefix('slm-products-');
    state.searchPools={products:null,stock:null};
    state.productsByView={products:null,stock:null};
    if(activeData&&Array.isArray(activeData.items)&&saved&&saved.id){
      var items=[saved].concat(activeData.items.filter(function(p){return Number(p.id)!==Number(saved.id);}));
      state.productsByView[activeName]={items:items.slice(0,state.per),page:1,per_page:state.per,total:Math.max(Number(activeData.total||0),items.length),pages:Math.max(1,Number(activeData.pages||1))};
    }
    state.editor=null;state.catSearch='';render();window.scrollTo(0,0);
    loadProducts(stockView,true);
    if(saved&&saved.permalink){try{navigator.clipboard&&navigator.clipboard.writeText(saved.permalink);}catch(e){}}
  }).catch(function(){if(btn){btn.disabled=false;btn.textContent=state.editor&&state.editor.id?'UPDATE':'CREATE';}alert('Could not save product.');});
}''')

# Reduce cold-open contention: Products/Stock/Dashboard paint first; Orders sync
# starts immediately only on the Orders page, otherwise 1.5s later.
old_sync_tail = "  loadOrders(true,true);\n}\nfunction loadOrders(force,allowNotify){"
new_sync_tail = "  if(state.view==='orders')loadOrders(true,true);else setTimeout(function(){loadOrders(true,true);},1500);\n}\nfunction loadOrders(force,allowNotify){"
t = once(t, old_sync_tail, new_sync_tail, 'defer background order sync off Orders page')

merchant.write_text(t, encoding='utf-8')

php_path = root / 'shishalove-app-bridge.php'
php = php_path.read_text(encoding='utf-8')

# Change only the production Beta-mirror Products query from alphabetical
# to latest-modified. Do not alter Customer/canonical product ordering.
prod_start = php.find('function slb_prod_beta_merchant_products($request)')
prod_end = php.find('function slb_prod_beta_merchant_orders($request)', prod_start)
if prod_start < 0 or prod_end < 0:
    raise SystemExit('production Beta product route function missing')
prod_chunk = php[prod_start:prod_end]
old_sort = """        'orderby' => 'title',
        'order' => 'ASC',"""
new_sort = """        'orderby' => 'modified',
        'order' => 'DESC',"""
prod_chunk = once(prod_chunk, old_sort, new_sort, 'recent product ordering')
php = php[:prod_start] + prod_chunk + php[prod_end:]

# Permanent alias for the already-proven staging Orders URL. If the staging
# loader still owns it, leave it untouched. If it is removed later, Bridge owns it.
alias = r'''
add_action('rest_api_init', function() {
    $routes = rest_get_server()->get_routes();
    if (!isset($routes['/shishalove-staging/v1/merchant/orders'])) {
        register_rest_route('shishalove-staging/v1', '/merchant/orders', array(
            'methods' => 'GET',
            'permission_callback' => 'slb_merchant_permission',
            'callback' => 'slb_prod_beta_merchant_orders',
        ));
    }
}, 99);

'''
anchor = 'function slb_render_shell($mode) {'
if anchor not in php:
    raise SystemExit('render shell anchor missing')
php = php.replace(anchor, alias + anchor, 1)
php_path.write_text(php, encoding='utf-8')

final_js = merchant.read_text(encoding='utf-8')
final_php = php_path.read_text(encoding='utf-8')
customer = (root / 'assets' / 'customer.js').read_text(encoding='utf-8')

assert "CFG.version='1.1.51';" in final_js
assert "MERCHANT_ORDER_REST=location.origin+'/wp-json/shishalove-staging/v1/'" in final_js
assert "6000" in final_js
assert "Could not refresh orders." in final_js
assert "setTimeout(function(){loadOrders(true,true);},1500)" in final_js
assert "state.page=1;" in final_js
assert "window.scrollTo(0,0)" in final_js
assert "'orderby' => 'modified'" in final_php
assert "'order' => 'DESC'" in final_php
assert "/shishalove-staging/v1/merchant/orders" in final_php
assert "callback' => 'slb_prod_beta_merchant_orders'" in final_php
assert "var BUILD='1.1.45';" in customer

print('ShishaLove Bridge 1.1.51: Orders known-good route + faster fail-safe + latest-modified Products/Stock applied')
