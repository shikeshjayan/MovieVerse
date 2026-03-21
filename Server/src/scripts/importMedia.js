// src/scripts/importMedia.js
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log("TMDB_API_KEY:", process.env.TMDB_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("MONGO_URL:", process.env.MONGO_URL ? "✅ Loaded" : "❌ Missing");

import mongoose from "mongoose";
import axios from "axios";
import Media from "../models/media.model.js";
import { withRetry, fetchGenresFromTMDB } from "../utils/genreUtils.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;
const BATCH_SIZE = 5;
const PAGE_DELAY = 250;

const MAX_PAGES = process.argv.includes("--all") ? 500 : 10;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPageBatch = async (pages) => {
  const [moviesRes, tvRes] = await Promise.all([
    Promise.all(pages.map((page) => axios.get(`${TMDB_BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`))),
    Promise.all(pages.map((page) => axios.get(`${TMDB_BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}`))),
  ]);

  const movies = moviesRes.flatMap((res) => res.data.results.map((m) => ({ ...m, mediaType: "movie" })));
  const tv = tvRes.flatMap((res) => res.data.results.map((t) => ({ ...t, mediaType: "tv" })));

  return [...movies, ...tv];
};

await mongoose.connect(process.env.MONGO_URL);
console.log("✅ MongoDB connected");

const importMedia = async () => {
  console.log(`🚀 Starting media import... (Max pages: ${MAX_PAGES}, Batch size: ${BATCH_SIZE})`);
  let total = 0;
  let errors = 0;
  const failedItems = [];

  console.log("📡 Fetching genre map...");
  const genreMap = await fetchGenresFromTMDB();
  console.log("✅ Genre map fetched:", Object.keys(genreMap).length, "genres");

  const clearExisting = process.argv.includes("--clear");
  if (clearExisting) {
    await Media.deleteMany({});
    console.log("🗑️ Old media cleared");
  }

  for (let i = 1; i <= MAX_PAGES; i += BATCH_SIZE) {
    const pageBatch = [];
    for (let j = 0; j < BATCH_SIZE && i + j <= MAX_PAGES; j++) {
      pageBatch.push(i + j);
    }

    console.log(`📦 Processing batch: pages ${pageBatch[0]}-${pageBatch[pageBatch.length - 1]}`);

    try {
      const items = await withRetry(async () => fetchPageBatch(pageBatch), 3, 1000);

      const operations = items.map((item) => ({
        updateOne: {
          filter: { tmdbId: item.id, mediaType: item.mediaType },
          update: {
            $set: {
              tmdbId: item.id,
              mediaType: item.mediaType,
              title: item.title || item.name,
              overview: item.overview,
              posterPath: item.poster_path,
              backdropPath: item.backdrop_path,
              releaseDate: item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date) : null,
              popularity: item.popularity,
              voteAverage: item.vote_average,
              voteCount: item.vote_count,
              originalLanguage: item.original_language,
              genres: (item.genre_ids || []).map((id) => genreMap[id] || "Unknown"),
            },
          },
          upsert: true,
        },
      }));

      const result = await Media.bulkWrite(operations, { ordered: false });
      total += result.upsertedCount + result.modifiedCount;

      if (result.upsertedCount + result.modifiedCount === 0 && items.length > 0) {
        errors += items.length;
      }

      console.log(`✅ Batch done — imported this batch: ${result.upsertedCount + result.modifiedCount}, total: ${total}`);
      await wait(PAGE_DELAY);
    } catch (err) {
      console.error(`❌ Batch pages ${pageBatch[0]}-${pageBatch[pageBatch.length - 1]} failed:`, err.message);
      errors += BATCH_SIZE * 20;
    }
  }

  console.log(`\n✅ Done — Total imported: ${total}, Errors: ${errors}`);
  if (failedItems.length > 0) {
    console.log("⚠️ Failed items (first 10):", failedItems.slice(0, 10));
  }

  await mongoose.disconnect();
  process.exit();
};

importMedia();
