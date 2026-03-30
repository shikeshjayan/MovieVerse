# 🎬 Recommended Movie Database (RMDB)

RMDB is a modern **movie discovery and recommendation platform** built with **React (Vite)**.  
It allows users to explore trending movies & TV shows, manage a personal wishlist, track watch history, and share reviews — all with a clean, responsive UI.

Movie data is powered by the **TMDB API**, while **Firebase** handles authentication and secure real-time data storage.

---

## 🚀 Live Demo

👉 https://movie-discovery-recommendation-plat-xi.vercel.app/

Hosted on **Vercel**

---

## 🖼️ Screenshots

### 🏠 Home Page

![Home](screenshots/home.png)

### 🎬 Movie Details

![Details](screenshots/details.png)

### ❤️ Wishlist

![Wishlist](screenshots/wishlist.png)

---

## 🛠️ Tech Stack

### Frontend

- React.js (Vite)
- React Router (Protected Routes)
- Context API (Global State Management)
- Axios
- Tailwind CSS
- Framer Motion (Animations)
- Font Awesome / Icons8

### Backend & Services

- Firebase Authentication (Email & Password)
- Firebase Firestore
- TMDB API

---

## ✨ Key Features

### 🔐 Authentication

- Firebase email & password authentication
- Protected routes for authenticated users
- User-specific data isolation

### 🎥 Movie & TV Discovery

- Trending Movies & TV Shows
- Latest Movies
- Upcoming Movies
- Detailed Movie & TV Show pages
- Official Trailers
- TMDB-powered search
- 🎤 Voice Search (Web Speech API – browser supported)

### ❤️ Wishlist (Watch Later)

- Add movies to wishlist
- Remove individual items
- Data persisted per user

### 🕒 Watch History

- Automatically track watched content
- Remove individual history items
- Clear entire watch history

### 💬 Reviews & Comments

- Logged-in users can post reviews
- Public read access
- Secure update & delete permissions

### 🎨 UI & UX

- Fully responsive design
- Smooth page & micro animations
- Dark / Light theme toggle
- Accessible keyboard navigation

---

## 🔒 Firestore Security Rules

````js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId;
    }

    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }
  }
}



## 🏁 Getting Started

```bash
# Clone the repository
git clone https://github.com/shikeshjayan/Movie-Discovery-Recommendation-Platform.git

# Install dependencies
npm install

# Run development server
npm run dev

````

## 🧰 Requirements

- Node.js v24.11.0
- npm

## 👤 Author

**Shikesh Jayan**  
Full Stack Developer | React Enthusiast

- GitHub: https://github.com/shikeshjayan
