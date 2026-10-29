/* admin.js - Shared admin panel code: login check, sidebar, demo data (Member 4: Sidharth) */

// Demo credentials (fixed, since there is no backend)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

function isAdmin() {
  return DB.get('admin', false) === true;
}

// Redirect to the login page if the admin is not logged in
function requireAdmin() {
  if (!isAdmin()) {
    window.location.replace('login.html');
    return false;
  }
  return true;
}

function adminLogout() {
  DB.remove('admin');
  window.location.href = 'login.html';
}

function renderAdminSide(active) {
  const items = [
    ['dashboard.html', 'Dashboard', 'bi-speedometer2', 'dashboard'],
    ['movies.html', 'Movies', 'bi-film', 'movies'],
    ['screens.html', 'Screens', 'bi-projector', 'screens'],
    ['shows.html', 'Shows', 'bi-calendar-event', 'shows'],
    ['bookings.html', 'Bookings', 'bi-ticket-perforated', 'bookings'],
    ['reports.html', 'Reports', 'bi-bar-chart-line', 'reports']
  ];
  let html = '<div class="p-3"><a class="navbar-brand fw-bold fs-5 text-white text-decoration-none d-block mb-1" href="dashboard.html">' +
    '<i class="bi bi-film text-brand me-2"></i>Cine<span class="text-brand">Book</span></a>' +
    '<div class="small text-muted mb-4">Admin Panel</div><ul class="nav flex-column">';
  items.forEach(function (it) {
    html += '<li class="nav-item"><a class="nav-link' + (active === it[3] ? ' active' : '') + '" href="' + it[0] + '">' +
      '<i class="bi ' + it[2] + ' me-2"></i>' + it[1] + '</a></li>';
  });
  html += '</ul><hr style="border-color:#2d2d3a">' +
    '<a class="nav-link text-muted small" href="../index.html"><i class="bi bi-box-arrow-up-right me-2"></i>View Website</a>' +
    '<a class="nav-link text-muted small" href="#" id="adminLogoutBtn"><i class="bi bi-power me-2"></i>Logout</a></div>';

  const side = document.getElementById('adminSide');
  if (side) side.innerHTML = html;
  const lo = document.getElementById('adminLogoutBtn');
  if (lo) lo.addEventListener('click', function (e) { e.preventDefault(); adminLogout(); });
}

// All admin figures are derived here (used by both the Dashboard and Reports pages)
function confirmedBookings() {
  return getBookings().filter(b => b.status === 'Confirmed');
}

function totalRevenue() {
  return confirmedBookings().reduce((t, b) => t + b.amount, 0);
}

// ---------- demo bookings (used to populate the charts during the presentation) ----------
function generateDemoBookings(count) {
  const names = ['Aarav Sharma', 'Isha Verma', 'Rahul Gupta', 'Sneha Singh', 'Vikas Yadav',
    'Pooja Mishra', 'Ankit Jain', 'Neha Agarwal', 'Mohit Chauhan', 'Kajal Pandey', 'Deepak Rawat', 'Ritika Saxena'];
  const modes = ['UPI', 'UPI', 'Card', 'Net Banking'];
  const shows = getShows().filter(s => !isPastShow(s));
  const bookings = getBookings();
  let made = 0, tries = 0;

  while (made < count && tries < count * 30 && shows.length) {
    tries++;
    const show = shows[Math.floor(Math.random() * shows.length)];
    const hall = getScreen(show.screenId);
    if (!hall) continue;

    const taken = [];
    bookings.forEach(function (b) { if (b.showId === show.id && b.status === 'Confirmed') taken.push.apply(taken, b.seats); });

    // 1 to 4 adjacent seats in the same row
    const n = 1 + Math.floor(Math.random() * 4);
    const r = Math.floor(Math.random() * hall.rows);
    const c = 1 + Math.floor(Math.random() * (hall.cols - n + 1));
    const seats = [];
    for (let i = 0; i < n; i++) seats.push(rowLetter(r) + (c + i));
    if (seats.some(s => taken.indexOf(s) !== -1)) continue;

    const base = seats.reduce((t, s) => t + seatPrice(s, hall), 0);
    const fee = n * 20;
    const when = new Date();
    when.setDate(when.getDate() - Math.floor(Math.random() * 7));
    when.setHours(9 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60));

    bookings.push({
      id: makeBookingId(),
      userId: 'demo',
      userName: names[Math.floor(Math.random() * names.length)],
      movieId: show.movieId,
      showId: show.id,
      seats: seats,
      amount: base + fee,
      fee: fee,
      mode: modes[Math.floor(Math.random() * modes.length)],
      payRef: 'demo',
      time: when.toISOString(),
      status: Math.random() < 0.1 ? 'Cancelled' : 'Confirmed',
      demo: true
    });
    made++;
  }
  DB.set('bookings', bookings);
  return made;
}

function clearDemoBookings() {
  const left = getBookings().filter(b => !b.demo);
  DB.set('bookings', left);
}
