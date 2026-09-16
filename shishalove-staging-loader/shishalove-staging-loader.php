<?php
/**
 * Plugin Name: ShishaLove Staging Loader
 * Description: Isolated Customer beta route for one-by-one staging fixes. Production Customer/Merchant routes are untouched.
 * Version: 1.0.0
 * Author: ShishaLove
 */

if (!defined('ABSPATH')) { exit; }

define('SLSL_VERSION', '1.0.0');

function slsl_is_beta_request() {
    $uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '/';
    $path = wp_parse_url($uri, PHP_URL_PATH);
    $path = '/' . ltrim((string) $path, '/');
    return preg_match('#^/shishalove-app-beta/?$#i', $path) === 1;
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
    $stamp = (string) time();
    $remote_base = 'https://raw.githubusercontent.com/smilemangaphotography-svg/apps/shishalove-staging/shishalove-staging/';
    $stage_css = $remote_base . 'customer-staging.css?t=' . rawurlencode($stamp);
    $stage_js = $remote_base . 'customer-staging.js?t=' . rawurlencode($stamp);
    ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="robots" content="noindex,nofollow">
<title>ShishaLove Customer Beta</title>
<link rel="stylesheet" href="<?php echo esc_url($base_css); ?>">
<link rel="stylesheet" href="<?php echo esc_url($stage_css); ?>">
</head>
<body class="slb slb-customer slb-staging">
<div id="slb-root" aria-live="polite"></div>
<script>window.SHISHALOVE_BRIDGE=<?php echo wp_json_encode($cfg, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>;</script>
<script src="<?php echo esc_url($base_js); ?>" defer></script>
<script src="<?php echo esc_url($stage_js); ?>" defer></script>
</body>
</html><?php
}

add_action('template_redirect', function() {
    if (!slsl_is_beta_request()) { return; }
    slsl_render_customer_beta();
    exit;
}, -100);
