'use client';

import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState } from 'react';

export default function SocketTestPage() {
  const { 
    isConnected, 
    isPartnerOnline, 
    isPartnerTyping, 
    emitDiaryEntryCreated,
    emitTypingStart,
    emitTypingStop,
    on,
    off
  } = useSocket();

  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const handleNewEntry = (data: any) => {
      setMessages(prev => [...prev, `New diary entry: ${data.mood} by ${data.authorName}`]);
    };

    const handlePartnerTyping = (data: any) => {
      setMessages(prev => [...prev, `Partner started typing at ${data.timestamp}`]);
    };

    on('new-diary-entry', handleNewEntry);
    on('partner-typing-diary', handlePartnerTyping);

    return () => {
      off('new-diary-entry', handleNewEntry);
      off('partner-typing-diary', handlePartnerTyping);
    };
  }, [on, off]);

  const testDiaryEntry = () => {
    emitDiaryEntryCreated({
      entryId: 'test-entry-' + Date.now(),
      authorName: 'Test User',
      mood: 'happy',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const testTyping = () => {
    emitTypingStart();
    setTimeout(() => emitTypingStop(), 2000);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Socket Connection Test</h1>
      
      <div className="space-y-4 mb-8">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold mb-2">Connection Status</h2>
          <p>Connected: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Yes' : 'No'}
          </span></p>
          <p>Partner Online: <span className={isPartnerOnline ? 'text-green-600' : 'text-gray-600'}>
            {isPartnerOnline ? 'Yes' : 'No'}
          </span></p>
          <p>Partner Typing: <span className={isPartnerTyping ? 'text-blue-600' : 'text-gray-600'}>
            {isPartnerTyping ? 'Yes' : 'No'}
          </span></p>
        </div>

        <div className="space-x-4">
          <button 
            onClick={testDiaryEntry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Diary Entry
          </button>
          <button 
            onClick={testTyping}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Typing Indicator
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="font-semibold mb-2">Socket Messages</h2>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet</p>
          ) : (
            messages.map((message, index) => (
              <p key={index} className="text-sm">{message}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}