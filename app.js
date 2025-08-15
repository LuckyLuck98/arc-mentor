// ARC Mentor front‑end logic

// Replace these placeholders via secrets during deployment. If the placeholders
// remain (contain '[[', the application will operate in mock mode.
const WEBHOOK_N8N = '[[WEBHOOK_URL_N8N]]';
const WEBHOOK_MAKE = '[[WEBHOOK_URL_MAKE]]' || WEBHOOK_N8N;

// Application state. This is persisted to localStorage so that the user can
// refresh the page and keep progress. Missions include an id, title, xp,
// gold and status (planned/done/fail/etc). Stats track HP, XP, XP goal,
// gold and streak.
const appState = {
  user: null,
  missions: [],
  stats: { hp: 100, xp: 0, xpGoal: 100, gold: 0, streak: 0 },
  freeSlots: [],
  penalties: [],
  skills: [],
  recentFails: []
};

// Save state to localStorage
function save() {
  localStorage.setItem('arc_state', JSON.stringify(appState));
}

// Load state from localStorage
function load() {
  const stored = localStorage.getItem('arc_state');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      Object.assign(appState, parsed);
    } catch (err) {
      console.error('Failed to parse stored state', err);
    }
  }
}

// Show only the view corresponding to `name` and hide all others
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${name}`);
  if (target) target.classList.add('active');
}

// Render stats onto the dashboard
function renderStats() {
  document.getElementById('stat-hp').textContent = appState.stats.hp;
  document.getElementById('stat-xp').textContent = appState.stats.xp;
  document.getElementById('stat-xpGoal').textContent = appState.stats.xpGoal;
  document.getElementById('stat-gold').textContent = appState.stats.gold;
  document.getElementById('stat-streak').textContent = appState.stats.streak;
}

// Render missions list
function renderMissions() {
  const list = document.getElementById('missions-list');
  list.innerHTML = '';
  appState.missions.forEach(m => {
    const li = document.createElement('li');
    li.textContent = `${m.title} (${m.status})`;
    // Buttons to mark done or fail
    const btnDone = document.createElement('button');
    btnDone.textContent = 'Done';
    btnDone.onclick = () => updateMission(m.id, 'done');
    const btnFail = document.createElement('button');
    btnFail.textContent = 'Fail';
    btnFail.onclick = () => updateMission(m.id, 'fail');
    li.appendChild(btnDone);
    li.appendChild(btnFail);
    list.appendChild(li);
  });
}

// Add a chat message to the coach window
function addChatMessage(text, who) {
  const chat = document.getElementById('coach-chat');
  const div = document.createElement('div');
  div.className = `chat-message ${who}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// POST JSON helper. Returns parsed JSON or throws.
async function postJSON(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

// Sync calendar missions from backend
async function checkCalendar() {
  const body = {
    userId: appState.user || 'guest',
    // fetch next 7 days by default
    dateFrom: new Date().toISOString(),
    dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  const resultArea = document.getElementById('calendar-result');
  try {
    const data = await postJSON(`${WEBHOOK_N8N}/calendar-sync`, body);
    appState.missions = data.missions || [];
    if (data.stats) {
      Object.assign(appState.stats, data.stats);
    }
    renderMissions();
    renderStats();
    save();
    resultArea.textContent = 'Calendar synced successfully.';
  } catch (err) {
    console.error(err);
    resultArea.textContent = 'Failed to sync calendar.';
  }
}

// Create calendar events from missions
async function createEvents() {
  const body = {
    userId: appState.user || 'guest',
    quests: appState.missions.map(m => ({ id: m.id, title: m.title, start: m.start_time, end: m.end_time }))
  };
  const resultArea = document.getElementById('calendar-result');
  try {
    await postJSON(`${WEBHOOK_N8N}/create-events`, body);
    resultArea.textContent = 'Events created successfully.';
  } catch (err) {
    console.error(err);
    resultArea.textContent = 'Failed to create events.';
  }
}

// Send mission update to backend
async function updateMission(id, status) {
  try {
    await postJSON(`${WEBHOOK_N8N}/update`, { missionId: id, status });
    const mission = appState.missions.find(m => m.id === id);
    if (mission) {
      mission.status = status;
    }
    renderMissions();
    save();
  } catch (err) {
    console.error(err);
    alert('Failed to update mission');
  }
}

// Ask the coach for guidance
async function askCoach() {
  const textarea = document.getElementById('coach-input');
  const prompt = textarea.value.trim();
  if (!prompt) return;
  addChatMessage(prompt, 'user');
  textarea.value = '';
  try {
    const body = {
      prompt,
      stats: appState.stats,
      freeSlots: appState.freeSlots,
      recentFails: appState.recentFails
    };
    const data = await postJSON(`${WEBHOOK_MAKE}/coach`, body);
    // Add AI message
    addChatMessage(data.message || 'No response', 'ai');
    // Incorporate side quests into missions
    if (Array.isArray(data.sideQuests)) {
      data.sideQuests.forEach(q => {
        appState.missions.push({
          id: q.id || Date.now(),
          title: q.title,
          xp: q.xp || 0,
          gold: q.gold || 0,
          status: 'planned'
        });
      });
      renderMissions();
    }
    // Add penalties
    if (Array.isArray(data.penalties)) {
      appState.penalties.push(...data.penalties);
    }
    save();
  } catch (err) {
    console.error(err);
    addChatMessage('Failed to contact coach.', 'ai');
  }
}

// Initialise the UI and state
function init() {
  load();
  renderStats();
  renderMissions();
  // Set user id input
  document.getElementById('input-user').value = appState.user || '';
}

// Attach event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      showView(view);
    });
  });
  // Calendar buttons
  document.getElementById('btn-check-calendar').addEventListener('click', checkCalendar);
  document.getElementById('btn-create-events').addEventListener('click', createEvents);
  // Coach
  document.getElementById('btn-coach-send').addEventListener('click', askCoach);
  // Set user button
  document.getElementById('btn-set-user').addEventListener('click', () => {
    const idVal = document.getElementById('input-user').value.trim();
    appState.user = idVal || null;
    save();
  });
  init();
});

// Mock mode: if WEBHOOK_N8N still contains '[[' then intercept fetch and return fake data
if (WEBHOOK_N8N.includes('[[')) {
  window.fetch = async (url, opts = {}) => {
    const { pathname } = new URL(url, window.location.origin);
    const body = opts.body ? JSON.parse(opts.body) : {};
    if (pathname.endsWith('/calendar-sync')) {
      return new Response(JSON.stringify({
        missions: [
          { id: 1, title: 'Mock Quest 1', xp: 10, gold: 5, status: 'planned' },
          { id: 2, title: 'Mock Quest 2', xp: 20, gold: 10, status: 'planned' }
        ],
        stats: { hp: 100, xp: 0, xpGoal: 100, gold: 0, streak: 0 }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (pathname.endsWith('/create-events')) {
      return new Response(JSON.stringify({ created: body.quests || [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (pathname.endsWith('/update')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (pathname.endsWith('/coach')) {
      return new Response(JSON.stringify({
        message: 'Here are some suggestions.',
        sideQuests: [ { id: Date.now(), title: 'Mock Side Quest', xp: 5, gold: 2 } ],
        penalties: []
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Unknown mock endpoint' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  };
}
