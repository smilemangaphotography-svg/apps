(()=>{'use strict';
function refresh(){
 try{window.PT29?.renderTrain?.()}catch(_){}
 try{window.ILIA_V73?.syncPlanAvailability?.()}catch(_){}
 try{window.ILIA_V7?.renderPlan?.()}catch(_){}
}
function init(){
 if(!window.ILIA_V73){setTimeout(init,100);return}
 if(window.ILIA_V73.__refreshPatched)return;
 ['setEquipment','toggleExercise','assignEquipment','fullGym'].forEach(k=>{
  const old=window.ILIA_V73[k];if(typeof old!=='function')return;
  window.ILIA_V73[k]=function(){const r=old.apply(this,arguments);setTimeout(refresh,30);return r};
 });
 window.ILIA_V73.__refreshPatched=true;
 window.__ILIA_V73_REFRESH__='ready';
}
setTimeout(init,900);
})();
