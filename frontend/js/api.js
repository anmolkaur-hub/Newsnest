// Auto-detect API base: use relative path in production (same origin),
// or localhost:3000 when running locally against a separate backend.
const API = (() => {
  const { hostname, port, protocol } = window.location;
  // Running on localhost frontend (e.g. Live Server on port 5500/5173)
  // pointing at a separate backend on 3000
  if (hostname === 'localhost' && port !== '3000') {
    return 'http://localhost:3000/api';
  }
  // Same-origin (local :3000 or deployed Vercel) — use relative path
  return '/api';
})();

function getToken() { return localStorage.getItem('nn_token'); }
function getUser() { return JSON.parse(localStorage.getItem('nn_user') || 'null'); }
function setAuth(token, user) {
  localStorage.setItem('nn_token', token);
  localStorage.setItem('nn_user', JSON.stringify(user));
}
function logout() {
  localStorage.removeItem('nn_token');
  localStorage.removeItem('nn_user');
  window.location.href = '/login';
}
function requireAuth() {
  if (!getToken()) window.location.href = '/login';
}
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(API + endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    },
    ...options
  });
  return res.json();
}
function showToast(msg, type) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast ' + (type || 'success') + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}
function renderNav(activePage) {
  const user = getUser();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `<nav class="nav">
    <div class="nav-top">
      <a href="/dashboard" class="nav-logo">News<span>Nest</span></a>
      <div class="nav-date">${dateStr}</div>
      <div class="nav-user-area">
        <span>${user?.name || 'Reader'}</span>
        <button class="btn-logout" onclick="logout()">Sign Out</button>
      </div>
    </div>
    <div class="nav-links">
      <a href="/dashboard" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">📰 Headlines</a>
      <a href="/saved" class="nav-link ${activePage === 'saved' ? 'active' : ''}">🔖 Saved</a>
      <a href="/insights" class="nav-link ${activePage === 'insights' ? 'active' : ''}">🤖 AI Insights</a>
    </div>
  </nav>`;
}
