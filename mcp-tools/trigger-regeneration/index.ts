#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { runPDFGenerationV3Test } from '../../tests/regression/test_generatePDF_v3.js';
import { comparePDFLayouts } from '../../tests/regression/compare_pdf_layout.js';
import supabaseClient from '../../utils/supabaseClient.js';
import { backupManager } from '../../utils/backupManager.js';

/**
 * Enhanced PDF Regeneration Trigger with Testing & Validation
 * 
 * This tool regenerates PDFs using the latest fixes from the self-healing agent system,
 * with optional testing and validation to ensure quality before deployment.
 */

interface RegenerationInput {
  inputJsonPath: string;
  fixModules: string[];
  outputDir?: string;
  version?: string;
  originalGeneratorPath?: string;
  runTests?: boolean;
  comparisonBaseline?: string;
  projectId?: string;
}

interface RegenerationResult {
  success: boolean;
  outputPath?: string;
  version: string;
  generationTime: number;
  fileSize?: number;
  appliedFixes: string[];
  error?: string;
  checksums?: {
    input: string;
    output: string;
    fixes: string[];
  };
  testResults?: {
    passed: boolean;
    testSuite?: any;
    layoutComparison?: any;
  };
  backupInfo?: {
    created: boolean;
    backupPaths: string[];
  };
}

interface FixModule {
  filePath: string;
  version: string;
  targetModule: string;
  functionName: string;
  checksum: string;
}

