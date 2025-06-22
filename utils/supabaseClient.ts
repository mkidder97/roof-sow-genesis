/**
 * Supabase Client for roof-sow-genesis Self-Healing PDF System
 * Provides typed interfaces and utilities for database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Type definitions for our schema
export interface Project {
  id: string;
  name: string;
  user_id: string;
  description?: string;
  project_address?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface PDFVersion {
  id: string;
  project_id: string;
  input_hash: string;
  pdf_path: string;
  version_number: number;
  created_at: string;
  file_size?: number;
  page_count?: number;
  metrics: Record<string, any>;
  input_data: Record<string, any>;
  status: 'generating' | 'completed' | 'failed' | 'quarantined';
  error_message?: string;
}

export interface Fix {
  id: string;
  base_version_id: string;
  new_version_id?: string;
  fix_type: string;
  claude_summary: string;
  fix_snippet?: string;
  success: boolean;
  created_at: string;
  analysis_data: Record<string, any>;
  confidence_score?: number;
  applied_by: string;
  execution_time_ms?: number;
  error_details: Record<string, any>;
  quarantine_reason?: string;
}

export interface FixStatistics {
  id: string;
  project_id: string;
  date: string;
  total_fixes: number;
  successful_fixes: number;
  failed_fixes: number;
  quarantined_fixes: number;
  fix_type_counts: Record<string, number>;
  avg_execution_time_ms?: number;
  avg_confidence_score?: number;
  updated_at: string;
}

export interface TestResult {
  id: string;
  pdf_version_id: string;
  test_type: string;
  test_name: string;
  passed: boolean;
  created_at: string;
  expected_result?: Record<string, any>;
  actual_result?: Record<string, any>;
  diff_data?: Record<string, any>;
  execution_time_ms?: number;
  error_message?: string;
  stack_trace?: string;
}

export interface BackupHistory {
  id: string;
  module_name: string;
  backup_path: string;
  created_at: string;
  original_file_size?: number;
  backup_reason: string;
  related_fix_id?: string;
  file_hash: string;
}

export interface QuarantineLog {
  id: string;
  fix_id: string;
  quarantine_path: string;
  quarantine_reason: string;
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      pdf_versions: {
        Row: PDFVersion;
        Insert: Omit<PDFVersion, 'id' | 'created_at'>;
        Update: Partial<Omit<PDFVersion, 'id' | 'created_at'>>;
      };
      fixes: {
        Row: Fix;
        Insert: Omit<Fix, 'id' | 'created_at'>;
        Update: Partial<Omit<Fix, 'id' | 'created_at'>>;
      };
      fix_statistics: {
        Row: FixStatistics;
        Insert: Omit<FixStatistics, 'id' | 'updated_at'>;
        Update: Partial<Omit<FixStatistics, 'id'>>;
      };
      test_results: {
        Row: TestResult;
        Insert: Omit<TestResult, 'id' | 'created_at'>;
        Update: Partial<Omit<TestResult, 'id' | 'created_at'>>;
      };
      backup_history: {
        Row: BackupHistory;
        Insert: Omit<BackupHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<BackupHistory, 'id' | 'created_at'>>;
      };
      quarantine_log: {
        Row: QuarantineLog;
        Insert: Omit<QuarantineLog, 'id' | 'created_at'>;
        Update: Partial<Omit<QuarantineLog, 'id' | 'created_at'>>;
      };
    };
    Views: {
      project_summary: {
        Row: Project & {
          total_versions: number;
          completed_versions: number;
          failed_versions: number;
          last_generation_at?: string;
          total_fixes: number;
          successful_fixes: number;
        };
      };
      recent_activity: {
        Row: {
          activity_type: 'pdf_generation' | 'fix_applied';
          project_id: string;
          project_name: string;
          created_at: string;
          details: Record<string, any>;
        };
      };
    };
  };
}

class SupabaseClientManager {
  private client: SupabaseClient<Database> | null = null;
  private static instance: SupabaseClientManager;

  private constructor() {}

  public static getInstance(): SupabaseClientManager {
    if (!SupabaseClientManager.instance) {
      SupabaseClientManager.instance = new SupabaseClientManager();
    }
    return SupabaseClientManager.instance;
  }

  public getClient(): SupabaseClient<Database> {
    if (!this.client) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          'SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables'
        );
      }

      this.client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false, // For server-side usage
        },
      });
    }

    return this.client;
  }

  // Utility methods for common operations
  
  /**
   * Create a hash for input data to detect changes
   */
  public static createInputHash(inputData: Record<string, any>): string {
    const dataString = JSON.stringify(inputData, Object.keys(inputData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Log PDF generation metadata
   */
  public async logPDFGeneration(data: {
    projectId: string;
    inputData: Record<string, any>;
    pdfPath: string;
    fileSize?: number;
    pageCount?: number;
    metrics?: Record<string, any>;
    status?: PDFVersion['status'];
    errorMessage?: string;
  }): Promise<PDFVersion | null> {
    const client = this.getClient();
    
    // Get the next version number
    const { data: lastVersion } = await client
      .from('pdf_versions')
      .select('version_number')
      .eq('project_id', data.projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const versionNumber = (lastVersion?.version_number || 0) + 1;
    const inputHash = SupabaseClientManager.createInputHash(data.inputData);

    const { data: pdfVersion, error } = await client
      .from('pdf_versions')
      .insert({
        project_id: data.projectId,
        input_hash: inputHash,
        pdf_path: data.pdfPath,
        version_number: versionNumber,
        file_size: data.fileSize,
        page_count: data.pageCount,
        metrics: data.metrics || {},
        input_data: data.inputData,
        status: data.status || 'completed',
        error_message: data.errorMessage,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging PDF generation:', error);
      return null;
    }

    return pdfVersion;
  }

  /**
   * Log a fix attempt
   */
  public async logFix(data: {
    baseVersionId: string;
    newVersionId?: string;
    fixType: string;
    claudeSummary: string;
    fixSnippet?: string;
    success: boolean;
    analysisData?: Record<string, any>;
    confidenceScore?: number;
    executionTimeMs?: number;
    errorDetails?: Record<string, any>;
    quarantineReason?: string;
  }): Promise<Fix | null> {
    const client = this.getClient();

    const { data: fix, error } = await client
      .from('fixes')
      .insert({
        base_version_id: data.baseVersionId,
        new_version_id: data.newVersionId,
        fix_type: data.fixType,
        claude_summary: data.claudeSummary,
        fix_snippet: data.fixSnippet,
        success: data.success,
        analysis_data: data.analysisData || {},
        confidence_score: data.confidenceScore,
        applied_by: 'claude',
        execution_time_ms: data.executionTimeMs,
        error_details: data.errorDetails || {},
        quarantine_reason: data.quarantineReason,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging fix:', error);
      return null;
    }

    return fix;
  }

  /**
   * Log test results
   */
  public async logTestResult(data: {
    pdfVersionId: string;
    testType: string;
    testName: string;
    passed: boolean;
    expectedResult?: Record<string, any>;
    actualResult?: Record<string, any>;
    diffData?: Record<string, any>;
    executionTimeMs?: number;
    errorMessage?: string;
    stackTrace?: string;
  }): Promise<TestResult | null> {
    const client = this.getClient();

    const { data: testResult, error } = await client
      .from('test_results')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error logging test result:', error);
      return null;
    }

    return testResult;
  }

  /**
   * Log backup creation
   */
  public async logBackup(data: {
    moduleName: string;
    backupPath: string;
    originalFileSize?: number;
    backupReason: string;
    relatedFixId?: string;
    fileHash: string;
  }): Promise<BackupHistory | null> {
    const client = this.getClient();

    const { data: backup, error } = await client
      .from('backup_history')
      .insert({
        module_name: data.moduleName,
        backup_path: data.backupPath,
        original_file_size: data.originalFileSize,
        backup_reason: data.backupReason,
        related_fix_id: data.relatedFixId,
        file_hash: data.fileHash,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging backup:', error);
      return null;
    }

    return backup;
  }

  /**
   * Log quarantine event
   */
  public async logQuarantine(data: {
    fixId: string;
    quarantinePath: string;
    quarantineReason: string;
  }): Promise<QuarantineLog | null> {
    const client = this.getClient();

    const { data: quarantine, error } = await client
      .from('quarantine_log')
      .insert({
        fix_id: data.fixId,
        quarantine_path: data.quarantinePath,
        quarantine_reason: data.quarantineReason,
        resolved: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging quarantine:', error);
      return null;
    }

    return quarantine;
  }

  /**
   * Get project summary with statistics
   */
  public async getProjectSummary(projectId: string) {
    const client = this.getClient();

    const { data, error } = await client
      .from('project_summary')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project summary:', error);
      return null;
    }

    return data;
  }

  /**
   * Get recent activity for a project
   */
  public async getRecentActivity(projectId: string, limit: number = 20) {
    const client = this.getClient();

    const { data, error } = await client
      .from('recent_activity')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    return data;
  }

  /**
   * Get fix statistics for a date range
   */
  public async getFixStatistics(
    projectId: string,
    startDate: string,
    endDate: string
  ) {
    const client = this.getClient();

    const { data, error } = await client
      .from('fix_statistics')
      .select('*')
      .eq('project_id', projectId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching fix statistics:', error);
      return [];
    }

    return data;
  }

  /**
   * Check if input data has changed (for avoiding duplicate generations)
   */
  public async hasInputChanged(
    projectId: string,
    inputData: Record<string, any>
  ): Promise<boolean> {
    const client = this.getClient();
    const inputHash = SupabaseClientManager.createInputHash(inputData);

    const { data, error } = await client
      .from('pdf_versions')
      .select('input_hash')
      .eq('project_id', projectId)
      .eq('input_hash', inputHash)
      .limit(1);

    if (error) {
      console.error('Error checking input hash:', error);
      return true; // Assume changed if we can't check
    }

    return data.length === 0; // True if no matching hash found (input changed)
  }
}

// Export singleton instance
const supabaseClient = SupabaseClientManager.getInstance();
export default supabaseClient;

// Export the client directly for convenience
export const getSupabaseClient = () => supabaseClient.getClient();

// Utility functions
export const createInputHash = SupabaseClientManager.createInputHash;
