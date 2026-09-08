(function () {
  if (window.__PT_SAFE_BOOT__) return;
  window.__PT_SAFE_BOOT__ = true;

  function q(id) { return document.getElementById(id); }
  function qa(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }
  function text(id, value) { var el = q(id); if (el) el.textContent = value; }
  function clamp(v, min, max) { v = Number(v); if (isNaN(v)) v = min; return Math.max(min, Math.min(max, v)); }
  function fmt(sec) { sec = Math.max(0, Number(sec) || 0); var m = Math.floor(sec / 60); var s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function todayIso() { return new Date().toISOString().slice(0, 10); }

  if (typeof window.ptHandleBack === 'function') {
    window.__PT_RUNTIME__ = 'main';
    return;
  }

  window.__PT_RUNTIME__ = 'safe-fallback';

  var KEY = 'pt.android.safe.14';
  var defaults = {
    name: '', goal: '10K', target: '48:00', weeks: 12, days: 4,
    injury: 'Knee', pain: 0, side: 'Left', notes: '',
    allergies: '', intolerances: '', foodAvoid: '',
    selectedDay: todayIso(), session: 'TRAIN', ex: 0,
    nut: { calories: 0, protein: 0, water: 0, creatine: 0 },
    readiness: { sleep: 8, energy: 8, soreness: 8, motivation: 8, pain: 8 },
    workouts: [], autoPlay: true, autoStop: true, musicDuringRest: true,
    adminPin: '1234'
  };

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function load() {
    var s = clone(defaults), raw, parsed, k;
    try {
      raw = localStorage.getItem(KEY);
      if (!raw) return s;
      parsed = JSON.parse(raw);
      for (k in parsed) if (Object.prototype.hasOwnProperty.call(parsed, k)) s[k] = parsed[k];
      s.nut = Object.assign({}, defaults.nut, parsed.nut || {});
      s.readiness = Object.assign({}, defaults.readiness, parsed.readiness || {});
      if (!Array.isArray(s.workouts)) s.workouts = [];
    } catch (e) {}
    return s;
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var EX = [
    { n: 'Goblet Squat', sets: 3, reps: 12, kg: 16, rest: 60, m: 'Quads • Glutes • Core', cue: 'Chest tall. Knees track with toes. Control the descent.', media: 'media/goblet.webp' },
    { n: '45° Leg Press', sets: 3, reps: 12, kg: 70, rest: 90, m: 'Quads • Glutes • Hamstrings', cue: 'Keep back and pelvis supported. Feet flat. Stop short of knee lockout.', media: 'media/legpress.webp' },
    { n: 'Standing Calf Raise', sets: 3, reps: 15, kg: 0, rest: 60, m: 'Calf • Achilles capacity', cue: 'Rise slowly, pause, and lower under control.', media: '' },
    { n: 'Spanish Squat', sets: 3, reps: 12, kg: 0, rest: 60, m: 'Quadriceps • Knee capacity', cue: 'Sit back into the strap with a tall torso and controlled depth.', media: '' },
    { n: 'Wrist Extensor Isometric', sets: 4, reps: 30, kg: 0, rest: 45, m: 'Forearm extensor tendon', cue: 'Neutral wrist and pain-monitored effort.', media: '' },
    { n: 'Hip Mobility Flow', sets: 2, reps: 10, kg: 0, rest: 30, m: 'Hip mobility', cue: 'Use a slow, controlled range without forcing end range.', media: '' }
  ];

  var RUNS = [
    { name: 'Recovery Run', meta: '5 km • Zone 2', detail: 'Easy conversational pace. Keep effort controlled.' },
    { name: 'Interval Run', meta: '6 × 3 min • 2 min easy', detail: 'Fast but controlled repetitions. Stop if mechanics deteriorate.' },
    { name: 'Long Run', meta: '8–12 km • Zone 2', detail: 'Steady aerobic endurance.' }
  ];
  var RECOVERY = [
    { name: 'Knee Capacity', meta: '8 min', detail: 'Pain-monitored isometrics and controlled-range strength.' },
    { name: 'Mobility Reset', meta: '10 min', detail: 'Hip, ankle and thoracic mobility.' },
    { name: 'Easy Recovery', meta: '15 min', detail: 'Light movement and breathing.' }
  ];

  var workoutTimer = null, restTimer = null, workoutSeconds = 0, restLeft = 0, setDone = 0, paused = false;

  function toast(msg) {
    var el = q('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 1500);
  }

  function openShell() {
    hide(q('cover'));
    show(q('shell'));
    showPage('home');
    buildWeek();
    render();
  }

  function openDrawer() { if (q('drawer')) q('drawer').classList.add('open'); if (q('scrim')) q('scrim').classList.add('show'); }
  function closeDrawer() { if (q('drawer')) q('drawer').classList.remove('open'); if (q('scrim')) q('scrim').classList.remove('show'); }

  function showPage(page) {
    qa('.page').forEach(function (el) { el.classList.toggle('active', el.getAttribute('data-page') === page); });
    qa('[data-nav]').forEach(function (el) { el.classList.toggle('active', el.getAttribute('data-nav') === page); });
    closeDrawer();
    if (page === 'train') { buildWeek(); renderSession(); renderExercise(); }
    if (page === 'exercises') renderExerciseList();
    if (page === 'nutrition') renderNutrition();
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function modal(title, eye, html) {
    text('modalTitle', title);
    text('modalEye', eye);
    if (q('modalBody')) q('modalBody').innerHTML = html;
    show(q('modal'));
    closeDrawer();
    bindModal();
  }
  function closeModal() { hide(q('modal')); }

  function showModal(kind) {
    if (kind === 'admin') {
      modal('Admin Panel', 'ADMIN',
        '<div class="card"><b>Admin controls</b><div class="muted">Fallback runtime is active because the primary UI script failed to initialize.</div></div>' +
        '<label class="field">Admin PIN<input id="pinF" type="password" inputmode="numeric" placeholder="1234"></label>' +
        '<button id="unlockAdmin" class="primary">UNLOCK</button>' +
        '<div id="adminTools" class="hidden">' +
        '<label class="field">Default training days<input id="adminDays" type="number" min="2" max="7" value="' + S.days + '"></label>' +
        '<label class="field">Default goal<input id="adminGoal" value="' + esc(S.goal) + '"></label>' +
        '<button id="adminSave" class="primary">SAVE DEFAULTS</button>' +
        '<button id="reset" class="primary danger">RESET BETA DATA</button></div>');
      return;
    }
    if (kind === 'goals') {
      modal('Set Your Goal', 'GOALS',
        '<label class="field">Goal<input id="goalF" value="' + esc(S.goal) + '"></label>' +
        '<label class="field">Target time<input id="targetF" value="' + esc(S.target) + '"></label>' +
        '<label class="field">Weeks<input id="weeksF" type="number" min="4" max="52" value="' + S.weeks + '"></label>' +
        '<label class="field">Days/week<input id="daysF" type="number" min="2" max="7" value="' + S.days + '"></label>' +
        '<button id="saveGoal" class="primary">SAVE GOAL</button>');
      return;
    }
    if (kind === 'programs') {
      modal('Training Programs', 'PROGRAMS',
        '<div class="list"><button data-safe-weeks="8"><b>8 Week Program</b></button><button data-safe-weeks="12"><b>12 Week Program</b></button><button data-safe-weeks="16"><b>16 Week Program</b></button><button data-safe-weeks="26"><b>6 Month Program</b></button><button data-safe-weeks="52"><b>12 Month Program</b></button></div>');
      return;
    }
    if (kind === 'injuries') {
      modal('Injuries', 'RECOVERY',
        '<label class="field">Injury / focus<input id="injuryF" value="' + esc(S.injury) + '"></label>' +
        '<label class="field">Side<select id="sideF"><option>Left</option><option>Right</option><option>Both</option></select></label>' +
        '<label class="field">Pain level <b id="painOut">' + S.pain + '/10</b><input id="painF" type="range" min="0" max="10" value="' + S.pain + '"></label>' +
        '<label class="field">Restrictions / notes<textarea id="notesF">' + esc(S.notes) + '</textarea></label>' +
        '<button id="saveInjury" class="primary">SAVE INJURY PROFILE</button>');
      if (q('sideF')) q('sideF').value = S.side;
      return;
    }
    if (kind === 'food') {
      modal('Food & Allergies', 'NUTRITION',
        '<label class="field">Food allergies<textarea id="allergyF">' + esc(S.allergies) + '</textarea></label>' +
        '<label class="field">Intolerances<textarea id="intoleranceF">' + esc(S.intolerances) + '</textarea></label>' +
        '<label class="field">Foods to avoid<textarea id="avoidF">' + esc(S.foodAvoid) + '</textarea></label>' +
        '<button id="saveFood" class="primary">SAVE</button>');
      return;
    }
    if (kind === 'connected') {
      modal('Connected Data', 'SYNC',
        '<div class="card"><b>Garmin</b><div class="muted">Import activity files until official account authorization is configured.</div><button id="safeGarminImport" class="secondary" style="margin-top:10px">IMPORT FILE</button><input id="safeGarminFile" class="hidden" type="file" accept=".gpx,.tcx,.csv,text/*"></div>' +
        '<div class="card"><b>Strava</b><div class="muted">Import activity files until official OAuth is configured.</div><button id="safeStravaImport" class="secondary" style="margin-top:10px">IMPORT FILE</button><input id="safeStravaFile" class="hidden" type="file" accept=".gpx,.tcx,.csv,text/*"></div>');
      return;
    }
    if (kind === 'progress') {
      var last = S.workouts.length ? S.workouts[S.workouts.length - 1] : null;
      modal('Your Progress', 'PROGRESS',
        '<div class="metric-grid"><div class="metric-card"><span class="eyebrow">WORKOUTS</span><b>' + S.workouts.length + '</b></div><div class="metric-card"><span class="eyebrow">GOAL</span><b>' + esc(S.goal) + '</b></div><div class="metric-card"><span class="eyebrow">PAIN</span><b>' + S.pain + '/10</b></div><div class="metric-card"><span class="eyebrow">DAYS/WEEK</span><b>' + S.days + '</b></div></div>' +
        (last ? '<div class="card"><b>Last session</b><div class="muted">' + esc(last.exercise) + ' • ' + fmt(last.duration) + '</div></div>' : ''));
      return;
    }
    if (kind === 'settings') {
      modal('Settings', 'APP', '<label class="field">Name<input id="nameF" value="' + esc(S.name) + '"></label><button id="saveSettings" class="primary">SAVE PROFILE</button>');
      return;
    }
    if (kind === 'readiness') {
      modal('Daily Readiness', 'TODAY', readinessHtml());
      return;
    }
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function readinessHtml() {
    var keys = [['sleep', 'Sleep quality'], ['energy', 'Energy'], ['soreness', 'Muscle readiness'], ['motivation', 'Motivation'], ['pain', 'Injury comfort']];
    var html = '';
    keys.forEach(function (row) {
      html += '<label class="field">' + row[1] + ' <b id="' + row[0] + 'Out">' + S.readiness[row[0]] + '/10</b><input data-safe-ready="' + row[0] + '" type="range" min="1" max="10" value="' + S.readiness[row[0]] + '"></label>';
    });
    return html + '<button id="saveReadiness" class="primary">SAVE READINESS</button>';
  }

  function bindModal() {
    var el;
    el = q('painF'); if (el) el.oninput = function () { text('painOut', this.value + '/10'); };
    el = q('saveGoal'); if (el) el.onclick = function () { S.goal = q('goalF').value || S.goal; S.target = q('targetF').value || ''; S.weeks = clamp(q('weeksF').value, 4, 52); S.days = clamp(q('daysF').value, 2, 7); save(); closeModal(); render(); toast('Goal saved'); };
    qa('[data-safe-weeks]').forEach(function (b) { b.onclick = function () { S.weeks = Number(this.getAttribute('data-safe-weeks')) || 12; save(); closeModal(); render(); toast('Program selected'); }; });
    el = q('saveInjury'); if (el) el.onclick = function () { S.injury = q('injuryF').value || 'Recovery'; S.side = q('sideF').value; S.pain = clamp(q('painF').value, 0, 10); S.notes = q('notesF').value || ''; save(); closeModal(); render(); toast('Injury profile saved'); };
    el = q('saveFood'); if (el) el.onclick = function () { S.allergies = q('allergyF').value || ''; S.intolerances = q('intoleranceF').value || ''; S.foodAvoid = q('avoidF').value || ''; save(); closeModal(); renderNutrition(); toast('Food profile saved'); };
    el = q('saveSettings'); if (el) el.onclick = function () { S.name = q('nameF').value || ''; save(); closeModal(); render(); toast('Profile saved'); };
    el = q('unlockAdmin'); if (el) el.onclick = function () { if (q('pinF').value === S.adminPin) { show(q('adminTools')); toast('Admin unlocked'); } else toast('Wrong PIN'); };
    el = q('adminSave'); if (el) el.onclick = function () { S.days = clamp(q('adminDays').value, 2, 7); S.goal = q('adminGoal').value || S.goal; save(); closeModal(); render(); toast('Admin defaults saved'); };
    el = q('reset'); if (el) el.onclick = function () { try { localStorage.removeItem(KEY); } catch (e) {} S = clone(defaults); closeModal(); render(); toast('Beta data reset'); };
    qa('[data-safe-ready]').forEach(function (i) { i.oninput = function () { text(this.getAttribute('data-safe-ready') + 'Out', this.value + '/10'); }; });
    el = q('saveReadiness'); if (el) el.onclick = function () { qa('[data-safe-ready]').forEach(function (i) { S.readiness[i.getAttribute('data-safe-ready')] = clamp(i.value, 1, 10); }); save(); closeModal(); render(); toast('Readiness updated'); };
    el = q('safeGarminImport'); if (el) el.onclick = function () { q('safeGarminFile').click(); };
    el = q('safeStravaImport'); if (el) el.onclick = function () { q('safeStravaFile').click(); };
    el = q('safeGarminFile'); if (el) el.onchange = function () { if (this.files && this.files[0]) toast('Garmin file selected: ' + this.files[0].name); };
    el = q('safeStravaFile'); if (el) el.onchange = function () { if (this.files && this.files[0]) toast('Strava file selected: ' + this.files[0].name); };
  }

  function readinessScore() {
    var r = S.readiness;
    return Math.round((Number(r.sleep) + Number(r.energy) + Number(r.soreness) + Number(r.motivation) + Number(r.pain)) / 5);
  }

  function render() {
    var score = readinessScore(), weekly = 0, i;
    text('hello', S.name ? 'Good Morning, ' + S.name : "Good Morning. Let's Train.");
    text('drawerName', S.name || 'Your Name');
    text('readyScore', score + '/10');
    text('readyText', S.pain >= 7 ? 'Recovery recommended' : (score <= 6 ? 'Reduce load' : 'Good to train'));
    text('readyReason', S.pain >= 7 ? 'High pain — modify training' : 'Tap to update today\'s readiness');
    text('injuryFocus', (S.injury || 'Recovery') + ' Capacity');
    text('planStrength', S.pain >= 7 ? 'Upper Body + Recovery' : 'Lower Body Strength');
    text('planRun', S.pain >= 7 ? 'No Run Today' : 'Recovery Run');
    for (i = 0; i < S.workouts.length; i++) if (Date.now() - S.workouts[i].date < 7 * 86400000) weekly++;
    text('weekProgress', weekly + '/' + S.days);
    if (q('weekBar')) q('weekBar').style.width = Math.min(100, weekly / Math.max(1, S.days) * 100) + '%';
    renderExercise();
    renderSession();
    renderExerciseList();
    renderNutrition();
    if (q('autoPlay')) q('autoPlay').checked = !!S.autoPlay;
    if (q('autoStop')) q('autoStop').checked = !!S.autoStop;
    if (q('musicDuringRest')) q('musicDuringRest').checked = !!S.musicDuringRest;
  }

  function renderExercise() {
    var ex = EX[S.ex] || EX[0], img = q('exerciseMedia'), fb = q('mediaFallback');
    text('exCount', 'EXERCISE ' + (S.ex + 1) + ' OF ' + EX.length);
    text('exName', ex.n); text('sets', ex.sets); text('reps', ex.reps); text('weight', ex.kg || 'BW'); text('rest', ex.rest + 's');
    text('motionNote', ex.media ? 'Reviewed static anatomy reference' : 'Motion asset under review');
    if (img && fb) {
      if (ex.media) { img.src = ex.media; show(img); hide(fb); img.onerror = function () { hide(img); show(fb); }; }
      else { img.removeAttribute('src'); hide(img); show(fb); }
    }
  }

  function dayIndex() { var d = new Date((S.selectedDay || todayIso()) + 'T12:00:00'); return (d.getDay() + 6) % 7; }
  function renderSession() {
    qa('[data-session]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-session') === S.session); });
    var card = q('exerciseCard'), other = q('nonExerciseSession');
    if (!card || !other) return;
    if (S.session === 'TRAIN') {
      show(card); hide(other);
      var strength = ['Lower Body Strength', 'Upper Body + Core', 'Lower Body Capacity', 'Full Body Strength', 'Lower Body Strength', 'Recovery Strength', 'Mobility + Reset'][dayIndex()] || 'Lower Body Strength';
      text('sessionEye', 'STRENGTH SESSION'); text('sessionName', S.pain >= 7 ? 'Upper Body + Recovery' : strength); text('sessionMeta', S.pain >= 7 ? '30 min • Modified for pain' : '45 min • Gym');
    } else {
      hide(card); show(other);
      var item = (S.session === 'RUNNING' ? RUNS : RECOVERY)[dayIndex() % 3];
      text('sessionEye', S.session === 'RUNNING' ? 'RUNNING SESSION' : 'RECOVERY SESSION'); text('sessionName', item.name); text('sessionMeta', item.meta);
      other.innerHTML = '<span class="eyebrow">' + S.session + '</span><h2>' + esc(item.name) + '</h2><div class="muted">' + esc(item.meta) + '</div><p>' + esc(item.detail) + '</p><button id="safeSimpleStart" class="primary">START ' + S.session + '</button>';
      if (q('safeSimpleStart')) q('safeSimpleStart').onclick = function () { S.workouts.push({ date: Date.now(), duration: 1, exercise: item.name, sets: 1, mode: S.session }); save(); toast('Session saved'); };
    }
  }

  function buildWeek() {
    var host = q('week'); if (!host) return;
    var d = new Date(), mon = new Date(d), names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    mon.setDate(d.getDate() - (d.getDay() ? d.getDay() - 1 : 6));
    host.innerHTML = '';
    names.forEach(function (name, idx) {
      var x = new Date(mon), iso, b;
      x.setDate(mon.getDate() + idx); iso = x.toISOString().slice(0, 10);
      b = document.createElement('button'); b.className = 'day' + (S.selectedDay === iso ? ' active' : ''); b.innerHTML = '<small>' + name + '</small><b>' + x.getDate() + '</b>';
      b.onclick = function () { S.selectedDay = iso; save(); buildWeek(); renderSession(); };
      host.appendChild(b);
    });
  }

  function renderExerciseList() {
    var filters = q('filters'), list = q('exerciseList');
    if (filters && !filters.getAttribute('data-safe-ready')) {
      filters.setAttribute('data-safe-ready', '1'); filters.innerHTML = '<button class="pill active">All</button><button class="pill">Lower</button><button class="pill">Upper</button><button class="pill">Rehab</button><button class="pill">Mobility</button>';
    }
    if (!list) return;
    list.innerHTML = '';
    EX.forEach(function (ex, idx) {
      var b = document.createElement('button'); b.innerHTML = '<strong>' + esc(ex.n) + '</strong><small>' + esc(ex.m) + '</small><div class="statusline ' + (ex.media ? '' : 'pending') + '">' + (ex.media ? '✓ Reviewed anatomy reference' : 'Motion pending review') + '</div>';
      b.onclick = function () { S.ex = idx; save(); openExerciseDetail(idx); };
      list.appendChild(b);
    });
  }

  function openExerciseDetail(idx) {
    S.ex = idx; save(); var ex = EX[idx] || EX[0];
    modal(ex.n, 'EXERCISE DETAIL', '<div class="card"><b>Primary muscles</b><div class="muted">' + esc(ex.m) + '</div></div><div class="card"><b>Technique cue</b><div class="muted">' + esc(ex.cue) + '</div></div><div class="stats"><div class="stat"><small>SETS</small><strong>' + ex.sets + '</strong></div><div class="stat"><small>REPS</small><strong>' + ex.reps + '</strong></div><div class="stat"><small>WEIGHT</small><strong>' + (ex.kg || 'BW') + '</strong></div><div class="stat"><small>REST</small><strong>' + ex.rest + 's</strong></div></div><button id="safeUseExercise" class="primary">USE IN TODAY\'S WORKOUT</button>');
    if (q('safeUseExercise')) q('safeUseExercise').onclick = function () { closeModal(); showPage('train'); renderExercise(); };
  }

  function startWorkout() {
    if (S.session !== 'TRAIN') { toast('Switch to TRAIN for exercise workout'); return; }
    workoutSeconds = 0; restLeft = 0; setDone = 0; paused = false; show(q('workout')); updateWorkout();
    clearInterval(workoutTimer); clearInterval(restTimer);
    workoutTimer = setInterval(function () { if (!paused && restLeft === 0) { workoutSeconds++; text('timer', fmt(workoutSeconds)); } }, 1000);
    if (S.autoPlay && q('audio') && q('audio').src) q('audio').play().catch(function () {});
  }
  function updateWorkout() {
    var ex = EX[S.ex] || EX[0]; text('workoutName', ex.n); text('wReps', ex.reps); text('wWeight', (ex.kg || 'BW') + (ex.kg ? 'kg' : '')); text('wRest', ex.rest + 's'); text('wDone', setDone + '/' + ex.sets); text('setText', restLeft > 0 ? 'Rest' : 'Set ' + Math.min(setDone + 1, ex.sets) + ' of ' + ex.sets);
    var img = q('workoutMedia'), fb = q('workoutFallback'); if (img && fb) { if (ex.media) { img.src = ex.media; show(img); hide(fb); } else { hide(img); show(fb); } }
  }
  function beginRest(seconds) {
    restLeft = seconds; if (q('timerRing')) q('timerRing').classList.add('rest-ring'); text('timer', fmt(restLeft));
    clearInterval(restTimer); restTimer = setInterval(function () { if (paused) return; restLeft--; if (restLeft <= 0) { clearInterval(restTimer); restLeft = 0; if (q('timerRing')) q('timerRing').classList.remove('rest-ring'); text('timer', fmt(workoutSeconds)); updateWorkout(); toast('Rest complete'); } else text('timer', fmt(restLeft)); }, 1000);
  }
  function completeSet() {
    var ex = EX[S.ex] || EX[0]; if (restLeft > 0) { toast('Rest in progress'); return; } if (setDone < ex.sets) { setDone++; updateWorkout(); if (setDone < ex.sets) beginRest(ex.rest); else toast('Exercise complete'); }
  }
  function finishWorkout() {
    clearInterval(workoutTimer); clearInterval(restTimer); var ex = EX[S.ex] || EX[0]; S.workouts.push({ date: Date.now(), duration: workoutSeconds, exercise: ex.n, sets: setDone, mode: 'TRAIN' }); save(); hide(q('workout')); if (S.autoStop && q('audio')) q('audio').pause(); render(); toast('Workout saved');
  }

  function renderNutrition() {
    text('caloriesVal', (S.nut.calories || 0) + ' / 2250'); text('proteinVal', (S.nut.protein || 0) + ' / 140'); text('waterVal', (S.nut.water || 0) + ' / 2500'); text('creatineVal', (S.nut.creatine || 0) + ' / 5');
    text('foodSummary', [S.allergies && 'Allergies: ' + S.allergies, S.intolerances && 'Intolerances: ' + S.intolerances, S.foodAvoid && 'Avoid: ' + S.foodAvoid].filter(Boolean).join(' • ') || 'None set');
  }
  function editNutrition(key) {
    var label = key === 'water' ? 'Hydration (ml)' : key.charAt(0).toUpperCase() + key.slice(1);
    modal('Update ' + label, 'NUTRITION', '<label class="field">Consumed today<input id="safeNutF" type="number" min="0" value="' + (S.nut[key] || 0) + '"></label><button id="safeNutSave" class="primary">SAVE</button>');
    if (q('safeNutSave')) q('safeNutSave').onclick = function () { S.nut[key] = Math.max(0, Number(q('safeNutF').value) || 0); save(); closeModal(); renderNutrition(); toast('Nutrition updated'); };
  }

  function bindPermanentControls() {
    if (q('enter')) q('enter').onclick = openShell;
    if (q('adminCover')) q('adminCover').onclick = function () { hide(q('cover')); show(q('shell')); render(); showModal('admin'); };
    if (q('menuBtn')) q('menuBtn').onclick = openDrawer;
    if (q('scrim')) q('scrim').onclick = closeDrawer;
    if (q('modalBack')) q('modalBack').onclick = closeModal;
    if (q('startToday')) q('startToday').onclick = function () { openShell(); showPage('train'); };
    if (q('readinessBtn')) q('readinessBtn').onclick = function () { showModal('readiness'); };
    if (q('prev')) q('prev').onclick = function () { S.ex = (S.ex + EX.length - 1) % EX.length; save(); renderExercise(); };
    if (q('next')) q('next').onclick = function () { S.ex = (S.ex + 1) % EX.length; save(); renderExercise(); };
    if (q('detailBtn')) q('detailBtn').onclick = function () { openExerciseDetail(S.ex); };
    if (q('startWorkout')) q('startWorkout').onclick = startWorkout;
    if (q('workoutBack')) q('workoutBack').onclick = function () { paused = true; toast('Workout paused'); };
    if (q('wPrev')) q('wPrev').onclick = function () { S.ex = (S.ex + EX.length - 1) % EX.length; setDone = 0; restLeft = 0; clearInterval(restTimer); updateWorkout(); };
    if (q('wNext')) q('wNext').onclick = function () { S.ex = (S.ex + 1) % EX.length; setDone = 0; restLeft = 0; clearInterval(restTimer); updateWorkout(); };
    if (q('completeSet')) q('completeSet').onclick = completeSet;
    if (q('pause')) q('pause').onclick = function () { paused = !paused; this.textContent = paused ? 'Resume' : 'Pause'; };
    if (q('finish')) q('finish').onclick = finishWorkout;

    qa('[data-nav]').forEach(function (b) { b.onclick = function () { showPage(this.getAttribute('data-nav')); }; });
    qa('[data-open]').forEach(function (b) { b.onclick = function () { showPage(this.getAttribute('data-open')); }; });
    qa('[data-modal]').forEach(function (b) { b.onclick = function () { showModal(this.getAttribute('data-modal')); }; });
    qa('[data-session]').forEach(function (b) { b.onclick = function () { S.session = this.getAttribute('data-session'); save(); renderSession(); }; });
    qa('[data-nut]').forEach(function (b) { b.onclick = function () { editNutrition(this.getAttribute('data-nut')); }; });

    if (q('localMusic')) q('localMusic').onclick = function () { if (q('audioPick')) q('audioPick').click(); };
    if (q('audioPick')) q('audioPick').onchange = function () { var f = this.files && this.files[0]; if (!f) return; try { q('audio').src = URL.createObjectURL(f); text('musicStatus', f.name); toast('Local music selected'); } catch (e) { toast('Unable to load audio'); } };
    if (q('ytMusic')) q('ytMusic').onclick = function () { window.location.href = 'https://music.youtube.com/'; };
    if (q('spotify')) q('spotify').onclick = function () { window.location.href = 'https://open.spotify.com/'; };
    if (q('autoPlay')) q('autoPlay').onchange = function () { S.autoPlay = this.checked; save(); };
    if (q('autoStop')) q('autoStop').onchange = function () { S.autoStop = this.checked; save(); };
    if (q('musicDuringRest')) q('musicDuringRest').onchange = function () { S.musicDuringRest = this.checked; save(); };
  }

  window.ptHandleBack = function () {
    if (q('workout') && !q('workout').classList.contains('hidden')) { paused = true; toast('Workout paused'); return 'workout'; }
    if (q('modal') && !q('modal').classList.contains('hidden')) { closeModal(); return 'modal'; }
    if (q('drawer') && q('drawer').classList.contains('open')) { closeDrawer(); return 'drawer'; }
    var active = document.querySelector('.page.active');
    if (active && active.getAttribute('data-page') !== 'home') { showPage('home'); return 'home'; }
    return 'exit';
  };

  bindPermanentControls();
  buildWeek();
  render();
  window.__PT_SAFE_QA__ = {
    runtime: window.__PT_RUNTIME__,
    enter: !!q('enter'), admin: !!q('adminCover'), shell: !!q('shell'), navCount: qa('[data-nav]').length
  };
})();
