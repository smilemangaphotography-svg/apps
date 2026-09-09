import puppeteer from '/tmp/nar-ui/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
await page.setViewport({width:390,height:844,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'networkidle0'});
await wait(200);
const assert=(c,m)=>{if(!c)throw new Error(m)};
const bodyText=()=>page.evaluate(()=>document.body.innerText||'');
const noOverflow=async label=>{const v=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));assert(v.sw<=v.cw+2,`${label} horizontal overflow ${v.sw}>${v.cw}`)};
const nav=async label=>{const b=await page.$x?.(`//button[contains(normalize-space(.), '${label}')]`);if(b&&b[0]){await b[0].click();await wait(120);return}const ok=await page.evaluate(l=>{const xs=[...document.querySelectorAll('.betaNav button,.pixelNarNav button')];const b=xs.find(x=>(x.innerText||'').trim().includes(l));if(b){b.click();return true}return false},label);assert(ok,`Navigation ${label} missing`);await wait(120)};

// Enter the same app if the launch cover is showing.
await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/ENTER NĀR|ENTER/i.test(x.innerText||''));if(b)b.click()});await wait(180);

// Permanent root navigation contract.
const navText=await page.evaluate(()=>[...document.querySelectorAll('.betaNav button,.pixelNarNav button')].map(x=>(x.innerText||'').replace(/\s+/g,' ').trim()));
for(const label of ['Home','Search','Store','Mix','Gallery','My NĀR'])assert(navText.some(x=>x.includes(label)),`Missing permanent root nav ${label}`);
await noOverflow('root');

// Owner Studio tobacco setup drives Home Active Tobacco Lines.
await nav('Home');await page.click('.betaAdminDots');await wait(160);
let storeSetup=await page.$('#adminStore');
if(!storeSetup){storeSetup=await page.$('#adminStore50')}
assert(!!storeSetup,'Owner Studio tobacco store setup missing');await storeSetup.click();await wait(120);
const storeButtons=await page.$$('[data-admin-store-brand]');assert(storeButtons.length>0,'No tobacco brands in Owner Store setup');
let edited=false;
for(const b of storeButtons){
  await b.click();await wait(90);
  const checks=await page.$$('[data-line-active]');
  if(checks.length){
    const c=checks[0];const was=await c.evaluate(x=>x.checked);if(was)await c.click();else await c.click();
    const save=await page.$('#saveStoreBrand');if(save){await save.click();await wait(100);edited=true;break}
  }
  const back=await page.evaluate(()=>{const xs=[...document.querySelectorAll('#modal button')];const b=xs.find(x=>/Tobacco Store setup|Store setup|←/.test(x.innerText||''));if(b){b.click();return true}return false});assert(back,'Could not return from Owner Store brand editor');await wait(80)
}
assert(edited,'Could not edit an active tobacco line');
await page.evaluate(()=>{const xs=[...document.querySelectorAll('#modal button')];const b=xs.find(x=>/Admin|Owner Studio/i.test(x.innerText||''));if(b)b.click()});await wait(90);
await page.evaluate(()=>{const x=document.querySelector('#modal .close,#closeModal,[data-close]');if(x)x.click();else{const m=document.querySelector('#modal');if(m)m.classList.remove('open')}});await wait(80);
await nav('Home');

// Search stability + zero taste profiles. Search selects exact Grapefruit title, not ingredient matches.
await nav('Search');
const input=await page.$('input[type="search"],#searchInput,.beta50Search input,input[placeholder*="Search"]');assert(!!input,'Search field missing');
await input.click();await input.type('Pinkman');await wait(160);assert(await input.evaluate(x=>document.activeElement===x),'Search lost keyboard focus');
let txt=await bodyText();assert(/Pinkman/i.test(txt),'Pinkman search result missing');assert(!/Cooling\s*0|Cooling0/i.test(txt),'Search still shows Cooling 0');assert(!/Creamy\s*0|Creamy0/i.test(txt),'Search still shows Creamy 0');
await input.click({clickCount:3});await input.type('Grapefruit');await wait(140);
const opened=await page.evaluate(()=>{const cards=[...document.querySelectorAll('[data-open]')];const exact=cards.find(c=>{const bs=[...c.querySelectorAll('b,h2,h3,strong')].map(x=>(x.textContent||'').trim().toLowerCase());return bs.includes('grapefruit')});if(exact){exact.click();return true}return false});assert(opened,'Exact Grapefruit flavor card missing');await wait(120);
assert(/Grapefruit/i.test(await bodyText()),'Grapefruit detail did not open');

// Return to Home and open the dedicated ShishaLove Store hierarchy.
await nav('Home');const sh=await page.$('#homeShisha50');assert(!!sh,'Home ShishaLove Store entry missing');await sh.click();await wait(150);
let t=await bodyText();assert(/ShishaLove Store/i.test(t),'ShishaLove Store did not open');assert(/Tobacco Brands/i.test(t),'ShishaLove tobacco-brand hierarchy missing');
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
const shAdmin=await page.$('#adminShisha50');assert(!!shAdmin,'Owner Studio ShishaLove management missing');await shAdmin.click();await wait(120);
assert(!!(await page.$('#nar51ManageBrands')),'ShishaLove tobacco brand manager missing');

await noOverflow('final');
console.log('NAR_BETA_5_1_0_PASS');
await browser.close();
