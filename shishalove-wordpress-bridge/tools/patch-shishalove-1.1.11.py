#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.11.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# Carry forward the validated 1.1.10 bridge, then apply only the owner-locked
# corrections discovered during live web-view validation.
subprocess.check_call([sys.executable, str(tools / 'run-shishalove-1.1.10.py'), str(root)])

js_path = root / 'assets' / 'customer.js'
merchant_path = root / 'assets' / 'merchant.js'
css_path = root / 'assets' / 'bridge.css'
php_path = root / 'shishalove-app-bridge.php'

js = js_path.read_text(encoding='utf-8')
merchant = merchant_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
php = php_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'1.1.11 patch failed: {label}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label):
    out, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'1.1.11 patch failed: {label} ({count})')
    return out


# New runtime/cache namespace. Do not alter the owner-approved Customer drawer logo
# or the owner-approved Merchant header/logo from 1.1.10.
js = replace_once(js, "var BUILD='1.1.10';", "var BUILD='1.1.11';", 'customer build key')

# 1) Restore the complete Hookah brand catalogue. 1.1.10 accidentally limited the
# collection to direct children, which on the live taxonomy exposed only DSH. Preserve
# the previously visible owner-approved brand set, then append every live descendant
# at any depth. This is intentionally additive and deduplicated.
complete_collection = r'''function slb_collection_all($root_label) {
    $root = slb_find_term($root_label);
    if (!$root) { return array(); }
    $out = array();
    $seen = array();

    // These were visible before the 1.1.10 regression and are permanently retained.
    $preferred = array('Wookah','Alpha','Steamulation','Union','MIG','El-Badia','Moze','Anima','Gold Miner','YKAP','Mexanika','DIAVLA','DSH');
    foreach ($preferred as $label) {
        $term = slb_find_term($label, $root->term_id);
        if (!$term) { $term = slb_find_global_exact($label); }
        if ($term && !isset($seen[$term->term_id]) && (int) $term->count > 0) {
            $seen[$term->term_id] = true;
            $out[] = slb_term_payload($term);
        }
    }

    $rows = get_terms(array(
        'taxonomy' => 'product_cat',
        'hide_empty' => true,
        'child_of' => (int) $root->term_id,
        'orderby' => 'name',
        'order' => 'ASC',
        'number' => 0,
    ));
    if (!is_wp_error($rows)) {
        foreach ($rows as $term) {
            if (!isset($seen[$term->term_id])) {
                $seen[$term->term_id] = true;
                $out[] = slb_term_payload($term);
            }
        }
    }
    return $out;
}'''
php = sub_once(
    php,
    r'''function slb_collection_all\(\$root_label\) \{.*?\n\}''',
    complete_collection,
    'complete recursive Hookah catalogue'
)

