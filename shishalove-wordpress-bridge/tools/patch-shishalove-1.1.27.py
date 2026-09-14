#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.27.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.26-r2.py'), str(root)])


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label}: expected anchor not found')
    if text.count(old) != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {text.count(old)}')
    return text.replace(old, new, 1)


def replace_between(text, start, end, replacement, label):
    s = text.find(start)
    if s < 0:
        raise SystemExit(f'{label}: start marker missing')
    e = text.find(end, s)
    if e < 0:
        raise SystemExit(f'{label}: end marker missing')
    return text[:s] + replacement.rstrip() + '\n' + text[e:]

# -----------------------------------------------------------------------------
# CUSTOMER — current release identity, forced CSS cache bust, readable nav labels,
# full sort control width. No product/catalogue logic is changed.
# -----------------------------------------------------------------------------
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer, count = re.subn(r"var BUILD='[^']+';", "var BUILD='1.1.27';", customer, count=1)
if count != 1:
    raise SystemExit('customer BUILD anchor missing')
customer = replace_once(
    customer,
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nvar root=document.getElementById('slb-root');",
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nCFG.version='1.1.27';\nvar root=document.getElementById('slb-root');\nfunction slbRuntimeRefresh(){try{var q=new URLSearchParams(location.search),ua=navigator.userAgent||'';if((q.get('app')==='android'||q.has('build')||/\\bwv\\b/i.test(ua))&&/Android/i.test(ua))document.documentElement.classList.add('slb-android-app');var l=document.querySelector('link[href*=\"bridge.css\"]');if(l){var u=new URL(l.href,location.href);u.searchParams.set('slbfix','1.1.27');l.href=u.toString();}}catch(e){}}\nslbRuntimeRefresh();",
    'customer runtime freshness'
)
customer_path.write_text(customer, encoding='utf-8')

# -----------------------------------------------------------------------------
# MERCHANT — current release identity, forced CSS freshness, square media tiles,
# dashboard totals, and More > Media Library retained. No orders/product/stock
# business rules are changed.
# -----------------------------------------------------------------------------
merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = replace_once(
    merchant,
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nvar root=document.getElementById('slb-root');",
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nCFG.version='1.1.27';\nvar root=document.getElementById('slb-root');\nfunction slmRuntimeRefresh(){try{var q=new URLSearchParams(location.search),ua=navigator.userAgent||'';if((q.get('app')==='android'||q.has('build')||/\\bwv\\b/i.test(ua))&&/Android/i.test(ua))document.documentElement.classList.add('slb-android-app');var l=document.querySelector('link[href*=\"bridge.css\"]');if(l){var u=new URL(l.href,location.href);u.searchParams.set('slbfix','1.1.27');l.href=u.toString();}}catch(e){}}\nslmRuntimeRefresh();",
    'merchant runtime freshness'
)

library_tile = r'''function libraryTile(m,selectable,selected){
  var dim=(m.width&&m.height)?(m.width+' × '+m.height):'',ideal=(Number(m.width)===600&&Number(m.height)===600),id=Number(m.id)||0;
  var action=selectable?' data-media-select="'+id+'"':' data-media-preview="'+id+'"';
  return '<article class="slm-library-tile '+(selected?'selected ':'')+(ideal?'ideal':'')+'" style="display:flex;flex-direction:column;min-width:0;border:2px solid #ececef;border-radius:14px;background:#fff;overflow:hidden">'+
    '<button type="button" class="slm-library-select"'+action+' style="display:block;width:100%;min-width:0;border:0;background:#fff;padding:0;text-align:left;color:#111">'+
      '<span class="slm-library-thumb" style="display:block;width:100%;aspect-ratio:1/1;min-height:148px;background:#f5f5f6;overflow:hidden">'+
        '<img src="'+esc(m.source_url||m.thumb_url||'')+'" alt="'+esc(m.title||'Media')+'" style="display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;background:#fff;padding:6px;margin:0">'+
      '</span><span class="slm-library-title">'+esc(m.title||('Media #'+id))+'</span><small>'+esc(dim)+(ideal?' · 1:1':'')+'</small></button>'+
    '<button type="button" class="slm-library-delete" data-media-delete="'+id+'">DELETE PERMANENTLY</button></article>';
}
'''
merchant = replace_between(merchant, 'function libraryTile(', 'function mediaLibraryModal(){', library_tile, 'merchant square media tile')

