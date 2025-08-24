'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

interface UseSocketReturn {
  socket: any | null;
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

// Mock socket for development
export function useSocketMock(): UseSocketReturn {
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const eventListeners = useRef<Map<string, Function[]>>(new Map());

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Simulate connection
      setTimeout(() => {
        setIsConnected(true);
        setIsPartnerOnline(Math.random() > 0.5); // Random partner status
        console.log('Mock socket connected');
      }, 1000);
    } else if (status === 'unauthenticated') {
      setIsConnected(false);
      setIsPartnerOnline(false);
      setIsPartnerTyping(false);
    }
  }, [session, status]);

  const emitDiaryEntryCreated = (data: {
    entryId: string;
    authorName: string;
    mood: string;
    date: string;
  }) => {
    console.log('Mock: Diary entry created', data);
    // Simulate partner notification
    setTimeout(() => {
      const listeners = eventListeners.current.get('new-diary-entry') || [];
      listeners.forEach(callback => callback({
        entryId: data.entryId,
        authorId: 'partner-id',
        authorName: data.authorName,
        mood: data.mood,
        date: data.date,
        timestamp: new Date()
      }));
    }, 500);
  };

  const emitDiaryEntryReplied = (data: {
    date: string;
  }) => {
    console.log('Mock: Diary entry replied', data);
    setTimeout(() => {
      const listeners = eventListeners.current.get('diary-exchange-complete') || [];
      listeners.forEach(callback => callback({
        date: data.date,
        timestamp: new Date()
      }));
    }, 500);
  };

  const emitTypingStart = () => {
    console.log('Mock: Typing started');
    // Simulate partner typing
    setTimeout(() => {
      setIsPartnerTyping(true);
      const listeners = eventListeners.current.get('partner-typing-diary') || [];
      listeners.forEach(callback => callback({
        userId: 'partner-id',
        timestamp: new Date()
      }));
    }, 200);
  };

  const emitTypingStop = () => {
    console.log('Mock: Typing stopped');
    setTimeout(() => {
      setIsPartnerTyping(false);
      const listeners = eventListeners.current.get('partner-stopped-typing-diary') || [];
      listeners.forEach(callback => callback({
        userId: 'partner-id',
        timestamp: new Date()
      }));
    }, 200);
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    const listeners = eventListeners.current.get(event) || [];
    listeners.push(callback);
    eventListeners.current.set(event, listeners);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (callback) {
      const listeners = eventListeners.current.get(event) || [];
      const filtered = listeners.filter(cb => cb !== callback);
      eventListeners.current.set(event, filtered);
    } else {
      eventListeners.current.delete(event);
    }
  };

  return {
    socket: { connected: isConnected },
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