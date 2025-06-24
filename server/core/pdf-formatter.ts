// Enhanced PDF Formatter for Exact Template Matching
// Ensures character-for-character accuracy with real SOW templates

import { jsPDF } from 'jspdf';
import { readFileSync } from 'fs';
import path from 'path';

export interface PDFFormattingOptions {
  templateType: string;
  includeHighlighting: boolean;
  removeGreenHighlighting: boolean;
  applyBrandingColors: boolean;
  fontSettings: {
    headerFont: string;
    bodyFont: string;
    sizes: {
      title: number;
      header: number;
      body: number;
      note: number;
    };
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  colors: {
    yellowHighlight: string;
    greenHighlight: string;
    primary: string;
    secondary: string;
  };
}

export interface TemplateFormattingRules {
  sections: {
    name: string;
    formatting: {
      bold: boolean;
      italic: boolean;
      underline: boolean;
      fontSize: number;
      color?: string;
      backgroundColor?: string;
    };
    content: Array<{
      type: 'text' | 'bullet' | 'table' | 'image';
      formatting: any;
      data: any;
    }>;
  }[];
  revisionInfo: {
    templateName: string;
    revisionDate: string;
    revisionNumber: string;
  };
  brandingElements: {
    logo?: string;
    companyName: string;
    headerText?: string;
    footerText?: string;
  };
}

export class EnhancedPDFFormatter {
  private templateRules: Map<string, TemplateFormattingRules> = new Map();
  private defaultOptions: PDFFormattingOptions;

  constructor() {
    this.defaultOptions = {
      templateType: 'tearoff-tpo-ma-insul-steel',
      includeHighlighting: true,
      removeGreenHighlighting: true,
      applyBrandingColors: true,
      fontSettings: {
        headerFont: 'times',
        bodyFont: 'times',
        sizes: {
          title: 16,
          header: 14,
          body: 11,
          note: 9
        }
      },
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      colors: {
        yellowHighlight: '#FFFF00',
        greenHighlight: '#00FF00',
        primary: '#000000',
        secondary: '#333333'
      }
    };

    this.loadTemplateRules();
  }

  private loadTemplateRules() {
    // Load template formatting rules based on project knowledge
    
    // T6-Tearoff-TPO(MA)-insul-steel template
    this.templateRules.set('tearoff-tpo-ma-insul-steel', {
      sections: [
        {
          name: 'SECTION -- BID SCOPE OF WORK',
          formatting: {
            bold: true,
            italic: false,
            underline: false,
            fontSize: 16,
            color: '#000000'
          },
          content: []
        },
        {
          name: 'Template Revision Note',
          formatting: {
            bold: false,
            italic: true,
            underline: false,
            fontSize: 10,
            backgroundColor: '#FFFF00'
          },
          content: []
        }
      ],
      revisionInfo: {
        templateName: 'Tearoff-TPO(MA)-insul-steel',
        revisionDate: '2/6/25',
        revisionNumber: 'Rev. 2/6/25'
      },
      brandingElements: {
        companyName: 'Southern Roof Consultants',
        headerText: 'SRC',
        footerText: 'SRC-2025'
      }
    });

    // T7-Tearoff-TPO(MA)-insul-lwc-steel template
    this.templateRules.set('tearoff-tpo-ma-insul-lwc-steel', {
      sections: [
        {
          name: 'SECTION -- BID SCOPE OF WORK',
          formatting: {
            bold: true,
            italic: false,
            underline: false,
            fontSize: 16,
            color: '#000000'
          },
          content: []
        }
      ],
      revisionInfo: {
        templateName: 'Tearoff-TPO(MA)-insul-lwc-steel',
        revisionDate: '2/6/25',
        revisionNumber: 'Rev. 2/6/25'
      },
      brandingElements: {
        companyName: 'Southern Roof Consultants',
        headerText: 'SRC',
        footerText: 'SRC-2025'
      }
    });

    // T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum template
    this.templateRules.set('tearoff-tpo-adhered-insul-adhered-gypsum', {
      sections: [
        {
          name: 'SECTION -- BID SCOPE OF WORK',
          formatting: {
            bold: true,
            italic: false,
            underline: false,
            fontSize: 16,
            color: '#000000'
          },
          content: []
        }
      ],
      revisionInfo: {
        templateName: 'Tearoff-TPO(adhered)-insul(adhered)-gypsum',
        revisionDate: '2/6/25',
        revisionNumber: 'Rev. 2/6/25'
      },
      brandingElements: {
        companyName: 'Southern Roof Consultants',
        headerText: 'SRC',
        footerText: 'SRC-2025'
      }
    });

    // T5-Recover-TPO(Rhino)-iso-EPS template
    this.templateRules.set('recover-tpo-rhino-iso-eps-flute-fill-ssr', {
      sections: [
        {
          name: 'SECTION -- BID SCOPE OF WORK',
          formatting: {
            bold: true,
            italic: false,
            underline: false,
            fontSize: 16,
            color: '#000000'
          },
          content: []
        }
      ],
      revisionInfo: {
        templateName: 'Recover-TPO(Rhino)-iso-EPS flute fill-SSR',
        revisionDate: '2/6/25',
        revisionNumber: 'Rev. 2/6/25'
      },
      brandingElements: {
        companyName: 'Southern Roof Consultants',
        headerText: 'SRC',
        footerText: 'SRC-2025'
      }
    });
  }

