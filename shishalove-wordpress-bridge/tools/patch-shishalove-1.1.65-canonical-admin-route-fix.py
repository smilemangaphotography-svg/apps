#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.65-canonical-admin-route-fix.py <plugin-dir>")

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
    if n!=1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {n}")
    s=s.replace(old,new,1)

if s.count("Version: 1.1.64")!=1 or s.count("define('SLB_VERSION', '1.1.64');")!=1:
    raise SystemExit("expected exact Bridge 1.1.64 baseline")

once("Version: 1.1.64","Version: 1.1.65","plugin version")
once("define('SLB_VERSION', '1.1.64');","define('SLB_VERSION', '1.1.65');","constant version")
once(
    "$url = admin_url('admin.php?page=shishalove-app-bridge');",
    "$url = admin_url('admin.php?page=shishalove-app-bridge-visual-search');",
    "admin redirect URL"
)

old="""add_action('admin_menu', function() {
    add_menu_page('ShishaLove App Bridge — Visual Search', 'ShishaLove App Bridge', 'manage_options', 'shishalove-app-bridge', 'slb_visual_admin_page_162', 'dashicons-search', 58);
    add_submenu_page('shishalove-app-bridge', 'Visual Search', 'Visual Search', 'manage_options', 'shishalove-visual-search', 'slb_visual_admin_page_162');
    remove_submenu_page('shishalove-app-bridge', 'shishalove-app-bridge');
});
"""

new="""/** 1.1.65 — canonical server-rendered Visual Search admin route. */
function slb_visual_admin_page_165() {
    if (!current_user_can('manage_options')) { wp_die(esc_html__('You do not have permission to manage Visual Search.', 'shishalove')); }
    nocache_headers();
    echo '<div class="wrap" id="slb-visual-server-proof"><div class="notice notice-info inline"><p><strong>VISUAL SEARCH SERVER PAGE ' . esc_html(SLB_VERSION) . '</strong></p></div></div>';
    slb_visual_admin_page_162();
}

/** Any bookmark/menu still targeting the obsolete legacy slug is forced to the canonical PHP page. */
add_action('admin_init', function() {
    if (!is_admin() || !current_user_can('manage_options')) { return; }
    $page = isset($_GET['page']) ? sanitize_key((string) wp_unslash($_GET['page'])) : '';
    if ($page !== 'shishalove-visual-search') { return; }
    wp_safe_redirect(admin_url('admin.php?page=shishalove-app-bridge-visual-search'));
    exit;
}, 1);

/** Register late so an obsolete/duplicate Visual Search submenu cannot retain ownership of the menu route. */
add_action('admin_menu', function() {
    global $submenu;
    remove_menu_page('shishalove-app-bridge');
    if (isset($submenu['shishalove-app-bridge'])) { unset($submenu['shishalove-app-bridge']); }

    $top_hook = add_menu_page(
        'ShishaLove App Bridge — Visual Search',
        'ShishaLove App Bridge',
        'manage_options',
        'shishalove-app-bridge',
        'slb_visual_admin_page_165',
        'dashicons-search',
        58
    );
    if ($top_hook) {
        remove_all_actions($top_hook);
        add_action($top_hook, 'slb_visual_admin_page_165');
    }

    remove_submenu_page('shishalove-app-bridge', 'shishalove-visual-search');
    $sub_hook = add_submenu_page(
        'shishalove-app-bridge',
        'Visual Search',
        'Visual Search',
        'manage_options',
        'shishalove-app-bridge-visual-search',
        'slb_visual_admin_page_165'
    );
    if ($sub_hook) {
        remove_all_actions($sub_hook);
        add_action($sub_hook, 'slb_visual_admin_page_165');
    }
    remove_submenu_page('shishalove-app-bridge', 'shishalove-app-bridge');
}, 99999);
"""

once(old,new,"admin menu ownership block")

php.write_text(s,encoding="utf-8")

if merchant.read_bytes()!=merchant_before:
    raise SystemExit("merchant.js unexpectedly changed")
if customer.read_bytes()!=customer_before:
    raise SystemExit("customer.js unexpectedly changed")
if css.read_bytes()!=css_before:
    raise SystemExit("bridge.css unexpectedly changed")
for marker in (
    "shishalove-app-bridge-visual-search",
    "slb_visual_admin_page_165",
    "VISUAL SEARCH SERVER PAGE ",
    "}, 99999);",
):
    if marker not in s:
        raise SystemExit(f"missing marker: {marker}")

print("Bridge 1.1.65 canonical Visual Search admin route fix applied")
