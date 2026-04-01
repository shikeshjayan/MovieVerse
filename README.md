# MovieVerse

**MovieVerse** is a full-stack movie and TV show discovery platform that combines real-time media data with AI-powered personalization. Users can browse trending content, get intelligent recommendations based on their watch history, search using natural language, manage watchlists, and write reviews — all within a clean, responsive interface.

Built for movie enthusiasts who want more than a basic catalog: MovieVerse learns your taste and surfaces content you'll actually want to watch.

**Live Demo:** [movieverse-ai.vercel.app](https://movieverse-ai.vercel.app) &nbsp;|&nbsp; **API:** [movieverse-s4e9.onrender.com/api](https://movieverse-s4e9.onrender.com/api)

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)
[![Deployed on Render](https://img.shields.io/badge/Deployed-Render-purple)](https://render.com)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [AI & ML Implementation](#ai--ml-implementation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Category                    | Details                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| **Discovery**               | Browse trending, top-rated, now playing, and upcoming movies & TV shows                   |
| **AI Recommendations**      | Personalized suggestions powered by Hybrid Neural Collaborative Filtering (TensorFlow.js) |
| **Smart Search**            | Natural language search using Google Gemini 2.5 Flash                                     |
| **Authentication**          | Register, login, password reset via email                                                 |
| **Watchlist & Watch Later** | Save and organize content to watch                                                        |
| **Reviews & Ratings**       | Rate and review movies and shows; like/dislike community reviews                          |
| **Watch History**           | Track everything you've watched                                                           |
| **Notifications**           | Email reminders for new releases                                                          |
| **Admin Dashboard**         | Manage users, content, reviews, and support tickets                                       |
| **Responsive Design**       | Fully optimized for desktop and mobile                                                    |

---

## Tech Stack

### Frontend

- **React 19** with Vite
- **TailwindCSS 4** for utility-first styling
- **Framer Motion** for animations
- **React Router DOM** for client-side navigation
- **Axios** for HTTP requests
- **TensorFlow.js** for client-side ML inference

### Backend

- **Express.js** (ES Modules)
- **MongoDB** with Mongoose ODM
- **JWT** (HTTP-only cookies) for secure authentication
- **Node-Cron** for scheduled model training
- **Google Gemini AI** for natural language search
- **TensorFlow.js** for recommendation model training
- **Cloudinary** for image storage and delivery

---

## Screenshots

| Home                                                          | Movies                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| ![Home](client/screenshots/movieverse-ai.vercel.app_home.png) | ![Movies](client/screenshots/movieverse-ai.vercel.app_movies.png) |

| TV Shows                                                             | Explore                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ![TV Shows](client/screenshots/movieverse-ai.vercel.app_tvshows.png) | ![Explore](client/screenshots/movieverse-ai.vercel.app_explore.png) |

| Smart Search                                                                  | Recommendations                                                                     |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| ![Smart Search](client/screenshots/movieverse-ai.vercel.app_smart-search.png) | ![Recommendations](client/screenshots/movieverse-ai.vercel.app_recommendations.png) |

| User Dashboard                                                                    | Admin Dashboard                                                                     |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| ![User Dashboard](client/screenshots/movieverse-ai.vercel.app_user_dashbaord.png) | ![Admin Dashboard](client/screenshots/movieverse-ai.vercel.app_admin_dashboard.png) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [TMDB API Key](https://www.themoviedb.org/settings/api)
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- [Cloudinary Account](https://cloudinary.com)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/shikeshjayan/MovieVerse.git
cd MovieVerse
```

**2. Configure environment variables**

Create a `.env` file in the `server/` directory:

```env
# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/movieverse

# Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# APIs
TMDB_API_KEY=your-tmdb-api-key
GEMINI_API_KEY=your-gemini-api-key

# Email (for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# App
NODE_ENV=development
PORT=5000
FRONT_END_URL=http://localhost:5173
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

> **Tip:** Copy `.env.example` files from each directory as a starting point.

**3. Install dependencies**

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

**4. Start development servers**

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

The app will be available at **http://localhost:5173**

---

## Project Structure

```
MovieVerse/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── admin/              # Admin dashboard components
│   │   ├── components/         # Shared/reusable components
│   │   ├── config/             # App configuration
│   │   ├── context/            # React context providers
│   │   ├── dashboard/          # User dashboard pages
│   │   ├── features/           # Feature modules
│   │   ├── home/               # Home page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Layout wrappers
│   │   ├── movies/             # Movie-specific components
│   │   ├── pages/              # Top-level page components
│   │   ├── services/           # Axios API service layer
│   │   ├── tvshows/            # TV show components
│   │   ├── ui/                 # Base UI components
│   │   └── utils/              # Utility functions
│   ├── public/                 # Static assets
│   └── screenshots/            # Project screenshots
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/             # App & DB configuration
│   │   ├── controllers/        # Route handler logic
│   │   ├── database/           # MongoDB connection
│   │   ├── jobs/               # Cron jobs (e.g., model training)
│   │   ├── middlewares/        # Auth, error, validation middleware
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic layer
│   │   └── utils/              # Helpers and utilities
│   └── models/                 # Trained ML model files
│
├── vercel.json                 # Vercel deployment config
├── render.yaml                 # Render deployment config
└── README.md
```

---

## API Reference

**Base URL:** `https://movieverse-s4e9.onrender.com/api`

**Authentication:** HTTP-only cookie (set on login). Pass `withCredentials: true` on all requests.

**Content-Type:** `application/json`

### Authentication

| Method | Endpoint                      | Description                      | Auth |
| ------ | ----------------------------- | -------------------------------- | ---- |
| POST   | `/auth/register`              | Register a new user              | —    |
| POST   | `/auth/login`                 | Login and receive session cookie | —    |
| POST   | `/auth/logout`                | Clear session cookie             | ✓    |
| GET    | `/auth/me`                    | Get current user info            | ✓    |
| GET    | `/auth/profile`               | Get full user profile            | ✓    |
| PATCH  | `/auth/update-profile`        | Update profile details           | ✓    |
| PATCH  | `/auth/change-password`       | Change password                  | ✓    |
| POST   | `/auth/forgot-password`       | Request password reset email     | —    |
| POST   | `/auth/reset-password/:token` | Reset password with token        | —    |

<details>
<summary>Example: Register</summary>

```bash
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "adminKey": "mysecretadminkey123"
}
Note: The adminKey field is optional. If provided and it matches the ADMIN_SECRET_KEY environment variable, the account is registered with the admin role. Leave it out for a regular user account.
```

</details>

<details>
<summary>Example: Login</summary>

```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

# Response
{
  "success": true,
  "user": {
    "_id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
# Auth token is set as an HTTP-only cookie automatically
```

</details>

---

### Discovery

| Method | Endpoint              | Description                               | Auth |
| ------ | --------------------- | ----------------------------------------- | ---- |
| GET    | `/home`               | Homepage data (trending, top-rated, etc.) | —    |
| GET    | `/movies`             | Paginated movie list                      | —    |
| GET    | `/movies/:id`         | Movie details                             | —    |
| GET    | `/movies/:id/similar` | Similar movies                            | —    |
| GET    | `/movies/:id/credits` | Cast & crew                               | —    |
| GET    | `/movies/:id/trailer` | Trailer link                              | —    |
| GET    | `/movies/popular`     | Popular movies                            | —    |
| GET    | `/movies/now_playing` | Now playing                               | —    |
| GET    | `/movies/top_rated`   | Top rated                                 | —    |
| GET    | `/movies/upcoming`    | Upcoming releases                         | —    |
| GET    | `/movies/trending`    | Trending movies                           | —    |
| GET    | `/movies/search`      | Search movies                             | —    |
| GET    | `/shows`              | Paginated TV show list                    | —    |
| GET    | `/shows/:id`          | TV show details                           | —    |
| GET    | `/shows/:id/similar`  | Similar shows                             | —    |
| GET    | `/shows/popular`      | Popular TV shows                          | —    |
| GET    | `/shows/top_rated`    | Top rated shows                           | —    |
| GET    | `/shows/trending`     | Trending shows                            | —    |
| GET    | `/shows/airing_today` | Airing today                              | —    |
| GET    | `/shows/search`       | Search shows                              | —    |

**Query Parameters (Movies & Shows)**

| Parameter | Type   | Description                                  | Default      |
| --------- | ------ | -------------------------------------------- | ------------ |
| `page`    | number | Page number                                  | 1            |
| `limit`   | number | Results per page                             | 20           |
| `sort`    | string | `popularity`, `vote_average`, `release_date` | `popularity` |
| `genre`   | number | Filter by TMDB genre ID                      | —            |

```bash
# Example: Top-rated action movies, page 2
GET /api/movies?sort=vote_average&genre=28&page=2
```

---

### Watchlist & Lists

| Method | Endpoint               | Description             | Auth |
| ------ | ---------------------- | ----------------------- | ---- |
| GET    | `/wishlist`            | Get all wishlist items  | ✓    |
| POST   | `/wishlist`            | Add to wishlist         | ✓    |
| DELETE | `/wishlist/:mediaId`   | Remove from wishlist    | ✓    |
| GET    | `/watchlater`          | Get watch later list    | ✓    |
| POST   | `/watchlater`          | Add to watch later      | ✓    |
| DELETE | `/watchlater/:mediaId` | Remove from watch later | ✓    |
| GET    | `/history`             | Get watch history       | ✓    |
| POST   | `/history`             | Add to history          | ✓    |
| DELETE | `/history`             | Clear all history       | ✓    |
| DELETE | `/history/:mediaId`    | Remove single item      | ✓    |

<details>
<summary>Example: Add to Wishlist</summary>

```bash
POST /api/wishlist
{
  "mediaId": 550,
  "mediaType": "movie",
  "title": "Fight Club",
  "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
}
```

</details>

---

### Reviews

| Method | Endpoint                          | Description             | Auth |
| ------ | --------------------------------- | ----------------------- | ---- |
| GET    | `/reviews/:movieId`               | Get reviews for a title | —    |
| GET    | `/reviews/my-reviews`             | Get your reviews        | ✓    |
| POST   | `/reviews`                        | Submit a review         | ✓    |
| PATCH  | `/reviews/:reviewId`              | Edit your review        | ✓    |
| DELETE | `/reviews/:reviewId`              | Delete your review      | ✓    |
| PATCH  | `/reviews/:reviewId/spoiler`      | Toggle spoiler flag     | ✓    |
| POST   | `/reviews/:reviewId/like-dislike` | React to a review       | ✓    |

<details>
<summary>Example: Submit a Review</summary>

```bash
POST /api/reviews
{
  "movieId": 550,
  "media_type": "movie",
  "rating": 4,
  "comment": "An unforgettable film.",
  "spoiler": false
}
```

</details>

---

### Recommendations

| Method | Endpoint                    | Description                      | Auth  |
| ------ | --------------------------- | -------------------------------- | ----- |
| GET    | `/recommendations`          | Get personalized recommendations | ✓     |
| GET    | `/recommendations/status`   | Model training status            | ✓     |
| GET    | `/recommendations/evaluate` | Model accuracy metrics           | ✓     |
| POST   | `/recommendations/retrain`  | Retrain the model                | Admin |

```bash
GET /api/recommendations?limit=20

# Response
{
  "success": true,
  "recommendations": [
    {
      "tmdbId": 550,
      "title": "Fight Club",
      "mediaType": "movie",
      "score": 0.95
    }
  ]
}
```

---

### Smart Search

| Method | Endpoint           | Description                        | Auth |
| ------ | ------------------ | ---------------------------------- | ---- |
| POST   | `/smart-search/ai` | Natural language search via Gemini | ✓    |

```bash
POST /api/smart-search/ai
{
  "query": "scary movies to watch on Halloween"
}

# Response
{
  "success": true,
  "results": [
    {
      "title": "The Shining",
      "year": 1980,
      "media_type": "movie",
      "reason": "A classic slow-burn horror film perfect for Halloween."
    }
  ]
}
```

---

### Notifications

| Method | Endpoint                            | Description           | Auth |
| ------ | ----------------------------------- | --------------------- | ---- |
| GET    | `/users/notifications`              | Get all notifications | ✓    |
| GET    | `/users/notifications/unread-count` | Get unread count      | ✓    |
| PATCH  | `/users/notifications/:id/read`     | Mark as read          | ✓    |
| PATCH  | `/users/notifications/read-all`     | Mark all as read      | ✓    |

---

### Support

| Method | Endpoint       | Description             | Auth |
| ------ | -------------- | ----------------------- | ---- |
| POST   | `/support`     | Create a support ticket | ✓    |
| GET    | `/support`     | Get your tickets        | ✓    |
| GET    | `/support/:id` | Get ticket details      | ✓    |
| PUT    | `/support/:id` | Update your ticket      | ✓    |
| DELETE | `/support/:id` | Delete your ticket      | ✓    |

---

### Admin

> All admin endpoints require the `admin` role.

| Method                | Endpoint                   | Description             |
| --------------------- | -------------------------- | ----------------------- |
| GET                   | `/admin/stats`             | Platform-wide stats     |
| GET                   | `/admin/users`             | All users (paginated)   |
| GET/PUT/DELETE        | `/admin/users/:id`         | Manage individual user  |
| POST                  | `/admin/users/:id/ban`     | Ban a user              |
| POST                  | `/admin/users/bulk-ban`    | Bulk ban users          |
| POST                  | `/admin/users/bulk-delete` | Bulk delete users       |
| GET/POST/PUT/DELETE   | `/admin/movies`            | Manage movie entries    |
| GET                   | `/admin/shows`             | All TV shows            |
| GET/PATCH/DELETE      | `/admin/reviews/:reviewId` | Manage reviews          |
| GET/PUT               | `/admin/support`           | Manage support tickets  |
| GET/POST/PATCH/DELETE | `/admin/notifications`     | Manage notifications    |
| POST                  | `/admin/trigger-reminder`  | Trigger email reminders |

---

### Error Format

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "A description of what went wrong."
}
```

| Status Code | Meaning               |
| ----------- | --------------------- |
| 200         | OK                    |
| 201         | Created               |
| 400         | Bad Request           |
| 401         | Unauthorized          |
| 403         | Forbidden             |
| 404         | Not Found             |
| 500         | Internal Server Error |

---

## AI & ML Implementation

### Personalized Recommendations — TensorFlow.js

MovieVerse uses **Hybrid Neural Collaborative Filtering** to generate personalized content recommendations for each user.

#### How It Works

**1. Data Collection**

User interaction data is gathered from multiple signals, each weighted differently:

| Signal            | Weight |
| ----------------- | ------ |
| Watch history     | High   |
| Reviews & ratings | High   |
| Wishlist          | Medium |
| Watch later       | Medium |

**2. Feature Engineering**

- Genre one-hot encoding (20 genres)
- Release year normalization
- Popularity scoring
- User–item interaction matrix construction

**3. Neural Network Architecture**

- User and item embeddings (latent factor layers)
- Genre feature concatenation
- Dense layers with ReLU activations
- Output: predicted preference score (0–1)

**4. Inference**

- Scores all unseen content for the user
- Returns top-N results sorted by predicted preference
- Models are cached to minimize inference latency

**Key files:**

- `server/src/services/tfRecommend.js` — Core recommendation engine
- `server/src/utils/scoreWeights.js` — Interaction weight config
- `server/src/jobs/trainJob.js` — Scheduled retraining

---

### Smart Search — Google Gemini 2.5 Flash

Natural language search is powered by **Google Gemini 2.5 Flash**, allowing users to search with conversational queries instead of keyword matching.

#### How It Works

1. User submits a natural language query (e.g., _"90s action movies with explosions"_)
2. Gemini interprets intent: genre, decade, mood, theme, actors, plot
3. Returns a structured list of matching titles with explanations
4. Results are cached for 1 hour (NodeCache) to minimize API usage

#### Example Queries

| User Input                     | What Gemini Understands        |
| ------------------------------ | ------------------------------ |
| `"scary movies for Halloween"` | Horror genre, Halloween theme  |
| `"90s action with explosions"` | Action, 1990–1999, high-octane |
| `"movies like Ex Machina"`     | Sci-fi, AI theme, similar tone |
| `"funny Christmas comedies"`   | Comedy, holiday theme          |

**Key files:**

- `server/src/services/gemini.service.js` — Gemini integration
- `server/src/controllers/smartSearch.controller.js` — API controller

---

## Deployment

### Frontend — Vercel

1. Import your GitHub repository on [vercel.com](https://vercel.com)
2. Set the **root directory** to `client`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
4. Deploy

### Backend — Render

1. Create a new **Web Service** on [render.com](https://render.com) from your GitHub repo
2. Configure the service:
   - **Build command:** `npm install`
   - **Start command:** `npm run start`
3. Add all required environment variables (see [Getting Started](#getting-started))
4. Deploy

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit with a clear message
   ```bash
   git commit -m "feat: add your feature description"
   ```
4. Push to your fork and open a Pull Request against `main`

Please ensure your code is clean, and test your changes before submitting. Bug reports and feature requests can be filed via [GitHub Issues](https://github.com/shikeshjayan/MovieVerse/issues).

---

## License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for full details.

---

_Built with React, Express, MongoDB, TensorFlow.js & Google Gemini AI_
