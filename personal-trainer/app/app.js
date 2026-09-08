const STORAGE_KEY = 'personalTrainerState.v2';

const DEFAULT_STATE = {
  goal: 'general_fitness',
  weeks: 12,
  daysPerWeek: 4,
  months: 3,
  targetTime: '',
  musicSource: 'Local storage',
  workoutActive: false,
  elapsedSeconds: 0,
  selectedDay: '',
  exerciseIndex: 0,
  exerciseFilter: 'All',
  autoStartMusic: true,
  autoStopMusic: true,
  profile: {
    name: '',
    experience: 'Returning',
    equipment: ''
  },
  injury: {
    type: 'Knee',
    side: 'Left',
    pain: 0,
    notes: ''
  },
  nutrition: {
    protein: '',
    hydration: '',
    creatine: '',
    calories: '',
    allergies: [],
    intolerances: [],
    avoid: []
  },
  integrations: {
    garmin: 'not_configured',
    strava: 'not_configured'
  },
  music: {
    localTrackName: '',
    youtubeUrl: '',
    spotifyUrl: ''
  }
};

const exerciseCatalog = [
  {
    name: '45° Leg Press',
    category: ['Lower', 'Rehab'],
    muscles: 'Quads • glutes',
    sets: 3,
    reps: 12,
    rpe: 7,
    rest: '90s',
    cue: 'Controlled knee flexion; feet stay planted; knees track with toes.'
  },
  {
    name: 'Standing Calf Raise',
    category: ['Lower', 'Rehab'],
    muscles: 'Calf • Achilles',
    sets: 3,
    reps: 15,
    rpe: 7,
    rest: '60s',
    cue: 'Rise vertically through the forefoot; pause at the top; lower under control.'
  },
  {
    name: 'Spanish Squat',
    category: ['Lower', 'Rehab'],
    muscles: 'Quads • knee capacity',
    sets: 3,
    reps: 10,
    rpe: 6,
    rest: '75s',
    cue: 'Keep torso upright; sit back into the strap; maintain controlled knee position.'
  },
  {
    name: 'Wrist Extensor Isometric',
    category: ['Upper', 'Rehab'],
    muscles: 'Forearm extensors',
    sets: 4,
    reps: '30s',
    rpe: 5,
    rest: '45s',
    cue: 'Hold neutral wrist alignment without compensating through shoulder or elbow.'
  },
  {
    name: 'Goblet Squat',
    category: ['Lower'],
    muscles: 'Quads • glutes • core',
    sets: 3,
    reps: 12,
    rpe: 7,
    rest: '75s',
    cue: 'Brace; descend under control; keep whole foot loaded; stand tall.'
  },
  {
    name: 'Band Row',
    category: ['Upper'],
    muscles: 'Upper back • biceps',
    sets: 3,
    reps: 12,
    rpe: 7,
    rest: '60s',
    cue: 'Keep ribs stacked; pull elbows back; avoid shrugging.'
  }
];

let state = loadState();
let workoutTimerId = null;
let localAudio = null;
let localObjectUrl = null;

const cover = document.getElementById('cover');
const shell = document.getElementById('shell');
const enterButton = document.getElementById('enterButton');
const drawer = document.getElementById('drawer');
const drawerScrim = document.getElementById('drawerScrim');
const detailDialog = document.getElementById('detailDialog');
const dialogTitle = document.getElementById('dialogTitle');
const dialogBody = document.getElementById('dialogBody');
const dialogEyebrow = document.getElementById('dialogEyebrow');
const workoutButton = document.getElementById('workoutButton');
const musicStatus = document.getElementById('musicStatus');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      ...DEFAULT_STATE,
      ...saved,
      workoutActive: false,
      elapsedSeconds: 0,
      profile: { ...DEFAULT_STATE.profile, ...(saved.profile || {}) },
      injury: { ...DEFAULT_STATE.injury, ...(saved.injury || {}) },
      nutrition: { ...DEFAULT_STATE.nutrition, ...(saved.nutrition || {}) },
      integrations: { ...DEFAULT_STATE.integrations, ...(saved.integrations || {}) },
      music: { ...DEFAULT_STATE.music, ...(saved.music || {}) }
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  const safe = { ...state, workoutActive: false, elapsedSeconds: 0 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function enterApp() {
  cover.classList.remove('active');
  cover.classList.add('hidden');
  shell.classList.remove('hidden');
  showPage('home');
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === page));
  if (page === 'train') {
    renderExercise();
    updateSelectedDaySession();
  }
  if (page === 'nutrition') renderNutrition();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openDrawer() {
  drawer.classList.add('open');
  drawerScrim.classList.add('show');
  drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawerScrim.classList.remove('show');
  drawer.setAttribute('aria-hidden', 'true');
}

