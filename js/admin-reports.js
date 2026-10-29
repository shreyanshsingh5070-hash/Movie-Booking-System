/* admin-reports.js - Reports + Chart.js graphs (Member 4: Sidharth) */

const CHART_COLORS = ['#e50914', '#ff9800', '#2196f3', '#4caf50', '#9c27b0', '#00bcd4', '#ffc107', '#795548'];

function drawReports() {
  const confirmed = confirmedBookings();
  const cancelledCount = getBookings().length - confirmed.length;
  const tickets = confirmed.reduce((t, b) => t + b.seats.length, 0);
  const revenue = totalRevenue();
  const avg = confirmed.length ? Math.round(revenue / confirmed.length) : 0;

  const cards = [
    ['Confirmed Bookings', confirmed.length], ['Tickets Sold', tickets],
    ['Total Revenue', fmtINR(revenue)], ['Avg. Booking Value', fmtINR(avg)], ['Cancelled', cancelledCount]
  ];
  document.getElementById('sumCards').innerHTML = cards.map(function (c) {
    return '<div class="col-6 col-lg"><div class="stat-card"><div class="small text-muted">' + c[0] + '</div><div class="num fs-4">' + c[1] + '</div></div></div>';
  }).join('');

  // ---- movie wise data ----
  const perMovie = {};
  confirmed.forEach(function (b) {
    const m = getMovie(b.movieId);
    const name = m ? m.title : 'Deleted movie';
    const o = perMovie[name] = perMovie[name] || { bookings: 0, tickets: 0, revenue: 0 };
    o.bookings++; o.tickets += b.seats.length; o.revenue += b.amount;
  });
  const names = Object.keys(perMovie).sort((a, b) => perMovie[b].revenue - perMovie[a].revenue);

  document.getElementById('sumBody').innerHTML = names.length
    ? names.map(n => '<tr><td>' + escapeHTML(n) + '</td><td class="text-end">' + perMovie[n].bookings + '</td><td class="text-end">' +
        perMovie[n].tickets + '</td><td class="text-end">' + fmtINR(perMovie[n].revenue) + '</td></tr>').join('')
    : '<tr><td colspan="4" class="text-center text-muted py-3">No data available. Add demo bookings from the Dashboard to see reports.</td></tr>';

  if (typeof Chart === 'undefined') {
    // CDN failed to load (no internet connection)
    document.querySelectorAll('canvas').forEach(function (c) {
      c.parentNode.innerHTML = '<p class="text-muted small">Chart could not be loaded. Please check your internet connection.</p>';
    });
    return;
  }

  Chart.defaults.color = '#9a9aab';
  Chart.defaults.borderColor = '#2d2d3a';

  // 1. revenue by movie (bar)
  new Chart(document.getElementById('chMovie'), {
    type: 'bar',
    data: { labels: names, datasets: [{ label: 'Revenue (₹)', data: names.map(n => perMovie[n].revenue), backgroundColor: '#e50914', borderRadius: 6 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });

  // 2. payment mode (doughnut)
  const pay = {};
  confirmed.forEach(b => { pay[b.mode] = (pay[b.mode] || 0) + 1; });
  new Chart(document.getElementById('chPay'), {
    type: 'doughnut',
    data: { labels: Object.keys(pay), datasets: [{ data: Object.values(pay), backgroundColor: CHART_COLORS, borderWidth: 0 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });

  // 3. Bookings in the last 7 days (line)
  const dayLabels = [], dayCounts = [];
  for (let i = 6; i >= 0; i--) {
    const ds = dateStr(-i);
    dayLabels.push(fmtDate(ds));
    dayCounts.push(confirmed.filter(function (b) {
      const d = new Date(b.time);
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) === ds;
    }).length);
  }
  new Chart(document.getElementById('chDays'), {
    type: 'line',
    data: { labels: dayLabels, datasets: [{ label: 'Bookings', data: dayCounts, borderColor: '#e50914', backgroundColor: 'rgba(229,9,20,.15)', fill: true, tension: .3 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
  });

  // 4. seat type (doughnut)
  const seatCount = { Normal: 0, Premium: 0, Recliner: 0 };
  confirmed.forEach(function (b) {
    const s = getShow(b.showId), sc = s ? getScreen(s.screenId) : null;
    if (!sc) return;
    b.seats.forEach(seat => { seatCount[seatType(seat.charCodeAt(0) - 65, sc.rows)]++; });
  });
  new Chart(document.getElementById('chSeat'), {
    type: 'doughnut',
    data: { labels: Object.keys(seatCount), datasets: [{ data: Object.values(seatCount), backgroundColor: ['#9a9aab', '#d4a017', '#3aa6d6'], borderWidth: 0 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}

if (requireAdmin()) {
  renderAdminSide('reports');
  drawReports();
}
