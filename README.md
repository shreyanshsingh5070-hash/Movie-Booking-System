# Member 1 - Shreyansh

**Responsibility:** Home page, movie listing (search + filters), movie details + reviews

## Files

| File | Purpose |
|---|---|
| `index.html` + `js/home.js` | Banner slider (top 3 rated), quick search, Now Showing, Coming Soon |
| `movies.html` + `js/movies.js` | Complete movie list, search, language / genre / status filters, sorting |
| `movie.html` + `js/movie-details.js` | Movie details, trailer button, submitting and viewing reviews |

Shared files (identical across all members): `css/style.css`, `js/data.js`, `js/common.js`

## Features

- Banner slider showing the 3 highest-rated movies
- Search by title, cast or director (results update as you type)
- Language dropdown, genre chips, Now Showing / Coming Soon filter, sorting (rating / A-Z / duration)
- Movie details: poster, certificate, duration, cast, director, description
- "Watch Trailer" opens a YouTube search
- Reviews: logged-in users can submit a star rating and feedback (minimum 5 characters)

## Main Functions

- `applyFilters()` (movies.js) - applies all filters and redraws the grid
- `movieCardHTML()` (common.js) - generates the movie card HTML, used on both the home and movies pages
- `drawReviews()`, `drawReviewForm()` (movie-details.js)

## Note

This folder contains only Shreyansh's pages. Links such as "Book Tickets" and "Login" point to pages
belonging to other members, which are not included here. **Use the full project package (`CineBook_Full_Project.zip`) to see the complete flow.**
