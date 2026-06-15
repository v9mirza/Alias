import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

/**
 * @desc    Get conversations for the current user
 * @route   GET /api/conversations
 * @access  Private
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all conversations where current user is a participant
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'username isOnline lastSeen bio interests')
      .sort({ updatedAt: -1 });

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Find the other participant
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );

        // Fetch latest message
        const latestMessage = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .select('content sender isRead createdAt');

        // Fetch unread count for messages sent by the other user
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: userId },
          isRead: false
        });

        return {
          _id: conv._id,
          participants: conv.participants.map(p => ({
            id: p._id,
            username: p.username
          })),
          otherParticipant: otherParticipant
            ? {
                id: otherParticipant._id,
                username: otherParticipant.username,
                isOnline: otherParticipant.isOnline,
                lastSeen: otherParticipant.lastSeen
              }
            : null,
          latestMessage,
          unreadCount,
          isTemporary: conv.isTemporary,
          expiresAt: conv.expiresAt,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt
        };
      })
    );

    // Sort by latest message date (or updatedAt as fallback)
    formattedConversations.sort((a, b) => {
      const aDate = a.latestMessage ? new Date(a.latestMessage.createdAt) : new Date(a.updatedAt);
      const bDate = b.latestMessage ? new Date(b.latestMessage.createdAt) : new Date(b.updatedAt);
      return bDate - aDate;
    });

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: {
        conversations: formattedConversations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get messages for a conversation
 * @route   GET /api/conversations/:id/messages
 * @access  Private
 */
export const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;
    const conversationId = req.params.id;
    const userId = req.user._id;

    // 1. Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // 2. Check if current user is participant
    const isParticipant = conversation.participants.some(
      (pId) => pId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages in this conversation'
      });
    }

    // 3. Fetch messages (paginated, sorted by latest first)
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    const total = await Message.countDocuments({ conversationId });

    // Reverse messages to display them chronologically on frontend
    const chronologicalMessages = messages.reverse();

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: {
        messages: chronologicalMessages,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
