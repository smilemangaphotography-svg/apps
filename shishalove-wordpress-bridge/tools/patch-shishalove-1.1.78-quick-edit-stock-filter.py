#!/usr/bin/env python3
from pathlib import Path
import sys,json,zlib,base64,hashlib
if len(sys.argv)!=2: raise SystemExit("usage: patch-shishalove-1.1.78-quick-edit-stock-filter.py <plugin-dir>")
root=Path(sys.argv[1])
payload=json.loads(zlib.decompress(base64.b64decode("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")))
for rel,spec in payload.items():
 p=root/rel; data=p.read_bytes()
 if hashlib.sha256(data).hexdigest()!=spec["sha"]: raise SystemExit("unexpected 1.1.77 baseline: "+rel)
 lines=data.decode("utf-8").splitlines(keepends=True)
 for i1,i2,text in reversed(spec["ops"]): lines[i1:i2]=text.splitlines(keepends=True)
 p.write_text("".join(lines),encoding="utf-8")

# VISUAL INDEX WORKER ROOT-CAUSE CORRECTION
# Same Bridge version for live acceptance. Do not bump/package a forward version until acceptance passes.
pfile=root/"shishalove-app-bridge.php"
p=pfile.read_text(encoding="utf-8")

def php_function_bounds(text,name):
 marker="function "+name+"("
 start=text.find(marker)
 if start<0: raise SystemExit("missing PHP function: "+name)
 brace=text.find("{",start)
 if brace<0: raise SystemExit("missing opening brace: "+name)
 depth=0
 quote=None
 esc=False
 for i in range(brace,len(text)):
  ch=text[i]
  if quote:
   if esc: esc=False
   elif ch=="\\": esc=True
   elif ch==quote: quote=None
   continue
  if ch in ("'",'"'): quote=ch; continue
  if ch=="{": depth+=1
  elif ch=="}":
   depth-=1
   if depth==0: return start,i+1
 raise SystemExit("unbalanced PHP function: "+name)

def replace_php_function(text,name,new_text):
 a,b=php_function_bounds(text,name)
 return text[:a]+new_text+text[b:]

def enclosing_php_function(text,needle):
 pos=text.find(needle)
 if pos<0: raise SystemExit("worker marker missing")
 scan=pos
 while True:
  start=text.rfind("function ",0,scan)
  if start<0: raise SystemExit("worker function not found")
  m=re.match(r"function\s+([A-Za-z0-9_]+)\s*\(",text[start:])
  if m:
   name=m.group(1)
   a,b=php_function_bounds(text,name)
   if a<=pos<b: return name
  scan=start

import re

