export interface User {
  id: string;
  username: string;
  bio: string;
  interests: string[];
  isOnline: boolean;
  lastSeen: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatRequest {
  _id: string;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'rejected';
  isTemporary: boolean;
  expiryDuration: '1h' | '24h' | '7d' | '1 hour' | '24 hours' | '7 days' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: {
    id: string;
    username: string;
  }[];
  otherParticipant: {
    id: string;
    username: string;
    isOnline: boolean;
    lastSeen: string;
  } | null;
  latestMessage: {
    _id: string;
    conversationId: string;
    sender: string; // User ID
    content: string;
    isRead: boolean;
    createdAt: string;
  } | null;
  unreadCount: number;
  isTemporary: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    id: string;
    username: string;
  };
  content: string;
  isRead: boolean;
  createdAt: string;
}
