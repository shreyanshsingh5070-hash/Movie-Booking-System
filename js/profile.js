/* profile.js - User profile (Member 3: Somyani) */

const me = requireLogin();

function fillProfile() {
  const u = currentUser();
  document.getElementById('avatar').textContent = u.name.charAt(0).toUpperCase();
  document.getElementById('pName').textContent = u.name;
  document.getElementById('pEmail').textContent = u.email;
  document.getElementById('pJoined').textContent = u.joined ? 'Member since ' + fmtDate(u.joined) : '';
  document.getElementById('fName').value = u.name;
  document.getElementById('fPhone').value = u.phone || '';
  document.getElementById('fEmail').value = u.email;

  const mine = getBookings().filter(b => b.userId === u.id && b.status === 'Confirmed');
  document.getElementById('statBookings').textContent = mine.length;
  document.getElementById('statSpent').textContent = fmtINR(mine.reduce((t, b) => t + b.amount, 0));
}

// Helper that updates the user object and saves it back
function saveUser(changes) {
  const users = getUsers();
  const i = users.findIndex(u => u.id === me.id);
  users[i] = Object.assign(users[i], changes);
  DB.set('users', users);
}

if (me) {
  fillProfile();

  document.getElementById('detailsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('fName').value.trim();
    const phone = document.getElementById('fPhone').value.trim();
    if (name.length < 3) { showToast('Name must be at least 3 characters long', 'error'); return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { showToast('Please enter a valid 10-digit mobile number', 'error'); return; }
    saveUser({ name: name, phone: phone });
    renderNavbar('profile');   // Refresh the navbar to show the updated name
    fillProfile();
    showToast('Profile updated successfully');
  });

  document.getElementById('passForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const u = currentUser();
    const oldP = document.getElementById('oldPass').value;
    const newP = document.getElementById('newPass').value;
    const newP2 = document.getElementById('newPass2').value;

    if (oldP !== u.password) { showToast('Current password is incorrect', 'error'); return; }
    if (newP.length < 6) { showToast('New password must be at least 6 characters long', 'error'); return; }
    if (newP !== newP2) { showToast('New passwords do not match', 'error'); return; }
    if (newP === oldP) { showToast('New password must be different from the current password', 'error'); return; }

    saveUser({ password: newP });
    this.reset();
    showToast('Password changed successfully');
  });
}
