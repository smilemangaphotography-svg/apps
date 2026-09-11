<?php
/**
 * Plugin Name: ShishaLove App Bridge
 * Description: Canonical Customer and Merchant mobile runtime for ShishaLove. WooCommerce remains the source of truth.
 * Version: 1.1.6-rc.1
 * Author: ShishaLove
 */

if (!defined('ABSPATH')) { exit; }

define('SLB_VERSION', '1.1.6-rc.1');
define('SLB_FILE', __FILE__);
define('SLB_DIR', plugin_dir_path(__FILE__));
define('SLB_URL', plugin_dir_url(__FILE__));

function slb_wc_ready() {
    return class_exists('WooCommerce') && function_exists('wc_get_product');
}

function slb_path() {
    $uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '/';
    $path = wp_parse_url($uri, PHP_URL_PATH);
    return '/' . ltrim((string) $path, '/');
}

function slb_is_customer_request() {
    return preg_match('#^/shishalove-app/?$#i', slb_path()) === 1;
}

function slb_is_merchant_request() {
    return preg_match('#^/shishalove-merchant/?$#i', slb_path()) === 1;
}

function slb_site_logo() {
    $logo_id = (int) get_theme_mod('custom_logo');
    if ($logo_id) {
        $src = wp_get_attachment_image_url($logo_id, 'full');
        if ($src) { return $src; }
    }
    $icon = get_site_icon_url(512);
    return $icon ? $icon : '';
}

function slb_normalize($value) {
    return strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', remove_accents((string) $value)), '-'));
}

function slb_all_terms() {
    static $terms = null;
    if ($terms !== null) { return $terms; }
    if (!taxonomy_exists('product_cat')) { return $terms = array(); }
    $rows = get_terms(array('taxonomy' => 'product_cat', 'hide_empty' => false));
    return $terms = is_wp_error($rows) ? array() : $rows;
}

function slb_is_descendant($term_id, $ancestor_id) {
    if (!$ancestor_id) { return true; }
    if ((int) $term_id === (int) $ancestor_id) { return true; }
    $ancestors = get_ancestors((int) $term_id, 'product_cat', 'taxonomy');
    return in_array((int) $ancestor_id, array_map('intval', $ancestors), true);
}

function slb_find_term($label, $root_id = 0) {
    $needle = slb_normalize($label);
    $best = null;
    $best_score = -999;
    foreach (slb_all_terms() as $term) {
        if ($root_id && !slb_is_descendant($term->term_id, $root_id)) { continue; }
        $name = slb_normalize($term->name);
        $slug = slb_normalize($term->slug);
        $score = 0;
        if ($name === $needle) { $score += 120; }
        if ($slug === $needle) { $score += 110; }
        if (strpos($name, $needle) !== false || strpos($needle, $name) !== false) { $score += 55; }
        if (strpos($slug, $needle) !== false || strpos($needle, $slug) !== false) { $score += 45; }
        if ((int) $term->count > 0) { $score += 12; }
        $score += min(8, count(get_ancestors($term->term_id, 'product_cat', 'taxonomy')));
        if ($score > $best_score) { $best = $term; $best_score = $score; }
    }
    return $best_score >= 45 ? $best : null;
}

function slb_term_image($term_id) {
    $id = (int) get_term_meta((int) $term_id, 'thumbnail_id', true);
    if (!$id) { return ''; }
    $src = wp_get_attachment_image_url($id, 'medium');
    return $src ? $src : '';
}

function slb_term_payload($term) {
    if (!$term || is_wp_error($term)) { return null; }
    return array(
        'id' => (int) $term->term_id,
        'name' => html_entity_decode($term->name, ENT_QUOTES, 'UTF-8'),
        'slug' => $term->slug,
        'count' => (int) $term->count,
        'parent' => (int) $term->parent,
        'image' => slb_term_image($term->term_id),
    );
}

function slb_top_categories() {
    $labels = array('Hookah','Bowls','Hoses','Accessories','Charcoal','Flavors','Merchandise');
    $out = array();
    foreach ($labels as $label) {
        $term = slb_find_term($label);
        if ($term) { $out[] = slb_term_payload($term); }
    }
    return $out;
}

