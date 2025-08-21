/**
 * Tests for encryption utilities
 */

import {
  generateEncryptionKey,
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  exportKey,
  importKey,
  generateSecurePassword,
  hashData,
  SecureKeyStorage,
} from '../encryption';

// Mock crypto for testing environment
const mockCrypto = {
  subtle: {
    generateKey: jest.fn(),
    deriveKey: jest.fn(),
    importKey: jest.fn(),
    exportKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    digest: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

// Mock global crypto
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
});

// Mock btoa and atob
global.btoa = jest.fn((str) => Buffer.from(str, 'binary').toString('base64'));
global.atob = jest.fn((str) => Buffer.from(str, 'base64').toString('binary'));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('Encryption Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEncryptionKey', () => {
    it('should generate an AES-GCM key', async () => {
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);

      const key = await generateEncryptionKey();

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
      expect(key).toBe(mockKey);
    });
  });

  describe('deriveKeyFromPassword', () => {
    it('should derive key from password using PBKDF2', async () => {
      const mockKeyMaterial = { type: 'raw' };
      const mockDerivedKey = { type: 'secret' };
      const mockSalt = new Uint8Array([1, 2, 3, 4]);

      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue(mockKeyMaterial);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockDerivedKey);

      const result = await deriveKeyFromPassword('password123');

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: mockSalt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        mockKeyMaterial,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );
      expect(result.key).toBe(mockDerivedKey);
      expect(result.salt).toBe(mockSalt);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const mockKey = { type: 'secret' };
      const mockIv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const mockEncryptedBuffer = new ArrayBuffer(16);
      const originalData = 'Hello, World!';

      mockCrypto.getRandomValues.mockReturnValue(mockIv);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedBuffer);
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode(originalData));

      // Encrypt
      const encryptedData = await encryptData(originalData, mockKey);

      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: mockIv,
        },
        mockKey,
        expect.any(Uint8Array)
      );

      // Decrypt
      const decryptedData = await decryptData(encryptedData, mockKey);

      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: expect.any(Uint8Array),
        },
        mockKey,
        expect.any(ArrayBuffer)
      );
      expect(decryptedData).toBe(originalData);
    });
  });

  describe('exportKey and importKey', () => {
    it('should export and import keys correctly', async () => {
      const mockKey = { type: 'secret' };
      const mockExportedKey = new ArrayBuffer(32);

      mockCrypto.subtle.exportKey.mockResolvedValue(mockExportedKey);
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);

      // Export
      const exportedKeyString = await exportKey(mockKey);

      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('raw', mockKey);

      // Import
      const importedKey = await importKey(exportedKeyString);

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(ArrayBuffer),
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
      expect(importedKey).toBe(mockKey);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate a secure password of specified length', () => {
      const mockRandomValues = new Uint8Array([65, 66, 67, 68]); // A, B, C, D
      mockCrypto.getRandomValues.mockReturnValue(mockRandomValues);

      const password = generateSecurePassword(4);

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(password).toHaveLength(4);
      expect(typeof password).toBe('string');
    });
  });

  describe('hashData', () => {
    it('should hash data using SHA-256', async () => {
      const mockHashBuffer = new ArrayBuffer(32);
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);

      const hash = await hashData('test data');

      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
      expect(typeof hash).toBe('string');
    });
  });

  describe('SecureKeyStorage', () => {
    describe('storeKey', () => {
      it('should store key in sessionStorage', async () => {
        const mockKey = { type: 'secret' };
        const mockExportedKey = new ArrayBuffer(32);

        mockCrypto.subtle.exportKey.mockResolvedValue(mockExportedKey);

        await SecureKeyStorage.storeKey('test-key', mockKey);

        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'couples_diary_key_test-key',
          expect.any(String)
        );
      });
    });

    describe('retrieveKey', () => {
      it('should retrieve key from sessionStorage', async () => {
        const mockKey = { type: 'secret' };
        const mockExportedKeyString = 'exported-key-string';

        mockSessionStorage.getItem.mockReturnValue(mockExportedKeyString);
        mockCrypto.subtle.importKey.mockResolvedValue(mockKey);

        const retrievedKey = await SecureKeyStorage.retrieveKey('test-key');

        expect(mockSessionStorage.getItem).toHaveBeenCalledWith(
          'couples_diary_key_test-key'
        );
        expect(retrievedKey).toBe(mockKey);
      });

      it('should return null if key not found', async () => {
        mockSessionStorage.getItem.mockReturnValue(null);

        const retrievedKey = await SecureKeyStorage.retrieveKey('test-key');

        expect(retrievedKey).toBeNull();
      });
    });

    describe('removeKey', () => {
      it('should remove key from sessionStorage', () => {
        SecureKeyStorage.removeKey('test-key');

        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
          'couples_diary_key_test-key'
        );
      });
    });

    describe('clearAllKeys', () => {
      it('should clear all keys from sessionStorage', () => {
        Object.keys = jest.fn().mockReturnValue([
          'couples_diary_key_key1',
          'couples_diary_key_key2',
          'other_key',
        ]);

        SecureKeyStorage.clearAllKeys();

        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('couples_diary_key_key1');
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('couples_diary_key_key2');
        expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('other_key');
      });
    });
  });
});