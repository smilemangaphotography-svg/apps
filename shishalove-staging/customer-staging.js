(function(){
'use strict';

var root=document.getElementById('slb-root');
if(!root)return;
var CFG=window.SHISHALOVE_BRIDGE||{};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}

function frontImage(){
  var logo=String(CFG.logo||'');
  return logo;
}

function ensureFrontPage(){
  var home=root.querySelector('.slb-home-feed');
  if(!home)return;
  if(home.querySelector('.slb-staging-front'))return;
  var section=home.querySelector('.slb-section');
  if(!section)return;
  var image=frontImage();
  var hero=document.createElement('section');
  hero.className='slb-staging-front';
  hero.setAttribute('aria-label','ShishaLove home');
  hero.innerHTML='<div class="slb-staging-front-visual">'+
    (image?'<img src="'+esc(image)+'" alt="ShishaLove">':'')+
    '<div class="slb-staging-front-shade"></div>'+
    '<div class="slb-staging-front-copy"><strong>ShishaLove</strong><button type="button" data-staging-shop>SHOP NOW</button></div>'+
    '</div>';
  home.insertBefore(hero,section);
  var b=hero.querySelector('[data-staging-shop]');
  if(b)b.onclick=function(){var feed=document.getElementById('slb-home-feed');if(feed)feed.scrollIntoView({behavior:'smooth',block:'start'});};
}

function improveFrontImage(){
  if(!CFG.site)return;
  fetch(CFG.site,{credentials:'same-origin',cache:'no-store'}).then(function(r){return r.ok?r.text():'';}).then(function(html){
    if(!html)return;
    var d=new DOMParser().parseFromString(html,'text/html');
    var m=d.querySelector('meta[property="og:image"],meta[name="twitter:image"]');
    var src=m&&m.getAttribute('content');
    if(!src)return;
    var img=root.querySelector('.slb-staging-front-visual img');
    if(img){img.src=src;img.classList.add('campaign');}
  }).catch(function(){});
}

var busy=false;
function sync(){
  if(busy)return;
  busy=true;
  requestAnimationFrame(function(){busy=false;ensureFrontPage();});
}
new MutationObserver(sync).observe(root,{childList:true,subtree:true});
sync();
setTimeout(improveFrontImage,0);
})();
