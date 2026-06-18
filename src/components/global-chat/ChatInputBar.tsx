import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Smile, X } from 'lucide-react';
import type { ChatMessage } from '../../stores/useGlobalChatStore';
import { fetchStickers } from '../../lib/animeApi';
import type { ApiSticker } from '../../types';

interface ChatInputBarProps {
  onSendMessage: (payload: any) => Promise<boolean>;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage, replyingTo, onCancelReply }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickers, setStickers] = useState<ApiSticker[]>([]);
  const [stickerLoading, setStickerLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load stickers
  useEffect(() => {
    if (!showStickerPicker || stickers.length > 0) return;
    const loadStickers = async () => {
      setStickerLoading(true);
      try {
        const res = await fetchStickers();
        const allStickers = res.data || [];
        setStickers(allStickers.filter((stk: ApiSticker) => stk.is_owned));
      } catch (e) {
        console.error('Failed to load stickers', e);
      } finally {
        setStickerLoading(false);
      }
    };
    loadStickers();
  }, [showStickerPicker, stickers.length]);

  const handleSelectSticker = async (sticker: ApiSticker) => {
    const stickerId = (sticker as any).itemId || (sticker as any).sticker_id || (sticker as any).item_id || sticker.id;
    const payload = {
      kind: 'STICKER',
      sticker_id: stickerId,
      content: sticker.image_url,
    } as any;
    
    if (replyingTo) {
      payload.parentId = replyingTo.id;
    }
    
    setShowStickerPicker(false);
    
    const success = await onSendMessage(payload);
    if (success) {
      onCancelReply();
    }
  };

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if ((!text.trim() && !image) || isSending) return;

    setIsSending(true);
    try {
      let payload: any = {};
      
      if (image) {
        payload.kind = 'IMAGE';
        payload.image = image;
        if (text.trim()) payload.content = text.trim();
      } else {
        payload.kind = 'TEXT';
        payload.content = text.trim();
      }

      if (replyingTo) {
        payload.parentId = replyingTo.id;
      }

      const success = await onSendMessage(payload);
      if (success) {
        setText('');
        setImage(null);
        onCancelReply();
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-bg-elevated border-t border-border/40 p-2 sm:p-3 pb-safe z-10 shrink-0 relative">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-2 relative">
        {/* Sticker Picker */}
        {showStickerPicker && (
          <div className="absolute bottom-full left-0 mb-2 w-72 max-h-64 bg-bg-elevated/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-y-auto scrollbar-pink z-50 p-2 grid grid-cols-4 gap-2">
            {stickerLoading ? (
              <div className="col-span-4 text-center text-sm text-text-secondary py-4">Memuat stiker...</div>
            ) : stickers.length === 0 ? (
              <div className="col-span-4 text-center text-sm text-text-secondary py-4">Tidak ada stiker.</div>
            ) : (
              stickers.map((stk, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleSelectSticker(stk)}
                  className="aspect-square bg-white/5 rounded-lg hover:bg-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center p-1"
                  title={(stk as any).name || 'Sticker'}
                >
                  <img src={stk.image_url} alt="Sticker" className="w-full h-full object-contain" loading="lazy" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 px-3 mx-1 mb-1 border-l-4 border-primary/50 relative">
            <div className="flex flex-col flex-1 truncate pr-4">
              <span className="text-xs text-primary font-semibold mb-0.5">
                Membalas {replyingTo.user.profile?.full_name || replyingTo.user.username}
              </span>
              <span className="text-sm text-text-secondary truncate">
                {replyingTo.kind === 'IMAGE' && <ImageIcon className="w-3 h-3 inline mr-1" />}
                {replyingTo.kind === 'STICKER' && 'Stiker'}
                {replyingTo.kind === 'ANIME_SHARE' && 'Anime Share'}
                {replyingTo.kind === 'WATCH_SHARE' && 'Watch Share'}
                {replyingTo.content}
              </span>
            </div>
            <button onClick={onCancelReply} className="p-1 hover:bg-white/10 rounded-full text-text-secondary hover:text-text-primary shrink-0 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Image Preview */}
        {image && (
          <div className="mx-1 mb-1 relative w-20 h-20 rounded-md overflow-hidden border border-white/20">
            <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={removeImage} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2 bg-bg-base/50 p-1.5 rounded-2xl border border-border/50 focus-within:border-primary/50 transition-colors">
          
          {/* Sticker Button */}
          <button 
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            className={`p-2.5 rounded-xl transition-colors shrink-0 ${showStickerPicker ? 'text-primary bg-primary/10' : 'text-text-secondary hover:text-primary hover:bg-white/5'}`}
            title="Kirim Stiker"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {/* Attachment Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-text-secondary hover:text-primary rounded-xl hover:bg-white/5 transition-colors shrink-0"
            title="Kirim Gambar"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageSelect}
          />

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 resize-none outline-none py-2.5 max-h-[120px] scrollbar-pink"
            rows={1}
          />

          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={(!text.trim() && !image) || isSending}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${
              text.trim() || image 
                ? 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20' 
                : 'bg-white/5 text-text-secondary/50 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
