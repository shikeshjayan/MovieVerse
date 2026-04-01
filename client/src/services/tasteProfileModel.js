/**
 * TensorFlow.js utilities for building and training user taste profile models.
 * Enables personalized movie recommendations based on genre preferences.
 */

/** @type {Object|null} Singleton TensorFlow.js instance */
let tfInstance = null;

/**
 * Gets or initializes the TensorFlow.js singleton instance.
 * Dynamically imports the library and waits for readiness.
 * @returns {Promise<Object>} The TensorFlow.js module instance.
 */
const getTF = async () => {
  if (!tfInstance) {
    const tfLib = await import("@tensorflow/tfjs");
    await tfLib.ready();
    tfInstance = tfLib;
  }
  return tfInstance;
};

/**
 * TMDB genre IDs for all supported movie genres.
 * @type {number[]}
 */
const GENRE_IDS = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53,
  10752, 37,
];

/**
 * Mapping of TMDB genre IDs to human-readable genre names.
 * @type {Object.<number, string>}
 */
const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const NAME_TO_ID = Object.entries(GENRE_MAP).reduce((acc, [id, name]) => {
  acc[name.toLowerCase()] = Number(id);
  return acc;
}, {});

/**
 * Extracts genre IDs from a movie object in various formats.
 * Handles genreIds, genre_ids (number or string), and genres (object or string).
 * @param {Object} movie - Movie object with genre information.
 * @returns {number[]} Array of TMDB genre IDs.
 */
const extractGenreIds = (movie) => {
  if (Array.isArray(movie.genreIds) && movie.genreIds.length)
    return movie.genreIds;
  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length) {
    if (typeof movie.genre_ids[0] === "number") return movie.genre_ids;
    if (typeof movie.genre_ids[0] === "string")
      return movie.genre_ids
        .map((name) => NAME_TO_ID[name.toLowerCase()])
        .filter(Boolean);
  }
  if (Array.isArray(movie.genres) && movie.genres.length) {
    if (typeof movie.genres[0] === "object")
      return movie.genres.map((g) => g.id ?? g.genreId).filter(Boolean);
    if (typeof movie.genres[0] === "string")
      return movie.genres
        .map((name) => NAME_TO_ID[name.toLowerCase()])
        .filter(Boolean);
  }
  return [];
};

/**
 * Builds a normalized genre preference vector from a list of movies.
 * @param {Object[]} movies - Array of movie objects.
 * @returns {number[]} Normalized vector where each index corresponds to a genre.
 */
export const buildGenreVector = (movies) => {
  const vector = new Array(GENRE_IDS.length).fill(0);
  movies.forEach((movie) => {
    extractGenreIds(movie).forEach((id) => {
      const idx = GENRE_IDS.indexOf(id);
      if (idx !== -1) vector[idx] += 1;
    });
  });
  const max = Math.max(...vector, 1);
  return vector.map((v) => v / max);
};

/**
 * Computes cosine similarity between two vectors.
 * Used to compare user taste profiles with movie genre vectors.
 * @param {number[]} a - First vector.
 * @param {number[]} b - Second vector.
 * @returns {number} Similarity score between -1 and 1.
 */
export const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dot / (magA * magB) : 0;
};

/**
 * Creates a new neural network model for taste profile prediction.
 * Architecture: Input(18) -> Dense(24, relu) -> Output(18, softmax).
 * @returns {Promise<Object>} Compiled TensorFlow.js model.
 */
export const createTasteProfileModel = async () => {
  const tf = await getTF();
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [GENRE_IDS.length],
        units: 24,
        activation: "relu",
      }),
      tf.layers.dense({ units: GENRE_IDS.length, activation: "softmax" }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
};

/**
 * Trains the taste profile model using user's watch history.
 * Splits movies into past (input) and future (target) for temporal learning.
 * @param {Object} model - TensorFlow.js model to train.
 * @param {Object[]} userMovies - User's movie watch history.
 * @param {number} [epochs=50] - Number of training epochs.
 * @returns {Promise<Object|null>} Trained model or null if insufficient data.
 */
