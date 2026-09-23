#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.53.py <plugin-dir>')
root=Path(sys.argv[1])
tools=Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.52.py'), str(root)])

def once(t,o,n,label):
    c=t.count(o)
    if c!=1: raise SystemExit(f'{label}: expected 1 got {c}')
    return t.replace(o,n,1)

def replace_func(t,name,repl):
    marker='function '+name+'('
    s=t.find(marker)
    if s<0: raise SystemExit('missing '+name)
    m=re.search(r'\nfunction\s+[A-Za-z0-9_]+\(',t[s+1:])
    if not m: raise SystemExit('next missing '+name)
    e=s+1+m.start()+1
    return t[:s]+repl.rstrip()+'\n'+t[e:]

def replace_last_func(t,name,end_marker,repl):
    marker='function '+name+'('
    s=t.find(marker)
    if s<0: raise SystemExit('missing '+name)
    e=t.find(end_marker,s)
    if e<0: raise SystemExit('end marker missing '+name)
    return t[:s]+repl.rstrip()+'\n'+t[e:]

p=root/'assets/merchant.js'; t=p.read_text()
t=once(t,"CFG.version='1.1.52';","CFG.version='1.1.53';",'version')
t=once(t,"var DATA_CACHE='production-beta-lock-v1';","var DATA_CACHE='merchant-live-v153';",'cache namespace')
t=once(t,"var merchantManualRefreshPromise=null;\nvar SLM_SYNC_DEBUG=false;","var merchantManualRefreshPromise=null;\nvar merchantNonceRefreshPromise=null;\nvar SLM_SYNC_DEBUG=false;",'nonce var')

t=replace_func(t,'api',r'''function refreshMerchantRestNonce(){
  if(merchantNonceRefreshPromise)return merchantNonceRefreshPromise;
  var body='action=slb_merchant_rest_nonce_153&_slm_net='+Date.now();
  merchantNonceRefreshPromise=fetch(CFG.ajax,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Cache-Control':'no-cache','Pragma':'no-cache'},body:body}).then(function(r){
    return r.text().then(function(raw){var d={};try{d=raw?JSON.parse(raw):{};}catch(e){}if(!r.ok||!d||!d.success||!d.data||!d.data.nonce){var er=new Error(d&&d.data&&d.data.message?d.data.message:'Could not refresh REST nonce');er.status=r.status;throw er;}CFG.restNonce=String(d.data.nonce);return CFG.restNonce;});
  });
  return merchantNonceRefreshPromise.then(function(v){merchantNonceRefreshPromise=null;return v;},function(e){merchantNonceRefreshPromise=null;throw e;});
}
function api(path,opts){
  opts=opts||{};
  var method=String(opts.method||'GET').toUpperCase(),body=opts.body,baseHeaders=opts.headers||{},retried=!!opts._slmNonceRetried;
  function request(){
    var h={};Object.keys(baseHeaders).forEach(function(k){h[k]=baseHeaders[k];});
    if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;
    if(body&&!h['Content-Type'])h['Content-Type']='application/json';
    if(method==='GET'){h['Cache-Control']='no-cache';h['Pragma']='no-cache';}
    var url=MERCHANT_CANONICAL_REST+path;
    if(method==='GET'&&/^merchant\//.test(path))url+=(url.indexOf('?')>=0?'&':'?')+'_slm_net='+Date.now();
    var started=Date.now();
    return fetch(url,{method:method,body:body,headers:h,credentials:'same-origin',cache:method==='GET'?'no-store':opts.cache}).then(function(r){
      var status=r.status;
      return r.text().then(function(raw){
        var data={};
        if(raw){try{data=JSON.parse(raw);}catch(parseError){var bad=new Error('Invalid JSON from Merchant API');bad.status=status;bad.endpoint=url;throw bad;}}
        if(!r.ok){
          var msg=data&&data.message?String(data.message):('HTTP '+status),code=data&&data.code?String(data.code):'';
          var err=new Error(msg);err.status=status;err.code=code;err.payload=data;err.endpoint=url;
          if(!retried&&(status===401||status===403)&&(code==='rest_cookie_invalid_nonce'||code==='rest_forbidden')){
            return refreshMerchantRestNonce().then(function(){retried=true;return request();});
          }
          throw err;
        }
        slmSyncLog('RESPONSE',{path:path,status:status,count:data&&data.items?data.items.length:undefined,total:data&&data.total,pages:data&&data.pages,server_ms:data&&data.server_ms,elapsed_ms:Date.now()-started,time:new Date().toISOString()});
        return data;
      });
    });
  }
  return request().then(null,function(err){slmSyncLog('ERROR',{path:path,endpoint:err&&err.endpoint,status:err&&err.status||0,code:err&&err.code||'',message:String(err&&err.message||err),time:new Date().toISOString()});throw err;});
}''')

