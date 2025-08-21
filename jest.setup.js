// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock IndexedDB for tests
import 'fake-indexeddb/auto';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user',
        email: 'test@example.com',
        coupleId: 'test-couple'
      }
    },
    status: 'authenticated'
  }),
  SessionProvider: ({ children }) => children,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue({
      addEventListener: jest.fn(),
      sync: {
        register: jest.fn().mockResolvedValue(undefined)
      }
    }),
    ready: Promise.resolve({
      sync: {
        register: jest.fn().mockResolvedValue(undefined)
      }
    }),
    addEventListener: jest.fn(),
    controller: {
      postMessage: jest.fn()
    }
  },
  writable: true,
});

// Mock storage estimate
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: jest.fn().mockResolvedValue({
      usage: 1024 * 1024,
      quota: 1024 * 1024 * 100
    })
  },
  writable: true,
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: class MockNotification {
    static permission = 'granted';
    static requestPermission = jest.fn().mockResolvedValue('granted');
    constructor(title, options) {
      this.title = title;
      this.options = options;
    }
    close = jest.fn();
  },
  writable: true,
});