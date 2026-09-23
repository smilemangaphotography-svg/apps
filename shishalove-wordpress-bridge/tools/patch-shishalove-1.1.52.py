#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.52.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# Preserve the exact approved Merchant runtime and every production fix through 1.1.51.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.51.py'), str(root)])

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

def replace_last_func(text, name, end_marker, replacement):
    marker = 'function ' + name + '('
    s = text.find(marker)
    if s < 0:
        raise SystemExit('missing function ' + name)
    e = text.find(end_marker, s)
    if e < 0:
        raise SystemExit('missing end marker after ' + name)
    return text[:s] + replacement.rstrip() + '\n' + text[e:]

merchant = root / 'assets' / 'merchant.js'
t = merchant.read_text(encoding='utf-8')

t = once(t, "CFG.version='1.1.51';", "CFG.version='1.1.52';", 'merchant runtime version')
t = t.replace('Bridge 1.1.51', 'Bridge 1.1.52')

# 1.1.51 still split reads between canonical, production and staging namespaces.
# 1.1.52 has one authoritative Merchant data path: /wp-json/shishalove/v1/.
t = once(
    t,
    "var MERCHANT_STAGING_REST=location.origin+'/wp-json/shishalove-production/v1/';\nvar MERCHANT_ORDER_REST=location.origin+'/wp-json/shishalove-staging/v1/';",
    """var merchantInflight={};
var merchantSyncErrors={};
var merchantManualRefreshPromise=null;
var SLM_SYNC_DEBUG=false;
try{SLM_SYNC_DEBUG=new URLSearchParams(location.search).get('sync_debug')==='1';}catch(e){}""",
    'remove split Merchant REST bases'
)

t = replace_func(t, 'api', r'''function slmSyncLog(kind,detail){
  if(!SLM_SYNC_DEBUG||!window.console||typeof console.info!=='function')return;
  try{console.info('[SLM SYNC '+kind+']',detail);}catch(e){}
}
function api(path,opts){
  opts=opts||{};
  var h=opts.headers||{},method=String(opts.method||'GET').toUpperCase();
  if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;
  if(opts.body&&!h['Content-Type'])h['Content-Type']='application/json';
  if(method==='GET'){
    opts.cache='no-store';
    h['Cache-Control']='no-cache';
    h['Pragma']='no-cache';
  }
  opts.headers=h;opts.credentials='same-origin';
  var url=MERCHANT_CANONICAL_REST+path;
  if(method==='GET'&&/^merchant\//.test(path)){
    url+=(url.indexOf('?')>=0?'&':'?')+'_slm_net='+Date.now();
  }
  var started=Date.now();
  return fetch(url,opts).then(function(r){
    var status=r.status;
    return r.text().then(function(raw){
      var data={};
      if(raw){
        try{data=JSON.parse(raw);}catch(parseError){
          var bad=new Error('Invalid JSON from Merchant API');bad.status=status;throw bad;
        }
      }
      if(!r.ok){
        var msg=data&&data.message?String(data.message):('HTTP '+status);
        var err=new Error(msg);err.status=status;err.payload=data;throw err;
      }
      slmSyncLog('RESPONSE',{path:path,status:status,count:data&&data.items?data.items.length:undefined,total:data&&data.total,pages:data&&data.pages,server_ms:data&&data.server_ms,elapsed_ms:Date.now()-started,time:new Date().toISOString()});
      return data;
    });
  }).then(null,function(err){
    slmSyncLog('ERROR',{path:path,status:err&&err.status||0,message:String(err&&err.message||err),elapsed_ms:Date.now()-started,time:new Date().toISOString()});
    throw err;
  });
}
function apiOnce(key,path,opts){
  if(merchantInflight[key])return merchantInflight[key];
  var p=api(path,opts);
  merchantInflight[key]=p;
  return p.then(function(value){
    delete merchantInflight[key];
    return value;
  },function(err){
    delete merchantInflight[key];
    throw err;
  });
}''')

