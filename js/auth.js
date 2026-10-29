/* auth.js - Login and Register (Member 3: Somyani) */

const errBox = document.getElementById('errBox');

function showError(msg) {
  errBox.textContent = msg;
  errBox.classList.remove('d-none');
}

// Where to redirect after login (?next=...). Only .html pages on this site are allowed
function getNextPage() {
  const next = getParam('next');
  if (next && /^[\w\-]+\.html(\?[\w=&%\-.]*)?$/.test(next)) return next;
  return 'index.html';
}

function startSession(user) {
  DB.set('session', user.id);
}

/* ---------- login ---------- */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  // Pass the next parameter on to the register link as well
  const next = getParam('next');
  if (next) document.getElementById('regLink').href = 'register.html?next=' + encodeURIComponent(next);

  // If the user is already logged in
  if (currentUser()) window.location.replace(getNextPage());

  document.getElementById('togglePw').addEventListener('click', function () {
    const pw = document.getElementById('password');
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    this.innerHTML = show ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const pass = document.getElementById('password').value;

    if (!email || !pass) { showError('Please enter both email and password.'); return; }

    const user = getUsers().find(u => u.email === email && u.password === pass);
    if (!user) { showError('Invalid email or password.'); return; }

    startSession(user);
    window.location.href = getNextPage();
  });
}

/* ---------- register ---------- */
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  if (currentUser()) window.location.replace('index.html');

  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const phone = document.getElementById('phone').value.trim();
    const pass = document.getElementById('password').value;
    const pass2 = document.getElementById('password2').value;

    if (name.length < 3) { showError('Name must be at least 3 characters long.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email address.'); return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { showError('Mobile number must be 10 digits and start with 6-9.'); return; }
    if (pass.length < 6) { showError('Password must be at least 6 characters long.'); return; }
    if (pass !== pass2) { showError('Passwords do not match.'); return; }

    const users = getUsers();
    if (users.some(u => u.email === email)) { showError('An account with this email already exists.'); return; }

    // NOTE: This is a demo project, so the password is stored in plain text.
    // A production system would use a backend with password hashing.
    const user = { id: uid('u'), name: name, email: email, phone: phone, password: pass, joined: dateStr(0) };
    users.push(user);
    DB.set('users', users);
    startSession(user);
    window.location.href = getNextPage();
  });
}
