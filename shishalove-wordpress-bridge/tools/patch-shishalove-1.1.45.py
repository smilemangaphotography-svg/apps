#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.45.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.44.py'), str(root)])


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

customer_path = root / 'assets' / 'customer.js'
js = customer_path.read_text(encoding='utf-8')
js = once(js, "var BUILD='1.1.44';", "var BUILD='1.1.45';", 'customer build')
js = once(js, "CFG.version='1.1.44';", "CFG.version='1.1.45';", 'customer cfg')
js = once(js, "slbfix','1.1.44'", "slbfix','1.1.45'", 'customer css bust')

front_helper = r'''function frontPageMarkup(){
  var fp=state.bootstrap&&state.bootstrap.frontPage||{};
  var image=String(fp.image||CFG.logo||'');
  var logoLike=!fp.image||(CFG.logo&&image===String(CFG.logo));
  var title=String(fp.title||'ShishaLove');
  var tagline=String(fp.tagline||'');
  return '<section class="slb-front-page" aria-label="ShishaLove home">'+
    '<div class="slb-front-visual '+(logoLike?'logo-only':'campaign')+'">'+
      (image?'<img src="'+esc(image)+'" alt="'+esc(title)+'">':'')+
      '<div class="slb-front-shade"></div>'+
      '<div class="slb-front-copy"><strong>'+esc(title)+'</strong>'+(tagline?'<span>'+esc(tagline)+'</span>':'')+'<button type="button" data-act="front-shop">SHOP NOW</button></div>'+
    '</div>'+
  '</section>';
}
'''
marker = 'function home(){'
if marker not in js:
    raise SystemExit('customer home function missing')
js = js.replace(marker, front_helper + marker, 1)

home_anchor = "var html='<main class=\"slb-page slb-home-feed\"><section class=\"slb-section\">"
if home_anchor not in js:
    raise SystemExit('customer home markup anchor missing')
js = js.replace(
    home_anchor,
    "var html='<main class=\"slb-page slb-home-feed\">'+frontPageMarkup()+'<section class=\"slb-section\'>".replace("slb-section'", "slb-section\"")
)
# The replacement above intentionally creates the exact JS source string without
# rewriting the rest of Home/feed behavior. Normalize it explicitly for readability.
js = js.replace(
    "var html='<main class=\"slb-page slb-home-feed\">'+frontPageMarkup()+'<section class=\"slb-section\">",
    "var html='<main class=\"slb-page slb-home-feed\">'+frontPageMarkup()+'<section class=\"slb-section\">",
    1
)

bind_marker = 'function bind(){'
if bind_marker not in js:
    raise SystemExit('customer bind function missing')
js = js.replace(
    bind_marker,
    bind_marker + "\n  root.querySelectorAll('[data-act=\"front-shop\"]').forEach(function(e){e.onclick=function(){var feed=document.getElementById('slb-home-feed');if(feed)feed.scrollIntoView({behavior:'smooth',block:'start'});};});",
    1
)
customer_path.write_text(js, encoding='utf-8')

php_path = root / 'shishalove-app-bridge.php'
php = php_path.read_text(encoding='utf-8')
helper = r'''function slb_customer_front_page_data() {
    $front_id = (int) get_option('page_on_front');
    $image = '';
    if ($front_id) {
        $image = (string) get_the_post_thumbnail_url($front_id, 'full');
    }
    if (!$image && function_exists('get_header_image')) {
        $image = (string) get_header_image();
    }
    if (!$image) {
        $image = (string) slb_site_logo();
    }
    $shop_url = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/shop/');
    return array(
        'title' => (string) get_bloginfo('name'),
        'tagline' => (string) get_bloginfo('description'),
        'image' => $image,
        'url' => home_url('/'),
        'shopUrl' => $shop_url,
    );
}

'''
php_marker = 'function slb_customer_bootstrap_data() {'
if php_marker not in php:
    raise SystemExit('customer bootstrap PHP marker missing')
php = php.replace(php_marker, helper + php_marker, 1)
php = once(
    php,
    "        'logo' => slb_site_logo(),",
    "        'logo' => slb_site_logo(),\n        'frontPage' => slb_customer_front_page_data(),",
    'customer front page bootstrap payload'
)
php_path.write_text(php, encoding='utf-8')

css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove Customer 1.1.45 — Home/front-page restoration only */
body.slb-customer .slb-front-page{margin:0 0 22px;padding:0}
body.slb-customer .slb-front-visual{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:18px;background:#111;box-shadow:0 8px 28px rgba(0,0,0,.10)}
body.slb-customer .slb-front-visual>img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
body.slb-customer .slb-front-visual.logo-only>img{object-fit:contain;padding:34px;background:#0b0b0c}
body.slb-customer .slb-front-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 24%,rgba(0,0,0,.74) 100%);pointer-events:none}
body.slb-customer .slb-front-visual.logo-only .slb-front-shade{background:linear-gradient(180deg,rgba(0,0,0,0) 25%,rgba(0,0,0,.52) 100%)}
body.slb-customer .slb-front-copy{position:absolute;left:18px;right:18px;bottom:18px;display:flex;flex-direction:column;align-items:flex-start;gap:5px;color:#fff;z-index:2}
body.slb-customer .slb-front-copy strong{font-size:25px;line-height:1.05;font-weight:900;text-shadow:0 1px 4px rgba(0,0,0,.45)}
body.slb-customer .slb-front-copy span{font-size:13px;line-height:1.3;opacity:.94;max-width:86%;text-shadow:0 1px 3px rgba(0,0,0,.45)}
body.slb-customer .slb-front-copy button{margin-top:8px;border:0;border-radius:999px;background:#d72a40;color:#fff;font-weight:900;font-size:13px;letter-spacing:.02em;padding:11px 18px;min-height:42px}
body.slb-customer .slb-home-feed>.slb-section{padding-top:0!important}
@media(max-width:390px){body.slb-customer .slb-front-copy strong{font-size:22px}body.slb-customer .slb-front-copy{left:15px;right:15px;bottom:15px}}
'''
css_path.write_text(css, encoding='utf-8')

final_js = customer_path.read_text(encoding='utf-8')
final_php = php_path.read_text(encoding='utf-8')
assert "var BUILD='1.1.45';" in final_js
assert "CFG.version='1.1.45';" in final_js
assert 'function frontPageMarkup()' in final_js
assert 'data-act="front-shop"' in final_js
assert "setTimeout(function(){loadHomeFeed(state.homeFilter);},0);" in final_js
assert "var DATA_CACHE='stable-v1';" in final_js
assert 'slb_customer_front_page_data' in final_php
assert "'frontPage' => slb_customer_front_page_data()" in final_php
print('ShishaLove Bridge 1.1.45: Customer front page restored; existing Customer functionality and Merchant 1.1.43 preserved')