t=replace_func(t,'productCacheKey',r'''function productCacheKey(stock){return vkey('slm-products-'+state.page+'-'+state.per+'-'+state.categoryId+'-'+state.stockStatus+'-'+state.query.toLowerCase());}''')

t=replace_func(t,'categoryOptions',r'''function categoryOptions(){var all=state.bootstrap&&state.bootstrap.categories&&state.bootstrap.categories.all||[];return all.map(function(c){return '<option value="'+c.id+'"'+(Number(state.categoryId)===Number(c.id)?' selected':'')+'>'+esc(decodeEntities(c.name))+'</option>';}).join('');}''')

t=replace_func(t,'topFilterTabs',r'''function topFilterTabs(){var all=state.bootstrap&&state.bootstrap.categories&&state.bootstrap.categories.all||[];var wanted=['Hookah','Bowls','Accessories'],out=[];wanted.forEach(function(name){for(var i=0;i<all.length;i++){if(decodeEntities(String(all[i].name)).toLowerCase()===name.toLowerCase()){out.push(all[i]);break;}}});return out.map(function(c){return '<button class="'+(Number(state.categoryId)===Number(c.id)?'active':'')+'" data-filter-cat="'+c.id+'">'+esc(decodeEntities(c.name))+'</button>';}).join('');}''')

t=replace_func(t,'fastProductImage',r'''function fastProductImage(src){return String(src||'');}
function productImageMarkup(p){
  var src=String(p&&p.image||''),fallback=String(p&&p.image_full||'');
  if(!src&&fallback)src=fallback;
  if(!src)return '<span class="slm-product-thumb missing" aria-label="No product image"></span>';
  return '<span class="slm-product-thumb"><img src="'+esc(src)+'" data-fallback="'+esc(fallback)+'" loading="lazy" decoding="async" alt="" onerror="var f=this.dataset.fallback||\'\';if(f&&this.src!==f){this.dataset.fallback=\'\';this.src=f;}else{this.onerror=null;this.hidden=true;this.parentNode.classList.add(\'missing\');}"></span>';
}''')

t=replace_func(t,'productRows',r'''function productRows(items){if(!items.length)return '<div class="slm-empty">No matching products.</div>';return items.map(function(p){var stockClass=p.stock_status==='instock'?'slm-green':'';var stockLabel=p.stock_status==='instock'?'In stock':p.stock_status==='outofstock'?'Out of stock':p.stock_status==='onbackorder'?'On backorder':p.stock_status;return '<article class="slm-product-row" data-edit="'+p.id+'">'+productImageMarkup(p)+'<div><h3>'+esc(decodeEntities(p.name))+'</h3><p>'+esc(decodeEntities(p.price_html||p.regular_price||''))+'</p><p class="'+stockClass+'">● '+esc(stockLabel||'')+'</p></div><button class="slm-more" aria-label="Edit">⋮</button></article>';}).join('');}''')