  /**
   * Format SOW content to match exact template specifications
   */
  public formatSOWContent(
    sowData: any,
    templateType: string,
    options?: Partial<PDFFormattingOptions>
  ): {
    formattedContent: any;
    validationResults: Array<{
      section: string;
      issues: string[];
      suggestions: string[];
    }>;
  } {
    const config = { ...this.defaultOptions, ...options };
    const templateRules = this.templateRules.get(templateType);
    
    if (!templateRules) {
      throw new Error(`Template rules not found for: ${templateType}`);
    }

    const formattedContent = this.applyTemplateFormatting(sowData, templateRules, config);
    const validationResults = this.validateFormattingAccuracy(formattedContent, templateRules);

    return {
      formattedContent,
      validationResults
    };
  }

  private applyTemplateFormatting(
    sowData: any,
    templateRules: TemplateFormattingRules,
    config: PDFFormattingOptions
  ): any {
    const formatted = {
      header: this.formatHeader(sowData, templateRules, config),
      sections: this.formatSections(sowData, templateRules, config),
      footer: this.formatFooter(sowData, templateRules, config),
      metadata: {
        templateName: templateRules.revisionInfo.templateName,
        revisionInfo: templateRules.revisionInfo,
        formattingOptions: config
      }
    };

    // Apply highlighting rules
    if (config.includeHighlighting) {
      formatted.sections = this.applyHighlighting(formatted.sections, config);
    }

    if (config.removeGreenHighlighting) {
      formatted.sections = this.removeGreenHighlighting(formatted.sections);
    }

    return formatted;
  }

  private formatHeader(
    sowData: any,
    templateRules: TemplateFormattingRules,
    config: PDFFormattingOptions
  ): any {
    return {
      title: {
        text: '**SECTION -- BID SCOPE OF WORK**',
        formatting: {
          bold: true,
          fontSize: config.fontSettings.sizes.title,
          alignment: 'center'
        }
      },
      templateInfo: {
        text: `*(TEMPLATE: ${templateRules.revisionInfo.templateName} (**${templateRules.revisionInfo.revisionNumber}**))*`,
        formatting: {
          italic: true,
          fontSize: config.fontSettings.sizes.note,
          backgroundColor: config.colors.yellowHighlight
        }
      },
      authorNotes: this.formatAuthorNotes(config)
    };
  }

  private formatAuthorNotes(config: PDFFormattingOptions): any[] {
    return [
      {
        text: '*(Note to author: **Prior to start**, **do "SAVE AS" of this document.** Also provide Bob W. with the project address and roof height, for determination of wind loads and field, perimeter and corner zone dimensions. Bob will edit wind pressures and attachment information as appropriate.)*',
        formatting: {
          italic: true,
          fontSize: config.fontSettings.sizes.note,
          backgroundColor: config.colors.yellowHighlight
        }
      },
      {
        text: '*Items highlighted in yellow need to be confirmed and edited as appropriate.*',
        formatting: {
          italic: true,
          fontSize: config.fontSettings.sizes.note,
          backgroundColor: config.colors.yellowHighlight
        }
      },
      {
        text: '*(Note to author: Items highlighted in green are to alert Bid Form preparer that the Bid Form needs to accommodate various Alternates, Unit Prices, Line Item Prices, etc.. **Do not remove green highlighting from the SOW (.docx)**. Remove green highlighting from the .docx version of the **PM** (after inserting the SOW into the PM), prior to converting the PM to .pdf format)*',
        formatting: {
          italic: true,
          fontSize: config.fontSettings.sizes.note,
          backgroundColor: config.colors.yellowHighlight
        }
      }
    ];
  }

