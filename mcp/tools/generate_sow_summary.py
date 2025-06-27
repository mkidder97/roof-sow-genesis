#!/usr/bin/env python3
"""
generate_sow_summary.py
Generates SOW summary from takeoff data
Enhanced with optional Supabase integration for Phase 1
"""

import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

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
    fastening_pattern = data.get('fastening_pattern', 'Mechanically Attached')
    
    # Enhanced material calculations based on membrane type and fastening
    materials = {
        'membrane_sq_ft': roof_area,
        'membrane_type': membrane_type,
        'fastening_pattern': fastening_pattern
    }
    
    # Fastener calculations based on pattern
    if fastening_pattern == 'Mechanically Attached':
        materials['fasteners_count'] = int(roof_area * 4.5)  # ~4.5 fasteners per sq ft
        materials['plates_count'] = int(roof_area * 4.5)
        materials['adhesive_gallons'] = 0  # No adhesive for mechanical
    elif fastening_pattern == 'Fully Adhered':
        materials['fasteners_count'] = int(roof_area * 0.5)  # Perimeter only
        materials['plates_count'] = int(roof_area * 0.5)
        materials['adhesive_gallons'] = int(roof_area / 80)  # 1 gallon per 80 sq ft
    else:  # Ballasted
        materials['fasteners_count'] = int(roof_area * 0.2)  # Minimal fastening
        materials['plates_count'] = int(roof_area * 0.2)
        materials['ballast_tons'] = int(roof_area / 100)  # 1 ton per 100 sq ft
        materials['adhesive_gallons'] = 0
    
    # Insulation calculations
    insulation_thickness = float(data.get('insulation_thickness', 2.0))
    if data.get('insulation_type') and data.get('insulation_type') != 'None':
        materials['insulation_sq_ft'] = roof_area
        materials['insulation_thickness'] = f"{insulation_thickness} inch"
        materials['insulation_type'] = data.get('insulation_type', 'Polyiso')
    
    # Cover board if specified
    if data.get('cover_board_type'):
        materials['cover_board_sq_ft'] = roof_area
        materials['cover_board_type'] = data.get('cover_board_type', 'Gypsum')
    
    # Weight estimate
    base_weight = roof_area * 1.2  # Base membrane weight
    if 'insulation_sq_ft' in materials:
        base_weight += roof_area * (insulation_thickness * 0.8)  # Insulation weight
    materials['estimated_weight_lbs'] = int(base_weight)
    
    return materials

