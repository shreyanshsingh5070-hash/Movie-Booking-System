# Member 3 - Somyani

**Responsibility:** Register, login, profile, booking history + cancellation

## Files

| File | Purpose |
|---|---|
| `register.html` + `js/auth.js` | Creating a new account (with validation) |
| `login.html` + `js/auth.js` | Login, show/hide password, `?next=` redirect |
| `profile.html` + `js/profile.js` | Edit details, change password, bookings and total spent |
| `history.html` + `js/history.js` | Upcoming / Past / Cancelled bookings, view ticket, cancel |

Shared files (identical across all members): `css/style.css`, `js/data.js`, `js/common.js`

## Features

- Register: name (3+ characters), valid email, mobile number (10 digits, starting with 6-9), password (6+ characters), confirm password
- A second account cannot be created with the same email
- After login, the user returns to the page they came from (`?next=`); only pages on this site are allowed
- Profile: name and mobile number can be changed, but not the email. Changing the password requires the current password
- My Bookings: 3 tabs, with a ticket button on every booking
- Cancellation: allowed up to **2 hours before** the show. The seats are released immediately

## Main Functions

- `currentUser()`, `requireLogin()`, `logoutUser()` (common.js) - session handling
- `getNextPage()` (auth.js) - safe redirect
- `canCancel()`, `draw()` (history.js)

## Note

The "Ticket" button leads to Shubham's `confirm.html`, and some navbar links lead to Shreyansh's pages,
which are not included in this folder. **Open `full_project` to see the complete flow.**
The Register / Login / Profile pages also work on their own within this folder.
