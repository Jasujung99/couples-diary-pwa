/**
 * Secure key management system for couples diary encryption
 * Handles key derivation, storage, and lifecycle management
 */

import {
  generateEncryptionKey,
  deriveKeyFromPassword,
  exportKey,
  importKey,
  SecureKeyStorage,
  hashData,
  type EncryptedData,
} from './encryption';

export interface KeyDerivationParams {
  userId: string;
  coupleId: string;
  masterPassword?: string;
}

export interface CoupleKeys {
  diaryKey: CryptoKey;
  mediaKey: CryptoKey;
  backupKey: CryptoKey;
}

export interface KeyMetadata {
  keyId: string;
  algorithm: string;
  createdAt: Date;
  lastUsed: Date;
  version: number;
}

/**
 * Key Manager for handling encryption keys in couples diary
 */
export class CoupleKeyManager {
  private static instance: CoupleKeyManager;
  private keys: Map<string, CryptoKey> = new Map();
  private keyMetadata: Map<string, KeyMetadata> = new Map();
  
  private constructor() {}
  
  static getInstance(): CoupleKeyManager {
    if (!CoupleKeyManager.instance) {
      CoupleKeyManager.instance = new CoupleKeyManager();
    }
    return CoupleKeyManager.instance;
  }
  
  /**
   * Initialize keys for a couple
   */
  async initializeCoupleKeys(params: KeyDerivationParams): Promise<CoupleKeys> {
    const { userId, coupleId, masterPassword } = params;
    
    try {
      // Generate or derive keys based on whether master password is provided
      let diaryKey: CryptoKey;
      let mediaKey: CryptoKey;
      let backupKey: CryptoKey;
      
      if (masterPassword) {
        // Derive keys from master password
        const diaryKeyResult = await deriveKeyFromPassword(
          `${masterPassword}_diary_${coupleId}`,
        );
        const mediaKeyResult = await deriveKeyFromPassword(
          `${masterPassword}_media_${coupleId}`,
        );
        const backupKeyResult = await deriveKeyFromPassword(
          `${masterPassword}_backup_${coupleId}`,
        );
        
        diaryKey = diaryKeyResult.key;
        mediaKey = mediaKeyResult.key;
        backupKey = backupKeyResult.key;
      } else {
        // Generate random keys
        diaryKey = await generateEncryptionKey();
        mediaKey = await generateEncryptionKey();
        backupKey = await generateEncryptionKey();
      }
      
      // Store keys with metadata
      const diaryKeyId = `diary_${coupleId}`;
      const mediaKeyId = `media_${coupleId}`;
      const backupKeyId = `backup_${coupleId}`;
      
      await this.storeKey(diaryKeyId, diaryKey);
      await this.storeKey(mediaKeyId, mediaKey);
      await this.storeKey(backupKeyId, backupKey);
      
      return {
        diaryKey,
        mediaKey,
        backupKey,
      };
    } catch (error) {
      console.error('Failed to initialize couple keys:', error);
      throw new Error('Failed to initialize encryption keys');
    }
  }
  
  /**
   * Get diary encryption key for a couple
   */
  async getDiaryKey(coupleId: string): Promise<CryptoKey | null> {
    const keyId = `diary_${coupleId}`;
    return await this.getKey(keyId);
  }
  
  /**
   * Get media encryption key for a couple
   */
  async getMediaKey(coupleId: string): Promise<CryptoKey | null> {
    const keyId = `media_${coupleId}`;
    return await this.getKey(keyId);
  }
  
  /**
   * Get backup encryption key for a couple
   */
  async getBackupKey(coupleId: string): Promise<CryptoKey | null> {
    const keyId = `backup_${coupleId}`;
    return await this.getKey(keyId);
  }
  
