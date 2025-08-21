/**
 * Custom service worker for background sync functionality
 */

// Import Workbox libraries
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');

  // Enable navigation preload
  workbox.navigationPreload.enable();

  // Background sync for offline diary entries
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('diary-sync', {
    maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
  });

  // Register route for diary API with background sync
  workbox.routing.registerRoute(
    /\/api\/diary\/entries/,
    new workbox.strategies.NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'POST'
  );

  workbox.routing.registerRoute(
    /\/api\/diary\/entries/,
    new workbox.strategies.NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'PUT'
  );

  // Background sync for date plans
  const dateSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('date-sync', {
    maxRetentionTime: 24 * 60
  });

  workbox.routing.registerRoute(
    /\/api\/dates/,
    new workbox.strategies.NetworkOnly({
      plugins: [dateSyncPlugin]
    }),
    'POST'
  );

  workbox.routing.registerRoute(
    /\/api\/dates/,
    new workbox.strategies.NetworkOnly({
      plugins: [dateSyncPlugin]
    }),
    'PUT'
  );

  // Background sync for memories
  const memorySyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('memory-sync', {
    maxRetentionTime: 24 * 60
  });

  workbox.routing.registerRoute(
    /\/api\/memories/,
    new workbox.strategies.NetworkOnly({
      plugins: [memorySyncPlugin]
    }),
    'POST'
  );

  workbox.routing.registerRoute(
    /\/api\/memories/,
    new workbox.strategies.NetworkOnly({
      plugins: [memorySyncPlugin]
    }),
    'PUT'
  );

  // Listen for background sync events
  self.addEventListener('sync', event => {
    console.log('Background sync event:', event.tag);
    
    if (event.tag === 'background-sync') {
      event.waitUntil(handleBackgroundSync());
    }
  });

  // Handle background sync
  async function handleBackgroundSync() {
    try {
      // Trigger sync in the main thread
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_SYNC',
          payload: { action: 'trigger' }
        });
      });
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  // Listen for messages from main thread
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  // Show notification when app is updated
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'APP_UPDATED') {
      self.registration.showNotification('App Updated', {
        body: 'The app has been updated. Restart to get the latest version.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'app-update',
        requireInteraction: true,
        actions: [
          {
            action: 'reload',
            title: 'Reload'
          },
          {
            action: 'dismiss',
            title: 'Later'
          }
        ],
        data: { url: '/' }
      });
    }
  });

  // Handle Web Push payloads
  self.addEventListener('push', event => {
    try {
      const data = (event.data && event.data.json && event.data.json()) || {};
      const title = data.title || 'New Notification';
      const options = {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: data.tag || 'push',
        data: { url: data.url || '/' }
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      // If payload is not JSON (or empty), show a generic notification
      event.waitUntil(self.registration.showNotification('New Notification', {
        body: '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'push',
        data: { url: '/' }
      }));
    }
  });

  // Handle notification clicks with deep linking
  self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'reload') {
      // Reload all clients
      event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'RELOAD_APP' });
          });
        })
      );
      return;
    }

    // Default click: focus existing window or open target URL
    const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          const url = new URL(client.url);
          if (url.pathname === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  });

  // Offline fallback page
  const OFFLINE_FALLBACK_PAGE = '/offline';

  self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('offline-fallback').then(cache => {
        return cache.addAll([
          OFFLINE_FALLBACK_PAGE,
          '/icons/icon-192x192.png'
        ]);
      })
    );
  });

  // Serve offline fallback when navigation fails
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    async ({ event }) => {
      try {
        const response = await workbox.strategies.NetworkFirst({
          cacheName: 'pages',
          networkTimeoutSeconds: 3
        }).handle({ event, request: event.request });
        
        return response || caches.match(OFFLINE_FALLBACK_PAGE);
      } catch (error) {
        return caches.match(OFFLINE_FALLBACK_PAGE);
      }
    }
  );

} else {
  console.log('Workbox could not be loaded');
}