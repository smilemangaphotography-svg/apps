(()=>{
'use strict';
const BUILD='2.4';
const VIDEO={
'Push-Up':'media/motion-pushup-loop.mp4',
'Incline Dumbbell Press':'media/motion-incline-loop.mp4',
'Lat Pulldown':'media/motion-lat-loop.mp4',
'Romanian Deadlift':'media/motion-rdl-loop.mp4',
'Seated Cable Row':'media/motion-row-loop.mp4',
'Goblet Squat':'media/motion-goblet-loop.mp4',
'45° Leg Press':'media/motion-legpress-loop.mp4',
'Standing Calf Raise':'media/motion-calf-loop.mp4',
'Supported Bulgarian Split Squat':'media/motion-split-loop.mp4',
'Seated Hamstring Curl':'media/motion-hamcurl-loop.mp4'
};
const POSTER={
'Push-Up':'media/v21-pushup.webp','Incline Dumbbell Press':'media/v21-incline.webp','Lat Pulldown':'media/v21-lat.webp','Romanian Deadlift':'media/v21-rdl.webp','Seated Cable Row':'media/v21-row.webp','Goblet Squat':'media/v21-goblet.webp','45° Leg Press':'media/v21-legpress.webp','Standing Calf Raise':'media/v21-calf.webp','Supported Bulgarian Split Squat':'media/v21-split.webp','Seated Hamstring Curl':'media/v21-hamcurl.webp'
};
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function ensureIntegrationState(){
 if(!S.integrations)S.integrations={};
 if(!S.integrations.spotify)S.integrations.spotify={clientId:'',redirectUri:'',connected:false};
 if(!S.integrations.garmin)S.integrations.garmin={status:'setup-required'};
 save();
}
function exerciseName(stage){const scope=stage.closest('.detail-page')||stage.closest('#workoutOverlay')||stage.parentElement;return q('h1',scope)?.textContent?.trim()||''}
function installRealMotion(stage,name){
 const src=VIDEO[name];if(!src||stage.dataset.motion24===name)return;
 stage.dataset.motion24=name;stage.dataset.motion23=name;stage.classList.add('motion-stage','motion-video-stage');
 stage.innerHTML=`<div class="motion-video-wrap"><video class="motion-video" src="${src}" poster="${POSTER[name]||''}" muted playsinline loop autoplay preload="auto" aria-label="${esc(name)} continuous movement demonstration"></video><div class="motion-status v24"><span>REAL MOTION</span><small>6 SEC LOOP</small></div><button class="motion-toggle v24" type="button" aria-label="Pause movement demonstration">Ⅱ</button></div>`;
 const v=q('video',stage),btn=q('.motion-toggle',stage);
 const fallback=()=>{stage.dataset.motion24='failed';stage.innerHTML=`<img src="${POSTER[name]||''}" alt="${esc(name)}"><div class="motion-status v24"><span>REFERENCE</span><small>VIDEO UNAVAILABLE</small></div>`};
 v.onerror=fallback;
 v.oncanplay=()=>{v.play().catch(()=>{});};
 btn.onclick=e=>{e.preventDefault();e.stopPropagation();if(v.paused){v.play().catch(()=>{});btn.textContent='Ⅱ';btn.classList.remove('paused')}else{v.pause();btn.textContent='▶';btn.classList.add('paused')}};
}
function scanRealMotion(root=document){qa('.detail-page .demo-stage,#workoutOverlay .demo-stage',root).forEach(stage=>{const name=exerciseName(stage);if(VIDEO[name])installRealMotion(stage,name)})}
function scheduleMotion(root=document){setTimeout(()=>scanRealMotion(root),90)}
function installMotionHooks(){
 const obs=new MutationObserver(()=>scheduleMotion());obs.observe(document.body,{childList:true,subtree:true});
 if(typeof openDetail==='function'){const old=openDetail;openDetail=function(ex,opt={}){old(ex,opt);scheduleMotion(q('#exerciseDetail'))}}
 if(typeof renderWorkout==='function'){const old=renderWorkout;renderWorkout=function(){old();scheduleMotion(q('#workoutOverlay'))}}
 scheduleMotion();
}
function showCover(){const c=q('#style2Cover');if(!c)return;clearInterval(workout?.timer);clearInterval(workout?.restTimer);q('#builder')?.classList.add('hidden');q('#mainApp')?.classList.add('hidden');c.classList.remove('hidden');window.scrollTo(0,0)}
function installBuilderBack(){
 if(typeof renderBuilder!=='function')return;
 const old=renderBuilder;
 renderBuilder=function(){old();const b=q('#builderBack');if(!b)return;b.style.visibility='visible';b.innerHTML='← BACK';b.onclick=()=>{if(S.builderStep===0)showCover();else showBuilder(S.builderStep-1)}};
}
function integrationBadge(kind){if(kind==='spotify'){const x=S.integrations.spotify;return x.connected?'CONNECTED':(x.clientId?'READY TO AUTHORIZE':'SETUP REQUIRED')}return 'SETUP REQUIRED'}
function showSpotifySetup(){
 const sp=S.integrations.spotify;
 showSheet('Spotify Connection',`<div class="integration-explain"><b>CONNECT, DON'T JUST OPEN</b><p>Spotify account control needs a registered Spotify app and OAuth authorization. Add the Client ID and approved HTTPS redirect URI once; this beta will keep those settings in your profile.</p></div><label class="section-label">SPOTIFY CLIENT ID</label><input id="spotifyClientId" class="field" value="${esc(sp.clientId||'')}" placeholder="Paste Client ID"><label class="section-label">APPROVED REDIRECT URI</label><input id="spotifyRedirect" class="field" value="${esc(sp.redirectUri||'')}" placeholder="https://your-domain.example/spotify/callback"><button id="saveSpotifySetup" class="primary-cta" style="margin-top:14px">SAVE CONNECTION SETTINGS</button><button id="spotifyDev" class="secondary-cta">OPEN SPOTIFY DEVELOPER SETTINGS</button><div class="integration-note">The app will not claim Spotify is connected until a real OAuth callback/token exchange is configured.</div>`);
 q('#saveSpotifySetup').onclick=()=>{sp.clientId=q('#spotifyClientId').value.trim();sp.redirectUri=q('#spotifyRedirect').value.trim();sp.connected=false;save();closeSheet();showDrive();toast('Spotify connection settings saved')};
 q('#spotifyDev').onclick=()=>location.href='https://developer.spotify.com/dashboard';
}
function showGarminSetup(){
 showSheet('Garmin Connection',`<div class="integration-explain"><b>GARMIN CONNECT PLUG-IN</b><p>Garmin account sync is a cloud-to-cloud OAuth 2.0 integration. Garmin requires Developer Program approval before this app can authenticate a Garmin Connect account.</p></div><div class="connect-card v24"><span class="connect-status">SETUP REQUIRED</span><h3>Garmin Connect</h3><p>Until API access is approved, activity-file import remains fully available.</p></div><button id="requestGarmin" class="primary-cta">GARMIN DEVELOPER ACCESS</button><button id="garminImportNow" class="secondary-cta">IMPORT ACTIVITY FILE</button><div class="integration-note">No fake “connected” state is used. When Garmin credentials are available, the OAuth button can be activated without redesigning this screen.</div>`);
 q('#requestGarmin').onclick=()=>location.href='https://developer.garmin.com/gc-developer-program/overview/';
 q('#garminImportNow').onclick=()=>q('#activityPicker').click();
}
function installDrive(){
 if(typeof showDrive!=='function')return;
 showDrive=function(){ensureIntegrationState();const sp=S.integrations.spotify;showSheet('DRIVE',`<div class="music-player"><div class="music-row"><div class="music-cover">♫</div><div style="flex:1"><div class="accent-label">WORKOUT MUSIC</div><b id="trackName">${esc(S.music.trackName||'Choose local audio or connect a service')}</b></div></div><div class="music-controls"><button id="musicPrev">‹</button><button id="musicPlay" class="play">▶</button><button id="musicNext">›</button></div></div><div class="integration-stack"><section class="integration-card"><div class="integration-top"><div><span class="integration-kicker">LOCAL</span><h3>Phone Storage</h3></div><span class="connect-status ${S.music.trackName?'good':''}">${S.music.trackName?'READY':'NO TRACK'}</span></div><p>Play a full audio file directly inside Personal Trainer.</p><button id="pickLocal" class="integration-action">CHOOSE LOCAL TRACK</button></section><section class="integration-card"><div class="integration-top"><div><span class="integration-kicker">PLUG-IN</span><h3>Spotify</h3></div><span class="connect-status">${integrationBadge('spotify')}</span></div><p>Connect an account through OAuth instead of jumping straight to the Spotify app.</p><div class="integration-actions"><button id="connectSpotify" class="integration-action primary">CONNECT SPOTIFY</button><button id="openSpotify" class="integration-action">OPEN APP</button></div></section><section class="integration-card compact"><div class="integration-top"><div><span class="integration-kicker">EXTERNAL</span><h3>YouTube Music</h3></div></div><button id="openYoutube" class="integration-action">OPEN YOUTUBE MUSIC</button></section></div><label class="toggle-row"><span>Start music with workout</span><input id="autoStart" type="checkbox" ${S.music.autoStart?'checked':''}></label><label class="toggle-row"><span>Stop music when workout ends</span><input id="autoStop" type="checkbox" ${S.music.autoStop?'checked':''}></label>`);
 q('#pickLocal').onclick=()=>q('#audioPicker').click();q('#musicPlay').onclick=toggleAudio;q('#connectSpotify').onclick=showSpotifySetup;q('#openSpotify').onclick=()=>location.href='spotify://';q('#openYoutube').onclick=()=>location.href='https://music.youtube.com/';q('#autoStart').onchange=e=>{S.music.autoStart=e.target.checked;save()};q('#autoStop').onchange=e=>{S.music.autoStop=e.target.checked;save()};
 };
}
function installConnected(){
 if(typeof showConnected!=='function')return;
 showConnected=function(){ensureIntegrationState();const imported=S.lastActivityImport?`<div class="connect-last"><span>LAST IMPORT</span><b>${esc(S.lastActivityImport)}</b></div>`:'';showSheet('Connected Data',`<div class="integration-stack"><section class="integration-card"><div class="integration-top"><div><span class="integration-kicker">PLUG-IN</span><h3>Garmin Connect</h3></div><span class="connect-status">SETUP REQUIRED</span></div><p>Connect Garmin through its approved OAuth 2.0 API instead of pretending a manual file is a live sync.</p><button id="connectGarmin" class="integration-action primary">CONNECT GARMIN</button></section><section class="integration-card"><div class="integration-top"><div><span class="integration-kicker">FILE IMPORT</span><h3>Activity Files</h3></div><span class="connect-status good">AVAILABLE</span></div><p>Import GPX, TCX or CSV immediately while Garmin API access is not configured.</p><button id="importActivity" class="integration-action">IMPORT ACTIVITY FILE</button></section>${imported}</div>`);q('#connectGarmin').onclick=showGarminSetup;q('#importActivity').onclick=()=>q('#activityPicker').click()};
}
function installProfileIntegrationEntry(){
 if(typeof renderProfile!=='function')return;const old=renderProfile;renderProfile=function(){old();const actions=q('.profile-actions');if(!actions||q('[data-profile="integrations"]'))return;const b=document.createElement('button');b.className='profile-action';b.dataset.profile='integrations';b.innerHTML='<b>Connections / Plug-ins</b><small>Spotify, Garmin and external services.</small>';actions.insertBefore(b,actions.firstChild);b.onclick=()=>showConnectionHub()};
}
function showConnectionHub(){ensureIntegrationState();showSheet('Connections',`<div class="integration-stack"><section class="integration-card"><div class="integration-top"><div><span class="integration-kicker">MUSIC</span><h3>Spotify</h3></div><span class="connect-status">${integrationBadge('spotify')}</span></div><button id="hubSpotify" class="integration-action primary">SET UP SPOTIFY</button></section><section class="integration-card"><div class="integration-top"><div><span class="integration-kicker">TRAINING DATA</span><h3>Garmin Connect</h3></div><span class="connect-status">SETUP REQUIRED</span></div><button id="hubGarmin" class="integration-action primary">SET UP GARMIN</button></section></div>`);q('#hubSpotify').onclick=showSpotifySetup;q('#hubGarmin').onclick=showGarminSetup}
function diagnostics(){return {build:BUILD,realMotion:Object.keys(VIDEO),builderBack:true,spotifyPluginUi:true,garminPluginUi:true,noFakeConnection:true}}
function boot(){ensureIntegrationState();installBuilderBack();installMotionHooks();installDrive();installConnected();installProfileIntegrationEntry();const foot=q('.cover-foot');if(foot)foot.textContent='MINIMAL PRO · BETA 2.4';window.__PT_STYLE24__='real-motion-integrations-2.4';window.ptStyle24Diagnostics=diagnostics;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,120),{once:true});else setTimeout(boot,120);
})();