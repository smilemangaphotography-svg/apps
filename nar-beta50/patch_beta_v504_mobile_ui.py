from pathlib import Path
import re

root = Path('buildsrc/NAR-Mix/app')
js_path = root / 'src/main/assets/app.js'
css_path = root / 'src/main/assets/app.css'
if not js_path.exists() or not css_path.exists():
    raise SystemExit('Canonical NAR assets not found')

js = js_path.read_text()
css = css_path.read_text()

JS_MARK = 'NAR BETA 5.0.4 — MOBILE OWNER/AI FIX'
CSS_MARK = 'NAR BETA 5.0.4 — MOBILE OWNER/AI FIX'

# adminAiModal lives inside the canonical app closure. Replace it in-place rather
# than appending a global override, otherwise WebView/browser scope cannot see it.
if JS_MARK not in js:
    start = js.find('function adminAiModal(){')
    end = js.find('function aiBrandId(', start)
    if start < 0 or end < 0:
        raise SystemExit('Canonical adminAiModal hook not found')
    replacement = r'''/* NAR BETA 5.0.4 — MOBILE OWNER/AI FIX */
function adminAiModal(){
  ensureAiState();
  const ready=!!((state.admin.aiEndpoint||'').trim());
  modal(`<div class="sheethead beta504AiHead"><button id="aiAdminBack" class="backbtn">← Owner Studio</button><span>NĀR AI</span></div>
    <div class="aiAdminHero beta504AiHero">
      <div class="beta504AiStatus ${ready?'ready':'setup'}"><i></i>${ready?'BACKEND CONFIGURED':'NOT CONNECTED'}</div>
      <small>SECURE OWNER CONNECTION</small>
      <h2>NĀR AI connection</h2>
      <p>Connect NĀR to a secure HTTPS AI backend. Your API key stays on the server and is never stored inside this APK.</p>
      <div class="beta504AiNote">A personal ChatGPT / Plus login cannot be used as the custom app backend.</div>
    </div>
    <div class="adminEdit beta504AiFields">
      <label>Secure HTTPS endpoint<input id="aiEndpoint" value="${esc(state.admin.aiEndpoint||'')}" placeholder="https://your-domain.example/api/nar-ai"></label>
      <label>Assistant name<input id="aiLabel" value="${esc(state.admin.aiLabel||'NĀR AI')}"></label>
    </div>
    <div class="betaAiAdminActions beta504AiActions">
      <button class="primary" id="saveAiEndpoint">Save connection</button>
      <button class="secondary" id="testAiEndpoint">Test connection</button>
    </div>
    <div class="fineprint beta504AiFineprint">Recognition request: {type:'recognize', image, catalog}. Chat request: {type:'chat', message, history}.</div>`);
  $('#modal').classList.add('narFullModal','aiAdminFull');
  $('#aiAdminBack').onclick=adminHomeModal;
  $('#saveAiEndpoint').onclick=()=>{
    const u=$('#aiEndpoint').value.trim();
    if(u&&!/^https:\/\//i.test(u))return toast('Use an HTTPS endpoint');
    state.admin.aiEndpoint=u;
    state.admin.aiLabel=$('#aiLabel').value.trim()||'NĀR AI';
    save();
    toast('AI connection saved');
    adminAiModal();
  };
  $('#testAiEndpoint').onclick=async()=>{
    const u=$('#aiEndpoint').value.trim();
    if(!u)return toast('Enter an HTTPS endpoint first');
    if(!/^https:\/\//i.test(u))return toast('Use an HTTPS endpoint');
    state.admin.aiEndpoint=u;
    save();
    const b=$('#testAiEndpoint');
    b.disabled=true;b.textContent='Testing…';
    try{
      const r=await aiRequest({type:'chat',message:'NĀR connection test',history:[]});
      toast(r.answer||r.message?'AI connection works':'Endpoint responded');
    }catch(e){toast(e.message)}finally{b.disabled=false;b.textContent='Test connection'}
  };
}
'''
    js = js[:start] + replacement + js[end:]

