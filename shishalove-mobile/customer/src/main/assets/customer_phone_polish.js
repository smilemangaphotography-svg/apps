(function () {
  'use strict';

  var VERSION = '1.1.3';
  var HOME_URL = 'https://shishalove.eu/shishalove-app/?app=android&build=113';
  var BASE = 'https://shishalove.eu';

  var HOME_CATEGORIES = [
    ['Hookah','/product-category/hookah/'],
    ['Bowls','/product-category/bowls/'],
    ['Hoses','/product-category/hose/'],
    ['Accessories','/product-category/accessories/'],
    ['Charcoal','/product-category/charcoal/'],
    ['Flavors','/product-category/flavors/'],
    ['Merchandise','/product-category/merchandise/']
  ];

  var HOOKAH = [
    ['Wookah','/product-category/wookah/hookah-wookah/'],
    ['Alpha','/product-category/alpha/'],
    ['Steamulation','/product-category/steamulation/'],
    ['Union','/product-category/union/'],
    ['MIG','/product-category/mig/'],
    ['El-Badia','/product-category/el-badia/hookah-el-badia/'],
    ['Moze','/product-category/moze/hookah-moze/'],
    ['Anima','/product-category/anima/'],
    ['Gold Miner','/product-category/goldminer/'],
    ['YKAP','/product-category/ykap/'],
    ['Mexanika','/product-category/mexanika/'],
    ['DIAVLA','/product-category/diavla/']
  ];

  var BOWLS = [
    ['Phunnel','/product-category/bowls/phunnel-bowls/'],
    ['Killer','/product-category/bowls/killer/'],
    ['Heat Management','/product-category/bowls/heat-management/'],
    ['Gaskets','/product-category/accessories/gaskets/']
  ];

  var ACCESSORIES = [
    ['Hookah Vases','/product-category/glassbowls/'],
    ['Charcoal Burner','/product-category/accessories/charcoal-burner/'],
    ['Tongs','/product-category/accessories/tongs/'],
    ['Cleaning','/product-category/accessories/cleaning/'],
    ['Ash Plates','/product-category/accessories/ash-plates/'],
    ['Charcoal Holder','/product-category/accessories/charcoal-holder/'],
    ['Wind Cover','/product-category/accessories/wind-cover/'],
    ['Pokers & Forks','/product-category/accessories/pokers/'],
    ['Cases','/product-category/accessories/cases/'],
    ['Hookah Colorants','/product-category/accessories/hookahcolorants/'],
    ['Hookah Boards','/product-category/accessories/hookah-boards/'],
    ['Molasses Catcher','/product-category/accessories/molasses-catcher/']
  ];

  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function text(el) { return (el && (el.innerText || el.textContent) || '').replace(/\s+/g,' ').trim(); }
  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.display !== 'none' && s.visibility !== 'hidden';
  }
  function abs(path) { try { return new URL(path, BASE).href; } catch(e) { return path; } }
  function esc(s) { return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

  function imageCandidate(img) {
    if (!img) return '';
    var attrs = ['data-src','data-lazy-src','data-original','data-lazyload','data-lazy','data-image','data-orig-file'];
    for (var i=0;i<attrs.length;i++) { var v=img.getAttribute(attrs[i]); if (v) return abs(v); }
    var set = img.getAttribute('data-srcset') || img.getAttribute('srcset');
    if (set) return abs(set.split(',').pop().trim().split(/\s+/)[0]);
    return abs(img.getAttribute('src') || '');
  }

  function repairImages() {
    $all('img').forEach(function(img){
      img.style.setProperty('opacity','1','important');
      img.style.setProperty('visibility','visible','important');
      img.setAttribute('decoding','async');
      var src = imageCandidate(img);
      var cur = img.getAttribute('src') || '';
      if (src && (!cur || /placeholder|data:image\/gif/i.test(cur))) img.src = src;
      if (!img.dataset.sl113error) {
        img.dataset.sl113error='1';
        img.addEventListener('error',function(){ var next=imageCandidate(img); if(next && next!==img.src) img.src=next; });
      }
    });
  }

  function firstProductImage(html) {
    try {
      var d = new DOMParser().parseFromString(html,'text/html');
      var img = d.querySelector('ul.products li.product img,.products .product img,li.product img,img.wp-post-image');
      return imageCandidate(img);
    } catch(e) { return ''; }
  }

  function fetchThumb(label, path, cb) {
    var key='sl113-thumb:'+path, cached='';
    try { cached=localStorage.getItem(key)||''; } catch(e) {}
    if (cached) { cb(cached); return; }
    fetch(abs(path),{credentials:'include',cache:'force-cache'})
      .then(function(r){ return r.ok ? r.text() : ''; })
      .then(function(html){
        var src=firstProductImage(html);
        if(src){ try{localStorage.setItem(key,src);}catch(e){} cb(src); }
      })
      .catch(function(){});
  }

  function injectBaseStyle() {
    if (document.getElementById('sl113-style')) return;
    var s=document.createElement('style');
    s.id='sl113-style';
    s.textContent='\
      :root{--sl-red:#d9253f;--sl-black:#080808;--sl-line:#e9e9e9}\
      #sl113-drawer,#sl113-backdrop,#sl113-age{font-family:Arial,Helvetica,sans-serif}\
      .sl113-grid{display:grid!important;gap:12px!important;margin:14px 24px 18px!important}\
      .sl113-home-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}\
      .sl113-hookah-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}\
      .sl113-bowls-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important}\
      .sl113-accessories-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}\
      .sl113-card{position:relative!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-end!important;min-width:0!important;background:#fff!important;border:1px solid #e7e7e7!important;border-radius:18px!important;overflow:hidden!important;text-decoration:none!important;color:#111!important;box-shadow:none!important}\
      .sl113-home-grid .sl113-card{height:190px!important}.sl113-hookah-grid .sl113-card{height:176px!important}.sl113-bowls-grid .sl113-card{height:190px!important}.sl113-accessories-grid .sl113-card{height:190px!important}\
      .sl113-card img{position:absolute!important;left:8px!important;right:8px!important;top:8px!important;width:calc(100% - 16px)!important;height:72%!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;background:#fff!important}\
      .sl113-card .sl113-label{position:relative!important;z-index:2!important;width:100%!important;box-sizing:border-box!important;padding:10px 7px 13px!important;background:rgba(255,255,255,.96)!important;text-align:center!important;font-size:15px!important;font-weight:800!important;line-height:1.12!important;color:#111!important;-webkit-text-fill-color:#111!important}\
      .sl113-bowls-grid .sl113-label{font-size:12px!important;padding:8px 3px 11px!important}\
      .sl113-fallback{position:absolute!important;top:25%!important;font-size:36px!important;color:#777!important}\
      #sl113-backdrop{position:fixed!important;inset:0!important;background:rgba(0,0,0,.35)!important;z-index:2147483638!important;display:none}\
      #sl113-drawer{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:min(86vw,430px)!important;background:#080808!important;color:#fff!important;z-index:2147483639!important;transform:translateX(-105%)!important;transition:transform .18s ease!important;overflow:auto!important;padding:18px 22px 34px!important;box-sizing:border-box!important}\
      body.sl113-drawer-open #sl113-backdrop{display:block!important}body.sl113-drawer-open #sl113-drawer{transform:translateX(0)!important}\
      .sl113-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:8px 2px 20px}.sl113-wordmark{font-family:Georgia,serif;font-style:italic;font-weight:800;font-size:36px;letter-spacing:-2px}.sl113-wordmark b{color:#d9253f;font-style:normal;font-size:28px;margin-right:6px}.sl113-close{width:50px;height:50px;border:0;border-radius:50%;background:#232323;color:#fff;font-size:34px;line-height:50px}\
      .sl113-menu-row{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:58px;padding:0 6px;border:0;border-bottom:1px solid #292929;background:#080808;color:#fff;font-size:19px;font-weight:800;text-align:left;box-sizing:border-box;text-decoration:none}.sl113-menu-row span:last-child{font-size:25px;font-weight:400}.sl113-sub{display:none;padding:4px 0 10px 18px}.sl113-sub.open{display:block}.sl113-sub a{display:block;color:#d4d4d4;text-decoration:none;padding:11px 2px;font-size:15px;border-bottom:1px solid #171717}.sl113-section{color:#777;font-size:12px;letter-spacing:2px;padding:24px 6px 8px}.sl113-lower a,.sl113-lower button{display:flex;gap:14px;align-items:center;width:100%;min-height:54px;background:#080808;border:0;color:#fff;text-decoration:none;font-size:17px;font-weight:700;text-align:left;padding:0 6px}.sl113-lower i{width:23px;text-align:center;font-style:normal;font-size:21px}\
      #sl113-age{position:fixed!important;inset:0!important;z-index:2147483642!important;background:radial-gradient(circle at 50% 18%,#202020 0,#080808 45%,#000 100%)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:26px!important;box-sizing:border-box!important}.sl113-age-card{width:min(90vw,420px);background:#fff;border-radius:4px;padding:34px 24px 28px;text-align:center;box-shadow:0 18px 55px rgba(0,0,0,.4)}.sl113-age-logo{font-family:Georgia,serif;font-size:36px;font-weight:800;font-style:italic;margin-bottom:24px}.sl113-age-card h2{font-size:31px;line-height:1.0;margin:0 0 24px}.sl113-age-card p{font-size:17px;line-height:1.55;color:#666;margin:0 0 24px}.sl113-age-confirm{display:block;width:100%;background:#d9253f;color:#fff;border:0;border-radius:2px;padding:17px 10px;font-size:16px;font-weight:800}.sl113-age-leave{display:inline-block;margin-top:20px;color:#666;text-decoration:none;font-size:16px}\
      @media(max-width:390px){.sl113-grid{margin-left:16px!important;margin-right:16px!important}.sl113-home-grid .sl113-card{height:170px!important}.sl113-hookah-grid .sl113-card{height:158px!important}.sl113-accessories-grid .sl113-card{height:170px!important}.sl113-bowls-grid .sl113-card{height:170px!important}.sl113-bowls-grid .sl113-label{font-size:11px!important}}\
    ';
    document.head.appendChild(s);
  }

  function createCard(item, fallback) {
    var a=document.createElement('a');
    a.className='sl113-card';
    a.href=abs(item[1]);
    a.innerHTML='<span class="sl113-fallback">'+(fallback||'◇')+'</span><span class="sl113-label">'+esc(item[0])+'</span>';
    fetchThumb(item[0],item[1],function(src){
      if(!a.isConnected) return;
      var old=a.querySelector('img'); if(old) old.remove();
      var img=document.createElement('img'); img.alt=item[0]; img.src=src; img.decoding='async';
      var fb=a.querySelector('.sl113-fallback'); if(fb) fb.style.display='none';
      a.insertBefore(img,a.firstChild);
    });
    return a;
  }

  function makeGrid(items, cls, fallback) {
    var g=document.createElement('div'); g.className='sl113-grid '+cls;
    items.forEach(function(item){ g.appendChild(createCard(item,fallback)); });
    return g;
  }

  function findExactText(label) {
    var els=$all('h1,h2,h3,h4,p,span,strong,a,button,div');
    for(var i=0;i<els.length;i++) if(visible(els[i]) && text(els[i]).toUpperCase()===label.toUpperCase()) return els[i];
    return null;
  }

  function hideOldTiles(labels) {
    labels.forEach(function(label){
      $all('a,button,div,li').forEach(function(el){
        if(!visible(el) || text(el).toUpperCase()!==label.toUpperCase()) return;
        var n=el;
        for(var i=0;i<4 && n;i++,n=n.parentElement){
          var r=n.getBoundingClientRect();
          if(r.height>=80 && r.height<=260 && r.width>=70 && r.width<=innerWidth*.65){ n.style.setProperty('display','none','important'); break; }
        }
      });
    });
  }

  function mountAfter(anchor, node) {
    if (!anchor || !node) return false;
    var host=anchor;
    for(var i=0;i<3 && host.parentElement;i++) {
      var r=host.parentElement.getBoundingClientRect();
      if(r.width>innerWidth*.72) host=host.parentElement; else break;
    }
    host.parentNode.insertBefore(node,host.nextSibling);
    return true;
  }

  function ensureHomeGrid() {
    if(document.getElementById('sl113-home-grid')) return;
    var heading=findExactText('Shop by category');
    if(!heading) return;
    hideOldTiles(HOME_CATEGORIES.map(function(x){return x[0];}));
    var g=makeGrid(HOME_CATEGORIES,'sl113-home-grid','◇'); g.id='sl113-home-grid';
    mountAfter(heading,g);
  }

  function categoryTitle() {
    var hs=$all('h1,h2,.page-title,.category-title');
    for(var i=0;i<hs.length;i++){ if(visible(hs[i])) { var t=text(hs[i]); if(t) return t.toUpperCase(); } }
    return '';
  }

  function ensureCategoryGrid() {
    var title=categoryTitle(), cfg=null, cls='', id='';
    if(title==='HOOKAH'){cfg=HOOKAH;cls='sl113-hookah-grid';id='sl113-hookah-grid';}
    else if(title==='BOWLS'){cfg=BOWLS;cls='sl113-bowls-grid';id='sl113-bowls-grid';}
    else if(title==='ACCESSORIES'){cfg=ACCESSORIES;cls='sl113-accessories-grid';id='sl113-accessories-grid';}
    if(!cfg || document.getElementById(id)) return;
    hideOldTiles(cfg.map(function(x){return x[0];}));
    var h=findExactText(title), g=makeGrid(cfg,cls,'◇'); g.id=id;
    mountAfter(h,g);
  }

  function looksHamburger(el) {
    if(!el) return false;
    var aria=(el.getAttribute('aria-label')||el.getAttribute('title')||'').toLowerCase();
    var cls=String(el.className||'').toLowerCase();
    var t=text(el).replace(/\s+/g,'');
    return aria.indexOf('menu')>=0 || cls.indexOf('hamburger')>=0 || cls.indexOf('menu-toggle')>=0 || t==='☰';
  }

  function drawerHtml() {
    function row(label,url,subId){
      if(subId) return '<button class="sl113-menu-row" data-sl-sub="'+subId+'"><span>'+label+'</span><span>⌄</span></button>';
      return '<a class="sl113-menu-row" href="'+abs(url)+'"><span>'+label+'</span><span>›</span></a>';
    }
    function sub(id,items){ return '<div class="sl113-sub" id="'+id+'">'+items.map(function(x){return '<a href="'+abs(x[1])+'">'+esc(x[0])+'</a>';}).join('')+'</div>'; }
    return '<div class="sl113-drawer-head"><div class="sl113-wordmark"><b>♡</b>shishalove</div><button class="sl113-close" aria-label="Close">×</button></div>'+
      row('HOME',HOME_URL)+row('HOOKAH','#','sl113-sub-hookah')+sub('sl113-sub-hookah',HOOKAH)+
      row('BOWLS','#','sl113-sub-bowls')+sub('sl113-sub-bowls',BOWLS)+
      row('HOSES','/product-category/hose/')+row('ACCESSORIES','#','sl113-sub-accessories')+sub('sl113-sub-accessories',ACCESSORIES)+
      row('CHARCOAL','/product-category/charcoal/')+row('FLAVORS','/product-category/flavors/')+row('MERCHANDISE','/product-category/merchandise/')+
      '<div class="sl113-section">SHISHALOVE</div><div class="sl113-lower">'+
      '<a href="/my-account/"><i>♙</i>My Account</a><a href="/contact/"><i>◉</i>Customer Support</a><button data-sl-language><i>◎</i>Language <span style="margin-left:auto;color:#aaa">EN</span></button><a href="/about/"><i>ⓘ</i>About ShishaLove</a><a href="/stores/"><i>⌖</i>Find Stores</a><a href="/contact/"><i>✉</i>Contact Us</a></div>';
  }

  function ensureDrawer() {
    if(document.getElementById('sl113-drawer')) return;
    var backdrop=document.createElement('div'); backdrop.id='sl113-backdrop'; document.body.appendChild(backdrop);
    var d=document.createElement('aside'); d.id='sl113-drawer'; d.innerHTML=drawerHtml(); document.body.appendChild(d);
    function close(){ document.body.classList.remove('sl113-drawer-open'); }
    backdrop.addEventListener('click',close); d.querySelector('.sl113-close').addEventListener('click',close);
    $all('[data-sl-sub]',d).forEach(function(b){ b.addEventListener('click',function(){ var s=document.getElementById(b.getAttribute('data-sl-sub')); if(s) s.classList.toggle('open'); }); });
    document.addEventListener('click',function(e){
      var c=e.target && e.target.closest ? e.target.closest('button,a,[role="button"]') : null;
      if(!c || c.closest('#sl113-drawer')) return;
      if(looksHamburger(c)) { e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); document.body.classList.add('sl113-drawer-open'); }
    },true);
  }

  function siteBackTarget() {
    var p=location.pathname.toLowerCase();
    if(/^\/product-category\/(wookah|alpha|steamulation|union|mig|el-badia|moze|anima|goldminer|ykap|mexanika|diavla)/.test(p)) return '/product-category/hookah/';
    if(/^\/product-category\/bowls\//.test(p)) return '/product-category/bowls/';
    if(/^\/product-category\/accessories\//.test(p) || p==='/product-category/glassbowls/') return '/product-category/accessories/';
    if(/^\/product-category\/(hookah|bowls|hose|accessories|charcoal|flavors|merchandise)\/?$/.test(p)) return HOME_URL;
    return '';
  }

  function looksBack(el) {
    if(!el) return false; var t=text(el).replace(/\s+/g,''), a=(el.getAttribute('aria-label')||el.getAttribute('title')||'').toLowerCase(), c=String(el.className||'').toLowerCase();
    return t==='←'||t==='‹'||a.indexOf('back')>=0||c.indexOf('back')>=0;
  }

  function ensureBackRouting() {
    if(window.__sl113Back) return; window.__sl113Back=true;
    document.addEventListener('click',function(e){
      var c=e.target&&e.target.closest?e.target.closest('a,button,[role="button"]'):null;
      if(!looksBack(c)) return; var target=siteBackTarget(); if(!target) return;
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); location.assign(abs(target));
    },true);
  }

  function hideReleaseBadges() {
    $all('body *').forEach(function(el){ if(!el.children.length && /^RELEASE\s+1\.1\.\d+$/i.test(text(el))) el.style.setProperty('display','none','important'); });
  }

  function dismissSiteAge() {
    $all('button,a').forEach(function(el){ var t=text(el).toUpperCase(); if(t==='I CONFIRM'||t.indexOf('CONFIRM')>=0 && t.length<35){ try{el.click();}catch(e){} } });
  }

  function ensureAgeGate() {
    var confirmed=false; try{confirmed=localStorage.getItem('sl-age-confirmed-v113')==='1';}catch(e){}
    if(confirmed || document.getElementById('sl113-age')) return;
    var gate=document.createElement('div'); gate.id='sl113-age';
    gate.innerHTML='<div class="sl113-age-card"><div class="sl113-age-logo">shishalove</div><h2>Welcome to<br>ShishaLove</h2><p>This storefront may contain age-restricted products. Confirm that you meet the legal age requirement in your location.</p><button class="sl113-age-confirm">I confirm I am of legal age</button><a class="sl113-age-leave" href="https://www.google.com/">Leave</a></div>';
    document.body.appendChild(gate);
    gate.querySelector('.sl113-age-confirm').addEventListener('click',function(){ try{localStorage.setItem('sl-age-confirmed-v113','1');}catch(e){} dismissSiteAge(); gate.remove(); });
  }

  function fix() {
    injectBaseStyle(); repairImages(); ensureDrawer(); ensureBackRouting(); hideReleaseBadges(); ensureHomeGrid(); ensureCategoryGrid(); ensureAgeGate();
  }

  fix();
  setTimeout(fix,250); setTimeout(fix,900); setTimeout(fix,1800);
  if(!window.__sl113Obs){ var queued=false; window.__sl113Obs=new MutationObserver(function(){ if(queued)return; queued=true; setTimeout(function(){queued=false;repairImages();ensureHomeGrid();ensureCategoryGrid();hideReleaseBadges();},160); }); window.__sl113Obs.observe(document.documentElement,{childList:true,subtree:true}); }
})();
