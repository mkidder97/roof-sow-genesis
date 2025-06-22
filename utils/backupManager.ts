/**
 * Backup and Error Quarantine System
 * Handles automatic backups of critical modules and quarantines failed fixes
 */

import { readFile, writeFile, copyFile, mkdir, stat } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { createHash } from 'crypto';
import supabaseClient from '../utils/supabaseClient.js';

export interface BackupOptions {
  reason: 'fix_application' | 'manual_backup' | 'scheduled' | 'pre_modification';
  relatedFixId?: string;
  preserveHistory?: boolean;
  maxBackups?: number;
}

export interface QuarantineOptions {
  reason: string;
  errorDetails?: Record<string, any>;
  stackTrace?: string;
  fixId?: string;
}

export interface BackupInfo {
  originalPath: string;
  backupPath: string;
  timestamp: string;
  fileHash: string;
  reason: string;
  fileSize: number;
}

export class BackupManager {
  private backupDir: string;
  private quarantineDir: string;

  constructor(
    backupDir: string = './backups',
    quarantineDir: string = './error-quarantine'
  ) {
    this.backupDir = backupDir;
    this.quarantineDir = quarantineDir;
  }

  /**
   * Initialize backup and quarantine directories
   */
  async initialize(): Promise<void> {
    await mkdir(this.backupDir, { recursive: true });
    await mkdir(this.quarantineDir, { recursive: true });
    await mkdir(join(this.quarantineDir, 'fixes'), { recursive: true });
    await mkdir(join(this.quarantineDir, 'modules'), { recursive: true });
    await mkdir(join(this.quarantineDir, 'logs'), { recursive: true });
  }

  /**
   * Create a backup of a file before modification
   */
  async createBackup(
    filePath: string,
    options: BackupOptions = { reason: 'manual_backup' }
  ): Promise<BackupInfo> {
    await this.initialize();

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = extname(filePath);
    const name = basename(filePath, ext);
    const backupFileName = `${name}_${timestamp}${ext}`;
    const backupPath = join(this.backupDir, backupFileName);

    // Read original file and calculate hash
    const originalContent = await readFile(filePath);
    const fileHash = createHash('sha256').update(originalContent).digest('hex');
    const stats = await stat(filePath);

    // Create backup
    await copyFile(filePath, backupPath);

    const backupInfo: BackupInfo = {
      originalPath: filePath,
      backupPath,
      timestamp,
      fileHash,
      reason: options.reason,
      fileSize: stats.size,
    };

    // Log to Supabase
    await supabaseClient.logBackup({
      moduleName: basename(filePath),
      backupPath,
      originalFileSize: stats.size,
      backupReason: options.reason,
      relatedFixId: options.relatedFixId,
      fileHash,
    });

    // Clean up old backups if specified
    if (options.maxBackups && options.maxBackups > 0) {
      await this.cleanupOldBackups(basename(filePath), options.maxBackups);
    }

    return backupInfo;
  }

  /**
   * Create a backup of multiple files (batch operation)
   */
  async createBatchBackup(
    filePaths: string[],
    options: BackupOptions = { reason: 'manual_backup' }
  ): Promise<BackupInfo[]> {
    const backups: BackupInfo[] = [];

    for (const filePath of filePaths) {
      try {
        const backup = await this.createBackup(filePath, options);
        backups.push(backup);
      } catch (error) {
        console.error(`Failed to backup ${filePath}:`, error);
        // Continue with other files
      }
    }

    return backups;
  }

  /**
   * Restore a file from backup
   */
  async restoreFromBackup(backupPath: string, originalPath?: string): Promise<void> {
    const targetPath = originalPath || this.getOriginalPathFromBackup(backupPath);
    
    if (!targetPath) {
      throw new Error('Cannot determine original path for restoration');
    }

    // Ensure target directory exists
    await mkdir(dirname(targetPath), { recursive: true });

    // Copy backup to original location
    await copyFile(backupPath, targetPath);

    console.log(`Restored ${targetPath} from backup ${backupPath}`);
  }

  /**
   * Get the original file path from a backup path
   */
  private getOriginalPathFromBackup(backupPath: string): string | null {
    const fileName = basename(backupPath);
    const match = fileName.match(/^(.+)_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z(\..+)?$/);
    
    if (match) {
      const originalName = match[1];
      const extension = match[2] || '';
      return join('src', `${originalName}${extension}`);
    }
    
    return null;
  }

