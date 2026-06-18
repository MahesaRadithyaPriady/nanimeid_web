import React, { useEffect, useState } from 'react';
import { useGlobalChatStore, type ChatMessage } from '../stores/useGlobalChatStore';
import { useAppStore } from '../stores/useAppStore';
import { ChatWindow } from '../components/global-chat/ChatWindow';
import { ChatInputBar } from '../components/global-chat/ChatInputBar';
import { useNavigate } from 'react-router-dom';

export const GlobalChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, authToken, sidebarExpanded } = useAppStore();
  const { 
    connect, 
    disconnect, 
    loadInitialMessages, 
    loadOlderMessages, 
    messages, 
    hasMore, 
    isLoading,
    isLoadingOlder, 
    sendMessage, 
    deleteMessage
  } = useGlobalChatStore();

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  useEffect(() => {
    // Scroll to top of window to avoid issues with absolute layout
    window.scrollTo(0, 0);

    // Connect to Socket.IO
    connect(authToken);
    
    // Load initial messages (fallback to REST if socket taking too long, handled by store)
    loadInitialMessages();

    return () => {
      // Disconnect on unmount if we don't want to keep it alive globally.
      // But keeping it alive globally might be useful for notifications later.
      // For now, we keep it active only on this page to save resources.
      disconnect();
    };
  }, [connect, disconnect, loadInitialMessages, authToken]);

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSendMessage = async (payload: any) => {
    if (!isLoggedIn) {
      navigate('/login');
      return false;
    }
    const success = await sendMessage(payload);
    return success;
  };

  const handleDelete = async (messageId: number) => {
    if (window.confirm('Yakin ingin menghapus pesan ini?')) {
      await deleteMessage(messageId);
    }
  };

  return (
    <div className={`fixed top-14 right-0 bottom-16 lg:bottom-0 ${sidebarExpanded ? 'lg:left-60' : 'lg:left-[72px]'} left-0 z-10 flex flex-col bg-bg-base overflow-hidden transition-all duration-200`}>
      

      {/* Chat Window (Scrollable) */}
      <ChatWindow 
        messages={messages}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingOlder={isLoadingOlder}
        onLoadOlder={loadOlderMessages}
        onReply={handleReply}
        onDelete={handleDelete}
      />

      {/* Chat Input Bar */}
      <ChatInputBar 
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
};