t=replace_func(t,'loadProducts',r'''function loadProducts(stock,force){
  var key=productCacheKey(stock),cached=cget(key,0),name=stock?'stock':'products';
  if(String(state.query||'').trim()!=='')return loadExactSearch(stock,force);
  state.searchPools[name]=null;
  if(cached&&!force){state.productsByView.products=cached;state.productsByView.stock=cached;if(state.view===name){render();restoreMerchantScroll(false);}}
  var url=buildProductUrl(stock,state.page,state.per),requestKey='products|'+url;
  return apiOnce(requestKey,url,{cache:'no-store'}).then(function(d){
    d=d||{items:[],page:state.page,per_page:state.per,total:0,pages:1};d._syncedAt=Date.now();cset(key,d);merchantSyncErrors.products=null;
    state.productsByView.products=d;state.productsByView.stock=d;setDashboardTotal('products',d.total);
    if(key===productCacheKey(stock)&&state.view===name){render();restoreMerchantScroll(true);}return d;
  },function(err){
    merchantSyncErrors.products={message:String(err&&err.message||err),status:err&&err.status||0,code:err&&err.code||'',endpoint:err&&err.endpoint||'',time:Date.now()};
    if(!state.productsByView[name]&&!cached){state.productsByView[name]={items:[],page:state.page,per_page:state.per,total:0,pages:1,_loadError:true};if(state.view===name){render();restoreMerchantScroll(true);}}else{restoreMerchantScroll(true);}return null;
  });
}''')

t=replace_func(t,'ordersBody',r'''function ordersBody(){
  var data=state.orders||cget(ordersKey(),0),items=data&&data.items||[],body;
  if(!data)body=ghostRows(5);
  else if(data._loadError){var er=merchantSyncErrors.orders||{},diag='<div class="slm-sync-diagnostic">HTTP '+esc(er.status||0)+' · '+esc(er.code||'error')+'<br>'+esc(er.message||'Unknown error')+'<br>'+esc(er.endpoint||'merchant/orders')+'</div>';body='<div class="slm-empty" style="padding:36px 0;text-align:center"><p>Could not refresh orders.</p>'+diag+'<button class="slb-primary" data-act="refresh">TRY AGAIN</button></div>';}
  else body=orderRows(items);
  return '<main class="slm-page"><div class="slm-head"><div><h1>Orders</h1><div class="slm-muted">Latest WooCommerce orders</div></div></div><section id="slm-orders">'+body+'</section>'+pagerMarkup(data)+'</main>';
}''')

t=replace_func(t,'orderPanel',r'''function orderPanel(){var d=state.orderDetail;if(!d)return '<section class="slm-order-panel"></section>';if(d.loading)return '<section class="slm-order-panel open"><div class="slm-order-panel-head"><button data-act="close-order">←</button><h2>Order</h2><span></span></div>'+ghostRows(6)+'</section>';var statuses=(d.statuses||[]).map(function(s){return '<option value="'+esc(s.value)+'"'+(s.value===d.status?' selected':'')+'>'+esc(decodeEntities(s.label))+'</option>';}).join('');var items=(d.items||[]).map(function(x){return '<div class="slm-order-line">'+(x.image?'<img src="'+esc(x.image)+'" alt="">':'<span></span>')+'<div><b>'+esc(decodeEntities(x.name))+'</b><div class="slm-muted">Qty '+x.quantity+' · '+esc(decodeEntities(x.total))+'</div></div></div>';}).join('');return '<section class="slm-order-panel open"><div class="slm-order-panel-head"><button data-act="close-order">←</button><h2>Order #'+esc(d.number)+'</h2><span></span></div><div class="slm-order-detail"><div class="slm-order-meta">'+(d.payment_method?'<p>'+esc(decodeEntities(d.payment_method))+'</p>':'')+'<h3>General</h3><label>Date created</label><div class="slm-readonly">'+esc(d.date)+'</div><label>Status</label><select id="slm-order-status">'+statuses+'</select><label>Customer</label><div class="slm-readonly">'+esc(decodeEntities(d.customer_account||((d.billing&&[d.billing.first_name,d.billing.last_name].filter(Boolean).join(' '))||'Guest')))+'</div></div><div class="slm-address-grid"><section><h3>Billing</h3>'+addressLines(d.billing,true)+'</section><section><h3>Shipping</h3>'+addressLines(d.shipping,false)+'</section></div><section class="slm-order-items"><h3>Order items</h3>'+items+'<div class="slm-order-total"><span>Subtotal</span><b>'+esc(decodeEntities(d.subtotal||''))+'</b></div>'+(d.shipping_total?'<div class="slm-order-total"><span>Shipping</span><b>'+esc(decodeEntities(d.shipping_total))+'</b></div>':'')+'<div class="slm-order-total final"><span>Total</span><b>'+esc(decodeEntities(d.total||''))+'</b></div></section>'+(d.customer_note?'<section class="slm-order-note"><h3>Customer note</h3><p>'+esc(decodeEntities(d.customer_note))+'</p></section>':'')+'</div></section>';}''')

