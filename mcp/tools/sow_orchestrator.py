#!/usr/bin/env python3
"""
sow_orchestrator.py
Main orchestrator for the SOW generation workflow
Handles: takeoff form submission → validation → SOW generation → PDF creation
"""

import json
import os
import sys
import uuid
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

# Import our validation and generation tools
from validate_takeoff_data import TakeoffValidator
from generate_sow_summary import generate_pdf_summary

class SOWOrchestrator:
    """Main orchestrator for SOW generation workflow"""
    
    def __init__(self, data_dir: str = "../../data"):
        """Initialize with data directory for storing files"""
        self.data_dir = Path(__file__).parent / data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        self.takeoff_dir = self.data_dir / "takeoff"
        self.sow_dir = self.data_dir / "sow" 
        self.pdf_dir = self.data_dir / "pdf"
        
        for dir_path in [self.takeoff_dir, self.sow_dir, self.pdf_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def process_takeoff_submission(self, takeoff_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main workflow: Validate takeoff → Generate SOW → Create PDF
        
        Args:
            takeoff_data: Raw takeoff form data from frontend
            
        Returns:
            Dict with status, file paths, validation results, and download links
        """
        workflow_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        result = {
            "workflow_id": workflow_id,
            "timestamp": timestamp,
            "status": "processing",
            "steps": {},
            "files": {},
            "download_links": {}
        }
        
        try:
            # Step 1: Save takeoff data
            result["steps"]["save_takeoff"] = self._save_takeoff_data(
                takeoff_data, workflow_id, timestamp
            )
            
            # Step 2: Validate takeoff data
            result["steps"]["validate"] = self._validate_takeoff_data(
                takeoff_data, workflow_id
            )
            
            # If validation fails, stop here
            if not result["steps"]["validate"]["is_valid"]:
                result["status"] = "validation_failed"
                return result
            
            # Step 3: Generate SOW summary
            result["steps"]["generate_sow"] = self._generate_sow_summary(
                takeoff_data, workflow_id, timestamp
            )
            
            # Step 4: Create PDF (mock for now)
            result["steps"]["create_pdf"] = self._create_pdf_download(
                workflow_id, timestamp
            )
            
            result["status"] = "success"
            
        except Exception as e:
            result["status"] = "error"
            result["error"] = {
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        
        return result
    
    def _save_takeoff_data(self, data: Dict[str, Any], workflow_id: str, timestamp: str) -> Dict[str, Any]:
        """Save takeoff data to JSON file"""
        filename = f"takeoff_{workflow_id}_{timestamp}.json"
        file_path = self.takeoff_dir / filename
        
        try:
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            return {
                "success": True,
                "file_path": str(file_path),
                "filename": filename,
                "size_bytes": file_path.stat().st_size
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _validate_takeoff_data(self, data: Dict[str, Any], workflow_id: str) -> Dict[str, Any]:
        """Validate takeoff data using our validation tool"""
        try:
            validator = TakeoffValidator()
            is_valid, errors, warnings = validator.validate_data(data)
            
            return {
                "success": True,
                "is_valid": is_valid,
                "errors": errors,
                "warnings": warnings,
                "error_count": len(errors),
                "warning_count": len(warnings)
            }
        except Exception as e:
            return {
                "success": False,
                "is_valid": False,
                "error": str(e)
            }
    
    def _generate_sow_summary(self, data: Dict[str, Any], workflow_id: str, timestamp: str) -> Dict[str, Any]:
        """Generate SOW summary using our generation tool"""
        filename = f"sow_summary_{workflow_id}_{timestamp}.json"
        file_path = self.sow_dir / filename
        
        try:
            # Generate the summary using our existing tool
            sow_summary = generate_pdf_summary(data)
            
            if sow_summary:
                # Parse the JSON string back to dict for processing
                summary_dict = json.loads(sow_summary)
                
                # Add workflow metadata
                summary_dict["workflow_metadata"] = {
                    "workflow_id": workflow_id,
                    "timestamp": timestamp,
                    "generated_by": "sow_orchestrator.py"
                }
                
                # Save to file
                with open(file_path, 'w') as f:
                    json.dump(summary_dict, f, indent=2)
                
                return {
                    "success": True,
                    "file_path": str(file_path),
                    "filename": filename,
                    "summary": summary_dict,
                    "estimated_duration": summary_dict.get("estimated_duration", "TBD"),
                    "material_count": len(summary_dict.get("materials", {})),
                    "section_count": len(summary_dict.get("sections", []))
                }
            else:
                return {
                    "success": False,
                    "error": "SOW generation returned empty result"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _create_pdf_download(self, workflow_id: str, timestamp: str) -> Dict[str, Any]:
        """Create mock PDF download link (will be real PDF generation later)"""
        pdf_filename = f"sow_document_{workflow_id}_{timestamp}.pdf"
        pdf_path = self.pdf_dir / pdf_filename
        
        try:
            # Create a mock PDF file for now
            mock_pdf_content = f"""Mock SOW PDF Document
Workflow ID: {workflow_id}
Generated: {timestamp}
Status: Ready for Download

This is a placeholder PDF. 
Real PDF generation will be implemented in the next phase.
"""
            
            with open(pdf_path, 'w') as f:
                f.write(mock_pdf_content)
            
            # Generate download URL (relative to data directory)
            download_url = f"/api/download/pdf/{pdf_filename}"
            
            return {
                "success": True,
                "pdf_path": str(pdf_path),
                "pdf_filename": pdf_filename,
                "download_url": download_url,
                "file_size": len(mock_pdf_content),
                "is_mock": True,
                "message": "Mock PDF created - real PDF generation coming soon"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a workflow by ID"""
        # Look for files with this workflow ID
        takeoff_files = list(self.takeoff_dir.glob(f"*{workflow_id}*"))
        sow_files = list(self.sow_dir.glob(f"*{workflow_id}*"))
        pdf_files = list(self.pdf_dir.glob(f"*{workflow_id}*"))
        
        if not any([takeoff_files, sow_files, pdf_files]):
            return None
        
        return {
            "workflow_id": workflow_id,
            "files_found": {
                "takeoff": [str(f) for f in takeoff_files],
                "sow": [str(f) for f in sow_files], 
                "pdf": [str(f) for f in pdf_files]
            },
            "status": "completed" if pdf_files else "in_progress"
        }

def main():
    """CLI interface for testing the orchestrator"""
    if len(sys.argv) < 2:
        print("Usage: python sow_orchestrator.py <takeoff_data.json> [output_dir]")
        print("\nExample:")
        print("  python sow_orchestrator.py ../data/sample_takeoff.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "../../data"
    
    try:
        # Load takeoff data
        with open(input_file, 'r') as f:
            takeoff_data = json.load(f)
        
        # Run orchestration
        orchestrator = SOWOrchestrator(data_dir=output_dir)
        result = orchestrator.process_takeoff_submission(takeoff_data)
        
        # Print results
        print("=" * 60)
        print("SOW ORCHESTRATION RESULTS")
        print("=" * 60)
        print(f"Workflow ID: {result['workflow_id']}")
        print(f"Status: {result['status']}")
        print(f"Timestamp: {result['timestamp']}")
        print()
        
        for step_name, step_result in result['steps'].items():
            print(f"Step: {step_name.upper()}")
            if step_result.get('success'):
                print(f"  ✅ Success")
                if 'file_path' in step_result:
                    print(f"  📁 File: {step_result['file_path']}")
                if step_name == 'validate':
                    if step_result['is_valid']:
                        print(f"  ✅ Validation passed")
                    else:
                        print(f"  ❌ Validation failed: {step_result['error_count']} errors")
                        for error in step_result.get('errors', []):
                            print(f"    • {error}")
            else:
                print(f"  ❌ Failed: {step_result.get('error', 'Unknown error')}")
            print()
        
        if result['status'] == 'success':
            print("🎉 SOW generation complete!")
            if 'create_pdf' in result['steps']:
                pdf_info = result['steps']['create_pdf']
                print(f"📄 PDF ready: {pdf_info.get('download_url', 'N/A')}")
        
        print("=" * 60)
        
    except FileNotFoundError:
        print(f"❌ Error: Input file '{input_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"❌ Error: Invalid JSON in file '{input_file}'")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()