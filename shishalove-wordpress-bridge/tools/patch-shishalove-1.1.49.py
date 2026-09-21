#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.49.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.48.py'), str(root)])

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

t = once(t, "CFG.version='1.1.48';", "CFG.version='1.1.49';", 'merchant cfg')
t = once(t, "slbfix','1.1.48'", "slbfix','1.1.49'", 'merchant css bust')
t = once(t, 'Bridge 1.1.48', 'Bridge 1.1.49', 'merchant bridge label')
t = once(t, "var DATA_CACHE='merchant-v148';", "var DATA_CACHE='merchant-v149';", 'merchant cache generation')

# MASTER FIX 1 — navigation.
# Use one permanent delegated click listener on #slb-root. It survives every
# root.innerHTML render and prevents the Dashboard button from becoming dead.
nav_helper = r'''function installMerchantNavDelegation(){
  if(window.__SLM_NAV_DELEGATION_INSTALLED)return;
  window.__SLM_NAV_DELEGATION_INSTALLED=true;
  root.addEventListener('click',function(ev){
    var el=ev.target&&ev.target.closest?ev.target.closest('[data-view]'):null;
    if(!el||!root.contains(el))return;
    var view=String(el.getAttribute('data-view')||'');
    if(!view)return;
    ev.preventDefault();
    ev.stopPropagation();
    navigate(view);
  },true);
}
'''
bind_marker = 'function bind(){'
pos = t.find(bind_marker)
if pos < 0:
    raise SystemExit('bind marker missing')
t = t[:pos] + nav_helper + t[pos:]

old_nav_bind = "root.querySelectorAll('[data-view]').forEach(function(e){e.onclick=function(){navigate(this.dataset.view);};});"
t = once(t, old_nav_bind, "installMerchantNavDelegation();", 'delegated navigation binding')

# MASTER FIX 2 — Orders.
# Remove the 1.1.48 AbortController/finally path. Use the exact Beta-style
# request flow plus a simple independent timeout. No Promise.finally dependency.
order_runtime = r'''var merchantOrderRequestSeq=0;
function loadOrders(force,allowNotify){
  var key=ordersKey(),cached=cget(key,0);
  if(cached){
    state.orders=cached;
    if(state.view==='orders')render();
    if(!force)return;
  }
  if(merchantOrderBusy)return;
  merchantOrderBusy=true;
  var seq=++merchantOrderRequestSeq,finished=false;
  var timer=setTimeout(function(){
    if(finished||seq!==merchantOrderRequestSeq)return;
    merchantOrderBusy=false;
    if(!state.orders){
      state.orders={items:[],page:1,per_page:20,total:0,pages:1,_loadError:true};
      if(state.view==='orders')render();
    }
  },7000);

  api('merchant/orders-stable?page=1&per_page=20&_slm_fresh='+Date.now(),{cache:'no-store'}).then(function(d){
    if(seq!==merchantOrderRequestSeq)return;
    finished=true;clearTimeout(timer);merchantOrderBusy=false;
    acceptFreshOrders(d,allowNotify);
  },function(){
    if(seq!==merchantOrderRequestSeq)return;
    finished=true;clearTimeout(timer);merchantOrderBusy=false;
    if(!state.orders){
      state.orders={items:[],page:1,per_page:20,total:0,pages:1,_loadError:true};
      if(state.view==='orders')render();
    }
  });
}'''
t = replace_func(t, 'loadOrders', order_runtime)

# Dashboard uses the same proven stable Orders source, so it cannot depend on
# the older production orders route.
t = replace_func(t, 'loadDashboardStats', r'''function loadDashboardStats(force){
  if(dashboardStatsLoading||(!force&&dashboardStats))return;
  dashboardStatsLoading=true;
  Promise.all([
    api('merchant/products?page=1&per_page=1'),
    api('merchant/orders-stable?page=1&per_page=1&_slm_fresh='+Date.now(),{cache:'no-store'})
  ]).then(function(rows){
    dashboardStats={products:Number(rows[0]&&rows[0].total||0),orders:Number(rows[1]&&rows[1].total||0)};
    dashboardStatsLoading=false;
    if(state.view==='dashboard')render();
  },function(){
    dashboardStatsLoading=false;
    if(state.view==='dashboard')render();
  });
}''')

merchant.write_text(t, encoding='utf-8')

# MASTER FIX 3 — exact staging-proven WooCommerce Orders route in production.
php_path = root / 'shishalove-app-bridge.php'
php = php_path.read_text(encoding='utf-8')

stable_orders = r'''
function slb_orders_stable($request) {
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
marker = "function slb_orders_live($request) {"
if marker not in php:
    raise SystemExit('1.1.48 live orders function missing')
php = php.replace(marker, stable_orders + marker, 1)

route_anchor = "    register_rest_route('shishalove/v1', '/merchant/orders-live', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_orders_live'));"
route_replacement = route_anchor + "\n    register_rest_route('shishalove/v1', '/merchant/orders-stable', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_orders_stable'));"
php = once(php, route_anchor, route_replacement, 'stable orders route')

php_path.write_text(php, encoding='utf-8')

final_js = merchant.read_text(encoding='utf-8')
final_php = php_path.read_text(encoding='utf-8')
customer = (root / 'assets' / 'customer.js').read_text(encoding='utf-8')

assert "CFG.version='1.1.49'" in final_js
assert "var DATA_CACHE='merchant-v149';" in final_js
assert "function installMerchantNavDelegation()" in final_js
assert "window.__SLM_NAV_DELEGATION_INSTALLED" in final_js
assert "merchant/orders-stable?page=1&per_page=20" in final_js
assert "merchant/orders-stable?page=1&per_page=1" in final_js
assert "merchantOrderRequestSeq" in final_js
assert "7000" in final_js
assert ".finally(" not in final_js[final_js.find('function loadOrders('):final_js.find('function loadDashboardStats(')]
assert "function slb_orders_stable($request)" in final_php
assert "/merchant/orders-stable" in final_php
assert "return' => 'objects'" in final_php
assert "var BUILD='1.1.45';" in customer
assert "function frontPageMarkup()" in customer
print('ShishaLove Bridge 1.1.49: Dashboard navigation + Orders stable route MASTER FIX applied; Customer 1.1.45 preserved')
