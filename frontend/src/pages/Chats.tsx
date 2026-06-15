import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Clock, Circle, Settings, Trash2, ShieldAlert } from 'lucide-react';
import { useChatStore } from '../store/useChatStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import ConversationItem from '../components/chat/ConversationItem.js';
import ChatBubble from '../components/chat/ChatBubble.js';
import Avatar from '../components/ui/Avatar.js';
import Badge from '../components/ui/Badge.js';
import Loader from '../components/ui/Loader.js';

const RemainingTimeBadge: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        setTimeLeft(`${days}D ${remainingHours}H`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}H ${mins}M`);
      } else {
        setTimeLeft(`${mins}M`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 15000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <Badge variant="primary" className="text-[9px] py-1 px-2.5 flex items-center gap-1.5 border border-accent/25 bg-accent/10 text-accent font-mono">
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      DISAPPEARING CHAT ({timeLeft})
    </Badge>
  );
};

export const Chats: React.FC = () => {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    typingUsers,
    fetchConversations,
    setActiveConversationId,
    sendMessage,
    sendTyping,
    updateConversationExpiry,
    deleteConversation
  } = useChatStore();

  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const activeConv = conversations.find((c) => c._id === activeConversationId);
  const partner = activeConv?.otherParticipant;

  // Fetch conversations list initially
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Close settings dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset dropdown state when changing chats
  useEffect(() => {
    setShowSettings(false);
    setConfirmDelete(false);
  }, [activeConversationId]);

  // Clean up typing indicator for previous chat when active conversation changes or component unmounts
  const prevActiveConvIdRef = useRef<string | null>(null);

  useEffect(() => {
    const prevId = prevActiveConvIdRef.current;
    if (prevId && prevId !== activeConversationId) {
      // User switched conversation, send typing_stop for previous one
      sendTyping(prevId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
    prevActiveConvIdRef.current = activeConversationId;
  }, [activeConversationId, sendTyping]);

  useEffect(() => {
    return () => {
      if (prevActiveConvIdRef.current) {
        sendTyping(prevActiveConvIdRef.current, false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [sendTyping]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConversationId]);

  // Send message handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeConversationId) return;

    // Stop typing immediately on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      sendTyping(activeConversationId, false);
    }

    setSending(true);
    try {
      await sendMessage(activeConversationId, inputMsg.trim());
      setInputMsg('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Typing state changes trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMsg(e.target.value);
    if (!activeConversationId) return;

    // Emit typing_start immediately if timeout isn't active
    if (!typingTimeoutRef.current) {
      sendTyping(activeConversationId, true);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing_stop
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(activeConversationId, false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Format last seen timestamp
  const formatLastSeen = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `LAST SEEN: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`;
  };

  const handleUpdateExpiry = async (isTemporary: boolean, duration: string) => {
    if (!activeConversationId) return;
    try {
      await updateConversationExpiry(activeConversationId, isTemporary, duration);
    } catch (err) {
      console.error('Failed to update conversation expiry:', err);
    }
  };

  const handleDeleteChat = async () => {
    if (!activeConversationId) return;
    try {
      await deleteConversation(activeConversationId);
      setShowSettings(false);
      setConfirmDelete(false);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const getActiveDuration = () => {
    if (!activeConv?.isTemporary || !activeConv.expiresAt) return 'off';
    const expiresAt = new Date(activeConv.expiresAt).getTime();
    const updatedAt = new Date(activeConv.updatedAt).getTime();
    const diff = expiresAt - updatedAt;
    
    const margin = 5000; // 5 seconds margin
    if (Math.abs(diff - 60 * 60 * 1000) < margin) return '1h';
    if (Math.abs(diff - 24 * 60 * 60 * 1000) < margin) return '24h';
    if (Math.abs(diff - 7 * 24 * 60 * 60 * 1000) < margin) return '7d';
    
    const remaining = expiresAt - Date.now();
    if (remaining > 24 * 60 * 60 * 1000) return '7d';
    if (remaining > 60 * 60 * 1000) return '24h';
    return '1h';
  };

  // Check if partner is typing
  const partnerIsTyping =
    activeConversationId &&
    partner &&
    typingUsers[activeConversationId]?.includes(partner.id);

  console.log('Typing Status debug:', {
    activeConversationId,
    partnerId: partner?.id,
    typingList: activeConversationId ? typingUsers[activeConversationId] : null,
    partnerIsTyping
  });

  return (
    <div className="flex-1 flex min-h-0 bg-background">
      {/* Left panel: Conversations List */}
      <section className="w-80 border-r border-border flex flex-col bg-surface/30 min-h-0">
        <div className="p-4 border-b border-border">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-secondaryText">
            CHATS
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {isLoadingConversations ? (
            <div className="py-12 flex justify-center">
              <Loader label="LOADING CHATS..." />
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                isActive={conv._id === activeConversationId}
                onClick={() => setActiveConversationId(conv._id)}
              />
            ))
          ) : (
            <div className="py-12 text-center px-4 font-mono text-[10px] text-zinc-500 uppercase">
              No active chats. Find people in the Discover page.
            </div>
          )}
        </div>
      </section>

      {/* Right panel: Active Chat dialogue */}
      <section className="flex-1 flex flex-col bg-background min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeConversationId && activeConv && partner ? (
            <motion.div
              key={activeConversationId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Active Chat Header Banner */}
              <header className="p-4 border-b border-border bg-card/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar username={partner.username} size="sm" isOnline={partner.isOnline} />
                  <div>
                    <h3 className="font-mono text-sm font-bold text-primaryText">
                      &gt; {partner.username}
                    </h3>
                    <p className="text-[9px] font-mono text-zinc-500 tracking-wider">
                      {partner.isOnline ? (
                        <span className="text-green-400 flex items-center gap-1 font-bold">
                          <Circle className="w-2 h-2 fill-green-400" /> ONLINE
                        </span>
                      ) : (
                        formatLastSeen(partner.lastSeen)
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative" ref={settingsRef}>
                  {activeConv.isTemporary && activeConv.expiresAt && (
                    <RemainingTimeBadge expiresAt={activeConv.expiresAt} />
                  )}

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-lg text-secondaryText hover:text-primaryText hover:bg-card border transition-all ${
                      showSettings ? 'bg-card border-border text-primaryText' : 'border-transparent'
                    }`}
                    title="Chat Settings"
                  >
                    <Settings className="w-4.5 h-4.5" />
                  </button>

                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-4 font-mono text-xs text-primaryText"
                      >
                        <div>
                          <div className="text-[10px] text-secondaryText uppercase tracking-wider mb-2 font-bold">
                            Disappearing Messages
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { label: 'OFF', isTemp: false, duration: '' },
                              { label: '1 HOUR', isTemp: true, duration: '1h' },
                              { label: '24 HOURS', isTemp: true, duration: '24h' },
                              { label: '7 DAYS', isTemp: true, duration: '7d' }
                            ].map((opt) => {
                              const isActive = opt.isTemp 
                                ? (activeConv.isTemporary && getActiveDuration() === opt.duration)
                                : !activeConv.isTemporary;

                              return (
                                <button
                                  key={opt.label}
                                  onClick={() => handleUpdateExpiry(opt.isTemp, opt.duration)}
                                  className={`py-2 px-2.5 rounded-lg border text-center transition-all text-[10px] font-bold tracking-wider ${
                                    isActive
                                      ? 'bg-accent border-accent text-white shadow-lg shadow-accent/25'
                                      : 'bg-[#1b1b1b] border-border hover:border-zinc-500 text-secondaryText hover:text-primaryText'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="border-t border-border pt-3 mt-1">
                          {!confirmDelete ? (
                            <button
                              onClick={() => setConfirmDelete(true)}
                              className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold tracking-wider flex items-center justify-center gap-2 transition-all text-[10px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              DELETE CHAT
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="text-[10px] text-red-400 text-center font-bold tracking-wide flex items-center justify-center gap-1">
                                <ShieldAlert className="w-4 h-4 animate-bounce" />
                                DELETE PERMANENTLY?
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  onClick={handleDeleteChat}
                                  className="py-1.5 px-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-bold transition-all text-[10px]"
                                >
                                  CONFIRM
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(false)}
                                  className="py-1.5 px-2 rounded-lg bg-[#1b1b1b] border border-border text-secondaryText hover:text-primaryText hover:border-zinc-500 font-bold transition-all text-[10px]"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </header>
 
              {/* Message Scroller log */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="py-12 flex justify-center">
                    <Loader label="LOADING MESSAGES..." />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <ChatBubble
                      key={msg._id}
                      message={msg}
                      isOutgoing={msg.sender.id === user?.id || (typeof msg.sender === 'string' && msg.sender === user?.id)}
                    />
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 p-6">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                    <p className="font-mono text-xs uppercase tracking-wide">Chat session started.</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider opacity-60">Send a message to start chatting.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
 
              {/* Typing indicator banner */}
              {partnerIsTyping && (
                <div className="px-6 py-1 text-[10px] font-mono text-accent italic tracking-wider animate-pulse uppercase flex items-center gap-1 bg-surface/5">
                  {partner.username} is typing...
                </div>
              )}
 
              {/* Input Footer Form */}
              <footer className="p-4 border-t border-border bg-surface/20">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-lg bg-card border border-border text-primaryText text-sm focus:outline-none focus:border-accent/60 placeholder:text-zinc-600 transition-all font-sans"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!inputMsg.trim() || sending}
                    className="p-2.5 rounded-lg bg-accent text-white hover:bg-[#7c4df2] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>
              </footer>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-l border-border/10">
              <div className="p-4 rounded-full bg-card/40 border border-border mb-4">
                <MessageSquare className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="font-mono text-xs font-bold uppercase text-secondaryText tracking-widest">
                NO ACTIVE CHAT
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-1.5 uppercase tracking-wide max-w-[280px]">
                Select a user from the sidebar list to start messaging
              </p>
            </div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Chats;