t = replace_func(t, 'buildProductUrl', r'''function buildProductUrl(stock,page,per){
  var url='merchant/products?page='+page+'&per_page='+per+'&search='+encodeURIComponent(state.query)+'&orderby=date&order=DESC&include_variations=1';
  if(state.categoryId)url+='&category_id='+state.categoryId;
  if(state.stockStatus!=='all')url+='&stock_status='+encodeURIComponent(state.stockStatus);
  return url;
}''')

t = replace_func(t, 'loadProducts', r'''function loadProducts(stock,force){
  var key=productCacheKey(stock),cached=cget(key,0),name=stock?'stock':'products';
  if(String(state.query||'').trim()!==''){loadExactSearch(stock,force);return Promise.resolve(null);}
  state.searchPools[name]=null;
  if(cached){
    state.productsByView[name]=cached;
    if(state.view===name){render();restoreMerchantScroll(false);}
  }
  var url=buildProductUrl(stock,state.page,state.per);
  var requestKey='products|'+url;
  return apiOnce(requestKey,url,{cache:'no-store'}).then(function(d){
    d=d||{items:[],page:state.page,per_page:state.per,total:0,pages:1};
    d._syncedAt=Date.now();
    cset(key,d);
    merchantSyncErrors.products=null;
    if(key===productCacheKey(stock)){
      state.productsByView[name]=d;
      if(state.view===name){render();restoreMerchantScroll(true);}
    }
    return d;
  },function(err){
    merchantSyncErrors.products={message:String(err&&err.message||err),status:err&&err.status||0,time:Date.now()};
    if(!state.productsByView[name]&&!cached){
      state.productsByView[name]={items:[],page:state.page,per_page:state.per,total:0,pages:1,_loadError:true};
      if(state.view===name){render();restoreMerchantScroll(true);}
    }else{restoreMerchantScroll(true);}
    return null;
  });
}''')

t = replace_func(t, 'ordersKey', r'''function ordersKey(page){return vkey('slm-orders-'+String(page||state.page||1));}''')

t = replace_func(t, 'acceptFreshOrders', r'''function acceptFreshOrders(d,allowNotify,page){
  page=Math.max(1,Number(page||d&&d.page||1)||1);
  var items=d&&d.items||[],latest=0,previous=lastSeenOrderId();
  if(d){d._syncedAt=Date.now();cset(ordersKey(page),d);}
  if(page===1){
    items.forEach(function(o){latest=Math.max(latest,Number(o.id)||0);});
    if(latest>0){
      if(previous>0&&allowNotify!==false&&latest>previous){
        items.filter(function(o){return (Number(o.id)||0)>previous;}).sort(function(a,b){return Number(a.id)-Number(b.id);}).forEach(notifyNativeOrder);
      }
      if(latest>previous)rememberOrderId(latest);
    }
  }
  if(page===state.page){
    state.orders=d;
    if(state.view==='orders')render();
  }
}''')

t = replace_func(t, 'startMerchantOrderSync', r'''function startMerchantOrderSync(){
  if(!CFG.merchantAllowed||!CFG.rest)return;
  window.__SLM_BRIDGE_ORDER_SYNC=true;
  window.__SLM_ORDER_WATCH_INSTALLED=true;
  window.SLM_CHECK_ORDERS=function(){syncLatestOrders(true);};
  if(!merchantOrderTimer)merchantOrderTimer=window.setInterval(function(){if(!document.hidden)syncLatestOrders(true);},15000);
  if(!window.__SLM_ORDER_SYNC_EVENTS){
    window.__SLM_ORDER_SYNC_EVENTS=true;
    document.addEventListener('visibilitychange',function(){if(!document.hidden)syncLatestOrders(true);});
    window.addEventListener('focus',function(){syncLatestOrders(true);});
  }
  setTimeout(function(){
    if(state.view==='orders'&&state.page===1)loadOrders(true,true);
    else syncLatestOrders(true);
  },state.view==='orders'?0:1200);
}''')

