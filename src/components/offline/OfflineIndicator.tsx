/**
 * Offline indicator component with sync status
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/Button';

export function OfflineIndicator() {
  const { 
    isOnline, 
    isConnecting, 
    syncStatus, 
    triggerSync, 
    retryFailedSync, 
    clearFailedSync 
  } = useNetworkStatus();

  const showIndicator = !isOnline || syncStatus.pending > 0 || syncStatus.failed > 0 || isConnecting;

  if (!showIndicator) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
      >
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">You're offline</span>
              </>
            ) : isConnecting || syncStatus.inProgress ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Syncing...</span>
              </>
            ) : syncStatus.pending > 0 ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {syncStatus.pending} item{syncStatus.pending !== 1 ? 's' : ''} waiting to sync
                </span>
              </>
            ) : syncStatus.failed > 0 ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {syncStatus.failed} item{syncStatus.failed !== 1 ? 's' : ''} failed to sync
                </span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {isOnline && (syncStatus.pending > 0 || syncStatus.failed > 0) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={triggerSync}
                disabled={isConnecting || syncStatus.inProgress}
                className="text-white hover:bg-white/20 h-6 px-2 text-xs"
              >
                <Wifi className="w-3 h-3 mr-1" />
                Sync Now
              </Button>
            )}

            {syncStatus.failed > 0 && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={retryFailedSync}
                  className="text-white hover:bg-white/20 h-6 px-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearFailedSync}
                  className="text-white hover:bg-white/20 h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar for sync */}
        {(isConnecting || syncStatus.inProgress) && (
          <div className="h-1 bg-white/20">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function OfflineToast() {
  const { isOnline, lastOnline } = useNetworkStatus();

  return (
    <AnimatePresence>
      {isOnline && lastOnline && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed bottom-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Back online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}