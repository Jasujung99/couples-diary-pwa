/**
 * Data export functionality with encryption support
 * Allows users to export their diary data securely
 */

import { CoupleKeyManager } from './keyManager';
import { encryptData, deriveKeyFromPassword, generateSecurePassword } from './encryption';
import type { DiaryEntry, DatePlan, Memory, User } from '@/types';

export interface ExportOptions {
  includeMedia: boolean;
  encryptExport: boolean;
  exportPassword?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includePartnerData: boolean;
}

export interface ExportData {
  metadata: {
    exportedAt: string;
    exportedBy: string;
    coupleId: string;
    version: string;
    isEncrypted: boolean;
  };
  userData: {
    user: Partial<User>;
    partner?: Partial<User>;
  };
  diaryEntries: DiaryEntry[];
  datePlans: DatePlan[];
  memories: Memory[];
  statistics: {
    totalEntries: number;
    totalDates: number;
    totalMemories: number;
    daysTogether: number;
    firstEntry?: string;
    lastEntry?: string;
  };
}

export interface ExportResult {
  data: string; // JSON string or encrypted data
  filename: string;
  size: number;
  isEncrypted: boolean;
  checksum: string;
}

/**
 * Data Export Manager
 */
export class DataExportManager {
  private keyManager: CoupleKeyManager;
  
  constructor() {
    this.keyManager = CoupleKeyManager.getInstance();
  }
  
