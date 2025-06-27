#!/usr/bin/env python3
"""
generate_sow_summary.py
Generates SOW summary from takeoff data
"""

import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, List

def validate_takeoff_data(data: Dict[str, Any]) -> bool:
    """Validate that required takeoff data fields are present"""
    required_fields = [
        'project_name',
        'address',
        'roof_area',
        'membrane_type',
        'fastening_pattern'
    ]
    
    for field in required_fields:
        if field not in data:
            print(f"Error: Missing required field '{field}'")
            return False
    
    return True

def calculate_materials(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate material quantities based on takeoff data"""
    roof_area = float(data.get('roof_area', 0))
    membrane_type = data.get('membrane_type', 'TPO')
    
    # Basic material calculations (placeholder logic)
    materials = {
        'membrane_sq_ft': roof_area,
        'fasteners_count': int(roof_area * 4.5),  # ~4.5 fasteners per sq ft
        'plates_count': int(roof_area * 4.5),
        'adhesive_gallons': int(roof_area / 100),  # 1 gallon per 100 sq ft
        'estimated_weight_lbs': int(roof_area * 1.2)  # ~1.2 lbs per sq ft
    }
    
    return materials

def generate_sow_sections(data: Dict[str, Any], materials: Dict[str, Any]) -> List[Dict[str, str]]:
    """Generate SOW sections based on data and calculations"""
    sections = [
        {
            'section': '1.0 PROJECT OVERVIEW',
            'content': f"This project involves the installation of a {data.get('membrane_type', 'TPO')} roofing system at {data.get('address', 'Project Location')}. Total roof area: {data.get('roof_area', 0)} square feet."
        },
        {
            'section': '2.0 MATERIALS',
            'content': f"Membrane: {materials['membrane_sq_ft']} sq ft\nFasteners: {materials['fasteners_count']} units\nPlates: {materials['plates_count']} units\nAdhesive: {materials['adhesive_gallons']} gallons"
        },
        {
            'section': '3.0 INSTALLATION',
            'content': f"Installation shall follow manufacturer specifications for {data.get('membrane_type', 'TPO')} systems with {data.get('fastening_pattern', 'standard')} fastening pattern."
        },
        {
            'section': '4.0 TESTING',
            'content': "All work shall be subject to pull tests and adhesion tests as required by local building codes and manufacturer specifications."
        }
    ]
    
    return sections

def generate_pdf_summary(data: Dict[str, Any]) -> str:
    """Generate a complete SOW summary"""
    # Validate input data
    if not validate_takeoff_data(data):
        return None
    
    # Calculate materials
    materials = calculate_materials(data)
    
    # Generate sections
    sections = generate_sow_sections(data, materials)
    
    # Create summary document
    summary = {
        'project_info': {
            'name': data.get('project_name', 'Unnamed Project'),
            'address': data.get('address', 'No Address'),
            'date_generated': datetime.now().isoformat(),
            'roof_area': data.get('roof_area', 0),
            'membrane_type': data.get('membrane_type', 'TPO')
        },
        'materials': materials,
        'sections': sections,
        'estimated_duration': f"{int(float(data.get('roof_area', 0)) / 2000) + 1} days",
        'compliance': {
            'building_code': data.get('building_code', 'IBC 2021'),
            'wind_load': data.get('wind_load', 'TBD'),
            'hvhz_required': data.get('hvhz_zone', False)
        }
    }
    
    return json.dumps(summary, indent=2)

def main():
    """Main function to process takeoff data and generate SOW summary"""
    if len(sys.argv) < 2:
        print("Usage: python generate_sow_summary.py <takeoff_data.json>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    try:
        with open(input_file, 'r') as f:
            takeoff_data = json.load(f)
        
        summary = generate_pdf_summary(takeoff_data)
        
        if summary:
            # Output to stdout or file
            if len(sys.argv) > 2:
                output_file = sys.argv[2]
                with open(output_file, 'w') as f:
                    f.write(summary)
                print(f"SOW summary generated: {output_file}")
            else:
                print(summary)
        else:
            print("Failed to generate SOW summary due to validation errors")
            sys.exit(1)
            
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in file '{input_file}'")
        sys.exit(1)
    except Exception as e:
        print(f"Error generating SOW summary: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()