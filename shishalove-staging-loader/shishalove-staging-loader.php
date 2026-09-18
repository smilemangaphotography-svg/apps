<?php
/**
 * Plugin Name: ShishaLove Staging Loader
 * Description: Isolated Customer + Merchant beta routes for one-by-one testing. Production Customer/Merchant routes remain untouched.
 * Version: 1.1.0
 * Author: ShishaLove
 */

if (!defined('ABSPATH')) { exit; }

define('SLSL_VERSION', '1.1.0');
define('SLSL_REMOTE_BASE', 'https://raw.githubusercontent.com/smilemangaphotography-svg/apps/shishalove-staging/shishalove-staging/');

function slsl_request_path() {
    $uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '/';
    $path = wp_parse_url($uri, PHP_URL_PATH);
    return '/' . ltrim((string) $path, '/');
}

function slsl_is_customer_beta_request() {
    return preg_match('#^/shishalove-app-beta/?$#i', slsl_request_path()) === 1;
}

function slsl_is_merchant_beta_request() {
    return preg_match('#^/shishalove-merchant-beta/?$#i', slsl_request_path()) === 1;
}

function slsl_logo() {
    if (function_exists('slb_site_logo')) {
        return (string) slb_site_logo();
    }
    $id = (int) get_theme_mod('custom_logo');
    if ($id) {
        $url = wp_get_attachment_image_url($id, 'full');
        if ($url) { return (string) $url; }
    }
    return (string) get_site_icon_url(512);
}

function slsl_merchant_permission() {
    return is_user_logged_in() && (current_user_can('manage_woocommerce') || current_user_can('edit_products'));
}

function slsl_remote_asset_url($name) {
    return home_url('/?slsl_asset=' . rawurlencode($name) . '&_=' . rawurlencode((string) time()));
}

function slsl_proxy_remote_asset() {
    if (empty($_GET['slsl_asset'])) { return false; }
    $name = sanitize_key(wp_unslash($_GET['slsl_asset']));
    $map = array(
        'customer-js' => array('customer-staging.js', 'application/javascript; charset=UTF-8'),
        'customer-css' => array('customer-staging.css', 'text/css; charset=UTF-8'),
        'merchant-js' => array('merchant-staging.js', 'application/javascript; charset=UTF-8'),
        'merchant-css' => array('merchant-staging.css', 'text/css; charset=UTF-8'),
    );
    if (!isset($map[$name])) {
        status_header(404);
        exit;
    }
    $remote = SLSL_REMOTE_BASE . $map[$name][0] . '?v=' . rawurlencode((string) time());
    $response = wp_remote_get($remote, array('timeout' => 12, 'redirection' => 2, 'headers' => array('Cache-Control' => 'no-cache')));
    if (is_wp_error($response) || (int) wp_remote_retrieve_response_code($response) !== 200) {
        status_header(502);
        header('Content-Type: text/plain; charset=UTF-8');
        echo 'Staging asset unavailable';
        exit;
    }
    nocache_headers();
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Content-Type: ' . $map[$name][1]);
    echo wp_remote_retrieve_body($response);
    exit;
}

