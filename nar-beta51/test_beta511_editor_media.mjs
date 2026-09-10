import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const puppeteer=require('/tmp/nar-ui/node_modules/puppeteer-core');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome) throw new Error('Chrome/Chromium not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();page.setDefaultTimeout(12000);await page.setViewport({width:390,height:844,deviceScaleFactor:1});
const wait=ms=>new Promise(r=>setTimeout(r,ms));const assert=(c,m)=>{if(!c)throw new Error(m)};
async function enter(){if(await page.$('#enter')){await page.click('#enter');await wait(220)}}
async function nav(label){await page.evaluate(l=>{const b=[...document.querySelectorAll('.betaNav button,.pixelNarNav button')].find(x=>(x.innerText||'').includes(l));if(!b)throw new Error('Missing root nav '+l);b.click()},label);await wait(180)}
await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'networkidle0'});await enter();

// Search image display is now a clear, independent 1–4 frame block rather than narrow cropped strips.
await nav('Search');
const q=await page.$('#q');if(q){await q.focus();await page.type('#q','Strawberry',{delay:10});await wait(220)}
const card=await page.$('#results [data-open]');assert(!!card,'No Search flavor card available for 5.1.1 media test');
const media=await card.$('.nar511CardMedia');assert(!!media,'Four-frame media block missing from Search card');
const mediaState=await media.evaluate(m=>({count:m.querySelectorAll('.nar511ImageFrame').length,imgs:[...m.querySelectorAll('img')].map(x=>getComputedStyle(x).objectFit)}));
assert(mediaState.count>=1&&mediaState.count<=4,'Search card media count is outside 1–4 '+JSON.stringify(mediaState));
assert(mediaState.imgs.every(x=>x==='contain'),'Flavor images are still cropped instead of contained '+JSON.stringify(mediaState));
const oldVisual=await card.$('.flavorvisual');if(oldVisual){assert(await oldVisual.evaluate(x=>getComputedStyle(x).display==='none'),'Legacy narrow flavor visual still visible')}

// Design & Layout sub-page must not recursively insert a second Design & Layout card.
await nav('Home');await page.click('.betaAdminDots');await wait(160);
assert(!!(await page.$('#nar51DesignLayout')),'Owner Studio Design & Layout entry missing');
await page.click('#nar51DesignLayout');await wait(180);
assert(!!(await page.$('#nar51Preview')),'Design & Layout screen did not open');
assert(!(await page.$('#nar51DesignLayout')),'Duplicate Design & Layout card was inserted inside its own screen');
await page.click('#nar51LayoutBack');await wait(160);

// Flavor editor must be a safe focused screen with reachable top/bottom controls and exactly four image slots.
assert(!!(await page.$('#adminFlavors')),'Manage flavors entry missing');await page.click('#adminFlavors');await wait(160);
const row=await page.$('[data-admin-flavor]');assert(!!row,'No flavor available in Manage flavors');await row.click();await wait(220);
assert(await page.evaluate(()=>document.body.classList.contains('nar511FlavorEditing')),'Flavor editor safe mode did not activate');
assert(!!(await page.$('.nar511FlavorEdit')),'Flavor editor class missing');
const navHidden=await page.evaluate(()=>{const n=document.querySelector('.betaNav,.pixelNarNav');return !n||getComputedStyle(n).display==='none'});assert(navHidden,'Public bottom nav still covers flavor editor');
const slots=await page.$$('.nar511EditHero .nar511ImageFrame');assert(slots.length===4,'Edit Flavor must show exactly four image frames, got '+slots.length);
assert(!!(await page.$('#nar511SaveEdit'))&&!!(await page.$('#nar511CancelEdit')),'Sticky Save/Cancel controls missing');
const geometry=await page.evaluate(()=>{const h=document.querySelector('.nar511FlavorEdit .sheethead')?.getBoundingClientRect();const a=document.querySelector('.nar511EditActions')?.getBoundingClientRect();return{top:h?.top,bottom:a?innerHeight-a.bottom:null}});
assert(geometry.top>=0,'Edit Flavor header is hidden above viewport '+JSON.stringify(geometry));assert(geometry.bottom>=0,'Edit Flavor save actions are hidden below viewport '+JSON.stringify(geometry));

// Prove a real edit can be saved from the new sticky action bar.
const original=await page.$eval('#afName',e=>e.value);const changed=(original+' 511').slice(0,80);
await page.$eval('#afName',(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},changed);await wait(60);
await page.click('#nar511SaveEdit');await wait(260);
const body=await page.evaluate(()=>document.body.innerText);assert(body.includes(changed),'Save changes did not persist the edited flavor name into the detail screen');

await browser.close();console.log('NAR_BETA_5_1_1_EDITOR_MEDIA_PASS');
