// Everything about accounts: sign up, log in, log out.
// This file only talks to Supabase. It never touches the page.
// app.js (step 8) calls these functions.

const Auth = {

  // Create a new account
  async signUp(email, password) {
    const { data, error } = await db.auth.signUp({ email, password });
    if (error) return { error: Auth.friendly(error) };

    // If "Confirm email" is ON in Supabase, there is no session yet.
    if (!data.session) {
      return { needsConfirm: true };
    }
    return { user: data.user };
  },

  // Log in with an existing account
  async logIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) return { error: Auth.friendly(error) };
    return { user: data.user };
  },

  // Log out
  async logOut() {
    await db.auth.signOut();
  },

  // Is someone already logged in? (Supabase remembers them in the browser,
  // so this stays logged in until they press Log out.)
  async currentUser() {
    const { data } = await db.auth.getSession();
    return data.session ? data.session.user : null;
  },

  // Turn Supabase's technical errors into plain sentences
  friendly(error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('invalid login')) return 'Email or password is incorrect.';
    if (msg.includes('already registered')) return 'This email already has an account. Log in instead.';
    if (msg.includes('password should be')) return 'Password must be at least 6 characters.';
    if (msg.includes('valid email') || msg.includes('invalid email')) return 'Enter a valid email address.';
    if (msg.includes('email not confirmed')) return 'Check your inbox and confirm your email first.';
    if (msg.includes('rate limit')) return 'Too many attempts. Wait a minute and try again.';
    if (msg.includes('fetch') || msg.includes('network')) return 'Cannot reach the server. Check your internet connection.';
    return error.message || 'Something went wrong. Try again.';
  }
};