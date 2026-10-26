// The "brain": listens to buttons, talks to Auth + Store, tells UI what to draw.

// ---------- What the app currently remembers ----------
const state = {
  user: null,        // the logged-in user
  month: '',         // month on screen, like "2026-10"
  items: [],         // that month's expenses
  budget: 20000,
  search: '',
  category: ''
};

let authMode = 'login';   // "login" or "signup"
let loadCounter = 0;      // stops slow old requests from overwriting newer ones

// ---------- Loading + drawing ----------
async function refresh() {
  const thisLoad = ++loadCounter;
  const { data, error } = await Store.loadMonth(state.month);
  if (thisLoad !== loadCounter) return;      // user already moved to another month
  if (error) { UI.setFormError('Could not load expenses: ' + error); return; }
  state.items = data;
  UI.render(state, deleteExpense);
}

// Called after login (or when the page opens and a session already exists)
async function enterApp(user) {
  state.user = user;
  state.month = todayStr().slice(0, 7);
  state.search = ''; state.category = '';
  $('search').value = ''; $('fcat').value = '';
  UI.showApp(user.email);

  const b = await Store.getBudget();
  if (!b.error) state.budget = b.data;
  await refresh();
}

// ---------- Login / sign up ----------
$('switch').onclick = () => {
  authMode = authMode === 'login' ? 'signup' : 'login';
  UI.setAuthMode(authMode);
};

$('authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('email').value.trim().toLowerCase();
  const pw = $('pw').value;

  if (!/^\S+@\S+\.\S+$/.test(email)) return UI.setAuthError('Enter a valid email address.');
  if (pw.length < 6) return UI.setAuthError('Password must be at least 6 characters.');

  UI.setAuthError('');
  UI.setAuthBusy(true);

  try {
    const result = authMode === 'signup' ? await Auth.signUp(email, pw) : await Auth.logIn(email, pw);

    if (result.error) return UI.setAuthError(result.error);

    if (result.needsConfirm) {
      authMode = 'login';
      UI.setAuthMode('login');
      UI.setAuthError('Account created. Check your inbox to confirm your email, then log in.');
      return;
    }

    $('pw').value = '';
    await enterApp(result.user);
  } catch (err) {
    console.error(err);
    UI.setAuthError('Something failed: ' + (err.message || err));
  } finally {
    UI.setAuthBusy(false);
  }
});

$('logout').onclick = async () => {
  await Auth.logOut();
  state.user = null; state.items = [];
  $('email').value = ''; $('pw').value = '';
  authMode = 'login';
  UI.setAuthMode('login');
  UI.showAuth();
};

// ---------- Month arrows ----------
function shiftMonth(delta) {
  const [y, m] = state.month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  state.month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  refresh();
}
$('prev').onclick = () => shiftMonth(-1);
$('next').onclick = () => shiftMonth(1);

// ---------- Add an expense ----------
$('form').addEventListener('submit', async e => {
  e.preventDefault();
  const amount = parseFloat($('amount').value);
  const spent_on = $('date').value;

  if (!(amount > 0)) return UI.setFormError('Enter an amount greater than 0.');
  if (!spent_on) return UI.setFormError('Pick a date.');
  UI.setFormError('');

  const btn = e.submitter;
  if (btn) btn.disabled = true;
  const { error } = await Store.add({
    amount,
    category: $('category').value,
    spent_on,
    note: $('note').value.trim()
  });
  if (btn) btn.disabled = false;

  if (error) return UI.setFormError('Could not save: ' + error);

  state.month = spent_on.slice(0, 7);   // jump to the month of the new expense
  $('amount').value = '';
  $('note').value = '';
  await refresh();
  $('amount').focus();
});

// ---------- Delete ----------
async function deleteExpense(id) {
  const { error } = await Store.remove(id);
  if (error) return UI.setFormError('Could not delete: ' + error);
  await refresh();
}

// ---------- Budget ----------
$('editBudget').onclick = async () => {
  const input = prompt('Monthly budget in ₹', state.budget);
  if (input === null) return;               // pressed Cancel
  const value = parseFloat(input);
  if (!(value > 0)) return UI.setFormError('Budget must be a number greater than 0.');

  const { error } = await Store.setBudget(state.user.id, value);
  if (error) return UI.setFormError('Could not save budget: ' + error);
  state.budget = value;
  UI.render(state, deleteExpense);
};

// ---------- Search + category filter (no server call needed) ----------
$('search').oninput = () => { state.search = $('search').value; UI.render(state, deleteExpense); };
$('fcat').onchange = () => { state.category = $('fcat').value; UI.render(state, deleteExpense); };

// ---------- Download CSV ----------
$('export').onclick = async () => {
  const { data, error } = await Store.loadAll();
  if (error) return UI.setFormError('Could not export: ' + error);

  const rows = [['Date', 'Category', 'Note', 'Amount']].concat(
    data.map(x => [x.spent_on, x.category, '"' + (x.note || '').replace(/"/g, '""') + '"', x.amount])
  );
  const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'expenses.csv'; a.click();
  URL.revokeObjectURL(url);
};

// ---------- Start ----------
(async function start() {
  UI.fillCategories();
  UI.setAuthMode('login');

  const user = await Auth.currentUser();   // already logged in from last time?
  if (user) enterApp(user);
  else UI.showAuth();
})();       