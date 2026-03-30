// jobs/trainJob.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import { buildInteractionMatrix, trainModel, loadModelFromDisk } from '../services/tfRecommend.js';
import History    from '../models/history.model.js';
import WatchLater from '../models/watchLater.model.js';
import Wishlist   from '../models/wishlist.model.js';
import Review     from '../models/review.model.js';
import Media      from '../models/media.model.js';
import TF_CONFIG  from '../utils/tfConfig.js';

let modelState = null;
let modelMeta = null;
let isModelReady = false;
let interactionCount = 0;
let lastTrainCount = 0;
let isTraining = false;
const AUTO_RETRAIN_THRESHOLD = 5;

function waitForDb(maxWaitMs = 30000) {
  return new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1) return resolve();
    
    const timeout = setTimeout(() => {
      reject(new Error('Database connection timeout'));
    }, maxWaitMs);

    mongoose.connection.once('open', () => {
      clearTimeout(timeout);
      resolve();
    });
    mongoose.connection.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function notifyNewInteraction() {
  interactionCount++;
  if (interactionCount - lastTrainCount >= AUTO_RETRAIN_THRESHOLD) {
    console.log(`[TF] Auto-retraining after ${interactionCount} new interactions...`);
    await triggerRetrain(true);
    lastTrainCount = interactionCount;
  }
}

async function runTraining(forceRetrain = false, retryCount = 0) {
  if (isTraining) {
    console.log('[TF] Training already in progress, skipping...');
    return;
  }
  
  isTraining = true;
  console.log(`
╔══════════════════════════════════════╗
║  ${TF_CONFIG.MODEL_NAME} v${TF_CONFIG.MODEL_VERSION}
║  ${TF_CONFIG.ALGORITHM}
╚══════════════════════════════════════╝
  `);
  console.log(`[TF] Force retrain: ${forceRetrain}`);
  console.log(`[TF] Config: embedding=${TF_CONFIG.EMBEDDING_DIM}, epochs=${TF_CONFIG.EPOCHS}, lr=${TF_CONFIG.LEARNING_RATE}`);

  try {
    const meta = await buildInteractionMatrix(History, WatchLater, Wishlist, Review, Media);
    console.log(`[TF] Matrix — users: ${meta.numUsers}, items: ${meta.numItems}, interactions: ${meta.allInteractions?.length || 0}`);
    
    let model = null;
    let finalMeta = meta;
    
    if (!forceRetrain) {
      model = await loadModelFromDisk(meta.numUsers, meta.numItems);
    }
    
    if (!model) {
      model = await trainModel(meta, true);
    } else {
      finalMeta = {
        ...meta,
        userList: model.userList || meta.userList,
        itemList: model.itemList || meta.itemList,
        itemGenreEncoding: model.itemGenreEncoding || meta.itemGenreEncoding,
        itemYear: model.itemYear || meta.itemYear,
        itemPopularity: model.itemPopularity || meta.itemPopularity,
        itemMediaType: model.itemMediaType || meta.itemMediaType,
      };
    }
    
    if (model) {
      modelState = model;
      modelMeta = finalMeta;
      isModelReady = true;
      console.log(`[TF] Training complete — model saved to ${TF_CONFIG.MODEL_DIR}`);
      console.log(`[TF] Weights: CF=${TF_CONFIG.CF_WEIGHT}, Content=${TF_CONFIG.CONTENT_WEIGHT}, Popularity=${TF_CONFIG.POPULARITY_WEIGHT}`);
    } else {
      console.log('[TF] No model trained - no interactions data');
      isModelReady = false;
    }
  } catch (err) {
    console.error(`[TF][${TF_CONFIG.MODEL_NAME}] Training failed:`, err.message);
    isModelReady = false;
    
    if (retryCount < 2 && err.message.includes('timeout')) {
      console.log(`[TF] Retrying in 5 seconds... (attempt ${retryCount + 1})`);
      isTraining = false;
      setTimeout(() => runTraining(forceRetrain, retryCount + 1), 5000);
      return;
    }
  } finally {
    isTraining = false;
  }
}

async function initializeTraining() {
  try {
    await waitForDb();
    await runTraining();
  } catch (err) {
    console.error('[TF] Initialization failed:', err.message);
    console.log('[TF] Will retry on first request...');
  }
}

initializeTraining();
cron.schedule('0 2 * * *', () => runTraining(true));

export function getModelState() {
  return { modelState, modelMeta, isModelReady };
}

export async function triggerRetrain(forceRetrain = true) {
  await runTraining(forceRetrain);
  return { isModelReady, numUsers: modelMeta?.numUsers, numItems: modelMeta?.numItems };
}