function toIsoDay(date) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return `${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,'0')}-${String(local.getDate()).padStart(2,'0')}`;
}

function buildWeekStrip() {
  const strip = document.getElementById('weekStrip');
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  if (!state.selectedDay) state.selectedDay = toIsoDay(now);

  strip.innerHTML = '';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = toIsoDay(date);
    const button = document.createElement('button');
    button.className = `week-day${state.selectedDay === iso ? ' active' : ''}`;
    button.dataset.date = iso;
    button.innerHTML = `<small>${label}</small><strong>${date.getDate()}</strong>`;
    button.addEventListener('click', () => {
      state.selectedDay = iso;
      strip.querySelectorAll('.week-day').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
      updateSelectedDaySession();
      saveState();
    });
    strip.appendChild(button);
  });
}

function updateSelectedDaySession() {
  const summary = document.querySelector('.session-summary');
  if (!summary) return;
  const title = summary.querySelector('h3');
  const tags = summary.querySelector('.session-tags');
  const chosen = state.selectedDay ? new Date(`${state.selectedDay}T12:00:00`) : new Date();
  const weekday = chosen.getDay();

  const schedule = {
    1: { title: 'Lower Body Strength', tags: ['TRAIN', 'RECOVERY'] },
    2: { title: 'Easy Run + Mobility', tags: ['RUNNING', 'RECOVERY'] },
    3: { title: 'Upper Body + Rehab', tags: ['TRAIN', 'RECOVERY'] },
    4: { title: 'Quality Run', tags: ['RUNNING'] },
    5: { title: 'Strength + Mobility', tags: ['TRAIN', 'RECOVERY'] },
    6: { title: 'Long Run / Endurance', tags: ['RUNNING', 'RECOVERY'] },
    0: { title: 'Recovery / Rest', tags: ['RECOVERY'] }
  };
  const session = schedule[weekday];
  title.textContent = session.title;
  tags.innerHTML = session.tags.map(tag => `<span>${tag}</span>`).join('');
}

function setGoal(goal, button) {
  state.goal = goal;
  document.querySelectorAll('[data-goal]').forEach(el => el.classList.remove('selected'));
  button.classList.add('selected');
  const placeholders = {
    general_fitness: 'Optional performance target',
    injury_recovery: 'Optional recovery milestone',
    '5k': 'e.g. 24:30',
    '10k': 'e.g. 49:30',
    half: 'e.g. 1:45:00',
    full: 'e.g. 3:45:00'
  };
  document.getElementById('targetTime').placeholder = placeholders[goal] || 'Target time';
  saveState();
}

function updateTimeline() {
  state.weeks = Number(document.getElementById('weeksRange').value);
  state.daysPerWeek = Number(document.getElementById('daysRange').value);
  document.getElementById('weeksValue').textContent = `${state.weeks} wk`;
  document.getElementById('daysValue').textContent = `${state.daysPerWeek} days`;
  saveState();
}

function formatElapsed(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function ensureWorkoutTimerBadge() {
  const meta = document.querySelector('.exercise-meta');
  if (!meta) return null;
  let badge = document.getElementById('workoutTimer');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'workoutTimer';
    badge.className = 'loop-badge';
    badge.textContent = '00:00';
    meta.appendChild(badge);
  }
  return badge;
}