# Make the More screen report the live release even when an old cached shell supplied CFG.
more_body = r'''function moreBody(){var u=state.bootstrap&&state.bootstrap.user||{};return '<main class="slm-page"><div class="slm-head"><div><h1>More</h1><div class="slm-muted">Signed in as '+esc(u.name||'WordPress user')+'</div></div></div><div class="slb-account-card">Bridge 1.1.27</div><button class="slb-account-card slm-account-button" data-view="media-library">Media Library</button><a class="slb-account-card" href="'+esc(CFG.site)+'wp-admin/">Open WordPress Admin</a><a class="slb-account-card" href="'+esc(CFG.site)+'wp-admin/admin.php?page=wc-admin">WooCommerce Admin</a></main>';}
'''
merchant = replace_between(merchant, 'function moreBody(){', 'function categoryData(){', more_body, 'merchant More current version')

# Load dashboard totals directly instead of showing an em dash until Orders was opened.
dashboard_block = r'''var dashboardStats=null,dashboardStatsLoading=false;
function loadDashboardStats(force){
  if(dashboardStatsLoading||(!force&&dashboardStats))return;
  dashboardStatsLoading=true;
  Promise.all([api('merchant/products?page=1&per_page=1'),api('merchant/orders?page=1&per_page=1')]).then(function(rows){
    dashboardStats={products:Number(rows[0]&&rows[0].total||0),orders:Number(rows[1]&&rows[1].total||0)};
    dashboardStatsLoading=false;
    if(state.view==='dashboard')render();
  }).catch(function(){dashboardStatsLoading=false;});
}
function dashboardBody(){
  var pc=cget(vkey('slm-products-all-1-20-0-all-'),0),oc=state.orders||cget(vkey('slm-orders-1'),0);
  if(!dashboardStats)loadDashboardStats(false);
  var products=dashboardStats?dashboardStats.products:(pc?pc.total:'—');
  var orders=dashboardStats?dashboardStats.orders:(oc&&oc.total!=null?oc.total:'—');
  return '<main class="slm-page"><div class="slm-head"><div><h1>Dashboard</h1><div class="slm-muted">WooCommerce overview</div></div></div><div class="slm-dashboard-grid"><div class="slm-stat"><b>'+products+'</b><span>Products</span></div><div class="slm-stat"><b>'+orders+'</b><span>Orders</span></div></div><button class="slb-primary" style="margin-top:18px" data-view="products">MANAGE PRODUCTS</button></main>';
}
'''
merchant = replace_between(merchant, 'function dashboardBody(){', 'function moreBody(){', dashboard_block, 'merchant dashboard totals')

# Clarify the permanent phone-upload processing in the editor copy.
merchant = merchant.replace(
    'Phone upload and WordPress Media Library are both available. Existing 1:1 ShishaLove artwork is preserved exactly as stored.',
    'Phone uploads are permanently saved as 600 × 600 with one ShishaLove watermark at bottom-right. Existing WordPress Media Library images are preserved exactly as stored.',
    1
)
merchant_path.write_text(merchant, encoding='utf-8')

# -----------------------------------------------------------------------------
# PHP — hard no-cache shell + filemtime asset versioning so an old 1.1.24 page
# cannot keep serving stale CSS/CFG. Phone uploads are normalized to 600x600 and
# watermarked exactly once. Existing Media Library files are never re-watermarked.
# -----------------------------------------------------------------------------
main_path = root / 'shishalove-app-bridge.php'
main = main_path.read_text(encoding='utf-8')

main = replace_once(
    main,
    "function slb_render_shell($mode) {\n    status_header(200);\n    nocache_headers();",
    "function slb_render_shell($mode) {\n    if (!defined('DONOTCACHEPAGE')) { define('DONOTCACHEPAGE', true); }\n    status_header(200);\n    nocache_headers();\n    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0', true);\n    header('Pragma: no-cache', true);\n    header('Expires: Wed, 11 Jan 1984 05:00:00 GMT', true);",
    'runtime no-cache headers'
)
main = replace_once(
    main,
    "    ?><!doctype html>\n<html <?php language_attributes(); ?>>",
    "    $css_ver = SLB_VERSION . '-' . (string) @filemtime(SLB_DIR . 'assets/bridge.css');\n    $js_name = $is_merchant ? 'merchant.js' : 'customer.js';\n    $js_ver = SLB_VERSION . '-' . (string) @filemtime(SLB_DIR . 'assets/' . $js_name);\n    ?><!doctype html>\n<html <?php language_attributes(); ?>>",
    'runtime asset fingerprints'
)
main = main.replace(
    "<link rel=\"stylesheet\" href=\"<?php echo esc_url(SLB_URL . 'assets/bridge.css?ver=' . rawurlencode(SLB_VERSION)); ?>\">",
    "<meta http-equiv=\"Cache-Control\" content=\"no-store, no-cache, must-revalidate, max-age=0\">\n<link rel=\"stylesheet\" href=\"<?php echo esc_url(SLB_URL . 'assets/bridge.css?ver=' . rawurlencode($css_ver)); ?>\">",
    1
)
main = main.replace(
    "<script src=\"<?php echo esc_url(SLB_URL . 'assets/' . ($is_merchant ? 'merchant.js' : 'customer.js') . '?ver=' . rawurlencode(SLB_VERSION)); ?>\" defer></script>",
    "<script src=\"<?php echo esc_url(SLB_URL . 'assets/' . $js_name . '?ver=' . rawurlencode($js_ver)); ?>\" defer></script>",
    1
)

