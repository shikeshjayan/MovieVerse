let tfInstance = null;

const getTF = async () => {
  if (!tfInstance) {
    const tfLib = await import("@tensorflow/tfjs");
    await tfLib.ready();
    tfInstance = tfLib;
  }
  return tfInstance;
};

const GENRE_IDS = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53,
  10752, 37,
];

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

const extractGenreIds = (movie) => {
  if (Array.isArray(movie.genreIds) && movie.genreIds.length)
    return movie.genreIds;
  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length)
    return movie.genre_ids;
  if (Array.isArray(movie.genres) && movie.genres.length) {
    if (typeof movie.genres[0] === "object")
      return movie.genres.map((g) => g.id).filter(Boolean);
    if (typeof movie.genres[0] === "string")
      return movie.genres
        .map((name) => NAME_TO_ID[name.toLowerCase()])
        .filter(Boolean);
  }
  return [];
};

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

export const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dot / (magA * magB) : 0;
};

export const createTasteProfileModel = async () => {
  const tf = await getTF();
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [GENRE_IDS.length],
        units: 12,
        activation: "relu",
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 8, activation: "relu" }),
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

export const trainTasteModel = async (model, userMovies, epochs = 50) => {
  if (userMovies.length < 3) return null;

  const inputs = userMovies.map(() => buildGenreVector(userMovies));
  const outputs = inputs.map((v) =>
    v.map((val) => val + (Math.random() - 0.5) * 0.1)
  );

  const tf = await getTF();
  const xs = tf.tensor2d(inputs);
  const ys = tf.tensor2d(outputs);

  await model.fit(xs, ys, { epochs, verbose: 0 });

  xs.dispose();
  ys.dispose();

  return model;
};

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

export const scoreMovieGenres = (userVector, movie) => {
  const movieVector = buildGenreVector([movie]);
  return cosineSimilarity(userVector, movieVector);
};

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