function startTimer() {
  const badge = ensureWorkoutTimerBadge();
  if (!badge) return;
  clearInterval(workoutTimerId);
  badge.textContent = formatElapsed(state.elapsedSeconds);
  workoutTimerId = setInterval(() => {
    state.elapsedSeconds += 1;
    badge.textContent = formatElapsed(state.elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(workoutTimerId);
  workoutTimerId = null;
}

function startStopWorkout() {
  state.workoutActive = !state.workoutActive;
  if (state.workoutActive) {
    state.elapsedSeconds = 0;
    workoutButton.textContent = 'FINISH WORKOUT';
    workoutButton.classList.add('active-workout');
    startTimer();
    if (document.getElementById('autoStartMusic').checked) startMusicForWorkout();
  } else {
    workoutButton.textContent = 'START WORKOUT';
    workoutButton.classList.remove('active-workout');
    stopTimer();
    if (document.getElementById('autoStopMusic').checked) stopMusicForWorkout();
  }
}

function createLocalFilePicker() {
  let input = document.getElementById('localAudioPicker');
  if (input) return input;
  input = document.createElement('input');
  input.id = 'localAudioPicker';
  input.type = 'file';
  input.accept = 'audio/*';
  input.style.display = 'none';
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    localObjectUrl = URL.createObjectURL(file);
    localAudio = new Audio(localObjectUrl);
    state.music.localTrackName = file.name;
    state.musicSource = 'Local storage';
    musicStatus.textContent = `Local storage • ${file.name}`;
    saveState();
  });
  document.body.appendChild(input);
  return input;
}

function sourceSelected(source, button, shouldConfigure = true) {
  state.musicSource = source;
  document.querySelectorAll('[data-source]').forEach(el => el.classList.remove('active'));
  if (button) button.classList.add('active');
  if (source === 'Local storage') {
    musicStatus.textContent = state.music.localTrackName
      ? `Local storage • ${state.music.localTrackName}`
      : 'Local storage selected';
    if (shouldConfigure && !state.music.localTrackName) createLocalFilePicker().click();
  } else {
    const key = source === 'YouTube' ? 'youtubeUrl' : 'spotifyUrl';
    musicStatus.textContent = state.music[key] ? `${source} playlist ready` : `${source} selected`;
    if (shouldConfigure) showMusicSetup(source);
  }
  saveState();
}

async function startMusicForWorkout() {
  if (state.musicSource === 'Local storage') {
    if (!localAudio) {
      musicStatus.textContent = state.music.localTrackName
        ? 'Local track permission must be re-selected after reload'
        : 'Choose a local track before starting';
      return;
    }
    try {
      await localAudio.play();
      musicStatus.textContent = `Local storage • playing ${state.music.localTrackName}`;
    } catch {
      musicStatus.textContent = 'Local playback blocked by device/browser permission';
    }
    return;
  }

  const key = state.musicSource === 'YouTube' ? 'youtubeUrl' : 'spotifyUrl';
  const url = state.music[key];
  if (!url) {
    musicStatus.textContent = `${state.musicSource} selected • add a playlist link`;
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  musicStatus.textContent = `${state.musicSource} opened externally`;
}

function stopMusicForWorkout() {
  if (state.musicSource === 'Local storage' && localAudio) {
    localAudio.pause();
    localAudio.currentTime = 0;
    musicStatus.textContent = `Local storage • stopped`;
  } else if (state.musicSource === 'Local storage') {
    musicStatus.textContent = 'Local storage • stopped';
  } else {
    musicStatus.textContent = `${state.musicSource} • workout finished (external playback cannot be force-stopped by this web shell)`;
  }
}

function showMusicSetup(source) {
  dialogEyebrow.textContent = 'MUSIC';
  dialogTitle.textContent = `${source} setup`;
  const key = source === 'YouTube' ? 'youtubeUrl' : 'spotifyUrl';
  dialogBody.innerHTML = `
    <div class="dialog-section">
      <label>${source} playlist / music URL
        <input id="externalMusicUrl" type="url" value="${escapeHtml(state.music[key])}" placeholder="Paste ${source} link">
      </label>
      <button type="button" class="primary" id="saveMusicUrl">SAVE SOURCE</button>
      <p>This web prototype can launch the authorized external service. Exact start/stop control inside the final Android app requires the official service SDK/OAuth permissions.</p>
    </div>`;
  closeDrawer();
  if (shell.classList.contains('hidden')) enterApp();
  detailDialog.showModal();
  document.getElementById('saveMusicUrl').addEventListener('click', () => {
    state.music[key] = document.getElementById('externalMusicUrl').value.trim();
    saveState();
    musicStatus.textContent = state.music[key] ? `${source} playlist ready` : `${source} selected`;
    detailDialog.close();
  });
}

function renderExercise() {
  const card = document.querySelector('.exercise-card');
  if (!card) return;
  const exercise = exerciseCatalog[state.exerciseIndex];
  card.querySelector('.exercise-meta .eyebrow').textContent = `EXERCISE ${state.exerciseIndex + 1} OF ${exerciseCatalog.length}`;
  card.querySelector('.exercise-meta h3').textContent = exercise.name;
  const stats = card.querySelectorAll('.exercise-stats strong');
  const values = [exercise.sets, exercise.reps, exercise.rpe, exercise.rest];
  stats.forEach((el, i) => { el.textContent = values[i]; });
  card.querySelector('.motion-note').textContent =
    `${exercise.muscles}. ${exercise.cue} Production motion asset still requires anatomically validated start → end movement and a seamless 6-second loop.`;
}

function changeExercise(delta) {
  state.exerciseIndex = (state.exerciseIndex + delta + exerciseCatalog.length) % exerciseCatalog.length;
  renderExercise();
  saveState();
}

function setupExerciseLibrary() {
  const cards = [...document.querySelectorAll('.list-cards article')];
  const mapping = [0, 1, 2, 3];
  cards.forEach((card, index) => {
    const exercise = exerciseCatalog[mapping[index]];
    card.dataset.categories = exercise.category.join(',');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    const open = () => {
      state.exerciseIndex = mapping[index];
      saveState();
      showPage('train');
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') open();
    });
  });

  document.querySelectorAll('.filter-row .chip').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.textContent.trim();
      state.exerciseFilter = filter;
      document.querySelectorAll('.filter-row .chip').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
      cards.forEach(card => {
        const categories = (card.dataset.categories || '').split(',');
        card.hidden = filter !== 'All' && !categories.includes(filter);
      });
      saveState();
    });
  });
}

