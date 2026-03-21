// jobs/trainJob.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import { buildInteractionMatrix, trainModel, loadModelFromDisk } from '../services/tfRecommend.js';
import History    from '../models/history.model.js';
import WatchLater from '../models/watchLater.model.js';
import Wishlist   from '../models/wishlist.model.js';
import Review     from '../models/review.model.js';
import Media      from '../models/media.model.js';

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

async function runTraining(forceRetrain = false) {
  if (isTraining) {
    console.log('[TF] Training already in progress, skipping...');
    return;
  }
  
  isTraining = true;
  console.log('[TF] Starting training...');
  try {
    const meta = await buildInteractionMatrix(History, WatchLater, Wishlist, Review, Media);
    
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
    
    modelState = model;
    modelMeta = finalMeta;
    isModelReady = true;
    console.log(`[TF] Done — Users: ${meta.numUsers} | Items: ${meta.numItems}`);
  } catch (err) {
    console.error('[TF] Training failed:', err);
    isModelReady = false;
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
