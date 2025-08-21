'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';

interface SocketContextType {
  // Socket connection state is managed by useSocket hook
  // This context is mainly for initialization
}

const SocketContext = createContext<SocketContextType>({});

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const socket = useSocket();
  const { requestPermission } = useNotifications();

  // Request notification permission on mount
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await requestPermission();
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    };

    initNotifications();
  }, [requestPermission]);

  // Initialize socket connection by calling useSocket
  // The actual connection logic is handled in the hook
  useEffect(() => {
    // Socket connection is automatically managed by useSocket hook
    console.log('Socket provider initialized');
  }, []);

  return (
    <SocketContext.Provider value={{}}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};