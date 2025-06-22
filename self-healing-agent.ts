#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Self-Healing PDF Agent Orchestrator
 * 
 * This is the main orchestrator that coordinates all MCP tools in the self-healing cycle:
 * 1. analyze-pdf-output
 * 2. propose-fix-snippet
 * 3. write-fix-module
 * 4. log-fix-history
 * 5. trigger-regeneration
 */

interface SelfHealingConfig {
  inputJsonPath: string;
  pdfPath?: string;
  maxIterations?: number;
  autoApplyFixes?: boolean;
  outputDir?: string;
  originalGeneratorPath?: string;
}

interface HealingResult {
  success: boolean;
  iterations: number;
  totalIssuesFound: number;
  totalIssuesFixed: number;
  appliedFixes: string[];
  finalPDFPath?: string;
  finalVersion: string;
  totalTime: number;
  error?: string;
  iterationResults: IterationResult[];
}

interface IterationResult {
  iteration: number;
  analysisResult: any;
  proposalResult: any;
  writeResult: any;
  logResult: any;
  regenerationResult: any;
  issuesFound: number;
  issuesAddressed: number;
  success: boolean;
  error?: string;
}

class SelfHealingPDFAgent {
  private baseDir: string;
  private mcpToolsDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
    this.mcpToolsDir = path.join(baseDir, 'mcp-tools');
  }

  async runSelfHealingCycle(config: SelfHealingConfig): Promise<HealingResult> {
    const startTime = Date.now();
    const maxIterations = config.maxIterations || 3;
    const iterationResults: IterationResult[] = [];
    
    let currentPDFPath = config.pdfPath;
    let currentVersion = 'v1';
    let totalIssuesFound = 0;
    let totalIssuesFixed = 0;
    let appliedFixes: string[] = [];

    console.log('🚀 Starting Self-Healing PDF Agent Cycle');
    console.log(`📋 Input: ${config.inputJsonPath}`);
    console.log(`📄 Initial PDF: ${currentPDFPath || 'Will be generated'}`);
    console.log(`🔄 Max iterations: ${maxIterations}`);
    console.log(`🤖 Auto-apply fixes: ${config.autoApplyFixes ? 'Yes' : 'No'}`);
    console.log('');

    try {
      // If no initial PDF provided, generate one first
      if (!currentPDFPath) {
        console.log('📄 No initial PDF provided, generating baseline...');
        const initialGeneration = await this.generateInitialPDF(config);
        currentPDFPath = initialGeneration.outputPath;
        currentVersion = initialGeneration.version;
      }

      for (let iteration = 1; iteration <= maxIterations; iteration++) {
        console.log(`\\n🔄 === Iteration ${iteration}/${maxIterations} ===`);
        
        const iterationResult = await this.runSingleIteration(
          iteration,
          config.inputJsonPath,
          currentPDFPath!,
          currentVersion,
          config
        );

        iterationResults.push(iterationResult);
        totalIssuesFound += iterationResult.issuesFound;
        totalIssuesFixed += iterationResult.issuesAddressed;

        if (iterationResult.success && iterationResult.regenerationResult?.success) {
          // Update for next iteration
          currentPDFPath = iterationResult.regenerationResult.outputPath;
          currentVersion = iterationResult.regenerationResult.version;
          appliedFixes.push(...iterationResult.regenerationResult.appliedFixes);
        }

        // If no issues found, we can stop
        if (iterationResult.issuesFound === 0) {
          console.log(`✅ No issues found in iteration ${iteration}. Self-healing complete!`);
          break;
        }

        // If fixes failed to apply, we might want to stop
        if (!iterationResult.success) {
          console.log(`❌ Iteration ${iteration} failed. Stopping self-healing cycle.`);
          break;
        }
      }

      const totalTime = Date.now() - startTime;

      console.log('\\n🏁 === Self-Healing Cycle Complete ===');
      console.log(`⏱️ Total time: ${totalTime}ms`);
      console.log(`🔄 Iterations: ${iterationResults.length}`);
      console.log(`🐛 Total issues found: ${totalIssuesFound}`);
      console.log(`🔧 Total issues fixed: ${totalIssuesFixed}`);
      console.log(`📄 Final PDF: ${currentPDFPath}`);
      console.log(`🔖 Final version: ${currentVersion}`);
      console.log(`✅ Applied fixes: ${appliedFixes.join(', ')}`);

      return {
        success: true,
        iterations: iterationResults.length,
        totalIssuesFound,
        totalIssuesFixed,
        appliedFixes,
        finalPDFPath: currentPDFPath,
        finalVersion: currentVersion,
        totalTime,
        iterationResults
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      console.error('❌ Self-healing cycle failed:', error);

      return {
        success: false,
        iterations: iterationResults.length,
        totalIssuesFound,
        totalIssuesFixed,
        appliedFixes,
        finalVersion: currentVersion,
        totalTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        iterationResults
      };
    }
  }

  private async runSingleIteration(
    iteration: number,
    inputJsonPath: string,
    pdfPath: string,
    currentVersion: string,
    config: SelfHealingConfig
  ): Promise<IterationResult> {
    const iterationStartTime = Date.now();
    
    try {
      console.log(`🔍 Step 1: Analyzing PDF (${path.basename(pdfPath)})`);
      
      // Step 1: Analyze PDF
      const analysisResult = await this.runPDFAnalysis(pdfPath, inputJsonPath);
      const issuesFound = analysisResult.issues?.length || 0;
      
      console.log(`📊 Found ${issuesFound} issues`);
      
      if (issuesFound === 0) {
        return {
          iteration,
          analysisResult,
          proposalResult: null,
          writeResult: null,
          logResult: null,
          regenerationResult: null,
          issuesFound: 0,
          issuesAddressed: 0,
          success: true
        };
      }

      // Step 2: Propose fixes
      console.log(`🧠 Step 2: Proposing fixes for ${issuesFound} issues`);
      const proposalResult = await this.runFixProposal(analysisResult, currentVersion);
      const proposedFixes = proposalResult.length || 0;
      
      console.log(`💡 Proposed ${proposedFixes} fixes`);

      // Step 3: Write fix modules
      console.log(`📝 Step 3: Writing ${proposedFixes} fix modules`);
      const writeResult = await this.runFixWriter(proposalResult);
      const writtenFixes = writeResult.filter((r: any) => r.success).length;
      
      console.log(`✅ Successfully wrote ${writtenFixes}/${proposedFixes} fix modules`);

      // Step 4: Log the fixes
      console.log(`📚 Step 4: Logging fixes to history`);
      const nextVersion = this.incrementVersion(currentVersion);
      const logResult = await this.runFixLogger(
        nextVersion,
        currentVersion,
        analysisResult.issues.map((i: any) => i.description),
        inputJsonPath,
        'pending', // Will be updated after regeneration
        writeResult.filter((r: any) => r.success).map((r: any) => path.basename(r.filePath, '.ts')),
        true
      );

      // Step 5: Regenerate PDF if auto-apply is enabled
      let regenerationResult = null;
      if (config.autoApplyFixes && writtenFixes > 0) {
        console.log(`🔄 Step 5: Regenerating PDF with applied fixes`);
        const fixModules = writeResult
          .filter((r: any) => r.success)
          .map((r: any) => path.basename(r.filePath));
        
        regenerationResult = await this.runPDFRegeneration(
          inputJsonPath,
          fixModules,
          config
        );
        
        if (regenerationResult.success) {
          console.log(`✅ PDF regenerated: ${regenerationResult.outputPath}`);
          // Update log with actual output path
          await this.updateLogWithOutput(logResult, regenerationResult.outputPath);
        } else {
          console.error(`❌ PDF regeneration failed: ${regenerationResult.error}`);
        }
      } else {
        console.log(`⏭️ Step 5: Skipping regeneration (auto-apply disabled or no fixes written)`);
      }

      const iterationTime = Date.now() - iterationStartTime;
      console.log(`⏱️ Iteration ${iteration} completed in ${iterationTime}ms`);

      return {
        iteration,
        analysisResult,
        proposalResult,
        writeResult,
        logResult,
        regenerationResult,
        issuesFound,
        issuesAddressed: writtenFixes,
        success: true
      };

    } catch (error) {
      console.error(`❌ Iteration ${iteration} failed:`, error);
      
      return {
        iteration,
        analysisResult: null,
        proposalResult: null,
        writeResult: null,
        logResult: null,
        regenerationResult: null,
        issuesFound: 0,
        issuesAddressed: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async generateInitialPDF(config: SelfHealingConfig): Promise<any> {
    // Use the existing SOW generation system to create initial PDF
    try {
      const { generateSOWWithEngineering } = await import('../server/core/sow-generator');
      const inputData = JSON.parse(await fs.readFile(config.inputJsonPath, 'utf-8'));
      
      const result = await generateSOWWithEngineering(inputData);
      
      if (!result.success) {
        throw new Error(`Initial PDF generation failed: ${result.error}`);
      }
      
      return {
        outputPath: result.outputPath,
        version: 'v1'
      };
    } catch (error) {
      throw new Error(`Could not generate initial PDF: ${error}`);
    }
  }

  private async runPDFAnalysis(pdfPath: string, inputJsonPath: string): Promise<any> {
    try {
      const analyzerPath = path.join(this.mcpToolsDir, 'analyze-pdf-output', 'index.ts');
      
      // Run the PDF analyzer
      const command = `npx tsx ${analyzerPath} "${pdfPath}" "${inputJsonPath}"`;
      const output = execSync(command, { 
        encoding: 'utf-8',
        cwd: this.baseDir,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      // Load the analysis result
      const resultPath = path.join(this.baseDir, 'pdf-analysis-result.json');
      const resultContent = await fs.readFile(resultPath, 'utf-8');
      return JSON.parse(resultContent);
      
    } catch (error) {
      throw new Error(`PDF analysis failed: ${error}`);
    }
  }

  private async runFixProposal(analysisResult: any, currentVersion: string): Promise<any[]> {
    try {
      const proposalPath = path.join(this.mcpToolsDir, 'propose-fix-snippet', 'index.ts');
      
      // Save analysis result to temporary file
      const tempAnalysisPath = path.join(this.baseDir, 'temp-analysis.json');
      await fs.writeFile(tempAnalysisPath, JSON.stringify(analysisResult, null, 2));
      
      // Run the fix proposal engine
      const command = `npx tsx ${proposalPath} "${tempAnalysisPath}" "${currentVersion}"`;
      execSync(command, { 
        encoding: 'utf-8',
        cwd: this.baseDir,
        stdio: 'inherit'
      });
      
      // Load the proposals
      const proposalsPath = path.join(this.baseDir, 'fix-proposals.json');
      const proposalsContent = await fs.readFile(proposalsPath, 'utf-8');
      const proposals = JSON.parse(proposalsContent);
      
      // Clean up temp file
      await fs.unlink(tempAnalysisPath);
      
      return Array.isArray(proposals) ? proposals : [proposals];
      
    } catch (error) {
      throw new Error(`Fix proposal failed: ${error}`);
    }
  }

  private async runFixWriter(proposals: any[]): Promise<any[]> {
    try {
      const writerPath = path.join(this.mcpToolsDir, 'write-fix-module', 'index.ts');
      
      // Save proposals to temporary file
      const tempProposalsPath = path.join(this.baseDir, 'temp-proposals.json');
      await fs.writeFile(tempProposalsPath, JSON.stringify(proposals, null, 2));
      
      // Run the fix writer
      const command = `npx tsx ${writerPath} write "${tempProposalsPath}"`;
      execSync(command, { 
        encoding: 'utf-8',
        cwd: this.baseDir,
        stdio: 'inherit'
      });
      
      // Generate results based on successful writes
      const results = [];
      for (const proposal of proposals) {
        const expectedPath = path.join(
          this.baseDir,
          'fixes',
          'snippets',
          `${proposal.targetModule}_${proposal.version}.ts`
        );
        
        try {
          await fs.access(expectedPath);
          results.push({
            success: true,
            filePath: expectedPath,
            version: proposal.version
          });
        } catch {
          results.push({
            success: false,
            filePath: expectedPath,
            version: proposal.version,
            error: 'File not found after write operation'
          });
        }
      }
      
      // Clean up temp file
      await fs.unlink(tempProposalsPath);
      
      return results;
      
    } catch (error) {
      throw new Error(`Fix writing failed: ${error}`);
    }
  }

  private async runFixLogger(
    version: string,
    basedOn: string,
    fixes: string[],
    inputPath: string,
    outputPath: string,
    targetModules: string[],
    success: boolean
  ): Promise<any> {
    try {
      const loggerPath = path.join(this.mcpToolsDir, 'log-fix-history', 'index.ts');
      
      // Run the fix logger
      const command = `npx tsx ${loggerPath} log "${version}" "${inputPath}" "${outputPath}" "${success}" ${fixes.map(f => `"${f}"`).join(' ')}`;
      execSync(command, { 
        encoding: 'utf-8',
        cwd: this.baseDir,
        stdio: 'inherit'
      });
      
      return {
        version,
        basedOn,
        fixes,
        inputPath,
        outputPath,
        success
      };
      
    } catch (error) {
      throw new Error(`Fix logging failed: ${error}`);
    }
  }

  private async runPDFRegeneration(
    inputJsonPath: string,
    fixModules: string[],
    config: SelfHealingConfig
  ): Promise<any> {
    try {
      const regenerationPath = path.join(this.mcpToolsDir, 'trigger-regeneration', 'index.ts');
      
      // Run the PDF regeneration
      const command = `npx tsx ${regenerationPath} generate "${inputJsonPath}" ${fixModules.map(f => `"${f}"`).join(' ')}`;
      const output = execSync(command, { 
        encoding: 'utf-8',
        cwd: this.baseDir,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      // Parse the output to extract result information
      // This is a simplified approach - in practice, you'd want structured output
      const lines = output.split('\\n');
      const outputLine = lines.find(line => line.includes('Output:'));
      const versionLine = lines.find(line => line.includes('Version:'));
      const timeLine = lines.find(line => line.includes('Time:'));
      const sizeLine = lines.find(line => line.includes('Size:'));
      
      return {
        success: !output.includes('❌'),
        outputPath: outputLine?.split('Output: ')[1]?.trim(),
        version: versionLine?.split('Version: ')[1]?.trim(),
        generationTime: timeLine ? parseInt(timeLine.split('Time: ')[1]) : 0,
        fileSize: sizeLine ? parseInt(sizeLine.split('Size: ')[1]) : 0,
        appliedFixes: fixModules
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        appliedFixes: fixModules
      };
    }
  }

  private async updateLogWithOutput(logResult: any, outputPath: string): Promise<void> {
    // Update the log entry with the actual output path
    // This would involve re-reading and updating the change log
    try {
      const changeLogPath = path.join(this.baseDir, 'fixes', 'change_log.json');
      const changeLog = JSON.parse(await fs.readFile(changeLogPath, 'utf-8'));
      
      // Find the most recent entry (should be the one we just logged)
      if (changeLog.fixes.length > 0) {
        const lastEntry = changeLog.fixes[changeLog.fixes.length - 1];
        if (lastEntry.output === 'pending') {
          lastEntry.output = outputPath;
          await fs.writeFile(changeLogPath, JSON.stringify(changeLog, null, 2));
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not update log with output path:', error);
    }
  }

  private incrementVersion(currentVersion: string): string {
    const match = currentVersion.match(/v(\\d+)/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      return `v${num}`;
    }
    return 'v2';
  }

  async generateReport(): Promise<string> {
    try {
      const loggerPath = path.join(this.mcpToolsDir, 'log-fix-history', 'index.ts');
      
      const output = execSync(`npx tsx ${loggerPath} report`, {
        encoding: 'utf-8',
        cwd: this.baseDir
      });
      
      return output;
      
    } catch (error) {
      throw new Error(`Report generation failed: ${error}`);
    }
  }

  async listAvailableFixes(): Promise<string[]> {
    try {
      const regenerationPath = path.join(this.mcpToolsDir, 'trigger-regeneration', 'index.ts');
      
      const output = execSync(`npx tsx ${regenerationPath} list-fixes`, {
        encoding: 'utf-8',
        cwd: this.baseDir
      });
      
      // Parse the output to extract fix names
      const lines = output.split('\\n');
      const fixLines = lines.filter(line => line.trim().startsWith('- '));
      return fixLines.map(line => line.trim().substring(2));
      
    } catch (error) {
      console.warn('Could not list available fixes:', error);
      return [];
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const agent = new SelfHealingPDFAgent();

  if (command === 'heal') {
    const inputJsonPath = args[1];
    const pdfPath = args[2];
    const maxIterations = args[3] ? parseInt(args[3]) : 3;
    const autoApply = args[4] !== 'false';

    if (!inputJsonPath) {
      console.error('Usage: self-healing-agent heal <input-json-path> [pdf-path] [max-iterations] [auto-apply]');
      console.error('');
      console.error('Examples:');
      console.error('  self-healing-agent heal input.json output.pdf 3 true');
      console.error('  self-healing-agent heal input.json');
      process.exit(1);
    }

    try {
      const result = await agent.runSelfHealingCycle({
        inputJsonPath,
        pdfPath,
        maxIterations,
        autoApplyFixes: autoApply
      });

      if (result.success) {
        console.log('\\n🎉 Self-healing completed successfully!');
        console.log(`📊 Summary: ${result.totalIssuesFixed}/${result.totalIssuesFound} issues fixed in ${result.iterations} iterations`);
        console.log(`📄 Final PDF: ${result.finalPDFPath}`);
      } else {
        console.error('❌ Self-healing failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }

  } else if (command === 'report') {
    try {
      const report = await agent.generateReport();
      console.log(report);
    } catch (error) {
      console.error('Error generating report:', error);
      process.exit(1);
    }

  } else if (command === 'list-fixes') {
    try {
      const fixes = await agent.listAvailableFixes();
      console.log('Available fixes:');
      fixes.forEach(fix => console.log(`  - ${fix}`));
    } catch (error) {
      console.error('Error listing fixes:', error);
      process.exit(1);
    }

  } else {
    console.log('Self-Healing PDF Agent - Orchestrator');
    console.log('');
    console.log('Usage: self-healing-agent <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  heal <input-json> [pdf] [iterations] [auto-apply]  Run self-healing cycle');
    console.log('  report                                             Generate fix history report');
    console.log('  list-fixes                                         List available fix modules');
    console.log('');
    console.log('Examples:');
    console.log('  self-healing-agent heal input.json output.pdf 3 true');
    console.log('  self-healing-agent heal input.json');
    console.log('  self-healing-agent report');
    console.log('  self-healing-agent list-fixes');
    console.log('');
    console.log('The self-healing cycle:');
    console.log('  1. 🔍 Analyze PDF output for issues');
    console.log('  2. 🧠 Propose targeted code fixes');
    console.log('  3. 📝 Write versioned fix modules');
    console.log('  4. 📚 Log fixes to history');
    console.log('  5. 🔄 Regenerate PDF with fixes applied');
    console.log('');
    console.log('Configuration:');
    console.log('  - Max iterations: How many times to attempt fixing (default: 3)');
    console.log('  - Auto-apply: Whether to automatically apply fixes (default: true)');
    console.log('  - All fixes are versioned and tracked for full traceability');
  }
}

// Export for use as module
export { SelfHealingPDFAgent, type SelfHealingConfig, type HealingResult };

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
