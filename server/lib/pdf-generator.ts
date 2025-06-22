// PDF Generation Service
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function generatePDF(data: {
  payload: any;
  jurisdiction: any;
  windAnalysis: any;
  templateSelection: any;
  approvals: any;
  attachmentSpecs: any;
}) {
  console.log('📄 Generating PDF document...');
  
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const sanitizedProjectName = data.payload.projectName.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `SOW_${sanitizedProjectName}_${timestamp}.pdf`;
  const outputPath = path.join(outputDir, filename);
  
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'LETTER'
  });
  
  doc.pipe(fs.createWriteStream(outputPath));
  
  // Helper function for consistent styling
  const addHeader = (text: string, level: number = 1) => {
    doc.moveDown();
    if (level === 1) {
      doc.fontSize(18).font('Helvetica-Bold').text(text, { underline: true });
    } else {
      doc.fontSize(14).font('Helvetica-Bold').text(text, { underline: true });
    }
    doc.moveDown(0.5);
  };
  
  const addSubheader = (text: string) => {
    doc.fontSize(12).font('Helvetica-Bold').text(text);
    doc.moveDown(0.3);
  };
  
  const addBody = (text: string) => {
    doc.fontSize(11).font('Helvetica').text(text);
    doc.moveDown(0.3);
  };
  
  const addKeyValue = (key: string, value: string) => {
    doc.fontSize(11).font('Helvetica-Bold').text(`${key}: `, { continued: true })
       .font('Helvetica').text(value);
    doc.moveDown(0.2);
  };
  
  // Document Header
  doc.fontSize(24).font('Helvetica-Bold').text('SCOPE OF WORK', { align: 'center' });
  doc.fontSize(16).font('Helvetica').text('Commercial Roofing System', { align: 'center' });
  doc.moveDown(2);
  
  // Project Information
  addHeader('PROJECT INFORMATION');
  addKeyValue('Project Name', data.payload.projectName);
  addKeyValue('Project Address', data.payload.address);
  addKeyValue('Company', data.payload.companyName || 'Not Specified');
  addKeyValue('Square Footage', `${data.payload.squareFootage.toLocaleString()} sq ft`);
  addKeyValue('Building Height', `${data.payload.buildingHeight} ft`);
  addKeyValue('Project Type', data.payload.projectType);
  
  if (data.payload.buildingDimensions) {
    addKeyValue('Building Dimensions', `${data.payload.buildingDimensions.length}' x ${data.payload.buildingDimensions.width}'`);
  }
  
  // Jurisdiction Analysis
  addHeader('JURISDICTION ANALYSIS');
  addKeyValue('Location', `${data.jurisdiction.city}, ${data.jurisdiction.county}, ${data.jurisdiction.state}`);
  addKeyValue('Building Code', data.jurisdiction.codeCycle);
  addKeyValue('ASCE Standard', data.jurisdiction.asceVersion);
  addKeyValue('HVHZ Required', data.jurisdiction.hvhz ? 'Yes' : 'No');
  
  if (data.jurisdiction.hvhz) {
    addBody('This project is located in a High Velocity Hurricane Zone and requires enhanced wind resistance measures, NOA approvals, and compliance with additional testing protocols.');
  }
  
  // Wind Analysis
  addHeader('WIND LOAD ANALYSIS');
  addKeyValue('Design Wind Speed', `${data.windAnalysis.designWindSpeed} mph`);
  addKeyValue('Exposure Category', data.windAnalysis.exposureCategory);
  addKeyValue('Site Elevation', `${data.windAnalysis.elevation} ft above sea level`);
  
  addSubheader('Zone Uplift Pressures (ASCE 7 Components & Cladding)');
  addKeyValue('Zone 1 Field', `${data.windAnalysis.zonePressures.zone1Field.toFixed(1)} psf`);
  addKeyValue('Zone 1 Inner Perimeter', `${data.windAnalysis.zonePressures.zone1Perimeter.toFixed(1)} psf`);
  addKeyValue('Zone 2 Outer Perimeter', `${data.windAnalysis.zonePressures.zone2Perimeter.toFixed(1)} psf`);
  addKeyValue('Zone 3 Corner', `${Math.abs(data.windAnalysis.zonePressures.zone3Corner).toFixed(1)} psf`);
  
  addBody('Wind pressures calculated per ASCE 7 methodology using site-specific parameters. Corner zones (Zone 3) represent the most critical design condition.');
  
  // System Selection
  addHeader('ROOFING SYSTEM SELECTION');
  addKeyValue('Selected Template', data.templateSelection.template);
  addKeyValue('Attachment Method', data.templateSelection.attachmentMethod);
  addKeyValue('Membrane Type', `${data.payload.membraneThickness}mil TPO`);
  addKeyValue('Membrane Color', data.payload.membraneColor);
  
  addSubheader('Engineering Rationale');
  addBody(data.templateSelection.rationale);
  
  // Manufacturer Approvals
  addSubheader('Approval Sources');
  data.approvals.approvedSources.forEach((approval: string) => {
    addBody(`• ${approval}`);
  });
  
  if (data.approvals.rejectedManufacturers.length > 0) {
    addSubheader('Excluded Manufacturers');
    data.approvals.rejectedManufacturers.forEach((manufacturer: string) => {
      addBody(`• ${manufacturer}`);
    });
  }
  
  // New page for specifications
  doc.addPage();
  
  // Fastening Specifications
  addHeader('FASTENING SPECIFICATIONS');
  addKeyValue('Field Spacing', data.attachmentSpecs.fieldSpacing);
  addKeyValue('Perimeter Spacing', data.attachmentSpecs.perimeterSpacing);
  addKeyValue('Corner Spacing', data.attachmentSpecs.cornerSpacing);
  addKeyValue('Penetration Depth', data.attachmentSpecs.penetrationDepth);
  
  addSubheader('Engineering Notes');
  addBody(data.attachmentSpecs.notes);
  
  // Installation Requirements
  addHeader('INSTALLATION REQUIREMENTS');
  
  addSubheader('General Requirements');
  addBody('• All work shall comply with manufacturer\'s installation instructions and applicable building codes');
  addBody('• Weather conditions must be suitable for membrane installation (dry, wind < 25 mph)');
  addBody('• Substrate must be clean, dry, and structurally sound before membrane installation');
  addBody('• All penetrations shall be properly sealed and flashed per manufacturer specifications');
  
  addSubheader('Quality Assurance');
  if (data.jurisdiction.hvhz) {
    addBody('• HVHZ installations require third-party inspection and certification');
    addBody('• Fastener pullout testing required per TAS 105 protocol');
    addBody('• Electronic leak detection testing of all field seams');
  } else {
    addBody('• Visual inspection of all seams and fastener patterns');
    addBody('• Random pullout testing of fasteners (minimum 5% of total)');
    addBody('• Final roof inspection prior to warranty activation');
  }
  
  // Warranty Information
  addHeader('WARRANTY INFORMATION');
  const warrantyYears = data.jurisdiction.hvhz ? 25 : 20;
  addKeyValue('Warranty Term', `${warrantyYears} years`);
  addKeyValue('Warranty Type', 'Material and labor coverage');
  
  if (data.jurisdiction.hvhz) {
    addBody('HVHZ warranty includes coverage for wind damage up to the design wind speed. Annual inspections may be required to maintain warranty coverage.');
  }
  
  // Engineering Certification
  addHeader('ENGINEERING CERTIFICATION');
  addBody('This scope of work has been prepared based on the project parameters provided and applicable building codes. The specified roofing system and attachment methods are designed to resist the calculated wind loads for this location.');
  
  addBody('Installation shall be performed by qualified roofing contractors familiar with the specified system and local code requirements. Any deviations from this scope of work must be approved by the project engineer.');
  
  // Footer
  doc.moveDown(2);
  doc.fontSize(10).font('Helvetica-Italic').text(
    `Document generated on ${new Date().toLocaleDateString()} by TPO Roof SOW Generator v1.0`,
    { align: 'center' }
  );
  
  doc.end();
  
  // Wait for PDF to be written
  await new Promise((resolve) => {
    doc.on('end', resolve);
  });
  
  // Get file size
  const stats = fs.statSync(outputPath);
  
  console.log(`✅ PDF generated: ${filename} (${Math.round(stats.size / 1024)} KB)`);
  
  return {
    filename,
    outputPath: `/output/${filename}`,
    fileSize: Math.round(stats.size / 1024) // KB
  };
}

// Helper function to add a professional letterhead
export function addLetterhead(doc: PDFKit.PDFDocument, projectName: string) {
  const pageWidth = doc.page.width;
  const margin = 50;
  
  // Header border
  doc.strokeColor('#0066cc')
     .lineWidth(3)
     .moveTo(margin, 40)
     .lineTo(pageWidth - margin, 40)
     .stroke();
  
  // Company info (if needed)
  doc.fontSize(10)
     .fillColor('#666666')
     .text('Professional Roofing Engineering Services', margin, 50, { align: 'right' })
     .text('Generated by SOW Genesis Platform', margin, 65, { align: 'right' });
  
  // Reset colors
  doc.fillColor('#000000');
  
  return doc;
}

// Helper function to add page numbers
export function addPageNumbers(doc: PDFKit.PDFDocument) {
  const pages = doc.bufferedPageRange();
  
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    
    // Add page number at bottom
    doc.fontSize(10)
       .fillColor('#666666')
       .text(
         `Page ${i + 1} of ${pages.count}`,
         50,
         doc.page.height - 30,
         { align: 'center' }
       );
  }
  
  return doc;
}