watermark_upload = r'''
function slb_product_artwork_logo_resource() {
    if (!function_exists('imagecreatefromstring')) { return false; }
    $url = slb_site_logo();
    if (!$url) { return false; }
    $bytes = '';
    $logo_id = attachment_url_to_postid($url);
    if ($logo_id) {
        $file = get_attached_file($logo_id);
        if ($file && is_readable($file)) { $bytes = (string) @file_get_contents($file); }
    }
    if ($bytes === '') {
        $response = wp_remote_get($url, array('timeout' => 5));
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $bytes = (string) wp_remote_retrieve_body($response);
        }
    }
    return $bytes !== '' ? @imagecreatefromstring($bytes) : false;
}

function slb_prepare_product_artwork($id) {
    $id = absint($id);
    if (!$id || !function_exists('imagecreatetruecolor') || !function_exists('imagecreatefromstring')) { return false; }
    if (get_post_meta($id, '_slb_product_artwork_600_watermark', true) === '1') { return true; }
    $file = get_attached_file($id);
    if (!$file || !is_readable($file)) { return false; }
    $info = @getimagesize($file);
    if (!$info || empty($info[0]) || empty($info[1]) || empty($info['mime'])) { return false; }
    $mime = (string) $info['mime'];
    if (!in_array($mime, array('image/jpeg','image/png','image/webp','image/gif'), true)) { return false; }
    $bytes = (string) @file_get_contents($file);
    $src = $bytes !== '' ? @imagecreatefromstring($bytes) : false;
    if (!$src) { return false; }

    $canvas = imagecreatetruecolor(600, 600);
    if (!$canvas) { imagedestroy($src); return false; }
    imagealphablending($canvas, true);
    $white = imagecolorallocate($canvas, 255, 255, 255);
    imagefilledrectangle($canvas, 0, 0, 599, 599, $white);

    $sw = imagesx($src); $sh = imagesy($src);
    $scale = min(552 / max(1, $sw), 552 / max(1, $sh));
    $dw = max(1, (int) round($sw * $scale));
    $dh = max(1, (int) round($sh * $scale));
    $dx = (int) floor((600 - $dw) / 2);
    $dy = (int) floor((600 - $dh) / 2);
    imagecopyresampled($canvas, $src, $dx, $dy, 0, 0, $dw, $dh, $sw, $sh);
    imagedestroy($src);

    $logo = slb_product_artwork_logo_resource();
    if ($logo) {
        $lw0 = imagesx($logo); $lh0 = imagesy($logo);
        if ($lw0 > 0 && $lh0 > 0) {
            $lw = 118;
            $lh = max(1, (int) round($lh0 * ($lw / $lw0)));
            if ($lh > 58) { $lh = 58; $lw = max(1, (int) round($lw0 * ($lh / $lh0))); }
            $lx = 600 - $lw - 16;
            $ly = 600 - $lh - 14;
            imagealphablending($canvas, true);
            imagecopyresampled($canvas, $logo, $lx, $ly, 0, 0, $lw, $lh, $lw0, $lh0);
        }
        imagedestroy($logo);
    }

    $saved = false;
    if ($mime === 'image/png' && function_exists('imagepng')) { $saved = imagepng($canvas, $file, 6); }
    elseif ($mime === 'image/webp' && function_exists('imagewebp')) { $saved = imagewebp($canvas, $file, 92); }
    elseif ($mime === 'image/gif' && function_exists('imagegif')) { $saved = imagegif($canvas, $file); }
    elseif (function_exists('imagejpeg')) { $saved = imagejpeg($canvas, $file, 92); }
    imagedestroy($canvas);
    if (!$saved) { return false; }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    $meta = wp_generate_attachment_metadata($id, $file);
    if (is_array($meta)) { wp_update_attachment_metadata($id, $meta); }
    update_post_meta($id, '_slb_product_artwork_600_watermark', '1');
    update_post_meta($id, '_slb_product_artwork_size', '600x600');
    return true;
}

function slb_upload_merchant_media($request) {
    if (empty($_FILES['file']) || !is_array($_FILES['file'])) {
        return new WP_Error('missing_file', 'No image was supplied', array('status' => 400));
    }
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $id = media_handle_upload('file', 0, array(), array('test_form' => false));
    if (is_wp_error($id)) { return $id; }
    slb_prepare_product_artwork($id);
    $url = wp_get_attachment_image_url($id, 'full');
    $meta = wp_get_attachment_metadata($id);
    return array(
        'id' => (int) $id,
        'source_url' => $url ? $url : wp_get_attachment_url($id),
        'width' => isset($meta['width']) ? (int) $meta['width'] : 600,
        'height' => isset($meta['height']) ? (int) $meta['height'] : 600,
        'watermarked' => true,
    );
}
'''
main = replace_between(main, 'function slb_upload_merchant_media($request) {', 'function slb_save_product($request, $id = 0) {', watermark_upload, 'permanent product watermark upload')
main_path.write_text(main, encoding='utf-8')