  /**
   * Store encryption key with metadata
   */
  private async storeKey(keyId: string, key: CryptoKey): Promise<void> {
    try {
      // Store key in secure storage
      await SecureKeyStorage.storeKey(keyId, key);
      
      // Cache key in memory
      this.keys.set(keyId, key);
      
      // Store metadata
      const metadata: KeyMetadata = {
        keyId,
        algorithm: 'AES-GCM',
        createdAt: new Date(),
        lastUsed: new Date(),
        version: 1,
      };
      
      this.keyMetadata.set(keyId, metadata);
      
      // Persist metadata to localStorage
      localStorage.setItem(`key_meta_${keyId}`, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to store key:', error);
      throw new Error('Failed to store encryption key');
    }
  }
  
  /**
   * Retrieve encryption key
   */
  private async getKey(keyId: string): Promise<CryptoKey | null> {
    try {
      // Check memory cache first
      if (this.keys.has(keyId)) {
        this.updateLastUsed(keyId);
        return this.keys.get(keyId)!;
      }
      
      // Try to retrieve from secure storage
      const key = await SecureKeyStorage.retrieveKey(keyId);
      if (key) {
        // Cache in memory
        this.keys.set(keyId, key);
        this.updateLastUsed(keyId);
        return key;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve key:', error);
      return null;
    }
  }
  
  /**
   * Update last used timestamp for key
   */
  private updateLastUsed(keyId: string): void {
    const metadata = this.keyMetadata.get(keyId);
    if (metadata) {
      metadata.lastUsed = new Date();
      this.keyMetadata.set(keyId, metadata);
      localStorage.setItem(`key_meta_${keyId}`, JSON.stringify(metadata));
    }
  }
  
  /**
   * Rotate encryption keys (generate new keys)
   */
  async rotateKeys(coupleId: string): Promise<CoupleKeys> {
    try {
      // Generate new keys
      const newDiaryKey = await generateEncryptionKey();
      const newMediaKey = await generateEncryptionKey();
      const newBackupKey = await generateEncryptionKey();
      
      // Store new keys with incremented version
      const diaryKeyId = `diary_${coupleId}`;
      const mediaKeyId = `media_${coupleId}`;
      const backupKeyId = `backup_${coupleId}`;
      
      // Update version numbers
      const diaryMeta = this.keyMetadata.get(diaryKeyId);
      const mediaMeta = this.keyMetadata.get(mediaKeyId);
      const backupMeta = this.keyMetadata.get(backupKeyId);
      
      await this.storeKey(diaryKeyId, newDiaryKey);
      await this.storeKey(mediaKeyId, newMediaKey);
      await this.storeKey(backupKeyId, newBackupKey);
      
      // Increment versions
      if (diaryMeta) {
        diaryMeta.version++;
        this.keyMetadata.set(diaryKeyId, diaryMeta);
      }
      if (mediaMeta) {
        mediaMeta.version++;
        this.keyMetadata.set(mediaKeyId, mediaMeta);
      }
      if (backupMeta) {
        backupMeta.version++;
        this.keyMetadata.set(backupKeyId, backupMeta);
      }
      
      return {
        diaryKey: newDiaryKey,
        mediaKey: newMediaKey,
        backupKey: newBackupKey,
      };
    } catch (error) {
      console.error('Failed to rotate keys:', error);
      throw new Error('Failed to rotate encryption keys');
    }
  }
  
  /**
   * Export keys for backup (encrypted with backup password)
   */
  async exportKeysForBackup(coupleId: string, backupPassword: string): Promise<string> {
    try {
      const diaryKey = await this.getDiaryKey(coupleId);
      const mediaKey = await this.getMediaKey(coupleId);
      const backupKey = await this.getBackupKey(coupleId);
      
      if (!diaryKey || !mediaKey || !backupKey) {
        throw new Error('Missing encryption keys');
      }
      
      // Export keys to raw format
      const exportedDiaryKey = await exportKey(diaryKey);
      const exportedMediaKey = await exportKey(mediaKey);
      const exportedBackupKey = await exportKey(backupKey);
      
      // Create backup data
      const backupData = {
        coupleId,
        keys: {
          diary: exportedDiaryKey,
          media: exportedMediaKey,
          backup: exportedBackupKey,
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0',
        },
      };
      
      // Encrypt backup data with backup password
      const { key: backupEncryptionKey } = await deriveKeyFromPassword(backupPassword);
      const { encryptData } = await import('./encryption');
      const encryptedBackup = await encryptData(JSON.stringify(backupData), backupEncryptionKey);
      
      return JSON.stringify(encryptedBackup);
    } catch (error) {
      console.error('Failed to export keys for backup:', error);
      throw new Error('Failed to export keys for backup');
    }
  }
  
  /**
   * Import keys from backup
   */
  async importKeysFromBackup(encryptedBackup: string, backupPassword: string): Promise<void> {
    try {
      const { deriveKeyFromPassword, decryptData } = await import('./encryption');
      
      // Parse encrypted backup
      const encryptedData: EncryptedData = JSON.parse(encryptedBackup);
      
      // Derive decryption key from backup password
      const { key: backupEncryptionKey } = await deriveKeyFromPassword(backupPassword);
      
      // Decrypt backup data
      const decryptedBackup = await decryptData(encryptedData, backupEncryptionKey);
      const backupData = JSON.parse(decryptedBackup);
      
      // Import keys
      const { coupleId, keys } = backupData;
      
      const diaryKey = await importKey(keys.diary);
      const mediaKey = await importKey(keys.media);
      const backupKey = await importKey(keys.backup);
      
      // Store imported keys
      await this.storeKey(`diary_${coupleId}`, diaryKey);
      await this.storeKey(`media_${coupleId}`, mediaKey);
      await this.storeKey(`backup_${coupleId}`, backupKey);
    } catch (error) {
      console.error('Failed to import keys from backup:', error);
      throw new Error('Failed to import keys from backup');
    }
  }
  
  /**
   * Clear all keys (for breakup mode or logout)
   */
  async clearAllKeys(): Promise<void> {
    try {
      // Clear memory cache
      this.keys.clear();
      this.keyMetadata.clear();
      
      // Clear secure storage
      SecureKeyStorage.clearAllKeys();
      
      // Clear metadata from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('key_meta_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear keys:', error);
      throw new Error('Failed to clear encryption keys');
    }
  }
  
  /**
   * Get key metadata
   */
  getKeyMetadata(keyId: string): KeyMetadata | null {
    return this.keyMetadata.get(keyId) || null;
  }
  
  /**
   * Check if keys are initialized for a couple
   */
  async hasKeysForCouple(coupleId: string): Promise<boolean> {
    const diaryKey = await this.getDiaryKey(coupleId);
    const mediaKey = await this.getMediaKey(coupleId);
    const backupKey = await this.getBackupKey(coupleId);
    
    return !!(diaryKey && mediaKey && backupKey);
  }
}