function slb_collection($root_label, $preferred, $limit = 20) {
    $root = slb_find_term($root_label);
    if (!$root) { return array(); }
    $out = array(); $seen = array();
    foreach ($preferred as $label) {
        $term = slb_find_term($label, $root->term_id);
        if ($term && !isset($seen[$term->term_id])) {
            $seen[$term->term_id] = 1;
            $out[] = slb_term_payload($term);
        }
    }
    if (count($out) < 2) {
        $children = get_terms(array(
            'taxonomy' => 'product_cat', 'hide_empty' => true,
            'child_of' => (int) $root->term_id, 'orderby' => 'count', 'order' => 'DESC',
            'number' => $limit,
        ));
        if (!is_wp_error($children)) {
            foreach ($children as $term) {
                if (!isset($seen[$term->term_id])) {
                    $seen[$term->term_id] = 1;
                    $out[] = slb_term_payload($term);
                }
                if (count($out) >= $limit) { break; }
            }
        }
    }
    return $out;
}

function slb_customer_bootstrap_data() {
    $cache_key = 'slb_customer_bootstrap_' . str_replace('.', '_', SLB_VERSION);
    $cached = get_transient($cache_key);
    if (is_array($cached)) { return $cached; }
    $data = array(
        'version' => SLB_VERSION,
        'site' => home_url('/'),
        'logo' => slb_site_logo(),
        'categories' => slb_top_categories(),
        'collections' => array(
            'hookah' => slb_collection('Hookah', array('Wookah','Alpha','Steamulation','Union','MIG','El-Badia','Moze','Anima','Gold Miner','YKAP','Mexanika','DIAVLA'), 18),
            'bowls' => slb_collection('Bowls', array('Phunnel','Killer','Heat Management','Gaskets','Traditional','Silicone','Glass','Accessories'), 12),
            'accessories' => slb_collection('Accessories', array('Hookah Vases','Charcoal Burner','Tongs','Cleaning','Ash Plates','Charcoal Holder','Wind Cover','Pokers & Forks','Cases','Hookah Colorants','Hookah Boards','Molasses Catcher'), 18),
        ),
        'links' => array(
            'about' => home_url('/about/'),
            'stores' => home_url('/stores/'),
            'experience' => home_url('/experience/'),
            'catering' => home_url('/catering/'),
            'blog' => home_url('/the-blog/'),
            'loyalty' => home_url('/loyalty-scheme/'),
            'faq' => home_url('/faqs/'),
            'contact' => home_url('/contact/'),
            'account' => wc_get_page_permalink('myaccount'),
            'checkout' => wc_get_checkout_url(),
        ),
    );
    set_transient($cache_key, $data, 5 * MINUTE_IN_SECONDS);
    return $data;
}

function slb_product_payload($product) {
    if (!$product) { return null; }
    $image_id = $product->get_image_id();
    $image = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : '';
    $gallery = array();
    foreach ((array) $product->get_gallery_image_ids() as $id) {
        $src = wp_get_attachment_image_url($id, 'large');
        if ($src) { $gallery[] = $src; }
    }
    $cats = array();
    $terms = get_the_terms($product->get_id(), 'product_cat');
    if ($terms && !is_wp_error($terms)) {
        foreach ($terms as $term) { $cats[] = slb_term_payload($term); }
    }
    return array(
        'id' => (int) $product->get_id(),
        'name' => $product->get_name(),
        'sku' => $product->get_sku(),
        'status' => $product->get_status(),
        'type' => $product->get_type(),
        'permalink' => $product->get_permalink(),
        'image' => $image ?: wc_placeholder_img_src('woocommerce_thumbnail'),
        'gallery' => $gallery,
        'price' => $product->get_price(),
        'regular_price' => $product->get_regular_price(),
        'sale_price' => $product->get_sale_price(),
        'price_html' => wp_strip_all_tags($product->get_price_html()),
        'stock_status' => $product->get_stock_status(),
        'manage_stock' => (bool) $product->get_manage_stock(),
        'stock_quantity' => $product->get_stock_quantity(),
        'short_description' => wp_strip_all_tags($product->get_short_description()),
        'description' => wp_strip_all_tags($product->get_description()),
        'categories' => $cats,
    );
}

