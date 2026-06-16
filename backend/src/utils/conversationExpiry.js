import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const isConversationExpired = (conversation) => {
  if (!conversation?.isTemporary || !conversation?.expiresAt) {
    return false;
  }

  return new Date(conversation.expiresAt).getTime() <= Date.now();
};

export const purgeExpiredConversation = async (conversation, io) => {
  if (!conversation) return;

  await Message.deleteMany({ conversationId: conversation._id });
  await Conversation.deleteOne({ _id: conversation._id });

  if (io && conversation.participants?.length) {
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit('conversation_deleted', {
        conversationId: conversation._id.toString()
      });
    });
  }
};
