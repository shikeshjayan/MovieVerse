import Feedback from "../models/feedback.model.js";
import Media from "../models/media.model.js";
import History from "../models/history.model.js";
import WatchLater from "../models/watchLater.model.js";
import { notifyNewInteraction } from "../jobs/trainJob.js";

export const recordFeedback = async (req, res) => {
  try {
    const { mediaId, action, dwellTime, source, recommendationScore, sessionId } = req.body;
    const userId = req.user._id;

    const media = await Media.findById(mediaId);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    const feedback = new Feedback({
      user: userId,
      media: mediaId,
      action,
      dwellTime,
      source,
      recommendationScore,
      sessionId,
    });

    await feedback.save();

    if (action === 'play' && source) {
      let existingHistory = await History.findOne({ user: userId, media: mediaId });
      
      if (!existingHistory) {
        existingHistory = new History({
          user: userId,
          media: mediaId,
          interactionType: 'implicit_play',
        });
        await existingHistory.save();
        await notifyNewInteraction();
      } else {
        existingHistory.playCount = (existingHistory.playCount || 0) + 1;
        existingHistory.lastPlayedAt = new Date();
        await existingHistory.save();
      }
    }

    const feedbackWeight = {
      click: 0.2,
      play: 0.5,
      skip: -0.3,
      dwell: 0.3,
    };

    const weight = feedbackWeight[action] || 0;

    res.status(201).json({ 
      success: true, 
      message: 'Feedback recorded',
      feedback: {
        action,
        weight,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeedbackStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '7d' } = req.query;

    let dateFilter = new Date();
    if (period === '24h') dateFilter.setDate(dateFilter.getDate() - 1);
    else if (period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);

    const stats = await Feedback.aggregate([
      { $match: { user: userId._id, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          avgDwellTime: { $avg: '$dwellTime' },
        },
      },
    ]);

    const sourceStats = await Feedback.aggregate([
      { $match: { user: userId._id, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          avgScore: { $avg: '$recommendationScore' },
        },
      },
    ]);

    const totalFeedback = stats.reduce((sum, s) => sum + s.count, 0);

    res.status(200).json({
      success: true,
      stats: {
        byAction: stats,
        bySource: sourceStats,
        total: totalFeedback,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
