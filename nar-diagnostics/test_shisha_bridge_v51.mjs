import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const puppeteer=require('/tmp/nar-ui/node_modules/puppeteer-core');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('Chrome not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
page.setDefaultTimeout(10000);
await page.setViewport({width:390,height:844});
const errors=[];
page.on('pageerror',e=>{errors.push('PAGEERROR '+e.message);console.log('PAGEERROR',e.message)});
page.on('console',m=>{if(['error','warning'].includes(m.type()))console.log('CONSOLE',m.type(),m.text())});
await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'networkidle0'});
if(await page.$('#enter')){await page.click('#enter');await new Promise(r=>setTimeout(r,250))}
const before=await page.evaluate(()=>({
  bridge:typeof window.nar51PublicShisha,
  reset:typeof window.nar51ResetShisha,
  home:!!document.querySelector('#homeShisha50'),
  homeText:document.querySelector('#homeShisha50')?.innerText||'',
  pageText:document.querySelector('#page')?.innerText?.slice(0,1200)||'',
  bodyText:document.body.innerText.slice(0,1200)
}));
console.log('BEFORE',JSON.stringify(before));
if(await page.$('#homeShisha50')){
  await page.click('#homeShisha50');
  await new Promise(r=>setTimeout(r,350));
}
const after=await page.evaluate(()=>({
  bridge:typeof window.nar51PublicShisha,
  pageHTML:document.querySelector('#page')?.innerHTML?.slice(0,3000)||'',
  pageText:document.querySelector('#page')?.innerText?.slice(0,2000)||'',
  bodyText:document.body.innerText.slice(0,2000),
  shishaPage:!!document.querySelector('.nar51ShishaPage'),
  tobacco:/Tobacco Brands/i.test(document.body.innerText),
  taste:/Taste Profiles/i.test(document.body.innerText)
}));
console.log('AFTER',JSON.stringify(after));
console.log('ERRORS',JSON.stringify(errors));
if(typeof before.bridge==='undefined')console.log('DIAG bridge missing before click');
if(!after.shishaPage){
  const direct=await page.evaluate(()=>{
    try{
      const p=document.querySelector('#page');
      if(typeof window.nar51PublicShisha!=='function')return {ok:false,error:'bridge missing'};
      window.nar51PublicShisha(p);
      return {ok:true,text:p.innerText.slice(0,1600),html:p.innerHTML.slice(0,2000)};
    }catch(e){return {ok:false,error:String(e&&e.stack||e)}}
  });
  console.log('DIRECT',JSON.stringify(direct));
}
await browser.close();
console.log('NAR_SHISHA_BRIDGE_DIAG_DONE');
