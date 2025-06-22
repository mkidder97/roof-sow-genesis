#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * Fix History Logger
 * 
 * This tool manages the change_log.json file, tracking all fixes applied
 * by the self-healing PDF agent system.
 */

interface FixLogEntry {
  version: string;
  based_on?: string;
  fixes: string[];
  input: string;
  output: string;
  timestamp: string;
  success: boolean;
  targetModules: string[];
  functionNames: string[];
  issueCount: number;
  generationTime?: number;
  fileSize?: number;
  checksums?: {
    input: string;
    output: string;
    fixes: string[];
  };
  metadata?: {
    agent_version: string;
    pdf_analyzer_version: string;
    proposal_engine_version: string;
    [key: string]: any;
  };
}

interface ChangeLog {
  fixes: FixLogEntry[];
  version: string;
  lastUpdated: string;
  description: string;
  stats?: {
    totalFixes: number;
    successfulFixes: number;
    failedFixes: number;
    avgGenerationTime: number;
    mostCommonIssues: string[];
  };
}

interface LogInput {
  version: string;
  basedOn?: string;
  fixes: string[];
  inputPath: string;
  outputPath: string;
  success: boolean;
  targetModules: string[];
  functionNames: string[];
  generationTime?: number;
  fileSize?: number;
  metadata?: Record<string, any>;
}

class FixHistoryLogger {
  private changeLogPath: string;
  
  constructor(baseDir: string = process.cwd()) {
    this.changeLogPath = path.join(baseDir, 'fixes', 'change_log.json');
  }

  async logFix(input: LogInput): Promise<FixLogEntry> {
    try {
      // Create the log entry
      const entry: FixLogEntry = {
        version: input.version,
        based_on: input.basedOn,
        fixes: input.fixes,
        input: input.inputPath,
        output: input.outputPath,
        timestamp: new Date().toISOString(),
        success: input.success,
        targetModules: input.targetModules,
        functionNames: input.functionNames,
        issueCount: input.fixes.length,
        generationTime: input.generationTime,
        fileSize: input.fileSize,
        checksums: await this.generateChecksums(input),
        metadata: {
          agent_version: '1.0.0',
          pdf_analyzer_version: '1.0.0',
          proposal_engine_version: '1.0.0',
          ...input.metadata
        }
      };

      // Load existing change log
      const changeLog = await this.loadChangeLog();
      
      // Add new entry
      changeLog.fixes.push(entry);
      
      // Update metadata
      changeLog.lastUpdated = entry.timestamp;
      changeLog.version = this.incrementLogVersion(changeLog.version);
      changeLog.stats = this.calculateStats(changeLog.fixes);
      
      // Save updated change log
      await this.saveChangeLog(changeLog);
      
      console.log(`✅ Logged fix ${entry.version} to change log`);
      console.log(`📊 Total fixes in log: ${changeLog.fixes.length}`);
      console.log(`📈 Success rate: ${(changeLog.stats.successfulFixes / changeLog.stats.totalFixes * 100).toFixed(1)}%`);
      
      return entry;
      
    } catch (error) {
      console.error('❌ Failed to log fix:', error);
      throw error;
    }
  }