  /**
   * Clean up old backups, keeping only the most recent ones
   */
  private async cleanupOldBackups(moduleName: string, maxBackups: number): Promise<void> {
    try {
      const { readdir } = await import('fs/promises');
      const files = await readdir(this.backupDir);
      
      // Filter files for this module
      const moduleBackups = files
        .filter(file => file.startsWith(moduleName.replace(extname(moduleName), '')))
        .map(file => ({
          name: file,
          path: join(this.backupDir, file),
          timestamp: this.extractTimestampFromFilename(file),
        }))
        .filter(backup => backup.timestamp)
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());

      // Remove excess backups
      if (moduleBackups.length > maxBackups) {
        const backupsToRemove = moduleBackups.slice(maxBackups);
        
        for (const backup of backupsToRemove) {
          const { unlink } = await import('fs/promises');
          await unlink(backup.path);
          console.log(`Removed old backup: ${backup.name}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  /**
   * Extract timestamp from backup filename
   */
  private extractTimestampFromFilename(filename: string): string | null {
    const match = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
    return match ? match[1].replace(/-/g, ':').replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3') : null;
  }

  /**
   * List all backups for a specific module
   */
  async listBackups(moduleName?: string): Promise<BackupInfo[]> {
    try {
      const { readdir } = await import('fs/promises');
      const files = await readdir(this.backupDir);
      
      let backupFiles = files;
      if (moduleName) {
        const nameWithoutExt = moduleName.replace(extname(moduleName), '');
        backupFiles = files.filter(file => file.startsWith(nameWithoutExt));
      }

      const backups: BackupInfo[] = [];
      
      for (const file of backupFiles) {
        const filePath = join(this.backupDir, file);
        const stats = await stat(filePath);
        const content = await readFile(filePath);
        const fileHash = createHash('sha256').update(content).digest('hex');
        const timestamp = this.extractTimestampFromFilename(file);
        
        if (timestamp) {
          backups.push({
            originalPath: this.getOriginalPathFromBackup(filePath) || 'unknown',
            backupPath: filePath,
            timestamp,
            fileHash,
            reason: 'unknown',
            fileSize: stats.size,
          });
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }
}

export class QuarantineManager {
  private quarantineDir: string;

  constructor(quarantineDir: string = './error-quarantine') {
    this.quarantineDir = quarantineDir;
  }

  /**
   * Initialize quarantine directory structure
   */
  async initialize(): Promise<void> {
    await mkdir(this.quarantineDir, { recursive: true });
    await mkdir(join(this.quarantineDir, 'fixes'), { recursive: true });
    await mkdir(join(this.quarantineDir, 'modules'), { recursive: true });
    await mkdir(join(this.quarantineDir, 'logs'), { recursive: true });
  }

  /**
   * Quarantine a failed fix
   */
  async quarantineFix(
    fixContent: string,
    fixId: string,
    options: QuarantineOptions
  ): Promise<string> {
    await this.initialize();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const quarantineFileName = `fix_${fixId}_${timestamp}.ts`;
    const quarantinePath = join(this.quarantineDir, 'fixes', quarantineFileName);

    // Create quarantine file with metadata
    const quarantineData = {
      metadata: {
        fixId,
        quarantinedAt: new Date().toISOString(),
        reason: options.reason,
        errorDetails: options.errorDetails,
        stackTrace: options.stackTrace,
      },
      fixContent,
    };

    await writeFile(quarantinePath, JSON.stringify(quarantineData, null, 2));

    // Log to quarantine log file
    await this.logQuarantineEvent(fixId, quarantinePath, options);

    // Log to Supabase
    if (options.fixId) {
      await supabaseClient.logQuarantine({
        fixId: options.fixId,
        quarantinePath,
        quarantineReason: options.reason,
      });
    }

    console.log(`Fix ${fixId} quarantined to: ${quarantinePath}`);
    return quarantinePath;
  }

  /**
   * Quarantine a problematic module
   */
  async quarantineModule(
    modulePath: string,
    options: QuarantineOptions
  ): Promise<string> {
    await this.initialize();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const moduleName = basename(modulePath);
    const quarantineFileName = `${moduleName}_${timestamp}`;
    const quarantinePath = join(this.quarantineDir, 'modules', quarantineFileName);

    // Copy module to quarantine
    await copyFile(modulePath, quarantinePath);

    // Create metadata file
    const metadataPath = quarantinePath + '.meta.json';
    const metadata = {
      originalPath: modulePath,
      quarantinedAt: new Date().toISOString(),
      reason: options.reason,
      errorDetails: options.errorDetails,
      stackTrace: options.stackTrace,
      fixId: options.fixId,
    };

    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    // Log to quarantine log
    await this.logQuarantineEvent(options.fixId || 'unknown', quarantinePath, options);

    console.log(`Module ${modulePath} quarantined to: ${quarantinePath}`);
    return quarantinePath;
  }

  /**
   * Log quarantine event to local log file
   */
  private async logQuarantineEvent(
    fixId: string,
    quarantinePath: string,
    options: QuarantineOptions
  ): Promise<void> {
    const logPath = join(this.quarantineDir, 'logs', 'quarantine_log.json');
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      fixId,
      quarantinePath,
      reason: options.reason,
      errorDetails: options.errorDetails,
      stackTrace: options.stackTrace?.substring(0, 1000), // Limit stack trace length
    };

    try {
      let logData: any[] = [];
      
      try {
        const existingLog = await readFile(logPath, 'utf-8');
        logData = JSON.parse(existingLog);
      } catch {
        // File doesn't exist or is invalid, start fresh
      }

      logData.push(logEntry);

      // Keep only last 1000 entries to prevent file from growing too large
      if (logData.length > 1000) {
        logData = logData.slice(-1000);
      }

      await writeFile(logPath, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Failed to write quarantine log:', error);
    }
  }

  /**
   * List quarantined items
   */
  async listQuarantined(type: 'fixes' | 'modules' | 'all' = 'all'): Promise<{
    fixes: string[];
    modules: string[];
  }> {
    await this.initialize();

    const result = { fixes: [] as string[], modules: [] as string[] };

    try {
      const { readdir } = await import('fs/promises');

      if (type === 'fixes' || type === 'all') {
        try {
          result.fixes = await readdir(join(this.quarantineDir, 'fixes'));
        } catch {
          // Directory might not exist
        }
      }

      if (type === 'modules' || type === 'all') {
        try {
          const moduleFiles = await readdir(join(this.quarantineDir, 'modules'));
          result.modules = moduleFiles.filter(file => !file.endsWith('.meta.json'));
        } catch {
          // Directory might not exist
        }
      }
    } catch (error) {
      console.error('Error listing quarantined items:', error);
    }

    return result;
  }

  /**
   * Get quarantine log entries
   */
  async getQuarantineLog(limit: number = 50): Promise<any[]> {
    const logPath = join(this.quarantineDir, 'logs', 'quarantine_log.json');
    
    try {
      const logContent = await readFile(logPath, 'utf-8');
      const logData = JSON.parse(logContent);
      
      return Array.isArray(logData) ? logData.slice(-limit) : [];
    } catch {
      return [];
    }
  }

  /**
   * Remove quarantined item (after manual review/fix)
   */
  async removeQuarantined(quarantinePath: string): Promise<void> {
    try {
      const { unlink } = await import('fs/promises');
      await unlink(quarantinePath);
      
      // Remove metadata file if it exists
      const metadataPath = quarantinePath + '.meta.json';
      try {
        await unlink(metadataPath);
      } catch {
        // Metadata file might not exist
      }

      console.log(`Removed quarantined item: ${quarantinePath}`);
    } catch (error) {
      console.error(`Failed to remove quarantined item ${quarantinePath}:`, error);
    }
  }
}

// Export singleton instances
export const backupManager = new BackupManager();
export const quarantineManager = new QuarantineManager();

// Utility functions for easy use
export async function createBackup(
  filePath: string,
  reason: BackupOptions['reason'] = 'manual_backup',
  relatedFixId?: string
): Promise<BackupInfo> {
  return backupManager.createBackup(filePath, { reason, relatedFixId });
}

export async function quarantineFix(
  fixContent: string,
  fixId: string,
  reason: string,
  errorDetails?: Record<string, any>
): Promise<string> {
  return quarantineManager.quarantineFix(fixContent, fixId, {
    reason,
    errorDetails,
    fixId,
  });
}

export async function quarantineModule(
  modulePath: string,
  reason: string,
  fixId?: string,
  errorDetails?: Record<string, any>
): Promise<string> {
  return quarantineManager.quarantineModule(modulePath, {
    reason,
    fixId,
    errorDetails,
  });
}

// CLI functions for manual management
export async function listBackups(moduleName?: string): Promise<void> {
  const backups = await backupManager.listBackups(moduleName);
  
  console.log('\n📦 Available Backups:');
  if (backups.length === 0) {
    console.log('No backups found.');
    return;
  }

  for (const backup of backups) {
    console.log(`\n🔹 ${basename(backup.backupPath)}`);
    console.log(`   Original: ${backup.originalPath}`);
    console.log(`   Created: ${backup.timestamp}`);
    console.log(`   Reason: ${backup.reason}`);
    console.log(`   Size: ${(backup.fileSize / 1024).toFixed(1)} KB`);
    console.log(`   Hash: ${backup.fileHash.substring(0, 8)}...`);
  }
}

export async function listQuarantined(): Promise<void> {
  const quarantined = await quarantineManager.listQuarantined();
  
  console.log('\n🚨 Quarantined Items:');
  
  if (quarantined.fixes.length > 0) {
    console.log('\n🔧 Fixes:');
    for (const fix of quarantined.fixes) {
      console.log(`   - ${fix}`);
    }
  }

  if (quarantined.modules.length > 0) {
    console.log('\n📄 Modules:');
    for (const module of quarantined.modules) {
      console.log(`   - ${module}`);
    }
  }

  if (quarantined.fixes.length === 0 && quarantined.modules.length === 0) {
    console.log('No quarantined items found.');
  }
}
