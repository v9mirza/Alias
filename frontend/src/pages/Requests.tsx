import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Check, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useChatStore } from '../store/useChatStore.js';
import Button from '../components/ui/Button.js';
import Avatar from '../components/ui/Avatar.js';
import Loader from '../components/ui/Loader.js';
import Badge from '../components/ui/Badge.js';

export const Requests: React.FC = () => {
  const {
    requests,
    isLoadingRequests,
    fetchRequests,
    acceptChatRequest,
    rejectChatRequest
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (id: string) => {
    setActionId(id);
    try {
      await acceptChatRequest(id);
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      await rejectChatRequest(id);
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const listData = activeTab === 'incoming' ? requests.incoming : requests.sent;

  return (
    <div className="flex-1 flex flex-col px-4 md:px-6 py-4 md:py-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <Inbox className="w-5 h-5 text-accent" />
        <h1 className="text-sm md:text-lg font-bold tracking-tight text-primaryText uppercase font-mono">CHAT REQUESTS</h1>
      </div>

      <div className="flex gap-3 border-b border-border pb-px mb-4">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 font-mono text-[11px] font-bold tracking-widest transition-all relative ${
            activeTab === 'incoming' ? 'text-accent' : 'text-secondaryText hover:text-primaryText'
          }`}
        >
          INCOMING ({requests.incoming.length})
          {activeTab === 'incoming' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 font-mono text-[11px] font-bold tracking-widest transition-all relative ${
            activeTab === 'sent' ? 'text-accent' : 'text-secondaryText hover:text-primaryText'
          }`}
        >
          SENT ({requests.sent.length})
          {activeTab === 'sent' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
            />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {isLoadingRequests ? (
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <Loader label="LOADING REQUESTS..." />
          </div>
        ) : listData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3 max-w-3xl"
          >
            <AnimatePresence mode="popLayout">
              {listData.map((req) => {
                const partner = activeTab === 'incoming' ? req.sender : req.receiver;
                if (!partner) return null;

                return (
                  <motion.div
                    key={req._id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative">
                        <Avatar username={partner.username} size="md" />
                        <span className="absolute -top-1 -left-1 p-0.5 rounded bg-background border border-border">
                          {activeTab === 'incoming' ? (
                            <ArrowDownLeft className="w-3 h-3 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-accent" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-bold text-primaryText truncate block">
                          &gt; {partner.username}
                        </span>
                        {partner.interests && partner.interests.length > 0 && (
                          <div className="flex gap-1.5 mt-1.5 overflow-hidden">
                            {partner.interests.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[9px] font-mono text-zinc-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {req.isTemporary && (
                        <Badge variant="primary" className="hidden sm:inline-flex">
                          TEMP • {req.expiryDuration}
                        </Badge>
                      )}

                      {activeTab === 'incoming' ? (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => handleReject(req._id)}
                            disabled={actionId !== null}
                            className="px-3"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleAccept(req._id)}
                            isLoading={actionId === req._id}
                            disabled={actionId !== null}
                            className="px-3.5 font-mono text-xs"
                          >
                            <Check className="w-4 h-4" /> ACCEPT
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-3 py-1 bg-surface border border-border rounded-lg">
                          {req.status}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl min-h-[260px] text-center p-6 bg-card/20 max-w-3xl">
            <Inbox className="w-8 h-8 text-zinc-600 mb-3" />
            <h3 className="font-mono text-xs font-bold uppercase text-secondaryText tracking-widest">
              REQUEST QUEUE EMPTY
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">
              {activeTab === 'incoming'
                ? 'No inbound pings in relay queue'
                : 'Open /discover to dispatch a new request'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
