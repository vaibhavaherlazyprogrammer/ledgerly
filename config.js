const SUPABASE_URL = "https://pdqwwgckdoltbiedbcbr.supabase.co";
const SUPABASE_KEY = "sb_publishable_2pfXe4DZj76fnG0LUgk4yg_TARuo9mV";

let db;
try {
  if (!window.supabase) {
    throw new Error("Supabase library did not load. Check the script line in index.html.");
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (err) {
  console.error("config.js failed:", err);
  window.addEventListener("DOMContentLoaded", () => {
    const box = document.getElementById("authErr");
    if (box) box.textContent = "Setup problem: " + err.message;
  });
}