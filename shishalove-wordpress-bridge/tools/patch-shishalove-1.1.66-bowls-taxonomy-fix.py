#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.66-bowls-taxonomy-fix.py <plugin-dir>")

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
    raise SystemExit("expected exact Bridge 1.1.64 live baseline")

once("Version: 1.1.64","Version: 1.1.66","plugin version")
once("define('SLB_VERSION', '1.1.64');","define('SLB_VERSION', '1.1.66');","constant version")

old="""    // Some historic menu entries can be custom links to a product-category URL.
    // Resolve by the stable URL slug only; never by display-name matching.
    if ((!$term || is_wp_error($term)) && !empty($item->url)) {
        $path = (string) wp_parse_url((string) $item->url, PHP_URL_PATH);
        if (preg_match('#/product-category/([^/]+)/?#i', $path, $m)) {
            $taxonomy = 'product_cat';
            $term = get_term_by('slug', sanitize_title(rawurldecode($m[1])), 'product_cat');
        }
    }
"""
new="""    // Some historic Main Navigation entries are custom links to nested
    // WooCommerce product-category URLs such as:
    //   /product-category/bowls/phunnel-bowls/
    // The authoritative category is the DEEPEST path segment after
    // /product-category/, not the first segment (which is only the parent).
    // Resolve by URL structure only; never by the display label.
    if ((!$term || is_wp_error($term)) && !empty($item->url)) {
        $path = (string) wp_parse_url((string) $item->url, PHP_URL_PATH);
        $marker = '/product-category/';
        $pos = stripos($path, $marker);
        if ($pos !== false) {
            $tail = trim(substr($path, $pos + strlen($marker)), '/');
            if ($tail !== '') {
                $segments = array_values(array_filter(explode('/', $tail), 'strlen'));
                $leaf = $segments ? end($segments) : '';
                $slug = sanitize_title(rawurldecode((string) $leaf));
                if ($slug !== '') {
                    $taxonomy = 'product_cat';
                    $term = get_term_by('slug', $slug, 'product_cat');
                }
            }
        }
    }
"""
once(old,new,"nested product-category URL resolver")
once("$cache_key = 'slb_merchant_filter_contexts_159_' . $menu_id;","$cache_key = 'slb_merchant_filter_contexts_166_' . $menu_id;","filter-context cache generation")
once("'order'=>'menu_order',
                ),","'order'=>'menu_order',
                    'resolver'=>'menu_object_id_or_leaf_product_category_slug_v166',
                ),","resolver source marker")

php.write_text(s,encoding="utf-8")

if merchant.read_bytes()!=merchant_before:
    raise SystemExit("merchant.js unexpectedly changed")
if customer.read_bytes()!=customer_before:
    raise SystemExit("customer.js unexpectedly changed")
if css.read_bytes()!=css_before:
    raise SystemExit("bridge.css unexpectedly changed")

required=(
    "Version: 1.1.66",
    "define('SLB_VERSION', '1.1.66');",
    "$marker = '/product-category/';",
    "$leaf = $segments ? end($segments) : '';",
    "slb_merchant_filter_contexts_166_",
    "menu_object_id_or_leaf_product_category_slug_v166",
    "$category_exact = rest_sanitize_boolean",
    "'include_children'=>!$category_exact",
)
for marker in required:
    if marker not in s:
        raise SystemExit(f"missing marker: {marker}")

print("Bridge 1.1.66 Bowls taxonomy fix applied")