class PDFRegenerationTrigger {
  private fixesDir: string;
  private outputDir: string;
  private inputVersionsDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.fixesDir = path.join(baseDir, 'fixes', 'snippets');
    this.outputDir = path.join(baseDir, 'output');
    this.inputVersionsDir = path.join(baseDir, 'input_versions');
  }

  async regeneratePDF(input: RegenerationInput): Promise<RegenerationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Starting enhanced PDF regeneration with fixes...');
      
      // Ensure directories exist
      await this.ensureDirectoriesExist();
      
      // Create backups if requested
      const backupInfo = await this.createBackups(input);
      
      // Load and validate input JSON
      const inputData = await this.loadInputData(input.inputJsonPath);
      
      // Load and validate fix modules
      const fixModules = await this.loadFixModules(input.fixModules);
      
      // Generate version for output
      const outputVersion = input.version || await this.generateOutputVersion();
      
      // Create temporary generator with fixes applied
      const tempGeneratorPath = await this.createTemporaryGenerator(fixModules, input.originalGeneratorPath);
      
      // Generate the PDF using the fixed generator
      const outputPath = await this.executeGeneration(inputData, tempGeneratorPath, outputVersion);
      
      // Run tests if requested
      const testResults = input.runTests ? await this.runValidationTests(outputPath, inputData, input) : undefined;
      
      // Verify the generated PDF
      const verification = await this.verifyGeneratedPDF(outputPath, inputData);
      
      // Calculate file size and checksums
      const stats = await fs.stat(outputPath);
      const checksums = await this.generateChecksums(input, outputPath, fixModules);
      
      // Log to Supabase if projectId provided
      if (input.projectId) {
        await this.logToSupabase(input, outputPath, outputVersion, stats.size, testResults);
      }
      
      // Clean up temporary files
      await this.cleanup(tempGeneratorPath);
      
      const generationTime = Date.now() - startTime;
      
      console.log(`✅ PDF regeneration completed in ${generationTime}ms`);
      console.log(`📄 Output: ${outputPath}`);
      console.log(`📊 File size: ${(stats.size / 1024).toFixed(1)}KB`);
      console.log(`🔧 Applied fixes: ${fixModules.length}`);
      
      if (testResults) {
        console.log(`🧪 Tests: ${testResults.passed ? 'PASSED' : 'FAILED'}`);
      }
      
      return {
        success: true,
        outputPath,
        version: outputVersion,
        generationTime,
        fileSize: stats.size,
        appliedFixes: fixModules.map(f => `${f.targetModule}_${f.version}`),
        checksums,
        testResults,
        backupInfo
      };
      
    } catch (error) {
      const generationTime = Date.now() - startTime;
      
      console.error('❌ PDF regeneration failed:', error);
      
      return {
        success: false,
        version: input.version || 'unknown',
        generationTime,
        appliedFixes: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        backupInfo: { created: false, backupPaths: [] }
      };
    }
  }

  private async createBackups(input: RegenerationInput): Promise<{ created: boolean; backupPaths: string[] }> {
    const backupPaths: string[] = [];
    
    try {
      // Create backup of original generator
      if (input.originalGeneratorPath) {
        const backup = await backupManager.createBackup(input.originalGeneratorPath, {
          reason: 'pre_modification',
          maxBackups: 5
        });
        backupPaths.push(backup.backupPath);
      }
      
      // Create backups of any modules that will be modified
      for (const fixModule of input.fixModules) {
        try {
          const modulePath = path.join('src', fixModule.replace(/_v\d+\.ts$/, '.ts'));
          const backup = await backupManager.createBackup(modulePath, {
            reason: 'fix_application',
            maxBackups: 10
          });
          backupPaths.push(backup.backupPath);
        } catch (error) {
          console.warn(`⚠️ Could not backup module for ${fixModule}:`, error);
        }
      }
      
      console.log(`📦 Created ${backupPaths.length} backups`);
      return { created: true, backupPaths };
      
    } catch (error) {
      console.warn('⚠️ Backup creation failed:', error);
      return { created: false, backupPaths };
    }
  }

  private async runValidationTests(
    outputPath: string, 
    inputData: any, 
    input: RegenerationInput
  ): Promise<{ passed: boolean; testSuite?: any; layoutComparison?: any }> {
    try {
      console.log('🧪 Running validation tests...');
      
      // Run regression test suite
      const testSuite = await runPDFGenerationV3Test(input.inputJsonPath, path.dirname(outputPath));
      
      // Run layout comparison if baseline provided
      let layoutComparison;
      if (input.comparisonBaseline) {
        layoutComparison = await comparePDFLayouts(input.comparisonBaseline, outputPath);
        console.log(`📐 Layout comparison: ${layoutComparison.isMatch ? 'MATCH' : 'DIFFERS'} (confidence: ${(layoutComparison.confidence * 100).toFixed(1)}%)`);
      }
      
      const allTestsPassed = testSuite.overallPassed && (!layoutComparison || layoutComparison.isMatch);
      
      console.log(`🧪 Test Results: ${allTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Regression Tests: ${testSuite.summary.passed}/${testSuite.summary.total} passed`);
      if (layoutComparison) {
        console.log(`   Layout Comparison: ${layoutComparison.isMatch ? 'MATCH' : 'DIFFERS'}`);
      }
      
      return {
        passed: allTestsPassed,
        testSuite,
        layoutComparison
      };
      
    } catch (error) {
      console.error('❌ Test validation failed:', error);
      return {
        passed: false,
        testSuite: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async logToSupabase(
    input: RegenerationInput,
    outputPath: string,
    version: string,
    fileSize: number,
    testResults?: any
  ): Promise<void> {
    try {
      // Load input data for hash calculation
      const inputContent = await fs.readFile(input.inputJsonPath, 'utf-8');
      const inputData = JSON.parse(inputContent);
      
      // Log PDF generation
      const pdfVersion = await supabaseClient.logPDFGeneration({
        projectId: input.projectId!,
        inputData,
        pdfPath: outputPath,
        fileSize,
        metrics: {
          appliedFixes: input.fixModules.length,
          testsPassed: testResults?.passed || false,
          testSummary: testResults?.testSuite?.summary
        },
        status: testResults?.passed === false ? 'failed' : 'completed'
      });
      
      if (pdfVersion) {
        console.log(`🔄 Logged PDF generation to Supabase: ${pdfVersion.id}`);
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to log to Supabase:', error);
    }
  }

  private async ensureDirectoriesExist(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(this.inputVersionsDir, { recursive: true });
  }

  private async loadInputData(inputPath: string): Promise<any> {
    try {
      const content = await fs.readFile(inputPath, 'utf-8');
      const data = JSON.parse(content);
      
      console.log(`📥 Loaded input data from: ${inputPath}`);
      console.log(`📋 Project: ${data.projectName || data.project?.name || 'Unknown'}`);
      
      return data;
    } catch (error) {
      throw new Error(`Failed to load input data from ${inputPath}: ${error}`);
    }
  }

  private async loadFixModules(fixModulePaths: string[]): Promise<FixModule[]> {
    const modules: FixModule[] = [];
    
    for (const modulePath of fixModulePaths) {
      try {
        // Determine full path
        const fullPath = path.isAbsolute(modulePath) 
          ? modulePath 
          : path.join(this.fixesDir, modulePath);
        
        // Verify file exists
        await fs.access(fullPath);
        
        // Extract metadata from filename
        const fileName = path.basename(fullPath, '.ts');
        const parts = fileName.split('_v');
        const targetModule = parts[0];
        const version = `v${parts[1]}`;
        
        // Calculate checksum
        const content = await fs.readFile(fullPath, 'utf-8');
        const checksum = this.generateChecksum(content);
        
        // Extract function name from content
        const functionNameMatch = content.match(/function\s+(\w+)\s*\(/);
        const functionName = functionNameMatch ? functionNameMatch[1] : 'unknown';
        
        modules.push({
          filePath: fullPath,
          version,
          targetModule,
          functionName,
          checksum
        });
        
        console.log(`🔧 Loaded fix: ${targetModule}_${version} (${functionName})`);
        
      } catch (error) {
        console.warn(`⚠️ Could not load fix module ${modulePath}:`, error);
      }
    }
    
    if (modules.length === 0) {
      throw new Error('No valid fix modules could be loaded');
    }
    
    return modules;
  }

  private async generateOutputVersion(): Promise<string> {
    try {
      const files = await fs.readdir(this.outputDir);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));
      
      // Extract version numbers
      const versions = pdfFiles
        .map(f => f.match(/_v(\d+)\.pdf$/))
        .filter(Boolean)
        .map(m => parseInt(m![1]))
        .sort((a, b) => b - a);
      
      const nextVersion = versions.length > 0 ? versions[0] + 1 : 1;
      return `v${nextVersion}`;
      
    } catch {
      return 'v1';
    }
  }

  private async createTemporaryGenerator(fixModules: FixModule[], originalGeneratorPath?: string): Promise<string> {
    // Find the original PDF generator
    const generatorPath = originalGeneratorPath || await this.findOriginalGenerator();
    
    // Read the original generator
    const originalContent = await fs.readFile(generatorPath, 'utf-8');
    
    // Create modified version with fixes applied
    let modifiedContent = originalContent;
    
    // Add imports for fix modules
    const imports = fixModules.map(fix => 
      `import { ${fix.functionName} } from '../fixes/snippets/${path.basename(fix.filePath, '.ts')}';`
    ).join('\n');
    
    modifiedContent = imports + '\n\n' + modifiedContent;
    
    // Add fix application wrapper
    const wrapperCode = `
// CLAUDE FIX WRAPPER - Auto-generated
const originalGeneratePDF = generatePDF;

export function generatePDF(inputData: any, options: any = {}) {
  console.log('🔧 Applying fixes before PDF generation...');
  
  // Apply all fixes
  ${fixModules.map(fix => `
  try {
    ${fix.functionName}(inputData, options);
    console.log('✅ Applied fix: ${fix.targetModule}_${fix.version}');
  } catch (error) {
    console.warn('⚠️ Fix ${fix.targetModule}_${fix.version} failed:', error);
  }`).join('')}
  
  // Call original generator
  return originalGeneratePDF(inputData, options);
}
`;
    
    modifiedContent += '\n\n' + wrapperCode;
    
    // Create temporary file
    const tempPath = path.join(this.outputDir, `temp_generator_${Date.now()}.ts`);
    await fs.writeFile(tempPath, modifiedContent);
    
    console.log(`🔨 Created temporary generator with fixes: ${tempPath}`);
    
    return tempPath;
  }

  private async findOriginalGenerator(): Promise<string> {
    // Look for common PDF generator locations
    const possiblePaths = [
      'server/core/pdf-generator.ts',
      'src/pdf-generator.ts',
      'lib/pdf-generator.ts',
      'server/lib/pdf-generator.ts'
    ];
    
    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath);
        console.log(`📄 Found original generator: ${possiblePath}`);
        return possiblePath;
      } catch {
        // Continue searching
      }
    }
    
    throw new Error('Could not find original PDF generator. Please specify the path.');
  }

  private async executeGeneration(inputData: any, generatorPath: string, version: string): Promise<string> {
    // Generate output filename
    const projectName = (inputData.projectName || inputData.project?.name || 'Unknown_Project').replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    const outputFileName = `SOW_${projectName}_${version}_${timestamp}.pdf`;
    const outputPath = path.join(this.outputDir, outputFileName);
    
    try {
      // Compile TypeScript if needed
      const jsPath = generatorPath.replace('.ts', '.js');
      if (generatorPath.endsWith('.ts')) {
        console.log('🔨 Compiling TypeScript generator...');
        execSync(`npx tsc ${generatorPath} --outDir ${path.dirname(jsPath)}`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
      }
      
      // Execute the generator
      console.log('🎨 Generating PDF with applied fixes...');
      
      const generatorModule = require(path.resolve(jsPath));
      const result = await generatorModule.generatePDF(inputData, {
        outputPath: outputPath,
        version: version
      });
      
      // Verify output was created
      await fs.access(outputPath);
      
      console.log(`✅ PDF generated successfully: ${outputFileName}`);
      
      return outputPath;
      
    } catch (error) {
      throw new Error(`PDF generation failed: ${error}`);
    }
  }

  private async verifyGeneratedPDF(outputPath: string, inputData: any): Promise<boolean> {
    try {
      // Basic verification - check file exists and has content
      const stats = await fs.stat(outputPath);
      
      if (stats.size < 1000) {
        console.warn('⚠️ Generated PDF seems unusually small');
        return false;
      }
      
      console.log(`✅ PDF verification passed: ${(stats.size / 1024).toFixed(1)}KB`);
      return true;
      
    } catch (error) {
      console.error('❌ PDF verification failed:', error);
      return false;
    }
  }

  private async generateChecksums(
    input: RegenerationInput, 
    outputPath: string, 
    fixModules: FixModule[]
  ): Promise<{ input: string; output: string; fixes: string[] }> {
    const checksums = {
      input: '',
      output: '',
      fixes: [] as string[]
    };

    try {
      // Input checksum
      const inputContent = await fs.readFile(input.inputJsonPath, 'utf-8');
      checksums.input = this.generateChecksum(inputContent);

      // Output checksum
      const outputContent = await fs.readFile(outputPath);
      checksums.output = this.generateChecksum(outputContent.toString());

      // Fix module checksums
      checksums.fixes = fixModules.map(f => f.checksum);

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

  private async cleanup(tempGeneratorPath: string): Promise<void> {
    try {
      await fs.unlink(tempGeneratorPath);
      
      // Also clean up compiled JS if exists
      const jsPath = tempGeneratorPath.replace('.ts', '.js');
      try {
        await fs.unlink(jsPath);
      } catch {
        // JS file might not exist
      }
      
      console.log('🧹 Cleaned up temporary files');
    } catch (error) {
      console.warn('⚠️ Could not clean up temporary files:', error);
    }
  }

  async listAvailableFixes(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.fixesDir);
      return files.filter(f => f.endsWith('.ts')).sort();
    } catch {
      return [];
    }
  }

  async getLatestFixesForModule(moduleName: string): Promise<string[]> {
    const allFixes = await this.listAvailableFixes();
    const moduleFixes = allFixes.filter(f => f.startsWith(`${moduleName}_v`));
    
    // Sort by version number
    return moduleFixes.sort((a, b) => {
      const aVersion = parseInt(a.match(/_v(\d+)\.ts$/)?.[1] || '0');
      const bVersion = parseInt(b.match(/_v(\d+)\.ts$/)?.[1] || '0');
      return bVersion - aVersion; // Descending order (latest first)
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const trigger = new PDFRegenerationTrigger();

  if (command === 'generate') {
    const inputJsonPath = args[1];
    const fixModules = [];
    let runTests = false;
    let comparisonBaseline: string | undefined;
    let projectId: string | undefined;
    
    // Parse arguments
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--test') {
        runTests = true;
      } else if (arg === '--baseline') {
        comparisonBaseline = args[++i];
      } else if (arg === '--project-id') {
        projectId = args[++i];
      } else if (arg.endsWith('.ts')) {
        fixModules.push(arg);
      }
    }

    if (!inputJsonPath || fixModules.length === 0) {
      console.error('Usage: trigger-regeneration generate <input-json-path> <fix-module1> [fix-module2] ... [--test] [--baseline <pdf-path>] [--project-id <id>]');
      console.error('');
      console.error('Options:');
      console.error('  --test                Run regression tests after generation');
      console.error('  --baseline <path>     Compare layout against baseline PDF');
      console.error('  --project-id <id>     Log results to Supabase project');
      console.error('');
      console.error('Example:');
      console.error('  trigger-regeneration generate input.json addProjectInfo_v2.ts --test --project-id my-project');
      process.exit(1);
    }

    try {
      const result = await trigger.regeneratePDF({
        inputJsonPath,
        fixModules,
        runTests,
        comparisonBaseline,
        projectId
      });

      if (result.success) {
        console.log('\n✅ Regeneration completed successfully!');
        console.log(`📄 Output: ${result.outputPath}`);
        console.log(`🔖 Version: ${result.version}`);
        console.log(`⏱️ Time: ${result.generationTime}ms`);
        console.log(`📊 Size: ${result.fileSize ? (result.fileSize / 1024).toFixed(1) + 'KB' : 'Unknown'}`);
        console.log(`🔧 Applied fixes: ${result.appliedFixes.join(', ')}`);
        
        if (result.testResults) {
          console.log(`🧪 Tests: ${result.testResults.passed ? '✅ PASSED' : '❌ FAILED'}`);
        }
        
        if (result.backupInfo?.created) {
          console.log(`📦 Backups created: ${result.backupInfo.backupPaths.length}`);
        }
        
        // Exit with appropriate code based on test results
        const exitCode = result.testResults ? (result.testResults.passed ? 0 : 1) : 0;
        process.exit(exitCode);
      } else {
        console.error('❌ Regeneration failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }

  } else if (command === 'list-fixes') {
    try {
      const fixes = await trigger.listAvailableFixes();
      console.log('📦 Available fix modules:');
      fixes.forEach(fix => console.log(`  - ${fix}`));
    } catch (error) {
      console.error('Error listing fixes:', error);
      process.exit(1);
    }

  } else if (command === 'latest-fixes') {
    const moduleName = args[1];

    if (!moduleName) {
      console.error('Usage: trigger-regeneration latest-fixes <module-name>');
      process.exit(1);
    }

    try {
      const fixes = await trigger.getLatestFixesForModule(moduleName);
      console.log(`📦 Latest fixes for ${moduleName}:`);
      fixes.forEach(fix => console.log(`  - ${fix}`));
    } catch (error) {
      console.error('Error getting latest fixes:', error);
      process.exit(1);
    }

  } else {
    console.log('Usage: trigger-regeneration <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  generate <input-json> <fix1> [fix2] ... [options]  Regenerate PDF with fixes');
    console.log('  list-fixes                                          List available fix modules');
    console.log('  latest-fixes <module-name>                          Get latest fixes for module');
    console.log('');
    console.log('Options for generate:');
    console.log('  --test                Run regression tests after generation');
    console.log('  --baseline <path>     Compare layout against baseline PDF');
    console.log('  --project-id <id>     Log results to Supabase project');
    console.log('');
    console.log('Examples:');
    console.log('  trigger-regeneration generate input.json addProjectInfo_v2.ts --test');
    console.log('  trigger-regeneration generate input.json fix1.ts fix2.ts --baseline old.pdf');
    console.log('  trigger-regeneration list-fixes');
    console.log('  trigger-regeneration latest-fixes addProjectInfo');
  }
}

// Export for use as module
export { PDFRegenerationTrigger, type RegenerationInput, type RegenerationResult };

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
