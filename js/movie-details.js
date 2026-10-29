/* movie-details.js - Movie details, trailer link, reviews (Member 1: Shreyansh) */

const movieId = getParam('id');
const movie = getMovie(movieId);
const box = document.getElementById('detailsBox');

if (!movie) {
  box.innerHTML = '<div class="text-center py-5"><h4>Movie not found</h4><a href="movies.html" class="btn btn-brand mt-3">Back to Movies</a></div>';
} else {
  document.title = movie.title + ' - CineBook';
  drawPage();
}

function avgReviewRating() {
  const rev = getReviews();
  if (!rev.length) return null;
  const sum = rev.reduce((t, r) => t + r.stars, 0);
  return (sum / rev.length).toFixed(1);
}

function getReviews() {
  return DB.get('reviews', []).filter(r => r.movieId === movieId);
}

function starsHTML(n) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += '<i class="bi bi-star' + (i <= n ? '-fill text-warning' : ' text-muted') + '"></i>';
  }
  return s;
}

function drawPage() {
  const hrs = Math.floor(movie.duration / 60) + 'h ' + (movie.duration % 60) + 'm';
  const trailer = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(movie.title + ' official trailer');
  const soon = movie.status === 'soon';
  const avg = avgReviewRating();

  box.innerHTML =
    '<nav aria-label="breadcrumb"><ol class="breadcrumb small">' +
    '<li class="breadcrumb-item"><a href="index.html">Home</a></li>' +
    '<li class="breadcrumb-item"><a href="movies.html">Movies</a></li>' +
    '<li class="breadcrumb-item active">' + escapeHTML(movie.title) + '</li></ol></nav>' +

    '<div class="row g-4">' +
    '<div class="col-md-4 col-lg-3">' +
    '<div class="poster poster-big" style="' + posterStyle(movie) + '"><div class="poster-title">' + escapeHTML(movie.title) + '</div>' +
    '<div class="poster-lang">' + escapeHTML(movie.language) + '</div></div></div>' +

    '<div class="col-md-8 col-lg-9">' +
    '<h2 class="fw-bold">' + escapeHTML(movie.title) + '</h2>' +
    '<div class="mb-3">' +
    (soon ? '<span class="badge bg-warning text-dark me-2">Coming Soon</span>'
          : '<span class="badge bg-dark border border-secondary fs-6 me-2"><i class="bi bi-star-fill text-warning me-1"></i>' + movie.rating.toFixed(1) + ' / 10</span>') +
    '<span class="badge bg-secondary me-2">' + movie.certificate + '</span>' +
    '<span class="badge bg-secondary me-2">' + escapeHTML(movie.language) + '</span>' +
    '<span class="badge bg-secondary">' + escapeHTML(movie.genre) + '</span></div>' +

    '<p class="text-muted"><i class="bi bi-clock me-1"></i>' + hrs + '</p>' +
    '<h6 class="mt-3">About the movie</h6>' +
    '<p>' + escapeHTML(movie.desc) + '</p>' +
    '<div class="row mb-3"><div class="col-sm-6"><div class="label-sm">Director</div>' + escapeHTML(movie.director) + '</div>' +
    '<div class="col-sm-6"><div class="label-sm">Cast</div>' + escapeHTML(movie.cast) + '</div></div>' +

    '<div class="d-flex flex-wrap gap-2 mt-4">' +
    (soon ? '<button class="btn btn-secondary btn-lg" disabled>Bookings Open Soon</button>'
          : '<a href="shows.html?movie=' + movie.id + '" class="btn btn-brand btn-lg"><i class="bi bi-ticket-perforated me-2"></i>Book Tickets</a>') +
    '<a href="' + trailer + '" target="_blank" rel="noopener" class="btn btn-outline-light btn-lg"><i class="bi bi-play-circle me-2"></i>Watch Trailer</a>' +
    '</div></div></div>' +

    // reviews section
    '<hr class="my-5" style="border-color:#2d2d3a">' +
    '<div class="row g-4"><div class="col-lg-7">' +
    '<h4 class="section-title mb-3">Audience Reviews' + (avg ? ' <small class="text-muted fs-6 ms-2">' + avg + ' / 5 (' + getReviews().length + ')</small>' : '') + '</h4>' +
    '<div id="reviewList"></div></div>' +
    '<div class="col-lg-5"><div class="card-dark p-3" id="reviewFormBox"></div></div></div>';

  drawReviews();
  drawReviewForm();
}

function drawReviews() {
  const list = getReviews().sort((a, b) => b.date.localeCompare(a.date));
  const el = document.getElementById('reviewList');
  if (!list.length) {
    el.innerHTML = '<p class="text-muted">No reviews yet. Be the first to write one!</p>';
    return;
  }
  el.innerHTML = list.map(function (r) {
    return '<div class="card-dark p-3 mb-2"><div class="d-flex justify-content-between">' +
      '<strong>' + escapeHTML(r.name) + '</strong><span class="small text-muted">' + fmtDate(r.date) + '</span></div>' +
      '<div class="my-1">' + starsHTML(r.stars) + '</div>' +
      '<div class="small">' + escapeHTML(r.text) + '</div></div>';
  }).join('');
}

function drawReviewForm() {
  const el = document.getElementById('reviewFormBox');
  const user = currentUser();
  if (!user) {
    el.innerHTML = '<h6>Write a Review</h6><p class="small text-muted">Please log in to submit a review.</p>' +
      '<a href="login.html?next=' + encodeURIComponent('movie.html?id=' + movieId) + '" class="btn btn-outline-brand btn-sm">Login</a>';
    return;
  }
  el.innerHTML =
    '<h6>Write Your Review</h6>' +
    '<div class="mb-2"><label class="form-label">Rating</label>' +
    '<select id="rvStars" class="form-select"><option value="5">5 - Excellent</option><option value="4">4 - Good</option>' +
    '<option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Bad</option></select></div>' +
    '<div class="mb-2"><label class="form-label">Feedback</label>' +
    '<textarea id="rvText" class="form-control" rows="3" maxlength="200" placeholder="Share your thoughts about the movie"></textarea></div>' +
    '<button class="btn btn-brand btn-sm" id="rvSubmit">Submit Review</button>';

  document.getElementById('rvSubmit').addEventListener('click', function () {
    const text = document.getElementById('rvText').value.trim();
    if (text.length < 5) { showToast('Please write a little more (minimum 5 characters)', 'error'); return; }
    const all = DB.get('reviews', []);
    all.push({
      id: uid('r'), movieId: movieId, name: user.name,
      stars: parseInt(document.getElementById('rvStars').value, 10),
      text: text, date: dateStr(0)
    });
    DB.set('reviews', all);
    showToast('Thank you! Your review has been submitted.');
    drawPage();
  });
}
