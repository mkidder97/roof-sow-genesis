#!/usr/bin/env python3
"""
validate_takeoff_data.py
Validates required fields in takeoff JSON data
"""

import json
import sys
import re
from typing import Dict, Any, List, Tuple

class TakeoffValidator:
    """Validator for takeoff data JSON"""
    
    # Required fields with their validation rules
    REQUIRED_FIELDS = {
        'project_name': {
            'type': str,
            'min_length': 1,
            'max_length': 100,
            'description': 'Project name'
        },
        'address': {
            'type': str,
            'min_length': 10,
            'max_length': 200,
            'description': 'Project address'
        },
        'roof_area': {
            'type': (int, float),
            'min_value': 100,
            'max_value': 1000000,
            'description': 'Roof area in square feet'
        },
        'membrane_type': {
            'type': str,
            'allowed_values': ['TPO', 'EPDM', 'PVC', 'Modified Bitumen', 'Built-Up'],
            'description': 'Membrane type'
        },
        'fastening_pattern': {
            'type': str,
            'allowed_values': ['Mechanically Attached', 'Fully Adhered', 'Ballasted'],
            'description': 'Fastening pattern'
        }
    }
    
    # Optional fields with validation rules
    OPTIONAL_FIELDS = {
        'insulation_type': {
            'type': str,
            'allowed_values': ['Polyiso', 'XPS', 'EPS', 'Mineral Wool', 'None'],
            'description': 'Insulation type'
        },
        'insulation_thickness': {
            'type': (int, float),
            'min_value': 0,
            'max_value': 12,
            'description': 'Insulation thickness in inches'
        },
        'deck_type': {
            'type': str,
            'allowed_values': ['Steel', 'Concrete', 'Wood', 'Lightweight Concrete'],
            'description': 'Deck type'
        },
        'building_height': {
            'type': (int, float),
            'min_value': 8,
            'max_value': 500,
            'description': 'Building height in feet'
        },
        'wind_zone': {
            'type': str,
            'pattern': r'^(I|II|III|IV)$',
            'description': 'Wind zone (I, II, III, or IV)'
        },
        'hvhz_zone': {
            'type': bool,
            'description': 'High Velocity Hurricane Zone flag'
        },
        'county': {
            'type': str,
            'min_length': 2,
            'max_length': 50,
            'description': 'County name'
        },
        'state': {
            'type': str,
            'pattern': r'^[A-Z]{2}$',
            'description': 'State code (2 letters)'
        },
        'building_code': {
            'type': str,
            'allowed_values': ['IBC2021', 'IBC2018', 'FBC2020', 'FBC2023'],
            'description': 'Building code'
        },
        'asce_version': {
            'type': str,
            'allowed_values': ['7-16', '7-22', '7-10'],
            'description': 'ASCE version'
        }
    }
    
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def validate_field(self, field_name: str, value: Any, rules: Dict[str, Any]) -> bool:
        """Validate a single field against its rules"""
        # Type check
        if 'type' in rules:
            expected_type = rules['type']
            if isinstance(expected_type, tuple):
                if not isinstance(value, expected_type):
                    self.errors.append(f"{field_name}: Expected {' or '.join([t.__name__ for t in expected_type])}, got {type(value).__name__}")
                    return False
            else:
                if not isinstance(value, expected_type):
                    self.errors.append(f"{field_name}: Expected {expected_type.__name__}, got {type(value).__name__}")
                    return False
        
        # String validations
        if isinstance(value, str):
            if 'min_length' in rules and len(value) < rules['min_length']:
                self.errors.append(f"{field_name}: Minimum length is {rules['min_length']}, got {len(value)}")
                return False
            
            if 'max_length' in rules and len(value) > rules['max_length']:
                self.errors.append(f"{field_name}: Maximum length is {rules['max_length']}, got {len(value)}")
                return False
            
            if 'pattern' in rules and not re.match(rules['pattern'], value):
                self.errors.append(f"{field_name}: Does not match required pattern {rules['pattern']}")
                return False
            
            if 'allowed_values' in rules and value not in rules['allowed_values']:
                self.errors.append(f"{field_name}: Must be one of {rules['allowed_values']}, got '{value}'")
                return False
        
        # Numeric validations
        if isinstance(value, (int, float)):
            if 'min_value' in rules and value < rules['min_value']:
                self.errors.append(f"{field_name}: Minimum value is {rules['min_value']}, got {value}")
                return False
            
            if 'max_value' in rules and value > rules['max_value']:
                self.errors.append(f"{field_name}: Maximum value is {rules['max_value']}, got {value}")
                return False
        
        return True
    
    def validate_data(self, data: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
        """Validate complete takeoff data"""
        self.errors = []
        self.warnings = []
        
        # Check required fields
        for field_name, rules in self.REQUIRED_FIELDS.items():
            if field_name not in data:
                self.errors.append(f"Missing required field: {field_name} ({rules['description']})")
            else:
                self.validate_field(field_name, data[field_name], rules)
        
        # Check optional fields if present
        for field_name, rules in self.OPTIONAL_FIELDS.items():
            if field_name in data:
                self.validate_field(field_name, data[field_name], rules)
        
        # Business logic validations
        self._validate_business_rules(data)
        
        # Check for unknown fields
        all_known_fields = set(self.REQUIRED_FIELDS.keys()) | set(self.OPTIONAL_FIELDS.keys())
        unknown_fields = set(data.keys()) - all_known_fields
        for field in unknown_fields:
            self.warnings.append(f"Unknown field: {field}")
        
        is_valid = len(self.errors) == 0
        return is_valid, self.errors, self.warnings
    
    def _validate_business_rules(self, data: Dict[str, Any]):
        """Validate business logic rules"""
        # HVHZ and state correlation
        if data.get('hvhz_zone') and data.get('state') not in ['FL', 'TX', 'LA', 'MS', 'AL']:
            self.warnings.append("HVHZ zone is typically only required in coastal states")
        
        # Insulation thickness vs type
        if data.get('insulation_type') == 'None' and data.get('insulation_thickness', 0) > 0:
            self.errors.append("Insulation thickness cannot be > 0 when insulation type is 'None'")
        
        # Wind zone and building height correlation
        if data.get('building_height', 0) > 60 and data.get('wind_zone') in ['I', 'II']:
            self.warnings.append("Tall buildings typically require higher wind zones")
        
        # Roof area reasonableness
        roof_area = data.get('roof_area', 0)
        if isinstance(roof_area, (int, float)) and roof_area > 100000:
            self.warnings.append("Very large roof area - please verify measurement")

def print_validation_results(is_valid: bool, errors: List[str], warnings: List[str]):
    """Print validation results in a formatted manner"""
    print("=" * 50)
    print("TAKEOFF DATA VALIDATION RESULTS")
    print("=" * 50)
    
    if is_valid:
        print("✅ VALIDATION PASSED")
    else:
        print("❌ VALIDATION FAILED")
    
    if errors:
        print(f"\n🚨 ERRORS ({len(errors)}):")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")
    
    if warnings:
        print(f"\n⚠️  WARNINGS ({len(warnings)}):")
        for i, warning in enumerate(warnings, 1):
            print(f"  {i}. {warning}")
    
    if not errors and not warnings:
        print("\n✨ No issues found!")
    
    print("=" * 50)

def main():
    """Main function to validate takeoff data"""
    if len(sys.argv) < 2:
        print("Usage: python validate_takeoff_data.py <takeoff_data.json>")
        print("\nThis tool validates takeoff JSON data for SOW generation.")
        print("Required fields: project_name, address, roof_area, membrane_type, fastening_pattern")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    try:
        with open(input_file, 'r') as f:
            takeoff_data = json.load(f)
        
        validator = TakeoffValidator()
        is_valid, errors, warnings = validator.validate_data(takeoff_data)
        
        print_validation_results(is_valid, errors, warnings)
        
        # Return appropriate exit code
        sys.exit(0 if is_valid else 1)
        
    except FileNotFoundError:
        print(f"❌ Error: Input file '{input_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in file '{input_file}': {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error validating takeoff data: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()