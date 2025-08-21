/**
 * Breakup mode functionality with data archival and access restriction
 * Handles relationship termination scenarios while preserving data integrity
 */

import { CoupleKeyManager } from './keyManager';
import { DataExportManager } from './dataExport';
import { encryptData, deriveKeyFromPassword, generateSecurePassword } from './encryption';
import type { User, DiaryEntry, DatePlan, Memory } from '@/types';

export interface BreakupModeOptions {
  archiveData: boolean;
  deleteSharedData: boolean;
  exportBeforeBreakup: boolean;
  exportPassword?: string;
  reason?: string;
  allowDataRecovery: boolean;
  recoveryPeriodDays: number;
}

export interface BreakupArchive {
  id: string;
  userId: string;
  coupleId: string;
  archivedAt: Date;
  reason?: string;
  recoveryExpiresAt: Date;
  isRecoverable: boolean;
  archiveData: {
    encryptedData: string;
    checksum: string;
    keyHint: string;
  };
}

export interface BreakupModeStatus {
  isActive: boolean;
  activatedAt?: Date;
  activatedBy?: string;
  reason?: string;
  canRecover: boolean;
  recoveryExpiresAt?: Date;
  archiveId?: string;
}

/**
 * Breakup Mode Manager
 */
export class BreakupModeManager {
  private keyManager: CoupleKeyManager;
  private exportManager: DataExportManager;
  
  constructor() {
    this.keyManager = CoupleKeyManager.getInstance();
    this.exportManager = new DataExportManager();
  }
  
  /**
   * Activate breakup mode for a couple
   */
  async activateBreakupMode(
    userId: string,
    coupleId: string,
    options: BreakupModeOptions
  ): Promise<{ success: boolean; message: string; archiveId?: string; exportData?: string }> {
    try {
      let exportData: string | undefined;
      let archiveId: string | undefined;
      
      // Export data before breakup if requested
      if (options.exportBeforeBreakup) {
        const exportResult = await this.exportManager.exportCoupleData(userId, coupleId, {
          includeMedia: true,
          encryptExport: true,
          exportPassword: options.exportPassword || generateSecurePassword(),
          includePartnerData: true,
        });
        exportData = exportResult.data;
      }
      
      // Archive data if requested
      if (options.archiveData) {
        archiveId = await this.archiveCoupleData(userId, coupleId, options);
      }
      
      // Update couple status in database
      await this.updateCoupleBreakupStatus(coupleId, userId, options);
      
      // Restrict access to shared data
      await this.restrictDataAccess(coupleId, options);
      
      // Clear encryption keys if not allowing recovery
      if (!options.allowDataRecovery) {
        await this.keyManager.clearAllKeys();
      }
      
      // Send notification to partner
      await this.notifyPartnerOfBreakup(coupleId, userId, options);
      
      return {
        success: true,
        message: 'Breakup mode activated successfully',
        archiveId,
        exportData,
      };
    } catch (error) {
      console.error('Failed to activate breakup mode:', error);
      return {
        success: false,
        message: 'Failed to activate breakup mode',
      };
    }
  }
  
  /**
   * Archive couple data securely
   */
  private async archiveCoupleData(
    userId: string,
    coupleId: string,
    options: BreakupModeOptions
  ): Promise<string> {
    try {
      // Generate archive ID
      const archiveId = `archive_${coupleId}_${Date.now()}`;
      
      // Export all data
      const exportResult = await this.exportManager.exportCoupleData(userId, coupleId, {
        includeMedia: true,
        encryptExport: false, // We'll encrypt it ourselves
        includePartnerData: true,
      });
      
      // Generate archive password
      const archivePassword = generateSecurePassword(32);
      
      // Encrypt the exported data
      const { key } = await deriveKeyFromPassword(archivePassword);
      const encryptedArchive = await encryptData(exportResult.data, key);
      
      // Create archive record
      const archive: BreakupArchive = {
        id: archiveId,
        userId,
        coupleId,
        archivedAt: new Date(),
        reason: options.reason,
        recoveryExpiresAt: new Date(Date.now() + options.recoveryPeriodDays * 24 * 60 * 60 * 1000),
        isRecoverable: options.allowDataRecovery,
        archiveData: {
          encryptedData: JSON.stringify(encryptedArchive),
          checksum: exportResult.checksum,
          keyHint: this.generateKeyHint(archivePassword),
        },
      };
      
      // Store archive in database
      await this.storeArchive(archive);
      
      // Store archive password securely (for recovery)
      if (options.allowDataRecovery) {
        await this.storeArchivePassword(archiveId, archivePassword);
      }
      
      return archiveId;
    } catch (error) {
      console.error('Failed to archive couple data:', error);
      throw new Error('Failed to archive couple data');
    }
  }
  
  /**
   * Update couple breakup status in database
   */
  private async updateCoupleBreakupStatus(
    coupleId: string,
    userId: string,
    options: BreakupModeOptions
  ): Promise<void> {
    try {
      const response = await fetch('/api/couples/breakup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupleId,
          userId,
          reason: options.reason,
          allowDataRecovery: options.allowDataRecovery,
          recoveryPeriodDays: options.recoveryPeriodDays,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update breakup status');
      }
    } catch (error) {
      console.error('Failed to update couple breakup status:', error);
      throw error;
    }
  }
  
