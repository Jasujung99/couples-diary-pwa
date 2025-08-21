/**
 * Secure diary service with client-side encryption
 * Integrates encryption with diary entry operations
 */

import { CoupleKeyManager } from './keyManager';
import { encryptData, decryptData } from './encryption';
import type { DiaryEntry, MediaItem } from '@/types';

export interface SecureDiaryEntry extends Omit<DiaryEntry, 'content'> {
  content: string; // Will be encrypted/decrypted automatically
  encryptedContent?: string; // Raw encrypted content for storage
}

export interface DiaryEncryptionStatus {
  isEncrypted: boolean;
  keyAvailable: boolean;
  lastEncrypted?: Date;
  encryptionVersion: number;
}

/**
 * Secure Diary Service
 */
export class SecureDiaryService {
  private keyManager: CoupleKeyManager;
  
  constructor() {
    this.keyManager = CoupleKeyManager.getInstance();
  }
  
  /**
   * Create encrypted diary entry
   */
  async createSecureEntry(
    coupleId: string,
    authorId: string,
    content: string,
    mood: string,
    media: MediaItem[] = []
  ): Promise<{ success: boolean; entry?: DiaryEntry; error?: string }> {
    try {
      // Get encryption key
      const diaryKey = await this.keyManager.getDiaryKey(coupleId);
      if (!diaryKey) {
        return { success: false, error: 'Encryption key not available' };
      }
      
      // Encrypt content
      const encryptedContent = await encryptData(content, diaryKey);
      
      // Encrypt media metadata if present
      const encryptedMedia = await this.encryptMediaMetadata(media, coupleId);
      
      // Create entry with encrypted content
      const entryData = {
        authorId,
        coupleId,
        mood,
        content: JSON.stringify(encryptedContent),
        media: encryptedMedia,
        date: new Date(),
        status: 'waiting' as const,
        isEncrypted: true,
      };
      
      // Save to database
      const response = await fetch('/api/diary/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save diary entry');
      }
      
      const result = await response.json();
      
      // Return decrypted entry for immediate use
      const decryptedEntry = await this.decryptEntry(result.data, coupleId);
      
      return { success: true, entry: decryptedEntry };
    } catch (error) {
      console.error('Failed to create secure diary entry:', error);
      return { success: false, error: 'Failed to create diary entry' };
    }
  }
  
  /**
   * Get and decrypt diary entries
   */
  async getSecureEntries(coupleId: string, limit?: number): Promise<DiaryEntry[]> {
    try {
      const url = `/api/diary/entries?coupleId=${coupleId}${limit ? `&limit=${limit}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch diary entries');
      }
      
      const result = await response.json();
      const entries: DiaryEntry[] = result.data || [];
      
      // Decrypt entries
      const decryptedEntries = await Promise.all(
        entries.map(entry => this.decryptEntry(entry, coupleId))
      );
      
      return decryptedEntries;
    } catch (error) {
      console.error('Failed to get secure diary entries:', error);
      return [];
    }
  }
  
  /**
   * Update encrypted diary entry
   */
  async updateSecureEntry(
    entryId: string,
    coupleId: string,
    updates: Partial<Pick<DiaryEntry, 'content' | 'mood' | 'media'>>
  ): Promise<{ success: boolean; entry?: DiaryEntry; error?: string }> {
    try {
      const diaryKey = await this.keyManager.getDiaryKey(coupleId);
      if (!diaryKey) {
        return { success: false, error: 'Encryption key not available' };
      }
      
      const updateData: any = {};
      
      // Encrypt content if provided
      if (updates.content) {
        const encryptedContent = await encryptData(updates.content, diaryKey);
        updateData.content = JSON.stringify(encryptedContent);
        updateData.isEncrypted = true;
      }
      
      // Encrypt media metadata if provided
      if (updates.media) {
        updateData.media = await this.encryptMediaMetadata(updates.media, coupleId);
      }
      
      // Include other updates
      if (updates.mood) {
        updateData.mood = updates.mood;
      }
      
      // Update in database
      const response = await fetch(`/api/diary/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update diary entry');
      }
      
      const result = await response.json();
      const decryptedEntry = await this.decryptEntry(result.data, coupleId);
      
      return { success: true, entry: decryptedEntry };
    } catch (error) {
      console.error('Failed to update secure diary entry:', error);
      return { success: false, error: 'Failed to update diary entry' };
    }
  }
  
  /**
   * Decrypt a single diary entry
   */
  async decryptEntry(entry: DiaryEntry, coupleId: string): Promise<DiaryEntry> {
    try {
      if (!entry.isEncrypted) {
        return entry; // Return as-is if not encrypted
      }
      
      const diaryKey = await this.keyManager.getDiaryKey(coupleId);
      if (!diaryKey) {
        console.warn('No diary key available for decryption');
        return entry; // Return encrypted entry if no key
      }
      
      // Decrypt content
      let decryptedContent = entry.content;
      if (entry.content.startsWith('{')) {
        try {
          const encryptedData = JSON.parse(entry.content);
          decryptedContent = await decryptData(encryptedData, diaryKey);
        } catch (error) {
          console.warn('Failed to decrypt entry content:', error);
        }
      }
      
      // Decrypt media metadata
      const decryptedMedia = await this.decryptMediaMetadata(entry.media, coupleId);
      
      return {
        ...entry,
        content: decryptedContent,
        media: decryptedMedia,
      };
    } catch (error) {
      console.error('Failed to decrypt diary entry:', error);
      return entry; // Return original entry if decryption fails
    }
  }
  
  /**
   * Encrypt media metadata
   */
  private async encryptMediaMetadata(media: MediaItem[], coupleId: string): Promise<MediaItem[]> {
    try {
      const mediaKey = await this.keyManager.getMediaKey(coupleId);
      if (!mediaKey) {
        return media; // Return as-is if no media key
      }
      
      return await Promise.all(
        media.map(async (item) => {
          try {
            // Encrypt sensitive metadata (filename, potentially URL)
            const sensitiveData = {
              filename: item.filename,
              originalUrl: item.url,
            };
            
            const encryptedMetadata = await encryptData(JSON.stringify(sensitiveData), mediaKey);
            
            return {
              ...item,
              filename: `encrypted_${item.id}`,
              url: item.url, // Keep URL for access, encrypt filename for privacy
              encryptedMetadata: JSON.stringify(encryptedMetadata),
            };
          } catch (error) {
            console.warn('Failed to encrypt media metadata:', error);
            return item;
          }
        })
      );
    } catch (error) {
      console.error('Failed to encrypt media metadata:', error);
      return media;
    }
  }
  
  /**
   * Decrypt media metadata
   */
  private async decryptMediaMetadata(media: MediaItem[], coupleId: string): Promise<MediaItem[]> {
    try {
      const mediaKey = await this.keyManager.getMediaKey(coupleId);
      if (!mediaKey) {
        return media; // Return as-is if no media key
      }
      
      return await Promise.all(
        media.map(async (item) => {
          try {
            if ((item as any).encryptedMetadata) {
              const encryptedData = JSON.parse((item as any).encryptedMetadata);
              const decryptedMetadata = await decryptData(encryptedData, mediaKey);
              const metadata = JSON.parse(decryptedMetadata);
              
              return {
                ...item,
                filename: metadata.filename,
                url: metadata.originalUrl || item.url,
              };
            }
            return item;
          } catch (error) {
            console.warn('Failed to decrypt media metadata:', error);
            return item;
          }
        })
      );
    } catch (error) {
      console.error('Failed to decrypt media metadata:', error);
      return media;
    }
  }
  
  /**
   * Get encryption status for a couple's diary
   */
  async getEncryptionStatus(coupleId: string): Promise<DiaryEncryptionStatus> {
    try {
      const diaryKey = await this.keyManager.getDiaryKey(coupleId);
      const keyMetadata = this.keyManager.getKeyMetadata(`diary_${coupleId}`);
      
      return {
        isEncrypted: !!diaryKey,
        keyAvailable: !!diaryKey,
        lastEncrypted: keyMetadata?.lastUsed,
        encryptionVersion: keyMetadata?.version || 1,
      };
    } catch (error) {
      console.error('Failed to get encryption status:', error);
      return {
        isEncrypted: false,
        keyAvailable: false,
        encryptionVersion: 1,
      };
    }
  }
  
  /**
   * Re-encrypt all diary entries with new key (for key rotation)
   */
  async reencryptAllEntries(coupleId: string): Promise<{ success: boolean; processed: number; errors: number }> {
    try {
      // Get all entries
      const entries = await this.getSecureEntries(coupleId);
      
      let processed = 0;
      let errors = 0;
      
      // Re-encrypt each entry
      for (const entry of entries) {
        try {
          if (entry.content) {
            await this.updateSecureEntry(entry.id, coupleId, {
              content: entry.content, // This will re-encrypt with current key
            });
            processed++;
          }
        } catch (error) {
          console.error('Failed to re-encrypt entry:', entry.id, error);
          errors++;
        }
      }
      
      return { success: true, processed, errors };
    } catch (error) {
      console.error('Failed to re-encrypt diary entries:', error);
      return { success: false, processed: 0, errors: 0 };
    }
  }
  
  /**
   * Validate entry integrity
   */
  async validateEntryIntegrity(entry: DiaryEntry, coupleId: string): Promise<boolean> {
    try {
      if (!entry.isEncrypted) {
        return true; // Non-encrypted entries are considered valid
      }
      
      // Try to decrypt and re-encrypt to validate
      const decrypted = await this.decryptEntry(entry, coupleId);
      if (decrypted.content === entry.content && entry.isEncrypted) {
        return false; // Decryption failed
      }
      
      return true;
    } catch (error) {
      console.error('Failed to validate entry integrity:', error);
      return false;
    }
  }
  
  /**
   * Search encrypted diary entries
   */
  async searchSecureEntries(
    coupleId: string,
    query: string,
    options: { authorId?: string; dateRange?: { start: Date; end: Date } } = {}
  ): Promise<DiaryEntry[]> {
    try {
      // Get all entries and decrypt them
      const entries = await this.getSecureEntries(coupleId);
      
      // Filter and search
      return entries.filter(entry => {
        // Filter by author if specified
        if (options.authorId && entry.authorId !== options.authorId) {
          return false;
        }
        
        // Filter by date range if specified
        if (options.dateRange) {
          const entryDate = new Date(entry.date);
          if (entryDate < options.dateRange.start || entryDate > options.dateRange.end) {
            return false;
          }
        }
        
        // Search in content
        return entry.content.toLowerCase().includes(query.toLowerCase());
      });
    } catch (error) {
      console.error('Failed to search secure entries:', error);
      return [];
    }
  }
}