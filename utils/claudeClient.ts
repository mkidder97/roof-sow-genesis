/**
 * Claude API Client for Self-Healing PDF System
 * Provides integration with Claude API when not running inside Claude's environment
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface ClaudeRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface ClaudeResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
  stop_reason: string;
}

export interface ClaudeClientConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  logRequests: boolean;
  logDir: string;
}

export class ClaudeAPIClient {
  private client: Anthropic | null = null;
  private config: ClaudeClientConfig;
  private requestCount = 0;

  constructor(config?: Partial<ClaudeClientConfig>) {
    this.config = {
      apiKey: process.env.CLAUDE_API_KEY,
      model: 'claude-3-opus-20240229',
      maxTokens: 4096,
      temperature: 0.1,
      timeout: 30000,
      retryAttempts: 3,
      logRequests: true,
      logDir: './logs/claude-api',
      ...config,
    };

    if (this.config.apiKey) {
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
      });
    }
  }

  /**
   * Check if Claude API is available and configured
   */
  isAvailable(): boolean {
    return this.client !== null && !!this.config.apiKey;
  }

  /**
   * Send a request to Claude API with retry logic
   */
  async sendRequest(request: ClaudeRequest): Promise<ClaudeResponse> {
    if (!this.isAvailable()) {
      throw new Error('Claude API is not configured. Set CLAUDE_API_KEY environment variable.');
    }

    const requestId = ++this.requestCount;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(request, requestId, attempt);
        
        if (this.config.logRequests) {
          await this.logRequest(request, response, requestId, attempt);
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Claude API attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.retryAttempts) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All Claude API attempts failed');
  }

  /**
   * Make actual API request to Claude
   */
  private async makeRequest(
    request: ClaudeRequest,
    requestId: number,
    attempt: number
  ): Promise<ClaudeResponse> {
    if (!this.client) {
      throw new Error('Claude client not initialized');
    }

    const messages: Anthropic.Messages.MessageParam[] = [
      {
        role: 'user',
        content: request.prompt,
      },
    ];

    const params: Anthropic.Messages.MessageCreateParams = {
      model: request.model || this.config.model,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      messages,
    };

    if (request.systemPrompt) {
      params.system = request.systemPrompt;
    }

    const startTime = Date.now();
    
    try {
      const response = await this.client.messages.create(params);
      const duration = Date.now() - startTime;

      console.log(`Claude API request ${requestId}-${attempt} completed in ${duration}ms`);

      // Extract text content from response
      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      return {
        content,
        usage: response.usage,
        model: response.model,
        stop_reason: response.stop_reason,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Claude API request ${requestId}-${attempt} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Log API request and response for debugging
   */
  private async logRequest(
    request: ClaudeRequest,
    response: ClaudeResponse,
    requestId: number,
    attempt: number
  ): Promise<void> {
    try {
      await mkdir(this.config.logDir, { recursive: true });

      const logEntry = {
        timestamp: new Date().toISOString(),
        requestId,
        attempt,
        request: {
          prompt: request.prompt.substring(0, 500) + (request.prompt.length > 500 ? '...' : ''),
          systemPrompt: request.systemPrompt?.substring(0, 200) + (request.systemPrompt && request.systemPrompt.length > 200 ? '...' : ''),
          maxTokens: request.maxTokens,
          temperature: request.temperature,
          model: request.model,
        },
        response: {
          content: response.content.substring(0, 500) + (response.content.length > 500 ? '...' : ''),
          usage: response.usage,
          model: response.model,
          stop_reason: response.stop_reason,
        },
      };

      const logFile = join(this.config.logDir, `claude-api-${new Date().toISOString().split('T')[0]}.json`);
      
      let logData: any[] = [];
      try {
        const existingLog = await readFile(logFile, 'utf-8');
        logData = JSON.parse(existingLog);
      } catch {
        // File doesn't exist or is invalid
      }

      logData.push(logEntry);
      await writeFile(logFile, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.warn('Failed to log Claude API request:', error);
    }
  }

  /**
   * Send a fix generation request
   */
  async generateFix(
    analysisData: Record<string, any>,
    errorDescription: string,
    context?: string
  ): Promise<string> {
    const systemPrompt = `You are an expert TypeScript/JavaScript developer working on a self-healing PDF generation system for SOW (Scope of Work) documents. 

Your task is to analyze PDF generation issues and provide precise fixes. The system generates construction documents with wind load calculations, attachment schedules, and technical specifications.

Key areas of expertise needed:
- PDF generation with proper layout and formatting
- Wind load calculations per ASCE standards
- Construction document structure and content
- TypeScript/JavaScript debugging and optimization
- Regex patterns for content validation
- CSS-like styling for PDF layouts

Always provide:
1. Clear explanation of the issue
2. Precise code fix with proper syntax
3. Any necessary imports or dependencies
4. Comments explaining the solution

Focus on maintainable, production-ready code that follows best practices.`;

    const prompt = `Please analyze the following PDF generation issue and provide a fix:

## Error Description:
${errorDescription}

## Analysis Data:
${JSON.stringify(analysisData, null, 2)}

${context ? `## Additional Context:\n${context}` : ''}

## Requirements:
- Provide a complete, working fix
- Include any necessary imports
- Add comments explaining the changes
- Ensure the fix maintains backward compatibility
- Follow TypeScript best practices

Please provide your response as a complete code block with explanations.`;

    const response = await this.sendRequest({
      prompt,
      systemPrompt,
      maxTokens: 3000,
      temperature: 0.1,
    });

    return response.content;
  }

  /**
   * Send a code analysis request
   */
  async analyzeCode(
    code: string,
    issueDescription: string,
    expectedBehavior: string
  ): Promise<string> {
    const systemPrompt = `You are a senior code reviewer specializing in PDF generation systems and construction document automation.

Analyze the provided code for:
- Logic errors and bugs
- Performance issues
- Type safety problems
- Best practice violations
- Potential runtime errors

Provide specific, actionable feedback with code examples.`;

    const prompt = `Please analyze this code for issues:

## Issue Description:
${issueDescription}

## Expected Behavior:
${expectedBehavior}

## Code to Analyze:
\`\`\`typescript
${code}
\`\`\`

Please provide:
1. Identified issues with line numbers
2. Root cause analysis
3. Recommended fixes with code examples
4. Prevention strategies for similar issues`;

    const response = await this.sendRequest({
      prompt,
      systemPrompt,
      maxTokens: 2500,
      temperature: 0.1,
    });

    return response.content;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    requestCount: number;
    isConfigured: boolean;
    model: string;
  } {
    return {
      requestCount: this.requestCount,
      isConfigured: this.isAvailable(),
      model: this.config.model,
    };
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const response = await this.sendRequest({
        prompt: 'Hello! Please respond with "API connection successful" to confirm the connection is working.',
        maxTokens: 50,
        temperature: 0,
      });

      return response.content.toLowerCase().includes('successful');
    } catch (error) {
      console.error('Claude API connection test failed:', error);
      return false;
    }
  }
}

// Configuration helper
export function createClaudeClientConfig(): ClaudeClientConfig {
  return {
    apiKey: process.env.CLAUDE_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096'),
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.1'),
    timeout: parseInt(process.env.CLAUDE_TIMEOUT_MS || '30000'),
    retryAttempts: parseInt(process.env.CLAUDE_RETRY_ATTEMPTS || '3'),
    logRequests: process.env.CLAUDE_LOG_REQUESTS !== 'false',
    logDir: process.env.CLAUDE_LOG_DIR || './logs/claude-api',
  };
}

// Export singleton instance
export const claudeClient = new ClaudeAPIClient(createClaudeClientConfig());

// Utility functions
export async function generateFixWithClaude(
  analysisData: Record<string, any>,
  errorDescription: string,
  context?: string
): Promise<string> {
  return claudeClient.generateFix(analysisData, errorDescription, context);
}

export async function analyzeCodeWithClaude(
  code: string,
  issueDescription: string,
  expectedBehavior: string
): Promise<string> {
  return claudeClient.analyzeCode(code, issueDescription, expectedBehavior);
}

export function isClaudeAPIAvailable(): boolean {
  return claudeClient.isAvailable();
}

// CLI utility for testing connection
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log('🔧 Testing Claude API connection...');
    
    try {
      const isAvailable = claudeClient.isAvailable();
      console.log(`📋 API Configured: ${isAvailable}`);
      
      if (isAvailable) {
        const connectionTest = await claudeClient.testConnection();
        console.log(`🌐 Connection Test: ${connectionTest ? 'PASSED' : 'FAILED'}`);
        
        const stats = claudeClient.getUsageStats();
        console.log(`📊 Usage Stats:`, stats);
      } else {
        console.log('⚠️  Claude API not configured. Set CLAUDE_API_KEY environment variable.');
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
    }
  })();
}
