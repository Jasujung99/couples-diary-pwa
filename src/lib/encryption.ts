/**
 * Client-side encryption utilities using Web Crypto API
 * Provides end-to-end encryption for diary entries and sensitive data
 */

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  tagLength: 128,
  iterations: 100000, // PBKDF2 iterations
  saltLength: 16,
} as const;

export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt?: string; // Base64 encoded salt (for password-derived keys)
  tag?: string; // Base64 encoded authentication tag
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

/**
 * Generate a random encryption key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive encryption key from password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Generate salt if not provided
  const keySalt = salt || crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: keySalt,
      iterations: ENCRYPTION_CONFIG.iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength,
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
  
  return { key, salt: keySalt };
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
  
  // Encrypt data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: iv,
    },
    key,
    dataBuffer
  );
  
  // Convert to base64
  const encryptedData = arrayBufferToBase64(encryptedBuffer);
  const ivBase64 = arrayBufferToBase64(iv);
  
  return {
    data: encryptedData,
    iv: ivBase64,
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const dataBuffer = base64ToArrayBuffer(encryptedData.data);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  
  // Decrypt data
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: iv,
    },
    key,
    dataBuffer
  );
  
  // Convert back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Export encryption key to base64 string
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Import encryption key from base64 string
 */
export async function importKey(keyData: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyData);
  
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate RSA key pair for asymmetric encryption
 */
export async function generateRSAKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  return keyPair as KeyPair;
}

/**
 * Encrypt data with RSA public key
 */
export async function encryptWithRSA(
  data: string,
  publicKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    dataBuffer
  );
  
  return arrayBufferToBase64(encryptedBuffer);
}

/**
 * Decrypt data with RSA private key
 */
export async function decryptWithRSA(
  encryptedData: string,
  privateKey: CryptoKey
): Promise<string> {
  const dataBuffer = base64ToArrayBuffer(encryptedData);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    dataBuffer
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

/**
 * Hash data using SHA-256
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return arrayBufferToBase64(hashBuffer);
}

// Utility functions for base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Secure key storage utilities
 */
export class SecureKeyStorage {
  private static readonly KEY_PREFIX = 'couples_diary_key_';
  
  /**
   * Store encryption key securely in browser storage
   */
  static async storeKey(keyId: string, key: CryptoKey): Promise<void> {
    try {
      const exportedKey = await exportKey(key);
      const storageKey = this.KEY_PREFIX + keyId;
      
      // Store in sessionStorage for better security (cleared on tab close)
      sessionStorage.setItem(storageKey, exportedKey);
    } catch (error) {
      console.error('Failed to store encryption key:', error);
      throw new Error('Failed to store encryption key');
    }
  }
  
  /**
   * Retrieve encryption key from browser storage
   */
  static async retrieveKey(keyId: string): Promise<CryptoKey | null> {
    try {
      const storageKey = this.KEY_PREFIX + keyId;
      const exportedKey = sessionStorage.getItem(storageKey);
      
      if (!exportedKey) {
        return null;
      }
      
      return await importKey(exportedKey);
    } catch (error) {
      console.error('Failed to retrieve encryption key:', error);
      return null;
    }
  }
  
  /**
   * Remove encryption key from storage
   */
  static removeKey(keyId: string): void {
    const storageKey = this.KEY_PREFIX + keyId;
    sessionStorage.removeItem(storageKey);
  }
  
  /**
   * Clear all stored keys
   */
  static clearAllKeys(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}