  async loadChangeLog(): Promise<ChangeLog> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.changeLogPath), { recursive: true });
      
      // Try to load existing log
      const content = await fs.readFile(this.changeLogPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Create new log if file doesn't exist
      console.log('📝 Creating new change log file');
      return {
        fixes: [],
        version: 'v1',
        lastUpdated: new Date().toISOString(),
        description: 'Self-healing PDF agent fix history'
      };
    }
  }

  async saveChangeLog(changeLog: ChangeLog): Promise<void> {
    await fs.writeFile(
      this.changeLogPath, 
      JSON.stringify(changeLog, null, 2), 
      'utf-8'
    );
  }

  private async generateChecksums(input: LogInput): Promise<{ input: string; output: string; fixes: string[] }> {
    const checksums = {
      input: '',
      output: '',
      fixes: [] as string[]
    };

    try {
      // Generate input file checksum
      if (await this.fileExists(input.inputPath)) {
        const inputContent = await fs.readFile(input.inputPath, 'utf-8');
        checksums.input = this.generateChecksum(inputContent);
      }

      // Generate output file checksum
      if (await this.fileExists(input.outputPath)) {
        const outputContent = await fs.readFile(input.outputPath);
        checksums.output = this.generateChecksum(outputContent.toString());
      }

      // Generate checksums for fix modules
      for (const moduleName of input.targetModules) {
        const fixPath = path.join(
          path.dirname(this.changeLogPath),
          'snippets',
          `${moduleName}_${input.version}.ts`
        );
        
        if (await this.fileExists(fixPath)) {
          const fixContent = await fs.readFile(fixPath, 'utf-8');
          checksums.fixes.push(this.generateChecksum(fixContent));
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not generate all checksums:', error);
    }

    return checksums;
  }

  private generateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private incrementLogVersion(currentVersion: string): string {
    const match = currentVersion.match(/v(\d+)/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      return `v${num}`;
    }
    return 'v2';
  }

  private calculateStats(fixes: FixLogEntry[]): ChangeLog['stats'] {
    const successful = fixes.filter(f => f.success);
    const failed = fixes.filter(f => !f.success);
    
    // Calculate average generation time
    const timesWithGenTime = fixes.filter(f => f.generationTime);
    const avgGenTime = timesWithGenTime.length > 0 
      ? timesWithGenTime.reduce((sum, f) => sum + (f.generationTime || 0), 0) / timesWithGenTime.length
      : 0;

    // Find most common issues
    const allIssues = fixes.flatMap(f => f.fixes);
    const issueCounts = allIssues.reduce((counts, issue) => {
      counts[issue] = (counts[issue] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const mostCommonIssues = Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);

    return {
      totalFixes: fixes.length,
      successfulFixes: successful.length,
      failedFixes: failed.length,
      avgGenerationTime: Math.round(avgGenTime),
      mostCommonIssues
    };
  }

  async getFixHistory(version?: string): Promise<FixLogEntry[]> {
    const changeLog = await this.loadChangeLog();
    
    if (version) {
      return changeLog.fixes.filter(f => f.version === version);
    }
    
    return changeLog.fixes;
  }

  async getLatestFix(): Promise<FixLogEntry | null> {
    const changeLog = await this.loadChangeLog();
    
    if (changeLog.fixes.length === 0) {
      return null;
    }
    
    return changeLog.fixes[changeLog.fixes.length - 1];
  }

  async getFixesByModule(moduleName: string): Promise<FixLogEntry[]> {
    const changeLog = await this.loadChangeLog();
    return changeLog.fixes.filter(f => f.targetModules.includes(moduleName));
  }

  async getSuccessfulFixes(): Promise<FixLogEntry[]> {
    const changeLog = await this.loadChangeLog();
    return changeLog.fixes.filter(f => f.success);
  }

  async getFailedFixes(): Promise<FixLogEntry[]> {
    const changeLog = await this.loadChangeLog();
    return changeLog.fixes.filter(f => !f.success);
  }

  async generateReport(): Promise<string> {
    const changeLog = await this.loadChangeLog();
    const stats = changeLog.stats || this.calculateStats(changeLog.fixes);
    
    const report = `
# Self-Healing PDF Agent - Fix History Report

## Summary
- **Total Fixes Applied**: ${stats.totalFixes}
- **Successful Fixes**: ${stats.successfulFixes}
- **Failed Fixes**: ${stats.failedFixes}
- **Success Rate**: ${stats.totalFixes > 0 ? (stats.successfulFixes / stats.totalFixes * 100).toFixed(1) : 0}%
- **Average Generation Time**: ${stats.avgGenerationTime}ms
- **Last Updated**: ${changeLog.lastUpdated}

## Most Common Issues
${stats.mostCommonIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\\n')}

## Recent Fixes (Last 10)
${changeLog.fixes.slice(-10).reverse().map(fix => `
### ${fix.version} - ${fix.success ? '✅ Success' : '❌ Failed'}
- **Timestamp**: ${fix.timestamp}
- **Issues Fixed**: ${fix.issueCount}
- **Target Modules**: ${fix.targetModules.join(', ')}
- **Generation Time**: ${fix.generationTime || 'N/A'}ms
- **File Size**: ${fix.fileSize ? `${(fix.fileSize / 1024).toFixed(1)}KB` : 'N/A'}

**Issues Addressed**:
${fix.fixes.map(f => `- ${f}`).join('\\n')}
`).join('\\n')}

## Fix Timeline
${changeLog.fixes.map(fix => `- ${fix.timestamp}: ${fix.version} (${fix.success ? 'Success' : 'Failed'}) - ${fix.issueCount} issues`).join('\\n')}
`;

    return report.trim();
  }

  async exportLog(format: 'json' | 'csv' = 'json', outputPath?: string): Promise<string> {
    const changeLog = await this.loadChangeLog();
    
    const defaultPath = outputPath || path.join(
      path.dirname(this.changeLogPath),
      `fix_history_export_${new Date().toISOString().split('T')[0]}.${format}`
    );

    if (format === 'json') {
      await fs.writeFile(defaultPath, JSON.stringify(changeLog, null, 2));
    } else if (format === 'csv') {
      const csvHeader = 'Version,Timestamp,Success,Issues Count,Target Modules,Generation Time,File Size\\n';
      const csvRows = changeLog.fixes.map(fix => 
        `${fix.version},${fix.timestamp},${fix.success},${fix.issueCount},"${fix.targetModules.join(';')}",${fix.generationTime || ''},${fix.fileSize || ''}`
      ).join('\\n');
      
      await fs.writeFile(defaultPath, csvHeader + csvRows);
    }

    console.log(`📊 Exported fix history to: ${defaultPath}`);
    return defaultPath;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const logger = new FixHistoryLogger();

  if (command === 'log') {
    const version = args[1];
    const inputPath = args[2];
    const outputPath = args[3];
    const success = args[4] === 'true';
    const fixes = args.slice(5);

    if (!version || !inputPath || !outputPath || !fixes.length) {
      console.error('Usage: log-fix-history log <version> <input-path> <output-path> <success> <fix1> [fix2] ...');
      process.exit(1);
    }

    try {
      await logger.logFix({
        version,
        inputPath,
        outputPath,
        success,
        fixes,
        targetModules: ['extracted_from_fixes'],
        functionNames: ['extracted_from_fixes']
      });
    } catch (error) {
      console.error('Error logging fix:', error);
      process.exit(1);
    }

  } else if (command === 'report') {
    try {
      const report = await logger.generateReport();
      console.log(report);
    } catch (error) {
      console.error('Error generating report:', error);
      process.exit(1);
    }

  } else if (command === 'export') {
    const format = args[1] as 'json' | 'csv' || 'json';
    const outputPath = args[2];

    try {
      const exportPath = await logger.exportLog(format, outputPath);
      console.log(`Exported to: ${exportPath}`);
    } catch (error) {
      console.error('Error exporting log:', error);
      process.exit(1);
    }

  } else if (command === 'history') {
    const version = args[1];

    try {
      const history = await logger.getFixHistory(version);
      console.log(JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Error getting history:', error);
      process.exit(1);
    }

  } else if (command === 'latest') {
    try {
      const latest = await logger.getLatestFix();
      if (latest) {
        console.log(JSON.stringify(latest, null, 2));
      } else {
        console.log('No fixes in history');
      }
    } catch (error) {
      console.error('Error getting latest fix:', error);
      process.exit(1);
    }

  } else {
    console.log('Usage: log-fix-history <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  log <version> <input> <output> <success> <fix1> ...  Log a new fix');
    console.log('  report                                               Generate fix report');
    console.log('  export [json|csv] [output-path]                     Export fix history');
    console.log('  history [version]                                    Show fix history');
    console.log('  latest                                               Show latest fix');
    console.log('');
    console.log('Examples:');
    console.log('  log-fix-history log v2 input.json output.pdf true "Fixed missing project name"');
    console.log('  log-fix-history report');
    console.log('  log-fix-history export csv');
    console.log('  log-fix-history history v2');
  }
}

// Export for use as module
export { FixHistoryLogger, type FixLogEntry, type LogInput, type ChangeLog };

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
