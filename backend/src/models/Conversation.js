import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      validate: [
        {
          validator: function (val) {
            return val.length === 2;
          },
          message: 'A conversation must have exactly 2 participants.'
        }
      ]
    },
    isTemporary: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Sort participants before validation/saving to ensure lexicographical order
// This, combined with the unique index, prevents duplicate conversations in reverse order
conversationSchema.pre('validate', function (next) {
  if (this.participants && this.participants.length === 2) {
    this.participants = this.participants.map(id => id.toString()).sort();
  }
  next();
});

// Unique index on participants array
conversationSchema.index({ participants: 1 }, { unique: true });
// Index for checking expiry in cron job
conversationSchema.index({ expiresAt: 1 }, { sparse: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
