import mongoose from 'mongoose';

const chatRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    isTemporary: {
      type: Boolean,
      default: false
    },
    expiryDuration: {
      type: String,
      enum: ['1h', '24h', '7d', '1 hour', '24 hours', '7 days', null],
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
chatRequestSchema.index({ sender: 1, receiver: 1 });
chatRequestSchema.index({ receiver: 1, status: 1 });

const ChatRequest = mongoose.model('ChatRequest', chatRequestSchema);

export default ChatRequest;