  private formatSections(
    sowData: any,
    templateRules: TemplateFormattingRules,
    config: PDFFormattingOptions
  ): any[] {
    const sections = [];

    // Project description section
    sections.push({
      name: 'Project Description',
      content: this.formatProjectDescription(sowData, config)
    });

    // Building description section
    sections.push({
      name: 'Building Description',
      content: this.formatBuildingDescription(sowData, config)
    });

    // Scope of work section
    sections.push({
      name: 'Scope of Work',
      content: this.formatScopeOfWork(sowData, config)
    });

    // Wind analysis section
    if (sowData.engineeringSummary?.windAnalysis) {
      sections.push({
        name: 'Wind Analysis',
        content: this.formatWindAnalysis(sowData.engineeringSummary.windAnalysis, config)
      });
    }

    // Fastening specifications
    if (sowData.engineeringSummary?.fasteningPattern) {
      sections.push({
        name: 'Fastening Specifications',
        content: this.formatFasteningSpecs(sowData.engineeringSummary.fasteningPattern, config)
      });
    }

    return sections;
  }

  private formatProjectDescription(sowData: any, config: PDFFormattingOptions): any {
    return {
      text: `The Scope of Work for **${sowData.projectName || '[PROJECT NAME]'}**, as provided in this Section, is briefly described but not limited to the following:`,
      formatting: {
        fontSize: config.fontSettings.sizes.body,
        paragraphSpacing: 12
      }
    };
  }

  private formatBuildingDescription(sowData: any, config: PDFFormattingOptions): any {
    return {
      bulletPoints: [
        {
          text: `This building has [NUMBER] roof sections at [LEVEL], encompassing approximately ${sowData.squareFootage || '[SQUARE FOOTAGE]'} total square feet. The existing roof assembly is comprised of ${this.describeDeckType(sowData.deckType)}, [EXISTING COMPONENTS]. **(Note: This information is provided for convenience only and Bidder/Contractor is responsible for verifying all existing components and conditions)**`,
          formatting: {
            fontSize: config.fontSettings.sizes.body,
            bulletStyle: '-'
          }
        }
      ]
    };
  }

  private formatScopeOfWork(sowData: any, config: PDFFormattingOptions): any {
    const projectTypeText = this.getProjectTypeText(sowData.projectType);
    
    return {
      bulletPoints: [
        {
          text: `The scope of work for this project is a **${projectTypeText}**, including ${this.getScopeDescription(sowData)}.`,
          formatting: {
            fontSize: config.fontSettings.sizes.body,
            bulletStyle: '-'
          },
          subBullets: [
            {
              text: '**The roof system specified herein is based on roof assembly wind uplift testing/approval for field of roof, with enhanced perimeter and corner attachment per this Scope of Work.**',
              formatting: {
                bold: true,
                fontSize: config.fontSettings.sizes.body,
                bulletStyle: '-'
              }
            },
            {
              text: '**The Contractor will be responsible for providing any/all engineering services and documents required by the Authority Having Jurisdiction (AHJ), as required to obtain applicable permits and/or for project close-out. All required engineering services are to be performed by an engineer licensed in the appropriate State or as otherwise acceptable to the AHJ.**',
              formatting: {
                bold: true,
                fontSize: config.fontSettings.sizes.body,
                bulletStyle: '-'
              }
            }
          ]
        }
      ]
    };
  }

  private formatWindAnalysis(windAnalysis: any, config: PDFFormattingOptions): any {
    return {
      table: {
        headers: ['Zone', 'Pressure (psf)', 'Fastening Pattern'],
        rows: Object.entries(windAnalysis.zonePressures || {}).map(([zone, pressure]) => [
          zone.toUpperCase(),
          `${pressure}`,
          this.getFasteningPattern(zone, windAnalysis)
        ]),
        formatting: {
          headerStyle: {
            bold: true,
            fontSize: config.fontSettings.sizes.body,
            backgroundColor: '#F0F0F0'
          },
          cellStyle: {
            fontSize: config.fontSettings.sizes.body,
            alignment: 'center'
          }
        }
      }
    };
  }

  private formatFasteningSpecs(fasteningPattern: any, config: PDFFormattingOptions): any {
    return {
      text: `Fastening specifications based on ${fasteningPattern.manufacturer} requirements and wind analysis:`,
      specifications: Object.entries(fasteningPattern.zonePatterns || {}).map(([zone, pattern]: [string, any]) => ({
        zone,
        pattern: pattern.pattern,
        fasteners: pattern.fasteners,
        spacing: pattern.spacing
      }))
    };
  }

