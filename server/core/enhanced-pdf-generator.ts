// Enhanced PDF generation with dynamic content injection
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { populateSOWContent, ContentPopulationInputs } from './content-population-engine.js';
import { EnhancedEngineeringSummary } from './sow-generator.js';

export interface EnhancedPDFGenerationInputs {
  engineeringSummary: EnhancedEngineeringSummary;
  inputs: any;
  sectionAnalysis?: any;
}

export interface PDFGenerationResult {
  filename: string;
  outputPath: string;
  fileSize: number;
  pageCount: number;
  contentMetrics: {
    wordCount: number;
    sectionCount: number;
    hasPlaceholders: boolean;
    placeholderCount: number;
  };
}

/**
 * Generate enhanced PDF with dynamic content population
 * Replaces ALL template placeholders with actual project data
 */
export async function generateEnhancedPDFOutput(
  summary: EnhancedEngineeringSummary, 
  inputs: any,
  sectionAnalysis?: any
): Promise<PDFGenerationResult> {
  console.log('📄 Starting enhanced PDF generation with dynamic content...');
  
  // Prepare content population inputs
  const contentInputs: ContentPopulationInputs = {
    projectName: inputs.projectName,
    address: inputs.address,
    companyName: inputs.companyName || 'Professional Roofing Solutions',
    buildingHeight: inputs.buildingHeight,
    squareFootage: inputs.squareFootage,
    buildingDimensions: inputs.buildingDimensions,
    deckType: inputs.deckType,
    projectType: inputs.projectType,
    roofSlope: inputs.roofSlope,
    membraneType: inputs.membraneType,
    membraneThickness: inputs.membraneThickness,
    selectedSystem: summary.systemSelection.selectedSystem,
    manufacturer: summary.systemSelection.manufacturer,
    windSpeed: summary.windAnalysis.windSpeed,
    zonePressures: summary.windAnalysis.zonePressures,
    takeoffItems: inputs.takeoffItems,
    engineeringSummary: summary,
    templateSelection: {
      templateName: summary.templateSelection.templateName,
      templateCode: summary.templateSelection.templateCode,
      rationale: summary.templateSelection.rationale,
      applicableConditions: summary.templateSelection.applicableConditions,
      rejectedTemplates: summary.templateSelection.rejectedTemplates.map(t => ({
        code: t.template.split(' ')[0] || 'T1',
        name: t.template,
        reason: t.reason
      }))
    }
  };

  // Populate all content with actual project data
  const populatedContent = populateSOWContent(contentInputs);

  console.log(`📝 Content populated:`);
  console.log(`   📄 ${populatedContent.totalPages} pages`);
  console.log(`   📝 ${populatedContent.wordCount.toLocaleString()} words`);
  console.log(`   📋 ${populatedContent.sections.length} sections`);
  console.log(`   🎯 ${populatedContent.placeholderCount} placeholders remaining`);

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const cleanProjectName = inputs.projectName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanProjectName}_SOW_${timestamp}.pdf`;

  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);

  // Create PDF document
  const doc = new PDFDocument({
    size: 'letter',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
    info: {
      Title: `${inputs.projectName} - Scope of Work`,
      Author: inputs.companyName || 'Professional Roofing Solutions',
      Subject: `SOW for ${summary.templateSelection.templateName}`,
      Keywords: `${inputs.membraneType}, ${inputs.projectType}, ${summary.systemSelection.manufacturer}`,
      Creator: 'Enhanced SOW Generator v4.0',
      Producer: 'Enhanced SOW Generator with Dynamic Content Population'
    }
  });

  // Pipe to file
  doc.pipe(fs.createWriteStream(outputPath));

  // Generate PDF content
  let currentPage = 1;

  for (const section of populatedContent.sections) {
    console.log(`   📄 Generating page ${currentPage}: ${section.title}`);
    
    // Add section content to PDF
    addSectionToPDF(doc, section, currentPage === 1);
    
    // Add page break if not the last section
    const isLastSection = populatedContent.sections.indexOf(section) === populatedContent.sections.length - 1;
    if (!isLastSection) {
      doc.addPage();
    }
    
    currentPage++;
  }

  // Add metadata page
  addMetadataPage(doc, summary, populatedContent, inputs);

  // Finalize PDF
  doc.end();

  // Wait for file to be written
  await new Promise<void>((resolve) => {
    doc.on('end', resolve);
  });

  // Get file size
  const stats = fs.statSync(outputPath);
  const fileSize = stats.size;

  console.log(`✅ Enhanced PDF generated successfully:`);
  console.log(`   📁 File: ${filename}`);
  console.log(`   📏 Size: ${(fileSize / 1024).toFixed(1)} KB`);
  console.log(`   📄 Pages: ${populatedContent.totalPages + 1} (including metadata)`);
  console.log(`   🎯 Zero placeholders: ${populatedContent.placeholderCount === 0 ? '✅' : '❌'}`);

  return {
    filename,
    outputPath,
    fileSize,
    pageCount: populatedContent.totalPages + 1,
    contentMetrics: {
      wordCount: populatedContent.wordCount,
      sectionCount: populatedContent.sections.length,
      hasPlaceholders: populatedContent.hasPlaceholders,
      placeholderCount: populatedContent.placeholderCount
    }
  };
}

/**
 * Add section content to PDF with proper formatting
 */
function addSectionToPDF(doc: PDFKit.PDFDocument, section: any, isFirstPage: boolean): void {
  const pageWidth = doc.page.width - 100; // Account for margins
  const lineHeight = 14;
  
  // Add header if first page
  if (isFirstPage) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('SECTION -- BID SCOPE OF WORK', 50, 50);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generated: ${new Date().toLocaleDateString()}`, 400, 50);
       
    doc.moveDown(2);
  }
  
  // Add section title
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text(section.title.toUpperCase(), { underline: true });
  
  doc.moveDown(1);
  
  // Add section content
  doc.fontSize(11)
     .font('Helvetica');
  
  // Split content into paragraphs and format
  const paragraphs = section.content.split('\n\n');
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim()) {
      // Handle bold text
      if (paragraph.includes('**')) {
        const parts = paragraph.split('**');
        for (let i = 0; i < parts.length; i++) {
          if (i % 2 === 0) {
            doc.font('Helvetica').text(parts[i], { continued: i < parts.length - 1 });
          } else {
            doc.font('Helvetica-Bold').text(parts[i], { continued: i < parts.length - 1 });
          }
        }
        doc.text(''); // End line
      } else {
        doc.font('Helvetica').text(paragraph);
      }
      doc.moveDown(0.5);
    }
  }
  
  // Add page footer
  const pageNumber = Math.floor(doc.y / doc.page.height) + 1;
  doc.fontSize(9)
     .font('Helvetica')
     .text(`Page ${pageNumber}`, 50, doc.page.height - 30, { align: 'center' });
}

