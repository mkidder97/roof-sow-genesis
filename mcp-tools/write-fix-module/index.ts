#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * Fix Writer Module
 * 
 * This tool saves proposed fixes to versioned TypeScript files in the fixes/snippets directory.
 * It handles version management and ensures all fixes are properly tagged and organized.
 */

interface FixProposal {
  version: string;
  targetModule: string;
  functionName: string;
  issuesSolved: string[];
  codeSnippet: string;
  explanation: string;
  testCase?: string;
  dependencies?: string[];
}

interface WriteFixInput {
  proposal: FixProposal;
  outputDir?: string;
  overwrite?: boolean;
}

interface WriteResult {
  success: boolean;
  filePath: string;
  version: string;
  error?: string;
  backupPath?: string;
}

class FixModuleWriter {
  private fixesDir: string;
  private snippetsDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.fixesDir = path.join(baseDir, 'fixes');
    this.snippetsDir = path.join(this.fixesDir, 'snippets');
  }

  async writeFixModule(input: WriteFixInput): Promise<WriteResult> {
    try {
      // Ensure directories exist
      await this.ensureDirectoriesExist();

      // Generate file path
      const fileName = `${input.proposal.targetModule}_${input.proposal.version}.ts`;
      const filePath = path.join(input.outputDir || this.snippetsDir, fileName);

      // Check if file already exists
      const exists = await this.fileExists(filePath);
      let backupPath: string | undefined;

      if (exists && !input.overwrite) {
        // Create backup of existing file
        backupPath = await this.createBackup(filePath);
      }

      // Generate complete file content
      const fileContent = await this.generateFileContent(input.proposal);

      // Write the file
      await fs.writeFile(filePath, fileContent, 'utf-8');

      // Verify the file was written correctly
      const written = await fs.readFile(filePath, 'utf-8');
      if (written !== fileContent) {
        throw new Error('File content verification failed');
      }

      console.log(`✅ Fix module written successfully: ${fileName}`);
      console.log(`📍 Location: ${filePath}`);
      console.log(`🔖 Version: ${input.proposal.version}`);
      console.log(`🎯 Target: ${input.proposal.targetModule}.${input.proposal.functionName}`);
      console.log(`🔧 Issues solved: ${input.proposal.issuesSolved.length}`);

      return {
        success: true,
        filePath,
        version: input.proposal.version,
        backupPath
      };

    } catch (error) {
      console.error('❌ Failed to write fix module:', error);
      return {
        success: false,
        filePath: '',
        version: input.proposal.version,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async writeMultipleFixModules(proposals: FixProposal[], outputDir?: string): Promise<WriteResult[]> {
    const results: WriteResult[] = [];
    
    console.log(`📝 Writing ${proposals.length} fix modules...`);
    
    for (const proposal of proposals) {
      const result = await this.writeFixModule({
        proposal,
        outputDir,
        overwrite: false
      });
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    console.log(`\\n✅ Successfully wrote ${successful}/${proposals.length} fix modules`);

    return results;
  }

  private async ensureDirectoriesExist(): Promise<void> {
    await fs.mkdir(this.fixesDir, { recursive: true });
    await fs.mkdir(this.snippetsDir, { recursive: true });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async createBackup(filePath: string): Promise<string> {
    const backupPath = filePath.replace('.ts', '_backup.ts');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const timestampedBackupPath = filePath.replace('.ts', `_backup_${timestamp}.ts`);
    
    await fs.copyFile(filePath, timestampedBackupPath);
    console.log(`📦 Created backup: ${timestampedBackupPath}`);
    
    return timestampedBackupPath;
  }

  private async generateFileContent(proposal: FixProposal): Promise<string> {
    const header = this.generateFileHeader(proposal);
    const imports = this.generateImports(proposal);
    const mainCode = proposal.codeSnippet;
    const testCase = proposal.testCase ? this.generateTestSection(proposal.testCase) : '';
    const exports = this.generateExports(proposal);
    const footer = this.generateFileFooter(proposal);

    return [
      header,
      imports,
      '',
      mainCode,
      '',
      testCase,
      '',
      exports,
      '',
      footer
    ].filter(Boolean).join('\\n');
  }

  private generateFileHeader(proposal: FixProposal): string {
    const timestamp = new Date().toISOString();
    
    return `/**
 * ${proposal.targetModule} - ${proposal.version}
 * 
 * Self-healing PDF agent generated fix
 * Generated: ${timestamp}
 * Target Function: ${proposal.functionName}
 * Issues Addressed: ${proposal.issuesSolved.length}
 * 
 * Issues Solved:
${proposal.issuesSolved.map(issue => ` * - ${issue}`).join('\\n')}
 * 
 * Explanation:
 * ${proposal.explanation.split('\\n').map(line => ` * ${line}`).join('\\n')}
 * 
 * IMPORTANT: This is an auto-generated fix. Do not edit manually.
 * All changes should be made through the self-healing agent system.
 */`;
  }

  private generateImports(proposal: FixProposal): string {
    const imports: string[] = [];
    
    // Add standard imports
    imports.push("import fs from 'fs/promises';");
    imports.push("import path from 'path';");
    
    // Add specific imports based on dependencies
    if (proposal.dependencies) {
      for (const dep of proposal.dependencies) {
        switch (dep) {
          case 'pdfkit':
            imports.push("import PDFDocument from 'pdfkit';");
            break;
          case 'lodash':
            imports.push("import _ from 'lodash';");
            break;
          // Add more as needed
        }
      }
    }

    // Add type imports
    imports.push('');
    imports.push('// Type definitions for this fix module');
    imports.push(`interface ${proposal.targetModule}Input {`);
    imports.push('  [key: string]: any;');
    imports.push('}');
    imports.push('');
    imports.push(`interface ${proposal.targetModule}Options {`);
    imports.push('  x?: number;');
    imports.push('  y?: number;');
    imports.push('  fontSize?: number;');
    imports.push('  font?: string;');
    imports.push('  [key: string]: any;');
    imports.push('}');

    return imports.join('\\n');
  }

  private generateTestSection(testCase: string): string {
    return `/**
 * Test Cases for ${testCase.split('\\n')[0].replace('//', '').trim()}
 * 
 * These tests verify that the fix works correctly.
 * Run with: npm test
 */

${testCase}

// Additional test helpers
function createMockPDF() {
  return {
    text: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    page: { width: 612, height: 792 },
    addPage: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    widthOfString: jest.fn().mockReturnValue(100)
  };
}

function createTestInput() {
  return {
    projectName: 'Test Project',
    address: '123 Test Street, Test City, TX 12345',
    windAnalysis: {
      zonePressures: {
        zone1: -45.2,
        zone2: -67.8,
        zone3: -89.1
      }
    },
    buildingHeight: 30,
    squareFootage: 10000
  };
}`;
  }

  private generateExports(proposal: FixProposal): string {
    return `// Export the main fix function and helpers
export { ${proposal.functionName} };

// Export additional utilities if they exist
export const ${proposal.targetModule}Utils = {
  version: '${proposal.version}',
  targetModule: '${proposal.targetModule}',
  functionName: '${proposal.functionName}',
  issuesSolved: [
${proposal.issuesSolved.map(issue => `    '${issue}'`).join(',\\n')}
  ],
  dependencies: ${JSON.stringify(proposal.dependencies || [])},
  
  // Utility function to check if this fix applies to given issues
  appliesTo: (issues: string[]): boolean => {
    return issues.some(issue => 
      ${proposal.targetModule}Utils.issuesSolved.some(solved => 
        issue.toLowerCase().includes(solved.toLowerCase())
      )
    );
  }
};

// Default export
export default ${proposal.functionName};`;
  }

  private generateFileFooter(proposal: FixProposal): string {
    return `/**
 * Fix Module Metadata
 * 
 * This metadata is used by the self-healing agent system to track
 * and manage fix versions and dependencies.
 */
export const fixMetadata = {
  version: '${proposal.version}',
  timestamp: '${new Date().toISOString()}',
  targetModule: '${proposal.targetModule}',
  functionName: '${proposal.functionName}',
  issuesSolved: ${JSON.stringify(proposal.issuesSolved, null, 2)},
  dependencies: ${JSON.stringify(proposal.dependencies || [], null, 2)},
  
  // Checksum for integrity verification
  checksum: '${this.generateChecksum(proposal.codeSnippet)}',
  
  // Usage statistics (updated by the system)
  usage: {
    timesApplied: 0,
    successRate: 0,
    lastUsed: null,
    averageExecutionTime: 0
  }
};

// Version validation
if (!fixMetadata.version.startsWith('v')) {
  throw new Error('Invalid version format. Must start with "v"');
}

// Module validation
if (!fixMetadata.targetModule || !fixMetadata.functionName) {
  throw new Error('Invalid module metadata. Missing target module or function name');
}`;
  }

  private generateChecksum(content: string): string {
    // Simple checksum generation (in a real implementation, use crypto)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  async getExistingVersions(targetModule: string): Promise<string[]> {
    try {
      const files = await fs.readdir(this.snippetsDir);
      const moduleFiles = files.filter(file => 
        file.startsWith(`${targetModule}_v`) && file.endsWith('.ts')
      );
      
      return moduleFiles
        .map(file => file.replace(`${targetModule}_`, '').replace('.ts', ''))
        .sort((a, b) => {
          const aNum = parseInt(a.replace('v', ''));
          const bNum = parseInt(b.replace('v', ''));
          return aNum - bNum;
        });
    } catch {
      return [];
    }
  }

  async getLatestVersion(targetModule: string): Promise<string> {
    const versions = await this.getExistingVersions(targetModule);
    return versions.length > 0 ? versions[versions.length - 1] : 'v0';
  }

  async generateNextVersion(targetModule: string): Promise<string> {
    const latestVersion = await this.getLatestVersion(targetModule);
    const versionNum = parseInt(latestVersion.replace('v', '')) + 1;
    return `v${versionNum}`;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'write') {
    const proposalPath = args[1];
    const outputDir = args[2];

    if (!proposalPath) {
      console.error('Usage: write-fix-module write <proposal-json-path> [output-dir]');
      process.exit(1);
    }

    try {
      const proposalData = JSON.parse(await fs.readFile(proposalPath, 'utf-8'));
      const writer = new FixModuleWriter();

      if (Array.isArray(proposalData)) {
        // Multiple proposals
        await writer.writeMultipleFixModules(proposalData, outputDir);
      } else {
        // Single proposal
        const result = await writer.writeFixModule({
          proposal: proposalData,
          outputDir
        });

        if (!result.success) {
          console.error('Failed to write fix module:', result.error);
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  } else if (command === 'versions') {
    const targetModule = args[1];

    if (!targetModule) {
      console.error('Usage: write-fix-module versions <target-module>');
      process.exit(1);
    }

    try {
      const writer = new FixModuleWriter();
      const versions = await writer.getExistingVersions(targetModule);
      const latest = await writer.getLatestVersion(targetModule);
      const next = await writer.generateNextVersion(targetModule);

      console.log(`\\n📦 Versions for module: ${targetModule}`);
      console.log(`Existing versions: ${versions.join(', ') || 'None'}`);
      console.log(`Latest version: ${latest}`);
      console.log(`Next version: ${next}`);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  } else {
    console.log('Usage: write-fix-module <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  write <proposal-json-path> [output-dir]  Write fix module from proposal');
    console.log('  versions <target-module>                 Show version information');
    console.log('');
    console.log('Examples:');
    console.log('  write-fix-module write fix-proposals.json');
    console.log('  write-fix-module write single-proposal.json ./custom-output');
    console.log('  write-fix-module versions addProjectInfo');
  }
}

// Export for use as module
export { FixModuleWriter, type WriteFixInput, type WriteResult };

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
