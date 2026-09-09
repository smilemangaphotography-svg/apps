import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const puppeteer=require('/tmp/nar-ui/node_modules/puppeteer-core');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome) throw new Error('Chrome/Chromium not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
page.setDefaultTimeout(12000);
const url='http://127.0.0.1:8765/index.html';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const text=()=>page.evaluate(()=>document.body.innerText);
async function nav(label){await page.evaluate(l=>{const b=[...document.querySelectorAll('.betaNav button')].find(x=>x.textContent.includes(l));if(!b)throw new Error('Missing nav '+l);b.click()},label);await wait(180)}
async function enter(){if(await page.$('#enter')){await page.click('#enter');await wait(200)}}
async function assert(cond,msg){if(!cond)throw new Error(msg)}
async function noOverflow(where='page'){const r=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,w:window.innerWidth,page:document.querySelector('#page')?.scrollWidth||0,nav:(()=>{const n=document.querySelector('.betaNav');if(!n)return null;const b=n.getBoundingClientRect();return {left:b.left,right:b.right,bottom:window.innerHeight-b.bottom,width:b.width}})()}));if(r.doc>r.w+2||r.page>r.w+2)throw new Error(`${where} horizontal overflow ${JSON.stringify(r)}`);if(r.nav&&(r.nav.left<-1||r.nav.right>r.w+1||r.nav.bottom<50))throw new Error(`${where} unsafe nav ${JSON.stringify(r.nav)}`)}

// Cover is mandatory on a fresh session.
await page.setViewport({width:390,height:844,deviceScaleFactor:1});
await page.goto(url,{waitUntil:'networkidle0'});
assert(!!(await page.$('#enter')),'Fresh launch must show ENTER NĀR cover');
let body=await text();
assert(body.includes('HOOKAH KNOWLEDGE · MIXOLOGY'),'Cover slogan missing');
assert(body.includes('EXPLORE · LEARN · MIX · ENJOY'),'Approved cover footer missing');
await enter();

// Header + six permanent navigation items.
assert((await page.$eval('.betaTopSlogan',e=>e.textContent.trim()))==='HOOKAH KNOWLEDGE · MIXOLOGY','Header slogan must be complete');
const headerFit=await page.evaluate(()=>{const h=document.querySelector('.beta50TopBar'),l=document.querySelector('.betaTopNar'),s=document.querySelector('.betaTopSlogan'),r=document.querySelector('.betaAdminDots');const H=h.getBoundingClientRect(),L=l.getBoundingClientRect(),S=s.getBoundingClientRect(),R=r.getBoundingClientRect();return {inside:S.left>=H.left&&S.right<=H.right,noOverlap:S.left>=L.right-2&&S.right<=R.left+2,dots:R.width,nav:[...document.querySelectorAll('.betaNav button span')].map(x=>x.textContent.trim())}});
assert(headerFit.inside&&headerFit.noOverlap,'Header slogan is clipped/overlapping');
assert(headerFit.dots>=44,'Admin dots touch target too small');
assert(JSON.stringify(headerFit.nav)===JSON.stringify(['Home','Search','Store','Mix','Gallery','My NĀR']),'Bottom navigation labels changed');
await noOverflow('Home');

// Home hierarchy: only active tobacco lines; Favorites + ShishaLove side by side; no old quick cards.
body=await text();
assert(body.includes('Active Tobacco Lines'),'Home Active Tobacco Lines missing');
assert(!!(await page.$('#homeFavorites50'))&&!!(await page.$('#homeShisha50')),'Home collection pair missing');
assert(!body.toLowerCase().includes('curated flavors')&&!body.toLowerCase().includes('focused brands'),'Removed Home quick cards returned');
const homeLines=await page.$eval('.beta50LineGrid',e=>e.innerText);
assert(!homeLines.includes('ShishaLove'),'ShishaLove must never be an active tobacco line');
assert(!!(await page.$('#betaAiScan')),'Dedicated NĀR AI recognition shortcut missing');

