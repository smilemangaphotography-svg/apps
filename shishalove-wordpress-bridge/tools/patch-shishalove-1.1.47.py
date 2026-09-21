#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.47.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.46.py'), str(root)])

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

t = once(t, "CFG.version='1.1.46';", "CFG.version='1.1.47';", 'merchant cfg')
t = once(t, "slbfix','1.1.46'", "slbfix','1.1.47'", 'merchant css bust')
t = once(t, 'Bridge 1.1.46', 'Bridge 1.1.47', 'merchant bridge label')
t = once(t, "var DATA_CACHE='merchant-v146';", "var DATA_CACHE='merchant-v147';", 'merchant cache generation')

old_notify = r'''function notifyNativeOrder(o){
  if(!o)return;
  try{
    if(window.ShishaLoveNative&&typeof window.ShishaLoveNative.notifyOrder==='function'){
      window.ShishaLoveNative.notifyOrder(String(o.number||o.id||''),String(o.customer||'Customer'),String(o.total||''));
    }
  }catch(e){}
}'''
new_notify = r'''function notifyNativeOrder(o){
  if(!o)return;
  try{
    if(window.ShishaLoveNative&&typeof window.ShishaLoveNative.notifyOrderWithId==='function'){
      window.ShishaLoveNative.notifyOrderWithId(String(o.id||0),String(o.number||o.id||''),String(o.customer||'Customer'),String(o.total||''));
    }else if(window.ShishaLoveNative&&typeof window.ShishaLoveNative.notifyOrder==='function'){
      window.ShishaLoveNative.notifyOrder(String(o.number||o.id||''),String(o.customer||'Customer'),String(o.total||''));
    }
  }catch(e){}
}'''
t = once(t, old_notify, new_notify, 'order notification ID bridge')

# Order details must stay in Orders context and repaint from cache immediately.
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

merchant.write_text(t, encoding='utf-8')

php_path = root / 'shishalove-app-bridge.php'
php = php_path.read_text(encoding='utf-8')

device_helpers = r'''
function slb_merchant_latest_order_id() {
    if (!function_exists('wc_get_orders')) { return 0; }
    $orders = wc_get_orders(array(
        'limit' => 1,
        'orderby' => 'date',
        'order' => 'DESC',
        'return' => 'objects',
    ));
    if (!$orders) { return 0; }
    return (int) $orders[0]->get_id();
}

function slb_merchant_device_store() {
    $devices = get_option('slb_merchant_order_devices_v1', array());
    return is_array($devices) ? $devices : array();
}

function slb_merchant_save_device_store($devices) {
    update_option('slb_merchant_order_devices_v1', is_array($devices) ? $devices : array(), false);
}

function slb_merchant_register_order_device() {
    if (!slb_merchant_permission()) {
        return new WP_Error('forbidden', 'Merchant permission required', array('status' => 403));
    }

    $devices = slb_merchant_device_store();
    $cutoff = time() - (90 * DAY_IN_SECONDS);
    foreach ($devices as $key => $meta) {
        $created = isset($meta['created']) ? (int) $meta['created'] : 0;
        if (!$created || $created < $cutoff) { unset($devices[$key]); }
    }

    $token = wp_generate_password(64, false, false);
    $hash = hash('sha256', $token);
    $devices[$hash] = array(
        'user_id' => get_current_user_id(),
        'created' => time(),
        'last_used' => time(),
    );

    if (count($devices) > 20) {
        uasort($devices, function($a, $b) {
            return (int) ($a['created'] ?? 0) <=> (int) ($b['created'] ?? 0);
        });
        while (count($devices) > 20) { array_shift($devices); }
    }

    slb_merchant_save_device_store($devices);

    return array(
        'token' => $token,
        'latest_order_id' => slb_merchant_latest_order_id(),
        'poll_seconds' => 60,
        'server_time' => time(),
    );
}

function slb_merchant_validate_order_device($request) {
    $token = trim((string) $request->get_header('x-shishalove-device'));
    if ($token === '') { return false; }

    $hash = hash('sha256', $token);
    $devices = slb_merchant_device_store();
    if (empty($devices[$hash]) || !is_array($devices[$hash])) { return false; }

    $meta = $devices[$hash];
    $created = isset($meta['created']) ? (int) $meta['created'] : 0;
    if (!$created || $created < time() - (90 * DAY_IN_SECONDS)) { return false; }

    $user_id = isset($meta['user_id']) ? (int) $meta['user_id'] : 0;
    $user = $user_id ? get_user_by('id', $user_id) : false;
    if (!$user || !(user_can($user, 'manage_woocommerce') || user_can($user, 'edit_products'))) { return false; }

    $devices[$hash]['last_used'] = time();
    slb_merchant_save_device_store($devices);
    return true;
}

function slb_merchant_order_pulse($request) {
    if (!slb_merchant_validate_order_device($request)) {
        return new WP_Error('invalid_device', 'Invalid or expired Merchant device token', array('status' => 401));
    }
    if (!function_exists('wc_get_orders')) {
        return new WP_Error('woocommerce_unavailable', 'WooCommerce unavailable', array('status' => 503));
    }

    $orders = wc_get_orders(array(
        'limit' => 10,
        'orderby' => 'date',
        'order' => 'DESC',
        'return' => 'objects',
    ));
    $items = array();
    foreach ((array) $orders as $order) {
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
        'latest_order_id' => $items ? (int) $items[0]['id'] : 0,
        'server_time' => time(),
    );
}

'''
rest_marker = "add_action('rest_api_init', function() {"
if rest_marker not in php:
    raise SystemExit('rest_api_init marker missing')
php = php.replace(rest_marker, device_helpers + rest_marker, 1)

route_anchor = "    register_rest_route('shishalove/v1', '/merchant/orders', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_orders'));"
route_replacement = route_anchor + r'''
    register_rest_route('shishalove/v1', '/merchant/device-register', array(
        'methods' => 'POST',
        'permission_callback' => 'slb_merchant_permission',
        'callback' => function(){ return slb_merchant_register_order_device(); },
    ));
    register_rest_route('shishalove/v1', '/merchant/order-pulse', array(
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'slb_merchant_order_pulse',
    ));'''
php = once(php, route_anchor, route_replacement, 'merchant background routes')
php_path.write_text(php, encoding='utf-8')

final_js = merchant.read_text(encoding='utf-8')
final_php = php_path.read_text(encoding='utf-8')
customer = (root / 'assets' / 'customer.js').read_text(encoding='utf-8')

assert "CFG.version='1.1.47'" in final_js
assert "var DATA_CACHE='merchant-v147';" in final_js
assert "ShishaLoveNative.notifyOrderWithId" in final_js
assert "window.SLM_OPEN_ORDER=function(id)" in final_js
assert "function orderDetailKey(id)" in final_js
assert "state.view='orders';state.page=1" in final_js
assert "if(state.orderDetail&&state.orderDetail.id){openOrder(state.orderDetail.id,true);return;}" in final_js
assert "/merchant/device-register" in final_php
assert "/merchant/order-pulse" in final_php
assert "slb_merchant_order_devices_v1" in final_php
assert "x-shishalove-device" in final_php
assert "var BUILD='1.1.45';" in customer
assert "function frontPageMarkup()" in customer
print('ShishaLove Bridge 1.1.47: Beta 7 Merchant behavior finalized; Customer 1.1.45 preserved')