new_index=r'''function slb_visual_existing_row_178($a){global $wpdb;$table=slb_visual_table_160();return (int)$wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE product_id=%d AND variation_id=%d AND image_id=%d AND image_role=%s LIMIT 1",(int)$a['product_id'],(int)$a['variation_id'],(int)$a['image_id'],(string)$a['image_role']));}
function slb_visual_index_one_product_177($product_id){
    global $wpdb;
    $product_id=absint($product_id);
    $p=$product_id?wc_get_product($product_id):null;
    if(!$p){
        slb_visual_retry_clear_177($product_id);
        return array('status'=>'permanent_failed','product_id'=>$product_id,'indexed_images'=>0,'error'=>new WP_Error('visual_product_missing','Product no longer exists.',array('status'=>404)));
    }
    if($p->is_type('variation')){$product_id=(int)$p->get_parent_id();$p=wc_get_product($product_id);}
    $assets=slb_visual_assets_for_product_160($product_id);
    if(!$assets){
        slb_visual_clear_failed_product_161($product_id);
        slb_visual_retry_clear_177($product_id);
        return array('status'=>'skipped_ineligible','product_id'=>$product_id,'indexed_images'=>0,'inserted_images'=>0,'updated_images'=>0);
    }
    $needed=array();$existing=array();
    foreach($assets as $a){
        if(!slb_visual_asset_is_current_177($a)){
            $needed[]=$a;
            $existing[]=slb_visual_existing_row_178($a)>0;
        }
    }
    if(!$needed){
        slb_visual_cleanup_product_rows_177($product_id,$assets);
        update_post_meta($product_id,'_slb_visual_identity_fp_160',slb_visual_product_fingerprint_160($product_id));
        slb_visual_clear_failed_product_161($product_id);
        slb_visual_retry_clear_177($product_id);
        return array('status'=>'already_valid','product_id'=>$product_id,'indexed_images'=>0,'inserted_images'=>0,'updated_images'=>0);
    }
    $vectors=slb_visual_embed_asset_chunk_161($needed);
    if(!is_wp_error($vectors)){
        $written=0;$inserted=0;$updated=0;
        foreach($needed as $i=>$a){
            if(!slb_visual_store_single_asset_177($a,$vectors[$i])){
                $db_error=new WP_Error('visual_index_db_write','Visual index database write failed.',array('status'=>500));
                slb_visual_failed_item_161($product_id,$a['image_id'],$db_error->get_error_message());
                return array('status'=>'permanent_failed','product_id'=>$product_id,'indexed_images'=>$written,'inserted_images'=>$inserted,'updated_images'=>$updated,'error'=>$db_error);
            }
            $written++;
            if(!empty($existing[$i]))$updated++;else $inserted++;
        }
        slb_visual_cleanup_product_rows_177($product_id,$assets);
        update_post_meta($product_id,'_slb_visual_identity_fp_160',slb_visual_product_fingerprint_160($product_id));
        slb_visual_clear_failed_product_161($product_id);
        slb_visual_retry_clear_177($product_id);
        return array('status'=>$inserted>0?'inserted':'updated','product_id'=>$product_id,'indexed_images'=>$written,'inserted_images'=>$inserted,'updated_images'=>$updated);
    }
    if(slb_visual_error_hard_177($vectors))return $vectors;
    if(slb_visual_error_transient_177($vectors)){
        slb_visual_retry_record_177($product_id,$vectors);
        return array('status'=>'transient_failed','product_id'=>$product_id,'indexed_images'=>0,'inserted_images'=>0,'updated_images'=>0,'error'=>$vectors);
    }
    $stored=0;$inserted=0;$updated=0;$permanent=0;$transient=false;$last_error=$vectors;
    foreach($needed as $i=>$a){
        $one=slb_visual_embed_asset_chunk_161(array($a));
        if(is_wp_error($one)){
            if(slb_visual_error_hard_177($one))return $one;
            if(slb_visual_error_transient_177($one)){$transient=true;$last_error=$one;slb_visual_retry_record_177($product_id,$one);continue;}
            $permanent++;$last_error=$one;slb_visual_failed_item_161($product_id,$a['image_id'],$one->get_error_message());continue;
        }
        if(slb_visual_store_single_asset_177($a,$one[0])){
            $stored++;
            if(!empty($existing[$i]))$updated++;else $inserted++;
        }
    }
    if($transient)return array('status'=>'transient_failed','product_id'=>$product_id,'indexed_images'=>$stored,'inserted_images'=>$inserted,'updated_images'=>$updated,'error'=>$last_error);
    if($permanent){slb_visual_retry_clear_177($product_id);return array('status'=>'permanent_failed','product_id'=>$product_id,'indexed_images'=>$stored,'inserted_images'=>$inserted,'updated_images'=>$updated,'error'=>$last_error);}
    $all_current=true;foreach($assets as $a)if(!slb_visual_asset_is_current_177($a)){$all_current=false;break;}
    if($all_current){
        slb_visual_cleanup_product_rows_177($product_id,$assets);
        update_post_meta($product_id,'_slb_visual_identity_fp_160',slb_visual_product_fingerprint_160($product_id));
        slb_visual_clear_failed_product_161($product_id);
        slb_visual_retry_clear_177($product_id);
        return array('status'=>$inserted>0?'inserted':($updated>0?'updated':'already_valid'),'product_id'=>$product_id,'indexed_images'=>$stored,'inserted_images'=>$inserted,'updated_images'=>$updated);
    }
    return array('status'=>'permanent_failed','product_id'=>$product_id,'indexed_images'=>$stored,'inserted_images'=>$inserted,'updated_images'=>$updated,'error'=>$last_error);
}'''
p=replace_php_function(p,"slb_visual_index_one_product_177",new_index)

new_queue=r'''function slb_visual_queue_product_160($product_id){
    $product_id=absint($product_id);
    if(!$product_id||!slb_visual_api_key_160())return false;
    $product=wc_get_product($product_id);
    if($product&&$product->is_type('variation'))$product_id=(int)$product->get_parent_id();
    delete_transient('slb_visual_eligible_images_177');
    $q=get_option('slb_visual_dirty_160',array());if(!is_array($q))$q=array();
    if(!$product_id||!slb_visual_assets_for_product_160($product_id)){
        if(isset($q[$product_id])){unset($q[$product_id]);update_option('slb_visual_dirty_160',$q,false);}
        slb_visual_retry_clear_177($product_id);
        return false;
    }
    $q[$product_id]=1;
    update_option('slb_visual_dirty_160',$q,false);
    if(!wp_next_scheduled('slb_visual_index_tick_160'))wp_schedule_single_event(time()+8,'slb_visual_index_tick_160');
    return true;
}'''
p=replace_php_function(p,"slb_visual_queue_product_160",new_queue)

