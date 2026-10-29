/* shows.js - Show timings page (Member 2: Shubham) */

const nowMovies = getMovies().filter(m => m.status === 'now');
let selMovie = getParam('movie') || '';
let selDate = getParam('date') || dateStr(0);

const movieSelect = document.getElementById('movieSelect');
movieSelect.innerHTML = '<option value="">All Movies</option>' +
  nowMovies.map(m => '<option value="' + m.id + '">' + escapeHTML(m.title) + ' (' + escapeHTML(m.language) + ')</option>').join('');
movieSelect.value = selMovie;

movieSelect.addEventListener('change', function () {
  selMovie = this.value;
  drawShows();
});

// Date tabs for the next 7 days
function drawDateTabs() {
  let html = '';
  for (let i = 0; i < 7; i++) {
    const ds = dateStr(i);
    const d = new Date(ds + 'T00:00:00');
    html += '<div class="date-tab' + (ds === selDate ? ' active' : '') + '" data-date="' + ds + '">' +
      '<div class="w">' + d.toLocaleDateString('en-IN', { weekday: 'short' }) + '</div>' +
      '<div class="d">' + d.getDate() + '</div>' +
      '<div class="w">' + d.toLocaleDateString('en-IN', { month: 'short' }) + '</div></div>';
  }
  document.getElementById('dateTabs').innerHTML = html;
}

document.getElementById('dateTabs').addEventListener('click', function (e) {
  const tab = e.target.closest('.date-tab');
  if (!tab) return;
  selDate = tab.dataset.date;
  drawDateTabs();
  drawShows();
});

function drawShows() {
  const shows = getShows().filter(s => s.date === selDate && (!selMovie || s.movieId === selMovie));
  const box = document.getElementById('showList');

  if (!shows.length) {
    box.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-calendar-x fs-1"></i>' +
      '<p class="mt-2">No shows are available for this date. Please try another date.</p></div>';
    return;
  }

  // Group shows by movie
  const byMovie = {};
  shows.forEach(function (s) {
    (byMovie[s.movieId] = byMovie[s.movieId] || []).push(s);
  });

  let html = '';
  Object.keys(byMovie).forEach(function (mid) {
    const m = getMovie(mid);
    if (!m) return;
    const list = byMovie[mid].sort((a, b) => a.time.localeCompare(b.time));

    html += '<div class="card-dark p-3 mb-3"><div class="d-flex gap-3 align-items-start">' +
      '<div class="poster flex-shrink-0 rounded" style="' + posterStyle(m) + 'width:70px;padding:6px"></div>' +
      '<div class="flex-grow-1"><a href="movie.html?id=' + m.id + '" class="text-white text-decoration-none"><h5 class="mb-0">' + escapeHTML(m.title) + '</h5></a>' +
      '<div class="small text-muted mb-3">' + escapeHTML(m.genre) + ' &middot; ' + escapeHTML(m.language) + ' &middot; ' + m.certificate + '</div>' +
      '<div class="d-flex flex-wrap gap-3">';

    list.forEach(function (s) {
      const sc = getScreen(s.screenId);
      if (!sc) return;
      const total = sc.rows * sc.cols;
      const left = total - getBookedSeats(s.id).length;
      let cls = 'time-btn', note = left + ' seats left';
      if (isPastShow(s)) { cls += ' past'; note = 'Show ended'; }
      else if (left <= 0) { cls += ' full'; note = 'Sold Out'; }
      else if (left <= total * 0.2) { note = 'Filling fast - ' + left + ' left'; }

      html += '<div class="text-center"><a href="seats.html?show=' + s.id + '" class="' + cls + '">' + fmtTime(s.time) + '</a>' +
        '<div style="font-size:.7rem" class="text-muted mt-1">' + escapeHTML(sc.name) + '<br>' + note + '</div></div>';
    });

    html += '</div></div></div></div>';
  });

  box.innerHTML = html;
}

drawDateTabs();
drawShows();