export const trainTasteModel = async (model, userMovies, epochs = 50) => {
  if (userMovies.length < 4) return null;

  const mid = Math.floor(userMovies.length / 2);
  const pastMovies = userMovies.slice(0, mid);
  const futureMovies = userMovies.slice(mid);

  const inputVector = buildGenreVector(pastMovies);
  const outputVector = buildGenreVector(futureMovies);

  const tf = await getTF();
  const xs = tf.tensor2d([inputVector]);
  const ys = tf.tensor2d([outputVector]);

  await model.fit(xs, ys, { epochs, verbose: 0 });

  xs.dispose();
  ys.dispose();

  return model;
};

/**
 * Generates a user embedding vector using the trained taste model.
 * @param {Object} model - Trained TensorFlow.js model.
 * @param {Object[]} movies - User's movie list for embedding generation.
 * @returns {Promise<number[]>} User embedding vector.
 */
export const getUserEmbedding = async (model, movies) => {
  if (!model || movies.length === 0) {
    return buildGenreVector(movies);
  }

  const tf = await getTF();
  const vector = buildGenreVector(movies);
  const inputTensor = tf.tensor2d([vector]);
  const embedding = model.predict(inputTensor);
  const result = await embedding.data();
  
  inputTensor.dispose();
  embedding.dispose();

  return Array.from(result);
};

/**
 * Scores how well a movie matches a user's taste profile.
 * @param {number[]} userVector - User's genre preference vector.
 * @param {Object} movie - Movie to score.
 * @returns {number} Similarity score between 0 and 1.
 */
export const scoreMovieGenres = (userVector, movie) => {
  const movieVector = buildGenreVector([movie]);
  return cosineSimilarity(userVector, movieVector);
};

/**
 * Generates textual insights about a user's taste profile.
 * Analyzes genre dominance and combinations for personality insights.
 * @param {Object[]} profile - Sorted genre preference profile.
 * @returns {string[]} Array of insight strings (max 2).
 */
export const generateInsights = (profile) => {
  if (!profile || profile.length === 0) return [];

  const insights = [];
  const topGenres = profile.slice(0, 3);
  const total = topGenres.reduce((sum, g) => sum + g.count, 0);

  if (total > 0) {
    const dominant = topGenres[0];
    const dominanceRatio = dominant.count / total;

    if (dominanceRatio > 0.5) {
      insights.push(`${dominant.name} enthusiast - strong, focused taste`);
    } else if (dominanceRatio > 0.35) {
      insights.push(`${dominant.name} lover with eclectic interests`);
    } else {
      insights.push("Well-rounded cinephile with diverse tastes");
    }
  }

  if (profile.length >= 3) {
    const hasDrama = profile.some((g) => g.name === "Drama");
    const hasAction = profile.some((g) => g.name === "Action");
    if (hasDrama && hasAction) {
      insights.push("Balances emotional depth with high-energy entertainment");
    }
  }

  if (profile.length >= 4) {
    const hasHorror = profile.some((g) => g.name === "Horror");
    const hasComedy = profile.some((g) => g.name === "Comedy");
    if (hasHorror && hasComedy) {
      insights.push("Enjoys the full spectrum: from scares to laughs");
    }
  }

  return insights.slice(0, 2);
};

/**
 * Builds a taste profile from a list of movies with normalized percentages.
 * @param {Object[]} movies - Array of movie objects.
 * @returns {Object[]} Sorted array of genres with count, pct, and normalized values.
 */
export const buildTasteProfile = (movies) => {
  const counts = {};
  movies.forEach((movie) => {
    extractGenreIds(movie).forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
  });

  const sorted = Object.entries(counts)
    .map(([id, count]) => ({
      id: Number(id),
      name: GENRE_MAP[id] ?? `Genre ${id}`,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const max = sorted[0]?.count || 1;
  return sorted.map((g) => ({
    ...g,
    pct: Math.round((g.count / max) * 100),
    normalized: g.count / max,
  }));
};