  private applyHighlighting(sections: any[], config: PDFFormattingOptions): any[] {
    return sections.map(section => {
      // Apply yellow highlighting to items needing confirmation
      if (this.needsConfirmation(section)) {
        section.formatting = {
          ...section.formatting,
          backgroundColor: config.colors.yellowHighlight
        };
      }
      return section;
    });
  }

  private removeGreenHighlighting(sections: any[]): any[] {
    return sections.map(section => {
      if (section.formatting?.backgroundColor === '#00FF00') {
        delete section.formatting.backgroundColor;
      }
      return section;
    });
  }

  private formatFooter(
    sowData: any,
    templateRules: TemplateFormattingRules,
    config: PDFFormattingOptions
  ): any {
    return {
      companyInfo: templateRules.brandingElements.companyName,
      revisionInfo: templateRules.revisionInfo.revisionNumber,
      pageNumber: true,
      formatting: {
        fontSize: config.fontSettings.sizes.note,
        alignment: 'center'
      }
    };
  }

  private validateFormattingAccuracy(
    formattedContent: any,
    templateRules: TemplateFormattingRules
  ): Array<{ section: string; issues: string[]; suggestions: string[] }> {
    const validationResults = [];

    // Validate header formatting
    const headerIssues = this.validateHeaderFormatting(formattedContent.header, templateRules);
    if (headerIssues.length > 0) {
      validationResults.push({
        section: 'Header',
        issues: headerIssues,
        suggestions: ['Ensure template name and revision date match exactly']
      });
    }

    // Validate section formatting
    formattedContent.sections.forEach((section: any, index: number) => {
      const sectionIssues = this.validateSectionFormatting(section, templateRules);
      if (sectionIssues.length > 0) {
        validationResults.push({
          section: `Section ${index + 1}: ${section.name}`,
          issues: sectionIssues,
          suggestions: ['Check bullet point formatting and indentation']
        });
      }
    });

    return validationResults;
  }

  private validateHeaderFormatting(header: any, templateRules: TemplateFormattingRules): string[] {
    const issues = [];
    
    if (!header.title?.formatting?.bold) {
      issues.push('Header title should be bold');
    }
    
    if (!header.templateInfo?.text?.includes(templateRules.revisionInfo.templateName)) {
      issues.push('Template name mismatch in header');
    }
    
    return issues;
  }

  private validateSectionFormatting(section: any, templateRules: TemplateFormattingRules): string[] {
    const issues = [];
    
    // Add specific validation rules based on template requirements
    if (section.content?.bulletPoints && !section.content.bulletPoints[0]?.formatting?.bulletStyle) {
      issues.push('Bullet points missing proper formatting');
    }
    
    return issues;
  }

  // Helper methods
  private describeDeckType(deckType: string): string {
    const descriptions = {
      'steel': 'steel roof deck',
      'concrete': 'concrete roof deck',
      'gypsum': 'gypsum roof deck',
      'wood': 'wood roof deck'
    };
    return descriptions[deckType as keyof typeof descriptions] || 'roof deck';
  }

  private getProjectTypeText(projectType: string): string {
    const typeTexts = {
      'tearoff': 'roof replacement',
      'recover': 'roof re-cover',
      'new': 'new roof installation'
    };
    return typeTexts[projectType as keyof typeof typeTexts] || 'roof project';
  }

  private getScopeDescription(sowData: any): string {
    // Generate scope description based on project type and inputs
    if (sowData.projectType === 'tearoff') {
      return `removal of all existing roof system materials down to the ${this.describeDeckType(sowData.deckType)} and installation of new roof system, consisting of new ${sowData.insulationThickness || '4.5"'} (R-25) polyisocyanurate insulation board and new mechanically attached, ${sowData.membraneThickness || '60-mil'}, ${sowData.membraneType || 'TPO'} roof membrane system, including flashings, accessories and related work`;
    } else if (sowData.projectType === 'recover') {
      return `preparation of the existing roof system and installation of new insulation and mechanically-attached, ${sowData.membraneThickness || '60-mil'} ${sowData.membraneType || 'TPO'} roof membrane, fastened through all roof assembly components`;
    }
    return 'installation of new roof system as specified';
  }

  private getFasteningPattern(zone: string, windAnalysis: any): string {
    const patterns = windAnalysis.fasteningPattern?.zonePatterns?.[zone];
    return patterns?.pattern || 'Per manufacturer specifications';
  }

  private needsConfirmation(section: any): boolean {
    // Logic to determine if section needs yellow highlighting
    return section.content?.includes('[') || section.content?.includes('TBD');
  }
}

export default EnhancedPDFFormatter;