t=replace_func(t,'acceptFreshOrders',r'''function acceptFreshOrders(d,allowNotify,page){
  page=Math.max(1,Number(page||d&&d.page||1)||1);var items=d&&d.items||[],latest=0,previous=lastSeenOrderId();
  if(d){d._syncedAt=Date.now();cset(ordersKey(page),d);setDashboardTotal('orders',d.total);}
  if(page===1){items.forEach(function(o){latest=Math.max(latest,Number(o.id)||0);});if(latest>0){if(previous>0&&allowNotify!==false&&latest>previous){items.filter(function(o){return (Number(o.id)||0)>previous;}).sort(function(a,b){return Number(a.id)-Number(b.id);}).forEach(notifyNativeOrder);}if(latest>previous)rememberOrderId(latest);}}
  if(page===state.page){state.orders=d;if(state.view==='orders')render();}
}''')

t=once(t,"merchantSyncErrors.orders={message:String(err&&err.message||err),status:err&&err.status||0,time:Date.now()};","merchantSyncErrors.orders={message:String(err&&err.message||err),status:err&&err.status||0,code:err&&err.code||'',endpoint:err&&err.endpoint||'',time:Date.now()};",'order error details')

t=replace_func(t,'loadDashboardStats',r'''function setDashboardTotal(kind,total){if(!dashboardStats)dashboardStats={products:null,orders:null};dashboardStats[kind]=Number(total||0);if(state.view==='dashboard')render();}
function loadDashboardStats(force){
  if(dashboardStatsLoading||(!force&&dashboardStats&&dashboardStats.products!=null&&dashboardStats.orders!=null))return Promise.resolve(dashboardStats);
  dashboardStatsLoading=true;
  var pp=apiOnce('dashboard-products','merchant/products?page=1&per_page=1&search=&orderby=date&order=DESC&include_variations=0',{cache:'no-store'}).then(function(d){setDashboardTotal('products',d&&d.total);return d;});
  var op=fetchOrdersPage(1,false);
  return Promise.all([pp,op]).then(function(){dashboardStatsLoading=false;if(state.view==='dashboard')render();return dashboardStats;},function(){dashboardStatsLoading=false;if(state.view==='dashboard')render();return dashboardStats;});
}''')

t=replace_func(t,'dashboardBody',r'''function dashboardBody(){
  var pc=cget(productCacheKey(false),0),oc=state.orders||cget(ordersKey(1),0);if(!dashboardStats)loadDashboardStats(false);
  var products=dashboardStats&&dashboardStats.products!=null?dashboardStats.products:(pc&&pc.total!=null?pc.total:'—');
  var orders=dashboardStats&&dashboardStats.orders!=null?dashboardStats.orders:(oc&&!oc._loadError&&oc.total!=null?oc.total:'—');
  return '<main class="slm-page"><div class="slm-head"><div><h1>Dashboard</h1><div class="slm-muted">WooCommerce overview</div></div></div><div class="slm-dashboard-grid"><div class="slm-stat"><b>'+products+'</b><span>Products</span></div><div class="slm-stat"><b>'+orders+'</b><span>Orders</span></div></div><button class="slb-primary" style="margin-top:18px" data-view="products">MANAGE PRODUCTS</button></main>';
}''')

t=once(t,'Bridge 1.1.52','Bridge 1.1.53','more version')

t=replace_func(t,'quickCard',r'''function quickCard(c){return '<button type="button" class="slm-quick-card '+(selected(c.id)?'sel':'')+'" data-cat-toggle="'+c.id+'">'+(c.image?'<img src="'+esc(c.image)+'" alt="">':'')+'<span>'+esc(decodeEntities(c.name))+'</span></button>';}''')
t=replace_func(t,'catOption',r'''function catOption(c){return '<label class="slm-cat-option"><input type="checkbox" data-cat-check="'+c.id+'" '+(selected(c.id)?'checked':'')+'><span>'+esc(decodeEntities(c.name))+'</span></label>';}''')

