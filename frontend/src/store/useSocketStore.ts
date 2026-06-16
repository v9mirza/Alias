import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from './useChatStore.js';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  connectionError: string | null;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  connectionError: null,

  connectSocket: (token) => {
    if (get().socket?.connected) return;

    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const socketUrl = import.meta.env.VITE_SOCKET_URL || `http://${hostname}:5000`;
    console.log(`Connecting to Socket.IO server at ${socketUrl}...`);

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'] // Enforce WebSocket transport
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected. ID:', socket.id);
      set({ isConnected: true, isReconnecting: false, connectionError: null });

      // Sync state with database on connection/reconnection
      const chatStore = useChatStore.getState();
      chatStore.fetchConversations();
      chatStore.fetchRequests();
      const activeId = chatStore.activeConversationId;
      if (activeId) {
        chatStore.fetchMessages(activeId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected. Reason:', reason);
      set({ isConnected: false, isReconnecting: reason !== 'io client disconnect' });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      set({ isConnected: false, isReconnecting: true, connectionError: error.message });
    });

    // Handle real-time messaging events
    socket.on('receive_message', (message) => {
      console.log('Received real-time message:', message);
      useChatStore.getState().addIncomingMessage(message);
    });

    socket.on('typing_start', (data) => {
      console.log('Socket received typing_start:', data);
      useChatStore.getState().setPartnerTyping(data.conversationId, data.senderId, true);
    });

    socket.on('typing_stop', (data) => {
      console.log('Socket received typing_stop:', data);
      useChatStore.getState().setPartnerTyping(data.conversationId, data.senderId, false);
    });

    socket.on('message_read_receipt', (data) => {
      useChatStore.getState().markConversationReadLocally(data.conversationId, data.readerId);
    });

    socket.on('user_online', (data) => {
      console.log(`User online: ${data.username}`);
      useChatStore.getState().updatePartnerOnlineStatus(data.userId, true);
    });

    socket.on('user_offline', (data) => {
      console.log(`User offline: ${data.username}`);
      useChatStore.getState().updatePartnerOnlineStatus(data.userId, false, data.lastSeen);
    });

    socket.on('conversation_expiry_updated', (data) => {
      console.log('Conversation expiry updated:', data);
      useChatStore.getState().updateConversationExpiryState(
        data.conversationId,
        data.isTemporary,
        data.expiresAt
      );
    });

    socket.on('conversation_deleted', (data) => {
      console.log('Conversation deleted:', data);
      useChatStore.getState().removeConversationLocally(data.conversationId);
      useChatStore.getState().clearError();
    });

    socket.on('request_received', (data) => {
      console.log('Socket received request_received:', data);
      useChatStore.getState().fetchRequests();
    });

    socket.on('request_rejected', (data) => {
      console.log('Socket received request_rejected:', data);
      useChatStore.getState().fetchRequests();
    });

    socket.on('conversation_created', (data) => {
      console.log('Socket received conversation_created:', data);
      useChatStore.getState().fetchConversations();
      useChatStore.getState().fetchRequests();
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      console.log('Disconnecting Socket.IO...');
      socket.disconnect();
      set({ socket: null, isConnected: false, isReconnecting: false, connectionError: null });
    }
  }
}));
