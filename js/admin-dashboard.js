/* admin-dashboard.js - Admin dashboard (Member 4: Sidharth) */

function drawDashboard() {
  const movies = getMovies();
  const shows = getShows();
  const today = dateStr(0);
  const confirmed = confirmedBookings();
  const ticketCount = confirmed.reduce((t, b) => t + b.seats.length, 0);

  const cards = [
    ['Total Movies', movies.length, 'bi-film', '#e50914'],
    ['Shows Today', shows.filter(s => s.date === today).length, 'bi-calendar-event', '#2196f3'],
    ['Tickets Sold', ticketCount, 'bi-ticket-perforated', '#ff9800'],
    ['Revenue', fmtINR(totalRevenue()), 'bi-currency-rupee', '#4caf50']
  ];
  document.getElementById('statCards').innerHTML = cards.map(function (c) {
    return '<div class="col-6 col-xl-3"><div class="stat-card d-flex justify-content-between align-items-center">' +
      '<div><div class="small text-muted">' + c[0] + '</div><div class="num">' + c[1] + '</div></div>' +
      '<div class="stat-icon" style="background:' + c[3] + '22;color:' + c[3] + '"><i class="bi ' + c[2] + '"></i></div></div></div>';
  }).join('');

  // recent bookings
  const recent = getBookings().slice().sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
  document.getElementById('recentBody').innerHTML = recent.length
    ? recent.map(function (b) {
        const m = getMovie(b.movieId);
        return '<tr><td class="small">' + b.id + '</td><td>' + escapeHTML(b.userName) + '</td><td>' + escapeHTML(m ? m.title : '-') + '</td>' +
          '<td class="small">' + b.seats.join(', ') + '</td><td class="text-end">' + fmtINR(b.amount) + '</td>' +
          '<td><span class="badge bg-' + (b.status === 'Confirmed' ? 'success' : 'danger') + '">' + b.status + '</span></td></tr>';
      }).join('')
    : '<tr><td colspan="6" class="text-center text-muted py-3">No bookings yet</td></tr>';

  // Today's shows (with seats sold)
  const todays = shows.filter(s => s.date === today).sort((a, b) => a.time.localeCompare(b.time));
  document.getElementById('todayShows').innerHTML = todays.length
    ? todays.map(function (s) {
        const m = getMovie(s.movieId), sc = getScreen(s.screenId);
        if (!m || !sc) return '';
        const sold = getBookedSeats(s.id).length, total = sc.rows * sc.cols;
        const pct = Math.round(sold * 100 / total);
        return '<div class="mb-3"><div class="d-flex justify-content-between small">' +
          '<span>' + fmtTime(s.time) + ' &middot; ' + escapeHTML(m.title) + '</span><span class="text-muted">' + escapeHTML(sc.name) + '</span></div>' +
          '<div class="progress" style="height:6px"><div class="progress-bar bg-danger" style="width:' + pct + '%"></div></div>' +
          '<div class="small text-muted">' + sold + ' / ' + total + ' seats</div></div>';
      }).join('')
    : '<p class="text-muted small mb-0">No shows are scheduled for today.</p>';
}

if (requireAdmin()) {
  renderAdminSide('dashboard');
  drawDashboard();

  document.getElementById('demoBtn').addEventListener('click', function () {
    const n = generateDemoBookings(25);
    showToast(n + ' demo bookings added', 'info');
    drawDashboard();
  });

  document.getElementById('clearDemoBtn').addEventListener('click', function () {
    if (!confirm('Remove all demo bookings? (Real user bookings will not be affected.)')) return;
    clearDemoBookings();
    showToast('Demo bookings removed', 'info');
    drawDashboard();
  });
}
