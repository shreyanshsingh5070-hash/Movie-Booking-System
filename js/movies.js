/* movies.js - Movie listing with search + filters (Member 1: Shreyansh) */

const allMovies = getMovies();
const state = { q: '', lang: '', genre: '', status: '', sort: 'rating' };

// Read the query parameters passed from the Home page
state.q = getParam('q') || '';
state.lang = getParam('lang') || '';

const searchBox = document.getElementById('searchBox');
const langFilter = document.getElementById('langFilter');
const sortBy = document.getElementById('sortBy');

// language dropdown
Array.from(new Set(allMovies.map(m => m.language))).forEach(function (l) {
  langFilter.innerHTML += '<option value="' + escapeHTML(l) + '">' + escapeHTML(l) + '</option>';
});

// Genre chips (one for each genre present in the movie list)
const genreBox = document.getElementById('genreChips');
const genres = Array.from(new Set(allMovies.map(m => m.genre)));
genreBox.innerHTML = '<span class="filter-chip active" data-genre="">All Genres</span>' +
  genres.map(g => '<span class="filter-chip" data-genre="' + escapeHTML(g) + '">' + escapeHTML(g) + '</span>').join('');

searchBox.value = state.q;
langFilter.value = state.lang;

function applyFilters() {
  const q = state.q.toLowerCase();
  let list = allMovies.filter(function (m) {
    const text = (m.title + ' ' + m.cast + ' ' + m.director).toLowerCase();
    if (q && text.indexOf(q) === -1) return false;
    if (state.lang && m.language !== state.lang) return false;
    if (state.genre && m.genre !== state.genre) return false;
    if (state.status && m.status !== state.status) return false;
    return true;
  });

  if (state.sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
  else if (state.sort === 'duration') list.sort((a, b) => b.duration - a.duration);
  else list.sort((a, b) => b.rating - a.rating);

  document.getElementById('movieGrid').innerHTML = list.map(movieCardHTML).join('');
  document.getElementById('resultCount').textContent = list.length + ' movie' + (list.length === 1 ? '' : 's') + ' found';
  document.getElementById('noResult').classList.toggle('d-none', list.length > 0);
}

// Small helper that sets the active class on filter chips
function setActive(container, attr, value) {
  container.querySelectorAll('.filter-chip').forEach(function (c) {
    c.classList.toggle('active', c.getAttribute(attr) === value);
  });
}

searchBox.addEventListener('input', function () { state.q = this.value.trim(); applyFilters(); });
langFilter.addEventListener('change', function () { state.lang = this.value; applyFilters(); });
sortBy.addEventListener('change', function () { state.sort = this.value; applyFilters(); });

genreBox.addEventListener('click', function (e) {
  if (!e.target.classList.contains('filter-chip')) return;
  state.genre = e.target.dataset.genre;
  setActive(genreBox, 'data-genre', state.genre);
  applyFilters();
});

const statusBox = document.getElementById('statusChips');
statusBox.addEventListener('click', function (e) {
  if (!e.target.classList.contains('filter-chip')) return;
  state.status = e.target.dataset.status;
  setActive(statusBox, 'data-status', state.status);
  applyFilters();
});

document.getElementById('resetBtn').addEventListener('click', function () {
  state.q = ''; state.lang = ''; state.genre = ''; state.status = ''; state.sort = 'rating';
  searchBox.value = ''; langFilter.value = ''; sortBy.value = 'rating';
  setActive(genreBox, 'data-genre', '');
  setActive(statusBox, 'data-status', '');
  applyFilters();
});

applyFilters();