worker_name=enclosing_php_function(p,"slb_visual_worker_lock_acquire_177()")
new_worker=r'''function __WORKER_NAME__(){
    if(!slb_visual_api_key_160())return;
    slb_visual_install_table_160();
    $token=slb_visual_worker_lock_acquire_177();
    if(!$token){slb_visual_schedule_worker_177(20);return;}
    $started=microtime(true);
    $attempted=0;$dirty_attempted=0;$sequential_attempted=0;
    $inserted=0;$updated=0;$already_valid=0;$skipped_ineligible=0;$transient_failed=0;$permanent_failed=0;
    $hard_error=null;
    slb_visual_state_patch_177(array('last_worker_start'=>time(),'worker_lock_owner'=>$token,'status'=>'building'));
    try{
        $dirty=get_option('slb_visual_dirty_160',array());if(!is_array($dirty))$dirty=array();
        $due=array();
        foreach(array_map('intval',array_keys($dirty)) as $pid){
            if(slb_visual_retry_due_177($pid))$due[]=$pid;
            if(count($due)>=2)break;
        }
        foreach($due as $pid){
            $attempted++;$dirty_attempted++;
            $r=slb_visual_index_one_product_177($pid);
            $patch=array('last_processed_product'=>$pid);
            if(is_wp_error($r)){
                $hard_error=$r;$patch['last_error']=$r->get_error_message();$patch['status']='failed';slb_visual_state_patch_177($patch);break;
            }
            $kind=(string)($r['status']??'permanent_failed');
            if($kind==='inserted'){$inserted++;unset($dirty[$pid]);$patch['last_successful_product']=$pid;$patch['last_error']='';}
            elseif($kind==='updated'){$updated++;unset($dirty[$pid]);$patch['last_successful_product']=$pid;$patch['last_error']='';}
            elseif($kind==='already_valid'){$already_valid++;unset($dirty[$pid]);$patch['last_successful_product']=$pid;$patch['last_error']='';}
            elseif($kind==='skipped_ineligible'){$skipped_ineligible++;unset($dirty[$pid]);$patch['last_error']='';}
            elseif($kind==='transient_failed'){$transient_failed++;$patch['last_error']=is_wp_error($r['error']??null)?$r['error']->get_error_message():'Transient indexing failure';}
            else{$permanent_failed++;unset($dirty[$pid]);$patch['last_error']=is_wp_error($r['error']??null)?$r['error']->get_error_message():'Permanent indexing failure';}
            slb_visual_state_patch_177($patch);
        }
        update_option('slb_visual_dirty_160',$dirty,false);

        if(!$hard_error){
            $state=slb_visual_index_state_160();
            if(($state['status']??'')==='building'){
                $cursor=(int)($state['cursor']??0);
                global $wpdb;
                $seq_limit=max(6,max(1,(int)slb_visual_index_batch_size_161()-2));
                $ids=$wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_type='product' AND post_status IN ('publish','draft','pending','private') AND ID>%d ORDER BY ID ASC LIMIT %d",$cursor,$seq_limit));
                $ids=array_map('intval',(array)$ids);
                if(!$ids){
                    $dirty_now=get_option('slb_visual_dirty_160',array());if(!is_array($dirty_now))$dirty_now=array();
                    $status=$dirty_now?'building':((int)($state['failed_count']??0)>0?'partial':'ready');
                    slb_visual_state_patch_177(array('status'=>$status,'last_error'=>'','cursor'=>$cursor));
                }else{
                    foreach($ids as $pid){
                        $attempted++;$sequential_attempted++;
                        $r=slb_visual_index_one_product_177($pid);
                        $patch=array('cursor'=>$pid,'last_processed_product'=>$pid,'status'=>'building');
                        if(is_wp_error($r)){
                            $hard_error=$r;$patch['last_error']=$r->get_error_message();$patch['status']='failed';slb_visual_state_patch_177($patch);break;
                        }
                        $kind=(string)($r['status']??'permanent_failed');
                        if($kind==='inserted'){$inserted++;$patch['last_successful_product']=$pid;$patch['last_error']='';}
                        elseif($kind==='updated'){$updated++;$patch['last_successful_product']=$pid;$patch['last_error']='';}
                        elseif($kind==='already_valid'){$already_valid++;$patch['last_successful_product']=$pid;$patch['last_error']='';}
                        elseif($kind==='skipped_ineligible'){$skipped_ineligible++;$patch['last_error']='';}
                        elseif($kind==='transient_failed'){$transient_failed++;slb_visual_queue_product_160($pid);$patch['last_error']=is_wp_error($r['error']??null)?$r['error']->get_error_message():'Transient indexing failure';}
                        else{$permanent_failed++;$patch['last_error']=is_wp_error($r['error']??null)?$r['error']->get_error_message():'Permanent indexing failure';}
                        slb_visual_state_patch_177($patch);
                    }
                }
            }
        }
    }catch(Throwable $e){
        $hard_error=new WP_Error('visual_index_worker_exception',$e->getMessage());
        slb_visual_state_patch_177(array('last_error'=>sanitize_text_field($e->getMessage()),'last_worker_exception'=>get_class($e),'status'=>'building'));
    }finally{
        $duration=round((microtime(true)-$started)*1000,2);
        global $wpdb;$table=slb_visual_table_160();
        $live_products=(int)$wpdb->get_var("SELECT COUNT(DISTINCT product_id) FROM {$table}");
        $live_images=(int)$wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        $succeeded=$inserted+$updated+$already_valid;
        slb_visual_state_patch_177(array(
            'last_worker_end'=>time(),'last_worker_duration_ms'=>$duration,
            'last_batch_attempted'=>$attempted,'last_batch_succeeded'=>$succeeded,
            'last_batch_transient'=>$transient_failed,'last_batch_permanent'=>$permanent_failed,
            'last_batch_dirty_attempted'=>$dirty_attempted,'last_batch_sequential_attempted'=>$sequential_attempted,
            'last_batch_inserted'=>$inserted,'last_batch_updated'=>$updated,'last_batch_already_valid'=>$already_valid,
            'last_batch_skipped_ineligible'=>$skipped_ineligible,'last_batch_transient_failed'=>$transient_failed,'last_batch_permanent_failed'=>$permanent_failed,
            'indexed_products'=>$live_products,'indexed_images'=>$live_images,'worker_lock_owner'=>''
        ));
        slb_visual_worker_lock_release_177($token);
        $state=slb_visual_index_state_160();
        if(($state['status']??'')!=='failed'){
            $dirty=get_option('slb_visual_dirty_160',array());if(!is_array($dirty))$dirty=array();
            /* Enforce eligibility on the persistent dirty queue so any legacy refill path cannot re-add image-less products. */
            $changed=false;
            foreach(array_map('intval',array_keys($dirty)) as $pid){
                if(!slb_visual_assets_for_product_160($pid)){unset($dirty[$pid]);slb_visual_retry_clear_177($pid);$changed=true;}
            }
            if($changed)update_option('slb_visual_dirty_160',$dirty,false);
            $next_retry=slb_visual_retry_next_177();$delay=10;
            if($dirty&&$next_retry>time())$delay=max(10,min(120,$next_retry-time()));
            if(($state['status']??'')==='building'||$dirty)slb_visual_schedule_worker_177($delay);
        }
    }
}'''.replace("__WORKER_NAME__",worker_name)
a,b=php_function_bounds(p,worker_name)
p=p[:a]+new_worker+p[b:]
pfile.write_text(p,encoding="utf-8")


