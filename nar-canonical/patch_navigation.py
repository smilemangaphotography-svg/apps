from pathlib import Path

ASSETS = Path('buildsrc/NAR-Mix/app/src/main/assets')
JS = ASSETS / 'app.js'

s = JS.read_text()

old_bind = "function bindNav(){$$('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;learnTopic='home';app()})}"
if old_bind not in s:
    raise SystemExit('canonical bindNav hook missing')

router = r'''const NAR_VALID_TABS=new Set(['home','search','mix','gpt','learn','mine','gallery','settings']);
const NAR_LEARN_TOPICS=new Set(['home','killer','phunnel','quasar','water','heat','fix','myths']);
function narScrollTop(){try{window.scrollTo(0,0)}catch(e){}}
function goTab(next){tab=NAR_VALID_TABS.has(next)?next:'home';if(tab==='learn')learnTopic='home';app();narScrollTop()}
function goLearn(topic='home'){tab='learn';learnTopic=NAR_LEARN_TOPICS.has(topic)?topic:'home';app();narScrollTop()}
function bindNav(){$$('nav button[data-tab]').forEach(b=>{b.onclick=()=>goTab(b.dataset.tab)})}'''

s = s.replace(old_bind, router, 1)

replacements = [
    ("learnTopic=b.dataset.topic;learn(p)", "goLearn(b.dataset.topic)"),
    ("$('#learnBack').onclick=()=>{learnTopic='home';learn(p)}", "$('#learnBack').onclick=()=>goLearn('home')"),
    ("$('#narRecoverLearn').onclick=()=>{learnTopic='home';tab='learn';app()}", "$('#narRecoverLearn').onclick=()=>goLearn('home')"),
    ("$('#settingsBowls').onclick=()=>{learnTopic='home';tab='learn';app()}", "$('#settingsBowls').onclick=()=>goLearn('home')"),
    ("save();closeModal();tab='learn';learnTopic='home';app();toast('Bowl updated')", "save();closeModal();goLearn('home');toast('Bowl updated')"),
]

for old, new in replacements:
    if old not in s:
        raise SystemExit(f'canonical navigation hook missing: {old[:48]}')
    s = s.replace(old, new)

# Guard against reintroducing the stale in-place Learn render path.
if "learnTopic=b.dataset.topic;learn(p)" in s:
    raise SystemExit('stale Learn topic in-place render remains')
if "$('#learnBack').onclick=()=>{learnTopic='home';learn(p)}" in s:
    raise SystemExit('stale Learn back in-place render remains')

JS.write_text(s)
print('Patched canonical NAR navigation: full app routing for Learn and back actions')