def generate_sow_sections(data: Dict[str, Any], materials: Dict[str, Any]) -> List[Dict[str, str]]:
    """Generate SOW sections based on data and calculations"""
    project_name = data.get('project_name', 'Roofing Project')
    address = data.get('address', 'Project Location')
    roof_area = data.get('roof_area', 0)
    membrane_type = data.get('membrane_type', 'TPO')
    fastening_pattern = data.get('fastening_pattern', 'Mechanically Attached')
    
    sections = [
        {
            'section': '1.0 PROJECT OVERVIEW',
            'content': f"""Project: {project_name}
Location: {address}
Roof Area: {roof_area:,} square feet
System Type: {membrane_type} with {fastening_pattern} fastening

This project involves the installation of a {membrane_type} roofing system following manufacturer specifications and local building code requirements."""
        },
        {
            'section': '2.0 SCOPE OF WORK',
            'content': f"""The work includes but is not limited to:
• Removal of existing roofing materials as required
• Installation of {materials.get('insulation_type', 'new')} insulation ({materials.get('insulation_thickness', 'TBD')})
• Installation of {membrane_type} membrane system
• {fastening_pattern} attachment method
• All associated flashings, penetrations, and accessories
• Testing and quality assurance per specifications"""
        },
        {
            'section': '3.0 MATERIALS',
            'content': f"""Primary Materials:
• Membrane: {materials['membrane_sq_ft']:,} sq ft {membrane_type}
• Fasteners: {materials.get('fasteners_count', 0):,} units
• Plates: {materials.get('plates_count', 0):,} units""" + 
            (f"\n• Adhesive: {materials['adhesive_gallons']} gallons" if materials.get('adhesive_gallons', 0) > 0 else "") +
            (f"\n• Insulation: {materials.get('insulation_sq_ft', 0):,} sq ft {materials.get('insulation_type', '')}" if 'insulation_sq_ft' in materials else "") +
            (f"\n• Cover Board: {materials.get('cover_board_sq_ft', 0):,} sq ft {materials.get('cover_board_type', '')}" if 'cover_board_sq_ft' in materials else "") +
            (f"\n• Ballast: {materials.get('ballast_tons', 0)} tons" if 'ballast_tons' in materials else "") +
            f"\n\nEstimated Total Weight: {materials['estimated_weight_lbs']:,} lbs"
        },
        {
            'section': '4.0 INSTALLATION REQUIREMENTS',
            'content': f"""Installation Method: {fastening_pattern}
Membrane Type: {membrane_type}

Installation shall follow:
• Manufacturer's published specifications
• Local building code requirements
• Industry best practices (NRCA, SPRI guidelines)
• Environmental conditions suitable for installation

Quality Control:
• Material inspection upon delivery
• Substrate preparation verification
• Installation progress monitoring
• Final system inspection and testing"""
        },
        {
            'section': '5.0 TESTING AND WARRANTY',
            'content': """Testing Requirements:
• Pull tests for mechanical fastening systems
• Adhesion tests for adhered systems
• Seam integrity testing
• Final water testing as required

Warranty:
• Material warranty per manufacturer specifications
• Installation warranty per contractor agreement
• System warranty coordination between parties

All work subject to final approval by building official and owner representative."""
        }
    ]
    
    # Add wind load section if data available
    if data.get('wind_zone') or data.get('building_height'):
        wind_info = f"""Wind Design Parameters:
• Building Height: {data.get('building_height', 'TBD')} feet
• Wind Zone: {data.get('wind_zone', 'TBD')}
• HVHZ Requirements: {'Yes' if data.get('hvhz_zone') else 'No'}
• Building Code: {data.get('building_code', 'TBD')}
• ASCE Version: {data.get('asce_version', 'TBD')}

Wind load calculations and fastening patterns shall be verified by licensed engineer."""
        
        sections.append({
            'section': '6.0 WIND DESIGN',
            'content': wind_info
        })
    
    return sections