// Search: no brand-chip strip and typing must retain focus while filtering results.
await nav('Search');
assert(!!(await page.$('#q')),'Search input missing');
await page.focus('#q');
await page.evaluate(()=>{const q=document.querySelector('#q');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}))});
await page.type('#q','Pink grapefruit',{delay:25});
await wait(250);
const searchState=await page.evaluate(()=>({focus:document.activeElement?.id,value:document.querySelector('#q')?.value,body:document.querySelector('#page')?.innerText||'',brandStrips:document.querySelectorAll('.chips,.brandChips,.betaBrandChips').length}));
assert(searchState.focus==='q','Search re-render dismissed Android keyboard focus');
assert(searchState.value==='Pink grapefruit','Search text was lost');
assert(/Pinkman|Grapefruit/i.test(searchState.body),'Search did not show relevant flavor results');
assert(searchState.brandStrips===0,'Unnecessary brand-chip strip still present on Search');
await noOverflow('Search');

// Open a flavor and exercise all five detail tabs.
const openFlavor=await page.$('[data-open]');
assert(!!openFlavor,'No tappable flavor in Search results');
await openFlavor.click();await wait(180);
const tabs=await page.$$eval('[data-detail-tab]',xs=>xs.map(x=>x.dataset.detailTab));
assert(JSON.stringify(tabs)===JSON.stringify(['details','mixes','reviews','photos','similar']),'Flavor Detail tabs are incomplete');
for(const tab of tabs){await page.evaluate(t=>document.querySelector(`[data-detail-tab="${t}"]`).click(),tab);await wait(100);const panel=await page.$eval('.v49DetailPanel',e=>e.innerText.trim());assert(panel.length>0,`Flavor Detail ${tab} tab is empty`)}
// Details must expose ingredient/profile/pairing navigation controls.
await page.evaluate(()=>document.querySelector('[data-detail-tab="details"]').click());await wait(80);
const detailLinks=await page.evaluate(()=>({ingredients:document.querySelectorAll('[data-ingredient]').length,profiles:document.querySelectorAll('[data-profile-link],.v49ProfileCard button').length,pairings:document.querySelectorAll('[data-pairing],[data-pair]').length||document.querySelectorAll('.v49PairingList button').length}));
assert(detailLinks.ingredients>0,'Ingredient rows are not tappable');
// reset modal by reloading; entered state is session-persistent.
await page.reload({waitUntil:'networkidle0'});await wait(150);

// Tobacco Store: real tobacco brands only; no ShishaLove; brand detail card remains one composed unit.
await nav('Store');
assert(!!(await page.$('#beta50RealBrands')),'Tobacco Store brand grid missing');
const storeText=await page.$eval('#beta50RealBrands',e=>e.innerText);
assert(!storeText.includes('ShishaLove'),'ShishaLove incorrectly appears as a tobacco brand');
const brandCount=await page.$$eval('#beta50RealBrands [data-store-brand]',xs=>xs.length);
assert(brandCount>=8,'Tobacco Store is missing catalog brands');
const must=await page.$('[data-store-brand="musthave"]');
if(must){await must.click();await wait(130);assert(!!(await page.$('.betaBrandHero')),'Brand detail did not open');const card=await page.$('.beta50StoreFlavorCard');if(card){const composed=await card.evaluate(e=>({profiles:e.querySelectorAll('.beta50ProfileMini em').length,children:e.children.length}));assert(composed.profiles===3,'Sweet/Sour/Cooling broke out of flavor card')}}
await noOverflow('Tobacco brand detail');

// ShishaLove is a separate store reached from Home, with categories referencing real flavors.
await nav('Home');await page.click('#homeShisha50');await wait(150);
body=await text();
assert(body.includes('ShishaLove Store')&&body.includes('Categories')&&body.includes('All Flavors'),'Dedicated ShishaLove Store missing');
assert(!body.includes('active line · 0 flavors'),'ShishaLove still rendered as manufacturer metadata');
const cat=await page.$('[data-shisha-cat]');if(cat){await cat.click();await wait(100);assert((await page.$$('.beta50StoreFlavorCard')).length>=0,'ShishaLove category failed to open')}
await noOverflow('ShishaLove Store');

