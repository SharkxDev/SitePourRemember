// ─── ROBLOX KB — MAIN APP ─────────────────────────────────────
const API = '';  // Empty = same origin (Railway)

const ROBLOX_LOCATIONS = [
  'ServerScriptService', 'ReplicatedStorage', 'ReplicatedFirst',
  'StarterGui', 'StarterPlayer', 'StarterPack',
  'Workspace', 'ServerStorage', 'Teams',
  'SoundService', 'TextChatService', 'Players'
];

const SCRIPT_TYPES = ['Script', 'LocalScript', 'ModuleScript', 'BindableEvent', 'RemoteEvent', 'RemoteFunction'];

const COLORS = [
  '#00d4ff','#c8ff00','#ff6b35','#a855f7',
  '#ff3366','#10b981','#f59e0b','#06b6d4',
  '#8b5cf6','#ec4899','#14b8a6','#f97316'
];

const ICONS = ['📁','⚙️','🏃','🖥️','💡','🔧','🔗','🎮','📡','🛡️','💥','🌍'];

// ─── STATE ────────────────────────────────────────────────────
const state = {
  categories: [],
  entries: [],
  activeCat: null,
  activeFilter: 'all', // all | note | script | example
  editingEntry: null,   // null = new
  searchQ: '',
  selectedColor: COLORS[0],
  selectedIcon: ICONS[0],
  catEditId: null,
  loading: false
};

// ─── API HELPERS ──────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── LOAD DATA ────────────────────────────────────────────────
async function loadAll() {
  try {
    const [cats, stats] = await Promise.all([
      apiFetch('/api/categories'),
      apiFetch('/api/stats')
    ]);
    state.categories = cats;
    renderSidebar();
    renderStats(stats);
  } catch (e) {
    toast('Erreur connexion serveur', true);
  }
}

async function loadEntries(catId) {
  showLoading();
  try {
    const url = catId ? `/api/entries?category_id=${catId}` : '/api/entries';
    state.entries = await apiFetch(url);
    renderEntries();
  } catch (e) {
    toast('Erreur chargement notes', true);
  }
}

async function loadStats() {
  try {
    const stats = await apiFetch('/api/stats');
    renderStats(stats);
  } catch(e) {}
}

// ─── SIDEBAR ──────────────────────────────────────────────────
function renderSidebar() {
  const list = document.getElementById('cat-list');
  const allActive = state.activeCat === null;

  let html = `
    <div class="cat-item ${allActive ? 'active' : ''}" onclick="selectAllEntries()">
      <span class="cat-icon">🌐</span>
      <div class="cat-info">
        <div class="cat-name">Toutes les notes</div>
      </div>
    </div>
  `;

  html += state.categories.map(cat => {
    const active = state.activeCat === cat.id;
    return `
      <div class="cat-item ${active ? 'active' : ''}" onclick="selectCat('${cat.id}')">
        <span class="cat-dot" style="color:${cat.color};background:${cat.color}"></span>
        <span class="cat-icon">${cat.icon || '📁'}</span>
        <div class="cat-info">
          <div class="cat-name">${esc(cat.name)}</div>
          <div class="cat-count">${cat.description ? esc(cat.description.substring(0,25)) : ''}</div>
        </div>
        <button class="cat-del" onclick="event.stopPropagation();confirmDeleteCat('${cat.id}')" title="Supprimer">✕</button>
      </div>
    `;
  }).join('');

  list.innerHTML = html;
}

function renderStats(stats) {
  document.getElementById('stat-cats').textContent = stats.categories || 0;
  document.getElementById('stat-total').textContent = stats.total || 0;
  document.getElementById('stat-scripts').textContent = stats.scripts || 0;
  document.getElementById('stat-examples').textContent = stats.examples || 0;
}

// ─── SELECT CAT ───────────────────────────────────────────────
function selectCat(id) {
  state.activeCat = id;
  state.activeFilter = 'all';
  const cat = state.categories.find(c => c.id === id);
  document.getElementById('topbar-title').textContent = cat ? cat.name.toUpperCase() : '';
  document.getElementById('btn-new-entry').style.display = '';
  renderSidebar();
  showMainView();
  loadEntries(id);
  updateFilterPills();
}

