const state = {
  goal: 'general_fitness',
  weeks: 12,
  daysPerWeek: 4,
  months: 3,
  musicSource: 'Local storage',
  workoutActive: false
};

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

function enterApp() {
  cover.classList.remove('active');
  cover.classList.add('hidden');
  shell.classList.remove('hidden');
  showPage('home');
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === page));
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

function buildWeekStrip() {
  const strip = document.getElementById('weekStrip');
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  strip.innerHTML = '';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const isToday = date.toDateString() === now.toDateString();
    const button = document.createElement('button');
    button.className = `week-day${isToday ? ' active' : ''}`;
    button.innerHTML = `<small>${label}</small><strong>${date.getDate()}</strong>`;
    button.addEventListener('click', () => {
      strip.querySelectorAll('.week-day').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
    });
    strip.appendChild(button);
  });
}

function setGoal(goal, button) {
  state.goal = goal;
  document.querySelectorAll('[data-goal]').forEach(el => el.classList.remove('selected'));
  button.classList.add('selected');
}

function updateTimeline() {
  state.weeks = Number(document.getElementById('weeksRange').value);
  state.daysPerWeek = Number(document.getElementById('daysRange').value);
  document.getElementById('weeksValue').textContent = `${state.weeks} wk`;
  document.getElementById('daysValue').textContent = `${state.daysPerWeek} days`;
}

function startStopWorkout() {
  state.workoutActive = !state.workoutActive;
  const autoStart = document.getElementById('autoStartMusic').checked;
  const autoStop = document.getElementById('autoStopMusic').checked;
  if (state.workoutActive) {
    workoutButton.textContent = 'FINISH WORKOUT';
    workoutButton.classList.add('active-workout');
    if (autoStart) musicStatus.textContent = `${state.musicSource} • playing with workout`;
  } else {
    workoutButton.textContent = 'START WORKOUT';
    workoutButton.classList.remove('active-workout');
    if (autoStop) musicStatus.textContent = `${state.musicSource} • stopped`;
  }
}

function sourceSelected(source, button) {
  state.musicSource = source;
  document.querySelectorAll('[data-source]').forEach(el => el.classList.remove('active'));
  button.classList.add('active');
  musicStatus.textContent = `${source} selected`;
}

function showDialog(kind) {
  const dialogs = {
    profile: {
      eyebrow: 'PROFILE',
      title: 'Training profile',
      body: `<div class="dialog-section"><label>Name<input placeholder="Your name"></label><label>Experience<select><option>Returning</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Available equipment<textarea placeholder="Gym, bands, dumbbells, treadmill..."></textarea></label></div>`
    },
    goals: {
      eyebrow: 'GOALS',
      title: 'Specify your goal',
      body: `<div class="dialog-section"><div class="option-grid"><button>Injury-focused</button><button>General fitness</button><button>5K target</button><button>10K target</button><button>Half marathon</button><button>Full marathon</button></div><label>Target time<input placeholder="e.g. 45:00 or 3:45:00"></label><label>Custom goal<textarea placeholder="Describe the result you want"></textarea></label></div>`
    },
    programs: {
      eyebrow: 'PROGRAMS',
      title: 'Program timeline',
      body: `<div class="dialog-section"><div class="option-grid"><button>3 months</button><button>6 months</button><button>12 months</button><button>Custom weeks</button></div><label>Training days per week<input type="number" min="2" max="7" value="4"></label></div>`
    },
    injuries: {
      eyebrow: 'INJURIES',
      title: 'Injury profile',
      body: `<div class="dialog-section"><div class="option-grid"><button>Knee</button><button>Achilles</button><button>Tennis elbow</button><button>Custom injury</button></div><label>Side<select><option>Left</option><option>Right</option><option>Both</option></select></label><label>Pain 0–10<input type="number" min="0" max="10" value="0"></label><label>Restrictions / notes<textarea placeholder="Movements to avoid, cleared exercises, symptoms..."></textarea></label></div>`
    },
    food: {
      eyebrow: 'NUTRITION PROFILE',
      title: 'Food & allergies',
      body: `<div class="dialog-section"><label>Allergies<textarea placeholder="Add food allergies"></textarea></label><label>Intolerances<textarea placeholder="Add intolerances"></textarea></label><label>Foods to avoid<textarea placeholder="Add foods you do not eat"></textarea></label></div>`
    },
    garmin: {
      eyebrow: 'INTEGRATION',
      title: 'Connect Garmin',
      body: `<div class="dialog-section"><p>Garmin connection module is reserved in the skeleton. Production will add authorized sign-in, sync status, activity data and supported recovery/training fields.</p><button class="primary" style="width:100%" disabled>CONNECT GARMIN — NEXT PHASE</button></div>`
    },
    strava: {
      eyebrow: 'INTEGRATION',
      title: 'Connect Strava',
      body: `<div class="dialog-section"><p>Strava connection module is reserved in the skeleton. Production will add OAuth, run history, pace, distance and supported training data.</p><button class="primary" style="width:100%" disabled>CONNECT STRAVA — NEXT PHASE</button></div>`
    },
    sources: {
      eyebrow: 'MUSIC',
      title: 'Music sources',
      body: `<div class="dialog-section"><div class="option-grid"><button>Local storage</button><button>YouTube</button><button>Spotify</button></div><p>External services will use their authorized playback/launch flows. Local storage can be handled directly by the Android app.</p></div>`
    },
    admin: {
      eyebrow: 'ADMIN',
      title: 'Admin editor',
      body: `<div class="dialog-section"><p>Admin controls are reserved for app configuration: artwork, labels, navigation, program presets, injury presets, goal types, exercise metadata, motion assets, nutrition categories, integrations and music-source visibility.</p><div class="option-grid"><button>Home layout</button><button>Programs</button><button>Exercises</button><button>Motion assets</button><button>Nutrition</button><button>Integrations</button></div></div>`
    }
  };
  const config = dialogs[kind] || dialogs.admin;
  dialogEyebrow.textContent = config.eyebrow;
  dialogTitle.textContent = config.title;
  dialogBody.innerHTML = config.body;
  closeDrawer();
  detailDialog.showModal();
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
  const mappedWeeks = {3:12, 6:26, 12:52}[state.months];
  document.getElementById('weeksRange').value = mappedWeeks;
  updateTimeline();
}));

document.getElementById('weeksRange').addEventListener('input', updateTimeline);
document.getElementById('daysRange').addEventListener('input', updateTimeline);

buildWeekStrip();
updateTimeline();