t = replace_func(t, 'loadOrders', r'''function fetchOrdersPage(page,allowNotify){
  page=Math.max(1,Number(page)||1);
  var path='merchant/orders?page='+page+'&per_page=20';
  var requestKey='orders|'+page;
  return apiOnce(requestKey,path,{cache:'no-store'}).then(function(d){
    merchantSyncErrors.orders=null;
    acceptFreshOrders(d,allowNotify,page);
    return d;
  },function(err){
    merchantSyncErrors.orders={message:String(err&&err.message||err),status:err&&err.status||0,time:Date.now()};
    if(page===state.page&&!state.orders&&!cget(ordersKey(page),0)){
      state.orders={items:[],page:page,per_page:20,total:0,pages:1,_loadError:true};
      if(state.view==='orders')render();
    }
    return null;
  });
}
function syncLatestOrders(allowNotify){
  return fetchOrdersPage(1,allowNotify);
}
function loadOrders(force,allowNotify){
  var page=Math.max(1,Number(state.page)||1),key=ordersKey(page),cached=cget(key,0);
  if(cached){
    state.orders=cached;
    if(state.view==='orders')render();
  }
  return fetchOrdersPage(page,allowNotify);
}
var dashboardStats=null,dashboardStatsLoading=false;''')

t = replace_func(t, 'refresh', r'''function refresh(){
  if(state.orderDetail&&state.orderDetail.id){openOrder(state.orderDetail.id,true);return;}
  if(state.view==='media-library'){loadMediaManager(true);return;}
  if(merchantManualRefreshPromise)return merchantManualRefreshPromise;
  var jobs=[];
  if(state.view==='products')jobs.push(loadProducts(false,true));
  else if(state.view==='stock')jobs.push(loadProducts(true,true));
  else if(state.view==='orders')jobs.push(loadOrders(true,true));
  else jobs.push(apiOnce('refresh-products-default','merchant/products?page=1&per_page=20&search=&orderby=date&order=DESC&include_variations=1',{cache:'no-store'}).then(function(d){
    var key=vkey('slm-products-all-1-20-0-all-');
    if(d){d._syncedAt=Date.now();cset(key,d);}
    return d;
  }));
  if(!(state.view==='orders'&&state.page===1))jobs.push(syncLatestOrders(true));
  if(state.view==='more')jobs.push(bootstrap(true));
  merchantManualRefreshPromise=Promise.all(jobs.map(function(p){return Promise.resolve(p).then(function(v){return v;},function(){return null;});}));
  return merchantManualRefreshPromise.then(function(v){merchantManualRefreshPromise=null;return v;},function(e){merchantManualRefreshPromise=null;throw e;});
}''')

t = replace_last_func(t, 'bootstrap', '\nrender();bootstrap(false);startMerchantOrderSync();', r'''function bootstrap(force){
  var key=vkey('slm-bootstrap'),cached=cget(key,0),startedProducts=false;
  if(cached){
    state.bootstrap=cached;
    CFG.restNonce=cached.nonce||CFG.restNonce;
    hydrateViewFromCache(state.view);
    render();
    if(state.view==='products'){startedProducts=true;loadProducts(false,false);}
    else if(state.view==='stock'){startedProducts=true;loadProducts(true,false);}
    else if(state.view==='orders')loadOrders(false,false);
    setTimeout(prefetchMediaManager,0);
  }
  return apiOnce('bootstrap','merchant/bootstrap',{cache:'no-store'}).then(function(d){
    state.bootstrap=d;cset(key,d);CFG.restNonce=d.nonce||CFG.restNonce;
    merchantSyncErrors.bootstrap=null;
    hydrateViewFromCache(state.view);render();
    if(!startedProducts&&state.view==='products')loadProducts(false,false);
    else if(!startedProducts&&state.view==='stock')loadProducts(true,false);
    else if(state.view==='orders'&&!state.orders)loadOrders(false,false);
    setTimeout(prefetchMediaManager,0);
    return d;
  },function(err){
    merchantSyncErrors.bootstrap={message:String(err&&err.message||err),status:err&&err.status||0,time:Date.now()};
    if(!state.bootstrap)render();
    return null;
  });
}''')

merchant.write_text(t, encoding='utf-8')

php_path = root / 'shishalove-app-bridge.php'
php = php_path.read_text(encoding='utf-8')