function selectAllEntries() {
  state.activeCat = null;
  state.activeFilter = 'all';
  document.getElementById('topbar-title').textContent = 'TOUTES LES NOTES';
  document.getElementById('btn-new-entry').style.display = '';
  renderSidebar();
  showMainView();
  loadEntries(null);
  updateFilterPills();
}

function updateFilterPills() {
  document.querySelectorAll('.pill').forEach(p => {
    p.className = 'pill';
    const f = p.dataset.filter;
    if (f === state.activeFilter) p.classList.add(`active-${f}`);
  });
}

// ─── VIEWS ────────────────────────────────────────────────────
function showMainView() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('entries-grid').style.display = 'grid';
  document.getElementById('editor-panel').style.display = 'none';
}

function showEditor() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('entries-grid').style.display = 'none';
  document.getElementById('editor-panel').style.display = 'flex';
}

function showLoading() {
  document.getElementById('entries-grid').innerHTML = `<div class="loading" style="grid-column:1/-1"><div class="spin"></div>CHARGEMENT...</div>`;
}

// ─── RENDER ENTRIES ───────────────────────────────────────────
function renderEntries() {
  const grid = document.getElementById('entries-grid');
  let entries = state.entries;

  if (state.activeFilter !== 'all') {
    entries = entries.filter(e => e.entry_type === state.activeFilter);
  }
  if (state.searchQ) {
    const q = state.searchQ.toLowerCase();
    entries = entries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.note||'').toLowerCase().includes(q) ||
      (e.script_code||'').toLowerCase().includes(q) ||
      (e.tags||'').toLowerCase().includes(q)
    );
  }

  if (entries.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="e-icon">📭</div><p>Aucune entrée ici.<br>Clique sur <strong>+ NOUVELLE ENTRÉE</strong> pour commencer.</p></div>`;
    return;
  }

  grid.innerHTML = entries.map((e, i) => {
    const cat = state.categories.find(c => c.id === e.category_id);
    const color = cat ? cat.color : 'var(--accent)';
    const typeColors = { note: 'var(--note)', script: 'var(--script)', example: 'var(--example)' };
    const typeColor = typeColors[e.entry_type] || 'var(--accent)';
    const date = new Date(e.updated_at).toLocaleDateString('fr-FR');
    const tags = (e.tags||'').split(',').filter(t=>t.trim()).map(t=>`<span class="tag">${esc(t.trim())}</span>`).join('');

    let preview = '';
    if (e.script_code) {
      preview = `<div class="entry-code-preview">${esc(e.script_code.substring(0,200))}</div>`;
    } else if (e.note) {
      preview = `<div class="entry-note-preview">${esc(e.note.substring(0,120))}</div>`;
    }

    const location = e.script_location ? `
      <span class="entry-location">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>
        ${esc(e.script_location)}${e.script_type ? ` › ${esc(e.script_type)}` : ''}
      </span>
    ` : '';

    return `
      <div class="entry-card" style="--entry-color:${color}; animation-delay:${i*0.05}s" onclick="openEntry('${e.id}')">
        <div class="card-hover-actions">
          <button class="icon-btn" onclick="event.stopPropagation();openEntry('${e.id}')" title="Éditer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn del" onclick="event.stopPropagation();confirmDeleteEntry('${e.id}')" title="Supprimer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/></svg>
          </button>
        </div>
        <div class="entry-header">
          <span class="entry-type-badge badge-${e.entry_type}">${e.entry_type.toUpperCase()}</span>
          <div class="entry-title">${esc(e.title)}</div>
        </div>
        ${preview}
        <div class="entry-footer">
          ${location}
          <div class="entry-tags">${tags}</div>
          <span class="entry-date">${date}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ─── FILTER ───────────────────────────────────────────────────
function setFilter(f) {
  state.activeFilter = f;
  updateFilterPills();
  renderEntries();
}

// ─── SEARCH ───────────────────────────────────────────────────
let searchTimer;
function handleSearch(q) {
  state.searchQ = q;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (q.length > 1) {
      showLoading();
      try {
        state.entries = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
        showMainView();
        renderEntries();
      } catch(e) {}
    } else if (q === '') {
      loadEntries(state.activeCat);
    }
  }, 300);
}

