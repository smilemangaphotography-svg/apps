#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.58-pwa.py <plugin-dir>")

root = Path(sys.argv[1])
php = root / "shishalove-app-bridge.php"
cssp = root / "assets" / "bridge.css"
merchantp = root / "assets" / "merchant.js"
customerp = root / "assets" / "customer.js"

for p in (php, cssp, merchantp, customerp):
    if not p.exists():
        raise SystemExit(f"missing {p}")

s = php.read_text(encoding="utf-8")
css = cssp.read_text(encoding="utf-8")
merchant_before = merchantp.read_bytes()
customer_before = customerp.read_bytes()

if s.count("Version: 1.1.57") != 1 or s.count("define('SLB_VERSION', '1.1.57');") != 1:
    raise SystemExit("expected exact Bridge 1.1.57 baseline")

s = s.replace("Version: 1.1.57", "Version: 1.1.58", 1)
s = s.replace("define('SLB_VERSION', '1.1.57');", "define('SLB_VERSION', '1.1.58');", 1)
s = s.replace(
    "window.__SLM_AUTHORITATIVE_MERCHANT_UI='bridge-1.1.57';",
    "window.__SLM_AUTHORITATIVE_MERCHANT_UI='bridge-1.1.58';",
    1,
)

anchor = "function slb_render_shell($mode) {\n"
if s.count(anchor) != 1:
    raise SystemExit("render shell anchor missing/ambiguous")

helpers = r'''/** ShishaLove Merchant 1.1.58 — iPhone Safari / Home Screen PWA support only. */
function slb_merchant_app_icon_url($size = 180) {
    $size = max(32, absint($size));
    $icon = (string) get_site_icon_url($size);
    if (!$icon && $size !== 512) { $icon = (string) get_site_icon_url(512); }
    if (!$icon) { $icon = (string) slb_site_logo(); }
    return $icon;
}

function slb_merchant_manifest_url() {
    return add_query_arg(array(
        'slb_merchant_manifest' => '1',
        'ver' => SLB_VERSION,
    ), home_url('/'));
}

function slb_render_merchant_manifest() {
    status_header(200);
    nocache_headers();
    header('Content-Type: application/manifest+json; charset=UTF-8', true);
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0', true);
    header('Pragma: no-cache', true);

    $icons = array();
    foreach (array(192, 512) as $size) {
        $src = slb_merchant_app_icon_url($size);
        if (!$src) { continue; }
        $icons[] = array(
            'src' => esc_url_raw($src),
            'sizes' => $size . 'x' . $size,
            'purpose' => 'any',
        );
    }

    echo wp_json_encode(array(
        'id' => '/shishalove-merchant/',
        'name' => 'ShishaLove Merchant',
        'short_name' => 'Merchant',
        'start_url' => '/shishalove-merchant/',
        'scope' => '/shishalove-merchant/',
        'display' => 'standalone',
        'orientation' => 'portrait',
        'theme_color' => '#ffffff',
        'background_color' => '#ffffff',
        'icons' => $icons,
    ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

'''
s = s.replace(anchor, helpers + anchor, 1)

old_head = '''<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<title><?php echo $is_merchant ? 'ShishaLove Merchant' : 'ShishaLove'; ?></title>
<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">
<link rel="stylesheet" href="<?php echo esc_url(SLB_URL . 'assets/bridge.css?ver=' . rawurlencode($css_ver)); ?>">'''

new_head = '''<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<title><?php echo $is_merchant ? 'ShishaLove Merchant' : 'ShishaLove'; ?></title>
<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">
<?php if ($is_merchant) { ?>
<link rel="manifest" href="<?php echo esc_url(slb_merchant_manifest_url()); ?>">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="ShishaLove Merchant">
<link rel="apple-touch-icon" sizes="180x180" href="<?php echo esc_url(slb_merchant_app_icon_url(180)); ?>">
<?php } ?>
<link rel="stylesheet" href="<?php echo esc_url(SLB_URL . 'assets/bridge.css?ver=' . rawurlencode($css_ver)); ?>">'''

