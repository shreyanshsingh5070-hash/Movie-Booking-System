/* history.js - Booking history + cancel (Member 3: Somyani) */

const me = requireLogin();
let tab = 'upcoming';
const CANCEL_BEFORE_HOURS = 2;   // Cancellation is allowed up to 2 hours before the show

function myBookings() {
  return getBookings()
    .filter(b => b.userId === me.id)
    .sort((a, b) => b.time.localeCompare(a.time));   // Newest first
}

function canCancel(b, show) {
  if (b.status !== 'Confirmed' || !show) return false;
  const hoursLeft = (showDateTime(show) - new Date()) / 36e5;
  return hoursLeft >= CANCEL_BEFORE_HOURS;
}

function draw() {
  const all = myBookings();
  const list = all.filter(function (b) {
    const show = getShow(b.showId);
    const past = show ? isPastShow(show) : true;
    if (tab === 'cancelled') return b.status === 'Cancelled';
    if (b.status === 'Cancelled') return false;
    return tab === 'past' ? past : !past;
  });

  const box = document.getElementById('bookingList');
  if (!list.length) {
    box.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-ticket-perforated fs-1"></i>' +
      '<p class="mt-2">Nothing to show here yet.</p>' +
      (tab === 'upcoming' ? '<a href="movies.html" class="btn btn-brand btn-sm">Book a Movie</a>' : '') + '</div>';
    return;
  }

  box.innerHTML = list.map(function (b) {
    const show = getShow(b.showId);
    const movie = getMovie(b.movieId);
    const hall = show ? getScreen(show.screenId) : null;
    const badge = b.status === 'Cancelled'
      ? '<span class="badge bg-danger">Cancelled</span>'
      : '<span class="badge bg-success">Confirmed</span>';

    return '<div class="card-dark p-3 mb-3"><div class="row g-3 align-items-center">' +
      '<div class="col-auto"><div class="poster rounded" style="' + (movie ? posterStyle(movie) : 'background:#333;') + 'width:64px;padding:4px"></div></div>' +
      '<div class="col"><div class="d-flex flex-wrap justify-content-between gap-2">' +
      '<h6 class="mb-1">' + escapeHTML(movie ? movie.title : 'Deleted movie') + '</h6>' + badge + '</div>' +
      '<div class="small text-muted">' + (show ? fmtDate(show.date) + ' &middot; ' + fmtTime(show.time) + ' &middot; ' + escapeHTML(hall ? hall.name : '') : 'Show removed') + '</div>' +
      '<div class="small mt-1">Seats: <strong>' + b.seats.join(', ') + '</strong> &middot; ' + fmtINR(b.amount) + '</div>' +
      '<div class="small text-muted">ID: ' + b.id + '</div></div>' +
      '<div class="col-md-auto d-flex gap-2">' +
      '<a class="btn btn-outline-light btn-sm" href="confirm.html?booking=' + b.id + '"><i class="bi bi-ticket-perforated me-1"></i>Ticket</a>' +
      (canCancel(b, show) ? '<button class="btn btn-outline-danger btn-sm" data-cancel="' + b.id + '">Cancel</button>' : '') +
      '</div></div></div>';
  }).join('');
}

document.getElementById('tabs').addEventListener('click', function (e) {
  if (!e.target.classList.contains('filter-chip')) return;
  tab = e.target.dataset.tab;
  this.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c === e.target));
  draw();
});

document.getElementById('bookingList').addEventListener('click', function (e) {
  const btn = e.target.closest('[data-cancel]');
  if (!btn) return;
  const id = btn.dataset.cancel;
  if (!confirm('Are you sure you want to cancel this booking?\n\n(This is a demo project; the refund is for display purposes only.)')) return;

  const all = getBookings();
  const b = all.find(x => x.id === id);
  if (b && b.userId === me.id) {
    b.status = 'Cancelled';
    b.cancelledAt = new Date().toISOString();
    DB.set('bookings', all);
    showToast('Booking cancelled. The seats have been released.', 'info');
    draw();
  }
});

if (me) draw();
