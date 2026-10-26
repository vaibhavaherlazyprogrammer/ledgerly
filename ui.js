// Everything you SEE: totals, donut chart, list, screen switching.
// This file only draws. It never talks to Supabase.

// ---------- Shared helpers ----------
const CATS = {
  Food:      { icon: '🍜', color: '#e0833a' },
  Transport: { icon: '🚌', color: '#3b82c4' },
  Shopping:  { icon: '🛍️', color: '#b04fa0' },
  Bills:     { icon: '💡', color: '#d4b020' },
  Fun:       { icon: '🎬', color: '#e0566e' },
  Health:    { icon: '💊', color: '#2fa37a' },
  Other:     { icon: '📦', color: '#7a8a96' }
};

const $ = id => document.getElementById(id);

// 45000 -> ₹45,000 (Indian number format)
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');

// Today's date as "2026-10-26", using the user's own time zone
const todayStr = () => {
  const d = new Date();
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// ---------- The UI object ----------
const UI = {

  // Fill the two category dropdowns (runs once)
  fillCategories() {
    const options = Object.keys(CATS).map(c => `<option>${c}</option>`).join('');
    $('category').innerHTML = options;
    $('fcat').innerHTML = '<option value="">All categories</option>' + options;
    $('date').value = todayStr();
  },

  // Switch between the login screen and the app
  showAuth() {
    $('app').hidden = true;
    $('auth').hidden = false;
  },
  showApp(email) {
    $('who').textContent = email;
    $('auth').hidden = true;
    $('app').hidden = false;
  },

  // Login form: "login" or "signup" wording
  setAuthMode(mode) {
    const login = mode === 'login';
    $('authTitle').textContent = login ? 'Welcome back' : 'Create your account';
    $('authBtn').textContent = login ? 'Log in' : 'Create account';
    $('switch').textContent = login ? 'New here? Create an account' : 'Already have an account? Log in';
    $('pw').autocomplete = login ? 'current-password' : 'new-password';
    $('authErr').textContent = '';
  },

  // Small helpers used by app.js
  setAuthError(msg) { $('authErr').textContent = msg; },
  setAuthBusy(busy) { $('authBtn').disabled = busy; },
  setFormError(msg) { $('err').textContent = msg; },

  // Draw the whole dashboard for one month.
  // s = { month, items, budget, search, category }
  render(s, onDelete) {
    const { month, items, budget } = s;

    // Month label, e.g. "October 2026"
    const [y, m] = month.split('-').map(Number);
    $('monthLabel').textContent =
      new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    // Totals + budget bar
    const total = items.reduce((sum, x) => sum + x.amount, 0);
    $('total').textContent = inr(total);
    $('dTotal').textContent = inr(total);
    $('bar').firstElementChild.style.width = Math.min(100, total / budget * 100) + '%';
    $('bar').classList.toggle('over', total > budget);
    $('budgetText').textContent = total > budget
      ? `${inr(total - budget)} over your ${inr(budget)} budget`
      : `${inr(budget - total)} left of ${inr(budget)}`;

    UI.drawDonut(items, total);
    UI.drawList(items, s, onDelete);
  },

  // Donut chart + legend
  drawDonut(items, total) {
    const byCat = {};
    items.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + x.amount; });
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

    let offset = 0;
    const ring = '<circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--field)" stroke-width="4.5"/>';
    const slices = entries.map(([cat, value]) => {
      const pct = value / total * 100;
      const len = Math.max(pct - 0.6, 0.1); // small gap between slices
      const slice = `<circle cx="18" cy="18" r="15.915" fill="none" stroke="${(CATS[cat] || CATS.Other).color}"
        stroke-width="4.5" stroke-dasharray="${len} ${100 - len}" stroke-dashoffset="${-offset}"/>`;
      offset += pct;
      return slice;
    }).join('');
    $('donut').innerHTML = ring + slices;

    $('legend').innerHTML = entries.length
      ? entries.map(([cat, value]) =>
          `<div class="lg"><i style="background:${(CATS[cat] || CATS.Other).color}"></i>
           <span>${cat} <em>${Math.round(value / total * 100)}%</em></span><b>${inr(value)}</b></div>`).join('')
      : '<div class="empty">No spending yet this month. Add your first expense to see the breakdown.</div>';
  },

  // Transaction list (with search + category filter)
  drawList(items, s, onDelete) {
    const q = (s.search || '').trim().toLowerCase();
    const shown = items.filter(x =>
      (!s.category || x.category === s.category) &&
      (!q || `${x.note} ${x.category}`.toLowerCase().includes(q)));

    const list = $('list');
    list.innerHTML = '';
    if (!shown.length) {
      list.innerHTML = `<div class="empty">${items.length ? 'No expenses match your search.' : 'Nothing here yet.'}</div>`;
      return;
    }

    shown.forEach(x => {
      const cat = CATS[x.category] || CATS.Other;
      const day = new Date(x.spent_on + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `
        <div class="dot" style="background:${cat.color}22">${cat.icon}</div>
        <div><b></b><small>${x.category} · ${day}</small></div>
        <div class="amt">${inr(x.amount)}</div>
        <button class="del" aria-label="Delete expense">✕</button>`;
      row.querySelector('b').textContent = x.note || x.category; // textContent = safe from HTML injection
      row.querySelector('.del').onclick = () => onDelete(x.id);
      list.appendChild(row);
    });
  }
};