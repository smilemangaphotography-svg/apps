import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const puppeteer=require('/tmp/nar-ui/node_modules/puppeteer-core');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome) throw new Error('Chrome/Chromium not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
page.setDefaultTimeout(12000);
await page.setViewport({width:390,height:844,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'networkidle0'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
if(await page.$('#enter')){await page.click('#enter');await wait(220)}
const assert=(c,m)=>{if(!c)throw new Error(m)};
const nav=async(label)=>{await page.evaluate(l=>{const b=[...document.querySelectorAll('.betaNav button,.pixelNarNav button')].find(x=>(x.innerText||'').includes(l));if(!b)throw new Error('Missing root '+l);b.click()},label);await wait(180)};

const home=await page.evaluate(()=>({
  visibleLines:[...document.querySelectorAll('.beta50LineGrid>*')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.innerText.trim()),
  all:[...document.querySelectorAll('#page button,#page a')].find(x=>(x.innerText||'').trim()==='All Brands')?.innerText.trim()||'',
  edit:[...document.querySelectorAll('#page button,#page a')].some(x=>(x.innerText||'').trim()==='Edit'&&getComputedStyle(x).display!=='none'),
  topMargin:getComputedStyle(document.querySelector('.beta50TopBar')).marginTop,
  pad:parseFloat(getComputedStyle(document.querySelector('#page')).paddingBottom||'0'),
  spacer:document.querySelector('.beta505BottomSpacer')?.getBoundingClientRect().height||0
}));
assert(home.visibleLines.length===3,'Home must show exactly 3 pinned tobacco lines by default '+JSON.stringify(home.visibleLines));
assert(home.all==='All Brands','Home Edit was not replaced by All Brands');
assert(!home.edit,'Public Edit control remains on Home');
assert(parseFloat(home.topMargin)>=8,'Header was not lowered into safer Android zone '+JSON.stringify(home));
assert(home.pad>=140&&home.pad<=190,'Bottom content clearance is unreasonable '+JSON.stringify(home));
assert(home.spacer<=1,'Old giant bottom spacer still exists '+JSON.stringify(home));
await page.click('.nar507AllBrands');await wait(120);
assert(!!(await page.$('.nar507PinsPage')),'All Brands page did not open');
const pinCount=await page.$$eval('[data-pin-brand]',xs=>xs.length);
assert(pinCount>=3,'All Brands selector missing active brands');
await page.evaluate(()=>{const c=[...document.querySelectorAll('[data-pin-brand]')];for(let i=0;i<c.length;i++){if(i<6&&!c[i].checked)c[i].click();}});
await wait(80);
const checked=await page.$$eval('[data-pin-brand]:checked',xs=>xs.length);
assert(checked>=3&&checked<=6,'All Brands must maintain 3 to 6 Home pins');
await page.click('#nar507PinsBack');await wait(120);

await nav('Search');
await page.focus('#q');await page.type('#q','Pinkman',{delay:20});await wait(180);
const flavor=await page.$('#results [data-open] h3,#results [data-open] .flavorvisual');assert(!!flavor,'No Search flavor target');
await flavor.click();await wait(160);
assert(!!(await page.$('#modal')),'Flavor Detail did not open');
await nav('Mix');
const modalStillOpen=await page.evaluate(()=>{const m=document.querySelector('#modal');return !!m&&getComputedStyle(m).display!=='none'&&(m.innerText||'').trim().length>0});
assert(!modalStillOpen,'Root Mix left prior detail/modal stacked');
assert((await page.$eval('#page',e=>e.innerText)).includes('Expected Taste Profile'),'Mix root did not replace prior page');

await nav('Store');
let txt=await page.$eval('#page',e=>e.innerText);
assert(!/База|Северный|Сарма|Основная|Полетче/.test(txt),'Cyrillic catalog labels remain visible in English UI');
const dark=await page.$('[data-store-brand="darkside"]');if(dark){await dark.click();await wait(160)}
assert(!!(await page.$('.nar507RankBar')),'Brand ranking bar missing');
const rankLabels=await page.$$eval('.nar507RankBar button',xs=>xs.map(x=>x.textContent.trim()));
assert(JSON.stringify(rankLabels)===JSON.stringify(['All','Sweet','Sour','Cooling','Creamy','Rating']),'Ranking controls incorrect '+JSON.stringify(rankLabels));
const fc=await page.$('.beta50StoreFlavorCard');if(fc){
  const p=await fc.evaluate(e=>({text:e.innerText,cls:e.className,cream:!!e.querySelector('.nar507CreamyChip')}));
  assert(p.cream&&/Creamy\s*\d+/.test(p.text),'Creamy profile missing '+JSON.stringify(p));
  assert(/nar507-(sweet|sour|cooling|creamy|balanced)/.test(p.cls),'Dominant taste outline class missing '+p.cls);
}
const publicEdit=await page.evaluate(()=>[...document.querySelectorAll('#page button,#page a')].some(x=>(x.innerText||'').trim()==='Edit'&&getComputedStyle(x).display!=='none'));
assert(!publicEdit,'Brand page exposes public Edit control');

await nav('Home');await page.click('.betaAdminDots');await wait(120);
const admin=await page.evaluate(()=>({body:document.body.classList.contains('nar507AdminContext'),navs:[...document.querySelectorAll('.betaNav,.pixelNarNav')].map(x=>getComputedStyle(x).display),text:document.querySelector('#modal')?.innerText||''}));
assert(admin.body,'Owner Studio did not enter admin context');
assert(admin.navs.every(x=>x==='none'),'Bottom root nav remains visible in Owner/Admin context '+JSON.stringify(admin.navs));
assert(/Owner|Admin/i.test(admin.text),'Owner Studio missing');

await page.evaluate(()=>{
  const old=document.querySelector('#modal');if(old)old.remove();
  const m=document.createElement('div');m.id='modal';m.className='modal';m.innerHTML='<div class="sheet"><p>Only checked flavors appear in this Tobacco Store subcategory.</p><label><input type="checkbox" checked> A</label><label><input type="checkbox"> B</label></div>';document.body.appendChild(m);
});
await wait(180);
assert((await page.$$('.beta505BulkControls button')).length===2,'Check all / Uncheck all regression');

await page.evaluate(()=>document.querySelector('#modal')?.remove());await wait(100);await nav('Home');
const shelf=await page.evaluate(()=>{const n=document.querySelector('.betaNav')||document.querySelector('.pixelNarNav');const cs=getComputedStyle(n);return{bg:cs.backgroundColor,z:parseInt(cs.zIndex||'0',10)}});
assert(/rgb\(5, 7, 5\)/.test(shelf.bg),'Bottom nav lost opaque background '+JSON.stringify(shelf));
assert(shelf.z>=1000,'Bottom nav stacking too low');

await browser.close();
console.log('NAR_BETA_5_0_7_ARCHITECTURE_PASS');
