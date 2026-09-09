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
if(await page.$('#enter')){await page.click('#enter');await wait(160)}

// Owner Studio extension cards must fit as two-line cards, not a 22px text column.
await page.click('.betaAdminDots');await wait(120);
const owner=await page.evaluate(()=>{
  const extras=[...document.querySelectorAll('.beta50OwnerExtras>button')].map(b=>{
    const r=b.getBoundingClientRect(),s=b.querySelector('span')?.getBoundingClientRect();
    return {left:r.left,right:r.right,width:r.width,scrollWidth:b.scrollWidth,clientWidth:b.clientWidth,descWidth:s?.width||0,text:b.innerText};
  });
  const nav=document.querySelector('.ownerStudioFull .pixelNarNav');
  const pageWidth=window.innerWidth;
  const buttons=[...document.querySelectorAll('#modal button')].filter(b=>{
    const r=b.getBoundingClientRect();return r.width>0&&r.height>0;
  }).map(b=>({id:b.id,text:b.innerText.trim()}));
  return {extras,navDisplay:nav?getComputedStyle(nav).display:'missing',pageWidth,docWidth:document.documentElement.scrollWidth,buttons};
});
if(owner.extras.length!==2) throw new Error('Owner Studio extension cards missing');
for(const c of owner.extras){
  if(c.left<0||c.right>owner.pageWidth+1) throw new Error('Owner Studio card outside viewport '+JSON.stringify(c));
  if(c.descWidth<180) throw new Error('Owner Studio description still squeezed '+JSON.stringify(c));
  if(c.scrollWidth>c.clientWidth+1) throw new Error('Owner Studio card overflow '+JSON.stringify(c));
}
if(owner.navDisplay!=='none') throw new Error('Main navigation should be hidden in focused Owner Studio');
if(owner.docWidth>owner.pageWidth+2) throw new Error('Owner Studio horizontal overflow');

// Click the visible Owner Studio backend row by meaning, not an inherited internal ID.
const aiTarget=await page.evaluate(()=>{
  const candidates=[...document.querySelectorAll('#modal button')].filter(b=>{
    const r=b.getBoundingClientRect();
    const t=(b.innerText||'').replace(/\s+/g,' ').trim();
    return r.width>0&&r.height>0&&(/ChatGPT backend/i.test(t)||/NĀR AI/i.test(t));
  });
  const b=candidates[0];
  if(!b)return null;
  const out={id:b.id,text:(b.innerText||'').replace(/\s+/g,' ').trim()};
  b.click();
  return out;
});
if(!aiTarget) throw new Error('Visible Owner Studio AI/backend row not found '+JSON.stringify(owner.buttons));
await wait(160);
const ai=await page.evaluate(()=>{
  const modal=document.querySelector('#modal');
  const sheet=document.querySelector('#modal .sheet');
  const actions=[...document.querySelectorAll('.beta504AiActions button')].map(b=>({text:b.textContent.trim(),w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height,scrollH:b.scrollHeight,clientH:b.clientHeight}));
  const r=sheet?.getBoundingClientRect();
  return {classes:modal?.className||'',text:(modal?.innerText||'').slice(0,260),sheet:r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom}:null,actions,docWidth:document.documentElement.scrollWidth,w:window.innerWidth,h:window.innerHeight,status:document.querySelector('.beta504AiStatus')?.textContent.trim()||''};
});
if(!ai.classes.includes('aiAdminFull')||!ai.classes.includes('narFullModal')) throw new Error('AI setup is not a full Owner Studio page; target='+JSON.stringify(aiTarget)+' state='+JSON.stringify(ai));
if(!ai.sheet||ai.sheet.left<0||ai.sheet.right>ai.w+1||ai.sheet.top<0||ai.sheet.bottom>ai.h+1) throw new Error('AI page outside viewport '+JSON.stringify(ai.sheet));
if(ai.actions.length!==2) throw new Error('AI actions missing');
for(const b of ai.actions){if(b.scrollH>b.clientH+2) throw new Error('AI action label wraps/clips '+JSON.stringify(b));}
if(!/NOT CONNECTED|BACKEND CONFIGURED/.test(ai.status)) throw new Error('AI connection status missing');
if(ai.docWidth>ai.w+2) throw new Error('AI page horizontal overflow');

await page.click('#aiAdminBack');await wait(100);
if(!(await page.$('.ownerStudioFull'))) throw new Error('AI back did not return to Owner Studio');

await browser.close();
console.log('NAR_BETA_5_0_4_MOBILE_UI_PASS');