# 2) Merchant order detail endpoint. Tapping an order remains inside the Merchant app
# and exposes the same essential General / Billing / Shipping information as the
# WooCommerce order screen, plus order lines/totals. Status remains editable.
order_helpers = r'''
function slb_order_address_payload($order, $shipping = false) {
    $p = $shipping ? 'shipping' : 'billing';
    $get = function($field) use ($order, $p) {
        $method = 'get_' . $p . '_' . $field;
        return method_exists($order, $method) ? (string) $order->{$method}() : '';
    };
    $out = array(
        'first_name' => $get('first_name'),
        'last_name' => $get('last_name'),
        'company' => $get('company'),
        'address_1' => $get('address_1'),
        'address_2' => $get('address_2'),
        'city' => $get('city'),
        'state' => $get('state'),
        'postcode' => $get('postcode'),
        'country' => $get('country'),
    );
    if (!$shipping) {
        $out['email'] = (string) $order->get_billing_email();
        $out['phone'] = (string) $order->get_billing_phone();
    }
    return $out;
}

function slb_order_detail_payload($order) {
    if (!$order) { return null; }
    $currency = $order->get_currency();
    $price_args = array('currency' => $currency);
    $lines = array();
    foreach ($order->get_items() as $item_id => $item) {
        $product = $item->get_product();
        $image = '';
        if ($product && $product->get_image_id()) {
            $image = (string) wp_get_attachment_image_url($product->get_image_id(), 'woocommerce_thumbnail');
        }
        $lines[] = array(
            'id' => (int) $item_id,
            'product_id' => $product ? (int) $product->get_id() : 0,
            'name' => $item->get_name(),
            'quantity' => (int) $item->get_quantity(),
            'subtotal' => html_entity_decode(wp_strip_all_tags(wc_price((float) $item->get_subtotal(), $price_args)), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'total' => html_entity_decode(wp_strip_all_tags(wc_price((float) $item->get_total(), $price_args)), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'image' => $image,
        );
    }
    $statuses = array();
    foreach (wc_get_order_statuses() as $key => $label) {
        $statuses[] = array('value' => preg_replace('/^wc-/', '', $key), 'label' => $label);
    }
    $customer_id = (int) $order->get_customer_id();
    $user = $customer_id ? get_user_by('id', $customer_id) : false;
    return array(
        'id' => (int) $order->get_id(),
        'number' => $order->get_order_number(),
        'date' => $order->get_date_created() ? $order->get_date_created()->date_i18n('Y-m-d H:i') : '',
        'status' => $order->get_status(),
        'statuses' => $statuses,
        'customer_id' => $customer_id,
        'customer_account' => $user ? $user->display_name : '',
        'billing' => slb_order_address_payload($order, false),
        'shipping' => slb_order_address_payload($order, true),
        'payment_method' => $order->get_payment_method_title(),
        'customer_note' => $order->get_customer_note(),
        'subtotal' => html_entity_decode(wp_strip_all_tags(wc_price((float) $order->get_subtotal(), $price_args)), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'shipping_total' => html_entity_decode(wp_strip_all_tags(wc_price((float) $order->get_shipping_total(), $price_args)), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'total' => html_entity_decode(wp_strip_all_tags($order->get_formatted_order_total()), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'items' => $lines,
    );
}

function slb_merchant_order_detail($request) {
    $order = wc_get_order(absint($request['id']));
    if (!$order) { return new WP_Error('not_found', 'Order not found', array('status' => 404)); }
    if (strtoupper($request->get_method()) === 'POST') {
        $body = $request->get_json_params();
        $status = is_array($body) && isset($body['status']) ? sanitize_key($body['status']) : '';
        if ($status !== '') {
            $valid = array();
            foreach (array_keys(wc_get_order_statuses()) as $key) { $valid[] = preg_replace('/^wc-/', '', $key); }
            if (!in_array($status, $valid, true)) {
                return new WP_Error('invalid_status', 'Invalid order status', array('status' => 400));
            }
            if ($status !== $order->get_status()) {
                $order->update_status($status, 'Updated from ShishaLove Merchant');
                $order = wc_get_order($order->get_id());
            }
        }
    }
    return slb_order_detail_payload($order);
}

'''
php = replace_once(php, "function slb_orders($request) {", order_helpers + "function slb_orders($request) {", 'merchant order detail helpers')
php = replace_once(
    php,
    "    register_rest_route('shishalove/v1', '/merchant/orders', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_orders'));",
    "    register_rest_route('shishalove/v1', '/merchant/orders', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_orders'));\n    register_rest_route('shishalove/v1', '/merchant/order/(?P<id>\\\\d+)', array(\n        array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_merchant_order_detail'),\n        array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_merchant_order_detail'),\n    ));",
    'merchant order detail REST route'
)

# Merchant state extensions for a functional hamburger and native order-detail panel.
merchant = replace_once(
    merchant,
    "orders:null,editor:null",
    "orders:null,orderDetail:null,menuOpen:false,editor:null",
    'merchant menu/order state'
)

merchant_menu = r'''function merchantMenu(){
  var cls=state.menuOpen?' open':'';
  return '<div class="slm-menu-backdrop'+cls+'" data-act="menu-close"></div><aside class="slm-menu-drawer'+cls+'"><div class="slm-menu-head"><div class="slm-menu-logo">'+merchantOwnerLogo()+'</div><button data-act="menu-close" aria-label="Close">×</button></div><button data-view="dashboard">Dashboard</button><button data-view="orders">Orders</button><button data-view="products">Products</button><button data-view="stock">Stock</button><button data-view="more">More</button></aside>';
}
'''
merchant = replace_once(merchant, "function bottom(){", merchant_menu + "function bottom(){", 'merchant drawer')
merchant = replace_once(
    merchant,
    "function shell(body){return '<div class=\"slm-app\">'+top()+body+bottom()+editorPanel()+'</div>';}",
    "function shell(body){return '<div class=\"slm-app\">'+top()+body+bottom()+merchantMenu()+orderPanel()+editorPanel()+'</div>';}",
    'merchant shell overlays'
)

