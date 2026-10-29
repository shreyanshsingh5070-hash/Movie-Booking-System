/* admin-screens.js - Screens add / edit / delete (Member 4: Sidharth) */

let screenModal;

function drawScreens() {
  const list = getScreens();
  const box = document.getElementById('screenGrid');
  if (!list.length) {
    box.innerHTML = '<div class="col-12 text-center text-muted py-5">No screens available. Please add a screen first.</div>';
    return;
  }
  box.innerHTML = list.map(function (s) {
    const total = s.rows * s.cols;
    const showCount = getShows().filter(x => x.screenId === s.id).length;
    const normal = Math.floor(s.rows * 0.4), prem = Math.floor(s.rows * 0.8) - normal, rec = s.rows - normal - prem;
    return '<div class="col-md-6 col-xl-4"><div class="card-dark p-3 h-100">' +
      '<div class="d-flex justify-content-between align-items-start"><h5 class="mb-1">' + escapeHTML(s.name) + '</h5>' +
      '<div class="text-nowrap"><button class="btn btn-sm btn-outline-light me-1" data-edit="' + s.id + '"><i class="bi bi-pencil"></i></button>' +
      '<button class="btn btn-sm btn-outline-danger" data-del="' + s.id + '"><i class="bi bi-trash"></i></button></div></div>' +
      '<div class="text-muted small mb-3">' + s.rows + ' rows x ' + s.cols + ' seats = <strong class="text-white">' + total + ' seats</strong></div>' +
      '<div class="small">Normal rows: ' + normal + ' &middot; ' + fmtINR(PRICES.Normal) + '</div>' +
      '<div class="small">Premium rows: ' + prem + ' &middot; ' + fmtINR(PRICES.Premium) + '</div>' +
      '<div class="small">Recliner rows: ' + rec + ' &middot; ' + fmtINR(PRICES.Recliner) + '</div>' +
      '<div class="small text-muted mt-2">' + showCount + ' show(s) scheduled</div></div></div>';
  }).join('');
}

function updateTotal() {
  const r = parseInt(document.getElementById('sRows').value, 10) || 0;
  const c = parseInt(document.getElementById('sCols').value, 10) || 0;
  document.getElementById('sTotal').textContent = 'Total seats: ' + (r * c);
}

function openForm(sc) {
  document.getElementById('screenModalTitle').textContent = sc ? 'Edit Screen' : 'Add Screen';
  document.getElementById('sId').value = sc ? sc.id : '';
  document.getElementById('sName').value = sc ? sc.name : 'Screen ' + (getScreens().length + 1);
  document.getElementById('sRows').value = sc ? sc.rows : 8;
  document.getElementById('sCols').value = sc ? sc.cols : 10;
  updateTotal();
  screenModal.show();
}

function saveScreen(e) {
  e.preventDefault();
  const id = document.getElementById('sId').value;
  const name = document.getElementById('sName').value.trim();
  const rows = parseInt(document.getElementById('sRows').value, 10);
  const cols = parseInt(document.getElementById('sCols').value, 10);

  if (!name) { showToast('Please enter a screen name', 'error'); return; }
  if (!(rows >= 4 && rows <= 10)) { showToast('Rows must be between 4 and 10', 'error'); return; }
  if (!(cols >= 6 && cols <= 14)) { showToast('Seats per row must be between 6 and 14', 'error'); return; }

  const screens = getScreens();
  if (screens.some(s => s.id !== id && s.name.toLowerCase() === name.toLowerCase())) {
    showToast('A screen with this name already exists', 'error');
    return;
  }

  if (id) {
    const i = screens.findIndex(s => s.id === id);
    // Make sure shrinking the layout does not remove any booked seat
    const showIds = getShows().filter(s => s.screenId === id).map(s => s.id);
    const bad = getBookings().some(function (b) {
      if (b.status !== 'Confirmed' || showIds.indexOf(b.showId) === -1) return false;
      return b.seats.some(function (seat) {
        return (seat.charCodeAt(0) - 65) >= rows || parseInt(seat.slice(1), 10) > cols;
      });
    });
    if (bad) { showToast('This layout would leave some booked seats outside the screen. Please use a larger layout.', 'error'); return; }
    screens[i] = Object.assign(screens[i], { name: name, rows: rows, cols: cols });
    showToast('Screen updated successfully');
  } else {
    screens.push({ id: uid('sc'), name: name, rows: rows, cols: cols });
    showToast('Screen added successfully');
  }
  DB.set('screens', screens);
  screenModal.hide();
  drawScreens();
}

function deleteScreen(id) {
  const sc = getScreen(id);
  const scShows = getShows().filter(s => s.screenId === id);
  const ids = scShows.map(s => s.id);
  const live = getBookings().filter(b => b.status === 'Confirmed' && ids.indexOf(b.showId) !== -1 && !isPastShow(getShow(b.showId)));
  if (live.length) {
    showToast('This screen has ' + live.length + ' upcoming booking(s). Please cancel them first.', 'error');
    return;
  }
  if (!confirm('Delete "' + sc.name + '" and its ' + scShows.length + ' show(s)?')) return;
  DB.set('screens', getScreens().filter(s => s.id !== id));
  DB.set('shows', getShows().filter(s => s.screenId !== id));
  showToast('Screen deleted', 'info');
  drawScreens();
}

if (requireAdmin()) {
  renderAdminSide('screens');
  screenModal = new bootstrap.Modal(document.getElementById('screenModal'));
  drawScreens();

  document.getElementById('addScreenBtn').addEventListener('click', function () { openForm(null); });
  document.getElementById('screenForm').addEventListener('submit', saveScreen);
  document.getElementById('sRows').addEventListener('input', updateTotal);
  document.getElementById('sCols').addEventListener('input', updateTotal);
  document.getElementById('screenGrid').addEventListener('click', function (e) {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    if (ed) openForm(getScreen(ed.dataset.edit));
    if (del) deleteScreen(del.dataset.del);
  });
}