t=replace_func(t,'refresh',r'''function refresh(){
  if(state.orderDetail&&state.orderDetail.id){openOrder(state.orderDetail.id,true);return;}
  if(state.view==='media-library'){loadMediaManager(true);return;}
  if(merchantManualRefreshPromise)return merchantManualRefreshPromise;
  var jobs=[];
  if(state.view==='products')jobs.push(loadProducts(false,true));
  else if(state.view==='stock')jobs.push(loadProducts(true,true));
  else if(state.view==='orders')jobs.push(loadOrders(true,true));
  else jobs.push(apiOnce('dashboard-products','merchant/products?page=1&per_page=20&search=&orderby=date&order=DESC&include_variations=1',{cache:'no-store'}).then(function(d){if(d){d._syncedAt=Date.now();cset(productCacheKey(false),d);state.productsByView.products=d;state.productsByView.stock=d;setDashboardTotal('products',d.total);}return d;}));
  if(!(state.view==='orders'&&state.page===1))jobs.push(syncLatestOrders(true));
  if(state.view==='more')jobs.push(bootstrap(true));
  merchantManualRefreshPromise=Promise.all(jobs.map(function(p){return Promise.resolve(p).then(function(v){return v;},function(){return null;});}));
  return merchantManualRefreshPromise.then(function(v){merchantManualRefreshPromise=null;if(state.view==='dashboard')render();return v;},function(e){merchantManualRefreshPromise=null;throw e;});
}''')

t=replace_last_func(t,'bootstrap','\nrender();bootstrap(false);startMerchantOrderSync();',r'''function bootstrap(force){
  var key=vkey('slm-bootstrap'),cached=cget(key,0),startedProducts=false;
  if(cached){
    state.bootstrap=cached;
    hydrateViewFromCache(state.view);render();
    if(state.view==='products'){startedProducts=true;loadProducts(false,false);}
    else if(state.view==='stock'){startedProducts=true;loadProducts(true,false);}
    else if(state.view==='orders')loadOrders(false,false);
    setTimeout(prefetchMediaManager,0);
  }
  return apiOnce('bootstrap','merchant/bootstrap',{cache:'no-store'}).then(function(d){
    state.bootstrap=d;CFG.restNonce=d.nonce||CFG.restNonce;
    var cacheCopy={};Object.keys(d||{}).forEach(function(k){if(k!=='nonce')cacheCopy[k]=d[k];});cset(key,cacheCopy);
    merchantSyncErrors.bootstrap=null;hydrateViewFromCache(state.view);render();
    if(!startedProducts&&state.view==='products')loadProducts(false,false);
    else if(!startedProducts&&state.view==='stock')loadProducts(true,false);
    else if(state.view==='orders'&&!state.orders)loadOrders(false,false);
    setTimeout(prefetchMediaManager,0);return d;
  },function(err){merchantSyncErrors.bootstrap={message:String(err&&err.message||err),status:err&&err.status||0,code:err&&err.code||'',endpoint:err&&err.endpoint||'',time:Date.now()};if(!state.bootstrap)render();return null;});
}''')

p.write_text(t)

cssp=root/'assets/bridge.css'; css=cssp.read_text()
css += r'''

/* ShishaLove 1.1.53 — Merchant post-update data/UI safety fixes only. */
body.slb-merchant .slm-product-thumb{width:54px;height:54px;display:grid;place-items:center;border-radius:8px;overflow:hidden;background:#f4f4f5;color:#9a9a9d;font-size:18px}
body.slb-merchant .slm-product-thumb img{display:block;width:54px!important;height:54px!important;object-fit:contain;border-radius:8px}
body.slb-merchant .slm-product-thumb.missing:after{content:'▧';font-size:22px;color:#aaa}
body.slb-merchant .slm-sync-diagnostic{margin:10px 0 16px;padding:10px;border:1px solid #ddd;border-radius:10px;background:#fafafa;color:#555;font:12px/1.35 monospace;text-align:left;overflow-wrap:anywhere}
@media(max-width:430px){
  body.slb-merchant .slm-page .slm-search{grid-template-columns:minmax(0,1fr) 94px!important;gap:8px!important}
  body.slb-merchant .slm-page .slm-search input{padding-left:12px!important;padding-right:10px!important;font-size:14px!important}
}
html.slb-android-app body.slb-merchant.slb-platform-android .slm-page{padding-bottom:calc(176px + var(--slb-native-bottom))!important}
'''
cssp.write_text(css)

