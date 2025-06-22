/**
 * PDF Layout Comparison Utility for Regression Testing
 * Uses Puppeteer to extract layout structure and validate PDFs against expectations
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { readFile } from 'fs/promises';
import { join } from 'path';
import supabaseClient from '../utils/supabaseClient.js';

export interface LayoutElement {
  type: 'text' | 'image' | 'table' | 'spacing';
  content?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styles: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
  };
  metadata?: Record<string, any>;
}

export interface LayoutSection {
  name: string;
  elements: LayoutElement[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PDFLayout {
  pages: Array<{
    pageNumber: number;
    sections: LayoutSection[];
    dimensions: {
      width: number;
      height: number;
    };
  }>;
  metadata: {
    totalPages: number;
    extractedAt: string;
    documentTitle?: string;
  };
}

export interface LayoutComparison {
  isMatch: boolean;
  confidence: number; // 0-1
  differences: Array<{
    type: 'missing' | 'extra' | 'modified' | 'position' | 'style';
    section: string;
    element?: LayoutElement;
    expected?: LayoutElement;
    actual?: LayoutElement;
    description: string;
  }>;
  summary: {
    totalElements: number;
    matchingElements: number;
    missingElements: number;
    extraElements: number;
    modifiedElements: number;
  };
}

export interface LayoutExpectations {
  sections: Array<{
    name: string;
    required: boolean;
    minElements?: number;
    maxElements?: number;
    expectedElements?: Array<{
      type: LayoutElement['type'];
      contentPattern?: RegExp;
      position?: {
        minX?: number;
        maxX?: number;
        minY?: number;
        maxY?: number;
      };
      styles?: Partial<LayoutElement['styles']>;
    }>;
  }>;
  globalExpectations: {
    minPages?: number;
    maxPages?: number;
    requiredSections?: string[];
    fontSizeRange?: { min: number; max: number };
    colorScheme?: string[];
  };
}

export class PDFLayoutAnalyzer {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Extract layout structure from a PDF file
   */
  async extractPDFLayout(pdfPath: string): Promise<PDFLayout> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Convert PDF to HTML representation for analysis
      const pdfUrl = `file://${pdfPath}`;
      await page.goto(pdfUrl, { waitUntil: 'networkidle2' });

      // Extract page dimensions
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }));

      // Extract layout elements
      const elements = await this.extractElementsFromPage(page);
      
      // Group elements into logical sections
      const sections = this.groupElementsIntoSections(elements);

      return {
        pages: [{
          pageNumber: 1,
          sections,
          dimensions,
        }],
        metadata: {
          totalPages: 1,
          extractedAt: new Date().toISOString(),
          documentTitle: await page.title(),
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Extract all layout elements from a page
   */
  private async extractElementsFromPage(page: Page): Promise<LayoutElement[]> {
    return page.evaluate(() => {
      const elements: LayoutElement[] = [];
      
      // Extract text elements
      const textNodes = document.evaluate(
        '//text()[normalize-space()]',
        document,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
      );

      for (let i = 0; i < textNodes.snapshotLength; i++) {
        const node = textNodes.snapshotItem(i);
        if (node && node.parentElement) {
          const element = node.parentElement;
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);

          elements.push({
            type: 'text',
            content: node.textContent?.trim() || '',
            position: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            },
            styles: {
              fontSize: parseFloat(styles.fontSize),
              fontFamily: styles.fontFamily,
              fontWeight: styles.fontWeight,
              color: styles.color,
              backgroundColor: styles.backgroundColor,
            },
          });
        }
      }

      // Extract images
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        const rect = img.getBoundingClientRect();
        elements.push({
          type: 'image',
          content: img.src,
          position: {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          },
          styles: {},
          metadata: {
            alt: img.alt,
            src: img.src,
          },
        });
      });

      // Extract tables
      const tables = document.querySelectorAll('table');
      tables.forEach((table) => {
        const rect = table.getBoundingClientRect();
        elements.push({
          type: 'table',
          position: {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          },
          styles: {},
          metadata: {
            rows: table.rows.length,
            columns: table.rows[0]?.cells.length || 0,
          },
        });
      });

      return elements;
    });
  }

  /**
   * Group elements into logical sections based on position and content
   */
  private groupElementsIntoSections(elements: LayoutElement[]): LayoutSection[] {
    const sections: LayoutSection[] = [];
    
    // Sort elements by Y position to process top to bottom
    const sortedElements = [...elements].sort((a, b) => a.position.y - b.position.y);
    
    let currentSection: LayoutSection | null = null;
    const sectionThreshold = 50; // pixels - vertical gap to start new section

    for (const element of sortedElements) {
      // Determine section name based on content and position
      const sectionName = this.determineSectionName(element);
      
      // Check if we need to start a new section
      if (!currentSection || 
          currentSection.name !== sectionName ||
          (currentSection.elements.length > 0 && 
           element.position.y - Math.max(...currentSection.elements.map(e => e.position.y + e.position.height)) > sectionThreshold)) {
        
        currentSection = {
          name: sectionName,
          elements: [],
          bounds: {
            x: element.position.x,
            y: element.position.y,
            width: element.position.width,
            height: element.position.height,
          },
        };
        sections.push(currentSection);
      }
      
      // Add element to current section
      currentSection.elements.push(element);
      
      // Update section bounds
      currentSection.bounds.x = Math.min(currentSection.bounds.x, element.position.x);
      currentSection.bounds.y = Math.min(currentSection.bounds.y, element.position.y);
      currentSection.bounds.width = Math.max(
        currentSection.bounds.width,
        element.position.x + element.position.width - currentSection.bounds.x
      );
      currentSection.bounds.height = Math.max(
        currentSection.bounds.height,
        element.position.y + element.position.height - currentSection.bounds.y
      );
    }

    return sections;
  }

  /**
   * Determine section name based on element content and position
   */
  private determineSectionName(element: LayoutElement): string {
    if (element.type === 'text' && element.content) {
      const content = element.content.toLowerCase();
      
      // Header patterns
      if (content.includes('scope of work') || content.includes('project manual')) {
        return 'header';
      }
      
      // Wind load sections
      if (content.includes('wind') && (content.includes('load') || content.includes('pressure'))) {
        return 'wind-loads';
      }
      
      // Attachment sections
      if (content.includes('attachment') || content.includes('fastener')) {
        return 'attachment-schedule';
      }
      
      // Material sections
      if (content.includes('material') || content.includes('membrane') || content.includes('insulation')) {
        return 'materials';
      }
      
      // Submittal sections
      if (content.includes('submittal') || content.includes('approval')) {
        return 'submittals';
      }
      
      // Detail sections
      if (content.includes('detail') || content.includes('drawing')) {
        return 'details';
      }
    }
    
    // Default to position-based section
    if (element.position.y < 200) return 'header';
    if (element.position.y > 600) return 'footer';
    return 'body';
  }

  /**
   * Compare two PDF layouts
   */
  comparePDFLayouts(expected: PDFLayout, actual: PDFLayout): LayoutComparison {
    const differences: LayoutComparison['differences'] = [];
    let totalElements = 0;
    let matchingElements = 0;

    // Compare each section
    for (const expectedPage of expected.pages) {
      const actualPage = actual.pages.find(p => p.pageNumber === expectedPage.pageNumber);
      
      if (!actualPage) {
        differences.push({
          type: 'missing',
          section: `page-${expectedPage.pageNumber}`,
          description: `Page ${expectedPage.pageNumber} is missing`,
        });
        continue;
      }

      for (const expectedSection of expectedPage.sections) {
        const actualSection = actualPage.sections.find(s => s.name === expectedSection.name);
        totalElements += expectedSection.elements.length;

        if (!actualSection) {
          differences.push({
            type: 'missing',
            section: expectedSection.name,
            description: `Section "${expectedSection.name}" is missing`,
          });
          continue;
        }

        // Compare elements within section
        const sectionComparison = this.compareSectionElements(expectedSection, actualSection);
        differences.push(...sectionComparison.differences);
        matchingElements += sectionComparison.matchingElements;
      }
    }

    const confidence = totalElements > 0 ? matchingElements / totalElements : 0;
    const isMatch = confidence >= 0.85 && differences.filter(d => d.type === 'missing').length === 0;

    return {
      isMatch,
      confidence,
      differences,
      summary: {
        totalElements,
        matchingElements,
        missingElements: differences.filter(d => d.type === 'missing').length,
        extraElements: differences.filter(d => d.type === 'extra').length,
        modifiedElements: differences.filter(d => d.type === 'modified').length,
      },
    };
  }

  /**
   * Compare elements within a section
   */
  private compareSectionElements(expected: LayoutSection, actual: LayoutSection) {
    const differences: LayoutComparison['differences'] = [];
    let matchingElements = 0;

    for (const expectedElement of expected.elements) {
      const actualElement = this.findMatchingElement(expectedElement, actual.elements);
      
      if (!actualElement) {
        differences.push({
          type: 'missing',
          section: expected.name,
          expected: expectedElement,
          description: `Element missing in section "${expected.name}"`,
        });
        continue;
      }

      // Check for modifications
      const elementDiffs = this.compareElements(expectedElement, actualElement);
      if (elementDiffs.length > 0) {
        differences.push(...elementDiffs.map(diff => ({
          ...diff,
          section: expected.name,
        })));
      } else {
        matchingElements++;
      }
    }

    return { differences, matchingElements };
  }

  /**
   * Find a matching element based on content and position
   */
  private findMatchingElement(target: LayoutElement, candidates: LayoutElement[]): LayoutElement | null {
    // First try exact content match
    const contentMatch = candidates.find(c => 
      c.type === target.type && 
      c.content === target.content
    );
    
    if (contentMatch) return contentMatch;

    // Then try position-based match with some tolerance
    const positionTolerance = 10;
    return candidates.find(c =>
      c.type === target.type &&
      Math.abs(c.position.x - target.position.x) <= positionTolerance &&
      Math.abs(c.position.y - target.position.y) <= positionTolerance
    ) || null;
  }

  /**
   * Compare two individual elements
   */
  private compareElements(expected: LayoutElement, actual: LayoutElement): Array<Omit<LayoutComparison['differences'][0], 'section'>> {
    const differences: Array<Omit<LayoutComparison['differences'][0], 'section'>> = [];

    // Content comparison
    if (expected.content !== actual.content) {
      differences.push({
        type: 'modified',
        expected,
        actual,
        description: `Content mismatch: expected "${expected.content}", got "${actual.content}"`,
      });
    }

    // Position comparison (with tolerance)
    const positionTolerance = 5;
    if (Math.abs(expected.position.x - actual.position.x) > positionTolerance ||
        Math.abs(expected.position.y - actual.position.y) > positionTolerance) {
      differences.push({
        type: 'position',
        expected,
        actual,
        description: `Position mismatch: expected (${expected.position.x}, ${expected.position.y}), got (${actual.position.x}, ${actual.position.y})`,
      });
    }

    // Style comparison
    if (expected.styles.fontSize !== actual.styles.fontSize) {
      differences.push({
        type: 'style',
        expected,
        actual,
        description: `Font size mismatch: expected ${expected.styles.fontSize}, got ${actual.styles.fontSize}`,
      });
    }

    return differences;
  }

  /**
   * Validate PDF against expectations
   */
  async validatePDFLayout(pdfPath: string, expectations: LayoutExpectations): Promise<LayoutComparison> {
    const layout = await this.extractPDFLayout(pdfPath);
    const differences: LayoutComparison['differences'] = [];
    let totalElements = 0;
    let matchingElements = 0;

    // Validate global expectations
    if (expectations.globalExpectations.minPages && layout.metadata.totalPages < expectations.globalExpectations.minPages) {
      differences.push({
        type: 'missing',
        section: 'global',
        description: `Insufficient pages: expected at least ${expectations.globalExpectations.minPages}, got ${layout.metadata.totalPages}`,
      });
    }

    // Validate required sections
    for (const page of layout.pages) {
      for (const expectedSection of expectations.sections) {
        const actualSection = page.sections.find(s => s.name === expectedSection.name);
        totalElements++;

        if (expectedSection.required && !actualSection) {
          differences.push({
            type: 'missing',
            section: expectedSection.name,
            description: `Required section "${expectedSection.name}" is missing`,
          });
          continue;
        }

        if (actualSection) {
          matchingElements++;
          
          // Validate element count
          if (expectedSection.minElements && actualSection.elements.length < expectedSection.minElements) {
            differences.push({
              type: 'missing',
              section: expectedSection.name,
              description: `Section "${expectedSection.name}" has insufficient elements: expected at least ${expectedSection.minElements}, got ${actualSection.elements.length}`,
            });
          }
        }
      }
    }

    const confidence = totalElements > 0 ? matchingElements / totalElements : 0;
    const isMatch = confidence >= 0.85 && differences.filter(d => d.type === 'missing').length === 0;

    return {
      isMatch,
      confidence,
      differences,
      summary: {
        totalElements,
        matchingElements,
        missingElements: differences.filter(d => d.type === 'missing').length,
        extraElements: differences.filter(d => d.type === 'extra').length,
        modifiedElements: differences.filter(d => d.type === 'modified').length,
      },
    };
  }

  /**
   * Log comparison results to Supabase
   */
  async logComparisonResults(
    pdfVersionId: string,
    comparison: LayoutComparison,
    testType: 'regression' | 'validation' | 'comparison' = 'regression'
  ): Promise<void> {
    await supabaseClient.logTestResult({
      pdfVersionId,
      testType,
      testName: 'layout_comparison',
      passed: comparison.isMatch,
      expectedResult: { confidence_threshold: 0.85 },
      actualResult: { 
        confidence: comparison.confidence,
        summary: comparison.summary 
      },
      diffData: { differences: comparison.differences },
    });
  }
}

// Export default instance
export const pdfLayoutAnalyzer = new PDFLayoutAnalyzer();

// Utility function for quick layout comparison
export async function comparePDFLayouts(
  expectedPdfPath: string,
  actualPdfPath: string,
  logToPdfVersionId?: string
): Promise<LayoutComparison> {
  const analyzer = new PDFLayoutAnalyzer();
  
  try {
    await analyzer.initialize();
    
    const expectedLayout = await analyzer.extractPDFLayout(expectedPdfPath);
    const actualLayout = await analyzer.extractPDFLayout(actualPdfPath);
    
    const comparison = analyzer.comparePDFLayouts(expectedLayout, actualLayout);
    
    if (logToPdfVersionId) {
      await analyzer.logComparisonResults(logToPdfVersionId, comparison);
    }
    
    return comparison;
  } finally {
    await analyzer.cleanup();
  }
}