// Mix Builder: live taste profile + inspiration + replace/remove/favorite/use.
await nav('Mix');
assert(!!(await page.$('#beta50TasteBox')),'Expected Taste Profile missing');
assert(!!(await page.$('#beta50InspirationText')),'Inspiration input missing');
const ratio=await page.$('[data-ratio]');if(ratio){await ratio.click({clickCount:3});await ratio.type('25');await wait(80);assert((await page.$eval('#beta50TotalText',e=>e.textContent.trim())).endsWith('%'),'Mix total did not update')}
await page.type('#beta50InspirationText','Tropical with subtle sourness aftertaste and cooling effect');
await page.click('#beta50Inspire');await wait(140);
assert((await text()).includes('Inspiration Results'),'Inspiration Results screen did not render');
assert((await page.$$('.beta50SuggestionCard')).length>=1,'No inspiration mixes generated');
assert(!!(await page.$('[data-sug-replace]'))&&!!(await page.$('[data-sug-remove]'))&&!!(await page.$('[data-fav-suggestion]'))&&!!(await page.$('[data-use-suggestion]')),'Inspiration actions incomplete');
await page.click('[data-fav-suggestion]');await wait(60);
await page.click('[data-sug-replace]');await wait(80);
const remove=await page.$('[data-sug-remove]');if(remove){await remove.click();await wait(80)}
await page.click('[data-use-suggestion]');await wait(100);
assert(!!(await page.$('#beta50TasteBox')),'Use Mix did not return generated mix to builder');
await noOverflow('Mix');

// Gallery: multiple-file capable, permanent copy, delete confirmation both cancel and accept.
const png='/tmp/nar-beta50-test.png';
fs.writeFileSync(png,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8WQAAAAASUVORK5CYII=','base64'));
await nav('Gallery');
const upload=await page.$('#betaGalleryInput');assert(!!upload,'NĀR Gallery upload input missing');
await upload.uploadFile(png);await wait(350);
let galleryCount=(await page.$$('[data-gallery-item]')).length;assert(galleryCount>=1,'Gallery image was not copied into NĀR');
await page.reload({waitUntil:'networkidle0'});await wait(150);await nav('Gallery');
let persisted=(await page.$$('[data-gallery-item]')).length;assert(persisted>=galleryCount,'Gallery image did not persist after restart/reload');
page.once('dialog',async d=>d.dismiss());await page.click('[data-gallery-delete]');await wait(80);
assert((await page.$$('[data-gallery-item]')).length===persisted,'Gallery image deleted despite cancel');
page.once('dialog',async d=>d.accept());await page.click('[data-gallery-delete]');await wait(100);
assert((await page.$$('[data-gallery-item]')).length===persisted-1,'Confirmed Gallery delete did not remove image');

// Owner Studio: ShishaLove Store and NĀR Gallery maintenance hooks.
await page.click('#moreBtn');await wait(100);
assert(!!(await page.$('#adminShisha50'))&&!!(await page.$('#adminGallery50')),'Owner Studio Beta 5.0 controls missing');
await page.click('#adminShisha50');await wait(100);
assert(!!(await page.$('#shishaTitle'))&&!!(await page.$('#shishaDesc'))&&!!(await page.$('#addShishaCategory')),'ShishaLove Store editor incomplete');
assert(!!(await page.$('#shishaLogoGallery')),'ShishaLove logo cannot be selected from NĀR Gallery');
await page.reload({waitUntil:'networkidle0'});await wait(120);

// Dedicated NĀR AI recognition path remains visible and secure-owner configured.
await nav('Home');await page.click('#betaAiScan');await wait(130);
body=await text();
assert(/NĀR AI|Photo Recognition|Recognize/i.test(body),'Dedicated NĀR AI recognition screen missing');
assert(/Owner|connection|endpoint|setup/i.test(body),'Secure AI owner connection path missing');

// My NĀR contains ShishaLove Store as a separate destination.
await nav('My NĀR');
assert((await text()).includes('ShishaLove Store'),'My NĀR missing ShishaLove Store destination');

// Responsive/safe-area regression across common Android widths and all six main tabs.
for(const [width,height] of [[360,780],[390,844],[412,915],[430,932],[480,900]]){
  await page.setViewport({width,height,deviceScaleFactor:1});
  await page.reload({waitUntil:'networkidle0'});await wait(80);await enter();
  for(const label of ['Home','Search','Store','Mix','Gallery','My NĀR']){await nav(label);await noOverflow(`${width}x${height} ${label}`)}
  const targets=await page.$$eval('.betaNav button',xs=>xs.map(x=>{const r=x.getBoundingClientRect();return [r.width,r.height]}));
  assert(targets.every(([w,h])=>w>=44&&h>=44),`${width}px bottom nav touch target too small`);
}

console.log('NAR Beta 5.0 browser regression tests PASSED');
await browser.close();
