import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  subject: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 2000
  },
  category: { 
    type: String, 
    enum: ['bug', 'account', 'payment', 'content', 'recommendation', 'other'],
    default: 'other'
  },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  response: { 
    type: String,
    default: null
  },
  respondedAt: { 
    type: Date,
    default: null
  },
  respondedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  }
}, { timestamps: true });

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });

export default mongoose.model('SupportTicket', supportTicketSchema);