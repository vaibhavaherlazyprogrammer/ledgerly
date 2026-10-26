// Everything about saving and loading data in Supabase.
// Like auth.js, this file never touches the page.
// Every function returns { data } on success or { error } on failure.

const Store = {

  // Get all expenses for one month, newest first.
  // month looks like "2026-10"
  async loadMonth(month) {
    const [y, m] = month.split('-').map(Number);
    const start = `${month}-01`;
    const next = new Date(y, m, 1); // the 1st of the following month
    const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;

    const { data, error } = await db
      .from('expenses')
      .select('id, amount, category, spent_on, note')
      .gte('spent_on', start)
      .lt('spent_on', end)
      .order('spent_on', { ascending: false })
      .order('id', { ascending: false });

    if (error) return { error: error.message };
    // Postgres sends numbers as text sometimes, so convert the amount.
    return { data: data.map(x => ({ ...x, amount: Number(x.amount) })) };
  },

  // Get every expense (used for the CSV download)
  async loadAll() {
    const { data, error } = await db
      .from('expenses')
      .select('spent_on, category, note, amount')
      .order('spent_on', { ascending: true });
    if (error) return { error: error.message };
    return { data };
  },

  // Save a new expense. user_id is filled in automatically by the database.
  async add({ amount, category, spent_on, note }) {
    const { data, error } = await db
      .from('expenses')
      .insert({ amount, category, spent_on, note })
      .select()
      .single();
    if (error) return { error: error.message };
    return { data: { ...data, amount: Number(data.amount) } };
  },

  // Delete one expense by its id
  async remove(id) {
    const { error } = await db.from('expenses').delete().eq('id', id);
    if (error) return { error: error.message };
    return { data: true };
  },

  // Get this user's monthly budget (20000 if they haven't set one)
  async getBudget() {
    const { data, error } = await db
      .from('settings')
      .select('budget')
      .maybeSingle();
    if (error) return { error: error.message };
    return { data: data ? Number(data.budget) : 20000 };
  },

  // Save the budget (creates the row the first time, updates it after)
  async setBudget(userId, budget) {
    const { error } = await db
      .from('settings')
      .upsert({ user_id: userId, budget }, { onConflict: 'user_id' });
    if (error) return { error: error.message };
    return { data: budget };
  }
};