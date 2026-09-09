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
if(await page.$('#enter')){await page.click('#enter');await wait(180)}

const audit=await page.evaluate(()=>{
  const nav=document.querySelector('.betaNav')||document.querySelector('.pixelNarNav');
  const pageEl=document.querySelector('#page');
  if(!nav) return {missing:true};
  const cs=getComputedStyle(nav);
  const after=getComputedStyle(nav,'::after');
  const bg=cs.backgroundColor;
  const m=bg.match(/rgba?\(([^)]+)\)/i);
  let alpha=1;
  if(m){const p=m[1].split(',').map(x=>x.trim()); if(p.length===4) alpha=parseFloat(p[3]);}
  return {
    missing:false,
    bg,
    alpha,
    backdrop:cs.backdropFilter||cs.webkitBackdropFilter||'',
    afterContent:after.content,
    afterHeight:parseFloat(after.height||'0'),
    afterBg:after.backgroundColor,
    paddingBottom:parseFloat(getComputedStyle(pageEl).paddingBottom||'0'),
    z:parseInt(cs.zIndex||'0',10)||0
  };
});
if(audit.missing) throw new Error('NAR bottom nav missing');
if(audit.alpha<0.99) throw new Error('Bottom nav is still translucent '+JSON.stringify(audit));
if(!/rgb\(5, 7, 5\)|rgba\(5, 7, 5, 1\)/.test(audit.bg)) throw new Error('Bottom nav does not use solid NAR background '+JSON.stringify(audit));
if(audit.afterContent==='none'||audit.afterHeight<60) throw new Error('Android-safe opaque shelf missing '+JSON.stringify(audit));
if(audit.paddingBottom<240) throw new Error('Content clearance below fixed nav too small '+JSON.stringify(audit));
if(audit.z<1000) throw new Error('Navigation stacking order too low '+JSON.stringify(audit));

await browser.close();
console.log('NAR_BETA_5_0_6_OPAQUE_NAV_PASS');
