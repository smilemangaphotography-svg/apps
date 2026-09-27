#!/usr/bin/env python3
from pathlib import Path
import re
import sys
import hashlib

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.78-merchant-data-refresh-orders.py <plugin-dir>')

root = Path(sys.argv[1])
merchant_path = root / 'assets' / 'merchant.js'
php_path = root / 'shishalove-app-bridge.php'
customer_path = root / 'assets' / 'customer.js'

if not merchant_path.is_file() or not php_path.is_file() or not customer_path.is_file():
    raise SystemExit('current Merchant 1.1.78 plugin source is incomplete')

merchant = merchant_path.read_text(encoding='utf-8')
php = php_path.read_text(encoding='utf-8')
customer_sha = hashlib.sha256(customer_path.read_bytes()).hexdigest()

def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {count}')
    return text.replace(old, new, 1)

def replace_func(text, name, replacement):
    marker = 'function ' + name + '('
    start = text.find(marker)
    if start < 0:
        raise SystemExit('missing function ' + name)
    nxt = re.search(r'\nfunction\s+[A-Za-z0-9_]+\(', text[start + 1:])
    if not nxt:
        raise SystemExit('next function missing after ' + name)
    end = start + 1 + nxt.start() + 1
    return text[:start] + replacement.rstrip() + '\n' + text[end:]

for token in (
    "CFG.version='1.1.78'",
    "function apiOnce(",
    "var merchantSyncErrors=",
    "orderby=date&order=DESC",
    "function fetchOrdersPage(",
    "function ordersBody(",
    "scheduleLiveTextSearch",
    "merchantSearchRequest",
):
    if token not in merchant:
        raise SystemExit('unexpected Merchant 1.1.78 baseline: missing ' + token)

for token in (
    "Version: 1.1.78",
    "function slb_sync_merchant_products_152",
    "function slb_sync_merchant_orders_152",
    "register_rest_route('shishalove/v1', '/merchant/products'",
    "register_rest_route('shishalove/v1', '/merchant/orders'",
    "'stock_quantity' => $product->get_stock_quantity()",
    "'date_created' => $created ? $created->date('c') : ''",
    "'date_modified' => $modified ? $modified->date('c') : ''",
    "'orderby' => 'date'",
    "'order' => 'DESC'",
    "'status' => $statuses",
):
    if token not in php:
        raise SystemExit('unexpected Merchant WooCommerce sync baseline: missing ' + token)

merchant = once(
    merchant,
    "state.bootstrap=cached;\n    CFG.restNonce=cached.nonce||CFG.restNonce;",
    "state.bootstrap=cached;\n    if(!CFG.restNonce&&cached.nonce)CFG.restNonce=cached.nonce;",
    'fresh page nonce preservation'
)

merchant = replace_func(merchant, 'fetchOrdersPage', r'''function fetchOrdersPage(page,allowNotify){
  page=Math.max(1,Number(page)||1);
  var path='merchant/orders?page='+page+'&per_page=20';
  var requestKey='orders|'+page;
  return apiOnce(requestKey,path,{cache:'no-store'}).then(function(d){
    merchantSyncErrors.orders=null;
    acceptFreshOrders(d,allowNotify,page);
    return d;
  },function(err){
    var payload=err&&err.payload||{};
    merchantSyncErrors.orders={
      message:String(err&&err.message||'Merchant Orders request failed'),
      status:Number(err&&err.status||0)||0,
      code:payload&&payload.code?String(payload.code):'',
      endpoint:'GET /wp-json/shishalove/v1/merchant/orders',
      time:Date.now()
    };
    if(page===state.page&&!state.orders&&!cget(ordersKey(page),0)){
      state.orders={items:[],page:page,per_page:20,total:0,pages:1,_loadError:true};
    }
    if(page===state.page&&state.view==='orders')render();
    return null;
  });
}''')

merchant = replace_func(merchant, 'ordersBody', r'''function ordersBody(){
  var data=state.orders||cget(ordersKey(),0),items=data&&data.items||[],failure=merchantSyncErrors&&merchantSyncErrors.orders||null;
  var body;
  if(failure||(data&&data._loadError)){
    var parts=[];
    if(failure&&failure.status)parts.push('HTTP '+failure.status);
    if(failure&&failure.code)parts.push(failure.code);
    if(failure&&failure.message)parts.push(failure.message);
    body='<div class="slm-empty"><strong>Could not load orders.</strong><div class="slm-muted" style="margin-top:8px">'+esc(parts.join(' · ')||'Merchant Orders request failed.')+'</div></div>';
  }else{
    body=data?orderRows(items):ghostRows(5);
  }
  return '<main class="slm-page"><div class="slm-head"><div><h1>Orders</h1><div class="slm-muted">Latest WooCommerce orders</div></div></div><section id="slm-orders">'+body+'</section>'+pagerMarkup(data)+'</main>';
}''')

for token in (
    "if(!CFG.restNonce&&cached.nonce)CFG.restNonce=cached.nonce;",
    "endpoint:'GET /wp-json/shishalove/v1/merchant/orders'",
    "Could not load orders.",
    "orderby=date&order=DESC",
    "function apiOnce(",
    "scheduleLiveTextSearch",
    "merchantSearchRequest",
):
    if token not in merchant:
        raise SystemExit('Merchant finalization assertion failed: ' + token)

if "CFG.restNonce=cached.nonce||CFG.restNonce;" in merchant:
    raise SystemExit('stale cached nonce override still present')
if "Version: 1.1.79" in php or "CFG.version='1.1.79'" in merchant:
    raise SystemExit('version bump forbidden')

merchant_path.write_text(merchant, encoding='utf-8')
if hashlib.sha256(customer_path.read_bytes()).hexdigest() != customer_sha:
    raise SystemExit('Customer preservation lock failed')

print('Merchant 1.1.78 data refresh/orders surgical patch applied; Customer frozen; version unchanged')
