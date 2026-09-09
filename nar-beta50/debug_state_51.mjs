import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const puppeteer=require('/tmp/nar-ui/node_modules/puppeteer-core');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome) throw new Error('Chrome/Chromium not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
await page.setViewport({width:390,height:844,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'networkidle0'});
if(await page.$('#enter')){await page.click('#enter');await new Promise(r=>setTimeout(r,250))}
const out=await page.evaluate(()=>{
  const o={};
  try{o.stateKeys=typeof state!=='undefined'?Object.keys(state):null}catch(e){o.stateError=String(e)}
  try{o.state=typeof state!=='undefined'?JSON.parse(JSON.stringify(state)):null}catch(e){o.stateDumpError=String(e)}
  o.local={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);let v=localStorage.getItem(k);try{v=JSON.parse(v)}catch(e){}o.local[k]=v}
  return o;
});
console.log('NAR_51_STATE_START');
console.log(JSON.stringify(out,null,2));
console.log('NAR_51_STATE_END');
await browser.close();
