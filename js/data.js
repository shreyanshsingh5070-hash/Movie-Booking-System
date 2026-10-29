/* =========================================================
   data.js  -  Shared storage + sample data (CineBook)
   There is no backend, so all data is stored in the browser's
   localStorage. Every key is prefixed with "cb_".
   ========================================================= */

const DB = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('cb_' + key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, val) {
    localStorage.setItem('cb_' + key, JSON.stringify(val));
  },
  remove(key) {
    localStorage.removeItem('cb_' + key);
  }
};

// ---------- ticket prices (by seat type) ----------
const PRICES = { Normal: 150, Premium: 250, Recliner: 400 };
const MAX_SEATS = 8;
const DATA_VERSION = 2;   // increase this whenever the sample data changes, so older saved data is refreshed
const SHOW_TIMES = ['10:00', '13:15', '16:30', '19:45'];

// ---------- helper functions ----------
function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Booking ID such as CBK7M2QX9A (ambiguous characters 0/O/1/I are excluded)
function makeBookingId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'CB';
  for (let i = 0; i < 8; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

function pad(n) { return String(n).padStart(2, '0'); }

// Converts a date to a YYYY-MM-DD string (local time)
function dateStr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + (offsetDays || 0));
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function fmtDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtDateLong(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtTime(t) {
  const parts = t.split(':');
  let h = parseInt(parts[0], 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return pad(h) + ':' + parts[1] + ' ' + ampm;
}

function fmtINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function showDateTime(show) {
  return new Date(show.date + 'T' + show.time + ':00');
}

function isPastShow(show) {
  return showDateTime(show) < new Date();
}

// Seat type by row index: front rows are Normal, middle rows are Premium, last rows are Recliner
function seatType(rowIdx, totalRows) {
  const normalRows = Math.floor(totalRows * 0.4);
  const premiumRows = Math.floor(totalRows * 0.8);
  if (rowIdx < normalRows) return 'Normal';
  if (rowIdx < premiumRows) return 'Premium';
  return 'Recliner';
}

function rowLetter(i) { return String.fromCharCode(65 + i); }

// Sorts seat IDs naturally (A1, A2, ... A10) instead of alphabetically (A1, A10, A2)
function sortSeats(list) {
  return list.slice().sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0) || parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
}

// ---------- getters ----------
function getMovies() { return DB.get('movies', []); }
function getScreens() { return DB.get('screens', []); }
function getShows() { return DB.get('shows', []); }
function getBookings() { return DB.get('bookings', []); }
function getUsers() { return DB.get('users', []); }

function getMovie(id) { return getMovies().find(m => m.id === id); }
function getScreen(id) { return getScreens().find(s => s.id === id); }
function getShow(id) { return getShows().find(s => s.id === id); }

// Booked seats for a show (cancelled bookings are excluded)
function getBookedSeats(showId) {
  const seats = [];
  getBookings().forEach(b => {
    if (b.showId === showId && b.status === 'Confirmed') seats.push(...b.seats);
  });
  return seats;
}

function seatPrice(seatId, screen) {
  const rowIdx = seatId.charCodeAt(0) - 65;
  return PRICES[seatType(rowIdx, screen.rows)];
}

// A gradient with the title is used in place of a poster image (no image files required)
function posterStyle(m) {
  return 'background: linear-gradient(160deg, ' + m.c1 + ', ' + m.c2 + ');';
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- sample data ----------
function seedMovies() {
  return [
    { id: 'm1', title: 'Jawan', genre: 'Action', language: 'Hindi', duration: 169, rating: 8.1, certificate: 'UA',
      director: 'Atlee', cast: 'Shah Rukh Khan, Nayanthara, Vijay Sethupathi', status: 'now', c1: '#b71c1c', c2: '#1a1a1a',
      desc: 'A man assembles a team to pursue his mission and take on a corrupt system. The film blends high-octane action, emotion and drama.' },
    { id: 'm2', title: 'Pathaan', genre: 'Action', language: 'Hindi', duration: 146, rating: 7.4, certificate: 'UA',
      director: 'Siddharth Anand', cast: 'Shah Rukh Khan, Deepika Padukone, John Abraham', status: 'now', c1: '#e65100', c2: '#212121',
      desc: 'A spy sets out on a mission to protect the nation and comes face to face with a dangerous adversary.' },
    { id: 'm3', title: '3 Idiots', genre: 'Comedy', language: 'Hindi', duration: 170, rating: 8.4, certificate: 'U',
      director: 'Rajkumar Hirani', cast: 'Aamir Khan, R. Madhavan, Sharman Joshi', status: 'now', c1: '#f9a825', c2: '#4e342e',
      desc: 'The story of three friends who navigate the pressures of engineering college while striving to follow their dreams.' },
    { id: 'm4', title: 'Dangal', genre: 'Drama', language: 'Hindi', duration: 161, rating: 8.3, certificate: 'U',
      director: 'Nitesh Tiwari', cast: 'Aamir Khan, Fatima Sana Shaikh, Sanya Malhotra', status: 'now', c1: '#2e7d32', c2: '#1b1b1b',
      desc: 'A wrestler dedicates his life to training his daughters to become wrestling champions.' },
    { id: 'm5', title: 'Animal', genre: 'Thriller', language: 'Hindi', duration: 201, rating: 6.9, certificate: 'A',
      director: 'Sandeep Reddy Vanga', cast: 'Ranbir Kapoor, Anil Kapoor, Bobby Deol', status: 'now', c1: '#4a148c', c2: '#0d0d0d',
      desc: 'An intense story of the bond between a son and his father, which spirals into violence and obsession.' },
    { id: 'm6', title: 'Stree 2', genre: 'Horror Comedy', language: 'Hindi', duration: 135, rating: 7.5, certificate: 'UA',
      director: 'Amar Kaushik', cast: 'Shraddha Kapoor, Rajkummar Rao, Pankaj Tripathi', status: 'now', c1: '#ad1457', c2: '#1a1a2e',
      desc: 'A new terror grips the town of Chanderi, and a group of friends joins forces to fight it.' },
    { id: 'm7', title: 'RRR', genre: 'Action', language: 'Telugu', duration: 182, rating: 7.9, certificate: 'UA',
      director: 'S. S. Rajamouli', cast: 'Ram Charan, Jr NTR, Alia Bhatt', status: 'now', c1: '#bf360c', c2: '#0a2a43',
      desc: 'Two revolutionaries from very different paths become friends and stand together against British rule.' },
    { id: 'm8', title: 'Kalki 2898 AD', genre: 'Sci-Fi', language: 'Telugu', duration: 181, rating: 7.0, certificate: 'UA',
      director: 'Nag Ashwin', cast: 'Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone', status: 'now', c1: '#006064', c2: '#12121f',
      desc: 'In a futuristic world, a warrior emerges who bridges the ancient and the modern eras.' },
    { id: 'm9', title: 'Pushpa 2', genre: 'Action', language: 'Telugu', duration: 200, rating: 0, certificate: 'UA',
      director: 'Sukumar', cast: 'Allu Arjun, Rashmika Mandanna, Fahadh Faasil', status: 'soon', c1: '#827717', c2: '#1b1b1b',
      desc: 'The story of Pushpa Raj continues as he now faces even more powerful enemies.' },
    { id: 'm10', title: 'Fighter', genre: 'Action', language: 'Hindi', duration: 166, rating: 0, certificate: 'UA',
      director: 'Siddharth Anand', cast: 'Hrithik Roshan, Deepika Padukone, Anil Kapoor', status: 'soon', c1: '#1565c0', c2: '#0d1b2a',
      desc: 'A team of fearless Air Force pilots and their dangerous mission.' }
  ];
}

function seedScreens() {
  return [
    { id: 'sc1', name: 'Screen 1', rows: 8, cols: 10 },
    { id: 'sc2', name: 'Screen 2', rows: 8, cols: 10 },
    { id: 'sc3', name: 'Screen 3 (Gold)', rows: 6, cols: 8 }
  ];
}

// Generates shows for the next 5 days. Each screen + date + time slot gets exactly one movie (no clashes)
function seedShows(movies, screens) {
  const running = movies.filter(m => m.status === 'now');
  const shows = [];
  for (let d = 0; d < 5; d++) {
    screens.forEach((sc, si) => {
      SHOW_TIMES.forEach((t, ti) => {
        const m = running[(d + si * 3 + ti) % running.length];
        shows.push({ id: uid('sh'), movieId: m.id, screenId: sc.id, date: dateStr(d), time: t });
      });
    });
  }
  return shows;
}

function seedReviews() {
  return [
    { id: 'r1', movieId: 'm3', name: 'Rohit S.', stars: 5, text: 'No matter how many times you watch it, it never gets old. An all-time favourite!', date: dateStr(-12) },
    { id: 'r2', movieId: 'm3', name: 'Priya M.', stars: 5, text: 'It makes you laugh and it makes you think.', date: dateStr(-9) },
    { id: 'r3', movieId: 'm1', name: 'Aman K.', stars: 4, text: 'The action scenes are excellent, though the second half felt a little long.', date: dateStr(-6) },
    { id: 'r4', movieId: 'm4', name: 'Neha G.', stars: 5, text: 'The wrestling scenes gave me goosebumps.', date: dateStr(-4) },
    { id: 'r5', movieId: 'm6', name: 'Karan T.', stars: 4, text: 'Hilarious comedy, perfect for watching with the family.', date: dateStr(-2) }
  ];
}

// Seeds the sample data the first time the page is opened
function initData() {
  if (!DB.get('movies', null)) {
    DB.set('movies', seedMovies());
    DB.set('screens', seedScreens());
    DB.set('shows', seedShows(getMovies(), getScreens()));
    DB.set('reviews', seedReviews());
    DB.set('bookings', []);
    DB.set('users', []);
    DB.set('dataVersion', DATA_VERSION);
  }
  // If all existing shows are in the past, generate new ones
  const today = dateStr(0);
  const upcoming = getShows().filter(s => s.date >= today);
  if (upcoming.length === 0 && getMovies().length && getScreens().length) {
    DB.set('shows', getShows().concat(seedShows(getMovies(), getScreens())));
  }
}

// Refreshes sample content saved by an older version of the app (for example, outdated movie descriptions
// and reviews). Bookings, users and any movies added by the admin are left untouched.
function migrateData() {
  if (DB.get('dataVersion', 0) >= DATA_VERSION) return;

  const sampleMovies = seedMovies();
  const movies = getMovies();
  movies.forEach(function (m) {
    const sample = sampleMovies.find(s => s.id === m.id && s.title === m.title);
    if (sample) m.desc = sample.desc;
  });
  DB.set('movies', movies);

  const sampleReviews = seedReviews();
  const reviews = DB.get('reviews', []);
  reviews.forEach(function (r) {
    const sample = sampleReviews.find(s => s.id === r.id);
    if (sample) r.text = sample.text;
  });
  DB.set('reviews', reviews);

  DB.set('dataVersion', DATA_VERSION);
}

initData();
migrateData();