if CSS_MARK not in css:
    css += r'''

/* NAR BETA 5.0.4 — MOBILE OWNER/AI FIX */
/* Keep the fixed six-tab bar, but allow the final content to scroll fully above it. */
.beta50Shell #page{
  padding-bottom:220px!important;
  scroll-padding-bottom:220px!important;
}

/* Owner Studio is a focused admin context: do not duplicate the main app nav inside it. */
.ownerStudioFull .pixelNarNav{display:none!important}
.ownerStudioFull .sheet{padding-bottom:max(30px,env(safe-area-inset-bottom,0px))!important}

/* The two owner extension cards previously placed the description into a 22px grid column. */
.beta50OwnerExtras>button{
  position:relative!important;
  display:block!important;
  min-height:82px!important;
  padding:14px 46px 14px 16px!important;
  overflow:hidden!important;
}
.beta50OwnerExtras>button>b{
  display:block!important;
  margin:0 0 5px!important;
  color:#f4eee7!important;
  font-size:17px!important;
  line-height:1.15!important;
}
.beta50OwnerExtras>button>span{
  display:block!important;
  width:auto!important;
  max-width:100%!important;
  margin:0!important;
  color:#9f988f!important;
  font-size:11px!important;
  line-height:1.35!important;
  white-space:normal!important;
  overflow-wrap:anywhere!important;
}
.beta50OwnerExtras>button>em{
  position:absolute!important;
  right:16px!important;
  top:50%!important;
  transform:translateY(-50%)!important;
  color:#d39b57!important;
  font-size:22px!important;
}

/* AI setup now behaves like a proper Owner Studio sub-page instead of a large bottom sheet. */
.aiAdminFull{background:#060806!important}
.aiAdminFull .sheet{
  width:min(480px,100%)!important;
  height:100dvh!important;
  max-height:none!important;
  border:0!important;
  border-radius:0!important;
  padding:calc(var(--safe-top) + 8px) 18px max(34px,env(safe-area-inset-bottom,0px))!important;
  background:#060806!important;
}
.beta504AiHead{
  position:sticky!important;
  top:0!important;
  z-index:3!important;
  min-height:58px!important;
  margin:0 -2px 8px!important;
  background:#060806!important;
}
.beta504AiHead .backbtn{white-space:nowrap!important}
.beta504AiHero{padding:14px 0 12px!important}
.beta504AiHero small{display:block!important;margin-top:10px!important;font-size:10px!important;letter-spacing:.18em!important}
.beta504AiHero h2{margin:8px 0 10px!important;font-size:31px!important;line-height:1.08!important}
.beta504AiHero p{max-width:440px!important;color:#aaa39a!important;font-size:14px!important;line-height:1.48!important}
.beta504AiStatus{display:inline-flex!important;align-items:center!important;gap:7px!important;min-height:30px!important;padding:0 10px!important;border:1px solid rgba(223,162,89,.34)!important;border-radius:999px!important;color:#d8a15b!important;font-size:9px!important;font-weight:800!important;letter-spacing:.08em!important}
.beta504AiStatus i{width:7px!important;height:7px!important;border-radius:50%!important;background:#d49a4d!important}
.beta504AiStatus.ready{border-color:rgba(105,201,145,.42)!important;color:#82d0a3!important}
.beta504AiStatus.ready i{background:#82d0a3!important}
.beta504AiNote{margin-top:12px!important;padding:11px 12px!important;border:1px solid rgba(223,162,89,.2)!important;border-radius:11px!important;background:#0c0e0a!important;color:#8f887e!important;font-size:11px!important;line-height:1.4!important}
.beta504AiFields{margin-top:6px!important}
.beta504AiFields label{font-size:11px!important}
.beta504AiFields input{min-height:54px!important;font-size:14px!important}
.beta504AiActions{gap:10px!important;margin-top:10px!important}
.beta504AiActions button{min-width:0!important;min-height:54px!important;padding:10px 8px!important;font-size:13px!important;line-height:1.15!important;white-space:nowrap!important}
.beta504AiFineprint{margin-top:14px!important;font-size:9px!important;line-height:1.5!important}

@media(max-width:370px){
  .beta504AiActions{grid-template-columns:1fr!important}
  .beta504AiHero h2{font-size:28px!important}
  .beta504AiActions button{width:100%!important}
}
'''

js_path.write_text(js)
css_path.write_text(css)

# Bump install version after the 5.0.3 patch. Mirror the robust metadata search
# used by v503 because this project can express version fields in several Gradle forms.
project_root = Path('buildsrc/NAR-Mix')
metadata_files = []
for pattern in ('**/build.gradle', '**/build.gradle.kts', '**/AndroidManifest.xml'):
    metadata_files.extend(project_root.glob(pattern))
metadata_files = list(dict.fromkeys(metadata_files))
if not metadata_files:
    raise SystemExit('NAR Android metadata files not found')

found_version = False
for p in metadata_files:
    try:
        s = p.read_text()
    except UnicodeDecodeError:
        continue
    original = s

    s, _ = re.subn(
        r'(?m)(\bversionName\s*(?:=\s*)?)["\'][^"\']+["\']',
        r'\g<1>"5.0.4-beta"',
        s,
    )
    s, _ = re.subn(
        r'(android:versionName\s*=\s*)["\'][^"\']+["\']',
        r'\g<1>"5.0.4-beta"',
        s,
    )
    if '5.0.0-beta' in s:
        s = s.replace('5.0.0-beta', '5.0.4-beta')

    s, _ = re.subn(r'(?m)(\bversionCode\s*(?:=\s*)?)\d+', r'\g<1>554', s)
    s, _ = re.subn(r'(android:versionCode\s*=\s*)["\']\d+["\']', r'\g<1>"554"', s)

    if '5.0.4-beta' in s:
        found_version = True
    if s != original:
        p.write_text(s)
        print(f'Updated Beta 5.0.4 metadata in {p}')

if not found_version:
    raise SystemExit('NAR Beta 5.0.4 versionName metadata hook not found')

print('Applied NAR Beta 5.0.4 mobile Owner Studio + AI layout fixes; versionCode 554, versionName 5.0.4-beta')
