// Enhanced Manufacturer Analysis Engine with Live Scraping Integration
import { ManufacturerScrapingService } from '../scrapers/manufacturer-scraping-service.js';
import { CarlisleRealScraper } from '../scrapers/carlisle-real-scraper.js';
import { JohnsManvilleScraper } from '../scrapers/johns-manville-scraper.js';
import { AutomatedApprovalsService } from '../scrapers/automated-approvals-service.js';
import manufacturerPatterns from '../data/manufacturer-patterns.json' assert { type: 'json' };

export class EnhancedManufacturerAnalysisEngine {
  constructor() {
    this.scrapingService = new ManufacturerScrapingService();
    this.carlisleScraper = new CarlisleRealScraper();
    this.jmScraper = new JohnsManvilleScraper();
    this.approvalsService = new AutomatedApprovalsService();
    
    // Static data fallback
    this.staticPatterns = manufacturerPatterns;
    
    console.log('🏭 Enhanced Manufacturer Analysis Engine initialized with live scraping capabilities');
  }

  async selectManufacturerSystemEnhanced(inputs) {
    console.log('🚀 Enhanced manufacturer system selection with live data...');
    
    try {
      // Step 1: Get baseline static analysis (existing functionality)
      const staticAnalysis = this.getStaticAnalysis(inputs);
      
      // Step 2: Enhance with live scraping data
      const liveData = await this.getLiveManufacturerData(inputs);
      
      // Step 3: Get approval validations
      const approvalData = await this.getApprovalValidations(staticAnalysis.selectedSystem, inputs);
      
      // Step 4: Merge and optimize selection
      const enhancedResult = this.mergeAnalysisResults(staticAnalysis, liveData, approvalData, inputs);
      
      return enhancedResult;
      
    } catch (error) {
      console.warn(`⚠️  Enhanced analysis failed, falling back to static: ${error.message}`);
      return this.getStaticAnalysis(inputs);
    }
  }

  getStaticAnalysis(inputs) {
    // Use existing static logic as baseline
    const compatiblePatterns = this.getCompatiblePatterns(inputs.membraneType);
    const suitablePatterns = this.filterByRequirements(compatiblePatterns, inputs);
    const adequatePatterns = this.filterByPressureCapacity(suitablePatterns, inputs.windUpliftPressures);
    const selectedPattern = this.selectBestPattern(adequatePatterns, inputs);
    
    if (!selectedPattern) {
      return this.createFallbackPattern(inputs);
    }
    
    const rejectedPatterns = this.generateRejectionReasons(compatiblePatterns, selectedPattern.patternId, inputs);
    const selectionRationale = this.generateSelectionRationale(selectedPattern.pattern, inputs);
    
    return {
      selectedPattern: selectedPattern.patternId,
      manufacturer: selectedPattern.pattern.manufacturer,
      system: selectedPattern.pattern.system,
      fasteningSpecifications: selectedPattern.pattern.fasteningSpecifications,
      approvals: selectedPattern.pattern.approvals,
      hasApprovals: this.hasRequiredApprovals(selectedPattern.pattern, inputs.hvhz),
      metadata: {
        pressureCapacity: selectedPattern.pattern.pressureThresholds,
        rejectedPatterns,
        selectionRationale,
        dataSource: 'static_patterns'
      }
    };
  }

  async getLiveManufacturerData(inputs) {
    console.log('📡 Fetching live manufacturer data...');
    
    const liveResults = {};
    
    try {
      // Get Carlisle live data if TPO
      if (inputs.membraneType.toLowerCase().includes('tpo')) {
        console.log('🔍 Fetching Carlisle live data...');
        const carlisleData = await this.carlisleScraper.getCodeData({
          systemType: 'TPO',
          includeFleeceBack: true,
          codeTypes: ['UL & FM', 'Florida State', 'ICC']
        });
        
        liveResults.carlisle = this.processCarlisleLiveData(carlisleData, inputs);
      }
      
      // Get Johns Manville live data
      console.log('🔍 Fetching Johns Manville live data...');
      const jmData = await this.jmScraper.getTPOProductData('fleeceback');
      liveResults.johnsManville = this.processJMLiveData(jmData, inputs);
      
      // Get general manufacturer data via scraping service
      console.log('🔍 Fetching multi-manufacturer data...');
      const multiData = await this.scrapingService.getAllManufacturerData(inputs.membraneType);
      liveResults.multiManufacturer = multiData;
      
    } catch (error) {
      console.warn(`⚠️  Live data fetching failed: ${error.message}`);
    }
    
    return liveResults;
  }

