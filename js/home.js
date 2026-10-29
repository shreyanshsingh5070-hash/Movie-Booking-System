/* home.js - Home page (Member 1: Shreyansh) */

const movies = getMovies();
const nowList = movies.filter(m => m.status === 'now');
const soonList = movies.filter(m => m.status === 'soon');

// ---- banner: top rated 3 movies ----
const featured = nowList.slice().sort((a, b) => b.rating - a.rating).slice(0, 3);
const slidesBox = document.getElementById('heroSlides');
featured.forEach(function (m, i) {
  const h = Math.floor(m.duration / 60) + 'h ' + (m.duration % 60) + 'm';
  slidesBox.innerHTML +=
    '<div class="carousel-item' + (i === 0 ? ' active' : '') + '">' +
    '<div class="hero-slide" style="' + posterStyle(m) + '">' +
    '<div class="hero-content">' +
    '<span class="badge bg-danger mb-2">' + escapeHTML(m.language) + '</span>' +
    '<h1>' + escapeHTML(m.title) + '</h1>' +
    '<p class="text-light mb-1">' + escapeHTML(m.genre) + ' &middot; ' + h + ' &middot; <i class="bi bi-star-fill text-warning"></i> ' + m.rating.toFixed(1) + '</p>' +
    '<p class="small text-light opacity-75 d-none d-md-block">' + escapeHTML(m.desc) + '</p>' +
    '<a href="movie.html?id=' + m.id + '" class="btn btn-brand mt-2">Book Now</a>' +
    '</div></div></div>';
});

// ---- grids ----
document.getElementById('nowShowing').innerHTML = nowList.slice(0, 8).map(movieCardHTML).join('');
document.getElementById('comingSoon').innerHTML = soonList.length
  ? soonList.map(movieCardHTML).join('')
  : '<p class="text-muted">No upcoming movies at the moment.</p>';

// ---- quick search: populate the language dropdown ----
const langs = Array.from(new Set(movies.map(m => m.language)));
const langSel = document.getElementById('qsLang');
langs.forEach(function (l) {
  langSel.innerHTML += '<option value="' + escapeHTML(l) + '">' + escapeHTML(l) + '</option>';
});

document.getElementById('quickSearch').addEventListener('submit', function (e) {
  e.preventDefault();
  const q = document.getElementById('qsText').value.trim();
  const l = langSel.value;
  // Pass the query on to the Movies page
  window.location.href = 'movies.html?q=' + encodeURIComponent(q) + '&lang=' + encodeURIComponent(l);
});
