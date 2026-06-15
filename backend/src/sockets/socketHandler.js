import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const socketHandler = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      if (!token) {
        // Fallback to query param
        token = socket.handshake.query?.token;
      }

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    const userIdStr = user._id.toString();

    // Join room named after user's ID to allow targeting all user's sessions/tabs
    await socket.join(userIdStr);

    console.log(`User connected: ${user.username} (Socket: ${socket.id})`);

    // Check if this is the first connection for the user (to avoid duplicate online broadcasts)
    const activeSockets = await io.in(userIdStr).fetchSockets();
    if (activeSockets.length === 1) {
      try {
        await User.findByIdAndUpdate(user._id, { isOnline: true });
        // Broadcast online status to all other users
        socket.broadcast.emit('user_online', {
          userId: user._id,
          username: user.username
        });
      } catch (err) {
        console.error(`Error updating online status for ${user.username}:`, err);
      }
    }

    // 1. Send message event
    socket.on('send_message', async (payload, callback) => {
      try {
        const { conversationId, content } = payload;

        if (!conversationId || !content) {
          if (callback) callback({ success: false, message: 'Invalid payload' });
          return;
        }

        // Validate conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(
          (pId) => pId.toString() === userIdStr
        );
        if (!isParticipant) {
          if (callback) callback({ success: false, message: 'Not authorized in this conversation' });
          return;
        }

        // Save message to MongoDB
        const message = await Message.create({
          conversationId,
          sender: user._id,
          content,
          isRead: false
        });

        // Update conversation's updatedAt timestamp
        conversation.updatedAt = new Date();
        await conversation.save();

        const responseData = {
          _id: message._id,
          conversationId: message.conversationId,
          sender: {
            id: user._id,
            username: user.username
          },
          content: message.content,
          isRead: message.isRead,
          createdAt: message.createdAt
        };

        // Determine recipient ID
        const recipientId = conversation.participants.find(
          (pId) => pId.toString() !== userIdStr
        );

        if (recipientId) {
          // Emit receive_message to recipient's room
          io.to(recipientId.toString()).emit('receive_message', responseData);
        }

        // Sync other tabs of the sender
        socket.to(userIdStr).emit('receive_message', responseData);

        // Acknowledge receipt
        if (callback) {
          callback({
            success: true,
            data: responseData
          });
        }
      } catch (err) {
        console.error('Error in send_message socket event:', err);
        if (callback) callback({ success: false, message: 'Server error sending message' });
      }
    });

    // 2. Typing indicator: Start typing
    socket.on('typing_start', async (payload) => {
      try {
        const { conversationId } = payload;
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const recipientId = conversation.participants.find(
            (pId) => pId.toString() !== userIdStr
          );
          if (recipientId) {
            io.to(recipientId.toString()).emit('typing_start', {
              conversationId,
              senderId: user._id
            });
          }
        }
      } catch (err) {
        console.error('Error in typing_start socket event:', err);
      }
    });

    // 3. Typing indicator: Stop typing
    socket.on('typing_stop', async (payload) => {
      try {
        const { conversationId } = payload;
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const recipientId = conversation.participants.find(
            (pId) => pId.toString() !== userIdStr
          );
          if (recipientId) {
            io.to(recipientId.toString()).emit('typing_stop', {
              conversationId,
              senderId: user._id
            });
          }
        }
      } catch (err) {
        console.error('Error in typing_stop socket event:', err);
      }
    });

    // 4. Message read event
    socket.on('message_read', async (payload, callback) => {
      try {
        const { conversationId } = payload;
        if (!conversationId) {
          if (callback) callback({ success: false, message: 'conversationId required' });
          return;
        }

        // Update all unread messages from the other user in this conversation to read
        await Message.updateMany(
          {
            conversationId,
            sender: { $ne: user._id },
            isRead: false
          },
          { $set: { isRead: true } }
        );

        // Find the conversation to notify the partner
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const recipientId = conversation.participants.find(
            (pId) => pId.toString() !== userIdStr
          );
          if (recipientId) {
            io.to(recipientId.toString()).emit('message_read_receipt', {
              conversationId,
              readerId: user._id
            });
          }
        }

        if (callback) {
          callback({ success: true, message: 'Messages marked as read' });
        }
      } catch (err) {
        console.error('Error in message_read socket event:', err);
        if (callback) callback({ success: false, message: 'Server error marking messages read' });
      }
    });

    // 5. Handle user disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${user.username})`);
      
      // Check if user has other active sockets (e.g. tabs open)
      const remainingSockets = await io.in(userIdStr).fetchSockets();
      if (remainingSockets.length === 0) {
        try {
          const lastSeenDate = new Date();
          await User.findByIdAndUpdate(user._id, {
            isOnline: false,
            lastSeen: lastSeenDate
          });
          
          // Broadcast offline status to all other users
          socket.broadcast.emit('user_offline', {
            userId: user._id,
            username: user.username,
            lastSeen: lastSeenDate
          });
        } catch (err) {
          console.error(`Error updating offline status for ${user.username}:`, err);
        }
      }
    });
  });
};