function renderNutrition() {
  const cards = [...document.querySelectorAll('.nutrition-grid article')];
  const values = [
    state.nutrition.protein ? `${state.nutrition.protein} g` : '— g',
    state.nutrition.hydration ? `${state.nutrition.hydration} ml` : '— ml',
    state.nutrition.creatine ? `${state.nutrition.creatine} g` : '— g',
    state.nutrition.calories ? `${state.nutrition.calories} kcal` : '— kcal'
  ];
  cards.forEach((card, i) => {
    const strong = card.querySelector('strong');
    if (strong) strong.textContent = values[i];
  });

  const editor = document.querySelector('.tag-editor');
  if (!editor) return;
  editor.innerHTML = `
    ${state.nutrition.allergies.map(x => `<span class="tag">${escapeHtml(x)}</span>`).join('')}
    ${state.nutrition.intolerances.map(x => `<span class="tag">${escapeHtml(x)}</span>`).join('')}
    ${state.nutrition.avoid.map(x => `<span class="tag">${escapeHtml(x)}</span>`).join('')}
    <button type="button" class="tag" data-add-food="allergies">Add allergy +</button>
    <button type="button" class="tag" data-add-food="intolerances">Add intolerance +</button>
    <button type="button" class="tag" data-add-food="avoid">Add avoid food +</button>
  `;
  editor.querySelectorAll('[data-add-food]').forEach(button => {
    button.addEventListener('click', () => {
      const value = prompt(`Add ${button.dataset.addFood === 'avoid' ? 'food to avoid' : button.dataset.addFood.slice(0, -1)}`);
      if (!value || !value.trim()) return;
      state.nutrition[button.dataset.addFood].push(value.trim());
      saveState();
      renderNutrition();
    });
  });
}

