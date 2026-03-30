// utils/tfConfig.js
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const MODEL_DIR = path.join(PROJECT_ROOT, 'models');

if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}

const TF_CONFIG = {

  // ── Model identity ──────────────────────────────────────────────
  MODEL_NAME:        "CineMatch-NCF",
  MODEL_VERSION:     "1.2.0",
  MODEL_DESCRIPTION: "Hybrid Neural Collaborative Filtering model. Combines user-item embeddings (CF), genre content vectors, and popularity signals to generate personalized movie and TV show recommendations.",
  ALGORITHM:         "Neural Collaborative Filtering + Content-Based Filtering",
  AUTHORS:           ["Shikesh Jayan"],

  // ── Architecture ────────────────────────────────────────────────
  EMBEDDING_DIM: 16,          // Size of user and item embedding vectors
  EPOCHS:        100,         // Max training epochs (early stopping may cut this short)
  LEARNING_RATE: 0.01,        // Adam optimizer initial learning rate
  LEARNING_RATE_DECAY: 0.95,  // LR multiplied by this after each epoch
  BATCH_SIZE:    1000,        // Interactions processed per gradient step
  L2_REGULARIZATION: 0.01,   // Weight penalty to prevent overfitting

  // ── Training control ────────────────────────────────────────────
  TEST_SPLIT:               0.2,   // 20% of interactions held out for evaluation
  EARLY_STOPPING_PATIENCE:  10,    // Stop if no improvement for 10 epochs
  EARLY_STOPPING_MIN_DELTA: 0.001, // Minimum improvement to count as progress
  NUM_NEGATIVES:            4,     // Negative samples generated per positive interaction
  AUTO_RETRAIN_THRESHOLD:    5,     // Retrain after this many new interactions

  // ── Scoring weights ─────────────────────────────────────────────
  // How much each signal source contributes to the final hybrid score
  CF_WEIGHT:         0.6,   // Collaborative filtering (user-item patterns)
  CONTENT_WEIGHT:    0.25,  // Content-based (genre similarity)
  POPULARITY_WEIGHT: 0.15,  // Global popularity signal

  // ── Recommendation output ───────────────────────────────────────
  RECOMMEND_TOP_N:   30,    // Candidates generated before post-processing
  TOP_POPULAR:       20,    // Popular items used in cold-start fallback
  COLD_START_RATIO:  0.2,   // Fraction of recs that are popularity-based for new users
  TIMEOUT_MS:        3000,  // Max ms to wait for TF inference before fallback

  // ── Diversity ───────────────────────────────────────────────────
  DIVERSITY_MAX_SAME_GENRE: 3,  // Max items of the same genre per DIVERSITY_BUCKET_SIZE
  DIVERSITY_BUCKET_SIZE:    5,  // Window size for genre diversity enforcement

  // ── Exploration (serendipity) ───────────────────────────────────
  EXPLORATION_RATE: 0.15,                  // 15% of results are exploratory
  EXPLORATION_MIN_INVERSE_POPULARITY: 0.3, // Only explore items below this popularity

  // ── Popularity debiasing ────────────────────────────────────────
  POPULARITY_DECAY:     0.5,  // Dampen very popular items to prevent echo chamber
  MIN_POPULARITY_BOOST: 0.1,  // Minimum popularity signal even for unpopular items

  // ── Recency weighting ────────────────────────────────────────────
  RECENCY_DECAY_DAYS:    30,  // Interactions older than this get minimum weight
  RECENCY_WEIGHT_RECENT: 2.0, // Weight multiplier for interactions within decay window
  RECENCY_WEIGHT_OLD:    0.5, // Weight multiplier for older interactions

  // ── Evaluation metrics ──────────────────────────────────────────
  EVAL_K_VALUES: [5, 10, 20], // Compute Precision@K, Recall@K, NDCG@K for these K values

  // ── Year/recency penalty ────────────────────────────────────────
  YEAR_PENALTY_WEIGHT: 0.1,  // Penalize very old items slightly
  DEFAULT_YEAR: 2015,        // Assumed release year when unknown
  MIN_YEAR: 1900,
  MAX_YEAR: 2026,

  // ── Storage ─────────────────────────────────────────────────────
  MODEL_DIR, // Resolved path where model weights are saved
};

export default TF_CONFIG;
