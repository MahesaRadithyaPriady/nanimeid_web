import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from './useAppStore';
import { authHeaders, authFetch } from '../lib/authFetch';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

// Determine Socket.IO server URL (usually just the origin)
let SOCKET_URL = '/';
try {
  if (BASE_URL.startsWith('http')) {
    const url = new URL(BASE_URL);
    SOCKET_URL = url.origin;
  }
} catch (e) {
  // fallback to default
}

export type ChatKind = 'TEXT' | 'IMAGE' | 'STICKER' | 'ANIME_SHARE' | 'WATCH_SHARE';

export interface ChatUser {
  id: number;
  username: string;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
  level?: {
    number: number;
  };
  border?: {
    image_url?: string;
  };
  badges?: any[];
}

export interface ChatParent {
  id: number;
  content: string;
  kind: ChatKind;
  image_url?: string | null;
  sticker?: any | null;
  createdAt: string;
  is_delete?: boolean;
  owned?: boolean;
  user: ChatUser;
}

export interface ChatMessage {
  id: number;
  type: 'message' | 'reply';
  is_delete: boolean;
  owned: boolean;
  content: string;
  kind: ChatKind;
  image_url?: string | null;
  sticker?: any | null;
  anime_id?: number | null;
  episode_id?: number | null;
  watch_second?: number | null;
  anime?: any | null;
  episode?: any | null;
  parent_id?: number | null;
  parent?: ChatParent | null;
  createdAt: string;
  updatedAt: string;
  _count?: { replies: number };
  user: ChatUser;
}

interface GlobalChatState {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  hasMore: boolean;
  newestId: number | null;
  oldestId: number | null;
  isLoading: boolean;
  isLoadingOlder: boolean;

  // Actions
  connect: (token: string | null) => void;
  disconnect: () => void;
  loadInitialMessages: () => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  sendMessage: (payload: any) => Promise<boolean>;
  deleteMessage: (messageId: number) => Promise<boolean>;
  addOrUpdateMessage: (message: ChatMessage) => void;
  removeMessageLocally: (messageId: number) => void;
}