function setupNutritionCards() {
  const fields = [
    ['protein', 'Protein target (grams/day)'],
    ['hydration', 'Hydration target (ml/day)'],
    ['creatine', 'Creatine target (grams/day)'],
    ['calories', 'Calorie target (kcal/day)']
  ];
  document.querySelectorAll('.nutrition-grid article').forEach((card, index) => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    const edit = () => {
      const [key, label] = fields[index];
      const value = prompt(label, state.nutrition[key] || '');
      if (value === null) return;
      const cleaned = value.trim();
      if (cleaned && (Number.isNaN(Number(cleaned)) || Number(cleaned) < 0)) {
        alert('Enter a valid non-negative number.');
        return;
      }
      state.nutrition[key] = cleaned;
      saveState();
      renderNutrition();
    };
    card.addEventListener('click', edit);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') edit();
    });
  });
}

function showDialog(kind) {
  const dialogs = {
    profile: {
      eyebrow: 'PROFILE',
      title: 'Training profile',
      body: `<div class="dialog-section">
        <label>Name<input id="profileName" value="${escapeHtml(state.profile.name)}" placeholder="Your name"></label>
        <label>Experience<select id="profileExperience">
          ${['Returning','Beginner','Intermediate','Advanced'].map(x => `<option${state.profile.experience === x ? ' selected' : ''}>${x}</option>`).join('')}
        </select></label>
        <label>Available equipment<textarea id="profileEquipment" placeholder="Gym, bands, dumbbells, treadmill...">${escapeHtml(state.profile.equipment)}</textarea></label>
        <button type="button" class="primary" data-save-dialog="profile">SAVE PROFILE</button>
      </div>`
    },
    goals: {
      eyebrow: 'GOALS',
      title: 'Specify your goal',
      body: `<div class="dialog-section">
        <div class="option-grid">
          <button type="button" data-dialog-goal="injury_recovery">Injury-focused</button>
          <button type="button" data-dialog-goal="general_fitness">General fitness</button>
          <button type="button" data-dialog-goal="5k">5K target</button>
          <button type="button" data-dialog-goal="10k">10K target</button>
          <button type="button" data-dialog-goal="half">Half marathon</button>
          <button type="button" data-dialog-goal="full">Full marathon</button>
        </div>
        <label>Target time<input id="dialogTargetTime" value="${escapeHtml(state.targetTime)}" placeholder="e.g. 45:00 or 3:45:00"></label>
        <button type="button" class="primary" data-save-dialog="goals">SAVE GOAL</button>
      </div>`
    },
    programs: {
      eyebrow: 'PROGRAMS',
      title: 'Program timeline',
      body: `<div class="dialog-section">
        <div class="option-grid">
          <button type="button" data-dialog-months="3">3 months</button>
          <button type="button" data-dialog-months="6">6 months</button>
          <button type="button" data-dialog-months="12">12 months</button>
        </div>
        <label>Custom weeks<input id="dialogWeeks" type="number" min="4" max="52" value="${state.weeks}"></label>
        <label>Training days per week<input id="dialogDays" type="number" min="2" max="7" value="${state.daysPerWeek}"></label>
        <button type="button" class="primary" data-save-dialog="programs">SAVE PROGRAM</button>
      </div>`
    },
    injuries: {
      eyebrow: 'INJURIES',
      title: 'Injury profile',
      body: `<div class="dialog-section">
        <div class="option-grid">
          <button type="button" data-injury-type="Knee">Knee</button>
          <button type="button" data-injury-type="Achilles">Achilles</button>
          <button type="button" data-injury-type="Tennis elbow">Tennis elbow</button>
          <button type="button" data-injury-type="Custom injury">Custom injury</button>
        </div>
        <label>Side<select id="injurySide">
          ${['Left','Right','Both'].map(x => `<option${state.injury.side === x ? ' selected' : ''}>${x}</option>`).join('')}
        </select></label>
        <label>Pain 0–10<input id="injuryPain" type="range" min="0" max="10" value="${state.injury.pain}"><strong id="injuryPainValue">${state.injury.pain}</strong></label>
        <label>Restrictions / notes<textarea id="injuryNotes" placeholder="Movements to avoid, cleared exercises, symptoms...">${escapeHtml(state.injury.notes)}</textarea></label>
        <button type="button" class="primary" data-save-dialog="injuries">SAVE INJURY</button>
      </div>`
    },
    food: {
      eyebrow: 'NUTRITION PROFILE',
      title: 'Food & allergies',
      body: `<div class="dialog-section">
        <label>Allergies<textarea id="foodAllergies" placeholder="Comma separated">${escapeHtml(state.nutrition.allergies.join(', '))}</textarea></label>
        <label>Intolerances<textarea id="foodIntolerances" placeholder="Comma separated">${escapeHtml(state.nutrition.intolerances.join(', '))}</textarea></label>
        <label>Foods to avoid<textarea id="foodAvoid" placeholder="Comma separated">${escapeHtml(state.nutrition.avoid.join(', '))}</textarea></label>
        <button type="button" class="primary" data-save-dialog="food">SAVE FOOD PROFILE</button>
      </div>`
    },
    garmin: integrationDialog('Garmin'),
    strava: integrationDialog('Strava'),
    sources: {
      eyebrow: 'MUSIC',
      title: 'Music sources',
      body: `<div class="dialog-section">
        <div class="option-grid">
          <button type="button" data-dialog-source="Local storage">Local storage</button>
          <button type="button" data-dialog-source="YouTube">YouTube</button>
          <button type="button" data-dialog-source="Spotify">Spotify</button>
        </div>
        <p>Local audio is directly playable in this prototype after selecting a device file. YouTube/Spotify launch externally until official Android SDK/OAuth playback is configured.</p>
      </div>`
    },
    admin: {
      eyebrow: 'ADMIN',
      title: 'Admin editor',
      body: `<div class="dialog-section">
        <p>All admin sections are reachable. The current skeleton stores configuration locally; server-backed multi-user admin publishing is not connected yet.</p>
        <div class="option-grid">
          <button type="button" data-admin-section="Home layout">Home layout</button>
          <button type="button" data-admin-section="Programs">Programs</button>
          <button type="button" data-admin-section="Exercises">Exercises</button>
          <button type="button" data-admin-section="Motion assets">Motion assets</button>
          <button type="button" data-admin-section="Nutrition">Nutrition</button>
          <button type="button" data-admin-section="Integrations">Integrations</button>
        </div>
        <p id="adminSectionStatus">Select a section to inspect/edit in the next production layer.</p>
      </div>`
    }
  };
  const config = dialogs[kind] || dialogs.admin;
  dialogEyebrow.textContent = config.eyebrow;
  dialogTitle.textContent = config.title;
  dialogBody.innerHTML = config.body;
  closeDrawer();
  if (shell.classList.contains('hidden')) enterApp();
  detailDialog.showModal();
  wireDialog(kind);
}

