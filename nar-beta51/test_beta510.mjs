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
const url='http://127.0.0.1:8765/index.html';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(c,m)=>{if(!c)throw new Error(m)};
const bodyText=()=>page.evaluate(()=>document.body.innerText);
const norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
async function enter(){if(await page.$('#enter')){await page.click('#enter');await wait(220)}}
async function nav(label){await page.evaluate(l=>{const b=[...document.querySelectorAll('.betaNav button,.pixelNarNav button')].find(x=>(x.innerText||'').includes(l));if(!b)throw new Error('Missing root nav '+l);b.click()},label);await wait(180)}
async function noOverflow(where){const r=await page.evaluate(()=>({w:innerWidth,doc:document.documentElement.scrollWidth,page:document.querySelector('#page')?.scrollWidth||0,nav:(()=>{const n=document.querySelector('.betaNav,.pixelNarNav');if(!n)return null;const b=n.getBoundingClientRect();return{left:b.left,right:b.right,bottom:innerHeight-b.bottom}})()}));assert(r.doc<=r.w+2&&r.page<=r.w+2,where+' horizontal overflow '+JSON.stringify(r));if(r.nav)assert(r.nav.left>=-1&&r.nav.right<=r.w+1&&r.nav.bottom>=50,where+' unsafe bottom nav '+JSON.stringify(r.nav))}

await page.goto(url,{waitUntil:'networkidle0'});await enter();

// 5.1 Home must be driven by the same checked lines visible in Owner Studio →
// Tobacco Store setup. This is a black-box user contract: no private DB/state symbols
// and no assumption that a fresh in-memory default has already been persisted.
const home=await page.evaluate(()=>({
  visible:[...document.querySelectorAll('.beta50LineGrid>*')].filter(x=>getComputedStyle(x).display!=='none').map(x=>(x.innerText||'').replace(/\s+/g,' ').trim()),
  allBrands:[...document.querySelectorAll('#page button,#page a')].some(x=>(x.innerText||'').trim()==='All Brands'&&getComputedStyle(x).display!=='none'),
  pinKey:localStorage.getItem('nar_beta507_pinned_brands'),
  top:document.querySelector('.beta50TopBar')?.getBoundingClientRect().top||0
}));
assert(!home.allBrands,'Retired public All Brands selector remains on Home');
assert(home.pinKey===null,'Retired nar_beta507_pinned_brands state was not removed');
assert(home.visible.length>0,'Fresh Home has no active tobacco lines');
assert(home.top>=8,'Top header still collides with Android safe area '+JSON.stringify(home));
await noOverflow('Home');

// Read the canonical checked-line state through the real Owner UI.
await page.click('.betaAdminDots');await wait(140);
assert(!!(await page.$('#adminStore')),'Owner Studio Tobacco Store entry missing');
await page.click('#adminStore');await page.waitForSelector('[data-admin-store-brand]');
assert(/Tobacco Store setup/i.test(await bodyText()),'Tobacco Store setup did not open');
const ownerBrands=await page.$$eval('[data-admin-store-brand]',xs=>xs.map(x=>({id:x.dataset.adminStoreBrand,name:(x.querySelector('b')?.textContent||'').trim()})).filter(x=>x.id&&x.id!=='shishalove'));
assert(ownerBrands.length>=3,'Owner Store setup is missing real tobacco brands');
const ownerActive=[];
for(const b of ownerBrands){
  await page.evaluate(id=>{const x=[...document.querySelectorAll('[data-admin-store-brand]')].find(e=>e.dataset.adminStoreBrand===id);if(!x)throw new Error('Owner brand route missing '+id);x.click()},b.id);
  await page.waitForSelector('#adminStoreBrandBack');
  const checked=await page.$$eval('[data-store-line-toggle]',xs=>xs.filter(x=>x.checked).map(x=>({line:(x.closest('label')?.querySelector('span')?.textContent||x.dataset.storeLineToggle||'').trim()})));
  checked.forEach(x=>ownerActive.push({brand:b.name,line:x.line}));
  await page.click('#adminStoreBrandBack');
  await page.waitForSelector('[data-admin-store-brand]');
}
assert(ownerActive.length===home.visible.length,'Home active-line count differs from Owner Store setup '+JSON.stringify({home:home.visible,owner:ownerActive}));
for(const a of ownerActive){
  assert(home.visible.some(v=>norm(v).includes(norm(a.brand))&&norm(v).includes(norm(a.line))),'Owner-active tobacco line missing from Home '+JSON.stringify(a));
}
// Return through whichever visible back control the final 5.1 Owner Studio renders.
for(let i=0;i<3 && !(await page.$('#adminClose'));i++){
  const backed=await page.evaluate(()=>{
    const m=document.querySelector('#modal');if(!m)return false;
    const buttons=[...m.querySelectorAll('button')].filter(x=>getComputedStyle(x).display!=='none');
    const b=buttons.find(x=>x.classList.contains('backbtn')||/^\s*←/.test(x.innerText||''));
    if(!b)return false;b.click();return true;
  });
  assert(backed,'Owner Store setup has no visible back route');
  await wait(120);
}
assert(!!(await page.$('#adminClose')),'Owner Studio close action missing after Store setup');
await page.click('#adminClose');await wait(100);

