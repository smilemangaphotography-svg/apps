from pathlib import Path
import re

root=Path('buildsrc/NAR-Mix/app')
js_path=root/'src/main/assets/app.js'
css_path=root/'src/main/assets/app.css'
if not js_path.exists() or not css_path.exists():
    raise SystemExit('Canonical NAR assets not found')
js=js_path.read_text()
css=css_path.read_text()
JS_MARK='NAR BETA 5.0.7 — ROOT NAV + PROFILE ARCHITECTURE'
CSS_MARK='NAR BETA 5.0.7 — ROOT NAV + PROFILE ARCHITECTURE'

if JS_MARK not in js:
    js += r'''

/* NAR BETA 5.0.7 — ROOT NAV + PROFILE ARCHITECTURE */
(function(){
  const PIN_KEY='nar_beta507_pinned_brands';
  const ROOT_LABELS=new Set(['Home','Search','Store','Mix','Gallery','My NĀR']);
  const EN_MAP=[
    [/База\s*\/\s*Baza/gi,'Baza'],[/Baza\s*\/\s*База/gi,'Baza'],
    [/Северный\s*\/\s*Severny/gi,'Severny'],[/Severny\s*\/\s*Северный/gi,'Severny'],
    [/Сарма\s*\/\s*Sarma/gi,'Sarma'],[/Sarma\s*\/\s*Сарма/gi,'Sarma'],
    [/Полетче/gi,'Lighter'],[/Основная/gi,'Main'],[/Классическая/gi,'Classic'],
    [/Банан\s*\/\s*Banana/gi,'Banana'],[/Banana\s*\/\s*Банан/gi,'Banana']
  ];
  const FLAVOR_HINTS={
    creamy:/vanilla|cream|creme|crème|milk|milky|yogurt|yoghurt|cookie|biscuit|waffle|custard|cheesecake|pudding|coconut|chocolate|cacao|latte|marshmallow|ice cream|dessert/i,
    sweet:/candy|syrup|honey|caramel|jam|gummy|sweet|ripe|mango|banana|melon|watermelon|strawberry|raspberry|cherry|peach|pear|pineapple/i,
    sour:/sour|lemon|lime|grapefruit|citrus|tart|cranberry|currant|pomegranate|passion/i,
    cooling:/cool|ice|icy|mint|menthol|frost|supernova|cold|freeze/i
  };

  function visible(el){if(!el)return false;const s=getComputedStyle(el);const r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0}
  function normalizeName(s){return (s||'').replace(/\s+/g,' ').trim().toLowerCase()}
  function englishText(str){
    let out=String(str||'');
    EN_MAP.forEach(([re,v])=>out=out.replace(re,v));
    out=out.replace(/([A-Za-z][A-Za-z0-9 .&'()-]{1,40})\s*\/\s*[\u0400-\u04FF][\u0400-\u04FF0-9 .&'()-]{1,40}/g,'$1');
    out=out.replace(/[\u0400-\u04FF][\u0400-\u04FF0-9 .&'()-]{1,40}\s*\/\s*([A-Za-z][A-Za-z0-9 .&'()-]{1,40})/g,'$1');
    return out;
  }
  function normalizeVisibleEnglish(root=document){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{const v=englishText(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v});
  }

  function navButtons(){return [...document.querySelectorAll('.betaNav button,.pixelNarNav button')]}
  function closeTransientForRoot(){
    const m=document.querySelector('#modal');
    if(m&&visible(m)){
      try{ if(typeof closeModal==='function') closeModal(); }
      catch(e){}
      if(visible(m)){
        m.innerHTML='';
        m.className='';
        m.style.display='none';
      }
    }
    document.body.classList.remove('nar507AdminContext');
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('.betaNav button,.pixelNarNav button');
    if(!b)return;
    const label=(b.innerText||'').replace(/\s+/g,' ').trim();
    const root=[...ROOT_LABELS].find(x=>label.includes(x));
    if(root)closeTransientForRoot();
  },true);

  function activeLineCards(){
    const grid=document.querySelector('.beta50LineGrid');
    if(!grid)return [];
    return [...grid.children].filter(x=>x.nodeType===1);
  }
  function brandFromCard(card){
    const lines=(card.innerText||'').split(/\n+/).map(x=>englishText(x).trim()).filter(Boolean);
    return lines[0]||'';
  }
  function readPins(cards){
    const active=cards.map(brandFromCard).filter(Boolean);
    let pins=[];try{pins=JSON.parse(localStorage.getItem(PIN_KEY)||'[]')}catch(e){}
    pins=pins.filter(x=>active.some(a=>normalizeName(a)===normalizeName(x))).slice(0,6);
    if(!pins.length){pins=active.slice(0,3);localStorage.setItem(PIN_KEY,JSON.stringify(pins))}
    return pins;
  }
  function applyHomePins(){
    const cards=activeLineCards();if(!cards.length)return;
    const pins=readPins(cards);
    cards.forEach(c=>{const b=brandFromCard(c);c.style.display=pins.some(p=>normalizeName(p)===normalizeName(b))?'':'none'});
    const edit=[...document.querySelectorAll('#page button,#page a')].find(x=>(x.textContent||'').trim()==='Edit'&&x.closest('#page'));
    if(edit){edit.textContent='All Brands';edit.classList.add('nar507AllBrands');edit.onclick=ev=>{ev.preventDefault();ev.stopPropagation();openAllBrands(cards)}}
  }
  function openAllBrands(cards){
    const brands=[...new Map(cards.map(c=>[normalizeName(brandFromCard(c)),brandFromCard(c)])).values()].filter(Boolean);
    const pins=readPins(cards);
    const rows=brands.map((b,i)=>`<label class="nar507PinRow"><input type="checkbox" data-pin-brand="${String(b).replace(/"/g,'&quot;')}" ${pins.some(p=>normalizeName(p)===normalizeName(b))?'checked':''}><span>${englishText(b)}</span></label>`).join('');
    const html=`<div class="sheethead"><button id="nar507PinsBack" class="backbtn">← Home</button><span>All Brands</span></div><div class="nar507PinHero"><small>HOME SHORTCUTS</small><h2>Active tobacco lines</h2><p>Choose 3 to 6 active brands to pin on Home. Activate/deactivate tobacco lines only from ⋮ Owner Studio.</p></div><div class="nar507PinList">${rows}</div><div class="nar507PinActions"><button id="nar507SavePins" class="primary">Save Home brands</button></div>`;
    if(typeof modal==='function')modal(html);else return;
    const m=document.querySelector('#modal');if(m)m.classList.add('narFullModal','nar507PinsModal');
    const back=document.querySelector('#nar507PinsBack');if(back)back.onclick=()=>{closeTransientForRoot();navButtons().find(b=>(b.innerText||'').includes('Home'))?.click()};
    document.querySelectorAll('[data-pin-brand]').forEach(cb=>cb.onchange=()=>{
      const checked=[...document.querySelectorAll('[data-pin-brand]:checked')];
      if(checked.length>6){cb.checked=false;if(typeof toast==='function')toast('Maximum 6 Home brands')}
    });
    const save=document.querySelector('#nar507SavePins');if(save)save.onclick=()=>{
      const chosen=[...document.querySelectorAll('[data-pin-brand]:checked')].map(x=>x.dataset.pinBrand);
      if(chosen.length<3){if(typeof toast==='function')toast('Choose at least 3 brands');return}
      localStorage.setItem(PIN_KEY,JSON.stringify(chosen.slice(0,6)));
      closeTransientForRoot();
      navButtons().find(b=>(b.innerText||'').includes('Home'))?.click();
    };
  }

  function hidePublicEdit(){
    [...document.querySelectorAll('#page button,#page a')].forEach(x=>{
      if((x.textContent||'').trim()==='Edit'&&!x.classList.contains('nar507AllBrands'))x.style.display='none';
    });
  }
  function updateAdminContext(){
    const m=document.querySelector('#modal');
    const t=(m?.innerText||'').replace(/\s+/g,' ');
    const admin=!!m&&visible(m)&&/Owner Studio|Admin Studio|Store setup|Manage flavors|Manage bowls|NĀR AI|Brand name|Round brand logo|Export \/ Import|ShishaLove Store/i.test(t);
    document.body.classList.toggle('nar507AdminContext',admin);
  }

  function parseVal(text,key){const m=String(text||'').match(new RegExp(key+'\\s*(\\d{1,3})','i'));return m?Math.max(0,Math.min(100,parseInt(m[1],10))):0}
  function inferredCreamy(card){
    const text=(card.innerText||'');
    let v=parseVal(text,'Creamy');if(v)return v;
    if(FLAVOR_HINTS.creamy.test(text))v=68;
    else if(/coconut|banana|vanilla/i.test(text))v=45;
    else v=0;
    return v;
  }
  function ensureProfileChips(card){
    if(!card||card.dataset.nar507Profile==='1')return;
    const text=card.innerText||'';
    if(!/Sweet\s*\d+/i.test(text)||!/Sour\s*\d+/i.test(text)||!/Cooling\s*\d+/i.test(text))return;
    const sweet=parseVal(text,'Sweet'),sour=parseVal(text,'Sour'),cooling=parseVal(text,'Cooling'),creamy=inferredCreamy(card);
    if(!/Creamy\s*\d+/i.test(text)){
      const profileHost=card.querySelector('.beta50ProfileMini')||[...card.querySelectorAll('div')].find(x=>/Sweet\s*\d+/.test(x.innerText||'')&&/Sour\s*\d+/.test(x.innerText||''));
      if(profileHost){const chip=document.createElement('span');chip.className='nar507CreamyChip';chip.textContent='Creamy '+creamy;profileHost.appendChild(chip)}
    }
    const vals=[['sweet',sweet],['sour',sour],['cooling',cooling],['creamy',creamy]].sort((a,b)=>b[1]-a[1]);
    let dom=vals[0][0];if(vals[0][1]<20||vals[0][1]-vals[1][1]<10)dom='balanced';
    card.classList.remove('nar507-sweet','nar507-sour','nar507-cooling','nar507-creamy','nar507-balanced');
    card.classList.add('nar507-'+dom);card.dataset.nar507Profile='1';
  }
  function profileCards(){return [...document.querySelectorAll('.beta50StoreFlavorCard,#results [data-open],.v49SimilarCard')].filter(visible)}
  function enhanceProfiles(){profileCards().forEach(ensureProfileChips)}

  function addRankBar(){
    if(!document.querySelector('.betaBrandHero'))return;
    if(document.querySelector('.nar507RankBar'))return;
    const cards=[...document.querySelectorAll('.beta50StoreFlavorCard')];if(!cards.length)return;
    const first=cards[0];const wrap=document.createElement('div');wrap.className='nar507RankBar';
    wrap.innerHTML='<button data-rank="all" class="active">All</button><button data-rank="sweet">Sweet</button><button data-rank="sour">Sour</button><button data-rank="cooling">Cooling</button><button data-rank="creamy">Creamy</button><button data-rank="rating">Rating</button>';
    first.parentNode.insertBefore(wrap,first);
    wrap.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      wrap.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));
      const key=b.dataset.rank;const parent=first.parentNode;const rows=[...parent.querySelectorAll(':scope > .beta50StoreFlavorCard')];
      if(key==='all')return;
      rows.sort((a,z)=>{
        const score=(el)=>{
          const tx=el.innerText||'';
          if(key==='rating'){const m=tx.match(/★\s*([0-5](?:\.\d+)?)/);return m?parseFloat(m[1]):0}
          return key==='creamy'?inferredCreamy(el):parseVal(tx,key[0].toUpperCase()+key.slice(1));
        };
        return score(z)-score(a);
      }).forEach(x=>parent.appendChild(x));
    });
  }

  function refresh(){
    normalizeVisibleEnglish(document.querySelector('#page')||document);
    normalizeVisibleEnglish(document.querySelector('#modal')||document);
    applyHomePins();
    hidePublicEdit();
    updateAdminContext();
    enhanceProfiles();
    addRankBar();
  }
  const obs=new MutationObserver(()=>requestAnimationFrame(refresh));
  obs.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',refresh,{passive:true});
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  requestAnimationFrame(refresh);
})();
'''

