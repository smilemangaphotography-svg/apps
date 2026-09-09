from pathlib import Path

root=Path('buildsrc/NAR-Mix/app')
js_path=root/'src/main/assets/app.js'
if not js_path.exists():
    raise SystemExit('Canonical NAR JS not found')
js=js_path.read_text()
MARK='NAR BETA 5.0.7 — ALL BRANDS CAPTURE GUARD'
if MARK not in js:
    js += r'''

/* NAR BETA 5.0.7 — ALL BRANDS CAPTURE GUARD
   All Brands is a normal NĀR page, not an inherited modal. This prevents
   legacy Home handlers from stacking or immediately closing the selector. */
(function(){
  const KEY='nar_beta507_pinned_brands';
  const norm=s=>(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  const cardBrand=card=>((card?.innerText||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)[0]||'');
  function cards(){const g=document.querySelector('.beta50LineGrid');return g?[...g.children].filter(x=>x.nodeType===1):[]}
  function activeNames(cs){return cs.map(cardBrand).filter(Boolean)}
  function pinsFor(cs){
    const names=activeNames(cs);let p=[];
    try{p=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
    p=p.filter(x=>names.some(n=>norm(n)===norm(x))).slice(0,6);
    if(!p.length){p=names.slice(0,3);localStorage.setItem(KEY,JSON.stringify(p))}
    return p;
  }
  function goHome(){
    const home=[...document.querySelectorAll('.betaNav button,.pixelNarNav button')].find(b=>(b.innerText||'').includes('Home'));
    home?.click();
  }
  function showSelector(){
    const cs=cards(), names=[...new Map(activeNames(cs).map(n=>[norm(n),n])).values()];
    if(!names.length)return;
    const pins=pinsFor(cs), page=document.querySelector('#page');
    if(!page)return;
    const rows=names.map(n=>`<label class="nar507PinRow"><input type="checkbox" data-pin-brand="${String(n).replace(/"/g,'&quot;')}" ${pins.some(p=>norm(p)===norm(n))?'checked':''}><span>${n}</span></label>`).join('');
    page.innerHTML=`<section class="nar507PinsPage">
      <div class="sheethead"><button id="nar507PinsBack" class="backbtn">← Home</button><span>All Brands</span></div>
      <div class="nar507PinHero"><small>HOME SHORTCUTS</small><h2>Active tobacco lines</h2><p>Choose 3 to 6 active brands to pin on Home. Activate or deactivate tobacco lines only from ⋮ Owner Studio.</p></div>
      <div class="nar507PinList">${rows}</div>
      <div class="nar507PinActions"><button id="nar507SavePins" class="primary">Save Home brands</button></div>
    </section>`;
    page.scrollTop=0;window.scrollTo(0,0);
    const back=document.querySelector('#nar507PinsBack');if(back)back.onclick=goHome;
    document.querySelectorAll('[data-pin-brand]').forEach(cb=>cb.addEventListener('change',()=>{
      const checked=[...document.querySelectorAll('[data-pin-brand]:checked')];
      if(checked.length>6){cb.checked=false;if(typeof toast==='function')toast('Maximum 6 Home brands')}
    }));
    const save=document.querySelector('#nar507SavePins');if(save)save.onclick=()=>{
      const chosen=[...document.querySelectorAll('[data-pin-brand]:checked')].map(x=>x.dataset.pinBrand);
      if(chosen.length<3){if(typeof toast==='function')toast('Choose at least 3 brands');return}
      localStorage.setItem(KEY,JSON.stringify(chosen.slice(0,6)));
      goHome();
    };
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('.nar507AllBrands');
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    showSelector();
  },true);
})();
'''
js_path.write_text(js)
print('Applied NAR Beta 5.0.7 All Brands full-page route guard')
