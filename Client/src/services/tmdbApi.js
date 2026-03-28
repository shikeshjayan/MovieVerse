import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

// Create a configured instance
const apiclient = axios.create({
  baseURL: BASE_URL,
  params: {
    language: "en-US",
  },
});

// --- HELPER FOR LISTS (Movies/TV Grids) ---
const fetchList = async (endpoint, params = {}) => {
  try {
    const response = await apiclient.get(endpoint, { params });
    return response.data.results || [];
  } catch (error) {
    console.error(`Error fetching list from ${endpoint}:`, error);
    return [];
  }
};

const fetchFull = async (endpoint, params = {}) => {
  try {
    const response = await apiclient.get(endpoint, { params });
    return response.data; // { results, total_pages, total_results, page }
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    return null;
  }
};

export const fetchMoviesWithPagination = async (endpoint, params = {}) => {
  const page = typeof params === 'number' ? params : (params.page || 1);
  const queryParams = typeof params === 'number' ? { page } : { ...params, page };
  const data = await fetchFull(endpoint, queryParams);
  if (!data) return { results: [], totalPages: 1, page: 1 };
  return {
    results: data.results || [],
    totalPages: data.total_pages || 1,
    page: data.page || 1,
  };
};

// --- HELPER FOR SINGLE OBJECTS (Details) ---
const fetchSingle = async (endpoint, params = {}) => {
  try {
    const response = await apiclient.get(endpoint, { params });
    return response.data; // Returns the full object {}
  } catch (error) {
    console.error(`Error fetching details from ${endpoint}:`, error);
    return null; // Return null so components can handle "Not Found"
  }
};

// #--------------------------------------------------------------------------------------------------------#
// EXPORTS (Matches your original names exactly)
// #--------------------------------------------------------------------------------------------------------#

export const upcomingMovies = (page = 1) =>
  fetchMoviesWithPagination("/movies/upcoming", page);
export const nowPlayingMovies = (page = 1) =>
  fetchMoviesWithPagination("/movies/now_playing", page);
export const airingShows = (page = 1) =>
  fetchMoviesWithPagination("/tv/airing_today", page);
export const popularMovies = (page = 1) =>
  fetchMoviesWithPagination("/movies/popular", page);
export const popularTVShows = (page = 1) =>
  fetchMoviesWithPagination("/tv/popular", page);
export const allMovies = (page = 1) =>
  fetchMoviesWithPagination("/movies/discover", page);
export const allTvshows = (page = 1) =>
  fetchMoviesWithPagination("/tv/discover", page);

export const movieDetails = (id) => fetchSingle(`/movies/${id}`);
export const showsDetails = (id) => fetchSingle(`/tv/${id}`);

export const movieVideos = async (id) => {
  const data = await fetchSingle(`/movies/${id}/trailer`);
  if (!data || !data.key) return null;
  return data.key;
};

export const showVideos = async (id) => {
  const data = await fetchSingle(`/tv/${id}/trailer`);
  if (!data || !data.key) return null;
  return data.key;
};

export const similarMovies = (id, page = 1) => {
  if (!id) {
    console.warn("No movie ID provided to similarMovies()");
    return Promise.resolve([]);
  }
  return fetchMoviesWithPagination(`/movies/${id}/similar`, { page });
};

export const similarShows = (id, page = 1) => {
  if (!id) {
    console.warn("No tv ID provided to similarShows()");
    return Promise.resolve([]);
  }
  return fetchMoviesWithPagination(`/tv/${id}/similar`, { page });
};

export const fetchSearch = (query, page = 1) =>
  fetchFull("/search/multi", { query, page });

export const fetchMoviesByGenre = (genre_id, page = 1) =>
  fetchMoviesWithPagination("/movies/discover", { with_genres: genre_id, page });
export const fetchTvShowsByGenre = (genre_id, page = 1) =>
  fetchMoviesWithPagination("/tv/discover", { with_genres: genre_id, page });

export const movieCast = async (id) => {
  const data = await fetchSingle(`/movies/${id}/credits`);
  return data?.cast || [];
};

export const tvCast = async (id) => {
  const data = await fetchSingle(`/tv/${id}/credits`);
  return data?.cast || [];
};

export const movieReviews = (id) => fetchList(`/movies/${id}/reviews`);
export const tvReviews = (id) => fetchList(`/tv/${id}/reviews`);
export const recommendations = (id) => {
  if (!id) {
    console.warn("No movie ID provided to recommendations()");
    return Promise.resolve([]);
  }
  return fetchList(`/movies/${id}/recommendations`);
};

export const trendingAll = (timeWindow = "day") =>
  fetchList(`/trending/all`, { timeWindow });

export const trendingAllPaginated = (timeWindow = "day", page = 1) =>
  fetchMoviesWithPagination(`/trending/all`, { timeWindow, page });

export const topRatedMovies = (page = 1) =>
  fetchMoviesWithPagination("/movies/top_rated", page);
export const upcomingMoviesList = (page = 1) =>
  fetchMoviesWithPagination("/movies/upcoming", page);
export const trendingMovies = (timeWindow = "week", page = 1) =>
  fetchMoviesWithPagination(`/movies/trending`, { timeWindow, page });
export const trendingTVShows = (timeWindow = "week", page = 1) =>
  fetchMoviesWithPagination(`/tv/trending`, { timeWindow, page });
export const airingTodayTVShows = (page = 1) =>
  fetchMoviesWithPagination("/tv/airing_today", page);

export const actionMovies = (page = 1) =>
  fetchMoviesWithPagination("/movies/action", page);
