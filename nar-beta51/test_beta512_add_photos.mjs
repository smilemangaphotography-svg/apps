import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const puppeteer=require('/tmp/nar-ui/node_modules/puppeteer-core');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome) throw new Error('Chrome/Chromium not found');

const mk=(path,color)=>fs.writeFileSync(path,`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${color}"/><circle cx="20" cy="20" r="11" fill="white"/></svg>`);
mk('/tmp/nar512-phone-a.svg','#9d2f45');mk('/tmp/nar512-phone-b.svg','#2f6b50');mk('/tmp/nar512-phone-c.svg','#315d8a');mk('/tmp/nar512-gallery.svg','#b58a44');

const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();page.setDefaultTimeout(12000);await page.setViewport({width:390,height:844,deviceScaleFactor:1});
const wait=ms=>new Promise(r=>setTimeout(r,ms));const assert=(c,m)=>{if(!c)throw new Error(m)};
async function enter(){if(await page.$('#enter')){await page.click('#enter');await wait(220)}}
async function nav(label){await page.evaluate(l=>{const b=[...document.querySelectorAll('.betaNav button,.pixelNarNav button')].find(x=>(x.innerText||'').includes(l));if(!b)throw new Error('Missing root nav '+l);b.click()},label);await wait(180)}
async function openEditor(){await nav('Home');await page.click('.betaAdminDots');await wait(150);assert(!!(await page.$('#adminFlavors')),'Manage flavors missing');await page.click('#adminFlavors');await wait(150);const row=await page.$('[data-admin-flavor]');assert(!!row,'No flavor row');await row.click();await wait(260);assert(!!(await page.$('#nar512AddPhone')),'Add from phone missing');assert(!!(await page.$('#nar512AddGallery')),'Add from NĀR Gallery missing')}
async function frameCount(){return await page.$$eval('.nar511EditHero .nar511ImageFrame.hasImage',xs=>xs.length)}

await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'networkidle0'});await enter();

// Put one image in permanent NĀR Gallery so the flavor picker can be tested.
await nav('Gallery');const gi=await page.$('#betaGalleryInput');assert(!!gi,'NĀR Gallery upload input missing');await gi.uploadFile('/tmp/nar512-gallery.svg');await wait(420);assert((await page.$$('[data-gallery-item]')).length>=1,'NĀR Gallery did not store uploaded image');

await openEditor();
const emptyBefore=await page.$$('.nar511EditHero .nar512AddableFrame');assert(emptyBefore.length>=1,'Empty flavor frames are not actionable');
const phone=await page.$('#nar512PhoneInput');assert(!!phone,'Hidden multi-photo phone input missing');await phone.uploadFile('/tmp/nar512-phone-a.svg','/tmp/nar512-phone-b.svg');await wait(650);
let count=await frameCount();assert(count>=2&&count<=4,'Two phone images were not added to separate frames: '+count);

// NĀR Gallery must APPEND to the next free slot, never replace image 1.
await page.click('#nar512AddGallery');await wait(220);const pick=await page.$('[data-gallery-pick]');assert(!!pick,'NĀR Gallery picker did not open from Edit Flavor');await pick.click();await wait(500);
count=await frameCount();assert(count>=3&&count<=4,'NĀR Gallery image did not append to next frame: '+count);

// Fill the fourth slot from phone and enforce the 4-image cap.
if(count<4){const p=await page.$('#nar512PhoneInput');await p.uploadFile('/tmp/nar512-phone-c.svg');await wait(500)}
count=await frameCount();assert(count===4,'Flavor editor did not reach exactly four image frames: '+count);
const caps=await page.evaluate(()=>({phone:document.querySelector('#nar512AddPhone')?.disabled,gallery:document.querySelector('#nar512AddGallery')?.disabled,text:document.querySelector('#nar512AddGallery')?.innerText}));
assert(caps.phone===true&&caps.gallery===true,'Four-image limit controls are not disabled '+JSON.stringify(caps));

// Safe edit controls remain visible while the photo system is active.
assert(!!(await page.$('#nar511EditTopBar')),'Samsung-safe Edit Flavor top bar missing');assert(!!(await page.$('#nar511SaveEdit')),'Sticky Save changes missing');
const geo=await page.evaluate(()=>{const t=document.querySelector('#nar511EditTopBar')?.getBoundingClientRect();const s=document.querySelector('.nar511EditActions')?.getBoundingClientRect();return{top:t?.top,bottom:s?innerHeight-s.bottom:null}});
assert(geo.top>=0&&geo.bottom>=0,'Edit controls outside safe viewport '+JSON.stringify(geo));

await browser.close();console.log('NAR_BETA_5_1_2_ADD_PHOTOS_PASS');