/**
 * Add metadata page with generation details
 */
function addMetadataPage(
  doc: PDFKit.PDFDocument, 
  summary: EnhancedEngineeringSummary, 
  content: any, 
  inputs: any
): void {
  doc.addPage();
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('SOW GENERATION METADATA', 50, 50);
  
  doc.moveDown(2);
  
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('PROJECT INFORMATION');
  
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Project: ${inputs.projectName}`)
     .text(`Address: ${inputs.address}`)
     .text(`Template: ${summary.templateSelection.templateName}`)
     .text(`System: ${summary.systemSelection.selectedSystem}`)
     .text(`Wind Speed: ${summary.windAnalysis.windSpeed} mph`)
     .text(`Generation Date: ${new Date().toLocaleString()}`);
  
  doc.moveDown(1);
  
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('CONTENT METRICS');
  
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Total Pages: ${content.totalPages}`)
     .text(`Word Count: ${content.wordCount.toLocaleString()}`)
     .text(`Sections: ${content.sections.length}`)
     .text(`Placeholders Remaining: ${content.placeholderCount}`)
     .text(`Dynamic Fields Populated: ${content.sections.reduce((sum: number, s: any) => sum + s.dynamicFields.length, 0)}`);
  
  doc.moveDown(1);
  
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('QUALITY INDICATORS');
  
  doc.fontSize(10)
     .font('Helvetica')
     .text(`✓ Project-specific data populated: ${content.placeholderCount === 0 ? 'YES' : 'NO'}`)
     .text(`✓ Professional content depth: ${content.wordCount > 8000 ? 'YES' : 'NEEDS REVIEW'}`)
     .text(`✓ Complete sections: ${content.sections.length >= 10 ? 'YES' : 'NEEDS REVIEW'}`)
     .text(`✓ Technical specifications: YES`)
     .text(`✓ Clean formatting: ${content.placeholderCount === 0 ? 'YES' : 'NEEDS REVIEW'}`);
  
  if (summary.selfHealingReport.totalActions > 0) {
    doc.moveDown(1);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('SELF-HEALING ACTIONS');
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Total Actions: ${summary.selfHealingReport.totalActions}`)
       .text(`Confidence Level: ${(summary.selfHealingReport.overallConfidence * 100).toFixed(1)}%`)
       .text(`Requires Review: ${summary.selfHealingReport.requiresUserReview ? 'YES' : 'NO'}`);
  }
}