# -----------------------------------------------------------------------------
# CSS — final cache-independent layout fixes. Merchant Android nav is lifted above
# the system button bar, editor bottom actions no longer cover form content, Media
# Library has real square previews/safe bottom, and Customer labels/sort remain clear.
# -----------------------------------------------------------------------------
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.27 — remaining scoped runtime/media/safe-area corrections */
:root{--slb-native-bottom:0px}
html.slb-android-app{--slb-native-bottom:48px}

body.slb-customer .slb-bottom button,
body.slb-customer .slb-bottom .slb-bottom-label{
  color:#4a4a4d!important;-webkit-text-fill-color:#4a4a4d!important;opacity:1!important;filter:none!important;font-weight:900!important;
}
body.slb-customer .slb-bottom button.active,
body.slb-customer .slb-bottom button.active .slb-bottom-label{
  color:var(--sl-red)!important;-webkit-text-fill-color:var(--sl-red)!important;
}
body.slb-customer .slb-toolbar{grid-template-columns:minmax(0,.72fr) minmax(176px,1.28fr)!important}
body.slb-customer .slb-toolbar select{min-width:176px!important;width:100%!important;font-size:15px!important;padding-right:28px!important}
body.slb-customer .slb-product-image{padding:12px!important}
body.slb-customer .slb-product-image.slb-product-placeholder{padding:0!important}

html.slb-android-app body.slb-merchant .slm-bottom{
  bottom:var(--slb-native-bottom)!important;height:76px!important;padding-bottom:0!important;
}
html.slb-android-app body.slb-merchant .slm-app{
  padding-bottom:calc(88px + var(--slb-native-bottom))!important;
}
body.slb-merchant:has(.slm-panel.open) .slm-bottom,
body.slb-merchant:has(.slm-media-library-modal) .slm-bottom{display:none!important}
body.slb-merchant .slm-panel.open .slm-form{padding-bottom:170px!important}
body.slb-merchant .slm-panel.open .slm-form-actions{
  bottom:calc(var(--slb-native-bottom) + 10px)!important;
}

.slm-media-library-modal{
  box-sizing:border-box!important;padding:18px 10px calc(24px + var(--slb-native-bottom))!important;align-items:flex-start!important;overflow:hidden!important;
}
.slm-media-library-card{
  width:min(100%,720px)!important;height:calc(100dvh - 54px - var(--slb-native-bottom))!important;max-height:none!important;overflow:hidden!important;
}
.slm-media-library-grid,.slm-manager-grid{
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-content:start!important;
}
.slm-media-library-grid{overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;min-height:0!important}
.slm-library-tile{min-width:0!important;height:auto!important;min-height:0!important;overflow:hidden!important}
.slm-library-select{height:auto!important;min-height:0!important}
.slm-library-thumb{display:block!important;width:100%!important;aspect-ratio:1/1!important;height:auto!important;min-height:148px!important;overflow:hidden!important;background:#fff!important}
.slm-library-thumb img{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;background:#fff!important;padding:6px!important;margin:0!important}
.slm-media-library-add{margin-bottom:0!important;min-height:56px!important;flex:0 0 auto!important}
.slm-media-library-footer{flex:0 0 auto!important}
.slm-media-manager-page{padding-bottom:calc(96px + var(--slb-native-bottom))!important}

@media(max-width:380px){
  .slm-media-library-grid,.slm-manager-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
  .slm-library-thumb{min-height:132px!important}
}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.27: cache freshness, merchant safe areas, square media library, dashboard orders and permanent 600x600 watermark fixed')
