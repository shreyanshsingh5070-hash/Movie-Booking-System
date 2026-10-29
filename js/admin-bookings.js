/* admin-bookings.js - View all bookings, filter, cancel, export CSV (Member 4: Sidharth) */

function filteredBookings() {
  const q = document.getElementById('bSearch').value.trim().toLowerCase();
  const mv = document.getElementById('bMovie').value;
  const st = document.getElementById('bStatus').value;

  return getBookings().filter(function (b) {
    if (q && b.id.toLowerCase().indexOf(q) === -1 && b.userName.toLowerCase().indexOf(q) === -1) return false;
    if (mv && b.movieId !== mv) return false;
    if (st && b.status !== st) return false;
    return true;
  }).sort((a, b) => b.time.localeCompare(a.time));
}

function drawBookings() {
  const list = filteredBookings();
  document.getElementById('bCount').textContent = list.length + ' booking(s)';
  document.getElementById('bBody').innerHTML = list.length
    ? list.map(function (b) {
        const m = getMovie(b.movieId), s = getShow(b.showId);
        const showText = s ? fmtDate(s.date) + ', ' + fmtTime(s.time) : '-';
        const canCancel = b.status === 'Confirmed' && s && !isPastShow(s);
        return '<tr><td class="small fw-semibold">' + b.id + '</td>' +
          '<td>' + escapeHTML(b.userName) + (b.demo ? ' <span class="badge bg-secondary">demo</span>' : '') + '</td>' +
          '<td>' + escapeHTML(m ? m.title : 'Deleted') + '</td><td class="small">' + showText + '</td>' +
          '<td class="small">' + b.seats.join(', ') + '</td><td class="text-end">' + fmtINR(b.amount) + '</td>' +
          '<td class="small">' + escapeHTML(b.mode) + '</td>' +
          '<td><span class="badge bg-' + (b.status === 'Confirmed' ? 'success' : 'danger') + '">' + b.status + '</span></td>' +
          '<td class="text-end">' + (canCancel ? '<button class="btn btn-sm btn-outline-danger" data-cancel="' + b.id + '">Cancel</button>' : '') + '</td></tr>';
      }).join('')
    : '<tr><td colspan="9" class="text-center text-muted py-4">No bookings found</td></tr>';
}

function exportCSV() {
  const list = filteredBookings();
  if (!list.length) { showToast('There are no bookings to export', 'error'); return; }

  const rows = [['Booking ID', 'User', 'Movie', 'Show Date', 'Show Time', 'Seats', 'Amount', 'Payment', 'Status', 'Booked At']];
  list.forEach(function (b) {
    const m = getMovie(b.movieId), s = getShow(b.showId);
    rows.push([b.id, b.userName, m ? m.title : 'Deleted', s ? s.date : '', s ? fmtTime(s.time) : '',
      b.seats.join(' '), b.amount, b.mode, b.status, new Date(b.time).toLocaleString('en-IN')]);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bookings_' + dateStr(0) + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

if (requireAdmin()) {
  renderAdminSide('bookings');
  document.getElementById('bMovie').innerHTML = '<option value="">All Movies</option>' +
    getMovies().map(m => '<option value="' + m.id + '">' + escapeHTML(m.title) + '</option>').join('');
  drawBookings();

  ['bSearch'].forEach(id => document.getElementById(id).addEventListener('input', drawBookings));
  ['bMovie', 'bStatus'].forEach(id => document.getElementById(id).addEventListener('change', drawBookings));
  document.getElementById('bReset').addEventListener('click', function () {
    document.getElementById('bSearch').value = '';
    document.getElementById('bMovie').value = '';
    document.getElementById('bStatus').value = '';
    drawBookings();
  });
  document.getElementById('csvBtn').addEventListener('click', exportCSV);

  document.getElementById('bBody').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return;
    if (!confirm('Cancel this booking? The seats will be released.')) return;
    const all = getBookings();
    const b = all.find(x => x.id === btn.dataset.cancel);
    if (b) {
      b.status = 'Cancelled';
      b.cancelledAt = new Date().toISOString();
      b.cancelledBy = 'admin';
      DB.set('bookings', all);
      showToast('Booking cancelled', 'info');
      drawBookings();
    }
  });
}
