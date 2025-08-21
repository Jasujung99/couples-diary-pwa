/**
 * Service worker initialization and management
 */

export function initializeServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                showUpdateNotification();
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'BACKGROUND_SYNC') {
            // Handle background sync trigger
            handleBackgroundSyncMessage(event.data.payload);
          } else if (event.data && event.data.type === 'RELOAD_APP') {
            // Reload the app
            window.location.reload();
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  }
}

function showUpdateNotification() {
  // Show a notification that an update is available
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('App Update Available', {
      body: 'A new version of Couples Diary is available. Refresh to update.',
      icon: '/icons/icon-192x192.png',
      tag: 'app-update'
    });
  } else {
    // Fallback to console log or custom UI notification
    console.log('App update available');
  }
}

function handleBackgroundSyncMessage(payload: any) {
  // Trigger background sync in the main thread
  if (payload.action === 'trigger') {
    // Import and trigger background sync
    import('@/lib/backgroundSync').then(({ backgroundSync }) => {
      backgroundSync.triggerSync();
    });
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  return Promise.resolve(Notification.permission);
}

export function skipWaiting() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update();
      }
    });
  }
}