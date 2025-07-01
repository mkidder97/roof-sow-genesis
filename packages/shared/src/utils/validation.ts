// Enhanced Validation Utilities - Shared between frontend and backend
import { VALIDATION_RULES } from '../constants';

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION_RULES.EMAIL.REGEX.test(email.trim());
}

/**
 * Phone number validation (supports various formats)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\+\.]/g, '');
  return VALIDATION_RULES.PHONE.REGEX.test(cleaned);
}

/**
 * US ZIP code validation
 */
export function isValidZipCode(zipCode: string): boolean {
  return VALIDATION_RULES.ZIP_CODE.REGEX.test(zipCode.trim());
}

/**
 * Project name validation
 */
export function isValidProjectName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= VALIDATION_RULES.PROJECT_NAME.MIN_LENGTH && 
         trimmed.length <= VALIDATION_RULES.PROJECT_NAME.MAX_LENGTH;
}

/**
 * Building height validation
 */
export function isValidBuildingHeight(height: number): boolean {
  return height >= VALIDATION_RULES.BUILDING_HEIGHT.MIN && 
         height <= VALIDATION_RULES.BUILDING_HEIGHT.MAX;
}

/**
 * Square footage validation
 */
export function isValidSquareFootage(sqft: number): boolean {
  return sqft >= VALIDATION_RULES.SQUARE_FOOTAGE.MIN && 
         sqft <= VALIDATION_RULES.SQUARE_FOOTAGE.MAX;
}

/**
 * Validates address format (basic check)
 */
export function isValidAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 10 && // Minimum reasonable address length
         /\d/.test(trimmed) && // Contains at least one number
         /[a-zA-Z]/.test(trimmed); // Contains at least one letter
}

/**
 * Validates US state codes (2-letter)
 */
export function isValidUSState(state: string): boolean {
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', 'PR', 'VI', 'AS', 'GU', 'MP'
  ];
  return validStates.includes(state.toUpperCase());
}

/**
 * Wind speed validation for ASCE standards
 */
export function isValidWindSpeed(windSpeed: number): boolean {
  return windSpeed >= 50 && windSpeed <= 250; // Reasonable range for design wind speeds
}

/**
 * ASCE version validation
 */
export function isValidASCEVersion(version: string): boolean {
  const validVersions = ['7-10', '7-16', '7-22'];
  return validVersions.includes(version);
}

/**
 * Exposure category validation
 */
export function isValidExposureCategory(category: string): boolean {
  const validCategories = ['B', 'C', 'D'];
  return validCategories.includes(category.toUpperCase());
}

/**
 * Risk category validation
 */
export function isValidRiskCategory(category: string): boolean {
  const validCategories = ['I', 'II', 'III', 'IV'];
  return validCategories.includes(category.toUpperCase());
}

/**
 * Comprehensive validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validates multiple fields and returns comprehensive results
 */
export function validateMultipleFields(fields: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate each field based on its type and value
  Object.entries(fields).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return; // Skip empty fields
    }
    
    switch (key) {
      case 'email':
        if (!isValidEmail(value)) {
          errors.push('Invalid email address format');
        }
        break;
      case 'phone':
      case 'customerPhone':
        if (!isValidPhone(value)) {
          errors.push('Invalid phone number format');
        }
        break;
      case 'zipCode':
        if (!isValidZipCode(value)) {
          errors.push('Invalid ZIP code format');
        }
        break;
      case 'projectName':
        if (!isValidProjectName(value)) {
          errors.push(`Project name must be between ${VALIDATION_RULES.PROJECT_NAME.MIN_LENGTH} and ${VALIDATION_RULES.PROJECT_NAME.MAX_LENGTH} characters`);
        }
        break;
      case 'buildingHeight':
        if (typeof value === 'number' && !isValidBuildingHeight(value)) {
          errors.push(`Building height must be between ${VALIDATION_RULES.BUILDING_HEIGHT.MIN} and ${VALIDATION_RULES.BUILDING_HEIGHT.MAX} feet`);
        }
        break;
      case 'squareFootage':
        if (typeof value === 'number' && !isValidSquareFootage(value)) {
          errors.push(`Square footage must be between ${VALIDATION_RULES.SQUARE_FOOTAGE.MIN} and ${VALIDATION_RULES.SQUARE_FOOTAGE.MAX} sq ft`);
        }
        break;
      case 'projectAddress':
      case 'address':
        if (!isValidAddress(value)) {
          errors.push('Invalid address format');
        }
        break;
      case 'state':
        if (!isValidUSState(value)) {
          errors.push('Invalid US state code');
        }
        break;
      case 'windSpeed':
        if (typeof value === 'number' && !isValidWindSpeed(value)) {
          warnings.push('Wind speed seems unusually high or low');
        }
        break;
      case 'asceVersion':
        if (!isValidASCEVersion(value)) {
          errors.push('Invalid ASCE version');
        }
        break;
      case 'exposureCategory':
        if (!isValidExposureCategory(value)) {
          errors.push('Invalid exposure category');
        }
        break;
      case 'riskCategory':
        if (!isValidRiskCategory(value)) {
          errors.push('Invalid risk category');
        }
        break;
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Sanitizes input by removing potentially harmful characters
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove basic HTML/script injection characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validates file upload constraints
 */
export function validateFileUpload(file: File, maxSize: number, allowedTypes: string[]): ValidationResult {
  const errors: string[] = [];
  
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}