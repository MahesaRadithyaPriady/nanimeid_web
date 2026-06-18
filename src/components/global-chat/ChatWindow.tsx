import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { ChatMessageItem } from './ChatMessageItem';
import type { ChatMessage } from '../../stores/useGlobalChatStore';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
  messages: ChatMessage[];
  hasMore: boolean;
  isLoading?: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  onReply: (message: ChatMessage) => void;
  onDelete: (messageId: number) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  hasMore,
  isLoading,
  isLoadingOlder,
  onLoadOlder,
  onReply,
  onDelete
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevFirstMessageIdRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);

  // Intersection observer for top of the list to load older messages
  const { ref: topLoaderRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px 0px 0px 0px',
  });

  useEffect(() => {
    if (inView && hasMore && !isLoadingOlder) {
      onLoadOlder();
    }
  }, [inView, hasMore, isLoadingOlder, onLoadOlder]);

  // Handle scroll position when new messages arrive or older messages are loaded
  useEffect(() => {
    if (!scrollRef.current) return;

    if (isFirstLoadRef.current && messages.length > 0) {
      // First load, scroll to bottom
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      isFirstLoadRef.current = false;
      prevScrollHeightRef.current = scrollRef.current.scrollHeight;
      prevFirstMessageIdRef.current = messages[0].id;
    } else if (messages.length > 0) {
      const currentScrollHeight = scrollRef.current.scrollHeight;
      const heightDiff = currentScrollHeight - prevScrollHeightRef.current;
      
      if (heightDiff > 0) {
        // Did we prepend? (older messages loaded)
        if (prevFirstMessageIdRef.current !== null && messages[0].id !== prevFirstMessageIdRef.current) {
          // Adjust scroll position so the user stays exactly where they were
          scrollRef.current.scrollTop += heightDiff;
        } else {
          // New message arrived at the bottom
          // Only auto-scroll if user was already near the bottom
          const isNearBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < 300;
          if (isNearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
      
      prevScrollHeightRef.current = currentScrollHeight;
      prevFirstMessageIdRef.current = messages[0].id;
    }
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-black/40 flex flex-col p-4 sm:p-6 space-y-6">
        <div className="mt-auto flex flex-col space-y-6 w-full">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              {i % 2 !== 0 && (
                <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse shrink-0 mr-3 mt-1" />
              )}
              <div className={`w-2/3 sm:w-1/2 h-20 rounded-2xl bg-white/5 animate-pulse ${i % 2 !== 0 ? 'rounded-tl-sm' : 'rounded-tr-sm'}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto scrollbar-pink bg-[#0a0a0f] relative flex flex-col"
      ref={scrollRef}
    >
      {/* Background Pattern (WhatsApp style subtle pattern) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("/pattern.png")', backgroundSize: '400px' }} />

      <div className="flex flex-col min-h-full p-2 sm:p-4 relative z-10 pointer-events-auto w-full max-w-4xl mx-auto">
        <div className="mt-auto" />
        {hasMore && (
          <div ref={topLoaderRef} className="w-full flex justify-center py-4">
            {isLoadingOlder ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <div className="h-6"></div> // Spacer for intersection observer
            )}
          </div>
        )}

        {!hasMore && messages.length > 0 && (
          <div className="text-center py-6 text-xs text-text-secondary/50 bg-black/20 rounded-lg mx-auto px-4 my-4 border border-white/5">
            Mulai dari obrolan paling awal
          </div>
        )}

        {messages.length === 0 && !hasMore && (
          <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
            Belum ada pesan. Jadilah yang pertama menyapa!
          </div>
        )}

        {/* Messages List */}
        {messages.map((msg, idx) => {
          // Add date separator if date changes
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const msgDate = new Date(msg.createdAt).toLocaleDateString();
          const prevDate = prevMsg ? new Date(prevMsg.createdAt).toLocaleDateString() : null;
          const showDate = msgDate !== prevDate;

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <div className="bg-bg-elevated/80 backdrop-blur-sm border border-white/10 text-text-secondary text-[10px] px-3 py-1 rounded-full shadow-sm">
                    {msgDate}
                  </div>
                </div>
              )}
              <ChatMessageItem 
                message={msg} 
                onReply={onReply} 
                onDelete={onDelete} 
              />
            </React.Fragment>
          );
        })}
        {/* Extra spacing at the bottom so messages aren't touching the input bar */}
        <div ref={bottomRef} className="h-4 sm:h-6 shrink-0" />
      </div>
    </div>
  );
};
