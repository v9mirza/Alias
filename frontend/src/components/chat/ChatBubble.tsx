import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '../../types/index.js';

interface ChatBubbleProps {
  message: Message;
  isOutgoing: boolean;
  showMeta?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOutgoing, showMeta = true }) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`flex w-full ${isOutgoing ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[70%] flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} gap-1`}>
        <div
          className={`px-4 py-2.5 rounded-2xl border text-sm shadow-sm leading-relaxed ${
            isOutgoing
              ? 'bg-accent border-transparent text-[#02140f] rounded-br-sm'
              : 'bg-card border-border text-primaryText rounded-bl-sm hacker-panel'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {showMeta && (
          <div className="flex items-center gap-1.5 px-1.5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              {formatTime(message.createdAt)}
            </span>
            {isOutgoing && (
              <span className="text-zinc-500">
                {message.isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-zinc-600" />
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatBubble;
