import React from 'react';
import { Clock } from 'lucide-react';
import type { Conversation } from '../../types/index.js';
import Avatar from '../ui/Avatar.js';
import Badge from '../ui/Badge.js';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  nowTs: number;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  nowTs
}) => {
  const { otherParticipant, latestMessage, unreadCount, isTemporary, expiresAt } = conversation;
  
  if (!otherParticipant) return null;

  // Format message time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Calculate remaining time for temporary chats
  const getRemainingTime = (expiryString: string | null) => {
    if (!expiryString) return '';
    const diff = new Date(expiryString).getTime() - nowTs;
    if (diff <= 0) return 'EXPIRED';
    
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (days > 0) return `${days}d`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left min-h-16 p-3.5 md:p-4 rounded-xl flex items-center gap-3 border transition-all duration-150 ${
        isActive
          ? 'bg-card border-border shadow-sm'
          : 'bg-transparent border-transparent hover:bg-surface/50'
      }`}
    >
      <Avatar
        username={otherParticipant.username}
        size="md"
        isOnline={otherParticipant.isOnline}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-primaryText truncate">
            {otherParticipant.username}
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            {formatTime(latestMessage?.createdAt || conversation.updatedAt)}
          </span>
        </div>

        <p className="text-xs text-secondaryText truncate mt-0.5 max-w-[180px]">
          {latestMessage ? latestMessage.content : 'No messages yet.'}
        </p>

        <div className="flex items-center gap-1.5 mt-2">
          {isTemporary && expiresAt && (
            <Badge variant="primary" className="text-[8px] tracking-widest px-1 py-0.5">
              <Clock className="w-2.5 h-2.5 mr-1 inline" /> TEMP • {getRemainingTime(expiresAt)}
            </Badge>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="h-5 min-w-[20px] px-1 rounded-full bg-accent flex items-center justify-center text-[10px] font-mono font-bold text-white">
          {unreadCount}
        </div>
      )}
    </button>
  );
};

export default ConversationItem;