# Make order cards tappable and add a full-screen mobile detail panel modeled on the
# WooCommerce order screen shown by the owner.
merchant = replace_once(
    merchant,
    "function orderRows(items){if(!items.length)return '<div class=\"slm-empty\">No matching orders.</div>';",
    "function orderRows(items){if(!items.length)return '<div class=\"slm-empty\">No matching orders.</div>';",
    'noop order rows compatibility'
) if "No matching orders." in merchant else merchant
merchant = sub_once(
    merchant,
    r'''function orderRows\(items\)\{.*?\}\nfunction loadOrders''',
    r'''function orderRows(items){if(!items.length)return '<div class="slm-empty">No orders found.</div>';return items.map(function(o){return '<article class="slm-order slm-order-tap" data-order="'+o.id+'"><div class="slm-order-head"><span>#'+esc(o.number)+' · '+esc(o.customer||'Customer')+'</span><span class="slm-badge">'+esc(o.status)+'</span></div><div class="slm-muted" style="margin-top:7px">'+esc(o.date)+' · '+esc(decodeEntities(o.total))+'</div><span class="slm-order-arrow">›</span></article>';}).join('');}
function addressLines(a,contact){a=a||{};var lines=[];var name=[a.first_name,a.last_name].filter(Boolean).join(' ');if(name)lines.push(name);if(a.company)lines.push(a.company);if(a.address_1)lines.push(a.address_1);if(a.address_2)lines.push(a.address_2);var city=[a.city,a.state,a.postcode].filter(Boolean).join(' ');if(city)lines.push(city);if(a.country)lines.push(a.country);if(contact&&a.email)lines.push('<b>Email:</b> <a href="mailto:'+esc(a.email)+'">'+esc(a.email)+'</a>');if(contact&&a.phone)lines.push('<b>Phone:</b> <a href="tel:'+esc(a.phone)+'">'+esc(a.phone)+'</a>');return lines.map(function(x){return '<div>'+x+'</div>';}).join('');}
function orderPanel(){var d=state.orderDetail;if(!d)return '<section class="slm-order-panel"></section>';if(d.loading)return '<section class="slm-order-panel open"><div class="slm-order-panel-head"><button data-act="close-order">←</button><h2>Order</h2><span></span></div>'+ghostRows(6)+'</section>';var statuses=(d.statuses||[]).map(function(s){return '<option value="'+esc(s.value)+'"'+(s.value===d.status?' selected':'')+'>'+esc(s.label)+'</option>';}).join('');var items=(d.items||[]).map(function(x){return '<div class="slm-order-line">'+(x.image?'<img src="'+esc(x.image)+'" alt="">':'<span></span>')+'<div><b>'+esc(x.name)+'</b><div class="slm-muted">Qty '+x.quantity+' · '+esc(decodeEntities(x.total))+'</div></div></div>';}).join('');return '<section class="slm-order-panel open"><div class="slm-order-panel-head"><button data-act="close-order">←</button><h2>Order #'+esc(d.number)+'</h2><span></span></div><div class="slm-order-detail"><div class="slm-order-meta">'+(d.payment_method?'<p>'+esc(d.payment_method)+'</p>':'')+'<h3>General</h3><label>Date created</label><div class="slm-readonly">'+esc(d.date)+'</div><label>Status</label><select id="slm-order-status">'+statuses+'</select><label>Customer</label><div class="slm-readonly">'+esc(d.customer_account||((d.billing&&[d.billing.first_name,d.billing.last_name].filter(Boolean).join(' '))||'Guest'))+'</div></div><div class="slm-address-grid"><section><h3>Billing</h3>'+addressLines(d.billing,true)+'</section><section><h3>Shipping</h3>'+addressLines(d.shipping,false)+'</section></div><section class="slm-order-items"><h3>Order items</h3>'+items+'<div class="slm-order-total"><span>Subtotal</span><b>'+esc(decodeEntities(d.subtotal||''))+'</b></div>'+(d.shipping_total?'<div class="slm-order-total"><span>Shipping</span><b>'+esc(decodeEntities(d.shipping_total))+'</b></div>':'')+'<div class="slm-order-total final"><span>Total</span><b>'+esc(decodeEntities(d.total||''))+'</b></div></section>'+(d.customer_note?'<section class="slm-order-note"><h3>Customer note</h3><p>'+esc(d.customer_note)+'</p></section>':'')+'</div></section>';}
function openOrder(id){state.orderDetail={id:Number(id),loading:true};render();api('merchant/order/'+encodeURIComponent(id)).then(function(d){state.orderDetail=d;render();}).catch(function(){state.orderDetail=null;render();});}
function saveOrderStatus(status){var d=state.orderDetail;if(!d||!d.id)return;api('merchant/order/'+d.id,{method:'POST',body:JSON.stringify({status:status})}).then(function(next){state.orderDetail=next;cdelPrefix(vkey('slm-orders-'));state.orders=null;render();loadOrders(true);});}
function loadOrders''',
    'merchant native order details'
)

