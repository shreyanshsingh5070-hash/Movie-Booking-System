/* confirm.js - Booking summary, payment (demo) and ticket (Member 2: Shubham)
   Two modes:
     confirm.html            -> summary + payment for the current booking
     confirm.html?booking=ID -> ticket for an existing booking (printable)
*/

const FEE_PER_TICKET = 20;   // convenience fee
const mainBox = document.getElementById('mainBox');
const me = requireLogin();

if (me) {
  const bookingId = getParam('booking');
  if (bookingId) showTicket(bookingId);
  else showSummary();
}

/* ---------------- payment summary ---------------- */
function showSummary() {
  const pending = DB.get('pending', null);
  const show = pending ? getShow(pending.showId) : null;
  if (!pending || !show || pending.userId !== me.id) {
    mainBox.innerHTML = '<div class="text-center py-5"><h4>No pending booking found</h4><a href="shows.html" class="btn btn-brand mt-3">Browse Shows</a></div>';
    return;
  }
  if (isPastShow(show)) {
    mainBox.innerHTML = '<div class="text-center py-5"><h4>This show has already started</h4><a href="shows.html" class="btn btn-brand mt-3">Choose Another Show</a></div>';
    return;
  }
  const movie = getMovie(show.movieId);
  const hall = getScreen(show.screenId);

  // Count by seat type
  const counts = { Normal: 0, Premium: 0, Recliner: 0 };
  pending.seats.forEach(function (s) { counts[seatType(s.charCodeAt(0) - 65, hall.rows)]++; });
  const base = pending.seats.reduce((t, s) => t + seatPrice(s, hall), 0);
  const fee = pending.seats.length * FEE_PER_TICKET;
  const total = base + fee;

  let rows = '';
  Object.keys(counts).forEach(function (t) {
    if (counts[t]) rows += '<tr><td>' + t + ' x ' + counts[t] + '</td><td class="text-end">' + fmtINR(counts[t] * PRICES[t]) + '</td></tr>';
  });

  mainBox.innerHTML =
    '<h3 class="section-title mb-4">Review &amp; Pay</h3>' +
    '<div class="row g-4">' +
    '<div class="col-lg-6"><div class="card-dark p-4 h-100">' +
    '<h5>' + escapeHTML(movie.title) + '</h5>' +
    '<div class="text-muted mb-3">' + escapeHTML(movie.language) + ' &middot; ' + movie.certificate + '</div>' +
    '<div class="mb-2"><i class="bi bi-calendar3 me-2 text-brand"></i>' + fmtDateLong(show.date) + '</div>' +
    '<div class="mb-2"><i class="bi bi-clock me-2 text-brand"></i>' + fmtTime(show.time) + '</div>' +
    '<div class="mb-2"><i class="bi bi-projector me-2 text-brand"></i>' + escapeHTML(hall.name) + '</div>' +
    '<div class="mb-3"><i class="bi bi-grid-3x3-gap me-2 text-brand"></i>Seats: <strong>' + pending.seats.join(', ') + '</strong></div>' +
    '<table class="table table-dark table-sm mb-0"><tbody>' + rows +
    '<tr><td>Convenience fee (' + pending.seats.length + ' x ' + fmtINR(FEE_PER_TICKET) + ')</td><td class="text-end">' + fmtINR(fee) + '</td></tr>' +
    '<tr class="fw-bold"><td>Total</td><td class="text-end text-brand fs-5">' + fmtINR(total) + '</td></tr>' +
    '</tbody></table></div></div>' +

    '<div class="col-lg-6"><div class="card-dark p-4">' +
    '<h5 class="mb-3">Payment</h5>' +
    '<div class="alert alert-warning small py-2"><i class="bi bi-info-circle me-1"></i>This is a demo project - no real payment is processed. You may enter any dummy details.</div>' +
    '<div class="mb-3">' +
    '<div class="form-check"><input class="form-check-input" type="radio" name="pay" id="payUpi" value="UPI" checked><label class="form-check-label" for="payUpi">UPI</label></div>' +
    '<div class="form-check"><input class="form-check-input" type="radio" name="pay" id="payCard" value="Card"><label class="form-check-label" for="payCard">Credit / Debit Card</label></div>' +
    '<div class="form-check"><input class="form-check-input" type="radio" name="pay" id="payNet" value="Net Banking"><label class="form-check-label" for="payNet">Net Banking</label></div>' +
    '</div>' +

    '<div id="boxUpi"><label class="form-label">UPI ID</label><input type="text" id="upiId" class="form-control" placeholder="name@bank"></div>' +
    '<div id="boxCard" class="d-none">' +
    '<div class="mb-2"><label class="form-label">Card Number</label><input type="text" id="cardNo" class="form-control" maxlength="19" placeholder="1234 5678 9012 3456"></div>' +
    '<div class="mb-2"><label class="form-label">Name on card</label><input type="text" id="cardName" class="form-control"></div>' +
    '<div class="row g-2"><div class="col-6"><label class="form-label">Expiry</label><input type="text" id="cardExp" class="form-control" maxlength="5" placeholder="MM/YY"></div>' +
    '<div class="col-6"><label class="form-label">CVV</label><input type="password" id="cardCvv" class="form-control" maxlength="3" placeholder="***"></div></div></div>' +
    '<div id="boxNet" class="d-none"><label class="form-label">Bank</label><select id="bankSel" class="form-select">' +
    '<option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Punjab National Bank</option><option>Axis Bank</option></select></div>' +

    '<button class="btn btn-brand btn-lg w-100 mt-4" id="payBtn">Pay ' + fmtINR(total) + '</button>' +
    '<a href="seats.html?show=' + show.id + '" class="btn btn-link text-muted w-100 mt-1">Change seats?</a>' +
    '</div></div></div>';

  // Show the matching form when the payment mode changes
  document.querySelectorAll('input[name=pay]').forEach(function (r) {
    r.addEventListener('change', function () {
      document.getElementById('boxUpi').classList.toggle('d-none', r.value !== 'UPI' || !r.checked);
      document.getElementById('boxCard').classList.toggle('d-none', r.value !== 'Card' || !r.checked);
      document.getElementById('boxNet').classList.toggle('d-none', r.value !== 'Net Banking' || !r.checked);
    });
  });

  document.getElementById('payBtn').addEventListener('click', function () {
    payNow(pending, show, total, fee);
  });
}

