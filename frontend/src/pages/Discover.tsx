import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useChatStore } from '../store/useChatStore.js';
import SearchBar from '../components/ui/SearchBar.js';
import UserCard from '../components/UserCard.js';
import Loader from '../components/ui/Loader.js';

export const Discover: React.FC = () => {
  const {
    searchResults,
    searchPagination,
    isLoadingSearch,
    requests,
    conversations,
    searchUsers,
    sendChatRequest,
    fetchConversations,
    fetchRequests
  } = useChatStore();

  const [query, setQuery] = useState('');

  // Fetch initial helper records
  useEffect(() => {
    fetchConversations();
    fetchRequests();
  }, [fetchConversations, fetchRequests]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchUsers(query, 1);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, searchUsers]);

  const handlePageChange = (newPage: number) => {
    searchUsers(query, newPage);
  };

  const handleSend = async (receiverId: string, isTemporary: boolean, duration: string) => {
    await sendChatRequest(receiverId, isTemporary, duration);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full px-4 md:px-6 py-4 md:py-6 overflow-y-auto overscroll-y-contain">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-accent" />
          <h1 className="text-sm md:text-lg font-bold tracking-wide text-primaryText uppercase font-mono">DISCOVER</h1>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wide text-secondaryText">Search by alias</span>
      </div>

      <div className="mb-5">
        <SearchBar
          value={query}
          onSearchChange={setQuery}
          placeholder="Search aliases (or browse all)..."
        />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {isLoadingSearch ? (
          <div className="flex-1 flex items-center justify-center min-h-[260px]">
            <Loader label="SEARCHING USERS..." />
          </div>
        ) : searchResults.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.16 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4"
          >
            {searchResults.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                sentRequests={requests.sent}
                conversations={conversations}
                onSendRequest={handleSend}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl min-h-[260px] text-center p-6 panel-primary">
            <Users className="w-8 h-8 text-zinc-600 mb-3" />
            <h3 className="font-mono text-xs font-bold uppercase text-secondaryText tracking-widest">
              {query.trim() ? 'NO MATCH IN DIRECTORY' : 'QUERY USER DIRECTORY'}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">
              {query.trim() ? 'Adjust your alias query and retry' : 'Use /discover to open a new relay'}
            </p>
          </div>
        )}

        {searchPagination && searchPagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6 border-t border-border pt-4">
            <button
              onClick={() => handlePageChange(searchPagination.page - 1)}
              disabled={searchPagination.page === 1}
              className="p-2 rounded-lg bg-card border border-border text-zinc-400 hover:text-primaryText hover:bg-border/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-secondaryText uppercase">
              PAGE {searchPagination.page} OF {searchPagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(searchPagination.page + 1)}
              disabled={searchPagination.page === searchPagination.pages}
              className="p-2 rounded-lg bg-card border border-border text-zinc-400 hover:text-primaryText hover:bg-border/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
