/* admin-shows.js - Show scheduling (Member 4: Sidharth) */

let showModal;

function fillSelects() {
  const movieOpts = getMovies().filter(m => m.status === 'now')
    .map(m => '<option value="' + m.id + '">' + escapeHTML(m.title) + '</option>').join('');
  const screenOpts = getScreens().map(s => '<option value="' + s.id + '">' + escapeHTML(s.name) + '</option>').join('');

  document.getElementById('shMovie').innerHTML = movieOpts;
  document.getElementById('shScreen').innerHTML = screenOpts;

  // Filters (including the "All" option)
  const fm = document.getElementById('fMovie'), fs = document.getElementById('fScreen');
  const keepM = fm.value, keepS = fs.value;
  fm.innerHTML = '<option value="">All Movies</option>' + getMovies().map(m => '<option value="' + m.id + '">' + escapeHTML(m.title) + '</option>').join('');
  fs.innerHTML = '<option value="">All Screens</option>' + screenOpts;
  fm.value = keepM; fs.value = keepS;
}

function drawShows() {
  const fDate = document.getElementById('fDate').value;
  const fMovie = document.getElementById('fMovie').value;
  const fScreen = document.getElementById('fScreen').value;

  const list = getShows().filter(function (s) {
    if (fDate && s.date !== fDate) return false;
    if (fMovie && s.movieId !== fMovie) return false;
    if (fScreen && s.screenId !== fScreen) return false;
    return true;
  }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  document.getElementById('showBody').innerHTML = list.length
    ? list.map(function (s) {
        const m = getMovie(s.movieId), sc = getScreen(s.screenId);
        const sold = getBookedSeats(s.id).length;
        const total = sc ? sc.rows * sc.cols : 0;
        return '<tr' + (isPastShow(s) ? ' class="opacity-50"' : '') + '><td>' + fmtDate(s.date) + '</td><td>' + fmtTime(s.time) + '</td>' +
          '<td>' + escapeHTML(m ? m.title : '-') + '</td><td>' + escapeHTML(sc ? sc.name : '-') + '</td>' +
          '<td>' + sold + ' / ' + total + '</td>' +
          '<td class="text-end"><button class="btn btn-sm btn-outline-danger" data-del="' + s.id + '"><i class="bi bi-trash"></i></button></td></tr>';
      }).join('')
    : '<tr><td colspan="6" class="text-center text-muted py-4">No shows found</td></tr>';
}

function addShow(e) {
  e.preventDefault();
  const movieId = document.getElementById('shMovie').value;
  const screenId = document.getElementById('shScreen').value;
  const date = document.getElementById('shDate').value;
  const time = document.getElementById('shTime').value;

  if (!movieId || !screenId) { showToast('Please add a movie and a screen first', 'error'); return; }
  if (!date || !time) { showToast('Please enter both date and time', 'error'); return; }
  if (date < dateStr(0)) { showToast('Cannot schedule a show on a past date', 'error'); return; }
  if (date === dateStr(0) && time <= pad(new Date().getHours()) + ':' + pad(new Date().getMinutes())) {
    showToast('This time has already passed', 'error');
    return;
  }

  // Two shows cannot overlap on the same screen (a gap of up to 2 hours is enforced)
  const movie = getMovie(movieId);
  const start = new Date(date + 'T' + time + ':00');
  const clash = getShows().find(function (s) {
    if (s.screenId !== screenId || s.date !== date) return false;
    const other = showDateTime(s);
    const otherMovie = getMovie(s.movieId);
    const diffMin = Math.abs(other - start) / 60000;
    const needed = Math.max(movie.duration, otherMovie ? otherMovie.duration : 120);
    return diffMin < Math.min(needed, 120);
  });
  if (clash) {
    showToast('This conflicts with the ' + fmtTime(clash.time) + ' show on this screen', 'error');
    return;
  }

  const shows = getShows();
  shows.push({ id: uid('sh'), movieId: movieId, screenId: screenId, date: date, time: time });
  DB.set('shows', shows);
  showModal.hide();
  showToast('Show scheduled successfully');
  drawShows();
}

function deleteShow(id) {
  const live = getBookings().filter(b => b.showId === id && b.status === 'Confirmed');
  if (live.length && !isPastShow(getShow(id))) {
    showToast('This show has ' + live.length + ' booking(s). Please cancel them from the Bookings page first.', 'error');
    return;
  }
  if (!confirm('Delete this show?')) return;
  DB.set('shows', getShows().filter(s => s.id !== id));
  showToast('Show deleted', 'info');
  drawShows();
}

if (requireAdmin()) {
  renderAdminSide('shows');
  showModal = new bootstrap.Modal(document.getElementById('showModal'));
  fillSelects();
  drawShows();

  document.getElementById('addShowBtn').addEventListener('click', function () {
    document.getElementById('shDate').value = dateStr(0);
    document.getElementById('shDate').min = dateStr(0);
    document.getElementById('shTime').value = '18:00';
    showModal.show();
  });
  document.getElementById('showForm').addEventListener('submit', addShow);
  ['fDate', 'fMovie', 'fScreen'].forEach(id => document.getElementById(id).addEventListener('change', drawShows));
  document.getElementById('fReset').addEventListener('click', function () {
    document.getElementById('fDate').value = '';
    document.getElementById('fMovie').value = '';
    document.getElementById('fScreen').value = '';
    drawShows();
  });
  document.getElementById('showBody').addEventListener('click', function (e) {
    const del = e.target.closest('[data-del]');
    if (del) deleteShow(del.dataset.del);
  });
}
