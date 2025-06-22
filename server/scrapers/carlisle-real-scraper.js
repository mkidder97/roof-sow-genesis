import puppeteer from 'puppeteer';

export class CarlisleRealScraper {
  constructor() {
    this.baseUrl = 'https://www.carlislesyntec.com';
    this.cache = new Map();
    this.cacheHours = 24;
  }

  async getCodeData(filters = {}) {
    const { systemType = 'TPO', includeFleeceBack = true, codeTypes = ['UL & FM', 'Florida State', 'ICC'] } = filters;
    
    console.log(`🏭 Scraping Carlisle codes for ${systemType} systems...`);

    let browser;
    try {
      browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      // Navigate to the codes page
      await page.goto('https://www.carlislesyntec.com/Search?tabFilter=document-tab&media_type=Code&limit=50', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Apply filters based on what we found in the diagnostic
      await this.applyFilters(page, systemType, includeFleeceBack, codeTypes);

      // Extract the actual code data
      const codeResults = await page.evaluate(() => {
        const results = [];
        
        // The page content shows there are documents with specific patterns
        // Look for text containing code information
        const textContent = document.body.innerText;
        const lines = textContent.split('\n');
        
        let currentResult = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Look for document titles (like "Sure-Weld TPO Code Approval Guide")
          if (line.includes('Code Approval Guide') || 
              line.includes('Evaluation Report') || 
              line.includes('ICC ESR')) {
            
            if (currentResult) {
              results.push(currentResult);
            }
            
            currentResult = {
              title: line,
              type: 'code_document',
              system: null,
              windRating: null,
              approvals: [],
              description: '',
              url: null
            };
            
            // Determine system type
            if (line.includes('TPO')) currentResult.system = 'TPO';
            else if (line.includes('EPDM')) currentResult.system = 'EPDM';
            else if (line.includes('PVC')) currentResult.system = 'PVC';
            
            // Check for FleeceBACK
            if (line.includes('FleeceBACK') || line.includes('Fleece')) {
              currentResult.fleeceback = true;
            }
            
          } else if (currentResult && line.length > 20 && line.length < 200) {
            // This might be a description line
            currentResult.description += line + ' ';
            
            // Look for wind speeds
            const windMatch = line.match(/(\d+)\s*(?:mph|psf)/i);
            if (windMatch) {
              currentResult.windRating = parseInt(windMatch[1]);
            }
            
            // Look for approval types
            if (line.includes('FM')) currentResult.approvals.push('FM');
            if (line.includes('UL')) currentResult.approvals.push('UL');
            if (line.includes('ICC')) currentResult.approvals.push('ICC');
            if (line.includes('Florida')) currentResult.approvals.push('Florida State');
            if (line.includes('Miami')) currentResult.approvals.push('Miami-Dade');
          }
        }
        
        if (currentResult) {
          results.push(currentResult);
        }

        // Also look for download links
        const downloadLinks = Array.from(document.querySelectorAll('a[href*="download"], a[href*=".pdf"]')).map(link => ({
          text: link.textContent?.trim() || 'Download',
          href: link.href,
          type: 'download'
        }));

        return { results, downloadLinks, extractedAt: new Date().toISOString() };
      });

      console.log(`✅ Found ${codeResults.results.length} code documents`);

      return {
        manufacturer: 'Carlisle SynTec',
        searchFilters: filters,
        codeDocuments: codeResults.results,
        downloadLinks: codeResults.downloadLinks,
        extractedAt: codeResults.extractedAt,
        source: 'carlisle_codes_database'
      };

    } catch (error) {
      console.error(`❌ Carlisle scraping failed: ${error.message}`);
      return this.getFallbackData(filters);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async applyFilters(page, systemType, includeFleeceBack, codeTypes) {
    try {
      console.log('🔧 Applying search filters...');

      // Check the system type filter (TPO, EPDM, PVC)
      if (systemType) {
        const systemCheckbox = `input[name="${systemType}"]`;
        await page.click(systemCheckbox).catch(() => {
          console.log(`⚠️  Could not find ${systemType} filter`);
        });
      }

      // Check FleeceBACK filter if requested
      if (includeFleeceBack) {
        const fleeceBackCheckbox = `input[name="FleeceBACK ${systemType}"]`;
        await page.click(fleeceBackCheckbox).catch(() => {
          console.log(`⚠️  Could not find FleeceBACK ${systemType} filter`);
        });
      }

      // Apply code type filters
      for (const codeType of codeTypes) {
        const codeCheckbox = `input[name="Code|${codeType}"]`;
        await page.click(codeCheckbox).catch(() => {
          console.log(`⚠️  Could not find ${codeType} code filter`);
        });
      }

      // Click the "Show Results" button
      await page.click('button:contains("Show Results")').catch(() => {
        console.log('⚠️  Could not find Show Results button');
      });

      // Wait for filtered results to load
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`⚠️  Filter application failed: ${error.message}`);
    }
  }

  async getSpecificProduct(productName) {
    console.log(`🔍 Getting specific data for ${productName}...`);
    
    // For products like "Sure-Weld FleeceBACK", extract key specifications
    const filters = {
      systemType: 'TPO',
      includeFleeceBack: productName.includes('FleeceBACK'),
      codeTypes: ['UL & FM', 'Florida State']
    };

    const codeData = await this.getCodeData(filters);
    
    // Filter results for specific product
    const productResults = codeData.codeDocuments.filter(doc => 
      doc.title.toLowerCase().includes(productName.toLowerCase()) ||
      (productName.includes('FleeceBACK') && doc.fleeceback)
    );

    return {
      productName,
      manufacturer: 'Carlisle SynTec',
      codeDocuments: productResults,
      specifications: this.extractProductSpecs(productResults, productName),
      lastUpdated: new Date().toISOString()
    };
  }

  extractProductSpecs(codeDocuments, productName) {
    const specs = {
      windRating: null,
      approvals: [],
      systemTypes: [],
      fleeceback: productName.includes('FleeceBACK')
    };

    codeDocuments.forEach(doc => {
      if (doc.windRating) {
        specs.windRating = Math.max(specs.windRating || 0, doc.windRating);
      }
      
      if (doc.approvals) {
        specs.approvals = [...new Set([...specs.approvals, ...doc.approvals])];
      }
      
      if (doc.system) {
        specs.systemTypes = [...new Set([...specs.systemTypes, doc.system])];
      }
    });

    // Add known specifications for common products
    if (productName.includes('Sure-Weld FleeceBACK')) {
      specs.rollWidths = "12' field, 6' perimeter";
      specs.thickness = '115 mil (60 mil TPO + 55 mil fleece)';
      specs.colors = ['White', 'Gray', 'Tan'];
      specs.windRating = specs.windRating || 175; // Known rating if not found
    }

    return specs;
  }

  getFallbackData(filters) {
    return {
      manufacturer: 'Carlisle SynTec',
      searchFilters: filters,
      codeDocuments: [
        {
          title: 'Sure-Weld TPO Code Approval Guide',
          type: 'code_document',
          system: 'TPO',
          windRating: 175,
          approvals: ['FM', 'UL'],
          description: 'Factory Mutual (FM) and UL Code requirements approval guide for Sure-Weld TPO Systems.',
          fleeceback: true
        }
      ],
      downloadLinks: [],
      extractedAt: new Date().toISOString(),
      source: 'fallback_data',
      note: 'Live scraping failed - using fallback specifications'
    };
  }
}