# Close the menu whenever navigation occurs. Bind the hamburger, close targets,
# order cards and order status control.
merchant = replace_once(
    merchant,
    "function navigate(view){var changed=view!==state.view;",
    "function navigate(view){state.menuOpen=false;var changed=view!==state.view;",
    'merchant menu closes on navigation'
)
merchant = replace_once(
    merchant,
    "function bind(){root.querySelectorAll('[data-view]')",
    "function bind(){root.querySelectorAll('[data-act=\"menu\"]').forEach(function(e){e.onclick=function(){state.menuOpen=true;render();};});root.querySelectorAll('[data-act=\"menu-close\"]').forEach(function(e){e.onclick=function(){state.menuOpen=false;render();};});root.querySelectorAll('[data-order]').forEach(function(e){e.onclick=function(){openOrder(this.dataset.order);};});root.querySelectorAll('[data-act=\"close-order\"]').forEach(function(e){e.onclick=function(){state.orderDetail=null;render();};});var os=document.getElementById('slm-order-status');if(os)os.onchange=function(){saveOrderStatus(this.value);};root.querySelectorAll('[data-view]')",
    'merchant hamburger and order detail bindings'
)

css += r'''

/* ShishaLove 1.1.11 owner lock: functional Merchant menu + native order details */
.slm-menu-backdrop{position:fixed;z-index:180;inset:0;background:rgba(0,0,0,.42);opacity:0;pointer-events:none;transition:.18s}.slm-menu-backdrop.open{opacity:1;pointer-events:auto}.slm-menu-drawer{position:fixed;z-index:181;left:0;top:0;bottom:0;width:min(82vw,360px);background:#111;color:#fff;transform:translateX(-103%);transition:.18s;padding:calc(18px + var(--safe-top)) 22px calc(26px + var(--safe-bottom));overflow-y:auto}.slm-menu-drawer.open{transform:translateX(0)}.slm-menu-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}.slm-menu-logo .slm-owner-logo{width:142px;height:92px;object-fit:contain}.slm-menu-head>button{width:48px;height:48px;border:0;border-radius:50%;background:#292929;color:#fff;font-size:30px}.slm-menu-drawer>button{display:flex;width:100%;min-height:58px;align-items:center;border:0;border-bottom:1px solid #333;background:#111;color:#fff;font-weight:900;font-size:19px;text-align:left;padding:0 6px}
.slm-order-tap{position:relative;padding-right:36px;cursor:pointer}.slm-order-arrow{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:30px;color:#888}.slm-order-panel{position:fixed;z-index:170;inset:0;background:#fff;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:calc(28px + var(--safe-bottom));transform:translateX(103%);transition:.2s}.slm-order-panel.open{transform:translateX(0)}.slm-order-panel-head{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;min-height:76px;padding:var(--safe-top) 16px 0;background:#fff;border-bottom:1px solid #eee}.slm-order-panel-head button{border:0;background:#fff;font-size:30px;text-align:left}.slm-order-panel-head h2{margin:0;text-align:center;font-size:22px}.slm-order-detail{padding:20px}.slm-order-detail h3{font-size:19px;margin:22px 0 12px}.slm-order-detail label{display:block;font-weight:700;margin:13px 0 7px}.slm-readonly,.slm-order-detail select{width:100%;min-height:50px;border:1px solid #d9d9dc;border-radius:10px;background:#fff;padding:12px;font-size:16px}.slm-address-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.slm-address-grid section>div{line-height:1.55;color:#666}.slm-address-grid a{color:#2458a6}.slm-order-line{display:grid;grid-template-columns:54px 1fr;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid #eee}.slm-order-line img{width:54px;height:54px;object-fit:contain}.slm-order-total{display:flex;justify-content:space-between;padding:8px 0}.slm-order-total.final{font-size:19px;border-top:2px solid #111;margin-top:4px;padding-top:12px}.slm-order-note{padding-bottom:24px}@media(max-width:520px){.slm-address-grid{grid-template-columns:1fr}.slm-address-grid section+section{border-top:1px solid #eee;padding-top:2px}}
'''

js_path.write_text(js, encoding='utf-8')
merchant_path.write_text(merchant, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
php_path.write_text(php, encoding='utf-8')
print('ShishaLove 1.1.11 owner-locked regression patch applied')