for rel,sha in {"assets/bridge.css":"8b6bd8205ab195336b761ae1138fe623d049fb48c5a3f7059fe118781bf7f2c6","assets/customer.js":"bc3d794decaae688ae97ae3a19ff520b9fc71cefa8c332f8aab0d7372818b5d4"}.items():
 if hashlib.sha256((root/rel).read_bytes()).hexdigest()!=sha: raise SystemExit("preservation lock failed: "+rel)
p=(root/"shishalove-app-bridge.php").read_text();m=(root/"assets/merchant.js").read_text()
for token in ["Version: 1.1.78","merchant_quick_stock_sync","Product ID: ","stock_status:qv>=1?'instock':'outofstock'","Filter · All","scheduleLiveTextSearch","slb_visual_search_160","captureMerchantListState","skipped_ineligible","last_batch_sequential_attempted","last_batch_inserted","last_batch_updated","last_batch_already_valid","last_batch_skipped_ineligible","transient_failed","permanent_failed","seq_limit=max(6"]:
 if token not in p+m: raise SystemExit("missing required token: "+token)
q=m[m.index("function quickEditPanel(){"):m.index("var dashboardStats=",m.index("function quickEditPanel(){"))]
f=m[m.index("function filterModeMarkup(){"):m.index("function productsBody",m.index("function filterModeMarkup(){"))]
for forbidden in ["slm-quick-status","slm-quick-manage-stock","Stock management","Newest first","Oldest first","Price: Low → High","Price: High → Low"]:
 if forbidden in q+f: raise SystemExit("forbidden Quick Edit/filter UI remains: "+forbidden)
print("Bridge 1.1.78 Quick Edit + stock filter patch applied")