php=root/'shishalove-app-bridge.php'; s=php.read_text()
s=s.replace('Version: 1.1.52','Version: 1.1.53',1).replace("define('SLB_VERSION', '1.1.52');","define('SLB_VERSION', '1.1.53');",1)
append=r'''

/** ShishaLove Merchant 1.1.53 post-update live-data correction layer. */
function slb_ajax_merchant_rest_nonce_153() {
    if (!slb_merchant_permission()) { wp_send_json_error(array('message' => 'Merchant permission required'), 403); }
    nocache_headers();
    wp_send_json_success(array('nonce' => wp_create_nonce('wp_rest'), 'server_time' => time()));
}
add_action('wp_ajax_slb_merchant_rest_nonce_153', 'slb_ajax_merchant_rest_nonce_153');

function slb_sync_product_payload_153($product, $include_variations = false) {
    $row = slb_sync_product_payload_152($product, $include_variations);
    if (!$row || !$product) { return $row; }
    $image_id = (int) $product->get_image_id();
    $thumb = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : '';
    $full = $image_id ? wp_get_attachment_image_url($image_id, 'full') : '';
    if (!$full && $image_id) { $full = wp_get_attachment_url($image_id); }
    if (!$thumb) { $thumb = $full; }
    $row['image_id'] = $image_id;
    $row['has_image'] = $image_id > 0 && ($thumb || $full);
    $row['image'] = $row['has_image'] ? (string) $thumb : '';
    $row['image_full'] = $row['has_image'] ? (string) $full : '';
    return $row;
}

function slb_sync_merchant_products_153($request) {
    $started = microtime(true);
    if (!function_exists('wc_get_product')) { return new WP_Error('woocommerce_unavailable', 'WooCommerce unavailable', array('status' => 503)); }
    global $wpdb;
    $page = max(1, absint($request->get_param('page')));
    $per = min(50, max(1, absint($request->get_param('per_page') ?: 20)));
    $search = sanitize_text_field((string) $request->get_param('search'));
    $category_id = absint($request->get_param('category_id'));
    $stock = sanitize_key((string) $request->get_param('stock_status'));
    $include_variations = rest_sanitize_boolean($request->get_param('include_variations'));
    $args = array(
        'post_type' => 'product','post_status' => array('publish','draft','pending','private'),'posts_per_page' => $per,'paged' => $page,
        'orderby' => array('date' => 'DESC', 'ID' => 'DESC'),'order' => 'DESC','fields' => 'ids','no_found_rows' => false,
        'update_post_meta_cache' => true,'update_post_term_cache' => true,
    );
    if ($search !== '') {
        $like = '%' . $wpdb->esc_like($search) . '%';
        $title_sku = $wpdb->get_col($wpdb->prepare("SELECT DISTINCT p.ID FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON pm.post_id=p.ID AND pm.meta_key='_sku' WHERE p.post_type='product' AND p.post_status IN ('publish','draft','pending','private') AND (p.post_title LIKE %s OR pm.meta_value LIKE %s) LIMIT 1500", $like, $like));
        $term_matches = $wpdb->get_col($wpdb->prepare("SELECT DISTINCT tr.object_id FROM {$wpdb->terms} t INNER JOIN {$wpdb->term_taxonomy} tt ON tt.term_id=t.term_id INNER JOIN {$wpdb->term_relationships} tr ON tr.term_taxonomy_id=tt.term_taxonomy_id INNER JOIN {$wpdb->posts} p ON p.ID=tr.object_id WHERE p.post_type='product' AND p.post_status IN ('publish','draft','pending','private') AND t.name LIKE %s LIMIT 1500", $like));
        $ids = array_values(array_unique(array_filter(array_map('absint', array_merge((array) $title_sku, (array) $term_matches)))));$args['post__in'] = $ids ? $ids : array(0);
    }
    if ($category_id) { $args['tax_query'] = array(array('taxonomy'=>'product_cat','field'=>'term_id','terms'=>array($category_id),'include_children'=>true)); }
    if ($stock && in_array($stock, array('instock','outofstock','onbackorder'), true)) { $args['meta_query'] = array(array('key'=>'_stock_status','value'=>$stock)); }
    $q = new WP_Query($args);$items = array();
    foreach ((array) $q->posts as $id) { $product = wc_get_product($id); if ($product) { $items[] = slb_sync_product_payload_153($product, $include_variations); } }
    return slb_sync_response_152(array('items'=>$items,'page'=>$page,'per_page'=>$per,'total'=>(int)$q->found_posts,'pages'=>max(1,(int)$q->max_num_pages),'orderby'=>'date','order'=>'DESC','first_id'=>$items ? (int)$items[0]['id'] : 0,'first_date_created'=>$items ? (string)$items[0]['date_created'] : ''), $started);
}

function slb_sync_merchant_orders_153($request) {
    $started = microtime(true);
    if (!function_exists('wc_get_orders')) { return new WP_Error('woocommerce_unavailable', 'WooCommerce unavailable', array('status' => 503)); }
    $page = max(1, absint($request->get_param('page')));$per = min(50, max(1, absint($request->get_param('per_page') ?: 20)));
    try {
        $result = wc_get_orders(array('limit'=>$per,'paged'=>$page,'paginate'=>true,'orderby'=>'date','order'=>'DESC','return'=>'objects','type'=>'shop_order'));
    } catch (Throwable $e) {
        return new WP_Error('orders_query_exception', $e->getMessage(), array('status'=>500));
    }
    if (is_wp_error($result)) { return $result; }
    if (!is_object($result) || !isset($result->orders)) { return new WP_Error('orders_query_failed', 'WooCommerce order query returned an invalid response', array('status'=>500)); }
    $items=array();
    foreach ((array)$result->orders as $order) {
        if (!$order || !is_a($order,'WC_Order')) { continue; }$lines=array();
        foreach ($order->get_items('line_item') as $item_id=>$item) {$lines[]=array('id'=>(int)$item_id,'product_id'=>(int)$item->get_product_id(),'variation_id'=>(int)$item->get_variation_id(),'name'=>(string)$item->get_name(),'quantity'=>(int)$item->get_quantity(),'total'=>(string)$item->get_total());}
        $created=$order->get_date_created();
        $items[]=array('id'=>(int)$order->get_id(),'number'=>(string)$order->get_order_number(),'customer'=>trim((string)$order->get_formatted_billing_full_name()) ?: 'Customer','status'=>(string)$order->get_status(),'payment_state'=>$order->is_paid()?'paid':'unpaid','payment_method'=>(string)$order->get_payment_method(),'payment_method_title'=>(string)$order->get_payment_method_title(),'currency'=>(string)$order->get_currency(),'total_raw'=>(string)$order->get_total(),'total'=>html_entity_decode(wp_strip_all_tags($order->get_formatted_order_total()),ENT_QUOTES|ENT_HTML5,'UTF-8'),'date'=>$created?$created->date_i18n('Y-m-d H:i'):'','date_created'=>$created?$created->date('c'):'','billing'=>$order->get_address('billing'),'shipping'=>$order->get_address('shipping'),'items'=>$lines);
    }
    $statuses=function_exists('wc_get_order_statuses')?array_keys(wc_get_order_statuses()):array('wc-pending','wc-processing','wc-on-hold','wc-completed','wc-cancelled','wc-refunded','wc-failed');
    return slb_sync_response_152(array('items'=>$items,'page'=>$page,'per_page'=>$per,'total'=>(int)$result->total,'pages'=>max(1,(int)$result->max_num_pages),'statuses'=>$statuses,'first_id'=>$items?(int)$items[0]['id']:0,'first_number'=>$items?(string)$items[0]['number']:'','first_date_created'=>$items?(string)$items[0]['date_created']:''),$started);
}

add_action('rest_api_init', function() {
    register_rest_route('shishalove/v1','/merchant/products',array('methods'=>'GET','permission_callback'=>'slb_merchant_permission','callback'=>'slb_sync_merchant_products_153'),true);
    register_rest_route('shishalove/v1','/merchant/orders',array('methods'=>'GET','permission_callback'=>'slb_merchant_permission','callback'=>'slb_sync_merchant_orders_153'),true);
}, 130);
'''
s += append
php.write_text(s)
