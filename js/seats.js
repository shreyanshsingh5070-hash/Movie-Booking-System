/* seats.js - Seat selection (Member 2: Shubham) */

const user = requireLogin();   // Redirects to the login page if the user is not signed in

const show = getShow(getParam('show'));
const movie = show ? getMovie(show.movieId) : null;
const hall = show ? getScreen(show.screenId) : null;

let selected = [];   // Currently selected seats, e.g. ['A1', 'A2']

if (user) {
  if (!show || !movie || !hall) {
    document.querySelector('main').innerHTML = '<div class="text-center py-5"><h4>Show not found</h4><a href="shows.html" class="btn btn-brand mt-3">View Show Timings</a></div>';
    document.getElementById('bookingBar').remove();
  } else if (isPastShow(show)) {
    document.querySelector('main').innerHTML = '<div class="text-center py-5"><h4>This show has already started</h4><a href="shows.html?movie=' + movie.id + '" class="btn btn-brand mt-3">Choose Another Show</a></div>';
    document.getElementById('bookingBar').remove();
  } else {
    drawInfo();
    drawSeats();
    document.getElementById('proceedBtn').addEventListener('click', proceed);
  }
}

function drawInfo() {
  document.getElementById('showInfo').innerHTML =
    '<a href="shows.html?movie=' + movie.id + '&date=' + show.date + '" class="small"><i class="bi bi-arrow-left me-1"></i>Back to show timings</a>' +
    '<h4 class="mt-2 mb-1">' + escapeHTML(movie.title) + '</h4>' +
    '<div class="text-muted">' + escapeHTML(hall.name) + ' &middot; ' + fmtDateLong(show.date) + ' &middot; ' + fmtTime(show.time) + '</div>';
}

function drawSeats() {
  const booked = getBookedSeats(show.id);
  const mid = Math.floor(hall.cols / 2);   // Aisle (gap) in the middle
  let html = '';
  let lastType = '';

  for (let r = 0; r < hall.rows; r++) {
    const type = seatType(r, hall.rows);
    if (type !== lastType) {
      html += '<div class="seat-section-label">' + type.toUpperCase() + ' &middot; ' + fmtINR(PRICES[type]) + '</div>';
      lastType = type;
    }
    html += '<div class="seat-row"><div class="row-name">' + rowLetter(r) + '</div>';
    for (let c = 1; c <= hall.cols; c++) {
      const id = rowLetter(r) + c;
      let cls = 'seat ' + type.toLowerCase();
      if (booked.indexOf(id) !== -1) cls += ' booked';
      if (selected.indexOf(id) !== -1) cls += ' selected';
      html += '<button type="button" class="' + cls + '" data-seat="' + id + '" title="' + id + ' - ' + type + ' - ' + fmtINR(PRICES[type]) + '">' + c + '</button>';
      if (c === mid) html += '<span style="width:18px"></span>';
    }
    html += '<div class="row-name">' + rowLetter(r) + '</div></div>';
  }
  document.getElementById('seatMap').innerHTML = html;
}

document.getElementById('seatMap').addEventListener('click', function (e) {
  const btn = e.target.closest('.seat');
  if (!btn || btn.classList.contains('booked')) return;
  const id = btn.dataset.seat;
  const idx = selected.indexOf(id);

  if (idx !== -1) {
    selected.splice(idx, 1);
  } else {
    if (selected.length >= MAX_SEATS) {
      showToast('You can book a maximum of ' + MAX_SEATS + ' seats at a time', 'error');
      return;
    }
    selected.push(id);
  }
  btn.classList.toggle('selected');
  updateBar();
});

function updateBar() {
  const total = selected.reduce((t, id) => t + seatPrice(id, hall), 0);
  document.getElementById('selText').textContent = selected.length
    ? selected.length + ' seat(s): ' + sortSeats(selected).join(', ')
    : 'No seats selected';
  document.getElementById('selTotal').textContent = fmtINR(total);
  document.getElementById('proceedBtn').disabled = selected.length === 0;
}

function proceed() {
  // Re-check availability before proceeding, in case another user booked a seat in the meantime
  const nowBooked = getBookedSeats(show.id);
  const clash = selected.filter(s => nowBooked.indexOf(s) !== -1);
  if (clash.length) {
    showToast('Seat(s) ' + clash.join(', ') + ' were just booked by someone else. Please choose different seats.', 'error');
    selected = selected.filter(s => clash.indexOf(s) === -1);
    drawSeats();
    updateBar();
    return;
  }
  DB.set('pending', { userId: user.id, showId: show.id, seats: sortSeats(selected) });
  window.location.href = 'confirm.html';
}
