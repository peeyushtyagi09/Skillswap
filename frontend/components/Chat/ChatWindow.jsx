// frontend/components/Chat/ChatWindow.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import EmojiPicker from 'emoji-picker-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router-dom';
import api from '../../src/api';
import { connectSocket } from '../../lib/socket';
import CallInviteModal from './CallInviteModal';


// ENV
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

// Utility: detect likely GIF/image URLs in text messages
function isImageLikeUrl(text) {
  if (typeof text !== 'string') return false;
  return /(\.(gif|png|jpg|jpeg|webp)(\?|$))/i.test(text) || /(giphy\.com\/media|media\.giphy\.com)/i.test(text);
}

function isVideoLikeUrl(text) {
  if (typeof text !== 'string') return false;
  return /(\.(mp4|webm)(\?|$))/i.test(text);
}

// WhatsApp-like message bubble
function MessageBubble({ message, mine }) {
  const timeLabel = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // WhatsApp bubble styling
  const baseBubble = 'relative w-fit max-w-[80%] sm:max-w-[65%] px-3.5 py-2.5 pr-10 pb-5 whitespace-pre-wrap break-words leading-relaxed shadow-sm border';
  const peerBubble = 'bg-blue-300 text-white font-bold  rounded-2xl rounded-bl-md';
  const mineBubble = 'bg-blue-400 text-white font-bold rounded-2xl rounded-br-md';

  return (
    <div className={`w-full flex ${mine ? 'justify-end' : 'justify-start'} mb-1.5`}>
      <div className={`${baseBubble} ${mine ? mineBubble : peerBubble}`}>
        {message.type === 'text' ? (
          isVideoLikeUrl(message.context) ? (
            <video
              src={message.context}
              className="rounded-lg max-w-[240px] max-h-[240px] object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            />
          ) : isImageLikeUrl(message.context) ? (
            <img
              src={message.context}
              alt="GIF"
              className="rounded-lg max-w-[240px] max-h-[240px] object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <p>{message.context}</p>
          )
        ) : message.type === 'image' ? (
          (() => {
            const url = message.attachment?.url || (typeof message.context === 'string' ? message.context : '');
            return url ? (
              <img
                src={url}
                alt={message.attachment?.name || 'sent'}
                className="rounded-lg max-w-[240px] max-h-[240px] object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : null;
          })()
        ) : message.type === 'file' && (message.attachment?.url || typeof message.context === 'string') ? (
          <a
            href={message.attachment?.url || message.context}
            download={message.attachment?.name}
            className="underline"
          >
            📎 {message.attachment?.name || 'Download file'}
          </a>
        ) : null}
        <time className="absolute bottom-1 right-2 text-[10px] opacity-60">
          {timeLabel}
          {message.isTemp ? ' • sending…' : ''}
        </time>
      </div>
    </div>
  );
}

export default function ChatWindow({ peerId }) {
  const navigate = useNavigate();

  // Core chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [peerName, setPeerName] = useState('Friend');
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Me id for message side classification
  const [meId, setMeId] = useState(null);

  // UI panels state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState(null);

  // Upload state
  const [file, setFile] = useState(null);

  // Call state
  const [callId, setCallId] = useState(null);
  const [callMode, setCallMode] = useState(null); // 'incoming' | 'outgoing' | null
  const [callSecondsLeft, setCallSecondsLeft] = useState(45);
  const callTimerRef = useRef(null);

  // Refs
  const chatScrollRef = useRef(null);
  const bottomRef = useRef(null);
  const initialScrollDoneRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const gifRef = useRef(null);
  const searchRef = useRef(null);

  // Settings dropdown state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Scroll-to-bottom UX
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Drag-to-scroll state
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  // Helpers: scroll logic
  const isNearBottom = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return true;
    const threshold = 80; // px
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (bottomRef.current) {
      try {
        bottomRef.current.scrollIntoView({ behavior, block: 'end' });
        return;
      } catch {}
    }
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Pointer drag handlers to scroll the message list like WhatsApp Web
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return; // only left button
    const el = chatScrollRef.current;
    if (!el) return;
    dragging.current = true;
    setIsDraggingUI(true);
    dragStartY.current = e.clientY;
    dragStartScroll.current = el.scrollTop;
    // Disable text selection while dragging
    document.body.style.userSelect = 'none';
    el.classList.add('select-none');
  }, []);

  useEffect(() => {
    if (!isDraggingUI) return;
    const el = chatScrollRef.current;
    const onMove = (e) => {
      if (!dragging.current || !el) return;
      const dy = e.clientY - dragStartY.current;
      el.scrollTop = dragStartScroll.current - dy;
    };
    const stop = () => {
      dragging.current = false;
      setIsDraggingUI(false);
      if (el) el.classList.remove('select-none');
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [isDraggingUI]);

  // Search
  const runSearch = useCallback(
    async (useRegex = false) => {
      if (!peerId || !searchQuery.trim()) return;
      setSearching(true);
      setSearchError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const { data } = await api.get('/chat/search', {
          params: {
            peerId,
            q: searchQuery.trim(),
            limit: 30,
            // Optional: include regex flag if backend supports it
            regex: useRegex ? '1' : '0',
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        setSearchResults(data?.results || []);
      } catch (e) {
        console.error('Search failed', e);
        setSearchError('Search failed');
      } finally {
        setSearching(false);
      }
    },
    [peerId, searchQuery]
  );

  const clearChat = useCallback(async () => {
    if (!peerId || typeof peerId !== 'string' || peerId.trim() === '') {
      setError('Invalid peer ID. Please try again.');
      return;
    }
    if (!confirm('This clears your view of this chat. The other user will keep their copy. Continue?')) return;
  
    setClearing(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated. Please log in again.');
        return;
      }
      const { data } = await api.post(`/chat/clear/${peerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]); // optimistic
      setError(null); // Clear any previous errors
    } catch (e) {
      console.error('Failed to clear chat:', e);
      const errorMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to clear chat. Please try again.';
      setError(errorMessage);
    } finally {
      setClearing(false);
    }
  }, [peerId]);

  // GIF fetch
  const fetchGifs = useCallback(
    async (query = '') => {
      if (!GIPHY_API_KEY) {
        setGifError('GIPHY API key is missing. Add it to your .env file.');
        return;
      }
      setGifLoading(true);
      setGifError(null);
      try {
        const endpoint = query.trim() ? 'search' : 'trending';
        const params = new URLSearchParams({ api_key: GIPHY_API_KEY, limit: '24', rating: 'g' });
        if (query.trim()) params.set('q', query.trim());

        const res = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch GIFs');
        const json = await res.json();
        setGifResults(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        console.error(e);
        setGifError('Failed to load GIFs');
      } finally {
        setGifLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (showGifPicker) fetchGifs('');
  }, [showGifPicker, fetchGifs]);

  const sendGif = useCallback(
    (gif) => {
      const s = socketRef.current;
      if (!s || !s.connected) {
        setError('Connection lost');
        return;
      }
      // Prefer lightweight variants: MP4 (small), then WebP, then GIF
      const url =
        gif?.images?.fixed_height_small?.mp4 ||
        gif?.images?.downsized_small?.mp4 ||
        gif?.images?.preview_webp ||
        gif?.images?.fixed_height_small?.webp ||
        gif?.images?.downsized_medium?.url ||
        gif?.images?.original?.url ||
        gif?.images?.fixed_height?.url;
      if (!url) return;

      const tempMessage = {
        _id: `temp_${Date.now()}`,
        context: url,
        senderId: 'me',
        receiverId: peerId,
        type: 'text',
        createdAt: new Date().toISOString(),
        isTemp: true,
      };
      setMessages((prev) => [...prev, tempMessage]);
      s.emit('chat:send', { peerId, context: url });
      setShowGifPicker(false);
    },
    [peerId]
  );

  // Emoji
  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  // File upload
  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const isImage = selected.type?.startsWith('image/');

    // Create a temporary preview message for instant feedback
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      type: isImage ? 'image' : 'file',
      context: isImage ? '' : selected.name,
      attachment: {
        url: URL.createObjectURL(selected),
        name: selected.name,
        type: selected.type,
      },
      senderId: 'me',
      receiverId: peerId,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
  
    try {
      const formData = new FormData();
      formData.append('file', selected);
      formData.append('receiverId', peerId);
      formData.append('type', isImage ? 'image' : 'file');
  
      const token = localStorage.getItem('accessToken');
  
      const { data } = await api.post('/chat/sendMedia', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
  
      // Replace temp message with the persisted one (avoid duplicates if socket delivered first)
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m._id !== tempMsg._id);
        if (data && data._id) {
          if (withoutTemp.some((m) => m._id === data._id)) return withoutTemp;
          return [...withoutTemp, data];
        }
        // If server response lacks an id, rely on the socket event to append
        return withoutTemp;
      });

      // Rely on server to broadcast via sockets; no manual emit here
    } catch (err) {
      console.error('Failed to send file', err);
      setError('Failed to send file');
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
    } finally {
      // Reset file input to allow re-selecting the same file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  
  
  

  const handleSendFile = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', peerId);
    formData.append('type', file.type.startsWith('image/') ? 'image' : 'file');

    const token = localStorage.getItem('accessToken');
    try {
      const { data } = await api.post('/chat/sendMedia', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      // Avoid duplicates if the socket event arrives before the HTTP response
      setMessages((prev) => {
        if (data && data._id && prev.some((m) => m._id === data._id)) return prev;
        return [...prev, data];
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to send file', err);
      setError('Failed to send file');
    }
  };

  // Send text
  const send = useCallback(async () => {
    if (!input.trim() || sending) return;

    const s = socketRef.current;
    if (!s || !s.connected) {
      setError('Connection lost');
      return;
    }

    const messageText = input.trim();
    setSending(true);

    try {
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        context: messageText,
        senderId: 'me',
        receiverId: peerId,
        type: 'text',
        createdAt: new Date().toISOString(),
        isTemp: true,
      };
      setMessages((prev) => [...prev, tempMessage]);
      setInput('');

      // Stop typing (server also auto-stops after 5s)
      s.emit('user:typing:stop', { to: peerId });

      // Send message
      s.emit('chat:send', { peerId, context: messageText });
    } catch (err) {
      setError('Failed to send message');
      setMessages((prev) => prev.filter((m) => !m.isTemp));
    } finally {
      setSending(false);
    }
  }, [input, peerId, sending]);

  // Typing
  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);
      const s = socketRef.current;
      if (s && s.connected) {
        s.emit('user:typing', { to: peerId });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          s.emit('user:typing:stop', { to: peerId });
        }, 1000);
      }
    },
    [peerId]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
      if (e.key === 'Escape') {
        setShowEmoji(false);
        setShowGifPicker(false);
        setSearchOpen(false);
      }
    },
    [send]
  );

  // Outside click to close popovers
  useEffect(() => {
    function onClick(event) {
      const targets = [emojiRef.current, gifRef.current, searchRef.current];
      if (targets.every((ref) => ref && !ref.contains(event.target))) {
        setShowEmoji(false);
        setShowGifPicker(false);
        // do not auto-close search on any click inside header area
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Initialize chat + sockets
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !peerId) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    let mounted = true;

    const initChat = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load messages
        const { data: initialMessages } = await api.get('/chat/history', {
          params: { peerId },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mounted) setMessages(initialMessages);

        // Fetch peer name (best effort)
        try {
          const { data: userData } = await api.get(`/profile/user/${peerId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (mounted) setPeerName(userData.username || 'Friend');
        } catch {}

        // Fetch me id for side classification
        try {
          const { data: me } = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (mounted) setMeId(me?.id || me?._id || null);
        } catch {}

        // Socket
        const s = await connectSocket();
        if (!mounted) return;
        socketRef.current = s;
        setIsConnected(s.connected);

        s.on('connect', () => mounted && setIsConnected(true));
        s.on('disconnect', () => mounted && setIsConnected(false));

        // Join chat room
        s.emit('chat:join', peerId);

        // Online snapshot
        s.on('users:online', (onlineList) => {
          if (mounted) setPeerOnline(onlineList.includes(peerId));
        });

        // Typing
        s.on('user:typing', ({ from }) => {
          if (mounted && from === peerId) setPeerTyping(true);
        });
        s.on('user:typing:stop', ({ from }) => {
          if (mounted && from === peerId) setPeerTyping(false);
        });

        // Incoming messages
        s.on('chat:message', (message) => {
          if (!mounted) return;
          setMessages((prev) => {
            const filteredPrev = prev.filter((m) => !m.isTemp);
            const exists = filteredPrev.some((x) => x._id === message._id);
            if (exists) return filteredPrev;
            return [...filteredPrev, message];
          });
        });

        // Online status updates
        s.on('user:online', (id) => {
          if (mounted && id === peerId) setPeerOnline(true);
        });
        s.on('user:offline', (id) => {
          if (mounted && id === peerId) setPeerOnline(false);
        });
        s.on('user:status', ({ userId, online }) => {
          if (mounted && userId === peerId) setPeerOnline(online);
        });

        // Call lifecycle handlers
        s.on('call:incoming', ({ from, callId }) => {
          if (!mounted) return;
          if (String(from) !== String(peerId)) return;
          setCallId(callId);
          setCallMode('incoming');
          setCallSecondsLeft(45);
          startCallCountdown();
        });
        s.on('call:initiated', ({ callId }) => {
          if (!mounted) return;
          setCallId(callId);
          setCallMode('outgoing');
          setCallSecondsLeft(45);
          startCallCountdown();
        });
        s.on('call:accepted', ({ sessionId, peerId: pid }) => {
          if (!mounted) return;
          stopCallCountdown();
          setCallId(null);
          setCallMode(null);
          navigate(`/call?sessionId=${sessionId}&peerId=${pid}`);
        });
        s.on('call:rejected', () => {
          if (!mounted) return;
          stopCallCountdown();
          setCallId(null);
          setCallMode(null);
        });
        s.on('call:timeout', () => {
          if (!mounted) return;
          stopCallCountdown();
          setCallId(null);
          setCallMode(null);
        });
        s.on('call:error', (err) => {
          if (!mounted) return;
          stopCallCountdown();
          setCallId(null);
          setCallMode(null);
          setError(err?.message || 'Call error');
        });

        s.on('chat:error', (err) => {
          if (mounted) setError(err.message || 'Chat error');
        });
        s.on('chat:cleared', ({ peerId: clearedPeer }) => {
          if (mounted && clearedPeer === peerId) setMessages([]);
        });
      } catch (err) {
        if (mounted) setError('Failed to load chat');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initChat();

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      stopCallCountdown();
      const s = socketRef.current;
      if (s) {
        s.emit('chat:leave', peerId);
        s.off('connect');
        s.off('disconnect');
        s.off('chat:message');
        s.off('user:typing');
        s.off('user:typing:stop');
        s.off('users:online');
        s.off('user:online');
        s.off('user:offline');
        s.off('user:status');
        s.off('chat:error');
        s.off('chat:cleared');
        // Call events
        s.off('call:incoming');
        s.off('call:initiated');
        s.off('call:accepted');
        s.off('call:rejected');
        s.off('call:timeout');
        s.off('call:error');
      }
    };
  }, [peerId, navigate]);

  // Reset initial bottom scroll when peer changes
  useEffect(() => {
    initialScrollDoneRef.current = false;
  }, [peerId]);

  // Call countdown handling
  const startCallCountdown = () => {
    stopCallCountdown();
    callTimerRef.current = setInterval(() => {
      setCallSecondsLeft((prev) => {
        if (prev <= 1) {
          stopCallCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const stopCallCountdown = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  // Start outgoing call
  const startOutgoingCall = () => {
    const s = socketRef.current;
    if (!s || !s.connected) {
      setError('Connection lost');
      return;
    }
    s.emit('call:initiate', { to: peerId });
    // UI will switch to outgoing on call:initiated
  };

  // Accept/Reject incoming (or cancel outgoing) call
  const acceptCall = () => {
    const s = socketRef.current;
    if (!s || !s.connected || !callId) return;
    s.emit('call:accept', { callId });
  };
  const rejectCall = () => {
    const s = socketRef.current;
    if (!s || !s.connected || !callId) return;
    s.emit('call:reject', { callId });
    stopCallCountdown();
    setCallId(null);
    setCallMode(null);
  };

  // Scroll behavior: show FAB and only auto-scroll if near bottom
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollToBottom(!isNearBottom());
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isNearBottom]);

  useEffect(() => {
    if (isNearBottom()) {
      // Auto-scroll on new messages if user is at bottom
      scrollToBottom('auto');
    }
  }, [messages, isNearBottom, scrollToBottom]);

  // Perform initial scroll to bottom once after first load
  useEffect(() => {
    if (!loading && messages.length > 0 && !initialScrollDoneRef.current) {
      scrollToBottom('auto');
      // Fallback for media/gif load reflow
      setTimeout(() => scrollToBottom('auto'), 50);
      initialScrollDoneRef.current = true;
    }
  }, [loading, messages.length, scrollToBottom]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary" />
          <p className="mt-4 text-base-content/70">Loading chat…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Error</h3>
          <p className="text-base-content/70 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-4 h-full flex flex-col bg-blue-100 backdrop-blur-xl border border-white/30  p-4 shadow-lg">
      
      <div
  className="mx-auto w-full flex flex-col h-[90vh] rounded-2xl shadow-xl overflow-hidden border border-black bg-white text-black"
  // style={{
  //   backgroundImage: "url('/src/public/images/chat-background.webp')",
  //   backgroundSize: 'cover',
  //   backgroundPosition: 'center'
  // }}
>
        {/* Sticky Header */}
        <div className="relative sticky top-0 z-10 p-4 border-b border-black flex items-center gap-4 bg-blue-200 backdrop-blur-sm text-white">
          <div className="avatar">
            <div className={`w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 relative`}>
              <div className="w-12 h-12 rounded-full bg-neutral-focus text-neutral-content flex items-center justify-center text-lg font-bold">
                {peerName ? peerName.charAt(0).toUpperCase() : 'F'}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-base-100 ${
                  peerOnline ? (peerTyping ? 'bg-warning animate-pulse' : 'bg-success') : 'bg-base-300'
                }`}
                aria-label={peerOnline ? (peerTyping ? 'Typing' : 'Online') : 'Offline'}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-extrabold truncate">{peerName}</h2>
            <div className="flex items-center gap-2 mt-0.5 text-sm">
              <span className="text-base-content/60">
                {peerOnline ? (peerTyping ? 'Typing…' : isConnected ? 'Online' : 'Connected') : 'Offline'}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/friends')}
            className="border-4 hover:border-gray-200 bg-gray-400 w-fit text-white text-bold p-2 rounded-xl duration-500"
            aria-label="Go back"
            title="Go back"
          >
            ← Back
          </button>

          {/* Video Call Button */}
          <button
            className="border-2 border-blue-400 rounded-full p-2"
            onClick={startOutgoingCall}
            disabled={!isConnected}
            aria-label="Start video call"
            title="Start video call"
          >
            ☎ Call
          </button>

          {/* Settings dropdown with Search and Clear */}
          <DropdownMenu.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                className="btn btn-ghost btn-sm "
                aria-label="Chat settings"
                title="Chat settings"
              >
                ⚙️
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="p-1  border border-base-300 rounded-xl shadow-2xl w-44 bg-black text-white"
              >
                <DropdownMenu.Item asChild>
                  <button
                    className="w-full text-left px-3 py-2  rounded-lg hover:bg-base-200"
                    onClick={() => {
                      setSearchOpen(true);
                      setSettingsOpen(false);
                    }}
                  >
                    🔍 Search
                  </button>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 text-error"
                    onClick={() => {
                      setSettingsOpen(false);
                      clearChat();
                    }}
                    disabled={clearing || !isConnected}
                  >
                    🗑️ Clear chat
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Search Panel */}
          {searchOpen && (
            <div
              ref={searchRef}
              className="absolute text-black right-4 top-full mt-2 z-50 bg-base-100 border border-base-300 rounded-xl shadow-xl w-[min(96vw,26rem)] p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Search</div>
                <button className="btn btn-ghost btn-xs " onClick={() => setSearchOpen(false)} aria-label="Close search">✖</button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch(false);
                }}
                className="flex gap-2 mb-3"
              >
                <input
                  className="input input-bordered input-sm flex-1"
                  placeholder="Search messages…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-sm" type="submit" disabled={searching}>
                  Find
                </button>
              </form>

              {searchError && <div className="text-error text-sm mb-2">{searchError}</div>}

              {searching ? (
                <div className="flex justify-center py-6">
                  <span className="loading loading-spinner" />
                </div>
              ) : (
                <ul className="max-h-64 overflow-auto space-y-2">
                  {searchResults.map((m) => (
                    <li key={m._id} className="p-2 rounded bg-base-200">
                      <div className="text-xs opacity-70">{new Date(m.createdAt).toLocaleString()}</div>
                      <div className="text-sm break-words">{m.context}</div>
                    </li>
                  ))}
                  {searchResults.length === 0 && (
                    <li className="text-sm text-base-content/60 p-2">No results</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          {file && (
            <button onClick={handleSendFile} className="ml-2 text-sm text-blue-700">
              Send {file.name}
            </button>
          )}

          {/* Emoji picker */}
          {showEmoji && (
            <div ref={emojiRef} className="absolute bottom-16 right-16 z-50">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}

{/* GIF picker */}
{showGifPicker && (
  <div ref={gifRef} className="absolute bottom-16 right-16 w-80 h-80 bg-white border rounded-lg shadow-lg overflow-auto z-50">
    {gifLoading && <div className="p-4">Loading...</div>}
    {gifError && <div className="p-4 text-red-500">{gifError}</div>}
    <div className="grid grid-cols-3 gap-2 p-2">
      {gifResults.map((gif) => (
        <button key={gif.id} onClick={() => sendGif(gif)}>
          <img
            src={gif.images.fixed_height_small.url}
            alt={gif.title}
            className="rounded"
          />
        </button>
      ))}
    </div>
  </div>
)}


        {/* Messages */}
        <div
          ref={chatScrollRef}
          onPointerDown={handlePointerDown}
          className={`flex-1 bg-base-100 overflow-y-auto px-2 sm:px-4 ${isDraggingUI ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ minHeight: 0 }}
          aria-live="polite"
          aria-label="Message list"
        >
          <div className="py-4 flex flex-col justify-end min-h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-base-content/50 py-12">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-lg font-medium">
                  Start a conversation with <span className="text-primary font-semibold">{peerName}</span>
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const sId = (m && (m.senderId?._id || m.senderId?.id || m.senderId)) || m.senderId;
                const sStr = sId != null ? String(sId) : '';
                let mine;
                if (meId) {
                  mine = sId === 'me' || sStr === String(meId);
                } else {
                  // Fallback: if sender equals peerId, it's peer; otherwise treat as mine
                  mine = sId === 'me' || sStr !== String(peerId);
                }
                return (
                  <MessageBubble key={`${m._id}-${m.createdAt}-${idx}`} message={m} mine={mine} />
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {showScrollToBottom && (
            <button
              className="btn btn-circle btn-primary fixed bottom-28 right-6 shadow-lg"
              onClick={() => scrollToBottom('smooth')}
              aria-label="Scroll to newest messages"
              title="Scroll to newest messages"
            >
              ↓
            </button>
          )}
        </div>

        {/* Composer */}
        <div className="w-full  mx-auto p-3 bg-blue-300 text-white ">
          <div className="flex items-center gap-2">
            {/* Mic */}
            <button className="text-xl border rounded-full  p-2 ">🎤︎︎</button>

            {/* Input wrapper */}
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Write Something..."
                className="w-full pl-3 pr-24 py-2 rounded-full bg-white text-black resize-none shadow-sm "
                rows={1}
              />

              {/* Right-side icons inside input */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-blue-500">
                <button onClick={() => fileInputRef.current?.click()}>📎</button>
                <button onClick={() => setShowEmoji(v=>!v)}>😊</button>
                <button onClick={() => setShowGifPicker(v=>!v)}>🖼️</button>
              </div>
            </div>

            {/* Send circular button */}
            <button
              onClick={send}
              disabled={!input.trim() || sending || !isConnected}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white"
            >
              ➤
            </button>
          </div>
        </div>


      </div>

      {/* Call Invite Modal */}
      <CallInviteModal
        isOpen={!!callMode}
        mode={callMode || 'outgoing'}
        peerName={peerName}
        secondsLeft={callSecondsLeft}
        onAccept={acceptCall}
        onReject={rejectCall}
        onClose={() => {
          // Close modal w/o sending a reject to not alter server state;
          // user can still reject/cancel using modal actions
          setCallMode(null);
        }}
      />
    </div>
  );
}