function integrationDialog(service) {
  const key = service.toLowerCase();
  const status = state.integrations[key];
  return {
    eyebrow: 'INTEGRATION',
    title: `Connect ${service}`,
    body: `<div class="dialog-section">
      <p>Status: <strong>${status === 'configured' ? 'configured' : 'not configured'}</strong></p>
      <p>The button is active, but a real ${service} account connection requires official OAuth/client credentials in the Android production build.</p>
      <button type="button" class="primary" data-integration="${key}">
        ${status === 'configured' ? `DISCONNECT ${service.toUpperCase()}` : `CHECK ${service.toUpperCase()} SETUP`}
      </button>
    </div>`
  };
}

function wireDialog(kind) {
  dialogBody.querySelectorAll('[data-dialog-goal]').forEach(button => {
    if (button.dataset.dialogGoal === state.goal) button.classList.add('active');
    button.addEventListener('click', () => {
      state.goal = button.dataset.dialogGoal;
      dialogBody.querySelectorAll('[data-dialog-goal]').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
    });
  });

  dialogBody.querySelectorAll('[data-dialog-months]').forEach(button => {
    if (Number(button.dataset.dialogMonths) === state.months) button.classList.add('active');
    button.addEventListener('click', () => {
      state.months = Number(button.dataset.dialogMonths);
      state.weeks = {3:12, 6:26, 12:52}[state.months];
      const weeks = document.getElementById('dialogWeeks');
      if (weeks) weeks.value = state.weeks;
      dialogBody.querySelectorAll('[data-dialog-months]').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
    });
  });

  dialogBody.querySelectorAll('[data-injury-type]').forEach(button => {
    if (button.dataset.injuryType === state.injury.type) button.classList.add('active');
    button.addEventListener('click', () => {
      state.injury.type = button.dataset.injuryType;
      dialogBody.querySelectorAll('[data-injury-type]').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
    });
  });

  const pain = document.getElementById('injuryPain');
  if (pain) {
    pain.addEventListener('input', () => {
      document.getElementById('injuryPainValue').textContent = pain.value;
    });
  }

  dialogBody.querySelectorAll('[data-dialog-source]').forEach(button => {
    if (button.dataset.dialogSource === state.musicSource) button.classList.add('active');
    button.addEventListener('click', () => {
      detailDialog.close();
      const pageButton = document.querySelector(`[data-source="${button.dataset.dialogSource}"]`);
      showPage('music');
      sourceSelected(button.dataset.dialogSource, pageButton, true);
    });
  });

  dialogBody.querySelectorAll('[data-admin-section]').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('adminSectionStatus').textContent =
        `${button.dataset.adminSection} section selected. Local editor hook is active; production publishing requires backend storage.`;
    });
  });

  const integrationButton = dialogBody.querySelector('[data-integration]');
  if (integrationButton) {
    integrationButton.addEventListener('click', () => {
      const service = integrationButton.dataset.integration;
      alert(`${service === 'garmin' ? 'Garmin' : 'Strava'} OAuth is not configured in this skeleton. Add official client credentials before account linking can be completed.`);
    });
  }

  const save = dialogBody.querySelector('[data-save-dialog]');
  if (save) {
    save.addEventListener('click', () => {
      if (kind === 'profile') {
        state.profile.name = document.getElementById('profileName').value.trim();
        state.profile.experience = document.getElementById('profileExperience').value;
        state.profile.equipment = document.getElementById('profileEquipment').value.trim();
      }
      if (kind === 'goals') {
        state.targetTime = document.getElementById('dialogTargetTime').value.trim();
        document.getElementById('targetTime').value = state.targetTime;
        const goalButton = document.querySelector(`[data-goal="${state.goal}"]`);
        if (goalButton) setGoal(state.goal, goalButton);
      }
      if (kind === 'programs') {
        state.weeks = Math.max(4, Math.min(52, Number(document.getElementById('dialogWeeks').value) || 12));
        state.daysPerWeek = Math.max(2, Math.min(7, Number(document.getElementById('dialogDays').value) || 4));
        document.getElementById('weeksRange').value = state.weeks;
        document.getElementById('daysRange').value = state.daysPerWeek;
        updateTimeline();
      }
      if (kind === 'injuries') {
        state.injury.side = document.getElementById('injurySide').value;
        state.injury.pain = Number(document.getElementById('injuryPain').value);
        state.injury.notes = document.getElementById('injuryNotes').value.trim();
      }
      if (kind === 'food') {
        const split = id => document.getElementById(id).value.split(',').map(x => x.trim()).filter(Boolean);
        state.nutrition.allergies = split('foodAllergies');
        state.nutrition.intolerances = split('foodIntolerances');
        state.nutrition.avoid = split('foodAvoid');
        renderNutrition();
      }
      saveState();
      detailDialog.close();
    });
  }
}

