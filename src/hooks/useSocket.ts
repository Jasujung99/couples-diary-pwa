'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketEvents {
  'new-diary-entry': (data: {
    entryId: string;
    authorId: string;
    authorName: string;
    mood: string;
    date: string;
    timestamp: Date;
  }) => void;
  'diary-exchange-complete': (data: {
    date: string;
    timestamp: Date;
  }) => void;
  'partner-online': (data: {
    userId: string;
    timestamp: Date;
  }) => void;
  'partner-offline': (data: {
    userId: string;
    timestamp: Date;
  }) => void;
  'partner-typing-diary': (data: {
    userId: string;
    timestamp: Date;
  }) => void;
  'partner-stopped-typing-diary': (data: {
    userId: string;
    timestamp: Date;
  }) => void;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isPartnerOnline: boolean;
  isPartnerTyping: boolean;
  emitDiaryEntryCreated: (data: {
    entryId: string;
    authorName: string;
    mood: string;
    date: string;
  }) => void;
  emitDiaryEntryReplied: (data: {
    date: string;
  }) => void;
  emitTypingStart: () => void;
  emitTypingStop: () => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

export function useSocket(): UseSocketReturn {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'authenticated' && session?.user && !socketRef.current) {
      // Initialize socket connection
      const socket = io({
        path: '/api/socket',
        addTrailingSlash: false,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('Connected to Socket.io server');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from Socket.io server');
        setIsConnected(false);
        setIsPartnerOnline(false);
        setIsPartnerTyping(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Partner presence events
      socket.on('partner-online', (data) => {
        console.log('Partner came online:', data);
        setIsPartnerOnline(true);
      });

      socket.on('partner-offline', (data) => {
        console.log('Partner went offline:', data);
        setIsPartnerOnline(false);
        setIsPartnerTyping(false);
      });

      // Typing indicator events
      socket.on('partner-typing-diary', (data) => {
        console.log('Partner started typing:', data);
        setIsPartnerTyping(true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing indicator after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setIsPartnerTyping(false);
        }, 3000);
      });

      socket.on('partner-stopped-typing-diary', (data) => {
        console.log('Partner stopped typing:', data);
        setIsPartnerTyping(false);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      });

    } else if (status === 'unauthenticated' && socketRef.current) {
      // Disconnect socket when user logs out
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsPartnerOnline(false);
      setIsPartnerTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [session, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Emit functions
  const emitDiaryEntryCreated = (data: {
    entryId: string;
    authorName: string;
    mood: string;
    date: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('diary-entry-created', data);
    }
  };

  const emitDiaryEntryReplied = (data: {
    date: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('diary-entry-replied', data);
    }
  };

  const emitTypingStart = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('diary-typing-start');
    }
  };

  const emitTypingStop = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('diary-typing-stop');
    }
  };

  // Event listener functions
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    isPartnerOnline,
    isPartnerTyping,
    emitDiaryEntryCreated,
    emitDiaryEntryReplied,
    emitTypingStart,
    emitTypingStop,
    on,
    off,
  };
}