function slb_query_products($request, $merchant = false) {
    if (!slb_wc_ready()) { return new WP_Error('woocommerce_unavailable', 'WooCommerce is unavailable', array('status' => 503)); }
    $page = max(1, (int) $request->get_param('page'));
    $per = min(50, max(1, (int) ($request->get_param('per_page') ?: 20)));
    $search = sanitize_text_field((string) $request->get_param('search'));
    $category_id = absint($request->get_param('category_id'));
    $stock = sanitize_key((string) $request->get_param('stock_status'));
    $orderby = sanitize_key((string) ($request->get_param('orderby') ?: 'date'));
    $order = strtoupper((string) $request->get_param('order')) === 'ASC' ? 'ASC' : 'DESC';
    $allowed_orderby = array('date','title','menu_order','modified');
    if (!in_array($orderby, $allowed_orderby, true)) { $orderby = 'date'; }

    $args = array(
        'post_type' => 'product',
        'post_status' => $merchant ? array('publish','draft','pending','private') : array('publish'),
        'posts_per_page' => $per,
        'paged' => $page,
        'orderby' => $orderby,
        'order' => $order,
        'fields' => 'ids',
        'no_found_rows' => false,
    );
    if ($search !== '') { $args['s'] = $search; }
    $tax_query = array();
    if ($category_id) {
        $tax_query[] = array('taxonomy' => 'product_cat', 'field' => 'term_id', 'terms' => array($category_id), 'include_children' => true);
    }
    if ($tax_query) { $args['tax_query'] = $tax_query; }
    if ($stock && in_array($stock, array('instock','outofstock','onbackorder'), true)) {
        $args['meta_query'] = array(array('key' => '_stock_status', 'value' => $stock));
    }

    $q = new WP_Query($args);
    $ids = $q->posts;
    if ($search !== '' && !$ids) {
        $sku_ids = get_posts(array(
            'post_type' => 'product', 'post_status' => $args['post_status'], 'posts_per_page' => $per,
            'meta_key' => '_sku', 'meta_value' => $search, 'meta_compare' => 'LIKE', 'fields' => 'ids',
        ));
        $ids = $sku_ids;
    }
    $items = array();
    foreach ($ids as $id) {
        $p = wc_get_product($id);
        if ($p) { $items[] = slb_product_payload($p); }
    }
    return array(
        'items' => $items,
        'page' => $page,
        'per_page' => $per,
        'total' => (int) $q->found_posts,
        'pages' => max(1, (int) $q->max_num_pages),
    );
}

function slb_merchant_permission() {
    return is_user_logged_in() && (current_user_can('manage_woocommerce') || current_user_can('edit_products'));
}

function slb_merchant_categories() {
    $terms = get_terms(array('taxonomy' => 'product_cat', 'hide_empty' => false, 'orderby' => 'count', 'order' => 'DESC'));
    if (is_wp_error($terms)) { return array(); }
    $all = array(); $quick = array(); $seen_names = array();
    foreach ($terms as $term) {
        $payload = slb_term_payload($term);
        $all[] = $payload;
        $key = slb_normalize($term->name);
        if (count($quick) < 10 && (int) $term->count > 0 && $key !== 'uncategorized' && !isset($seen_names[$key])) {
            $seen_names[$key] = true;
            $quick[] = $payload;
        }
    }
    usort($all, function($a,$b){ return strcasecmp($a['name'], $b['name']); });
    return array('quick' => $quick, 'all' => $all);
}

function slb_merchant_bootstrap() {
    $user = wp_get_current_user();
    return array(
        'version' => SLB_VERSION,
        'logo' => slb_site_logo(),
        'user' => array('id' => (int) $user->ID, 'name' => $user->display_name ?: $user->user_login),
        'categories' => slb_merchant_categories(),
        'nonce' => wp_create_nonce('wp_rest'),
    );
}