function payNow(pending, show, total, fee) {
  const mode = document.querySelector('input[name=pay]:checked').value;
  let ref = '';

  if (isPastShow(show)) { showToast('This show has already started', 'error'); return; }

  // Basic validation
  if (mode === 'UPI') {
    const upi = document.getElementById('upiId').value.trim();
    if (!/^[\w.\-]{2,}@[\w]{2,}$/.test(upi)) { showToast('Please enter a valid UPI ID (e.g. name@bank)', 'error'); return; }
    ref = upi;
  } else if (mode === 'Card') {
    const no = document.getElementById('cardNo').value.replace(/\s/g, '');
    const name = document.getElementById('cardName').value.trim();
    const exp = document.getElementById('cardExp').value.trim();
    const cvv = document.getElementById('cardCvv').value.trim();
    if (!/^\d{16}$/.test(no)) { showToast('Card number must be 16 digits', 'error'); return; }
    if (name.length < 3) { showToast('Please enter the name on the card', 'error'); return; }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) { showToast('Enter the expiry date in MM/YY format', 'error'); return; }
    const expMonth = parseInt(exp.slice(0, 2), 10), expYear = 2000 + parseInt(exp.slice(3), 10), today = new Date();
    if (expYear < today.getFullYear() || (expYear === today.getFullYear() && expMonth < today.getMonth() + 1)) { showToast('This card has expired', 'error'); return; }
    if (!/^\d{3}$/.test(cvv)) { showToast('CVV must be 3 digits', 'error'); return; }
    ref = 'xxxx ' + no.slice(-4);   // The full card number is never stored
  } else {
    ref = document.getElementById('bankSel').value;
  }

  // Final check: are the seats still available?
  const taken = getBookedSeats(show.id);
  const clash = pending.seats.filter(s => taken.indexOf(s) !== -1);
  if (clash.length) {
    showToast('Seat(s) ' + clash.join(', ') + ' have already been booked by someone else. Please choose your seats again.', 'error');
    setTimeout(function () { window.location.href = 'seats.html?show=' + show.id; }, 1800);
    return;
  }

  const booking = {
    id: makeBookingId(),
    userId: me.id,
    userName: me.name,
    movieId: show.movieId,
    showId: show.id,
    seats: pending.seats,
    amount: total,
    fee: fee,
    mode: mode,
    payRef: ref,
    time: new Date().toISOString(),
    status: 'Confirmed'
  };
  const all = getBookings();
  all.push(booking);
  DB.set('bookings', all);
  DB.remove('pending');

  window.location.href = 'confirm.html?booking=' + booking.id;
}

