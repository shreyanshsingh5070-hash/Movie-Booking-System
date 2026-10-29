/* admin-movies.js - Movies add / edit / delete (Member 4: Sidharth) */

// Color presets for posters
const COLOR_SETS = [
  { name: 'Red', c1: '#b71c1c', c2: '#1a1a1a' },
  { name: 'Orange', c1: '#e65100', c2: '#212121' },
  { name: 'Gold', c1: '#f9a825', c2: '#4e342e' },
  { name: 'Green', c1: '#2e7d32', c2: '#1b1b1b' },
  { name: 'Purple', c1: '#4a148c', c2: '#0d0d0d' },
  { name: 'Pink', c1: '#ad1457', c2: '#1a1a2e' },
  { name: 'Teal', c1: '#006064', c2: '#12121f' },
  { name: 'Blue', c1: '#1565c0', c2: '#0d1b2a' }
];

let movieModal;

function drawMovies() {
  const list = getMovies();
  document.getElementById('movieBody').innerHTML = list.length
    ? list.map(function (m) {
        return '<tr><td><div class="d-flex align-items-center gap-2">' +
          '<div class="rounded flex-shrink-0" style="' + posterStyle(m) + 'width:32px;height:46px"></div>' +
          '<div><div class="fw-semibold">' + escapeHTML(m.title) + '</div><div class="small text-muted">' + escapeHTML(m.director || '') + '</div></div></div></td>' +
          '<td>' + escapeHTML(m.genre) + '</td><td>' + escapeHTML(m.language) + '</td><td>' + m.duration + ' min</td>' +
          '<td>' + (m.rating ? m.rating.toFixed(1) : '-') + '</td>' +
          '<td><span class="badge bg-' + (m.status === 'now' ? 'success' : 'warning text-dark') + '">' + (m.status === 'now' ? 'Now Showing' : 'Coming Soon') + '</span></td>' +
          '<td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-light me-1" data-edit="' + m.id + '"><i class="bi bi-pencil"></i></button>' +
          '<button class="btn btn-sm btn-outline-danger" data-del="' + m.id + '"><i class="bi bi-trash"></i></button></td></tr>';
      }).join('')
    : '<tr><td colspan="7" class="text-center text-muted py-4">No movies available. Use "Add Movie" to add the first one.</td></tr>';
}

function openForm(movie) {
  document.getElementById('movieModalTitle').textContent = movie ? 'Edit Movie' : 'Add Movie';
  document.getElementById('mId').value = movie ? movie.id : '';
  document.getElementById('mTitle').value = movie ? movie.title : '';
  document.getElementById('mCert').value = movie ? movie.certificate : 'UA';
  document.getElementById('mGenre').value = movie ? movie.genre : '';
  document.getElementById('mLang').value = movie ? movie.language : '';
  document.getElementById('mDur').value = movie ? movie.duration : '';
  document.getElementById('mRating').value = movie ? movie.rating : 0;
  document.getElementById('mStatus').value = movie ? movie.status : 'now';
  document.getElementById('mDirector').value = movie ? movie.director : '';
  document.getElementById('mCast').value = movie ? movie.cast : '';
  document.getElementById('mDesc').value = movie ? movie.desc : '';
  const idx = movie ? COLOR_SETS.findIndex(c => c.c1 === movie.c1) : 0;
  document.getElementById('mColor').value = idx >= 0 ? idx : 0;
  movieModal.show();
}

function saveMovie(e) {
  e.preventDefault();
  const title = document.getElementById('mTitle').value.trim();
  const genre = document.getElementById('mGenre').value.trim();
  const lang = document.getElementById('mLang').value.trim();
  const dur = parseInt(document.getElementById('mDur').value, 10);
  const rating = parseFloat(document.getElementById('mRating').value) || 0;

  if (!title || !genre || !lang) { showToast('Title, genre and language are required', 'error'); return; }
  if (!dur || dur < 30 || dur > 300) { showToast('Duration must be between 30 and 300 minutes', 'error'); return; }
  if (rating < 0 || rating > 10) { showToast('Rating must be between 0 and 10', 'error'); return; }

  const id = document.getElementById('mId').value;
  const colors = COLOR_SETS[document.getElementById('mColor').value];
  const movies = getMovies();

  // Prevent duplicate movies with the same title and language
  const dup = movies.find(m => m.id !== id && m.title.toLowerCase() === title.toLowerCase() && m.language.toLowerCase() === lang.toLowerCase());
  if (dup) { showToast('This movie already exists in the list', 'error'); return; }

  const data = {
    title: title, genre: genre, language: lang, duration: dur, rating: rating,
    certificate: document.getElementById('mCert').value,
    status: document.getElementById('mStatus').value,
    director: document.getElementById('mDirector').value.trim(),
    cast: document.getElementById('mCast').value.trim(),
    desc: document.getElementById('mDesc').value.trim() || 'Description coming soon.',
    c1: colors.c1, c2: colors.c2
  };

  if (id) {
    const i = movies.findIndex(m => m.id === id);
    movies[i] = Object.assign(movies[i], data);
    showToast('Movie updated successfully');
  } else {
    data.id = uid('m');
    movies.push(data);
    showToast('Movie added successfully');
  }
  DB.set('movies', movies);
  movieModal.hide();
  drawMovies();
}

function deleteMovie(id) {
  const m = getMovie(id);
  const movieShows = getShows().filter(s => s.movieId === id);
  const ids = movieShows.map(s => s.id);

  // Block deletion if there are confirmed bookings for upcoming shows
  const live = getBookings().filter(b => b.status === 'Confirmed' && ids.indexOf(b.showId) !== -1 &&
    !isPastShow(getShow(b.showId)));
  if (live.length) {
    showToast('This movie has ' + live.length + ' upcoming booking(s). Please cancel them first.', 'error');
    return;
  }
  if (!confirm('Delete "' + m.title + '" and its ' + movieShows.length + ' show(s)?')) return;

  DB.set('movies', getMovies().filter(x => x.id !== id));
  DB.set('shows', getShows().filter(s => s.movieId !== id));
  showToast('Movie deleted', 'info');
  drawMovies();
}

if (requireAdmin()) {
  renderAdminSide('movies');
  movieModal = new bootstrap.Modal(document.getElementById('movieModal'));
  document.getElementById('mColor').innerHTML = COLOR_SETS.map((c, i) => '<option value="' + i + '">' + c.name + '</option>').join('');

  drawMovies();
  document.getElementById('addMovieBtn').addEventListener('click', function () { openForm(null); });
  document.getElementById('movieForm').addEventListener('submit', saveMovie);
  document.getElementById('movieBody').addEventListener('click', function (e) {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    if (ed) openForm(getMovie(ed.dataset.edit));
    if (del) deleteMovie(del.dataset.del);
  });
}
