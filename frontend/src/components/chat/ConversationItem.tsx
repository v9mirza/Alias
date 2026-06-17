import React from 'react';
import type { Conversation } from '../../types/index.js';
import Avatar from '../ui/Avatar.js';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const { otherParticipant, latestMessage, unreadCount } = conversation;
  
  if (!otherParticipant) return null;

  // Format message time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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
          <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
            {formatTime(latestMessage?.createdAt || conversation.updatedAt)}
          </span>
        </div>

        <p className="text-xs text-secondaryText/90 truncate mt-1 max-w-[190px]">
          {latestMessage ? latestMessage.content : 'No messages yet.'}
        </p>
      </div>

      {unreadCount > 0 && (
        <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-accent/85 border border-accent flex items-center justify-center text-[10px] font-mono font-bold text-[#03100d]">
          {unreadCount}
        </div>
      )}
    </button>
  );
};

export default ConversationItem;