def generate_pdf_summary(data: Dict[str, Any], db_client=None, project_id: Optional[str] = None) -> str:
    """
    Generate a complete SOW summary with optional database integration
    
    Args:
        data: Takeoff data dictionary
        db_client: Optional Supabase client for database logging
        project_id: Optional project ID for database operations
        
    Returns:
        JSON string of SOW summary or None if validation fails
    """
    # Validate input data
    if not validate_takeoff_data(data):
        return None
    
    # Log generation start to database if available
    if db_client and project_id and hasattr(db_client, 'log_workflow_activity'):
        try:
            db_client.log_workflow_activity(
                project_id, "sow_generation_started",
                notes="Starting SOW summary generation"
            )
        except Exception as e:
            print(f"Warning: Database logging failed: {e}")
    
    # Calculate materials
    materials = calculate_materials(data)
    
    # Generate sections
    sections = generate_sow_sections(data, materials)
    
    # Calculate estimated duration based on roof area
    roof_area = float(data.get('roof_area', 0))
    base_days = max(1, int(roof_area / 2000))  # 2000 sq ft per day base rate
    
    # Adjust for complexity
    complexity_factor = 1.0
    if data.get('fastening_pattern') == 'Fully Adhered':
        complexity_factor += 0.3
    if data.get('building_height', 0) > 50:
        complexity_factor += 0.2
    if data.get('hvhz_zone'):
        complexity_factor += 0.2
    
    estimated_days = max(1, int(base_days * complexity_factor))
    
    # Create summary document
    summary = {
        'project_info': {
            'name': data.get('project_name', 'Unnamed Project'),
            'address': data.get('address', 'No Address'),
            'date_generated': datetime.now().isoformat(),
            'roof_area': data.get('roof_area', 0),
            'membrane_type': data.get('membrane_type', 'TPO'),
            'fastening_pattern': data.get('fastening_pattern', 'Mechanically Attached'),
            'project_id': project_id
        },
        'materials': materials,
        'sections': sections,
        'estimated_duration': f"{estimated_days} days",
        'complexity_factors': {
            'base_days': base_days,
            'complexity_multiplier': complexity_factor,
            'factors_applied': []
        },
        'compliance': {
            'building_code': data.get('building_code', 'IBC 2021'),
            'asce_version': data.get('asce_version', '7-16'),
            'wind_zone': data.get('wind_zone', 'TBD'),
            'hvhz_required': data.get('hvhz_zone', False),
            'state': data.get('state', 'TBD')
        },
        'engineering_notes': {
            'wind_load_analysis': 'Required - To be performed by licensed engineer',
            'structural_adequacy': 'Verify existing structure can support new system load',
            'drainage_verification': 'Confirm adequate drainage design',
            'code_compliance': 'All work must comply with applicable building codes'
        }
    }
    
    # Add complexity factors that were applied
    if data.get('fastening_pattern') == 'Fully Adhered':
        summary['complexity_factors']['factors_applied'].append('Fully adhered system (+30%)')
    if data.get('building_height', 0) > 50:
        summary['complexity_factors']['factors_applied'].append('High building (+20%)')
    if data.get('hvhz_zone'):
        summary['complexity_factors']['factors_applied'].append('HVHZ requirements (+20%)')
    
    # Log successful generation to database
    if db_client and project_id and hasattr(db_client, 'log_workflow_activity'):
        try:
            db_client.log_workflow_activity(
                project_id, "sow_generation_completed",
                notes=f"SOW summary generated successfully: {len(sections)} sections, {estimated_days} day duration",
                metadata={
                    'sections_count': len(sections),
                    'estimated_days': estimated_days,
                    'material_count': len(materials),
                    'complexity_factor': complexity_factor
                }
            )
        except Exception as e:
            print(f"Warning: Database logging failed: {e}")
    
    return json.dumps(summary, indent=2)

def main():
    """Main function to process takeoff data and generate SOW summary"""
    if len(sys.argv) < 2:
        print("Usage: python generate_sow_summary.py <takeoff_data.json> [output_file.json]")
        print("\nThis tool generates a complete SOW summary from takeoff data.")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    try:
        with open(input_file, 'r') as f:
            takeoff_data = json.load(f)
        
        # Try to initialize database client for enhanced logging
        db_client = None
        db_connected = False
        try:
            from supabase_client import get_supabase_client
            db_client = get_supabase_client()
            db_connected = db_client.is_connected()
        except ImportError:
            # Database client not available - proceed without database
            pass
        except Exception:
            # Database connection failed - proceed without database
            pass
        
        # Generate summary (project_id would be provided by orchestrator in real use)
        summary = generate_pdf_summary(takeoff_data, db_client=db_client)
        
        if summary:
            # Output to stdout or file
            if len(sys.argv) > 2:
                output_file = sys.argv[2]
                with open(output_file, 'w') as f:
                    f.write(summary)
                print(f"✅ SOW summary generated: {output_file}")
                if db_connected:
                    print("🗄️  Database: Connected")
                else:
                    print("📁 Database: File-only mode")
            else:
                print("=" * 50)
                print("SOW SUMMARY GENERATED")
                print("=" * 50)
                if db_connected:
                    print("🗄️  Database: Connected")
                else:
                    print("📁 Database: File-only mode")
                print()
                print(summary)
        else:
            print("❌ Failed to generate SOW summary due to validation errors")
            sys.exit(1)
            
    except FileNotFoundError:
        print(f"❌ Error: Input file '{input_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"❌ Error: Invalid JSON in file '{input_file}'")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error generating SOW summary: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()