  async getApprovalValidations(selectedSystem, inputs) {
    console.log('🔍 Validating approvals for selected system...');
    
    if (!selectedSystem || !selectedSystem.manufacturer) {
      return null;
    }
    
    try {
      const approvalData = await this.approvalsService.getCompleteApprovalData(
        selectedSystem.system,
        selectedSystem.manufacturer
      );
      
      // Validate wind compliance
      const requiredWindSpeed = this.convertPressureToWindSpeed(
        Math.abs(inputs.windUpliftPressures.zone3Corner)
      );
      
      const compliance = await this.approvalsService.validateWindCompliance(
        selectedSystem.system,
        selectedSystem.manufacturer,
        requiredWindSpeed
      );
      
      return {
        approvalData,
        windCompliance: compliance,
        validationTimestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.warn(`⚠️  Approval validation failed: ${error.message}`);
      return null;
    }
  }

  mergeAnalysisResults(staticAnalysis, liveData, approvalData, inputs) {
    console.log('🔀 Merging static and live analysis results...');
    
    const enhancedResult = { ...staticAnalysis };
    
    // Enhance with live data insights
    if (liveData) {
      enhancedResult.liveDataEnhancements = this.extractLiveInsights(liveData, staticAnalysis);
      enhancedResult.metadata.dataSource = 'static_plus_live';
      enhancedResult.metadata.liveDataSources = Object.keys(liveData);
    }
    
    // Add approval validation results
    if (approvalData) {
      enhancedResult.approvalValidation = approvalData;
      enhancedResult.metadata.approvalValidated = true;
      
      // Update approval status based on live validation
      if (approvalData.windCompliance.compliant) {
        enhancedResult.hasApprovals = true;
        enhancedResult.metadata.selectionRationale += '. Live approval validation confirms compliance.';
      } else {
        enhancedResult.hasApprovals = false;
        enhancedResult.metadata.selectionRationale += '. Warning: Live approval validation shows potential non-compliance.';
      }
    }
    
    // Check if live data suggests a better system
    const alternativeRecommendation = this.checkForBetterAlternatives(staticAnalysis, liveData, inputs);
    if (alternativeRecommendation) {
      enhancedResult.alternativeRecommendation = alternativeRecommendation;
      enhancedResult.metadata.hasAlternative = true;
    }
    
    enhancedResult.metadata.enhancedAnalysis = true;
    enhancedResult.metadata.analysisTimestamp = new Date().toISOString();
    
    return enhancedResult;
  }

  processCarlisleLiveData(carlisleData, inputs) {
    if (!carlisleData || !carlisleData.codeDocuments) {
      return null;
    }
    
    // Extract relevant systems from live Carlisle data
    const relevantSystems = carlisleData.codeDocuments
      .filter(doc => doc.system === inputs.membraneType)
      .map(doc => ({
        name: doc.title,
        windRating: doc.windRating,
        approvals: doc.approvals,
        fleeceback: doc.fleeceback,
        source: 'carlisle_live_scraping'
      }));
    
    return {
      systemsFound: relevantSystems.length,
      systems: relevantSystems,
      extractedAt: carlisleData.extractedAt,
      success: true
    };
  }

  processJMLiveData(jmData, inputs) {
    if (!jmData || !jmData.products) {
      return null;
    }
    
    // Extract relevant JM products
    const relevantProducts = jmData.products
      .filter(product => product.type === inputs.membraneType)
      .map(product => ({
        name: product.name,
        thickness: product.thickness,
        features: product.features,
        fleeceback: product.fleeceback,
        source: 'johns_manville_live_scraping'
      }));
    
    return {
      productsFound: relevantProducts.length,
      products: relevantProducts,
      extractedAt: jmData.extractedAt,
      success: true
    };
  }

  extractLiveInsights(liveData, staticAnalysis) {
    const insights = {
      newSystemsFound: 0,
      updatedSpecifications: [],
      approvalChanges: [],
      recommendations: []
    };
    
    // Check Carlisle insights
    if (liveData.carlisle && liveData.carlisle.success) {
      insights.newSystemsFound += liveData.carlisle.systemsFound;
      
      // Check for wind rating updates
      liveData.carlisle.systems.forEach(system => {
        if (system.windRating && system.windRating > 0) {
          insights.updatedSpecifications.push({
            manufacturer: 'Carlisle',
            system: system.name,
            specification: 'windRating',
            liveValue: system.windRating,
            source: 'live_scraping'
          });
        }
      });
    }
    
    // Check Johns Manville insights
    if (liveData.johnsManville && liveData.johnsManville.success) {
      insights.newSystemsFound += liveData.johnsManville.productsFound;
      
      liveData.johnsManville.products.forEach(product => {
        if (product.features && product.features.length > 0) {
          insights.updatedSpecifications.push({
            manufacturer: 'Johns Manville',
            system: product.name,
            specification: 'features',
            liveValue: product.features,
            source: 'live_scraping'
          });
        }
      });
    }
    
    // Generate recommendations based on live data
    if (insights.newSystemsFound > 0) {
      insights.recommendations.push(`Found ${insights.newSystemsFound} additional systems through live scraping`);
    }
    
    if (insights.updatedSpecifications.length > 0) {
      insights.recommendations.push(`Live data provides updated specifications for ${insights.updatedSpecifications.length} systems`);
    }
    
    return insights;
  }

  checkForBetterAlternatives(staticAnalysis, liveData, inputs) {
    // Check if live data reveals a better system than static selection
    
    if (!liveData.carlisle || !liveData.carlisle.systems) {
      return null;
    }
    
    const maxRequiredPressure = Math.abs(inputs.windUpliftPressures.zone3Corner);
    
    // Look for Carlisle systems with better ratings than current selection
    const betterSystems = liveData.carlisle.systems.filter(system => {
      return system.windRating > maxRequiredPressure + 20; // 20 psf margin
    });
    
    if (betterSystems.length > 0) {
      const bestAlternative = betterSystems.reduce((best, current) => 
        current.windRating > best.windRating ? current : best
      );
      
      return {
        manufacturer: 'Carlisle',
        system: bestAlternative.name,
        reason: `Live data shows higher wind rating (${bestAlternative.windRating} vs required ${maxRequiredPressure})`,
        windRating: bestAlternative.windRating,
        approvals: bestAlternative.approvals,
        source: 'live_scraping_alternative'
      };
    }
    
    return null;
  }

  convertPressureToWindSpeed(pressure) {
    // Convert uplift pressure (psf) to approximate wind speed (mph)
    // Using ASCE 7 relationship: V = sqrt(pressure * 448) approximately
    return Math.round(Math.sqrt(pressure * 400)); // Conservative approximation
  }

  // Include existing static methods for fallback
  getCompatiblePatterns(membraneType) {
    const compatiblePatternIds = this.staticPatterns.membraneCompatibility[membraneType]?.compatible_patterns || [];
    
    return compatiblePatternIds.map(patternId => ({
      patternId,
      pattern: this.staticPatterns.patterns[patternId]
    })).filter(item => item.pattern);
  }

  filterByRequirements(patterns, inputs) {
    return patterns.filter(({ pattern }) => {
      // Check deck type compatibility
      if (!pattern.deckTypes.includes(inputs.deckType.toLowerCase())) {
        return false;
      }
      
      // Check project type compatibility
      if (!pattern.projectTypes.includes(inputs.projectType.toLowerCase())) {
        return false;
      }
      
      // For HVHZ, require NOA approval
      if (inputs.hvhz) {
        const hasNOA = pattern.approvals.some((approval) => 
          approval.includes('NOA') || approval.includes('Miami-Dade')
        );
        if (!hasNOA && !pattern.specialRequirements?.includes('HVHZ-Approved')) {
          return false;
        }
      }
      
      return true;
    });
  }

  filterByPressureCapacity(patterns, windPressures) {
    const maxPressure = Math.abs(windPressures.zone3Corner);
    
    return patterns.filter(({ pattern }) => {
      const capacity = Math.abs(pattern.pressureThresholds.zone3Corner);
      return capacity >= maxPressure;
    });
  }

  selectBestPattern(patterns, inputs) {
    if (patterns.length === 0) return null;
    
    // Score patterns based on priority criteria
    const scoredPatterns = patterns.map(item => ({
      ...item,
      score: this.calculatePatternScore(item.pattern, inputs)
    }));
    
    // Sort by score (highest first)
    scoredPatterns.sort((a, b) => b.score - a.score);
    
    return scoredPatterns[0];
  }

  calculatePatternScore(pattern, inputs) {
    let score = 0;
    
    // HVHZ compliance (highest priority)
    if (inputs.hvhz && this.hasNOAApproval(pattern)) {
      score += 100;
    }
    
    // Miami-Dade NOA specifically
    if (pattern.approvals.some((approval) => approval.includes('NOA'))) {
      score += 50;
    }
    
    // FM approval hierarchy
    if (pattern.approvals.some((approval) => approval.includes('FM I-195'))) {
      score += 30;
    } else if (pattern.approvals.some((approval) => approval.includes('FM I-175'))) {
      score += 20;
    }
    
    // UL rating
    if (pattern.approvals.some((approval) => approval.includes('UL 580'))) {
      score += 15;
    }
    
    // Pressure margin (prefer higher capacity)
    const pressureMargin = Math.abs(pattern.pressureThresholds.zone3Corner) - Math.abs(inputs.windUpliftPressures.zone3Corner);
    score += Math.min(pressureMargin * 0.1, 10); // Max 10 points for pressure margin
    
    // Manufacturer preference (if brand specified)
    if (inputs.selectedMembraneBrand && 
        pattern.manufacturer.toLowerCase().includes(inputs.selectedMembraneBrand.toLowerCase())) {
      score += 25;
    }
    
    // Penalize generic patterns
    if (pattern.manufacturer === 'Generic') {
      score -= 20;
    }
    
    return score;
  }

  hasNOAApproval(pattern) {
    return pattern.approvals.some((approval) => 
      approval.includes('NOA') || 
      approval.includes('Miami-Dade') ||
      pattern.specialRequirements?.includes('HVHZ-Approved')
    );
  }

  hasRequiredApprovals(pattern, hvhz) {
    if (hvhz) {
      return this.hasNOAApproval(pattern);
    }
    
    // For non-HVHZ, require at least FM or UL approval
    return pattern.approvals.some((approval) => 
      approval.includes('FM') || approval.includes('UL')
    );
  }

  generateRejectionReasons(allPatterns, selectedPatternId, inputs) {
    const rejectedPatterns = [];
    
    allPatterns.forEach(({ patternId, pattern }) => {
      if (patternId === selectedPatternId) return;
      
      let reason = '';
      
      // Check pressure capacity
      if (Math.abs(pattern.pressureThresholds.zone3Corner) < Math.abs(inputs.windUpliftPressures.zone3Corner)) {
        reason = `Insufficient pressure capacity: ${Math.abs(pattern.pressureThresholds.zone3Corner)} psf < ${Math.abs(inputs.windUpliftPressures.zone3Corner).toFixed(1)} psf required`;
      }
      // Check HVHZ requirements
      else if (inputs.hvhz && !this.hasNOAApproval(pattern)) {
        reason = 'HVHZ location requires NOA approval';
      }
      // Check deck compatibility
      else if (!pattern.deckTypes.includes(inputs.deckType.toLowerCase())) {
        reason = `Not compatible with ${inputs.deckType} deck`;
      }
      // Check project type
      else if (!pattern.projectTypes.includes(inputs.projectType.toLowerCase())) {
        reason = `Not approved for ${inputs.projectType} projects`;
      }
      // Lower priority
      else {
        reason = 'Lower priority than selected pattern';
      }
      
      rejectedPatterns.push({
        pattern: `${pattern.manufacturer} ${pattern.system}`,
        reason
      });
    });
    
    return rejectedPatterns;
  }

  generateSelectionRationale(pattern, inputs) {
    const reasons = [];
    
    // Pressure capacity
    const capacity = Math.abs(pattern.pressureThresholds.zone3Corner);
    const required = Math.abs(inputs.windUpliftPressures.zone3Corner);
    const margin = capacity - required;
    
    reasons.push(`Selected for pressure capacity of ${capacity} psf (${margin.toFixed(1)} psf margin over ${required.toFixed(1)} psf requirement)`);
    
    // HVHZ compliance
    if (inputs.hvhz && this.hasNOAApproval(pattern)) {
      reasons.push('HVHZ compliant with required NOA approval');
    }
    
    // High-value approvals
    const premiumApprovals = pattern.approvals.filter((approval) => 
      approval.includes('FM I-195') || approval.includes('NOA')
    );
    if (premiumApprovals.length > 0) {
      reasons.push(`Premium approvals: ${premiumApprovals.join(', ')}`);
    }
    
    // Project suitability
    reasons.push(`Approved for ${inputs.projectType} projects on ${inputs.deckType} deck`);
    
    return reasons.join('. ');
  }

  createFallbackPattern(inputs) {
    console.warn('🚨 Using fallback pattern - no suitable patterns found');
    
    // Calculate fallback spacing based on pressure
    const maxPressure = Math.abs(inputs.windUpliftPressures.zone3Corner);
    
    let fieldSpacing = "15\" o.c.";
    let perimeterSpacing = "12\" o.c.";
    let cornerSpacing = "9\" o.c.";
    
    if (maxPressure > 50) {
      fieldSpacing = "9\" o.c.";
      perimeterSpacing = "6\" o.c.";
      cornerSpacing = "4\" o.c.";
    } else if (maxPressure > 30) {
      fieldSpacing = "12\" o.c.";
      perimeterSpacing = "8\" o.c.";
      cornerSpacing = "6\" o.c.";
    }
    
    return {
      selectedPattern: 'Fallback_Pattern',
      manufacturer: 'Engineering Calculated',
      system: 'Custom Fastening Pattern',
      fasteningSpecifications: {
        fieldSpacing,
        perimeterSpacing,
        cornerSpacing,
        penetrationDepth: "¾ inch min"
      },
      approvals: ['Engineering Calculated'],
      hasApprovals: false,
      metadata: {
        pressureCapacity: {
          zone1Field: inputs.windUpliftPressures.zone1Field,
          zone1Perimeter: inputs.windUpliftPressures.zone1Perimeter,
          zone2Perimeter: inputs.windUpliftPressures.zone2Perimeter,
          zone3Corner: inputs.windUpliftPressures.zone3Corner
        },
        rejectedPatterns: [],
        selectionRationale: `Custom fastening pattern calculated for ${maxPressure.toFixed(1)} psf pressure requirement. Professional engineering review recommended.`,
        dataSource: 'fallback_calculation'
      }
    };
  }
}

// Export function for backwards compatibility
export function selectManufacturerPattern(inputs) {
  const engine = new EnhancedManufacturerAnalysisEngine();
  return engine.selectManufacturerSystemEnhanced(inputs);
}

// Export function to get manufacturer recommendations
export function getManufacturerRecommendations(membraneType, hvhz = false) {
  const engine = new EnhancedManufacturerAnalysisEngine();
  const compatiblePatterns = engine.getCompatiblePatterns(membraneType);
  
  return compatiblePatterns
    .filter(({ pattern }) => {
      if (hvhz) {
        return engine.hasNOAApproval(pattern);
      }
      return pattern.manufacturer !== 'Generic';
    })
    .map(({ pattern }) => ({
      manufacturer: pattern.manufacturer,
      system: pattern.system,
      approvals: pattern.approvals,
      maxPressure: Math.abs(pattern.pressureThresholds.zone3Corner)
    }))
    .sort((a, b) => b.maxPressure - a.maxPressure);
}
