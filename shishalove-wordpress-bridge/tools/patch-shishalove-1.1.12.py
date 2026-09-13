#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.12.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# Always start from the owner-validated 1.1.11 bridge, then apply only the
# corrections confirmed from the live 1.1.11 web-view screenshots.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.11.py'), str(root)])

js_path = root / 'assets' / 'customer.js'
css_path = root / 'assets' / 'bridge.css'
php_path = root / 'shishalove-app-bridge.php'

js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
php = php_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'1.1.12 patch failed: {label}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label):
    out, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'1.1.12 patch failed: {label} ({count})')
    return out


# New cache namespace so the phone/browser cannot keep the previous Hookah
# catalogue or old drawer artwork from 1.1.11.
js = replace_once(js, "var BUILD='1.1.11';", "var BUILD='1.1.12';", 'customer cache namespace')

# CUSTOMER DRAWER LOGO LOCK
# Keep the approved red-heart + white ShishaLove launcher artwork, but stop
# displaying it as a small square app icon. Crop the square source inside a
# wide black lockup so the red heart and white ShishaLove mark read as the
# horizontal brand on the black drawer.
old_drawer = '<div class="slb-drawer-logo"><img class="slb-drawer-owner-logo" src="\'+esc(CUSTOMER_DRAWER_LOGO)+\'" alt="ShishaLove"></div>'
new_drawer = '<div class="slb-drawer-logo slb-drawer-logo-final"><span class="slb-drawer-logo-crop"><img class="slb-drawer-owner-logo" src="\'+esc(CUSTOMER_DRAWER_LOGO)+\'" alt="ShishaLove"></span></div>'
js = replace_once(js, old_drawer, new_drawer, 'wide customer drawer logo markup')

# HOOKAH BRAND LOCK
# The live WooCommerce site does NOT model every Hookah brand as a descendant
# of the Hookah category. 1.1.11 therefore still dropped valid brands. Build
# the catalogue from three sources, in this order:
#   1) the owner-visible legacy brand list (never remove these when terms exist)
#   2) every category attached to a product that is actually in Hookah
#   3) all nested descendants under Hookah
# Structural product-type categories are excluded. Everything is deduplicated.
complete_collection = r'''function slb_collection_all($root_label) {
    $root = slb_find_term($root_label);
    if (!$root) { return array(); }

    $out = array();
    $seen = array();
    $structural = array_fill_keys(array_map('slb_normalize', array(
        'Accessories','Cases','Charcoal Burner','Charcoal Holder','Cleaning','GASKETS',
        'Hookah Boards','Hookah Colorants','Hookah Vases','Molasses Catcher','Pokers','Tongs',
        'Bowls','Glass','Heat Management','Killer','Phunnel','Charcoal','Flavors','Hoses',
        'Connectors','Disposable','Hose Parts','Leather','Mouth Tips','MOUTHPIECES','Mouthpieces',
        'Silicone','Merchandise','Laser Engravable Products','Mega Deals','Uncategorized',
        'XMAS OFFERS','LOVE & HOOKAH BUNDLES','Hookah'
    )), true);

    $add_term = function($term) use (&$out, &$seen, $structural) {
        if (!$term || is_wp_error($term)) { return; }
        $id = (int) $term->term_id;
        $key = slb_normalize($term->name);
        if (!$id || isset($seen[$id]) || isset($structural[$key]) || (int) $term->count <= 0) { return; }
        $seen[$id] = true;
        $out[] = slb_term_payload($term);
    };

    // Permanent owner-visible Hookah brands. Terms are only shown when they
    // exist in WooCommerce and currently contain products.
    $preferred = array(
        'Wookah','Alpha','Steamulation','Union','MIG','El-Badia','Moze','Meduse','Anima',
        'Gold Miner','YKAP','Maklaud','Mexanika','DIAVLA','Karma','Darkside','Matt Pear','MattPear',
        'Shadow Hookah','KAYA','KORESS','El Bomber','OVO','H/S','Orden','Hooligan','SHI CARVER',
        'Voodoo','Pandora','Mamay','Shisha Original','IZZY','Prisma','VZ Hookah','Nube','Mashisha',
        'BATR','Pushka','DSH','Tempus','Retrofit','First','KRAKEN','FRNKN STEIN','Octopuz','Shishalove'
    );
    foreach ($preferred as $label) {
        $add_term(slb_find_global_exact($label));
    }

    // Discover brand/category terms from products that genuinely belong to
    // Hookah. This catches global brand categories that are siblings of Hookah
    // rather than descendants of it.
    $product_ids = get_posts(array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'fields' => 'ids',
        'no_found_rows' => true,
        'tax_query' => array(array(
            'taxonomy' => 'product_cat',
            'field' => 'term_id',
            'terms' => array((int) $root->term_id),
            'include_children' => true,
        )),
    ));
    foreach ((array) $product_ids as $product_id) {
        $terms = get_the_terms((int) $product_id, 'product_cat');
        if (!$terms || is_wp_error($terms)) { continue; }
        foreach ($terms as $term) { $add_term($term); }
    }

    // Finally append every nested live Hookah descendant so future categories
    // added inside Hookah appear without code changes.
    $rows = get_terms(array(
        'taxonomy' => 'product_cat',
        'hide_empty' => true,
        'child_of' => (int) $root->term_id,
        'orderby' => 'name',
        'order' => 'ASC',
        'number' => 0,
    ));
    if (!is_wp_error($rows)) {
        foreach ($rows as $term) { $add_term($term); }
    }

    return $out;
}'''
php = sub_once(
    php,
    r'''function slb_collection_all\(\$root_label\) \{.*?\n\}''',
    complete_collection,
    'global plus recursive Hookah brand catalogue'
)

# Wide drawer brand treatment. The embedded image remains the exact locked
# Customer artwork, but its unused square top/bottom area is clipped away.
css += r'''

/* ShishaLove 1.1.12 customer drawer brand lock */
.slb-drawer{background:#000!important}
.slb-drawer-logo-final{width:240px!important;height:124px!important;overflow:hidden!important;background:#000!important;border:0!important;border-radius:0!important;display:flex!important;align-items:center!important;justify-content:flex-start!important}
.slb-drawer-logo-crop{display:block!important;position:relative!important;width:240px!important;height:124px!important;overflow:hidden!important;background:#000!important}
.slb-drawer-logo-final .slb-drawer-owner-logo{position:absolute!important;width:240px!important;height:240px!important;max-width:none!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%) scale(1.08)!important;object-fit:contain!important;background:#000!important;border-radius:0!important}
'''

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
php_path.write_text(php, encoding='utf-8')

print('ShishaLove 1.1.12 live web-view corrections applied')