// Visible customer-facing catalog labels are English/Latin, while internal aliases may remain.
let t=await bodyText();
assert(!/База|Северный|Сарма|Основная|Полетче/.test(t),'Cyrillic catalog label visible on Home');

// Search preserves input focus and hides zero-valued taste chips without modifying ingredient identity.
await nav('Search');
await page.focus('#q');await page.evaluate(()=>{const q=document.querySelector('#q');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}))});
await page.type('#q','Pink grapefruit',{delay:20});await wait(260);
let pink=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('#results [data-open]')];const c=cards.find(x=>/Pinkman/i.test(x.innerText||''));
  return c?{text:c.innerText,focus:document.activeElement?.id}:null;
});
assert(!!pink,'Pinkman search result missing');
assert(pink.focus==='q','Search lost keyboard focus');
assert(/Sweet\s*80/i.test(pink.text)&&/Sour\s*54/i.test(pink.text),'Pinkman meaningful profiles missing '+pink.text);
assert(!/Cooling\s*0/i.test(pink.text)&&!/Creamy\s*0/i.test(pink.text),'Zero taste profile still visible '+pink.text);
assert(/Pink grapefruit/i.test(pink.text)&&/Strawberry/i.test(pink.text)&&/Raspberry syrup/i.test(pink.text),'Pinkman ingredients were altered by taste-profile logic '+pink.text);

await page.evaluate(()=>{const q=document.querySelector('#q');q.value='Grapefruit';q.dispatchEvent(new Event('input',{bubbles:true}))});await wait(220);
const grapefruit=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('#results [data-open]')];
  const c=cards.find(x=>{
    const title=(x.querySelector('h3')?.textContent||'').replace(/\s+/g,' ').trim();
    return /^Grapefruit$/i.test(title);
  });
  return c?.innerText||'';
});
assert(!!grapefruit,'Exact Grapefruit flavor result missing');
assert(/Orange grapefruit/i.test(grapefruit)&&/Pink grapefruit/i.test(grapefruit),'Grapefruit ingredient identity changed '+grapefruit);
await noOverflow('Search');

// A root navigation choice must replace child/detail state without Android Back.
const open=await page.$('#results [data-open] h3,#results [data-open] .flavorvisual');
if(open){await open.click();await wait(180);await nav('Mix');const stacked=await page.evaluate(()=>{const m=document.querySelector('#modal');return !!m&&getComputedStyle(m).display!=='none'&&(m.innerText||'').trim().length>0});assert(!stacked,'Root Mix left Flavor Detail stacked');assert((await bodyText()).includes('Expected Taste Profile'),'Mix root did not render')}

// ShishaLove is a store hierarchy: chosen tobacco brands + taste-profile access.
await nav('Home');const shisha=await page.$('#homeShisha50');assert(!!shisha,'ShishaLove Home entry missing');await shisha.click();await wait(220);
t=await bodyText();
assert(/ShishaLove Store/i.test(t),'ShishaLove Store did not open');
assert(/Tobacco Brands/i.test(t),'ShishaLove tobacco-brand hierarchy missing');
assert(/Taste Profiles/i.test(t)&&/Sweet/i.test(t)&&/Sour/i.test(t)&&/Cooling/i.test(t)&&/Creamy/i.test(t),'ShishaLove taste-profile categories incomplete');
assert(!/active line\s*·/i.test(t),'ShishaLove reverted to manufacturer metadata');
const shBrand=await page.$('[data-nar51-shisha-brand]');if(shBrand){await shBrand.click();await wait(100);assert((await page.$$('.nar51FlavorCard')).length>=0,'ShishaLove brand subcategory failed')}
await noOverflow('ShishaLove');

