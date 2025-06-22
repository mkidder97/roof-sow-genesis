import puppeteer from 'puppeteer';

export class JohnsManvilleScraper {
  constructor() {
    this.baseUrl = 'https://www.jm.com';
    this.cache = new Map();
    this.cacheHours = 24;
  }

  async getTPOProductData(productType = 'fleeceback') {
    console.log(`🏭 Scraping Johns Manville TPO products...`);

    const cacheKey = `jm_tpo_${productType}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheHours * 60 * 60 * 1000) {
        console.log('📋 Using cached Johns Manville data');
        return cached.data;
      }
    }

    let browser;
    try {
      browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      // Navigate to JM TPO membranes page
      await page.goto('https://www.jm.com/en/commercial-roofing/tpo-roofing-systems/membranes/', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Extract product information
      const productData = await page.evaluate(() => {
        const products = [];
        
        // Look for product sections and descriptions
        const textContent = document.body.innerText;
        const sections = textContent.split('\n');
        
        let currentProduct = null;
        
        for (let i = 0; i < sections.length; i++) {
          const line = sections[i].trim();
          
          // Look for product names
          if (line.includes('JM TPO') && line.includes('Membrane') || 
              line.includes('Fleece Backed') || 
              line.includes('Self-Adhered') ||
              line.includes('Heavy-Fleece')) {
            
            if (currentProduct) {
              products.push(currentProduct);
            }
            
            currentProduct = {
              name: line,
              type: 'TPO',
              thickness: null,
              features: [],
              description: '',
              specifications: {},
              fleeceback: line.toLowerCase().includes('fleece')
            };
            
            // Extract thickness if mentioned
            const thicknessMatch = line.match(/(\d+)\s*mil/i);
            if (thicknessMatch) {
              currentProduct.thickness = `${thicknessMatch[1]} mil`;
            }
            
          } else if (currentProduct && line.length > 20 && line.length < 300) {
            // Add description lines
            currentProduct.description += line + ' ';
            
            // Look for specific features
            if (line.includes('polyester')) {
              currentProduct.features.push('Polyester fabric reinforcement');
            }
            if (line.includes('UV') || line.includes('ultraviolet')) {
              currentProduct.features.push('UV-resistant formulation');
            }
            if (line.includes('weld')) {
              currentProduct.features.push('Heat weldable');
            }
            if (line.includes('flexible') || line.includes('pliability')) {
              currentProduct.features.push('High flexibility');
            }
            
            // Look for thickness specifications
            const thickMatch = line.match(/(\d+)\s*mil/gi);
            if (thickMatch) {
              currentProduct.specifications.availableThicknesses = thickMatch.join(', ');
            }
          }
        }
        
        if (currentProduct) {
          products.push(currentProduct);
        }

        return {
          products,
          pageTitle: document.title,
          extractedAt: new Date().toISOString()
        };
      });

      // Also try to get specific fleeceback product data
      if (productType === 'fleeceback') {
        console.log('🔍 Getting specific fleeceback product data...');
        
        try {
          // Look for fleeceback-specific information
          const fleecebackData = await this.getFleecebackSpecifics(page);
          if (fleecebackData) {
            productData.fleecebackSpecifics = fleecebackData;
          }
        } catch (error) {
          console.warn(`⚠️  Fleeceback specifics failed: ${error.message}`);
        }
      }

      const result = {
        manufacturer: 'Johns Manville',
        productLine: 'TPO Roofing Systems',
        products: productData.products,
        fleecebackSpecifics: productData.fleecebackSpecifics || null,
        extractedAt: productData.extractedAt,
        source: 'jm_tpo_membranes_page',
        url: 'https://www.jm.com/en/commercial-roofing/tpo-roofing-systems/membranes/'
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;

    } catch (error) {
      console.error(`❌ Johns Manville scraping failed: ${error.message}`);
      return this.getFallbackJMData(productType);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async getFleecebackSpecifics(page) {
    // Look for fleeceback-specific details
    const fleecebackInfo = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const specs = {};
      
      // Look for fleeceback mentions and extract context
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('fleece') && line.includes('back')) {
          // Get surrounding context
          const context = lines.slice(Math.max(0, i-2), i+3).join(' ');
          
          // Extract key information
          if (context.includes('polyester')) {
            specs.backing = 'Integral polyester fleece backing';
          }
          if (context.includes('115') || context.includes('mil')) {
            const thickMatch = context.match(/(\d+)\s*mil/);
            if (thickMatch) {
              specs.thickness = `${thickMatch[1]} mil`;
            }
          }
          if (context.includes('flexibility')) {
            specs.benefits = 'Enhanced flexibility and substrate adhesion';
          }
        }
      }
      
      return Object.keys(specs).length > 0 ? specs : null;
    });

    return fleecebackInfo;
  }

  async getSpecificProduct(productName) {
    console.log(`🔍 Getting specific Johns Manville product: ${productName}`);
    
    const allProducts = await this.getTPOProductData('fleeceback');
    
    // Filter for specific product
    const matchingProducts = allProducts.products.filter(product => 
      product.name.toLowerCase().includes(productName.toLowerCase()) ||
      (productName.toLowerCase().includes('fleece') && product.fleeceback) ||
      (productName.toLowerCase().includes('fb') && product.fleeceback)
    );

    const specifications = this.extractProductSpecs(matchingProducts, productName);

    return {
      productName,
      manufacturer: 'Johns Manville',
      matchingProducts,
      specifications,
      lastUpdated: new Date().toISOString()
    };
  }

  extractProductSpecs(products, productName) {
    const specs = {
      windRating: null,
      thickness: null,
      rollWidths: null,
      features: [],
      fleeceback: productName.toLowerCase().includes('fleece') || productName.toLowerCase().includes('fb'),
      approvals: ['FM', 'UL'], // Standard JM approvals
      colors: ['White', 'Gray'], // Standard TPO colors
      applications: ['Mechanically fastened', 'Fully adhered']
    };

    products.forEach(product => {
      if (product.thickness) {
        specs.thickness = product.thickness;
      }
      if (product.features) {
        specs.features = [...new Set([...specs.features, ...product.features])];
      }
    });

    // Add known specifications for JM TPO FB 115
    if (productName.includes('FB 115') || productName.includes('TPO FB')) {
      specs.thickness = '115 mil with fleece backing';
      specs.rollWidths = "10' field and perimeter";
      specs.windRating = 160; // Typical JM TPO rating
      specs.features.push('Integral polyester fleece backing');
      specs.features.push('Enhanced substrate adhesion');
    }

    return specs;
  }

  getFallbackJMData(productType) {
    return {
      manufacturer: 'Johns Manville',
      productLine: 'TPO Roofing Systems',
      products: [
        {
          name: 'JM TPO Fleece Backed Roofing Membrane',
          type: 'TPO',
          thickness: '115 mil',
          features: [
            'Integral polyester fleece backing',
            'UV-resistant TPO formulation',
            'Heat weldable',
            'High flexibility'
          ],
          description: 'JM TPO Fleece Backed Roofing Membrane has an integral polyester fleece backing that provides flexibility.',
          specifications: {
            availableThicknesses: '45 mil, 60 mil, 80 mil, 115 mil'
          },
          fleeceback: true
        },
        {
          name: 'JM TPO Roofing Membrane',
          type: 'TPO',
          thickness: '60 mil',
          features: [
            'Polyester fabric reinforcement',
            'UV-resistant formulation',
            'Extreme pliability and weldability'
          ],
          description: 'Standard JM TPO membrane reinforced with polyester fabric.',
          specifications: {
            availableThicknesses: '45 mil, 60 mil, 80 mil'
          },
          fleeceback: false
        }
      ],
      extractedAt: new Date().toISOString(),
      source: 'fallback_data',
      note: 'Live scraping failed - using known JM specifications'
    };
  }
}