/* ---------------- ticket ---------------- */
function showTicket(id) {
  const b = getBookings().find(x => x.id === id);
  if (!b || b.userId !== me.id) {
    mainBox.innerHTML = '<div class="text-center py-5"><h4>Ticket not found</h4><a href="history.html" class="btn btn-brand mt-3">My Bookings</a></div>';
    return;
  }
  const show = getShow(b.showId);
  const movie = getMovie(b.movieId);
  const hall = show ? getScreen(show.screenId) : null;
  const cancelled = b.status === 'Cancelled';

  mainBox.innerHTML =
    '<div class="text-center mb-4 no-print">' +
    (cancelled
      ? '<i class="bi bi-x-circle-fill text-danger" style="font-size:3rem"></i><h3 class="mt-2">Booking Cancelled</h3>'
      : '<i class="bi bi-check-circle-fill text-success" style="font-size:3rem"></i><h3 class="mt-2">Booking Confirmed!</h3><p class="text-muted">Your ticket is below. Please show this ticket (or your booking ID) at the theatre.</p>') +
    '</div>' +

    '<div class="ticket">' +
    '<div class="ticket-head"><div class="label-sm" style="color:#ffb3b8">CineBook &middot; E-Ticket</div>' +
    '<h3 class="mb-0 mt-1">' + escapeHTML(movie ? movie.title : 'Movie') + '</h3>' +
    '<div class="small opacity-75">' + (movie ? escapeHTML(movie.language) + ' &middot; ' + movie.certificate : '') + '</div></div>' +
    '<div class="ticket-body"><div class="row g-3">' +
    '<div class="col-6"><div class="label-sm">Date</div>' + (show ? fmtDateLong(show.date) : '-') + '</div>' +
    '<div class="col-6"><div class="label-sm">Time</div>' + (show ? fmtTime(show.time) : '-') + '</div>' +
    '<div class="col-6"><div class="label-sm">Screen</div>' + (hall ? escapeHTML(hall.name) : '-') + '</div>' +
    '<div class="col-6"><div class="label-sm">Seats</div><strong>' + b.seats.join(', ') + '</strong></div>' +
    '<div class="col-6"><div class="label-sm">Name</div>' + escapeHTML(b.userName) + '</div>' +
    '<div class="col-6"><div class="label-sm">Amount Paid</div>' + fmtINR(b.amount) + ' <span class="small text-muted">(' + escapeHTML(b.mode) + ')</span></div>' +
    '</div></div>' +
    '<div class="ticket-cut"></div>' +
    '<div class="ticket-body"><div class="row align-items-center g-3">' +
    '<div class="col-sm-5"><div class="label-sm">Booking ID</div><div class="fs-4 fw-bold text-brand" style="letter-spacing:2px">' + b.id + '</div>' +
    '<div class="small text-muted">' + new Date(b.time).toLocaleString('en-IN') + '</div>' +
    (cancelled ? '<span class="badge bg-danger mt-1">CANCELLED</span>' : '<span class="badge bg-success mt-1">CONFIRMED</span>') + '</div>' +
    '<div class="col-sm-7"><div class="barcode"></div></div></div></div></div>' +

    '<div class="text-center mt-4 no-print">' +
    '<button class="btn btn-brand me-2" onclick="window.print()"><i class="bi bi-printer me-1"></i>Print / Save as PDF</button>' +
    '<a href="history.html" class="btn btn-outline-light me-2">My Bookings</a>' +
    '<a href="index.html" class="btn btn-outline-light">Home</a></div>';
}