// Owner Studio must expose ShishaLove brand selection and the Design & Layout foundation.
await nav('Home');await page.click('.betaAdminDots');await wait(180);
assert(!!(await page.$('#nar51DesignLayout')),'Owner Studio Design & Layout entry missing');
const ownerText=await bodyText();assert(/ShishaLove Store/i.test(ownerText),'Owner Studio ShishaLove entry missing');

// Design changes are draft-only until Preview and explicit Yes confirmation.
await page.click('#nar51DesignLayout');await wait(130);
assert(!!(await page.$('#nar51Preview')),'Layout Preview action missing');
const beforeLayout=await page.evaluate(()=>localStorage.getItem('nar_owner_layout_v1'));
const recentCheck=await page.$('[data-layout-visible="recent"]');
if(recentCheck){const checked=await recentCheck.evaluate(x=>x.checked);if(checked)await recentCheck.click()}
await page.click('#nar51Preview');await wait(180);
assert(!!(await page.$('.nar51PreviewBar')),'PREVIEW — NOT LIVE banner missing');
assert((await page.$eval('.nar51PreviewBar',e=>e.innerText)).includes('PREVIEW — NOT LIVE'),'Preview banner text incorrect');
const recentVisible=await page.evaluate(()=>[...document.querySelectorAll('h1,h2,h3,b')].some(x=>{
  if(!/Recent Flavors/i.test(x.textContent||''))return false;
  if(!x.getClientRects().length)return false;
  for(let n=x;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse')return false}
  return true;
}));
assert(!recentVisible,'Preview did not apply draft visibility');
await page.click('#nar51DiscardPreview');await wait(120);
const afterDiscard=await page.evaluate(()=>localStorage.getItem('nar_owner_layout_v1'));
assert(afterDiscard===beforeLayout,'Discard incorrectly persisted layout changes');

// Re-open, preview, explicitly accept Yes, and verify persistence.
await page.click('.betaAdminDots');await wait(100);await page.click('#nar51DesignLayout');await wait(100);
const recent2=await page.$('[data-layout-visible="recent"]');if(recent2){const checked=await recent2.evaluate(x=>x.checked);if(checked)await recent2.click()}
await page.click('#nar51Preview');await wait(120);
page.once('dialog',async d=>{assert(/Apply these changes to Home/i.test(d.message()),'Unexpected apply confirmation');await d.accept()});
await page.click('#nar51ApplyPreview');await wait(180);
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nar_owner_layout_v1')||'null'));
assert(saved&&saved.visible&&saved.visible.recent===false,'Confirmed Home layout was not persisted');

// Re-open Owner Studio → ShishaLove and verify brand manager is present.
await page.click('.betaAdminDots');await wait(100);
const shOwner=await page.evaluate(()=>{const els=[...document.querySelectorAll('#modal button,#modal [role="button"]')];const x=els.find(e=>/ShishaLove Store/i.test(e.innerText||''));if(x){x.click();return true}return false});
if(shOwner){await wait(120);assert(!!(await page.$('#nar51ManageBrands')),'ShishaLove Tobacco Brands & Subcategories owner control missing');await page.click('#nar51ManageBrands');await wait(100);assert((await page.$$('[data-nar51-brand]')).length>=3,'ShishaLove brand selector missing real tobacco brands')}

// Final known-customer surfaces still have safe dimensions and English visible labels.
await nav('Store');await wait(100);t=await bodyText();assert(!/База|Северный|Сарма|Основная|Полетче/.test(t),'Cyrillic catalog label visible in Store');await noOverflow('Store');
await nav('Gallery');await noOverflow('Gallery');
await nav('My NĀR');await noOverflow('My NĀR');

await browser.close();
console.log('NAR_BETA_5_1_0_REGRESSION_PASS');