function slb_save_product($request, $id = 0) {
    if (!slb_wc_ready()) { return new WP_Error('woocommerce_unavailable', 'WooCommerce is unavailable', array('status' => 503)); }
    $body = $request->get_json_params();
    if (!is_array($body)) { $body = array(); }
    if ($id) {
        $product = wc_get_product($id);
        if (!$product) { return new WP_Error('not_found', 'Product not found', array('status' => 404)); }
    } else {
        $product = new WC_Product_Simple();
    }
    if (array_key_exists('name', $body)) { $product->set_name(sanitize_text_field($body['name'])); }
    if (array_key_exists('sku', $body)) { $product->set_sku(wc_clean($body['sku'])); }
    if (array_key_exists('status', $body) && in_array($body['status'], array('publish','draft','pending','private'), true)) { $product->set_status($body['status']); }
    if (array_key_exists('regular_price', $body)) { $product->set_regular_price(wc_format_decimal($body['regular_price'])); }
    if (array_key_exists('sale_price', $body)) { $product->set_sale_price(wc_format_decimal($body['sale_price'])); }
    if (array_key_exists('short_description', $body)) { $product->set_short_description(wp_kses_post($body['short_description'])); }
    if (array_key_exists('description', $body)) { $product->set_description(wp_kses_post($body['description'])); }
    if (array_key_exists('manage_stock', $body)) { $product->set_manage_stock((bool) $body['manage_stock']); }
    if (array_key_exists('stock_quantity', $body) && $body['stock_quantity'] !== '' && $body['stock_quantity'] !== null) { $product->set_stock_quantity((int) $body['stock_quantity']); }
    if (array_key_exists('stock_status', $body) && in_array($body['stock_status'], array('instock','outofstock','onbackorder'), true)) { $product->set_stock_status($body['stock_status']); }
    $saved_id = $product->save();
    if (!empty($body['category_ids']) && is_array($body['category_ids'])) {
        $category_ids = array_values(array_unique(array_filter(array_map('absint', $body['category_ids']))));
        wp_set_object_terms($saved_id, $category_ids, 'product_cat', false);
    }
    clean_post_cache($saved_id);
    $saved = wc_get_product($saved_id);
    return slb_product_payload($saved);
}

function slb_orders($request) {
    $page = max(1, (int) $request->get_param('page'));
    $per = min(50, max(1, (int) ($request->get_param('per_page') ?: 20)));
    $result = wc_get_orders(array('limit' => $per, 'page' => $page, 'paginate' => true, 'orderby' => 'date', 'order' => 'DESC'));
    $items = array();
    foreach ($result->orders as $order) {
        $items[] = array(
            'id' => (int) $order->get_id(),
            'number' => $order->get_order_number(),
            'customer' => trim($order->get_formatted_billing_full_name()),
            'status' => $order->get_status(),
            'total' => wp_strip_all_tags($order->get_formatted_order_total()),
            'date' => $order->get_date_created() ? $order->get_date_created()->date_i18n('Y-m-d H:i') : '',
        );
    }
    return array('items' => $items, 'page' => $page, 'per_page' => $per, 'total' => (int) $result->total, 'pages' => (int) $result->max_num_pages);
}

function slb_cart_boot() {
    if (!function_exists('WC')) { return false; }
    if (function_exists('wc_load_cart') && (!WC()->session || !WC()->cart)) { wc_load_cart(); }
    return WC()->cart ? true : false;
}

function slb_cart_payload() {
    if (!slb_cart_boot()) { return array('items' => array(), 'count' => 0, 'subtotal' => '', 'total' => ''); }
    $items = array();
    foreach (WC()->cart->get_cart() as $key => $line) {
        $p = isset($line['data']) ? $line['data'] : null;
        if (!$p) { continue; }
        $items[] = array(
            'key' => $key, 'id' => (int) $p->get_id(), 'name' => $p->get_name(),
            'qty' => (int) $line['quantity'], 'image' => wp_get_attachment_image_url($p->get_image_id(), 'woocommerce_thumbnail'),
            'line_total' => wc_price($line['line_total']),
        );
    }
    return array(
        'items' => $items,
        'count' => (int) WC()->cart->get_cart_contents_count(),
        'subtotal' => wp_strip_all_tags(WC()->cart->get_cart_subtotal()),
        'total' => wp_strip_all_tags(WC()->cart->get_total()),
    );
}

