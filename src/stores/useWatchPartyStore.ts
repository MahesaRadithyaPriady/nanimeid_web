import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { watchPartyApi, type WatchPartySession, type ChatMessage } from '../lib/watchPartyApi';
import { useAppStore } from './useAppStore';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

// Extract base backend host (remove /v1/watchparty/v2 or similar suffix)
const getBackendHost = () => {
  return BASE_URL.replace(/\/v?\d+\.\d+\.\d+(\/.*)?$/, '').replace(/\/v?\d+(\/.*)?$/, '');
};

interface VoicePeer {
  user_id: number;
  username?: string;
  mic_enabled: boolean;
}

interface WatchPartyState {
  socket: Socket | null;
  session: WatchPartySession | null;
  participants: Array<{
    user_id: number;
    username: string;
    avatar: string;
    avatar_url?: string;
    role: 'host' | 'member';
    is_host: boolean;
    joinedAt: string;
    last_seen: string;
    is_ready: boolean;
    mic_enabled?: boolean;
  }>;
  messages: ChatMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  isHost: boolean;
  
  // Playback state of current room media
  currentMedia: {
    anime_id?: number | null;
    episode_id?: number | null;
    quality?: string | null;
    url?: string | null;
    anime?: any;
    episode?: any;
    current_time?: number;
    is_paused?: boolean;
  } | null;

  // Realtime playback status
  playbackState: {
    is_paused: boolean;
    current_time: number;
    speed: number;
    seek_timestamp?: number;
  };

  // Voice Chat (WebRTC) state
  voiceConnected: boolean;
  voiceMicEnabled: boolean;
  voicePeers: VoicePeer[];

  // POV Mode State
  povModeActive: boolean;
  povTargetUserId: number | null;
  povPlaybackState: {
    is_paused: boolean;
    current_time: number;
    speed: number;
    quality?: string;
  } | null;

  // Actions
  connect: (code: string, password?: string) => Promise<void>;
  disconnect: () => void;
  setMedia: (params: { anime_id?: number; episode_id?: number; quality?: string }) => void;
  play: (at?: number) => void;
  pause: (at?: number) => void;
  seek: (to: number) => void;
  speed: (rate: number) => void;
  ready: () => void;
  sync: () => void;
  hostTick: (at: number) => void;
  syncFollow: () => void;
  sendChatMessage: (text: string, kind?: 'TEXT' | 'STICKER', stickerId?: number) => void;
  
  // Voice (Mic) actions
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  setVoiceMicEnabled: (enabled: boolean) => void;

  // POV Actions
  enablePovMode: (enable: boolean) => void;
  subscribePov: (targetUserId: number) => void;
  unsubscribePov: () => void;
  getPovUrl: (targetUserId: number) => Promise<string | null>;

  // Internal updates
  updatePlaybackState: (update: Partial<WatchPartyState['playbackState']>) => void;
  addLocalMessage: (msg: ChatMessage) => void;
}

