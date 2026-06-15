import cron from 'node-cron';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const initCleanupJob = () => {
  // Run every hour: '0 * * * *'
  // For testing/validation, we can also support setting it up to run more frequently in development if needed,
  // but hourly is the production requirement.
  cron.schedule('0 * * * *', async () => {
    console.log('Running temporary chat cleanup job...');
    try {
      const now = new Date();

      // 1. Find all conversations that have expired
      const expiredConversations = await Conversation.find({
        isTemporary: true,
        expiresAt: { $lt: now }
      }).select('_id');

      if (expiredConversations.length > 0) {
        const expiredIds = expiredConversations.map((conv) => conv._id);

        // 2. Delete messages in expired conversations
        const messageDeleteResult = await Message.deleteMany({
          conversationId: { $in: expiredIds }
        });

        // 3. Delete expired conversations
        const convDeleteResult = await Conversation.deleteMany({
          _id: { $in: expiredIds }
        });

        console.log(
          `Cleanup successful: Deleted ${convDeleteResult.deletedCount} conversations and ${messageDeleteResult.deletedCount} messages.`
        );
      } else {
        console.log('No expired temporary conversations found.');
      }
    } catch (error) {
      console.error('Error executing cleanup job:', error);
    }
  });

  console.log('Cleanup job scheduled successfully (Hourly).');
};

export default initCleanupJob;