function slb_cart_ajax() {
    check_ajax_referer('slb_customer', 'nonce');
    if (!slb_cart_boot()) { wp_send_json_error(array('message' => 'Cart unavailable'), 503); }
    $op = sanitize_key(isset($_POST['op']) ? wp_unslash($_POST['op']) : 'get');
    if ($op === 'add') {
        $id = absint($_POST['product_id'] ?? 0); $qty = max(1, absint($_POST['qty'] ?? 1));
        if ($id) { WC()->cart->add_to_cart($id, $qty); }
    } elseif ($op === 'update') {
        $key = wc_clean(wp_unslash($_POST['key'] ?? '')); $qty = max(0, absint($_POST['qty'] ?? 0));
        if ($key) { WC()->cart->set_quantity($key, $qty, true); }
    } elseif ($op === 'remove') {
        $key = wc_clean(wp_unslash($_POST['key'] ?? '')); if ($key) { WC()->cart->remove_cart_item($key); }
    }
    WC()->cart->calculate_totals();
    wp_send_json_success(slb_cart_payload());
}
add_action('wp_ajax_slb_cart', 'slb_cart_ajax');
add_action('wp_ajax_nopriv_slb_cart', 'slb_cart_ajax');

add_action('rest_api_init', function() {
    register_rest_route('shishalove/v1', '/status', array('methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function(){ return array('version' => SLB_VERSION, 'woocommerce' => slb_wc_ready()); }));
    register_rest_route('shishalove/v1', '/customer/bootstrap', array('methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function(){ return slb_customer_bootstrap_data(); }));
    register_rest_route('shishalove/v1', '/customer/products', array('methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function($r){ return slb_query_products($r, false); }));
    register_rest_route('shishalove/v1', '/customer/product/(?P<id>\d+)', array('methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function($r){ $p = wc_get_product(absint($r['id'])); return $p ? slb_product_payload($p) : new WP_Error('not_found','Product not found',array('status'=>404)); }));

    register_rest_route('shishalove/v1', '/merchant/bootstrap', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => function(){ return slb_merchant_bootstrap(); }));
    register_rest_route('shishalove/v1', '/merchant/products', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => function($r){ return slb_query_products($r, true); }));
    register_rest_route('shishalove/v1', '/merchant/product/(?P<id>\d+)', array(
        array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => function($r){ $p = wc_get_product(absint($r['id'])); return $p ? slb_product_payload($p) : new WP_Error('not_found','Product not found',array('status'=>404)); }),
        array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => function($r){ return slb_save_product($r, absint($r['id'])); }),
    ));
    register_rest_route('shishalove/v1', '/merchant/product', array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => function($r){ return slb_save_product($r, 0); }));
    register_rest_route('shishalove/v1', '/merchant/orders', array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_orders'));
});

function slb_render_shell($mode) {
    status_header(200);
    nocache_headers();
    $is_merchant = $mode === 'merchant';
    $cfg = array(
        'version' => SLB_VERSION,
        'mode' => $mode,
        'site' => home_url('/'),
        'logo' => slb_site_logo(),
        'rest' => esc_url_raw(rest_url('shishalove/v1/')),
        'ajax' => admin_url('admin-ajax.php'),
        'cartNonce' => wp_create_nonce('slb_customer'),
        'restNonce' => is_user_logged_in() ? wp_create_nonce('wp_rest') : '',
        'loggedIn' => is_user_logged_in(),
        'merchantAllowed' => $is_merchant ? slb_merchant_permission() : false,
        'loginUrl' => wp_login_url(home_url('/shishalove-merchant/')),
        'accountUrl' => function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/my-account/'),
        'checkoutUrl' => function_exists('wc_get_checkout_url') ? wc_get_checkout_url() : home_url('/checkout/'),
    );
    ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<title><?php echo $is_merchant ? 'ShishaLove Merchant' : 'ShishaLove'; ?></title>
<link rel="stylesheet" href="<?php echo esc_url(SLB_URL . 'assets/bridge.css?ver=' . rawurlencode(SLB_VERSION)); ?>">
</head>
<body class="slb slb-<?php echo esc_attr($mode); ?>">
<div id="slb-root" aria-live="polite"></div>
<script>window.SHISHALOVE_BRIDGE=<?php echo wp_json_encode($cfg, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>;</script>
<script src="<?php echo esc_url(SLB_URL . 'assets/' . ($is_merchant ? 'merchant.js' : 'customer.js') . '?ver=' . rawurlencode(SLB_VERSION)); ?>" defer></script>
</body>
</html><?php
}

add_action('template_redirect', function() {
    if (slb_is_customer_request()) { slb_render_shell('customer'); exit; }
    if (slb_is_merchant_request()) { slb_render_shell('merchant'); exit; }
}, 0);
