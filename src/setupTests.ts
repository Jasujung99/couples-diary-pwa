// jest-dom 확장 (매처)
import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// TextEncoder/TextDecoder polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// matchMedia 폴리필 (Framer Motion 등)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { }, // deprecated
    removeListener: () => { }, // deprecated
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  }),
});

// Notification/PushManager 안전 모킹
if (typeof (window as any).Notification === 'undefined') {
  (window as any).Notification = {
    permission: 'default',
    requestPermission: async () => 'granted',
  };
}

if (!('serviceWorker' in navigator)) {
  (window as any).navigator.serviceWorker = {
    ready: Promise.resolve({
      showNotification: async () => undefined,
      pushManager: {
        getSubscription: async () => null,
        subscribe: async () => ({}),
      },
    }),
  } as any;
}
