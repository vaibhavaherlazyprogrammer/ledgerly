# Ledgerly

A simple expense tracker with email login. Each user's expenses are saved
in the cloud and open on any device.

Built with plain HTML, CSS and JavaScript, plus Supabase for login and database.

## Run it on your computer
1. Open `js/config.js` and paste your Supabase Project URL and publishable key.
2. Double-click `index.html`.

## Set up Supabase (one time)
1. Create a free project at supabase.com.
2. Open SQL Editor and run `supabase/schema.sql`.
3. (Testing only) Authentication → Sign In / Providers → Email → turn off "Confirm email".

## Folder guide
- `index.html`: the page
- `css/style.css`: the styling
- `js/config.js`: connection to Supabase
- `js/auth.js`: sign up, log in, log out
- `js/db.js`: save and load expenses
- `js/ui.js`: draws the screen
- `js/app.js`: connects everything together
- `supabase/schema.sql`: database tables and privacy rules

## Security note
Only the publishable key goes in `config.js`. Never put the secret or
service_role key in this project.