// Module-level cache for WebRTC connections and media elements
let localStream: MediaStream | null = null;
const peerConnections = new Map<number, RTCPeerConnection>();
const remoteAudios = new Map<number, HTMLAudioElement>();
let iceConfig: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export const useWatchPartyStore = create<WatchPartyState>((set, get) => ({
  socket: null,
  session: null,
  participants: [],
  messages: [],
  isConnected: false,
  isConnecting: false,
  isHost: false,
  currentMedia: null,
  playbackState: {
    is_paused: true,
    current_time: 0,
    speed: 1.0,
  },
  voiceConnected: false,
  voiceMicEnabled: true,
  voicePeers: [],
  povModeActive: false,
  povTargetUserId: null,
  povPlaybackState: null,

  connect: async (code, password) => {
    const { socket, isConnecting } = get();
    if (socket || isConnecting) return;

    set({ isConnecting: true, isConnected: false });

    // Retrieve active token
    const appToken = useAppStore.getState().authToken;
    if (!appToken) {
      set({ isConnecting: false });
      useAppStore.getState().addToast('error', 'Silakan login terlebih dahulu untuk bergabung Nobar.');
      return;
    }

    const backendHost = getBackendHost();
    const cleanToken = appToken.startsWith('Bearer ') ? appToken.replace('Bearer ', '') : appToken;

    // Connect to /watchparty-v2 namespace
    const newSocket = io(`${backendHost}/watchparty-v2`, {
      path: '/socket.io',
      query: { code, access_token: cleanToken },
      transports: ['websocket', 'polling'],
    });

    // IMMEDIATELY set the socket so that disconnect() can clean it up if Strict Mode unmounts
    set({ socket: newSocket });

    // Log all incoming WebSocket events to console
    newSocket.onAny((eventName, ...args) => {
      console.log(`[Socket.IO - ${eventName}]`, ...args);
    });

    // Log all outgoing WebSocket events to console
    const originalEmit = newSocket.emit;
    newSocket.emit = function(eventName: string, ...args: any[]) {
      console.log(`[Socket.IO Emit - ${eventName}]`, ...args);
      return originalEmit.apply(this, [eventName, ...args] as any);
    };

    newSocket.on('connect', () => {
      set({ isConnected: true, isConnecting: false, socket: newSocket });
      
      // Emit JOIN
      newSocket.emit('JOIN', { code, password }, (res: any) => {
        if (res && !res.ok) {
          useAppStore.getState().addToast('error', `Gagal masuk room: ${res.error || 'Terjadi kesalahan'}`);
          get().disconnect();
          return;
        }

        if (res && res.session) {
          const session = res.session;
          const isHost = res.is_host ?? (session.host_user_id === useAppStore.getState().userProfile?.id);
          
          let mediaToSet = res.media || null;
          
          set({
            session,
            isHost,
            currentMedia: mediaToSet,
            playbackState: {
              is_paused: session.is_paused ?? true,
              current_time: session.current_time ?? 0,
              speed: session.speed ?? 1.0,
            },
          });

          // Fetch media URL for late joiner if the session already has an active anime but server didn't send media URL
          if ((!mediaToSet || !mediaToSet.url) && session.anime_id && session.episode_id) {
            watchPartyApi.getAnimeDetails(session.anime_id).then(details => {
              const ep = details.episodes.find(e => e.id === session.episode_id);
              const q = ep?.qualities.find(q => q.nama_quality === session.quality) || ep?.qualities[0];
              if (ep && q) {
                set({
                  currentMedia: {
                    ...mediaToSet,
                    anime_id: session.anime_id,
                    episode_id: session.episode_id,
                    quality: q.nama_quality,
                    url: q.source_quality,
                    anime: details.anime,
                    episode: ep
                  }
                });
              }
            }).catch(err => console.error('Failed to fetch late joiner media:', err));
          }

          // Trigger initial fetches
          newSocket.emit('PARTICIPANTS', { code }, (pRes: any) => {
            if (pRes?.ok) set({ participants: pRes.participants });
          });
          newSocket.emit('MESSAGES', { code, page: 1, limit: 50, order: 'asc' }, (mRes: any) => {
            if (mRes?.ok) set({ messages: mRes.messages });
          });
        }
      });
    });

    newSocket.on('ERROR', (err: any) => {
      console.error('Socket.IO WatchParty V2 error:', err);
      let errMsg = 'Terjadi kesalahan pada koneksi Nobar';
      if (err?.code === 401 || err?.error === 'token_expired' || err?.error === 'invalid_token') {
        errMsg = 'Token Anda tidak valid atau telah kedaluwarsa. Silakan login kembali.';
      } else if (err?.code === 'ACCOUNT_SUSPENDED') {
        errMsg = `Akun Anda sedang ditangguhkan: ${err.details?.reason || 'Pelanggaran ketentuan'}`;
      } else if (err?.code === 'ACCOUNT_BANNED') {
        errMsg = `Akun Anda diblokir: ${err.details?.reason || 'Pelanggaran berat'}`;
      } else if (err?.error) {
        errMsg = err.error;
      }
      useAppStore.getState().addToast('error', errMsg);
      get().disconnect();
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO connect_error:', err);
      set({ isConnecting: false });
      useAppStore.getState().addToast('error', 'Gagal terhubung ke server real-time Nobar.');
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false, socket: null, session: null, participants: [], messages: [] });
    });

    // --- Broadcast listeners ---
    newSocket.on('USER_JOINED', (data: any) => {
      set((state) => ({
        participants: [...state.participants.filter(p => p.user_id !== data.user_id), {
          user_id: data.user_id,
          username: data.username,
          avatar: data.avatar || '',
          role: 'member',
          is_host: false,
          joinedAt: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          is_ready: false,
        }],
      }));
      useAppStore.getState().addToast('info', `@${data.username} bergabung ke Nobar.`);
    });

    newSocket.on('USER_LEFT', (data: any) => {
      const leavingUser = get().participants.find((p) => p.user_id === data.user_id);
      set((state) => ({
        participants: state.participants.filter((p) => p.user_id !== data.user_id),
      }));
      if (leavingUser) {
        useAppStore.getState().addToast('info', `@${leavingUser.username} keluar dari Nobar.`);
      }
    });

    newSocket.on('USER_KICKED', (data: any) => {
      set((state) => ({
        participants: state.participants.filter((p) => p.user_id !== data.user_id),
      }));
      useAppStore.getState().addToast('info', `@${data.username || 'Seseorang'} telah dikeluarkan dari room.`);
    });

    newSocket.on('KICKED', (data: any) => {
      if (data.user_id === useAppStore.getState().userProfile?.id) {
        useAppStore.getState().addToast('error', 'Anda telah dikeluarkan dari Nobar oleh host.');
        get().disconnect();
        window.dispatchEvent(new CustomEvent('WATCH_PARTY_EXIT'));
      }
    });

    newSocket.on('MEDIA_UPDATED', (media: any) => {
      set((state) => ({
        currentMedia: media,
        session: state.session ? {
          ...state.session,
          anime_id: media.anime_id,
          episode_id: media.episode_id,
          quality: media.quality,
        } : null,
      }));

      if ((!media || !media.url) && media?.anime_id && media?.episode_id) {
        watchPartyApi.getAnimeDetails(media.anime_id).then(details => {
          const ep = details.episodes.find(e => e.id === media.episode_id);
          const q = ep?.qualities.find(q => q.nama_quality === media.quality) || ep?.qualities[0];
          if (ep && q) {
            set((state) => ({
              currentMedia: {
                ...state.currentMedia,
                ...media,
                anime_id: media.anime_id,
                episode_id: media.episode_id,
                quality: q.nama_quality,
                url: q.source_quality,
                anime: details.anime,
                episode: ep
              }
            }));
          }
        }).catch(err => console.error('Failed to fetch MEDIA_UPDATED details:', err));
      }
    });

    newSocket.on('PLAY', (data: any) => {
      const at = data?.at ?? get().playbackState.current_time;
      set((state) => ({
        playbackState: { ...state.playbackState, is_paused: false, current_time: at },
      }));
    });

    newSocket.on('PAUSE', (data: any) => {
      const at = data?.at ?? get().playbackState.current_time;
      set((state) => ({
        playbackState: { ...state.playbackState, is_paused: true, current_time: at },
      }));
    });

    newSocket.on('SEEK', (data: any) => {
      if (data?.to !== undefined) {
        set((state) => ({
          playbackState: { ...state.playbackState, current_time: data.to, seek_timestamp: Date.now() },
        }));
      }
    });

    newSocket.on('SPEED', (data: any) => {
      if (data?.rate !== undefined) {
        set((state) => ({
          playbackState: { ...state.playbackState, speed: data.rate },
        }));
      }
    });

    newSocket.on('READY', (data: any) => {
      set((state) => ({
        participants: state.participants.map((p) =>
          p.user_id === data.user_id ? { ...p, is_ready: true } : p
        ),
      }));
    });

    newSocket.on('ROOM_ENDED', () => {
      useAppStore.getState().addToast('info', 'Sesi Nobar ini telah diakhiri oleh host.');
      get().disconnect();
      window.dispatchEvent(new CustomEvent('WATCH_PARTY_EXIT'));
    });

    newSocket.on('HOST_TICK', (data: any) => {
      if (!get().isHost && !get().povModeActive) {
        const curTime = get().playbackState.current_time;
        const hostTime = data.at;
        const drift = Math.abs(curTime - hostTime);
        const hostSpeed = data.speed ?? 1.0;
        const hostPaused = data.is_paused ?? false;
        const curSpeed = get().playbackState.speed;
        const curPaused = get().playbackState.is_paused;

        const needsSpeedSync = curSpeed !== hostSpeed;
        const needsPauseSync = curPaused !== hostPaused;
        const needsTimeUpdate = curTime !== hostTime;

        if (needsTimeUpdate || needsSpeedSync || needsPauseSync) {
          set((state) => ({
            playbackState: {
              ...state.playbackState,
              is_paused: hostPaused,
              speed: hostSpeed,
              current_time: hostTime,
            },
          }));
        }
      }
    });

    newSocket.on('CHAT', (msg: ChatMessage) => {
      set((state) => ({ messages: [...state.messages, msg] }));
    });

    // POV State Broadcaster
    newSocket.on('POV_STATE', (data: any) => {
      if (get().povModeActive && data.user_id === get().povTargetUserId) {
        set({ povPlaybackState: data.state });
      }
    });

    // Voice Chat Broadcast Listeners
    newSocket.on('VOICE_USER_JOINED', (data: any) => {
      set((state) => ({
        voicePeers: [...state.voicePeers.filter(p => p.user_id !== data.user_id), {
          user_id: data.user_id,
          username: data.username,
          mic_enabled: true,
        }],
      }));
      // If we are already connected to voice, establish WebRTC offer to the newly joined peer
      if (get().voiceConnected && localStream) {
        const to_user_id = data.user_id;
        setupPeerConnection(to_user_id, true);
      }
    });

    newSocket.on('VOICE_USER_LEFT', (data: any) => {
      // Cleanup peer connection for this remote peer
      cleanupPeer(data.user_id);
      set((state) => ({
        voicePeers: state.voicePeers.filter((p) => p.user_id !== data.user_id),
      }));
    });

    newSocket.on('VOICE_MIC_UPDATED', (data: any) => {
      set((state) => ({
        voicePeers: state.voicePeers.map((p) =>
          p.user_id === data.user_id ? { ...p, mic_enabled: data.mic_enabled } : p
        ),
        participants: state.participants.map((p) =>
          p.user_id === data.user_id ? { ...p, mic_enabled: data.mic_enabled } : p
        ),
      }));
    });

    // WebRTC Signaling listeners
    newSocket.on('VOICE_OFFER', async (data: any) => {
      const from_user_id = data.from_user_id;
      const pc = setupPeerConnection(from_user_id, false);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          newSocket.emit('VOICE_ANSWER', { code, to_user_id: from_user_id, sdp: answer });
        } catch (e) {
          console.error('Error handling WebRTC VOICE_OFFER:', e);
        }
      }
    });

    newSocket.on('VOICE_ANSWER', async (data: any) => {
      const from_user_id = data.from_user_id;
      const pc = peerConnections.get(from_user_id);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (e) {
          console.error('Error handling WebRTC VOICE_ANSWER:', e);
        }
      }
    });

    newSocket.on('VOICE_ICE', async (data: any) => {
      const from_user_id = data.from_user_id;
      const pc = peerConnections.get(from_user_id);
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding WebRTC ICE candidate:', e);
        }
      }
    });

    // Helper WebRTC setup
    function setupPeerConnection(peerId: number, isInitiator: boolean): RTCPeerConnection | null {
      if (peerConnections.has(peerId)) {
        return peerConnections.get(peerId)!;
      }

      try {
        const pc = new RTCPeerConnection(iceConfig);
        peerConnections.set(peerId, pc);

        // Add local stream tracks
        if (localStream) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream!);
          });
        }

        // On ICE Candidate
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            newSocket.emit('VOICE_ICE', { code, to_user_id: peerId, candidate: event.candidate });
          }
        };

        // On Stream Track Added (remote audio stream)
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            let audioEl = remoteAudios.get(peerId);
            if (!audioEl) {
              audioEl = new Audio();
              audioEl.autoplay = true;
              audioEl.style.display = 'none';
              document.body.appendChild(audioEl);
              remoteAudios.set(peerId, audioEl);
            }
            audioEl.srcObject = remoteStream;
            audioEl.play().catch((err) => console.warn('Autoplay failed for peer audio:', err));
          }
        };

        // If initiating, create offer
        if (isInitiator) {
          pc.onnegotiationneeded = async () => {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              newSocket.emit('VOICE_OFFER', { code, to_user_id: peerId, sdp: offer });
            } catch (e) {
              console.error('Negotiation offer generation failed:', e);
            }
          };
        }

        return pc;
      } catch (err) {
        console.error(`Failed to create RTCPeerConnection for peer ${peerId}:`, err);
        return null;
      }
    }

    function cleanupPeer(peerId: number) {
      const pc = peerConnections.get(peerId);
      if (pc) {
        pc.close();
        peerConnections.delete(peerId);
      }
      const audioEl = remoteAudios.get(peerId);
      if (audioEl) {
        audioEl.pause();
        audioEl.srcObject = null;
        audioEl.remove();
        remoteAudios.delete(peerId);
      }
    }
  },

  disconnect: () => {
    const { socket, session } = get();
    // Clean up voice connection
    get().leaveVoice();

    if (socket) {
      if (session) {
        socket.emit('LEAVE', { code: session.code });
      }
      socket.disconnect();
    }

    set({
      socket: null,
      session: null,
      participants: [],
      messages: [],
      isConnected: false,
      isConnecting: false,
      isHost: false,
      currentMedia: null,
      povModeActive: false,
      povTargetUserId: null,
      povPlaybackState: null,
      playbackState: {
        is_paused: true,
        current_time: 0,
        speed: 1.0,
      },
    });
  },

  setMedia: (params) => {
    const { socket, session, isHost } = get();
    if (!socket || !session || !isHost) return;
    socket.emit('SET_MEDIA', { code: session.code, ...params });
  },

  play: (at) => {
    const { socket, session, isHost } = get();
    if (!socket || !session || !isHost) return;
    socket.emit('PLAY', { code: session.code, at });
    // Optimistic local update for instant UI response
    set((state) => ({ playbackState: { ...state.playbackState, is_paused: false, current_time: at ?? state.playbackState.current_time } }));
  },

  pause: (at) => {
    const { socket, session, isHost } = get();
    if (!socket || !session || !isHost) return;
    socket.emit('PAUSE', { code: session.code, at });
    // Optimistic local update for instant UI response
    set((state) => ({ playbackState: { ...state.playbackState, is_paused: true, current_time: at ?? state.playbackState.current_time } }));
  },

  seek: (to) => {
    const { socket, session, isHost } = get();
    if (!socket || !session || !isHost) return;
    socket.emit('SEEK', { code: session.code, to });
    // Optimistic local update for instant UI response
    set((state) => ({ playbackState: { ...state.playbackState, current_time: to, seek_timestamp: Date.now() } }));
  },

  speed: (rate) => {
    const { socket, session, isHost } = get();
    if (!socket || !session || !isHost) return;
    socket.emit('SPEED', { code: session.code, rate }, (res: any) => {
      if (res?.ok && res.rate !== undefined) {
        set((state) => ({ playbackState: { ...state.playbackState, speed: res.rate } }));
      }
    });
    // Optimistic local update for instant playbackRate change
    set((state) => ({ playbackState: { ...state.playbackState, speed: rate } }));
  },

  ready: () => {
    const { socket, session } = get();
    if (!socket || !session) return;
    socket.emit('READY', { code: session.code });
  },

  sync: () => {
    const { socket, session } = get();
    if (!socket || !session) return;
    socket.emit('SYNC', { code: session.code }, (res: any) => {
      if (res?.ok && res.state) {
        set({
          playbackState: {
            is_paused: res.state.is_paused ?? true,
            current_time: res.state.current_time ?? 0,
            speed: res.state.speed ?? 1.0,
          },
        });
      }
    });
  },

  hostTick: (at) => {
    const { socket, session, isHost, playbackState } = get();
    if (!socket || !session || !isHost) return;
    // Include is_paused and speed so non-host participants can fully sync
    socket.emit('HOST_TICK', { code: session.code, at, is_paused: playbackState.is_paused, speed: playbackState.speed });
    set((state) => ({ playbackState: { ...state.playbackState, current_time: at } }));
  },

  syncFollow: () => {
    const { socket, session } = get();
    if (!socket || !session) return;
    socket.emit('SYNC_FOLLOW', { code: session.code }, (res: any) => {
      if (res?.ok && res.state) {
        set({
          playbackState: {
            is_paused: res.state.is_paused ?? true,
            current_time: res.state.current_time ?? 0,
            speed: res.state.speed ?? 1.0,
          },
        });
      }
    });
  },

  sendChatMessage: (text, kind = 'TEXT', stickerId) => {
    const { socket, session } = get();
    if (!socket || !session) return;

    const payload: any = { code: session.code, kind };
    if (kind === 'TEXT') {
      payload.message = text;
    } else if (kind === 'STICKER') {
      payload.sticker_id = stickerId;
    }

    socket.emit('CHAT', payload, (res: any) => {
      if (res && !res.ok) {
        useAppStore.getState().addToast('error', `Gagal kirim chat: ${res.error}`);
      }
    });
  },

  joinVoice: async () => {
    const { socket, session, voiceConnected } = get();
    if (!socket || !session || voiceConnected) return;

    try {
      // 1. Fetch ICE Server configuration
      const configRes = await new Promise<any>((resolve) => {
        socket.emit('VOICE_CONFIG', {}, (res: any) => resolve(res));
      });

      if (configRes?.ok && configRes.rtc?.iceServers) {
        iceConfig = { iceServers: configRes.rtc.iceServers };
      }

      // 2. Request microphone stream with echo cancellation to prevent video audio feedback
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // 3. Emit VOICE_JOIN
      socket.emit('VOICE_JOIN', { code: session.code }, (res: any) => {
        if (res?.ok) {
          set({
            voiceConnected: true,
            voiceMicEnabled: res.mic_enabled ?? true,
          });

          // Convert peers list to state
          const peersList: VoicePeer[] = (res.peers || []).map((peerId: any) => ({
            user_id: typeof peerId === 'object' ? peerId.user_id : peerId,
            mic_enabled: true,
          }));

          set({ voicePeers: peersList });

          // Establish peer connections with all existing voice peers
          peersList.forEach((peer) => {
            // Initiate peer connection
            const pc = new RTCPeerConnection(iceConfig);
            peerConnections.set(peer.user_id, pc);

            // Add local tracks
            localStream!.getTracks().forEach((track) => {
              pc.addTrack(track, localStream!);
            });

            // On ICE candidate
            pc.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit('VOICE_ICE', { code: session.code, to_user_id: peer.user_id, candidate: event.candidate });
              }
            };

            // On Track
            pc.ontrack = (event) => {
              if (event.streams && event.streams[0]) {
                let audioEl = remoteAudios.get(peer.user_id);
                if (!audioEl) {
                  audioEl = new Audio();
                  audioEl.autoplay = true;
                  audioEl.style.display = 'none';
                  document.body.appendChild(audioEl);
                  remoteAudios.set(peer.user_id, audioEl);
                }
                audioEl.srcObject = event.streams[0];
                audioEl.play().catch((e) => console.warn(e));
              }
            };

            // Setup negotiation handler
            pc.onnegotiationneeded = async () => {
              try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('VOICE_OFFER', { code: session.code, to_user_id: peer.user_id, sdp: offer });
              } catch (e) {
                console.error(e);
              }
            };
          });

          // Fetch other participants mic status
          socket.emit('VOICE_MIC_STATE', { code: session.code }, (mRes: any) => {
            if (mRes?.ok && mRes.items) {
              set((state) => ({
                voicePeers: state.voicePeers.map((p) => {
                  const match = mRes.items.find((x: any) => x.user_id === p.user_id);
                  return match ? { ...p, mic_enabled: match.mic_enabled } : p;
                }),
                participants: state.participants.map((p) => {
                  const match = mRes.items.find((x: any) => x.user_id === p.user_id);
                  return match ? { ...p, mic_enabled: match.mic_enabled } : p;
                }),
              }));
            }
          });

          useAppStore.getState().addToast('success', 'Voice chat tersambung.');
        } else {
          useAppStore.getState().addToast('error', 'Gagal join voice room.');
        }
      });
    } catch (err: any) {
      console.error('Microphone connection failed:', err);
      useAppStore.getState().addToast('error', 'Izin mikrofon ditolak atau tidak ditemukan perangkat input suara.');
    }
  },

  leaveVoice: () => {
    const { socket, session, voiceConnected } = get();
    if (!voiceConnected) return;

    if (socket && session) {
      socket.emit('VOICE_LEAVE', { code: session.code });
    }

    // Stop local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStream = null;
    }

    // Close all WebRTC peer connections
    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();

    // Close and remove all audio elements
    remoteAudios.forEach((audioEl) => {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
    });
    remoteAudios.clear();

    set({
      voiceConnected: false,
      voiceMicEnabled: true,
      voicePeers: [],
    });
    useAppStore.getState().addToast('info', 'Keluar dari Voice chat.');
  },

  setVoiceMicEnabled: (enabled) => {
    const { socket, session, voiceConnected } = get();
    if (!voiceConnected) return;

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }

    set({ voiceMicEnabled: enabled });

    if (socket && session) {
      socket.emit('VOICE_MIC_SET', { code: session.code, enabled });
    }
  },

  enablePovMode: (enable) => {
    const { socket, session } = get();
    if (!socket || !session) return;
    socket.emit('POV_MODE', { enable }, (res: any) => {
      if (res?.ok) {
        set({ povModeActive: enable });
        if (!enable) {
          set({ povTargetUserId: null, povPlaybackState: null });
        }
      }
    });
  },

  subscribePov: (targetUserId) => {
    const { socket, session } = get();
    if (!socket || !session) return;
    socket.emit('POV_SUBSCRIBE', { code: session.code, user_id: targetUserId }, (res: any) => {
      if (res?.ok) {
        set({ povTargetUserId: targetUserId });
        if (res.state) {
          set({ povPlaybackState: res.state });
        }
      }
    });
  },

  unsubscribePov: () => {
    const { socket, session } = get();
    if (!socket || !session) return;
    socket.emit('POV_UNSUBSCRIBE', { code: session.code }, (res: any) => {
      if (res?.ok) {
        set({ povTargetUserId: null, povPlaybackState: null });
      }
    });
  },

  getPovUrl: async (targetUserId) => {
    const { socket, session } = get();
    if (!socket || !session) return null;
    return new Promise<string | null>((resolve) => {
      socket.emit('GET_POV_URL', { code: session.code, user_id: targetUserId }, (res: any) => {
        if (res?.ok && res.url) {
          resolve(res.url);
        } else {
          resolve(null);
        }
      });
    });
  },

  updatePlaybackState: (update) => {
    set((state) => ({
      playbackState: { ...state.playbackState, ...update },
    }));
  },

  addLocalMessage: (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },
}));
