import React from 'react';
import { format } from 'date-fns';
import { Reply, Trash2, Image as ImageIcon, PlayCircle } from 'lucide-react';
import type { ChatMessage, ChatParent } from '../../stores/useGlobalChatStore';
import { Link } from 'react-router-dom';
import { BorderImage } from '../ui/BorderImage';

function getStickerUrl(content?: string): string {
  if (!content) return '';
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return content;
  }
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
  const apiHost = baseUrl.replace(/\/v?\d+\.\d+\.\d+(\/.*)?$/, '').replace(/\/v?\d+(\/.*)?$/, '');
  if (!content.includes('/') && !content.includes('.')) {
    return `${apiHost}/static/uploads/stickers/${content.toLowerCase()}.png`;
  }
  if (content.startsWith('/') || content.startsWith('static/')) {
    const cleanPath = content.startsWith('/') ? content : `/${content}`;
    return `${apiHost}${cleanPath}`;
  }
  return `${apiHost}/static/uploads/stickers/${content}`;
}

interface ChatMessageItemProps {
  message: ChatMessage;
  onReply: (message: ChatMessage) => void;
  onDelete: (messageId: number) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onReply, onDelete }) => {
  const { is_delete, owned, user, content, kind, image_url, sticker, anime, episode, watch_second, parent, createdAt } = message;

  const timeString = format(new Date(createdAt), 'HH:mm');
  const levelNumber = (user as any).level?.level_number || (user as any).level?.number || 1;
  const avatarBorderUrl = (user as any).avatar_border_active?.image_url || (user as any).border?.image_url;
  const superBadge = (user as any).super_badge_active;

  if (is_delete) {
    return (
      <div className={`flex w-full ${owned ? 'justify-end' : 'justify-start'} my-2`}>
        <div className="bg-bg-elevated text-text-secondary/60 italic px-4 py-2 rounded-lg text-sm border border-border/20">
          Pesan ini telah dihapus.
        </div>
      </div>
    );
  }

  // Bubble styles
  const bubbleBg = owned 
    ? 'bg-primary/10 border-primary/25 dark:bg-primary/20 dark:border-primary/30' 
    : 'bg-bg-surface border-border/50 dark:bg-bg-elevated dark:border-border/20';
  const borderRadius = owned ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm';

  const formatWatchSecond = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderParentQuote = (parentMsg: ChatParent) => {
    return (
      <div className="bg-black/5 dark:bg-black/20 border-l-4 border-primary/50 rounded-r-md px-3 py-2 mb-2 text-xs text-text-secondary line-clamp-2">
        <div className="font-semibold text-pink-600/80 dark:text-primary/80 mb-0.5">{parentMsg.user.profile?.full_name || parentMsg.user.username}</div>
        {parentMsg.is_delete ? (
          <span className="italic">Pesan dihapus</span>
        ) : (
          <span>
            {parentMsg.kind === 'IMAGE' && <ImageIcon className="w-3 h-3 inline mr-1" />}
            {parentMsg.kind === 'STICKER' && 'Kirim stiker'}
            {parentMsg.kind === 'ANIME_SHARE' && 'Membagikan anime'}
            {parentMsg.kind === 'WATCH_SHARE' && 'Membagikan tontonan'}
            {parentMsg.content || ''}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`flex w-full ${owned ? 'justify-end' : 'justify-start'} my-3 px-2 sm:px-4 group`}>
      {/* Avatar for non-owned messages */}
      {!owned && (
        <div className="flex-shrink-0 mr-2 sm:mr-3 pt-1">
          <div className="relative w-9 h-9">
            <div className="w-full h-full rounded-full bg-bg-sidebar overflow-hidden relative z-0">
              {user.profile?.avatar_url ? (
                <img src={user.profile.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">
                  {(user.profile?.full_name || user.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Border image */}
            {avatarBorderUrl && (
              <BorderImage src={avatarBorderUrl} alt="border" className="absolute -inset-1.5 w-[calc(100%+12px)] max-w-none h-[calc(100%+12px)] object-cover pointer-events-none z-10" />
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {owned && (
        <div className="flex-shrink-0 mr-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onReply(message)} className="p-1.5 text-text-secondary hover:text-primary rounded-full hover:bg-black/5 dark:hover:bg-white/10" title="Balas">
            <Reply className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(message.id)} className="p-1.5 text-text-secondary hover:text-red-500 rounded-full hover:bg-black/5 dark:hover:bg-white/10" title="Hapus">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Bubble */}
      <div className={`max-w-[85%] sm:max-w-[70%] border ${bubbleBg} ${borderRadius} flex flex-col relative shadow-sm dark:shadow-none`}>
        
        {/* Author info (only for others) */}
        {!owned && (
          <div className="flex items-baseline gap-2 px-3 pt-2 pb-1 flex-wrap">
            <span className="font-semibold text-sm text-pink-600 dark:text-primary" style={superBadge?.title_color ? { color: superBadge.title_color } : {}}>
              {user.profile?.full_name || user.username}
            </span>
            <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full text-text-secondary whitespace-nowrap">
              Lv.{levelNumber}
            </span>
          </div>
        )}

        <div className={`px-3 ${owned ? 'pt-2' : 'pt-0'} pb-2`}>
          {/* Quoted Reply */}
          {parent && renderParentQuote(parent)}

          {/* Text Content */}
          {content && kind === 'TEXT' && (
            <div className="text-sm text-text-primary whitespace-pre-wrap break-words">
              {content}
            </div>
          )}
          {content && kind === 'IMAGE' && !image_url && !content.startsWith('http') && !content.startsWith('/') && (
             <div className="text-sm text-text-primary whitespace-pre-wrap break-words mb-2">
               {content}
             </div>
          )}

          {/* IMAGE */}
          {kind === 'IMAGE' && (image_url || content) && (
            <div className="mt-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/40">
              <img src={image_url || content} alt="Shared image" className="max-h-64 object-contain w-full" loading="lazy" />
            </div>
          )}

          {/* STICKER */}
          {kind === 'STICKER' && (sticker || content) && (
            <div className="mt-2 w-32 h-32">
              <img src={sticker?.image_url || getStickerUrl(content)} alt="Sticker" className="w-full h-full object-contain" />
            </div>
          )}

          {/* ANIME_SHARE */}
          {kind === 'ANIME_SHARE' && anime && (
            <Link to={`/anime/${anime.id}`} className="mt-2 block bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/30 transition-colors border border-black/10 dark:border-white/10 rounded-lg p-2 flex gap-3">
              <img src={anime.gambar_anime} alt={anime.nama_anime} className="w-16 h-24 object-cover rounded-md" />
              <div className="flex flex-col justify-center">
                <span className="text-xs text-pink-600 dark:text-primary font-medium mb-1">Berbagi Anime</span>
                <span className="text-sm font-semibold line-clamp-2">{anime.nama_anime}</span>
                {anime.rating_anime && <span className="text-xs text-yellow-400 mt-1">★ {anime.rating_anime}</span>}
              </div>
            </Link>
          )}

          {/* WATCH_SHARE */}
          {kind === 'WATCH_SHARE' && anime && episode && (
            <Link to={`/watch/${anime.slug || anime.id}/ep/${episode.nomor_episode}`} className="mt-2 block bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/30 transition-colors border border-black/10 dark:border-white/10 rounded-lg p-2 flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                {episode.thumbnail_episode && <img src={episode.thumbnail_episode} alt="" className="w-full h-full object-cover blur-sm" />}
              </div>
              <div className="relative z-10 flex gap-3">
                <div className="w-24 h-16 rounded-md overflow-hidden relative shrink-0">
                  <img src={episode.thumbnail_episode || anime.gambar_anime} alt={episode.judul_episode} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <span className="text-xs text-pink-600 dark:text-primary font-medium mb-0.5">Sedang Menonton</span>
                  <span className="text-sm font-semibold truncate">{anime.nama_anime}</span>
                  <span className="text-xs text-text-secondary truncate">Ep {episode.nomor_episode} - {episode.judul_episode}</span>
                  {watch_second !== undefined && watch_second !== null && (
                    <span className="text-xs text-pink-600 bg-primary/10 dark:text-primary dark:bg-primary/20 px-1.5 py-0.5 rounded w-max mt-1">
                      {formatWatchSecond(watch_second)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Timestamp */}
        <div className={`px-3 pb-1.5 flex justify-end items-center gap-1 opacity-70`}>
          <span className="text-[10px] text-text-secondary">{timeString}</span>
        </div>
      </div>

      {/* Action buttons for received messages */}
      {!owned && (
        <div className="flex-shrink-0 ml-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onReply(message)} className="p-1.5 text-text-secondary hover:text-primary rounded-full hover:bg-black/5 dark:hover:bg-white/10" title="Balas">
            <Reply className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