function restoreUiState() {
  document.getElementById('weeksRange').value = state.weeks;
  document.getElementById('daysRange').value = state.daysPerWeek;
  document.getElementById('targetTime').value = state.targetTime;
  document.getElementById('autoStartMusic').checked = state.autoStartMusic;
  document.getElementById('autoStopMusic').checked = state.autoStopMusic;

  document.querySelectorAll('[data-goal]').forEach(button => {
    button.classList.toggle('selected', button.dataset.goal === state.goal);
  });
  document.querySelectorAll('[data-months]').forEach(button => {
    button.classList.toggle('active', Number(button.dataset.months) === state.months);
  });
  document.querySelectorAll('[data-source]').forEach(button => {
    button.classList.toggle('active', button.dataset.source === state.musicSource);
  });

  if (state.musicSource === 'Local storage' && state.music.localTrackName) {
    musicStatus.textContent = `Local storage • ${state.music.localTrackName} (reselect after reload)`;
  } else if (state.musicSource !== 'Local storage') {
    const key = state.musicSource === 'YouTube' ? 'youtubeUrl' : 'spotifyUrl';
    musicStatus.textContent = state.music[key] ? `${state.musicSource} playlist ready` : `${state.musicSource} selected`;
  }

  updateTimeline();
  renderNutrition();
  renderExercise();
}

