import ChatRequest from '../models/ChatRequest.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

/**
 * @desc    Send a chat request to another user
 * @route   POST /api/requests
 * @access  Private
 */
export const sendRequest = async (req, res, next) => {
  try {
    const { receiverId, isTemporary = false, expiryDuration = null } = req.body;
    const senderId = req.user._id;

    // 1. Cannot send request to yourself
    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send chat request to yourself'
      });
    }

    // 2. Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }

    // 3. Check if they already have an active conversation
    const existingConv = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });
    if (existingConv) {
      return res.status(400).json({
        success: false,
        message: 'A conversation already exists with this user'
      });
    }

    // 4. Check for duplicate pending request in either direction
    const existingRequest = await ChatRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: senderId, status: 'pending' }
      ]
    });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'A pending chat request already exists between you and this user'
      });
    }

    // Clear out any old accepted/rejected requests between these users
    await ChatRequest.deleteMany({
      $or: [
        { sender: senderId, receiver: receiverId, status: { $ne: 'pending' } },
        { sender: receiverId, receiver: senderId, status: { $ne: 'pending' } }
      ]
    });

    // 5. Create request
    const request = await ChatRequest.create({
      sender: senderId,
      receiver: receiverId,
      isTemporary,
      expiryDuration: isTemporary ? expiryDuration || '24h' : null
    });

    // Emit Socket.IO event to recipient
    const io = req.app.get('io');
    if (io) {
      const populatedRequest = await ChatRequest.findById(request._id).populate(
        'sender',
        'username bio interests isOnline lastSeen'
      );
      if (populatedRequest) {
        io.to(receiverId).emit('request_received', { request: populatedRequest });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Chat request sent successfully',
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get incoming pending chat requests
 * @route   GET /api/requests/incoming
 * @access  Private
 */
export const getIncomingRequests = async (req, res, next) => {
  try {
    const requests = await ChatRequest.find({
      receiver: req.user._id,
      status: 'pending'
    }).populate('sender', 'username bio interests isOnline lastSeen');

    res.status(200).json({
      success: true,
      message: 'Incoming chat requests retrieved successfully',
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sent chat requests
 * @route   GET /api/requests/sent
 * @access  Private
 */
export const getSentRequests = async (req, res, next) => {
  try {
    const requests = await ChatRequest.find({
      sender: req.user._id
    }).populate('receiver', 'username bio interests isOnline lastSeen');

    res.status(200).json({
      success: true,
      message: 'Sent chat requests retrieved successfully',
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept a chat request
 * @route   POST /api/requests/:id/accept
 * @access  Private
 */
export const acceptRequest = async (req, res, next) => {
  try {
    const request = await ChatRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }

    // Enforce that only the receiver can accept the request
    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    // 1. Mark request accepted
    request.status = 'accepted';
    await request.save();

    // 2. Calculate expiration time if temporary
    let expiresAt = null;
    if (request.isTemporary) {
      const duration = request.expiryDuration;
      const now = new Date();

      if (duration === '1h' || duration === '1 hour') {
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
      } else if (duration === '24h' || duration === '24 hours') {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (duration === '7d' || duration === '7 days') {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // fallback 24h
      }
    }

    // 3. Create conversation
    // Participants array is sorted in Conversation Schema validate hook
    let conversation;
    try {
      conversation = await Conversation.create({
        participants: [request.sender, request.receiver],
        isTemporary: request.isTemporary,
        expiresAt
      });
    } catch (err) {
      // If a duplicate conversation exists (due to race condition or manual insertion)
      if (err.code === 11000) {
        conversation = await Conversation.findOne({
          participants: { $all: [request.sender, request.receiver] }
        });
      } else {
        throw err;
      }
    }

    // Emit Socket.IO event to participants
    const io = req.app.get('io');
    if (io) {
      const populatedConv = await Conversation.findById(conversation._id).populate(
        'participants',
        'username isOnline lastSeen bio interests'
      );
      if (populatedConv) {
        // Format for sender (request.sender)
        const senderOtherParticipant = populatedConv.participants.find(
          (p) => p._id.toString() === request.receiver.toString()
        );
        const senderConvData = {
          _id: populatedConv._id.toString(),
          participants: populatedConv.participants.map((p) => ({
            id: p._id.toString(),
            username: p.username
          })),
          otherParticipant: senderOtherParticipant
            ? {
                id: senderOtherParticipant._id.toString(),
                username: senderOtherParticipant.username,
                isOnline: senderOtherParticipant.isOnline,
                lastSeen: senderOtherParticipant.lastSeen
              }
            : null,
          latestMessage: null,
          unreadCount: 0,
          isTemporary: populatedConv.isTemporary,
          expiresAt: populatedConv.expiresAt,
          createdAt: populatedConv.createdAt,
          updatedAt: populatedConv.updatedAt
        };

        // Format for receiver (request.receiver)
        const receiverOtherParticipant = populatedConv.participants.find(
          (p) => p._id.toString() === request.sender.toString()
        );
        const receiverConvData = {
          _id: populatedConv._id.toString(),
          participants: populatedConv.participants.map((p) => ({
            id: p._id.toString(),
            username: p.username
          })),
          otherParticipant: receiverOtherParticipant
            ? {
                id: receiverOtherParticipant._id.toString(),
                username: receiverOtherParticipant.username,
                isOnline: receiverOtherParticipant.isOnline,
                lastSeen: receiverOtherParticipant.lastSeen
              }
            : null,
          latestMessage: null,
          unreadCount: 0,
          isTemporary: populatedConv.isTemporary,
          expiresAt: populatedConv.expiresAt,
          createdAt: populatedConv.createdAt,
          updatedAt: populatedConv.updatedAt
        };

        io.to(request.sender.toString()).emit('conversation_created', senderConvData);
        io.to(request.receiver.toString()).emit('conversation_created', receiverConvData);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Chat request accepted',
      data: {
        request,
        conversation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a chat request
 * @route   POST /api/requests/:id/reject
 * @access  Private
 */
export const rejectRequest = async (req, res, next) => {
  try {
    const request = await ChatRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found'
      });
    }

    // Enforce that only the receiver can reject the request
    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    request.status = 'rejected';
    await request.save();

    // Emit Socket.IO event to sender
    const io = req.app.get('io');
    if (io) {
      io.to(request.sender.toString()).emit('request_rejected', { requestId: request._id.toString() });
    }

    res.status(200).json({
      success: true,
      message: 'Chat request rejected',
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};