// ─── NEW / OPEN ENTRY ─────────────────────────────────────────
function newEntry() {
  if (!state.activeCat) return toast('Sélectionne une catégorie d\'abord', true);
  state.editingEntry = null;
  resetEditorForm();
  showEditor();
  document.getElementById('editor-title-input').focus();
}

async function openEntry(id) {
  try {
    const entry = await apiFetch(`/api/entries/${id}`);
    state.editingEntry = entry;
    fillEditorForm(entry);
    showEditor();
  } catch(e) {
    toast('Erreur chargement', true);
  }
}

function resetEditorForm() {
  document.getElementById('editor-title-input').value = '';
  document.getElementById('editor-note').value = '';
  document.getElementById('editor-code').value = '';
  document.getElementById('editor-tags').value = '';
  document.getElementById('editor-loc-input').value = '';
  document.getElementById('editor-script-type').value = '';
  setEditorType('note');
  document.querySelectorAll('.loc-chip').forEach(c => c.classList.remove('active'));
  document.getElementById('code-section').style.display = 'none';
  document.getElementById('location-section').style.display = 'none';
}

function fillEditorForm(entry) {
  document.getElementById('editor-title-input').value = entry.title || '';
  document.getElementById('editor-note').value = entry.note || '';
  document.getElementById('editor-code').value = entry.script_code || '';
  document.getElementById('editor-tags').value = entry.tags || '';
  document.getElementById('editor-loc-input').value = entry.script_location || '';
  document.getElementById('editor-script-type').value = entry.script_type || '';
  setEditorType(entry.entry_type || 'note');
  // Highlight active location chip
  document.querySelectorAll('.loc-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.loc === entry.script_location);
  });
}

function setEditorType(type) {
  document.querySelectorAll('.type-option').forEach(el => {
    el.className = `type-option ${el.dataset.type === type ? `selected-${type}` : ''}`;
  });
  document.getElementById('editor-type-hidden').value = type;
  const isScript = type === 'script' || type === 'example';
  document.getElementById('code-section').style.display = isScript ? '' : 'none';
  document.getElementById('location-section').style.display = isScript ? '' : 'none';
}