if s.count(old_head) != 1:
    raise SystemExit("Merchant head anchor missing/ambiguous")
s = s.replace(old_head, new_head, 1)

old_redirect = """add_action('template_redirect', function() {
    if (slb_is_customer_request()) { slb_render_shell('customer'); exit; }
    if (slb_is_merchant_request()) { slb_render_shell('merchant'); exit; }
}, 0);"""

new_redirect = """add_action('template_redirect', function() {
    if (isset($_GET['slb_merchant_manifest']) && sanitize_text_field(wp_unslash($_GET['slb_merchant_manifest'])) === '1') { slb_render_merchant_manifest(); exit; }
    if (slb_is_customer_request()) { slb_render_shell('customer'); exit; }
    if (slb_is_merchant_request()) { slb_render_shell('merchant'); exit; }
}, 0);"""

if s.count(old_redirect) != 1:
    raise SystemExit("template_redirect anchor missing/ambiguous")
s = s.replace(old_redirect, new_redirect, 1)

css += r'''

/* ShishaLove Merchant 1.1.58 — iPhone Safari / Add to Home Screen only.
   Android is excluded. env() resolves to 0 on devices without display cutouts. */
:root{
  --safe-left:env(safe-area-inset-left,0px);
  --safe-right:env(safe-area-inset-right,0px);
}
html:not(.slb-android-app) body.slb-merchant .slm-app{
  padding-left:var(--safe-left)!important;
  padding-right:var(--safe-right)!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-top{
  height:calc(88px + var(--safe-top))!important;
  min-height:calc(88px + var(--safe-top))!important;
  padding-top:var(--safe-top)!important;
  padding-left:calc(22px + var(--safe-left))!important;
  padding-right:calc(22px + var(--safe-right))!important;
  box-sizing:border-box!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-bottom{
  height:calc(82px + var(--safe-bottom))!important;
  min-height:calc(82px + var(--safe-bottom))!important;
  flex-basis:calc(82px + var(--safe-bottom))!important;
  padding:0 0 var(--safe-bottom)!important;
  box-sizing:border-box!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-panel{
  padding-left:calc(18px + var(--safe-left))!important;
  padding-right:calc(18px + var(--safe-right))!important;
  padding-bottom:calc(90px + var(--safe-bottom))!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-login{
  min-height:100dvh!important;
  overflow-y:auto!important;
  padding:calc(24px + var(--safe-top)) calc(24px + var(--safe-right)) calc(24px + var(--safe-bottom)) calc(24px + var(--safe-left))!important;
}
@media (display-mode: standalone){
  html,body.slb-merchant{height:100%;min-height:100%;background:#fff}
  html:not(.slb-android-app) body.slb-merchant .slm-app{height:100dvh!important;max-height:100dvh!important;}
}
'''

php.write_text(s, encoding="utf-8")
cssp.write_text(css, encoding="utf-8")

if merchantp.read_bytes() != merchant_before:
    raise SystemExit("merchant.js unexpectedly changed")
if customerp.read_bytes() != customer_before:
    raise SystemExit("customer.js unexpectedly changed")

required = (
    "'name' => 'ShishaLove Merchant'",
    "'short_name' => 'Merchant'",
    "'start_url' => '/shishalove-merchant/'",
    "'scope' => '/shishalove-merchant/'",
    "'display' => 'standalone'",
    "apple-mobile-web-app-capable",
    "apple-mobile-web-app-status-bar-style",
    "apple-mobile-web-app-title",
    "apple-touch-icon",
    "slb_merchant_manifest",
)
for marker in required:
    if marker not in s:
        raise SystemExit(f"missing marker: {marker}")

if "navigator.serviceWorker" in s or "serviceWorker.register" in s:
    raise SystemExit("unexpected service worker code")

print("Bridge 1.1.58 PWA patch applied successfully")