export const useGlobalChatStore = create<GlobalChatState>((set, get) => ({
  socket: null,
  isConnected: false,
  messages: [],
  hasMore: true,
  newestId: null,
  oldestId: null,
  isLoading: false,
  isLoadingOlder: false,

  connect: (token) => {
    const { socket } = get();
    if (socket) return; // already connected or connecting

    const newSocket = io(`${SOCKET_URL}/global-chat`, {
      path: '/socket.io',
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    newSocket.on('message', (payload: ChatMessage) => {
      const myId = useAppStore.getState().userProfile?.id;
      if (myId && payload.user?.id === myId) {
        payload.owned = true;
      } else {
        payload.owned = false;
      }
      get().addOrUpdateMessage(payload);
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  loadInitialMessages: async () => {
    const { socket } = get();
    if (!socket || !socket.connected) {
      // Fallback or wait? 
      // For simplicity, we just use REST fallback if socket is not ready yet, 
      // but the requirement says use WebSockets. We can emit via socket if connected.
      // Wait for socket to connect if needed, but since it's an async operation,
      // let's do socket emit wrapped in promise.
    }

    set({ isLoading: true });
    
    try {
      if (socket && socket.connected) {
        socket.emit('LIST_MESSAGES', { limit: 50 }, (res: any) => {
          if (res?.success && res.data) {
            const myId = useAppStore.getState().userProfile?.id;
            const items = res.data.items.map((item: ChatMessage) => ({
              ...item,
              owned: myId ? item.user?.id === myId : item.owned
            })).reverse();
            
            set({
              messages: items,
              hasMore: res.data.has_more,
              newestId: res.data.newest_id,
              oldestId: res.data.oldest_id,
              isLoading: false
            });
          } else {
            set({ isLoading: false });
          }
        });
      } else {
        // Fallback REST if socket not connected yet
        const res = await authFetch(`${BASE_URL}/global-chat?limit=50`, {
          headers: { ...authHeaders(), Accept: 'application/json' },
        });
        const data = await res.json();
        if (data.success && data.data) {
          const myId = useAppStore.getState().userProfile?.id;
          const items = data.data.items.map((item: ChatMessage) => ({
            ...item,
            owned: myId ? item.user?.id === myId : item.owned
          })).reverse();

          set({
            messages: items,
            hasMore: data.data.has_more,
            newestId: data.data.newest_id,
            oldestId: data.data.oldest_id,
            isLoading: false
          });
        } else {
          set({ isLoading: false });
        }
      }
    } catch (e) {
      console.error('Failed to load initial messages', e);
      set({ isLoading: false });
    }
  },

  loadOlderMessages: async () => {
    const { socket, oldestId, hasMore, isLoadingOlder } = get();
    if (!hasMore || !oldestId || isLoadingOlder) return;

    set({ isLoadingOlder: true });

    try {
      if (socket && socket.connected) {
        socket.emit('LIST_MESSAGES', { before_id: oldestId, limit: 20 }, (res: any) => {
          if (res?.success && res.data) {
            const myId = useAppStore.getState().userProfile?.id;
            const olderMessages = res.data.items.map((item: ChatMessage) => ({
              ...item,
              owned: myId ? item.user?.id === myId : item.owned
            })).reverse();
            
            if (olderMessages.length === 0) {
              set({ hasMore: false, isLoadingOlder: false });
              return;
            }

            set(state => ({
              messages: [...olderMessages, ...state.messages],
              hasMore: res.data.has_more,
              oldestId: res.data.oldest_id,
              isLoadingOlder: false
            }));
          } else {
            set({ isLoadingOlder: false });
          }
        });
      } else {
        const res = await authFetch(`${BASE_URL}/global-chat?before_id=${oldestId}&limit=20`, {
          headers: { ...authHeaders(), Accept: 'application/json' },
        });
        const data = await res.json();
        if (data.success && data.data) {
          const myId = useAppStore.getState().userProfile?.id;
          const olderMessages = data.data.items.map((item: ChatMessage) => ({
            ...item,
            owned: myId ? item.user?.id === myId : item.owned
          })).reverse();

          if (olderMessages.length === 0) {
            set({ hasMore: false, isLoadingOlder: false });
            return;
          }

          set(state => ({
            messages: [...olderMessages, ...state.messages],
            hasMore: data.data.has_more,
            oldestId: data.data.oldest_id,
            isLoadingOlder: false
          }));
        } else {
          set({ isLoadingOlder: false });
        }
      }
    } catch (e) {
      console.error('Failed to load older messages', e);
      set({ isLoadingOlder: false });
    }
  },

  sendMessage: async (payload: any) => {
    const { socket } = get();
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve(false);
        return;
      }

      if (payload.image && payload.image instanceof File) {
        // File upload needs to be converted to ArrayBuffer or Base64 for socket.io
        // But for simplicity, we can fallback to REST for multipart/form-data if needed.
        // The API says `image.buffer` can be array byte.
        // Wait, it says: "Payload IMAGE: { kind:"IMAGE", parentId?, image: { originalname, mimetype, buffer } }"
        const reader = new FileReader();
        reader.onload = (e) => {
          const buffer = e.target?.result;
          socket.emit('POST_MESSAGE', {
            ...payload,
            image: {
              originalname: payload.image.name,
              mimetype: payload.image.type,
              buffer
            }
          }, (res: any) => {
            resolve(res?.success || false);
          });
        };
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(payload.image);
      } else {
        socket.emit('POST_MESSAGE', payload, (res: any) => {
          resolve(res?.success || false);
        });
      }
    });
  },

  deleteMessage: async (messageId: number) => {
    const { socket } = get();
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve(false);
        return;
      }
      socket.emit('DELETE_MESSAGE', { messageId }, (res: any) => {
        resolve(res?.success || false);
      });
    });
  },

  addOrUpdateMessage: (message: ChatMessage) => {
    set(state => {
      // Check if message already exists
      const existingIndex = state.messages.findIndex(m => m.id === message.id);
      if (existingIndex > -1) {
        // Update existing (e.g., soft deleted)
        const newMessages = [...state.messages];
        newMessages[existingIndex] = message;
        return { messages: newMessages };
      }
      
      // Append new message at the end
      return { 
        messages: [...state.messages, message],
        newestId: message.id > (state.newestId || 0) ? message.id : state.newestId
      };
    });
  },

  removeMessageLocally: (messageId: number) => {
    set(state => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, is_delete: true } : m)
    }));
  }
}));