function auditInteractiveControls() {
  const failures = [];
  const checks = [
    ['enterButton', !!enterButton],
    ['menuButton', !!document.getElementById('menuButton')],
    ['drawerClose', !!document.getElementById('closeDrawer')],
    ['weeksRange', !!document.getElementById('weeksRange')],
    ['daysRange', !!document.getElementById('daysRange')],
    ['targetTime', !!document.getElementById('targetTime')],
    ['workoutButton', !!workoutButton],
    ['musicAutoStart', !!document.getElementById('autoStartMusic')],
    ['musicAutoStop', !!document.getElementById('autoStopMusic')]
  ];
  checks.forEach(([name, ok]) => { if (!ok) failures.push(name); });
  return {
    ok: failures.length === 0,
    failures,
    limitations: [
      'Garmin OAuth not configured',
      'Strava OAuth not configured',
      'YouTube/Spotify exact external playback stop requires official SDK/OAuth',
      'Anatomically validated 6-second motion assets are not yet supplied'
    ]
  };
}

enterButton.addEventListener('click', enterApp);
document.getElementById('menuButton').addEventListener('click', openDrawer);
document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
drawerScrim.addEventListener('click', closeDrawer);
workoutButton.addEventListener('click', startStopWorkout);

document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.nav)));
document.querySelectorAll('[data-goal]').forEach(button => button.addEventListener('click', () => setGoal(button.dataset.goal, button)));
document.querySelectorAll('[data-drawer]').forEach(button => button.addEventListener('click', () => showDialog(button.dataset.drawer)));
document.querySelectorAll('[data-action="admin"]').forEach(button => button.addEventListener('click', () => showDialog('admin')));
document.querySelectorAll('[data-source]').forEach(button => button.addEventListener('click', () => sourceSelected(button.dataset.source, button)));
document.querySelectorAll('[data-months]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-months]').forEach(x => x.classList.remove('active'));
  button.classList.add('active');
  state.months = Number(button.dataset.months);
  state.weeks = {3:12, 6:26, 12:52}[state.months];
  document.getElementById('weeksRange').value = state.weeks;
  updateTimeline();
  saveState();
}));

document.getElementById('weeksRange').addEventListener('input', updateTimeline);
document.getElementById('daysRange').addEventListener('input', updateTimeline);
document.getElementById('targetTime').addEventListener('input', e => {
  state.targetTime = e.target.value;
  saveState();
});
document.getElementById('autoStartMusic').addEventListener('change', e => {
  state.autoStartMusic = e.target.checked;
  saveState();
});
document.getElementById('autoStopMusic').addEventListener('change', e => {
  state.autoStopMusic = e.target.checked;
  saveState();
});

const workoutSecondaryButtons = document.querySelectorAll('.workout-controls .secondary');
if (workoutSecondaryButtons[0]) workoutSecondaryButtons[0].addEventListener('click', () => changeExercise(-1));
if (workoutSecondaryButtons[1]) workoutSecondaryButtons[1].addEventListener('click', () => changeExercise(1));

setupExerciseLibrary();
setupNutritionCards();
buildWeekStrip();
restoreUiState();

window.__PT_QA__ = auditInteractiveControls;
