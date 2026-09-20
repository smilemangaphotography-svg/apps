(()=>{'use strict';
window.KINETIQ_ENTER=function(){
  try{
    const cover=document.getElementById('style2Cover');
    if(!cover || cover.classList.contains('hidden')) return 'inactive';

    const s=(typeof S!=='undefined')?S:null;
    if(!s) return 'not-ready';

    if(s.built){
      if(window.PT29 && typeof window.PT29.showMain==='function'){
        window.PT29.showMain('home');
        return 'entered-main';
      }
      if(typeof window.showMain==='function'){
        window.showMain('home');
        return 'entered-main';
      }
    }else{
      const step=Number.isFinite(Number(s.builderStep))?Number(s.builderStep):0;
      if(typeof window.showBuilder==='function'){
        window.showBuilder(step);
        return 'entered-builder';
      }
    }
    return 'not-ready';
  }catch(e){
    return 'error:'+String(e&&e.message||e);
  }
};

function bindCover(){
  const cover=document.getElementById('style2Cover');
  const btn=document.getElementById('coverEnter');
  if(cover){
    cover.addEventListener('click',ev=>{
      if(!cover.classList.contains('hidden')){
        ev.preventDefault();
        window.KINETIQ_ENTER();
      }
    },true);
  }
  if(btn){
    btn.addEventListener('click',ev=>{
      ev.preventDefault();
      window.KINETIQ_ENTER();
    },true);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindCover,{once:true});
else bindCover();
})();