function slsl_render_customer_beta() {
    status_header(200);
    nocache_headers();

    $cfg = array(
        'version' => 'staging-' . SLSL_VERSION,
        'mode' => 'customer',
        'staging' => true,
        'site' => home_url('/'),
        'logo' => slsl_logo(),
        'rest' => esc_url_raw(rest_url('shishalove/v1/')),
        'ajax' => admin_url('admin-ajax.php'),
        'cartNonce' => wp_create_nonce('slb_customer'),
        'restNonce' => is_user_logged_in() ? wp_create_nonce('wp_rest') : '',
        'loggedIn' => is_user_logged_in(),
        'merchantAllowed' => false,
        'loginUrl' => wp_login_url(home_url('/shishalove-app-beta/')),
        'accountUrl' => function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/my-account/'),
        'checkoutUrl' => function_exists('wc_get_checkout_url') ? wc_get_checkout_url() : home_url('/checkout/'),
    );

    $base_css = plugins_url('shishalove-app-bridge/assets/bridge.css');
    $base_js = plugins_url('shishalove-app-bridge/assets/customer.js');
    ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="robots" content="noindex,nofollow">
<title>ShishaLove Customer Beta</title>
<link rel="stylesheet" href="<?php echo esc_url($base_css); ?>">
<link rel="stylesheet" href="<?php echo esc_url(slsl_remote_asset_url('customer-css')); ?>">
</head>
<body class="slb slb-customer slb-staging">
<div id="slb-root" aria-live="polite"></div>
<script>window.SHISHALOVE_BRIDGE=<?php echo wp_json_encode($cfg, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>;</script>
<script src="<?php echo esc_url($base_js); ?>" defer></script>
<script src="<?php echo esc_url(slsl_remote_asset_url('customer-js')); ?>" defer></script>
</body>
</html><?php
}

function slsl_render_merchant_beta() {
    status_header(200);
    nocache_headers();
    $allowed = slsl_merchant_permission();
    $cfg = array(
        'version' => 'merchant-beta-' . SLSL_VERSION,
        'mode' => 'merchant',
        'staging' => true,
        'site' => home_url('/'),
        'logo' => slsl_logo(),
        'rest' => esc_url_raw(rest_url('shishalove-staging/v1/')),
        'restNonce' => is_user_logged_in() ? wp_create_nonce('wp_rest') : '',
        'loggedIn' => is_user_logged_in(),
        'merchantAllowed' => $allowed,
        'loginUrl' => wp_login_url(home_url('/shishalove-merchant-beta/')),
    );
    ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="robots" content="noindex,nofollow">
<title>ShishaLove Merchant Beta</title>
<link rel="stylesheet" href="<?php echo esc_url(plugins_url('shishalove-app-bridge/assets/bridge.css')); ?>">
<link rel="stylesheet" href="<?php echo esc_url(slsl_remote_asset_url('merchant-css')); ?>">
</head>
<body class="slb slb-merchant slb-staging slsl-merchant-beta">
<div id="slb-root" aria-live="polite"></div>
<script>window.SHISHALOVE_BRIDGE=<?php echo wp_json_encode($cfg, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>;</script>
<script src="<?php echo esc_url(slsl_remote_asset_url('merchant-js')); ?>" defer></script>
</body>
</html><?php
}

function slsl_product_payload($product) {
    if (!$product) { return null; }
    $image_id = $product->get_image_id();
    $image = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : '';
    $cats = array();
    $terms = get_the_terms($product->get_id(), 'product_cat');
    if ($terms && !is_wp_error($terms)) {
        foreach ($terms as $term) {
            $cats[] = array('id' => (int) $term->term_id, 'name' => (string) $term->name);
        }
    }
    return array(
        'id' => (int) $product->get_id(),
        'name' => (string) $product->get_name(),
        'sku' => (string) $product->get_sku(),
        'image' => $image ?: (function_exists('wc_placeholder_img_src') ? wc_placeholder_img_src('woocommerce_thumbnail') : ''),
        'regular_price' => (string) $product->get_regular_price(),
        'price_html' => html_entity_decode(wp_strip_all_tags($product->get_price_html()), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'stock_status' => (string) $product->get_stock_status(),
        'categories' => $cats,
    );
}

function slsl_merchant_categories() {
    $terms = get_terms(array('taxonomy' => 'product_cat', 'hide_empty' => false, 'orderby' => 'name', 'order' => 'ASC'));
    if (is_wp_error($terms)) { return array(); }
    $out = array();
    foreach ($terms as $term) {
        $out[] = array('id' => (int) $term->term_id, 'name' => (string) $term->name, 'count' => (int) $term->count);
    }
    return $out;
}

function slsl_merchant_products($request) {
    if (!function_exists('wc_get_product')) {
        return new WP_Error('woocommerce_unavailable', 'WooCommerce unavailable', array('status' => 503));
    }
    global $wpdb;
    $page = max(1, absint($request->get_param('page')));
    $per = min(50, max(1, absint($request->get_param('per_page') ?: 20)));
    $search = sanitize_text_field((string) $request->get_param('search'));
    $category_id = absint($request->get_param('category_id'));
    $stock = sanitize_key((string) $request->get_param('stock_status'));

    $args = array(
        'post_type' => 'product',
        'post_status' => array('publish','draft','pending','private'),
        'posts_per_page' => $per,
        'paged' => $page,
        'orderby' => 'title',
        'order' => 'ASC',
        'fields' => 'ids',
        'no_found_rows' => false,
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

    $tax_query = array();
    if ($category_id) {
        $tax_query[] = array('taxonomy' => 'product_cat', 'field' => 'term_id', 'terms' => array($category_id), 'include_children' => true);
    }
    if ($tax_query) { $args['tax_query'] = $tax_query; }

    if ($stock && in_array($stock, array('instock','outofstock','onbackorder'), true)) {
        $args['meta_query'] = array(array('key' => '_stock_status', 'value' => $stock));
    }

    $q = new WP_Query($args);
    $items = array();
    foreach ((array) $q->posts as $id) {
        $product = wc_get_product($id);
        if ($product) { $items[] = slsl_product_payload($product); }
    }
    return array(
        'items' => $items,
        'page' => $page,
        'per_page' => $per,
        'total' => (int) $q->found_posts,
        'pages' => max(1, (int) $q->max_num_pages),
        'server_time' => time(),
    );
}

function slsl_merchant_orders($request) {
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
    $items = array();
    foreach ((array) $result->orders as $order) {
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

function slsl_no_store_response($response, $server, $request) {
    $route = is_object($request) && method_exists($request, 'get_route') ? (string) $request->get_route() : '';
    if (strpos($route, '/shishalove-staging/v1/') === 0 && is_object($response) && method_exists($response, 'header')) {
        $response->header('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');
        $response->header('CDN-Cache-Control', 'no-store');
        $response->header('Cloudflare-CDN-Cache-Control', 'no-store');
    }
    return $response;
}
add_filter('rest_post_dispatch', 'slsl_no_store_response', 10, 3);

add_action('rest_api_init', function() {
    register_rest_route('shishalove-staging/v1', '/merchant/bootstrap', array(
        'methods' => 'GET',
        'permission_callback' => 'slsl_merchant_permission',
        'callback' => function() {
            $u = wp_get_current_user();
            return array(
                'logo' => slsl_logo(),
                'user' => array('id' => (int) $u->ID, 'name' => (string) ($u->display_name ?: $u->user_login)),
                'categories' => slsl_merchant_categories(),
                'server_time' => time(),
            );
        },
    ));
    register_rest_route('shishalove-staging/v1', '/merchant/products', array(
        'methods' => 'GET',
        'permission_callback' => 'slsl_merchant_permission',
        'callback' => 'slsl_merchant_products',
    ));
    register_rest_route('shishalove-staging/v1', '/merchant/orders', array(
        'methods' => 'GET',
        'permission_callback' => 'slsl_merchant_permission',
        'callback' => 'slsl_merchant_orders',
    ));
});

add_action('template_redirect', function() {
    if (!empty($_GET['slsl_asset'])) {
        slsl_proxy_remote_asset();
    }
    if (slsl_is_customer_beta_request()) {
        slsl_render_customer_beta();
        exit;
    }
    if (slsl_is_merchant_beta_request()) {
        slsl_render_merchant_beta();
        exit;
    }
}, -100);
