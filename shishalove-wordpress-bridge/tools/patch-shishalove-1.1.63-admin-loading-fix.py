#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.63-admin-loading-fix.py <plugin-dir>")

root=Path(sys.argv[1])
php=root/"shishalove-app-bridge.php"
merchant=root/"assets"/"merchant.js"
customer=root/"assets"/"customer.js"
css=root/"assets"/"bridge.css"
for p in (php,merchant,customer,css):
    if not p.exists():
        raise SystemExit(f"missing {p}")

s=php.read_text(encoding="utf-8")
merchant_before=merchant.read_bytes()
customer_before=customer.read_bytes()
css_before=css.read_bytes()

def once(old,new,label):
    global s
    n=s.count(old)
    if n != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {n}")
    s=s.replace(old,new,1)

if s.count("Version: 1.1.62") != 1 or s.count("define('SLB_VERSION', '1.1.62');") != 1:
    raise SystemExit("expected exact Bridge 1.1.62 baseline")

once("Version: 1.1.62","Version: 1.1.63","plugin version")
once("define('SLB_VERSION', '1.1.62');","define('SLB_VERSION', '1.1.63');","constant version")

once(
    "add_action('init','slb_visual_install_table_160',4);",
    """/** 1.1.63: do not run visual-index schema installation on ordinary page loads.
 * The table is created by explicit index/search workflows that need it. */""",
    "unconditional visual schema init"
)

anchor="function slb_visual_admin_notice_message_162($code) {\n"
helper=r'''/** 1.1.63 — lightweight admin status. Never install/query the visual-index table while rendering settings. */
function slb_visual_admin_status_snapshot_163() {
    $configured = (bool) slb_visual_search_api_key();
    $state = slb_visual_index_state_160();
    if (!is_array($state)) { $state = array(); }
    $dirty = get_option('slb_visual_dirty_160', array());
    if (!is_array($dirty)) { $dirty = array(); }

    $status = strtolower((string)($state['status'] ?? ''));
    if (!$configured && ($status === '' || $status === 'not_started' || $status === 'not_configured')) {
        $status = 'not_configured';
    } elseif ($configured && ($status === '' || $status === 'not_configured')) {
        $status = 'not_started';
    }

    $indexed_products = max(0, (int)($state['indexed_products'] ?? 0));
    $indexed_images = max(0, (int)($state['indexed_images'] ?? 0));
    $updated_at = max(0, (int)($state['updated_at'] ?? 0));
    $failed_items = isset($state['failed_items']) && is_array($state['failed_items']) ? $state['failed_items'] : array();

    return array_merge($state, array(
        'backend_version' => slb_visual_backend_version_161(),
        'provider' => slb_visual_provider_161(),
        'configured' => $configured,
        'status' => $status,
        'index_count' => $indexed_images,
        'indexed_images' => $indexed_images,
        'indexed_product_rows' => $indexed_products,
        'indexed_products' => $indexed_products,
        'queued_products' => count($dirty),
        'failed_count' => max(0, (int)($state['failed_count'] ?? count($failed_items))),
        'last_index_update' => $updated_at ? gmdate('c', $updated_at) : '',
        'model' => slb_visual_model_160(),
    ));
}

'''
if s.count(anchor) != 1:
    raise SystemExit("admin notice anchor missing")
s=s.replace(anchor,helper+anchor,1)

once(
"""function slb_visual_admin_page_162() {
    if (!current_user_can('manage_options')) { return; }
    $status = slb_visual_index_status_160();
    $configured = !empty($status['configured']);
""",
"""function slb_visual_admin_page_162() {
    if (!current_user_can('manage_options')) { return; }
    // 1.1.63: settings must render even with no key/table/index.
    try {
        $status = slb_visual_admin_status_snapshot_163();
        $status_load_error = '';
    } catch (Throwable $e) {
        $configured_now = (bool) slb_visual_search_api_key();
        $status = array(
            'configured' => $configured_now,
            'status' => $configured_now ? 'not_started' : 'not_configured',
            'indexed_product_rows' => 0,
            'indexed_products' => 0,
            'index_count' => 0,
            'indexed_images' => 0,
            'failed_count' => 0,
            'queued_products' => 0,
            'last_index_update' => '',
        );
        $status_load_error = 'Visual index status could not be read. The API key settings are still available below.';
    }
    $configured = !empty($status['configured']);
""",
"admin page synchronous status dependency"
)

once(
"""      <?php if ($notice) { ?><div class="notice notice-<?php echo esc_attr($notice[0]); ?> is-dismissible"><p><?php echo esc_html($notice[1]); ?></p></div><?php } ?>
      <div class="card" style="max-width:820px;padding:22px;margin-top:18px">
""",
"""      <?php if ($notice) { ?><div class="notice notice-<?php echo esc_attr($notice[0]); ?> is-dismissible"><p><?php echo esc_html($notice[1]); ?></p></div><?php } ?>
      <?php if (!empty($status_load_error)) { ?><div class="notice notice-warning"><p><?php echo esc_html($status_load_error); ?></p><p><a class="button" href="<?php echo esc_url(slb_visual_admin_url_162()); ?>">RETRY</a></p></div><?php } ?>
      <div class="card" style="max-width:820px;padding:22px;margin-top:18px">
""",
"admin fallback"
)

php.write_text(s,encoding="utf-8")

if merchant.read_bytes() != merchant_before:
    raise SystemExit("merchant.js unexpectedly changed")
if customer.read_bytes() != customer_before:
    raise SystemExit("customer.js unexpectedly changed")
if css.read_bytes() != css_before:
    raise SystemExit("bridge.css unexpectedly changed")
if "slb_visual_admin_status_snapshot_163()" not in s:
    raise SystemExit("lightweight admin status missing")
if "add_action('init','slb_visual_install_table_160',4)" in s:
    raise SystemExit("unconditional visual schema init still present")

print("Bridge 1.1.63 admin-loading fix applied")
