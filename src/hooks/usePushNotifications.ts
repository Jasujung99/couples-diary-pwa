'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = (typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary'));
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const publicKey = useMemo(() => process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY, []);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setIsSubscribed(!!sub))
        .catch(() => setIsSubscribed(false));
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;

    let currentPermission: NotificationPermission = Notification.permission;
    if (currentPermission === 'default') {
      currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);
    }
    if (currentPermission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const options: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        applicationServerKey: publicKey ? urlBase64ToUint8Array(publicKey) : undefined,
      };
      sub = await reg.pushManager.subscribe(options);
    }

    // Send subscription to server (in-memory store for MVP)
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });

    setIsSubscribed(true);
  }, [isSupported, publicKey]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      try {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: 'DELETE',
        });
      } catch {
        // ignore server error on delete in MVP
      }
      await sub.unsubscribe();
    }
    setIsSubscribed(false);
  }, [isSupported]);

  const sendLocalTestNotification = useCallback(
    async (title: string, options?: { body?: string; url?: string; tag?: string }) => {
      if (!isSupported) return;
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body: options?.body,
        tag: options?.tag || 'local-test',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: { url: options?.url || '/' },
      });
    },
    [isSupported]
  );

  return {
    permission,
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendLocalTestNotification,
  };
}