if CSS_MARK not in css:
    css += r'''

/* NAR BETA 5.0.7 — ROOT NAV + PROFILE ARCHITECTURE */
:root{--nar507-content-clearance:max(154px,calc(112px + env(safe-area-inset-bottom,0px)))}
.beta50TopBar{margin-top:10px!important;padding-top:6px!important}
.beta50Shell #page{padding-bottom:var(--nar507-content-clearance)!important;scroll-padding-bottom:var(--nar507-content-clearance)!important}
.beta505BottomSpacer{height:0!important;min-height:0!important;flex-basis:0!important;margin:0!important;padding:0!important}
.nar507AdminContext .betaNav,.nar507AdminContext .pixelNarNav{display:none!important}
.nar507AdminContext{overflow:hidden!important}
.nar507AdminContext #modal{z-index:20000!important;background:#060806!important}
.nar507AdminContext #modal .sheet{max-height:100dvh!important;overflow-y:auto!important;overscroll-behavior:contain!important;padding-bottom:max(28px,env(safe-area-inset-bottom,0px))!important}
.nar507AllBrands{display:inline-flex!important;color:#e6ad66!important;font-weight:800!important}
.nar507PinHero{padding:12px 4px}.nar507PinHero small{color:#d6a261;letter-spacing:.16em}.nar507PinHero h2{margin:6px 0;font-size:31px}.nar507PinHero p{color:#9e978e;line-height:1.45}
.nar507PinList{display:grid;gap:8px;margin:12px 0}.nar507PinRow{display:flex;align-items:center;gap:12px;min-height:56px;padding:10px 12px;border:1px solid rgba(224,164,91,.25);border-radius:14px;background:#0a0d09}.nar507PinRow input{width:22px;height:22px;accent-color:#dda75f}.nar507PinRow span{font-weight:800}.nar507PinActions{position:sticky;bottom:0;padding:10px 0 max(12px,env(safe-area-inset-bottom,0px));background:#060806}.nar507PinActions button{width:100%;min-height:52px}
.nar507-sweet{border-color:#a94352!important;box-shadow:inset 3px 0 0 #a94352!important}.nar507-sour{border-color:#4c8c63!important;box-shadow:inset 3px 0 0 #4c8c63!important}.nar507-cooling{border-color:#4f83b3!important;box-shadow:inset 3px 0 0 #4f83b3!important}.nar507-creamy{border-color:#c9b28d!important;box-shadow:inset 3px 0 0 #c9b28d!important}.nar507-balanced{border-color:#9f7748!important;box-shadow:inset 3px 0 0 #9f7748!important}.nar507CreamyChip{display:inline-flex!important;align-items:center!important;min-height:30px!important;padding:4px 10px!important;border:1px solid rgba(201,178,141,.5)!important;border-radius:999px!important;color:#d8c6a9!important;font-style:normal!important}
.nar507RankBar{display:flex;gap:8px;overflow-x:auto;padding:4px 0 12px;margin:4px 0 10px;scrollbar-width:none}.nar507RankBar::-webkit-scrollbar{display:none}.nar507RankBar button{flex:0 0 auto;min-height:40px;padding:8px 14px;border:1px solid rgba(224,164,91,.28);border-radius:999px;background:#090b08;color:#aaa39a}.nar507RankBar button.active{border-color:#d5a05f;color:#efbe7a;background:#161108}
@media(max-width:370px){.beta50TopBar{margin-top:8px!important}.nar507PinHero h2{font-size:28px}}
'''

js_path.write_text(js)
css_path.write_text(css)

metadata=[]
for pattern in ('**/build.gradle','**/build.gradle.kts','**/AndroidManifest.xml'):
    metadata.extend(root.parent.glob(pattern))
metadata=list(dict.fromkeys(metadata))
found=False
for p in metadata:
    try:s=p.read_text()
    except UnicodeDecodeError:continue
    old=s
    s=re.sub(r'(?m)(\bversionName\s*(?:=\s*)?)["\'][^"\']+["\']',r'\g<1>"5.0.7-beta"',s)
    s=re.sub(r'(android:versionName\s*=\s*)["\'][^"\']+["\']',r'\g<1>"5.0.7-beta"',s)
    s=re.sub(r'(?m)(\bversionCode\s*(?:=\s*)?)\d+',r'\g<1>557',s)
    s=re.sub(r'(android:versionCode\s*=\s*)["\']\d+["\']',r'\g<1>"557"',s)
    if '5.0.7-beta' in s:found=True
    if s!=old:p.write_text(s)
if not found:raise SystemExit('Beta 5.0.7 version metadata hook not found')
print('Applied NAR Beta 5.0.7 root navigation + pinned Home + English/profile architecture; versionCode 557')