  /**
   * Restrict access to shared data
   */
  private async restrictDataAccess(coupleId: string, options: BreakupModeOptions): Promise<void> {
    try {
      if (options.deleteSharedData) {
        // Mark shared data for deletion
        await fetch('/api/couples/delete-shared-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ coupleId }),
        });
      } else {
        // Just restrict access
        await fetch('/api/couples/restrict-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ coupleId }),
        });
      }
    } catch (error) {
      console.error('Failed to restrict data access:', error);
      throw error;
    }
  }
  
  /**
   * Notify partner of breakup
   */
  private async notifyPartnerOfBreakup(
    coupleId: string,
    userId: string,
    options: BreakupModeOptions
  ): Promise<void> {
    try {
      await fetch('/api/notifications/breakup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupleId,
          initiatedBy: userId,
          reason: options.reason,
          allowDataRecovery: options.allowDataRecovery,
        }),
      });
    } catch (error) {
      console.error('Failed to notify partner of breakup:', error);
      // Don't throw error as this is not critical
    }
  }
  
  /**
   * Store archive in database
   */
  private async storeArchive(archive: BreakupArchive): Promise<void> {
    try {
      const response = await fetch('/api/archives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(archive),
      });
      
      if (!response.ok) {
        throw new Error('Failed to store archive');
      }
    } catch (error) {
      console.error('Failed to store archive:', error);
      throw error;
    }
  }
  
  /**
   * Store archive password securely
   */
  private async storeArchivePassword(archiveId: string, password: string): Promise<void> {
    try {
      // Store in secure session storage temporarily
      sessionStorage.setItem(`archive_password_${archiveId}`, password);
      
      // Also store encrypted version in database for recovery
      const { key } = await deriveKeyFromPassword(`recovery_${archiveId}`);
      const encryptedPassword = await encryptData(password, key);
      
      await fetch('/api/archives/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          archiveId,
          encryptedPassword: JSON.stringify(encryptedPassword),
        }),
      });
    } catch (error) {
      console.error('Failed to store archive password:', error);
      throw error;
    }
  }
  
  /**
   * Generate key hint for password recovery
   */
  private generateKeyHint(password: string): string {
    // Generate a hint based on password characteristics
    const length = password.length;
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    
    return `${length} chars, ${hasNumbers ? 'numbers' : 'no numbers'}, ${hasSpecialChars ? 'special chars' : 'no special chars'}, ${hasUpperCase ? 'uppercase' : 'no uppercase'}`;
  }
  
  /**
   * Check breakup mode status
   */
  async getBreakupModeStatus(coupleId: string): Promise<BreakupModeStatus> {
    try {
      const response = await fetch(`/api/couples/${coupleId}/breakup-status`);
      if (!response.ok) {
        return { isActive: false, canRecover: false };
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get breakup mode status:', error);
      return { isActive: false, canRecover: false };
    }
  }
  
  /**
   * Recover from breakup mode
   */
  async recoverFromBreakup(
    archiveId: string,
    recoveryPassword?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get archive
      const archive = await this.getArchive(archiveId);
      if (!archive) {
        return { success: false, message: 'Archive not found' };
      }
      
      // Check if recovery is still possible
      if (!archive.isRecoverable || new Date() > archive.recoveryExpiresAt) {
        return { success: false, message: 'Recovery period has expired' };
      }
      
      // Get archive password
      let archivePassword = recoveryPassword;
      if (!archivePassword) {
        archivePassword = sessionStorage.getItem(`archive_password_${archiveId}`);
        if (!archivePassword) {
          return { success: false, message: 'Recovery password required' };
        }
      }
      
      // Decrypt and restore data
      const { key } = await deriveKeyFromPassword(archivePassword);
      const { decryptData } = await import('./encryption');
      
      const encryptedArchive = JSON.parse(archive.archiveData.encryptedData);
      const decryptedData = await decryptData(encryptedArchive, key);
      
      // Import the data back
      const importResult = await this.exportManager.importCoupleData(decryptedData);
      if (!importResult.success) {
        return { success: false, message: importResult.message };
      }
      
      // Reactivate couple status
      await this.reactivateCouple(archive.coupleId);
      
      // Clean up archive
      await this.deleteArchive(archiveId);
      
      return { success: true, message: 'Successfully recovered from breakup' };
    } catch (error) {
      console.error('Failed to recover from breakup:', error);
      return { success: false, message: 'Failed to recover from breakup' };
    }
  }
  
  /**
   * Get archive by ID
   */
  private async getArchive(archiveId: string): Promise<BreakupArchive | null> {
    try {
      const response = await fetch(`/api/archives/${archiveId}`);
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get archive:', error);
      return null;
    }
  }
  
  /**
   * Reactivate couple after recovery
   */
  private async reactivateCouple(coupleId: string): Promise<void> {
    try {
      await fetch('/api/couples/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coupleId }),
      });
    } catch (error) {
      console.error('Failed to reactivate couple:', error);
      throw error;
    }
  }
  
  /**
   * Delete archive
   */
  private async deleteArchive(archiveId: string): Promise<void> {
    try {
      await fetch(`/api/archives/${archiveId}`, {
        method: 'DELETE',
      });
      
      // Clean up session storage
      sessionStorage.removeItem(`archive_password_${archiveId}`);
    } catch (error) {
      console.error('Failed to delete archive:', error);
      // Don't throw error as this is cleanup
    }
  }
  
  /**
   * Permanently delete all data (no recovery)
   */
  async permanentlyDeleteData(coupleId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Clear all encryption keys
      await this.keyManager.clearAllKeys();
      
      // Delete all couple data
      await fetch('/api/couples/permanent-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coupleId, userId }),
      });
      
      return { success: true, message: 'All data permanently deleted' };
    } catch (error) {
      console.error('Failed to permanently delete data:', error);
      return { success: false, message: 'Failed to delete data' };
    }
  }
}