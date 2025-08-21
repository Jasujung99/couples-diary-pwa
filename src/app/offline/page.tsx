/**
 * Offline fallback page
 */

'use client';

import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const { isOnline, triggerSync } = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    if (isOnline) {
      // Redirect to home when back online
      router.push('/app');
    }
  }, [isOnline, router]);

  const handleRetry = () => {
    if (isOnline) {
      triggerSync();
      router.push('/app');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bgSoft to-lilac flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
          className="mb-8"
        >
          <div className="relative">
            <Heart className="w-24 h-24 mx-auto text-gold mb-4" />
            <WifiOff className="w-8 h-8 absolute -bottom-2 -right-2 text-ink bg-bg rounded-full p-1" />
          </div>
        </motion.div>

        <h1 className="text-2xl font-bold text-ink mb-4">
          You're Offline
        </h1>

        <p className="text-forest/70 mb-8 leading-relaxed">
          Don't worry! Your love story continues even offline. 
          You can still view your recent diary entries and memories. 
          New entries will sync when you're back online.
        </p>

        <div className="space-y-4">
          <Button
            onClick={handleRetry}
            className="w-full"
            disabled={!isOnline}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isOnline ? 'Go to App' : 'Try Again'}
          </Button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm text-forest/50"
          >
            {isOnline ? (
              <span className="text-green-600">✓ Connection restored</span>
            ) : (
              <span>Waiting for connection...</span>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-12 p-4 bg-white/50 rounded-lg border border-line/20"
        >
          <h3 className="font-semibold text-ink mb-2">Offline Features</h3>
          <ul className="text-sm text-forest/70 space-y-1">
            <li>• View recent diary entries</li>
            <li>• Browse your memories</li>
            <li>• Write new diary entries</li>
            <li>• Plan future dates</li>
          </ul>
          <p className="text-xs text-forest/50 mt-2">
            Everything will sync automatically when you're back online.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}