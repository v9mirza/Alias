import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { User, Conversation, ChatRequest } from '../types/index.js';
import Button from './ui/Button.js';
import Avatar from './ui/Avatar.js';

interface UserCardProps {
  user: User;
  sentRequests: ChatRequest[];
  conversations: Conversation[];
  onSendRequest: (receiverId: string, isTemporary: boolean, duration: string) => Promise<void>;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  sentRequests,
  conversations,
  onSendRequest
}) => {
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check relationship status
  const pendingRequest = sentRequests.find(
    (req) => req.status === 'pending' && (req.receiver?.id === user.id || (typeof req.receiver === 'string' && req.receiver === user.id))
  );
  
  const alreadyChatting = conversations.some(
    (conv) => conv.otherParticipant?.id === user.id
  );

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSendRequest(user.id, false, '');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-4 rounded-2xl bg-card border border-border flex flex-col gap-4 transition-colors hover:bg-card/80 relative overflow-hidden"
    >
      <div className="flex items-start gap-4">
        <Avatar username={user.username} size="md" isOnline={user.isOnline} />
        <div className="flex-1 min-w-0">
          <h3 className="font-mono text-sm font-bold text-primaryText truncate">
            &gt; {user.username}
          </h3>
          <p className="text-xs text-secondaryText mt-1 line-clamp-2">
            {user.bio || 'No bio provided.'}
          </p>
        </div>
      </div>

      {/* Interest tags */}
      {user.interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {user.interests.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1e1e1e] border border-border text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Relationship CTA actions */}
      <div className="mt-1.5 flex flex-col gap-2">
        {alreadyChatting ? (
          <Button variant="secondary" disabled className="w-full text-xs font-mono">
            <Check className="w-3.5 h-3.5" /> CHAT ACTIVE
          </Button>
        ) : pendingRequest ? (
          <Button variant="secondary" disabled className="w-full text-xs font-mono">
            PENDING REQUEST
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSend}
            isLoading={isSending}
            className="w-full text-xs font-mono"
          >
            {success ? 'SENT!' : 'SEND REQUEST'}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default UserCard;
