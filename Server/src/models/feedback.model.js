import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  action: { 
    type: String, 
    enum: ['click', 'play', 'skip', 'dwell'], 
    required: true 
  },
  dwellTime: { type: Number, default: 0 },
  source: { type: String, enum: ['ml', 'content-based', 'popular', 'exploration', 'cold-start'] },
  recommendationScore: { type: Number },
  sessionId: { type: String },
}, { timestamps: true });

feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, media: 1 });

export default mongoose.model('Feedback', feedbackSchema);
