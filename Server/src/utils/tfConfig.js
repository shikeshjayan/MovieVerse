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
  EMBEDDING_DIM: 16,
  EPOCHS: 100,
  LEARNING_RATE: 0.01,
  LEARNING_RATE_DECAY: 0.95,
  BATCH_SIZE: 1000,
  MODEL_DIR,
  TEST_SPLIT: 0.2,
  TOP_POPULAR: 20,
  L2_REGULARIZATION: 0.01,
  EARLY_STOPPING_PATIENCE: 10,
  EARLY_STOPPING_MIN_DELTA: 0.001,
  NUM_NEGATIVES: 4,
  CF_WEIGHT: 0.6,
  CONTENT_WEIGHT: 0.25,
  POPULARITY_WEIGHT: 0.15,
  YEAR_PENALTY_WEIGHT: 0.1,
  DEFAULT_YEAR: 2015,
  MIN_YEAR: 1900,
  MAX_YEAR: 2026,
  RECOMMEND_TOP_N: 30,
  COLD_START_RATIO: 0.2,
  TIMEOUT_MS: 3000,
  
  // Diversity settings
  DIVERSITY_MAX_SAME_GENRE: 3,
  DIVERSITY_BUCKET_SIZE: 5,
  
  // Exploration settings
  EXPLORATION_RATE: 0.15,
  EXPLORATION_MIN_INVERSE_POPULARITY: 0.3,
  
  // Popularity debiasing
  POPULARITY_DECAY: 0.5,
  MIN_POPULARITY_BOOST: 0.1,
  
  // Recency weights (session context)
  RECENCY_DECAY_DAYS: 30,
  RECENCY_WEIGHT_RECENT: 2.0,
  RECENCY_WEIGHT_OLD: 0.5,
  
  // Evaluation
  EVAL_K_VALUES: [5, 10, 20],
};

export default TF_CONFIG;