sync_php = r'''
/**
 * Merchant 1.1.52 authoritative WooCommerce synchronization layer.
 * Old staging/production aliases remain registered only so older installed APKs
 * do not break during rollout. 1.1.52 itself uses these canonical routes only.
 */
function slb_sync_response_152($data, $started = 0.0) {
    if (is_wp_error($data)) { return $data; }
    if (is_array($data) && $started > 0) {
        $data['server_ms'] = (int) round((microtime(true) - $started) * 1000);
        $data['server_time'] = time();
    }
    $response = rest_ensure_response($data);
    $response->header('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
    $response->header('Pragma', 'no-cache');
    $response->header('Expires', '0');
    $response->header('X-ShishaLove-Sync', '1.1.52');
    return $response;
}

function slb_sync_variation_payload_152($variation) {
    if (!$variation) { return null; }
    return array(
        'id' => (int) $variation->get_id(),
        'sku' => (string) $variation->get_sku(),
        'status' => (string) $variation->get_status(),
        'price' => (string) $variation->get_price(),
        'regular_price' => (string) $variation->get_regular_price(),
        'sale_price' => (string) $variation->get_sale_price(),
        'stock_status' => (string) $variation->get_stock_status(),
        'manage_stock' => (bool) $variation->get_manage_stock(),
        'stock_quantity' => $variation->get_stock_quantity(),
        'in_stock' => (bool) $variation->is_in_stock(),
        'attributes' => $variation->get_attributes(),
    );
}

function slb_sync_product_payload_152($product, $include_variations = false) {
    if (!$product) { return null; }
    $image_id = $product->get_image_id();
    $image = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : '';
    $cats = array();
    $terms = get_the_terms($product->get_id(), 'product_cat');
    if ($terms && !is_wp_error($terms)) {
        foreach ($terms as $term) {
            $cats[] = array('id' => (int) $term->term_id, 'name' => html_entity_decode((string) $term->name, ENT_QUOTES, 'UTF-8'));
        }
    }
    $variations = array();
    if ($include_variations && $product->is_type('variable')) {
        foreach ((array) $product->get_children() as $variation_id) {
            $variation = wc_get_product($variation_id);
            if ($variation) { $variations[] = slb_sync_variation_payload_152($variation); }
        }
    }
    $created = $product->get_date_created();
    $modified = $product->get_date_modified();
    return array(
        'id' => (int) $product->get_id(),
        'name' => (string) $product->get_name(),
        'sku' => (string) $product->get_sku(),
        'status' => (string) $product->get_status(),
        'type' => (string) $product->get_type(),
        'permalink' => (string) $product->get_permalink(),
        'image' => $image ?: (function_exists('wc_placeholder_img_src') ? wc_placeholder_img_src('woocommerce_thumbnail') : ''),
        'price' => (string) $product->get_price(),
        'regular_price' => (string) $product->get_regular_price(),
        'sale_price' => (string) $product->get_sale_price(),
        'price_html' => html_entity_decode(wp_strip_all_tags($product->get_price_html()), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'stock_status' => (string) $product->get_stock_status(),
        'manage_stock' => (bool) $product->get_manage_stock(),
        'stock_quantity' => $product->get_stock_quantity(),
        'in_stock' => (bool) $product->is_in_stock(),
        'purchasable' => (bool) $product->is_purchasable(),
        'date_created' => $created ? $created->date('c') : '',
        'date_modified' => $modified ? $modified->date('c') : '',
        'categories' => $cats,
        'variations' => $variations,
    );
}

function slb_sync_merchant_products_152($request) {
    $started = microtime(true);
    if (!function_exists('wc_get_product')) {
        return new WP_Error('woocommerce_unavailable', 'WooCommerce unavailable', array('status' => 503));
    }
    global $wpdb;
    $page = max(1, absint($request->get_param('page')));
    $per = min(50, max(1, absint($request->get_param('per_page') ?: 20)));
    $search = sanitize_text_field((string) $request->get_param('search'));
    $category_id = absint($request->get_param('category_id'));
    $stock = sanitize_key((string) $request->get_param('stock_status'));
    $include_variations = rest_sanitize_boolean($request->get_param('include_variations'));
    $orderby = sanitize_key((string) ($request->get_param('orderby') ?: 'date'));
    $order = strtoupper((string) $request->get_param('order')) === 'ASC' ? 'ASC' : 'DESC';
    if (!in_array($orderby, array('date','modified','title','menu_order'), true)) { $orderby = 'date'; }

    $args = array(
        'post_type' => 'product',
        'post_status' => array('publish','draft','pending','private'),
        'posts_per_page' => $per,
        'paged' => $page,
        'orderby' => $orderby,
        'order' => $order,
        'fields' => 'ids',
        'no_found_rows' => false,
        'update_post_meta_cache' => true,
        'update_post_term_cache' => true,
    );

    if ($search !== '') {
        $like = '%' . $wpdb->esc_like($search) . '%';
        $title_sku = $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT p.ID
             FROM {$wpdb->posts} p
             LEFT JOIN {$wpdb->postmeta} pm ON pm.post_id=p.ID AND pm.meta_key='_sku'
             WHERE p.post_type='product'
               AND p.post_status IN ('publish','draft','pending','private')
               AND (p.post_title LIKE %s OR pm.meta_value LIKE %s)
             LIMIT 1500",
            $like, $like
        ));
        $term_matches = $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT tr.object_id
             FROM {$wpdb->terms} t
             INNER JOIN {$wpdb->term_taxonomy} tt ON tt.term_id=t.term_id
             INNER JOIN {$wpdb->term_relationships} tr ON tr.term_taxonomy_id=tt.term_taxonomy_id
             INNER JOIN {$wpdb->posts} p ON p.ID=tr.object_id
             WHERE p.post_type='product'
               AND p.post_status IN ('publish','draft','pending','private')
               AND t.name LIKE %s
             LIMIT 1500",
            $like
        ));
        $ids = array_values(array_unique(array_filter(array_map('absint', array_merge((array) $title_sku, (array) $term_matches)))));
        $args['post__in'] = $ids ? $ids : array(0);
    }

    if ($category_id) {
        $args['tax_query'] = array(array(
            'taxonomy' => 'product_cat',
            'field' => 'term_id',
            'terms' => array($category_id),
            'include_children' => true,
        ));
    }
    if ($stock && in_array($stock, array('instock','outofstock','onbackorder'), true)) {
        $args['meta_query'] = array(array('key' => '_stock_status', 'value' => $stock));
    }

    $q = new WP_Query($args);
    $items = array();
    foreach ((array) $q->posts as $id) {
        $product = wc_get_product($id);
        if ($product) { $items[] = slb_sync_product_payload_152($product, $include_variations); }
    }

    return slb_sync_response_152(array(
        'items' => $items,
        'page' => $page,
        'per_page' => $per,
        'total' => (int) $q->found_posts,
        'pages' => max(1, (int) $q->max_num_pages),
        'orderby' => $orderby,
        'order' => $order,
    ), $started);
}

function slb_sync_merchant_orders_152($request) {
    $started = microtime(true);
    if (!function_exists('wc_get_orders')) {
        return new WP_Error('woocommerce_unavailable', 'WooCommerce unavailable', array('status' => 503));
    }
    $page = max(1, absint($request->get_param('page')));
    $per = min(50, max(1, absint($request->get_param('per_page') ?: 20)));
    $statuses = function_exists('wc_get_order_statuses') ? array_keys(wc_get_order_statuses()) : array(
        'wc-pending','wc-processing','wc-on-hold','wc-completed','wc-cancelled','wc-refunded','wc-failed'
    );

    $result = wc_get_orders(array(
        'limit' => $per,
        'page' => $page,
        'paginate' => true,
        'orderby' => 'date',
        'order' => 'DESC',
        'return' => 'objects',
        'status' => $statuses,
    ));
    if (is_wp_error($result)) { return $result; }
    if (!is_object($result) || !isset($result->orders)) {
        return new WP_Error('orders_query_failed', 'WooCommerce order query returned an invalid response', array('status' => 500));
    }

    $items = array();
    foreach ((array) $result->orders as $order) {
        if (!$order || !is_a($order, 'WC_Order')) { continue; }
        $lines = array();
        foreach ($order->get_items() as $item_id => $item) {
            $lines[] = array(
                'id' => (int) $item_id,
                'product_id' => (int) $item->get_product_id(),
                'variation_id' => (int) $item->get_variation_id(),
                'name' => (string) $item->get_name(),
                'quantity' => (int) $item->get_quantity(),
                'total' => (string) $item->get_total(),
            );
        }
        $created = $order->get_date_created();
        $items[] = array(
            'id' => (int) $order->get_id(),
            'number' => (string) $order->get_order_number(),
            'customer' => trim((string) $order->get_formatted_billing_full_name()) ?: 'Customer',
            'status' => (string) $order->get_status(),
            'payment_state' => $order->is_paid() ? 'paid' : 'unpaid',
            'payment_method' => (string) $order->get_payment_method(),
            'payment_method_title' => (string) $order->get_payment_method_title(),
            'currency' => (string) $order->get_currency(),
            'total_raw' => (string) $order->get_total(),
            'total' => html_entity_decode(wp_strip_all_tags($order->get_formatted_order_total()), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'date' => $created ? $created->date_i18n('Y-m-d H:i') : '',
            'date_created' => $created ? $created->date('c') : '',
            'billing' => $order->get_address('billing'),
            'shipping' => $order->get_address('shipping'),
            'items' => $lines,
        );
    }

    return slb_sync_response_152(array(
        'items' => $items,
        'page' => $page,
        'per_page' => $per,
        'total' => (int) $result->total,
        'pages' => max(1, (int) $result->max_num_pages),
        'statuses' => $statuses,
    ), $started);
}

add_action('rest_api_init', function() {
    register_rest_route('shishalove/v1', '/merchant/products', array(
        'methods' => 'GET',
        'permission_callback' => 'slb_merchant_permission',
        'callback' => 'slb_sync_merchant_products_152',
    ), true);
    register_rest_route('shishalove/v1', '/merchant/orders', array(
        'methods' => 'GET',
        'permission_callback' => 'slb_merchant_permission',
        'callback' => 'slb_sync_merchant_orders_152',
    ), true);
}, 120);

'''
anchor = 'function slb_render_shell($mode) {'
if anchor not in php:
    raise SystemExit('render shell anchor missing')