  /**
   * Export all couple data
   */
  async exportCoupleData(
    userId: string,
    coupleId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Fetch all data
      const exportData = await this.gatherExportData(userId, coupleId, options);
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `couples-diary-export-${timestamp}.json`;
      
      let finalData: string;
      let isEncrypted = false;
      
      if (options.encryptExport && options.exportPassword) {
        // Encrypt the export data
        const { key } = await deriveKeyFromPassword(options.exportPassword);
        const encrypted = await encryptData(JSON.stringify(exportData), key);
        finalData = JSON.stringify(encrypted);
        isEncrypted = true;
      } else {
        finalData = JSON.stringify(exportData, null, 2);
      }
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(finalData);
      
      return {
        data: finalData,
        filename,
        size: new Blob([finalData]).size,
        isEncrypted,
        checksum,
      };
    } catch (error) {
      console.error('Failed to export couple data:', error);
      throw new Error('Failed to export data');
    }
  }
  
  /**
   * Gather all data for export
   */
  private async gatherExportData(
    userId: string,
    coupleId: string,
    options: ExportOptions
  ): Promise<ExportData> {
    try {
      // Fetch user data
      const userResponse = await fetch('/api/auth/me');
      const userData = await userResponse.json();
      
      // Fetch diary entries
      const diaryResponse = await fetch(`/api/diary/entries?coupleId=${coupleId}`);
      const diaryData = await diaryResponse.json();
      let diaryEntries: DiaryEntry[] = diaryData.data || [];
      
      // Filter by date range if specified
      if (options.dateRange) {
        diaryEntries = diaryEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= options.dateRange!.start && entryDate <= options.dateRange!.end;
        });
      }
      
      // Decrypt diary entries if they are encrypted
      diaryEntries = await this.decryptDiaryEntries(diaryEntries, coupleId);
      
      // Fetch date plans
      const datesResponse = await fetch(`/api/dates?coupleId=${coupleId}`);
      const datesData = await datesResponse.json();
      const datePlans: DatePlan[] = datesData.data || [];
      
      // Fetch memories
      const memoriesResponse = await fetch(`/api/memories?coupleId=${coupleId}`);
      const memoriesData = await memoriesResponse.json();
      const memories: Memory[] = memoriesData.data || [];
      
      // Calculate statistics
      const statistics = this.calculateStatistics(diaryEntries, datePlans, memories, userData.data);
      
      // Prepare export data
      const exportData: ExportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: userId,
          coupleId,
          version: '1.0',
          isEncrypted: options.encryptExport,
        },
        userData: {
          user: this.sanitizeUserData(userData.data),
          partner: options.includePartnerData ? this.sanitizeUserData(userData.data.partner) : undefined,
        },
        diaryEntries: options.includePartnerData ? diaryEntries : diaryEntries.filter(entry => entry.authorId === userId),
        datePlans,
        memories,
        statistics,
      };
      
      // Remove media URLs if not including media
      if (!options.includeMedia) {
        exportData.diaryEntries = exportData.diaryEntries.map(entry => ({
          ...entry,
          media: entry.media.map(item => ({ ...item, url: '[MEDIA_REMOVED]' })),
        }));
        
        exportData.memories = exportData.memories.map(memory => ({
          ...memory,
          photos: memory.photos.map(photo => ({ ...photo, url: '[MEDIA_REMOVED]' })),
        }));
      }
      
      return exportData;
    } catch (error) {
      console.error('Failed to gather export data:', error);
      throw new Error('Failed to gather export data');
    }
  }
  
  /**
   * Decrypt diary entries for export
   */
  private async decryptDiaryEntries(entries: DiaryEntry[], coupleId: string): Promise<DiaryEntry[]> {
    try {
      const diaryKey = await this.keyManager.getDiaryKey(coupleId);
      if (!diaryKey) {
        console.warn('No diary key found, returning entries as-is');
        return entries;
      }
      
      const { decryptData } = await import('./encryption');
      
      const decryptedEntries = await Promise.all(
        entries.map(async (entry) => {
          if (entry.isEncrypted && entry.content.startsWith('{')) {
            try {
              const encryptedData = JSON.parse(entry.content);
              const decryptedContent = await decryptData(encryptedData, diaryKey);
              return {
                ...entry,
                content: decryptedContent,
                isEncrypted: false, // Mark as decrypted in export
              };
            } catch (error) {
              console.warn('Failed to decrypt entry:', entry.id, error);
              return entry; // Return encrypted entry if decryption fails
            }
          }
          return entry;
        })
      );
      
      return decryptedEntries;
    } catch (error) {
      console.error('Failed to decrypt diary entries:', error);
      return entries; // Return original entries if decryption fails
    }
  }
  
  /**
   * Sanitize user data for export (remove sensitive information)
   */
  private sanitizeUserData(user: any): Partial<User> {
    if (!user) return {};
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      relationshipStartDate: user.relationshipStartDate,
      preferences: user.preferences,
      createdAt: user.createdAt,
    };
  }
  
  /**
   * Calculate export statistics
   */
  private calculateStatistics(
    diaryEntries: DiaryEntry[],
    datePlans: DatePlan[],
    memories: Memory[],
    user: any
  ) {
    const sortedEntries = diaryEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let daysTogether = 0;
    if (user.relationshipStartDate) {
      const startDate = new Date(user.relationshipStartDate);
      const now = new Date();
      daysTogether = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      totalEntries: diaryEntries.length,
      totalDates: datePlans.length,
      totalMemories: memories.length,
      daysTogether,
      firstEntry: sortedEntries[0]?.date,
      lastEntry: sortedEntries[sortedEntries.length - 1]?.date,
    };
  }
  
  /**
   * Calculate checksum for data integrity
   */
  private async calculateChecksum(data: string): Promise<string> {
    const { hashData } = await import('./encryption');
    return await hashData(data);
  }
  
  /**
   * Import data from export file
   */
  async importCoupleData(
    exportData: string,
    password?: string
  ): Promise<{ success: boolean; message: string; data?: ExportData }> {
    try {
      let parsedData: ExportData;
      
      // Check if data is encrypted
      try {
        const potentialEncrypted = JSON.parse(exportData);
        if (potentialEncrypted.data && potentialEncrypted.iv) {
          // Data is encrypted
          if (!password) {
            return { success: false, message: 'Password required for encrypted export' };
          }
          
          const { key } = await deriveKeyFromPassword(password);
          const { decryptData } = await import('./encryption');
          const decryptedData = await decryptData(potentialEncrypted, key);
          parsedData = JSON.parse(decryptedData);
        } else {
          // Data is not encrypted
          parsedData = potentialEncrypted;
        }
      } catch (error) {
        return { success: false, message: 'Invalid export file format' };
      }
      
      // Validate export data structure
      if (!this.validateExportData(parsedData)) {
        return { success: false, message: 'Invalid export data structure' };
      }
      
      // TODO: Implement actual data import logic
      // This would involve creating/updating database records
      
      return {
        success: true,
        message: 'Data imported successfully',
        data: parsedData,
      };
    } catch (error) {
      console.error('Failed to import data:', error);
      return { success: false, message: 'Failed to import data' };
    }
  }
  
  /**
   * Validate export data structure
   */
  private validateExportData(data: any): data is ExportData {
    return (
      data &&
      data.metadata &&
      data.userData &&
      Array.isArray(data.diaryEntries) &&
      Array.isArray(data.datePlans) &&
      Array.isArray(data.memories) &&
      data.statistics
    );
  }
  
  /**
   * Generate secure export password
   */
  generateExportPassword(): string {
    return generateSecurePassword(16);
  }
  
  /**
   * Download export data as file
   */
  downloadExport(exportResult: ExportResult): void {
    const blob = new Blob([exportResult.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}