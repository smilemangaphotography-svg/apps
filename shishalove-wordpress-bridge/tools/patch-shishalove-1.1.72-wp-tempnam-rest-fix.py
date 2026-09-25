#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.72-wp-tempnam-rest-fix.py <plugin-dir>')

root=Path(sys.argv[1])
php=root/'shishalove-app-bridge.php'
js=root/'assets'/'merchant.js'
css=root/'assets'/'bridge.css'
customer=root/'assets'/'customer.js'
for f in (php,js,css,customer):
    if not f.exists(): raise SystemExit(f'missing {f}')

p=php.read_text(encoding='utf-8')
js0=js.read_bytes(); css0=css.read_bytes(); customer0=customer.read_bytes()

def one(text, old, new, label):
    n=text.count(old)
    if n != 1: raise SystemExit(f'{label}: expected 1 occurrence, found {n}')
    return text.replace(old,new,1)

if p.count('Version: 1.1.71') != 1 or p.count("define('SLB_VERSION', '1.1.71');") != 1:
    raise SystemExit('expected exact Bridge 1.1.71 baseline')
p=one(p,'Version: 1.1.71','Version: 1.1.72','plugin version')
p=one(p,"define('SLB_VERSION', '1.1.71');","define('SLB_VERSION', '1.1.72');",'version constant')

old="""    $size=$editor->get_size();if(is_array($size)&&max((int)($size['width']??0),(int)($size['height']??0))>1280){$resized=$editor->resize(1280,1280,false);if(is_wp_error($resized))return $resized;}
    $normalized=wp_tempnam('slb-visual-normalized.jpg');if(!$normalized)return new WP_Error('visual_temp_error','Could not create temporary image.',array('status'=>500));
    $saved=$editor->save($normalized,'image/jpeg');if(is_wp_error($saved)){@unlink($normalized);return $saved;}$saved_path=isset($saved['path'])?(string)$saved['path']:$normalized;$bytes=@file_get_contents($saved_path);@unlink($saved_path);if($saved_path!==$normalized)@unlink($normalized);
    if($bytes===false||$bytes==='')return new WP_Error('visual_invalid_image','Could not read normalized image.',array('status'=>400));return 'data:image/jpeg;base64,'.base64_encode($bytes);
"""
new="""    $size=$editor->get_size();if(is_array($size)&&max((int)($size['width']??0),(int)($size['height']??0))>1280){$resized=$editor->resize(1280,1280,false);if(is_wp_error($resized))return $resized;}
    if(!function_exists('wp_tempnam')){require_once ABSPATH.'wp-admin/includes/file.php';}
    if(!function_exists('wp_tempnam'))return new WP_Error('visual_temp_file_unavailable','Temporary image file support is unavailable.',array('status'=>500));
    $normalized=wp_tempnam('slb-visual-normalized.jpg');if(!$normalized)return new WP_Error('visual_temp_error','Could not create temporary image.',array('status'=>500));
    $saved_path=$normalized;
    try{
        $saved=$editor->save($normalized,'image/jpeg');if(is_wp_error($saved))return $saved;
        $saved_path=isset($saved['path'])?(string)$saved['path']:$normalized;$bytes=@file_get_contents($saved_path);
        if($bytes===false||$bytes==='')return new WP_Error('visual_invalid_image','Could not read normalized image.',array('status'=>400));return 'data:image/jpeg;base64,'.base64_encode($bytes);
    }finally{
        if($saved_path&&is_string($saved_path)&&is_file($saved_path))@unlink($saved_path);
        if($normalized&&$normalized!==$saved_path&&is_file($normalized))@unlink($normalized);
    }
"""
p=one(p,old,new,'wp_tempnam REST dependency and temp cleanup')

php.write_text(p,encoding='utf-8')
if js.read_bytes()!=js0: raise SystemExit('merchant.js unexpectedly changed')
if css.read_bytes()!=css0: raise SystemExit('bridge.css unexpectedly changed')
if customer.read_bytes()!=customer0: raise SystemExit('customer.js unexpectedly changed')

required=(
    'Version: 1.1.72',
    "define('SLB_VERSION', '1.1.72');",
    "if(!function_exists('wp_tempnam')){require_once ABSPATH.'wp-admin/includes/file.php';}",
    "if(!function_exists('wp_tempnam'))return new WP_Error('visual_temp_file_unavailable'",
    'finally{',
    'slb_visual_capture_throwable_171',
    "'success'=>false,'code'=>'visual_search_error'",
)
for token in required:
    if token not in p: raise SystemExit('missing required token: '+token)

print('Bridge 1.1.72 wp_tempnam REST-context dependency fix applied')
