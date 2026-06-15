import { create } from 'zustand';
import api from '../services/api.js';
import type { Conversation, Message, ChatRequest, User } from '../types/index.js';
import { useSocketStore } from './useSocketStore.js';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isLoadingMessages: boolean;
  messagesPagination: {
    total: number;
    page: number;
    pages: number;
  } | null;
  requests: {
    incoming: ChatRequest[];
    sent: ChatRequest[];
  };
  typingUsers: Record<string, string[]>; // conversationId -> array of typing userIds
  searchResults: User[];
  searchPagination: {
    total: number;
    page: number;
    pages: number;
  } | null;
  isLoadingConversations: boolean;
  isLoadingRequests: boolean;
  isLoadingSearch: boolean;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, page?: number) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  sendReadReceipt: (conversationId: string) => void;

  fetchRequests: () => Promise<void>;
  sendChatRequest: (receiverId: string, isTemporary?: boolean, expiryDuration?: string) => Promise<void>;
  acceptChatRequest: (requestId: string) => Promise<void>;
  rejectChatRequest: (requestId: string) => Promise<void>;
  searchUsers: (query: string, page?: number) => Promise<void>;

  setActiveConversationId: (id: string | null) => void;
  addIncomingMessage: (msg: Message) => void;
  setPartnerTyping: (conversationId: string, partnerId: string, isTyping: boolean) => void;
  markConversationReadLocally: (conversationId: string, readerId: string) => void;
  updatePartnerOnlineStatus: (userId: string, isOnline: boolean, lastSeen?: string) => void;
  updateConversationExpiry: (id: string, isTemporary: boolean, expiryDuration: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationExpiryState: (conversationId: string, isTemporary: boolean, expiresAt: string | null) => void;
  removeConversationLocally: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoadingMessages: false,
  messagesPagination: null,
  requests: {
    incoming: [],
    sent: []
  },
  typingUsers: {},
  searchResults: [],
  searchPagination: null,
  isLoadingConversations: false,
  isLoadingRequests: false,
  isLoadingSearch: false,

  setActiveConversationId: (id) => {
    set({ activeConversationId: id, messages: [], messagesPagination: null });
    if (id) {
      get().fetchMessages(id);
      get().sendReadReceipt(id);
    }
  },

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const response = await api.get('/conversations');
      set({ conversations: response.data.data.conversations, isLoadingConversations: false });
    } catch (error) {
      set({ isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId, page = 1) => {
    set({ isLoadingMessages: true });
    try {
      const response = await api.get(`/conversations/${conversationId}/messages?page=${page}&limit=30`);
      const { messages, pagination } = response.data.data;
      
      set((state) => ({
        messages: page === 1 ? messages : [...messages, ...state.messages],
        messagesPagination: pagination,
        isLoadingMessages: false
      }));
    } catch (error) {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId, content) => {
    const socket = useSocketStore.getState().socket;
    if (!socket) throw new Error('Socket not connected');

    return new Promise((resolve, reject) => {
      socket.emit('send_message', { conversationId, content }, (response: any) => {
        if (response.success) {
          const newMsg: Message = {
            _id: response.data._id,
            conversationId: response.data.conversationId,
            sender: response.data.sender,
            content: response.data.content,
            isRead: response.data.isRead,
            createdAt: response.data.createdAt
          };

          // Append locally
          set((state) => ({
            messages: [...state.messages, newMsg],
            conversations: state.conversations.map((conv) => {
              if (conv._id === conversationId) {
                return {
                  ...conv,
                  latestMessage: {
                    _id: newMsg._id,
                    conversationId: newMsg.conversationId,
                    sender: newMsg.sender.id,
                    content: newMsg.content,
                    isRead: newMsg.isRead,
                    createdAt: newMsg.createdAt
                  }
                };
              }
              return conv;
            })
          }));

          resolve();
        } else {
          reject(new Error(response.message || 'Failed to send message'));
        }
      });
    });
  },

  sendTyping: (conversationId, isTyping) => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;
    
    const event = isTyping ? 'typing_start' : 'typing_stop';
    socket.emit(event, { conversationId });
  },

  sendReadReceipt: (conversationId) => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.emit('message_read', { conversationId }, (res: any) => {
      if (res?.success) {
        // Clear unread count locally for this conversation
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversationId ? { ...c, unreadCount: 0 } : c
          )
        }));
      }
    });
  },

  fetchRequests: async () => {
    set({ isLoadingRequests: true });
    try {
      const [incomingRes, sentRes] = await Promise.all([
        api.get('/requests/incoming'),
        api.get('/requests/sent')
      ]);

      set({
        requests: {
          incoming: incomingRes.data.data.requests,
          sent: sentRes.data.data.requests
        },
        isLoadingRequests: false
      });
    } catch (error) {
      set({ isLoadingRequests: false });
    }
  },

  sendChatRequest: async (receiverId, isTemporary = false, expiryDuration = '24h') => {
    try {
      const payload: any = { receiverId, isTemporary };
      if (isTemporary && expiryDuration) {
        payload.expiryDuration = expiryDuration;
      }
      await api.post('/requests', payload);
      await get().fetchRequests();
    } catch (error: any) {
      throw error;
    }
  },

  acceptChatRequest: async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/accept`);
      await Promise.all([
        get().fetchRequests(),
        get().fetchConversations()
      ]);
    } catch (error: any) {
      throw error;
    }
  },

  rejectChatRequest: async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/reject`);
      await get().fetchRequests();
    } catch (error: any) {
      throw error;
    }
  },

  searchUsers: async (query, page = 1) => {
    if (!query.trim()) {
      set({ searchResults: [], searchPagination: null });
      return;
    }
    set({ isLoadingSearch: true });
    try {
      const response = await api.get(`/users/search?q=${query}&page=${page}&limit=10`);
      const { users, pagination } = response.data.data;
      set({
        searchResults: users,
        searchPagination: pagination,
        isLoadingSearch: false
      });
    } catch (error) {
      set({ isLoadingSearch: false });
    }
  },

  addIncomingMessage: (msg) => {
    const activeConvId = get().activeConversationId;
    const isCurrentActive = activeConvId === msg.conversationId;

    // Append to messages list if conversation is active
    if (isCurrentActive) {
      set((state) => ({
        messages: [...state.messages, msg]
      }));
      // Automatically read it since user is looking at it
      get().sendReadReceipt(msg.conversationId);
    }

    // Update conversations list with latest message and unread count
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv._id === msg.conversationId) {
          return {
            ...conv,
            latestMessage: {
              _id: msg._id,
              conversationId: msg.conversationId,
              sender: msg.sender.id,
              content: msg.content,
              isRead: isCurrentActive,
              createdAt: msg.createdAt
            },
            unreadCount: isCurrentActive ? 0 : conv.unreadCount + 1
          };
        }
        return conv;
      })
    }));
  },

  setPartnerTyping: (conversationId, partnerId, isTyping) => {
    set((state) => {
      const typing = { ...state.typingUsers };
      const currentList = typing[conversationId] || [];

      if (isTyping) {
        if (!currentList.includes(partnerId)) {
          typing[conversationId] = [...currentList, partnerId];
        }
      } else {
        typing[conversationId] = currentList.filter((id) => id !== partnerId);
      }

      return { typingUsers: typing };
    });
  },

  markConversationReadLocally: (conversationId, readerId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.conversationId === conversationId && m.sender.id !== readerId
          ? { ...m, isRead: true }
          : m
      ),
      conversations: state.conversations.map((conv) => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            latestMessage: conv.latestMessage
              ? { ...conv.latestMessage, isRead: true }
              : null
          };
        }
        return conv;
      })
    }));
  },

  updatePartnerOnlineStatus: (userId, isOnline, lastSeen) => {
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.otherParticipant && conv.otherParticipant.id === userId) {
          return {
            ...conv,
            otherParticipant: {
              ...conv.otherParticipant,
              isOnline,
              lastSeen: lastSeen || conv.otherParticipant.lastSeen
            }
          };
        }
        return conv;
      })
    }));
  },

  updateConversationExpiry: async (id, isTemporary, expiryDuration) => {
    try {
      const response = await api.put(`/conversations/${id}/expiry`, { isTemporary, expiryDuration });
      const updatedConv = response.data.data.conversation;
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === id ? { ...c, isTemporary: updatedConv.isTemporary, expiresAt: updatedConv.expiresAt } : c
        )
      }));
    } catch (error: any) {
      throw error;
    }
  },

  deleteConversation: async (id) => {
    try {
      await api.delete(`/conversations/${id}`);
      set((state) => ({
        conversations: state.conversations.filter((c) => c._id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        messages: state.activeConversationId === id ? [] : state.messages,
        messagesPagination: state.activeConversationId === id ? null : state.messagesPagination
      }));
    } catch (error: any) {
      throw error;
    }
  },

  updateConversationExpiryState: (conversationId, isTemporary, expiresAt) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, isTemporary, expiresAt } : c
      )
    }));
  },

  removeConversationLocally: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.filter((c) => c._id !== conversationId),
      activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
      messages: state.activeConversationId === conversationId ? [] : state.messages,
      messagesPagination: state.activeConversationId === conversationId ? null : state.messagesPagination
    }));
  }
}));
