(()=>{'use strict';
const v4=window.KINETIQV4=window.KINETIQV4||{};
const SOURCE=Object.freeze(v4.phase7?.SOURCE||{PHONE_GPS:'PHONE_GPS',GARMIN_LIVE:'GARMIN_LIVE',GARMIN_HISTORY:'GARMIN_HISTORY',HEALTH_CONNECT:'HEALTH_CONNECT',MANUAL:'MANUAL',UNAVAILABLE:'UNAVAILABLE'});
const STATE=Object.freeze({AVAILABLE:'AVAILABLE',UNAVAILABLE:'UNAVAILABLE',PERMISSION_REQUIRED:'PERMISSION_REQUIRED',NOT_CONNECTED:'NOT_CONNECTED',CONNECTED:'CONNECTED',SYNCING:'SYNCING',SYNC_COMPLETE:'SYNC_COMPLETE',ERROR:'ERROR'});
const GARMIN_PACKAGE='com.garmin.android.apps.connectmobile';
const LIVE_TTL_MS=7000;
const clone=v=>v===undefined?undefined:(typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v)));
const finite=v=>Number.isFinite(Number(v));
const clockDefault=()=>Date.now();
function frozen(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))frozen(v[k]);return v}
function stable(prefix,...parts){let h=2166136261,s=parts.map(x=>String(x??'')).join('|');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return prefix+'_'+(h>>>0).toString(36)}
function parse(v,fallback={}){if(v&&typeof v==='object')return clone(v);if(typeof v!=='string'||!v.trim())return clone(fallback);try{return JSON.parse(v)}catch(_){return clone(fallback)}}
function numberOrNull(v,{allowZero=false}={}){if(!finite(v))return null;const n=Number(v);return allowZero?(n>=0?n:null):(n>0?n:null)}
function sourceFor(v,source){return v==null?SOURCE.UNAVAILABLE:source}
function normalizedState(v){const s=String(v||'').trim().toUpperCase();if(s==='DATA UNAVAILABLE')return STATE.UNAVAILABLE;if(s==='CONNECTING')return STATE.NOT_CONNECTED;if(s==='SYNC COMPLETE')return STATE.SYNC_COMPLETE;if(Object.values(STATE).includes(s))return s;return STATE.ERROR}
function freshness(lastSync,clock=clockDefault){if(!finite(lastSync)||Number(lastSync)<=0)return'NEVER';const age=Math.max(0,clock()-Number(lastSync));if(age<=21600000)return'FRESH';if(age<=172800000)return'AGING';return'STALE'}
function readNativeCapabilities(nativeBridge){
 let c={};try{c=parse(nativeBridge?.getDeviceCapabilities?.(),{})}catch(_){c={}}
 let gps=!!c.phoneGpsPermission;if(c.phoneGpsPermission==null)try{gps=!!nativeBridge?.hasLocationPermission?.()}catch(_){gps=false}
 return frozen({phoneGpsPermission:gps,garminConnectInstalled:!!c.garminConnectInstalled,healthConnectAvailable:!!c.healthConnectAvailable,healthPermissionsGranted:!!c.healthPermissionsGranted,garminDataBridge:!!c.garminDataBridge,externalSensorBridge:!!c.externalSensorBridge,garminConnectionMethod:c.garminConnectionMethod||null,garminDataSourcePackage:c.garminDataSourcePackage||null})
}
function normalizeHistoricalPayload(payload,profileId,proof={},clock=clockDefault){
 const p=parse(payload,{}),rows=Array.isArray(p.activities)?p.activities:[],latest=p.metrics&&typeof p.metrics==='object'?p.metrics:{},importedAt=clock(),out=[];
 const verifiedGarmin=proof.verifiedGarminOrigin===true&&proof.sourcePackage===GARMIN_PACKAGE,source=verifiedGarmin?SOURCE.GARMIN_HISTORY:SOURCE.HEALTH_CONNECT;
 for(let i=0;i<rows.length;i++){
  const row=rows[i]||{},start=row.start??row.startTime??(i===0?latest.startTime:null),end=row.end??row.endTime??null,isLatest=i===0&&(!latest.startTime||!start||String(latest.startTime)===String(start)),m=isLatest?latest:{};
  const duration=numberOrNull(row.duration??m.duration),distance=numberOrNull(row.distance??m.distance),heartRate=numberOrNull(row.averageHeartRate??row.heartRate??m.averageHeartRate??m.heartRate),maxHeartRate=numberOrNull(row.maxHeartRate??m.maxHeartRate),pace=numberOrNull(row.averagePace??row.pace??m.averagePace??m.pace),speed=numberOrNull(row.speed??m.speed),cadence=numberOrNull(row.averageCadence??row.cadence??m.averageCadence??m.cadence),calories=numberOrNull(row.calories??m.calories);
  const activityType=row.type??row.activityType??m.activityType??null,title=row.title??m.activityTitle??'Activity',parsedTime=Date.parse(String(start||'')),timestamp=Number.isFinite(parsedTime)?parsedTime:importedAt;
  const metricProvenance=frozen({activityType:activityType==null?SOURCE.UNAVAILABLE:source,startTime:start?source:SOURCE.UNAVAILABLE,duration:sourceFor(duration,source),distance:sourceFor(distance,source),heartRate:sourceFor(heartRate,source),maxHeartRate:sourceFor(maxHeartRate,source),pace:sourceFor(pace,source),speed:sourceFor(speed,source),cadence:sourceFor(cadence,source),calories:sourceFor(calories,source)});
  out.push(frozen({deviceHistoryId:stable('device-history',profileId,source,start,title,activityType),profileId,recordType:'ACTIVITY',source,sourcePackage:verifiedGarmin?GARMIN_PACKAGE:(row.sourcePackage||row.originPackage||p.sourcePackage||p.originPackage||null),sourceLabel:p.source||null,activityType,title,startTime:start||null,endTime:end||null,duration,distance,heartRate,maxHeartRate,pace,speed,cadence,calories,routeAvailable:row.routeAvailable??m.routeAvailable??null,metricProvenance,unavailableMetrics:Object.entries(metricProvenance).filter(([,s])=>s===SOURCE.UNAVAILABLE).map(([k])=>k),unsupportedMetrics:p.unavailableMetrics&&typeof p.unavailableMetrics==='object'?clone(p.unavailableMetrics):null,observedOnly:true,planAuthority:false,timestamp,importedAt,revision:1}))
 }
 return frozen(out)
}
class GarminLiveBridgeContract{
 constructor(options={}){this.w=options.windowObj||window;this.native=options.nativeBridge||this.w?.PTNative||null;this.bridge=options.bridge||null;this.clock=options.clock||clockDefault}
 _bridge(){return this.bridge||this.w?.KINETIQGarminLiveBridge||null}
 present(){return !!this._bridge()}
 capabilityAllows(){return readNativeCapabilities(this.native).externalSensorBridge===true}
 available(){const b=this._bridge();if(!this.capabilityAllows()||!b||typeof b.subscribe!=='function'||typeof b.isAvailable!=='function')return false;const provider=String(b.provider||'').toUpperCase(),transport=String(b.transport||'').toUpperCase();if(provider!=='GARMIN'||!['CONNECT_IQ','COMPANION'].includes(transport))return false;try{return b.isAvailable()===true}catch(_){return false}}
 status(){return frozen({present:this.present(),state:this.available()?STATE.AVAILABLE:STATE.UNAVAILABLE,source:SOURCE.GARMIN_LIVE})}
 normalize(raw,context={}){
  if(!this.available())return null;const r=parse(raw,{}),profileId=context.profileId,liveRunId=context.liveRunId;if(!profileId||!liveRunId)return null;
  const timestamp=finite(r.timestamp)?Number(r.timestamp):this.clock(),elapsed=numberOrNull(r.elapsed,{allowZero:true}),distance=numberOrNull(r.distance,{allowZero:true}),pace=numberOrNull(r.pace),heartRate=numberOrNull(r.heartRate??r.hr),cadence=numberOrNull(r.cadence),gpsState=r.gpsState?String(r.gpsState):null;
  return frozen({packetId:stable('garmin-live',profileId,liveRunId,timestamp),profileId,liveRunId,timestamp,runState:r.runState||'ACTIVE',elapsed,distance,pace,heartRate,cadence,gpsState,sensorAvailability:frozen({pace:pace!=null,distance:distance!=null,heartRate:heartRate!=null,cadence:cadence!=null}),provenance:frozen({elapsed:sourceFor(elapsed,SOURCE.GARMIN_LIVE),distance:sourceFor(distance,SOURCE.GARMIN_LIVE),pace:sourceFor(pace,SOURCE.GARMIN_LIVE),heartRate:sourceFor(heartRate,SOURCE.GARMIN_LIVE),cadence:sourceFor(cadence,SOURCE.GARMIN_LIVE),gpsState:gpsState?SOURCE.GARMIN_LIVE:SOURCE.UNAVAILABLE,route:Array.isArray(r.route)&&r.route.length?SOURCE.GARMIN_LIVE:SOURCE.UNAVAILABLE}),route:Array.isArray(r.route)?clone(r.route):null})
 }
 subscribe(context,onPacket){if(!this.available())return frozen({status:STATE.UNAVAILABLE,unsubscribe:null});try{const off=this._bridge().subscribe(raw=>{const packet=this.normalize(raw,context);if(packet)onPacket?.(packet)});return frozen({status:STATE.CONNECTED,unsubscribe:typeof off==='function'?off:null})}catch(_){return frozen({status:STATE.ERROR,unsubscribe:null})}}
}
class LiveMetricResolver{
 constructor(options={}){this.clock=options.clock||clockDefault;this.ttlMs=Number(options.ttlMs)||LIVE_TTL_MS}
 _fresh(packet,at){if(!packet||!finite(packet.timestamp))return false;const age=at-Number(packet.timestamp);return age>=-1000&&age<=this.ttlMs}
 _metric(packet,key,allowed,at,{allowZero=false}={}){if(!this._fresh(packet,at))return null;const src=packet?.provenance?.[key];if(!allowed.includes(src))return null;const v=numberOrNull(packet?.[key],{allowZero});return v==null?null:{value:v,source:src}}
 resolve(phonePacket,garminPacket,at=this.clock()){
  const p=phonePacket||null,g=garminPacket||null,profileId=g?.profileId||p?.profileId||null,liveRunId=g?.liveRunId||p?.liveRunId||null;if(g&&p&&(g.profileId!==p.profileId||g.liveRunId!==p.liveRunId))return frozen({status:'SCOPE_MISMATCH',packet:null});
  const pick=(key,opt)=>this._metric(g,key,[SOURCE.GARMIN_LIVE],at,opt)||this._metric(p,key,[SOURCE.PHONE_GPS],at,opt),elapsed=pick('elapsed',{allowZero:true}),distance=pick('distance',{allowZero:true}),pace=pick('pace'),heartRate=pick('heartRate'),cadence=pick('cadence');
  const gg=this._fresh(g,at)&&g?.gpsState&&g?.provenance?.gpsState===SOURCE.GARMIN_LIVE?{value:g.gpsState,source:SOURCE.GARMIN_LIVE}:null,pg=this._fresh(p,at)&&p?.gpsState&&(p?.provenance?.gpsState===SOURCE.PHONE_GPS||p?.provenance?.route===SOURCE.PHONE_GPS)?{value:p.gpsState,source:SOURCE.PHONE_GPS}:null,gps=gg||pg,routeSource=this._fresh(g,at)&&g?.provenance?.route===SOURCE.GARMIN_LIVE?SOURCE.GARMIN_LIVE:this._fresh(p,at)&&p?.provenance?.route===SOURCE.PHONE_GPS?SOURCE.PHONE_GPS:SOURCE.UNAVAILABLE;
  return frozen({status:'LIVE',packet:frozen({packetId:stable('live-resolved',profileId,liveRunId,at),profileId,liveRunId,timestamp:at,runState:g?.runState||p?.runState||'ACTIVE',elapsed:elapsed?.value??0,distance:distance?.value??null,pace:pace?.value??null,heartRate:heartRate?.value??null,cadence:cadence?.value??null,gpsState:gps?.value||'UNAVAILABLE',sensorAvailability:frozen({pace:!!pace,distance:!!distance,heartRate:!!heartRate,cadence:!!cadence}),provenance:frozen({elapsed:elapsed?.source||SOURCE.UNAVAILABLE,distance:distance?.source||SOURCE.UNAVAILABLE,pace:pace?.source||SOURCE.UNAVAILABLE,heartRate:heartRate?.source||SOURCE.UNAVAILABLE,cadence:cadence?.source||SOURCE.UNAVAILABLE,gpsState:gps?.source||SOURCE.UNAVAILABLE,route:routeSource})})})
 }
}
class DeviceService{
 constructor(store,options={}){this.store=store;this.w=options.windowObj||window;this.native=options.nativeBridge||this.w?.PTNative||null;this.manager=options.profileManager||v4.phase1?.manager||v4.profileManager||null;this.clock=options.clock||clockDefault;this.live=options.liveContract||new GarminLiveBridgeContract({windowObj:this.w,nativeBridge:this.native,clock:this.clock});this.resolver=options.resolver||new LiveMetricResolver({clock:this.clock});this.pendingSyncProfileId=null;this.listeners=new Set();this.legacyBridge=null}
 _key(profileId){return'v4.deviceState.'+profileId}
 _activeProfileId(){return this.manager?.activeProfileId||null}
 capabilities(){const c=readNativeCapabilities(this.native),live=this.live.status();return frozen({...c,garminLiveBridgePresent:live.present,garminLiveAvailable:live.state===STATE.AVAILABLE})}
 _nativeGarminProof(){const c=this.capabilities();return{verifiedGarminOrigin:c.garminDataBridge===true&&c.garminDataSourcePackage===GARMIN_PACKAGE,sourcePackage:c.garminDataSourcePackage||null}}
 async _saved(profileId){const r=await this.store.repository('appSettings').get(this._key(profileId));return clone(r?.value||{})}
 async _persist(profileId,patch){const repo=this.store.repository('appSettings'),old=await repo.get(this._key(profileId)),next={key:this._key(profileId),profileId,value:{...(old?.value||{}),...clone(patch)},updatedAt:this.clock()};await repo.put(next);this._emit(profileId);return clone(next.value)}
 async history(profileId,limit=100){const rows=await this.store.repository('deviceHistory').getAllByProfile(profileId);return rows.sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0)).slice(0,limit).map(clone)}
 async view(profileId){
  const c=this.capabilities(),saved=await this._saved(profileId),history=await this.history(profileId),garminCount=history.filter(x=>x.source===SOURCE.GARMIN_HISTORY).length,hcCount=history.filter(x=>x.source===SOURCE.HEALTH_CONNECT).length,hcState=!c.healthConnectAvailable?STATE.UNAVAILABLE:!c.healthPermissionsGranted?STATE.PERMISSION_REQUIRED:STATE.AVAILABLE;
  let syncState=saved.syncState||hcState;if(syncState===STATE.CONNECTED)syncState=STATE.SYNC_COMPLETE;if(!c.healthConnectAvailable)syncState=STATE.UNAVAILABLE;else if(!c.healthPermissionsGranted)syncState=STATE.PERMISSION_REQUIRED;const live=this.live.status();
  return frozen({profileId,healthConnect:{state:hcState,available:c.healthConnectAvailable,permissionGranted:c.healthPermissionsGranted},garmin:{installed:c.garminConnectInstalled,connectionState:garminCount?STATE.CONNECTED:STATE.NOT_CONNECTED,sourcePackage:c.garminDataSourcePackage||null},phoneGps:{state:c.phoneGpsPermission?STATE.AVAILABLE:STATE.PERMISSION_REQUIRED,permissionGranted:c.phoneGpsPermission,source:SOURCE.PHONE_GPS},historical:{state:syncState,lastSync:saved.lastSync||null,freshness:freshness(saved.lastSync,this.clock),availability:saved.dataAvailability||'UNKNOWN',count:history.length,garminCount,healthConnectCount:hcCount,activities:history.slice(0,20),unsupportedMetrics:saved.unsupportedMetrics||null},liveGarmin:{state:live.state,present:live.present,source:SOURCE.GARMIN_LIVE},error:saved.error||null,capabilities:c})
 }
 async requestHealthPermissions(profileId){const c=this.capabilities();if(!c.healthConnectAvailable){await this._persist(profileId,{syncState:STATE.UNAVAILABLE,error:'HEALTH_CONNECT_UNAVAILABLE'});return this.view(profileId)}await this._persist(profileId,{syncState:STATE.PERMISSION_REQUIRED,error:null});try{this.native?.openHealthConnectPermissions?.()}catch(_){await this._persist(profileId,{syncState:STATE.ERROR,error:'HEALTH_CONNECT_PERMISSION_UI_FAILED'})}return this.view(profileId)}
 async requestPhoneGps(profileId){try{this.native?.requestLocationPermission?.()}catch(_){await this._persist(profileId,{error:'PHONE_GPS_PERMISSION_REQUEST_FAILED'})}return this.view(profileId)}
 async openGarminConnect(){try{this.native?.openGarminConnect?.();return true}catch(_){return false}}
 async syncHistory(profileId){const c=this.capabilities();if(!c.healthConnectAvailable){await this._persist(profileId,{syncState:STATE.UNAVAILABLE,error:'HEALTH_CONNECT_UNAVAILABLE'});return this.view(profileId)}if(!c.healthPermissionsGranted){await this._persist(profileId,{syncState:STATE.PERMISSION_REQUIRED,error:'HEALTH_CONNECT_PERMISSION_REQUIRED'});return this.view(profileId)}if(typeof this.native?.syncGarminHealth!=='function'){await this._persist(profileId,{syncState:STATE.ERROR,error:'HEALTH_CONNECT_SYNC_UNAVAILABLE'});return this.view(profileId)}this.pendingSyncProfileId=profileId;await this._persist(profileId,{syncState:STATE.SYNCING,error:null});try{this.native.syncGarminHealth()}catch(_){this.pendingSyncProfileId=null;await this._persist(profileId,{syncState:STATE.ERROR,error:'HEALTH_CONNECT_SYNC_START_FAILED'})}return this.view(profileId)}
 async ingestNativeState(status){const profileId=this.pendingSyncProfileId||this._activeProfileId();if(!profileId)return null;const s=normalizedState(status);if(s===STATE.ERROR)return this._persist(profileId,{syncState:STATE.ERROR,error:'DEVICE_BRIDGE_ERROR'});if(s===STATE.UNAVAILABLE)return this._persist(profileId,{syncState:STATE.UNAVAILABLE,error:'HEALTH_CONNECT_UNAVAILABLE'});if(s===STATE.PERMISSION_REQUIRED)return this._persist(profileId,{syncState:STATE.PERMISSION_REQUIRED,error:'HEALTH_CONNECT_PERMISSION_REQUIRED'});return this._persist(profileId,{syncState:s,error:null})}
 async ingestNativeSync(payload,proof=this._nativeGarminProof()){const profileId=this.pendingSyncProfileId||this._activeProfileId();if(!profileId)return frozen({status:'NO_ACTIVE_PROFILE',count:0});const p=parse(payload,{}),records=normalizeHistoricalPayload(p,profileId,proof,this.clock),repo=this.store.repository('deviceHistory');for(const row of records)await repo.put(row);const garminCount=records.filter(x=>x.source===SOURCE.GARMIN_HISTORY).length;this.pendingSyncProfileId=null;await this._persist(profileId,{syncState:STATE.SYNC_COMPLETE,lastSync:this.clock(),dataAvailability:records.length?'AVAILABLE':'NO_RECORDS',verifiedGarminHistory:garminCount>0,unsupportedMetrics:p.unavailableMetrics||null,error:null});return frozen({status:STATE.SYNC_COMPLETE,profileId,count:records.length,garminCount,records})}
 async ingestNativeError(message){const profileId=this.pendingSyncProfileId||this._activeProfileId();if(!profileId)return null;this.pendingSyncProfileId=null;return this._persist(profileId,{syncState:STATE.ERROR,error:String(message||'SYNC_ERROR')})}
 async context(profileId,consumer='GENERAL'){const deviceState=await this.view(profileId),recentActivities=await this.history(profileId,30);return frozen({consumer,profileId,observedOnly:true,planAuthority:false,deviceState,recentActivities,summary:{activityCount:recentActivities.length,garminHistoryCount:recentActivities.filter(x=>x.source===SOURCE.GARMIN_HISTORY).length,healthConnectCount:recentActivities.filter(x=>x.source===SOURCE.HEALTH_CONNECT).length,lastSync:deviceState.historical.lastSync}})}
 coachContext(profileId){return this.context(profileId,'COACH')}
 progressContext(profileId){return this.context(profileId,'PROGRESS')}
 goalEngineContext(profileId){return this.context(profileId,'GOAL_ENGINE')}
 subscribe(fn){if(typeof fn!=='function')return()=>{};this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 _emit(profileId){for(const fn of this.listeners)try{fn(profileId)}catch(_){}}
 _callLegacyHistoricalSync(payload){const legacy=this.legacyBridge;if(!legacy?.onSyncComplete)return;const api=this.w?.ILIA_V7,original=api?.ingestDeviceMetrics;let suppressed=false;try{if(api&&typeof original==='function'){api.ingestDeviceMetrics=()=>{};suppressed=true}legacy.onSyncComplete.call(legacy,payload)}finally{if(suppressed)api.ingestDeviceMetrics=original}}
 installNativeBridgeObserver(){
  const current=this.w?.KINETIQDeviceBridge;if(current?.__KINETIQ_V4_PHASE8__)return current;this.legacyBridge=current||null;const legacy=this.legacyBridge,self=this,wrapper=Object.assign({},legacy||{});
  wrapper.__KINETIQ_V4_PHASE8__=true;wrapper.__legacyBridgePreserved=!!legacy;
  wrapper.onGarminState=function(status){try{legacy?.onGarminState?.call(legacy,status)}catch(_){}self.ingestNativeState(status).catch(()=>{})};
  wrapper.onMetrics=function(payload){try{legacy?.onMetrics?.call(legacy,payload)}catch(_){}};
  wrapper.onSyncComplete=function(payload){try{self._callLegacyHistoricalSync(payload)}catch(_){}self.ingestNativeSync(payload,self._nativeGarminProof()).catch(e=>self.ingestNativeError(e?.message||'SYNC_ERROR'))};
  wrapper.onError=function(message){try{legacy?.onError?.call(legacy,message)}catch(_){}self.ingestNativeError(message).catch(()=>{})};
  this.w.KINETIQDeviceBridge=wrapper;return wrapper
 }
}
const runtimeStore=v4.phase0?.store||null,runtimeManager=v4.phase1?.manager||v4.profileManager||null,runtimeNative=window.PTNative||null;
const liveBridge=new GarminLiveBridgeContract({windowObj:window,nativeBridge:runtimeNative});
const deviceService=runtimeStore?new DeviceService(runtimeStore,{windowObj:window,nativeBridge:runtimeNative,profileManager:runtimeManager,liveContract:liveBridge}):null;
if(deviceService)deviceService.installNativeBridgeObserver();
v4.phase8Exports=Object.freeze({SOURCE,STATE,GARMIN_PACKAGE,LIVE_TTL_MS,readNativeCapabilities,normalizeHistoricalPayload,GarminLiveBridgeContract,LiveMetricResolver,DeviceService});
v4.phase8=Object.freeze({version:'8',SOURCE,STATE,liveBridge,liveMetricResolver:deviceService?.resolver||new LiveMetricResolver(),deviceService,contextProvider:deviceService?Object.freeze({coach:p=>deviceService.coachContext(p),progress:p=>deviceService.progressContext(p),goalEngine:p=>deviceService.goalEngineContext(p)}):null});
})();