#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.48.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.47.py'), str(root)])

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

t = once(t, "CFG.version='1.1.47';", "CFG.version='1.1.48';", 'merchant cfg')
t = once(t, "slbfix','1.1.47'", "slbfix','1.1.48'", 'merchant css bust')
t = once(t, 'Bridge 1.1.47', 'Bridge 1.1.48', 'merchant bridge label')
t = once(t, "var DATA_CACHE='merchant-v147';", "var DATA_CACHE='merchant-v148';", 'merchant cache generation')

# Dedicated production-live orders route. This deliberately bypasses the older
# generic Merchant orders route that regressed in production while staging stayed healthy.
t = t.replace(
    "api('merchant/orders?page=1&per_page=20&_slm_fresh='+Date.now(),{cache:'no-store'})",
    "api('merchant/orders-live?page=1&per_page=20&_slm_fresh='+Date.now(),{cache:'no-store'})"
)

# If the live request is slow/fails, never strand the user on skeleton rows.
# Paint any previous cached orders immediately; otherwise show a concise retry state.
t = replace_func(t, 'loadOrders', r'''function loadOrders(force,allowNotify){
  var key=ordersKey(),cached=cget(key,0);
  if(cached){
    state.orders=cached;
    if(state.view==='orders')render();
    if(!force)return;
  }
  if(merchantOrderBusy)return;
  merchantOrderBusy=true;
  var controller=typeof AbortController!=='undefined'?new AbortController():null;
  var timeout=controller?setTimeout(function(){try{controller.abort();}catch(e){}},6500):0;
  var opts={cache:'no-store'};
  if(controller)opts.signal=controller.signal;
  api('merchant/orders-live?page=1&per_page=20&_slm_fresh='+Date.now(),opts).then(function(d){
    acceptFreshOrders(d,allowNotify);
  }).catch(function(){
    if(!state.orders){
      state.orders={items:[],page:1,per_page:20,total:0,pages:1,_loadError:true};
      if(state.view==='orders')render();
    }
  }).finally(function(){
    if(timeout)clearTimeout(timeout);
    merchantOrderBusy=false;
  });
}''')

# Friendly retry instead of endless ghost rows when there is genuinely no cache.
t = once(
    t,
    "function ordersBody(){var d=state.orders||cget(ordersKey(),0);var items=d&&d.items||[];return '<main class="slm-page"><div class="slm-head"><div><h1>Orders</h1><div class="slm-muted">Latest WooCommerce orders</div></div></div><section>'+((d)?orderRows(items):ghostRows(6))+'</section>'+pagerMarkup(d)+'</main>';}",
    "function ordersBody(){var d=state.orders||cget(ordersKey(),0),items=d&&d.items||[];var body=!d?ghostRows(6):(d._loadError?'<div class="slm-empty" style="padding:36px 0;text-align:center"><p>Could not refresh orders.</p><button class="slb-primary" data-act="refresh">TRY AGAIN</button></div>':orderRows(items));return '<main class="slm-page"><div class="slm-head"><div><h1>Orders</h1><div class="slm-muted">Latest WooCommerce orders</div></div></div><section>'+body+'</section>'+pagerMarkup(d)+'</main>';}",
    'orders retry state'
)

merchant.write_text(t, encoding='utf-8')

php_path = root / 'shishalove-app-bridge.php'
php = php_path.read_text(encoding='utf-8')

live_orders = r'''
function slb_orders_live($request) {
    if (!function_exists('wc_get_orders')) {
        return new WP_Error('woocommerce_unavailable', 'WooCommerce unavailable', array('status' => 503));
    }

    $page = max(1, absint($request->get_param('page')));
    $per = min(50, max(1, absint($request->get_param('per_page') ?: 20)));

    $result = wc_get_orders(array(
        'limit' => $per,
        'page' => $page,
        'paginate' => true,
        'orderby' => 'date',
        'order' => 'DESC',
        'return' => 'objects',
    ));

    if (is_wp_error($result)) { return $result; }

    $items = array();
    foreach ((array) $result->orders as $order) {
        if (!$order) { continue; }
        $items[] = array(
            'id' => (int) $order->get_id(),
            'number' => (string) $order->get_order_number(),
            'customer' => trim((string) $order->get_formatted_billing_full_name()) ?: 'Customer',
            'status' => (string) $order->get_status(),
            'total' => html_entity_decode(wp_strip_all_tags($order->get_formatted_order_total()), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'date' => $order->get_date_created() ? $order->get_date_created()->date_i18n('Y-m-d H:i') : '',
        );
    }

    return array(
        'items' => $items,
        'page' => $page,
        'per_page' => $per,
        'total' => (int) $result->total,
        'pages' => max(1, (int) $result->max_num_pages),
        'server_time' => time(),
    );
}

'''
marker = "function slb_cart_boot() {"
if marker not in php:
    raise SystemExit('slb_cart_boot marker missing')
php = php.replace(marker, live_orders + marker, 1)

route_anchor = "    register_rest_route('shishalove/v1', '/merchant/orders', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_orders'));"
route_replacement = route_anchor + "
    register_rest_route('shishalove/v1', '/merchant/orders-live', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_orders_live'));"
php = once(php, route_anchor, route_replacement, 'live orders route')

php_path.write_text(php, encoding='utf-8')

final_js = merchant.read_text(encoding='utf-8')
final_php = php_path.read_text(encoding='utf-8')
customer = (root / 'assets' / 'customer.js').read_text(encoding='utf-8')

assert "CFG.version='1.1.48'" in final_js
assert "var DATA_CACHE='merchant-v148';" in final_js
assert "merchant/orders-live?page=1&per_page=20" in final_js
assert "AbortController" in final_js
assert "6500" in final_js
assert "Could not refresh orders." in final_js
assert "function slb_orders_live($request)" in final_php
assert "/merchant/orders-live" in final_php
assert "return' => 'objects'" in final_php
assert "server_time" in final_php
assert "var BUILD='1.1.45';" in customer
assert "function frontPageMarkup()" in customer
print('ShishaLove Bridge 1.1.48: production Orders hotfix applied; Customer 1.1.45 preserved')