php = php.replace(anchor, sync_php + anchor, 1)
php_path.write_text(php, encoding='utf-8')

final_js = merchant.read_text(encoding='utf-8')
final_php = php_path.read_text(encoding='utf-8')
customer = (root / 'assets' / 'customer.js').read_text(encoding='utf-8')

assert "CFG.version='1.1.52';" in final_js
assert "MERCHANT_STAGING_REST" not in final_js
assert "MERCHANT_ORDER_REST" not in final_js
assert "MERCHANT_CANONICAL_REST" in final_js
assert "function apiOnce(" in final_js
assert "include_variations=1" in final_js
assert "orderby=date&order=DESC" in final_js
assert "function syncLatestOrders(" in final_js
assert "page=Math.max(1,Number(state.page)||1)" in final_js
assert "window.setInterval(function(){if(!document.hidden)syncLatestOrders(true);},15000)" in final_js
assert "function slb_sync_merchant_products_152" in final_php
assert "function slb_sync_merchant_orders_152" in final_php
assert "'stock_quantity' => $product->get_stock_quantity()" in final_php
assert "'variations' => $variations" in final_php
assert "'status' => $statuses" in final_php
assert "'Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0'" in final_php
assert "register_rest_route('shishalove/v1', '/merchant/products'" in final_php
assert "register_rest_route('shishalove/v1', '/merchant/orders'" in final_php
assert "var BUILD='1.1.45';" in customer
assert "function frontPageMarkup()" in customer

print('ShishaLove Bridge 1.1.52: canonical Merchant sync + no-store dynamic data + deduped refresh applied; Customer frozen')
