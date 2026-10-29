/* =========================================================
   common.js - navbar, footer, toast, login session helpers
   On every user-facing page, this file is loaded after data.js.
   ========================================================= */

const ROOT = document.body.dataset.root || '';

// ---------- session ----------
function currentUser() {
  const id = DB.get('session', null);
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
}

function logoutUser() {
  DB.remove('session');
  window.location.href = ROOT + 'index.html';
}

// Call this when login is required; redirects to the login page if the user is not signed in
function requireLogin() {
  const user = currentUser();
  if (!user) {
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    window.location.href = ROOT + 'login.html?next=' + next;
    return null;
  }
  return user;
}

function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

// ---------- navbar ----------
function renderNavbar(active) {
  const user = currentUser();
  const link = (href, label, key) =>
    '<li class="nav-item"><a class="nav-link' + (active === key ? ' active' : '') + '" href="' + ROOT + href + '">' + label + '</a></li>';

  let right;
  if (user) {
    right =
      '<div class="dropdown">' +
      '<a class="btn btn-outline-light btn-sm dropdown-toggle" href="#" data-bs-toggle="dropdown">' +
      '<i class="bi bi-person-circle me-1"></i>' + escapeHTML(user.name.split(' ')[0]) + '</a>' +
      '<ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark">' +
      '<li><a class="dropdown-item" href="' + ROOT + 'profile.html"><i class="bi bi-person me-2"></i>My Profile</a></li>' +
      '<li><a class="dropdown-item" href="' + ROOT + 'history.html"><i class="bi bi-ticket-perforated me-2"></i>My Bookings</a></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><a class="dropdown-item" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>' +
      '</ul></div>';
  } else {
    right =
      '<a class="btn btn-outline-light btn-sm me-2" href="' + ROOT + 'login.html">Login</a>' +
      '<a class="btn btn-brand btn-sm" href="' + ROOT + 'register.html">Sign Up</a>';
  }

  const html =
    '<nav class="navbar navbar-expand-lg navbar-dark app-nav sticky-top">' +
    '<div class="container">' +
    '<a class="navbar-brand fw-bold" href="' + ROOT + 'index.html"><i class="bi bi-film me-2 text-brand"></i>Cine<span class="text-brand">Book</span></a>' +
    '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu"><span class="navbar-toggler-icon"></span></button>' +
    '<div class="collapse navbar-collapse" id="navMenu">' +
    '<ul class="navbar-nav me-auto mb-2 mb-lg-0">' +
    link('index.html', 'Home', 'home') +
    link('movies.html', 'Movies', 'movies') +
    link('shows.html', 'Show Timings', 'shows') +
    link('history.html', 'My Bookings', 'history') +
    '</ul>' + right + '</div></div></nav>';

  const holder = document.getElementById('navbar');
  if (holder) holder.innerHTML = html;

  const lo = document.getElementById('logoutBtn');
  if (lo) lo.addEventListener('click', function (e) { e.preventDefault(); logoutUser(); });
}

// ---------- footer ----------
function renderFooter() {
  const holder = document.getElementById('footer');
  if (!holder) return;
  holder.innerHTML =
    '<footer class="app-footer mt-5 py-4">' +
    '<div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">' +
    '<div><span class="fw-bold">Cine<span class="text-brand">Book</span></span> <span class="text-muted small ms-2">Online Movie Ticket Booking System</span></div>' +
    '<div class="small text-muted">Mini Project &middot; GLA University &middot; ' +
    '<a href="' + ROOT + 'admin/login.html" class="text-muted">Admin</a></div>' +
    '</div></footer>';
}

// ---------- toast message ----------
function showToast(msg, type) {
  let box = document.getElementById('toastBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toastBox';
    box.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(box);
  }
  const color = type === 'error' ? 'danger' : (type === 'info' ? 'primary' : 'success');
  const el = document.createElement('div');
  el.className = 'toast align-items-center text-bg-' + color + ' border-0';
  el.innerHTML = '<div class="d-flex"><div class="toast-body">' + escapeHTML(msg) +
    '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
  box.appendChild(el);
  if (window.bootstrap) {
    const t = new bootstrap.Toast(el, { delay: 2800 });
    t.show();
    el.addEventListener('hidden.bs.toast', function () { el.remove(); });
  }
}

// ---------- movie card (used on both the Home and Movies pages) ----------
function movieCardHTML(m) {
  const badge = m.status === 'soon'
    ? '<span class="badge bg-warning text-dark">Coming Soon</span>'
    : '<span class="badge bg-dark border border-secondary"><i class="bi bi-star-fill text-warning me-1"></i>' + m.rating.toFixed(1) + '</span>';
  return '<div class="col-6 col-md-4 col-lg-3">' +
    '<a href="' + ROOT + 'movie.html?id=' + m.id + '" class="text-decoration-none">' +
    '<div class="movie-card">' +
    '<div class="poster" style="' + posterStyle(m) + '"><div class="poster-title">' + escapeHTML(m.title) + '</div>' +
    '<div class="poster-lang">' + escapeHTML(m.language) + '</div></div>' +
    '<div class="p-3"><div class="d-flex justify-content-between align-items-start gap-2">' +
    '<h6 class="mb-1 text-white">' + escapeHTML(m.title) + '</h6>' + badge + '</div>' +
    '<div class="small text-muted">' + escapeHTML(m.genre) + ' &middot; ' + m.certificate + '</div>' +
    '</div></div></a></div>';
}

document.addEventListener('DOMContentLoaded', function () {
  const page = document.body.dataset.page || '';
  renderNavbar(page);
  renderFooter();
});