function pickLocation(chip) {
  const loc = chip.dataset.loc;
  document.querySelectorAll('.loc-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  document.getElementById('editor-loc-input').value = loc;
}

// ─── SAVE ENTRY ───────────────────────────────────────────────
async function saveEntry() {
  const title = document.getElementById('editor-title-input').value.trim();
  if (!title) return toast('Donne un titre à ta note', true);

  const payload = {
    category_id: state.activeCat,
    title,
    entry_type: document.getElementById('editor-type-hidden').value,
    note: document.getElementById('editor-note').value,
    script_code: document.getElementById('editor-code').value,
    script_location: document.getElementById('editor-loc-input').value,
    script_type: document.getElementById('editor-script-type').value,
    tags: document.getElementById('editor-tags').value
  };

  try {
    if (state.editingEntry) {
      await apiFetch(`/api/entries/${state.editingEntry.id}`, {
        method: 'PUT', body: JSON.stringify(payload)
      });
      toast('Note mise à jour ✓');
    } else {
      await apiFetch('/api/entries', {
        method: 'POST', body: JSON.stringify(payload)
      });
      toast('Note sauvegardée ✓');
    }
    loadStats();
    backToList();
    loadEntries(state.activeCat);
  } catch(e) {
    toast('Erreur sauvegarde : ' + e.message, true);
  }
}

function backToList() {
  state.editingEntry = null;
  showMainView();
  renderEntries();
}

// ─── DELETE ENTRY ─────────────────────────────────────────────
function confirmDeleteEntry(id) {
  if (!confirm('Supprimer cette entrée ?')) return;
  deleteEntry(id);
}

async function deleteEntry(id) {
  try {
    await apiFetch(`/api/entries/${id}`, { method: 'DELETE' });
    state.entries = state.entries.filter(e => e.id !== id);
    toast('Entrée supprimée');
    renderEntries();
    loadStats();
  } catch(e) {
    toast('Erreur suppression', true);
  }
}

// ─── CATEGORY MODAL ──────────────────────────────────────────
function openNewCatModal() {
  state.catEditId = null;
  state.selectedColor = COLORS[0];
  state.selectedIcon = ICONS[0];
  document.getElementById('modal-cat-title').textContent = 'NOUVELLE CATÉGORIE';
  document.getElementById('cat-name-input').value = '';
  document.getElementById('cat-desc-input').value = '';
  buildColorPicker();
  buildIconPicker();
  document.getElementById('modal-cat').classList.add('open');
  setTimeout(() => document.getElementById('cat-name-input').focus(), 100);
}

function buildColorPicker() {
  document.getElementById('color-row').innerHTML = COLORS.map((c, i) => `
    <div class="color-swatch ${i===0?'selected':''}" style="background:${c}"
      onclick="selectColor('${c}',this)"></div>
  `).join('');
}

function buildIconPicker() {
  document.getElementById('icon-row').innerHTML = ICONS.map((ic, i) => `
    <div class="color-swatch ${i===0?'selected':''}" style="background:var(--surface2);font-size:16px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border)"
      onclick="selectIcon('${ic}',this)">${ic}</div>
  `).join('');
}

function selectColor(c, el) {
  state.selectedColor = c;
  document.querySelectorAll('#color-row .color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}

function selectIcon(ic, el) {
  state.selectedIcon = ic;
  document.querySelectorAll('#icon-row .color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

async function saveCategory() {
  const name = document.getElementById('cat-name-input').value.trim();
  if (!name) return toast('Nomme ta catégorie', true);

  const payload = {
    name,
    color: state.selectedColor,
    icon: state.selectedIcon,
    description: document.getElementById('cat-desc-input').value.trim()
  };

  try {
    let cat;
    if (state.catEditId) {
      cat = await apiFetch(`/api/categories/${state.catEditId}`, {
        method: 'PUT', body: JSON.stringify(payload)
      });
    } else {
      cat = await apiFetch('/api/categories', {
        method: 'POST', body: JSON.stringify(payload)
      });
      state.categories.push(cat);
    }
    closeModals();
    await loadAll();
    selectCat(cat.id);
    toast('Catégorie créée !');
  } catch(e) {
    toast('Erreur : ' + e.message, true);
  }
}

function confirmDeleteCat(id) {
  if (!confirm('Supprimer cette catégorie ET toutes ses notes ?')) return;
  deleteCat(id);
}

async function deleteCat(id) {
  try {
    await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    state.categories = state.categories.filter(c => c.id !== id);
    if (state.activeCat === id) {
      state.activeCat = null;
      document.getElementById('welcome-screen').style.display = 'flex';
      document.getElementById('entries-grid').style.display = 'none';
      document.getElementById('editor-panel').style.display = 'none';
    }
    renderSidebar();
    loadStats();
    toast('Catégorie supprimée');
  } catch(e) {
    toast('Erreur suppression', true);
  }
}

// ─── TOAST ────────────────────────────────────────────────────
let toastTimer;
function toast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = isError ? 'error show' : 'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = '', 2500);
}

// ─── UTILS ────────────────────────────────────────────────────
function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── KEYBOARD ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey||e.metaKey) && e.key==='s') {
    e.preventDefault();
    if (document.getElementById('editor-panel').style.display !== 'none') saveEntry();
  }
  if (e.key === 'Escape') {
    closeModals();
    if (document.getElementById('editor-panel').style.display !== 'none') backToList();
  }
});

document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) closeModals(); });
});

// ─── INIT ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadAll();
});
