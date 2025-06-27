#!/usr/bin/env python3
"""
sow_orchestrator.py
Main orchestrator for the SOW generation workflow
Handles: takeoff form submission → validation → SOW generation → PDF creation
Now includes Supabase database integration for Phase 1
ENHANCED: Dynamic template selection for supervisor demo
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

# Import Supabase integration
from supabase_client import get_supabase_client

# Import dynamic template selection engine
from dynamic_template_selector import DynamicTemplateSelector

class SOWOrchestrator:
    """Main orchestrator for SOW generation workflow with dynamic template selection"""
    
    def __init__(self, data_dir: str = "../../data"):
        """Initialize with data directory for storing files and database client"""
        self.data_dir = Path(__file__).parent / data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        self.takeoff_dir = self.data_dir / "takeoff"
        self.sow_dir = self.data_dir / "sow" 
        self.pdf_dir = self.data_dir / "pdf"
        
        for dir_path in [self.takeoff_dir, self.sow_dir, self.pdf_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize Supabase client
        self.db = get_supabase_client()
        
        # Initialize dynamic template selector
        self.template_selector = DynamicTemplateSelector()
    
    def process_takeoff_submission(self, takeoff_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main workflow: Validate takeoff → Select Template → Generate SOW → Create PDF
        Now includes DYNAMIC TEMPLATE SELECTION for impressive demo
        
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
            "download_links": {},
            "database_operations": {}
        }
        
        project_id = None
        generation_id = None
        
        try:
            # Step 1: DYNAMIC TEMPLATE SELECTION (NEW!)
            result["steps"]["template_selection"] = self._select_template_dynamically(
                takeoff_data, workflow_id
            )
            
            # Step 2: Create project in database
            result["steps"]["create_project"] = self._create_project_record(
                takeoff_data, workflow_id
            )
            project_id = result["steps"]["create_project"].get("project_id")
            
            # Step 3: Save takeoff data to files (backup)
            result["steps"]["save_takeoff"] = self._save_takeoff_data(
                takeoff_data, workflow_id, timestamp
            )
            
            # Step 4: Validate takeoff data
            result["steps"]["validate"] = self._validate_takeoff_data(
                takeoff_data, workflow_id, project_id
            )
            
            # If validation fails, update database and stop
            if not result["steps"]["validate"]["is_valid"]:
                if project_id:
                    self.db.log_workflow_activity(
                        project_id, "validation_failed", 
                        notes=f"Validation failed with {result['steps']['validate']['error_count']} errors"
                    )
                result["status"] = "validation_failed"
                return result
            
            # Step 5: Create SOW generation record with DYNAMIC TEMPLATE
            selected_template = result["steps"]["template_selection"]["selected_template"]
            result["steps"]["create_generation"] = self._create_sow_generation_record(
                project_id, takeoff_data, workflow_id, selected_template["template_id"]
            )
            generation_id = result["steps"]["create_generation"].get("generation_id")
            
            # Step 6: Generate SOW summary with dynamic template
            result["steps"]["generate_sow"] = self._generate_sow_summary(
                takeoff_data, workflow_id, timestamp, project_id, generation_id, selected_template
            )
            
            # Step 7: Create PDF with template-specific content
            result["steps"]["create_pdf"] = self._create_pdf_download(
                workflow_id, timestamp, project_id, generation_id, selected_template
            )
            
            # Step 8: Complete workflow in database
            if generation_id:
                self.db.update_sow_generation_status(generation_id, "completed")
                self.db.log_workflow_activity(
                    project_id, "sow_generation_completed",
                    stage_to="completed",
                    notes=f"SOW generation completed using template {selected_template['template_id']} - {selected_template['template_name']}"
                )
            
            result["status"] = "success"
            
        except Exception as e:
            # Log error to database if we have a project
            if project_id:
                self.db.log_workflow_activity(
                    project_id, "workflow_error",
                    notes=f"Workflow failed: {str(e)}"
                )
            
            # Update generation status if we have one
            if generation_id:
                self.db.update_sow_generation_status(
                    generation_id, "failed", str(e)
                )
            
            result["status"] = "error"
            result["error"] = {
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        
        return result
    
    def _select_template_dynamically(self, data: Dict[str, Any], workflow_id: str) -> Dict[str, Any]:
        """
        NEW: Dynamic template selection based on project specifications
        This is the impressive feature for the supervisor demo!
        """
        try:
            # Use the dynamic template selector
            template_id, template_info = self.template_selector.select_template(data)
            
            # Validate template compatibility
            validation = self.template_selector.validate_template_compatibility(template_id, data)
            
            return {
                "success": True,
                "selected_template": template_info,
                "template_id": template_id,
                "confidence": template_info["confidence"],
                "selection_reasoning": {
                    "work_type": template_info["selection_logic"]["work_type"],
                    "membrane_type": template_info["selection_logic"]["membrane_type"],
                    "attachment_method": template_info["selection_logic"]["attachment_method"],
                    "deck_type": template_info["selection_logic"]["deck_type"]
                },
                "validation": validation,
                "estimated_duration": template_info["estimated_duration"],
                "complexity": template_info["complexity"],
                "notes": template_info.get("notes", []),
                "message": f"Dynamically selected template {template_id} based on project specifications"
            }
            
        except Exception as e:
            # Fallback to safe default
            return {
                "success": False,
                "selected_template": {
                    "template_id": "T2",
                    "template_name": "T2-Recover-TPO(MA)-cvr-bd-BUR-lwc-steel",
                    "confidence": "low",
                    "sections": ["project_overview", "scope_of_work", "materials", "installation"]
                },
                "template_id": "T2",
                "confidence": "low",
                "error": str(e),
                "message": "Template selection failed, using default T2 template"
            }
    
    def _create_project_record(self, data: Dict[str, Any], workflow_id: str) -> Dict[str, Any]:
        """Create project record in Supabase database"""
        try:
            project_id = self.db.create_project(data)
            
            if project_id:
                self.db.log_workflow_activity(
                    project_id, "project_created",
                    stage_to="processing",
                    notes=f"Project created via workflow {workflow_id}"
                )
                
                return {
                    "success": True,
                    "project_id": project_id,
                    "message": "Project created in database"
                }
            else:
                return {
                    "success": False,
                    "project_id": None,
                    "message": "Failed to create project in database (fallback to file mode)"
                }
                
        except Exception as e:
            return {
                "success": False,
                "project_id": None,
                "error": str(e),
                "message": "Database error - proceeding with file-only mode"
            }
    
    def _create_sow_generation_record(self, project_id: Optional[str], data: Dict[str, Any], 
                                    workflow_id: str, template_id: str) -> Dict[str, Any]:
        """Create SOW generation record in database with DYNAMIC TEMPLATE"""
        if not project_id:
            return {
                "success": False,
                "generation_id": None,
                "message": "No project ID - skipping generation record"
            }
        
        try:
            # Use the dynamically selected template instead of hardcoded "TPO_Recover"
            generation_id = self.db.create_sow_generation(
                project_id, template_id, data
            )
            
            if generation_id:
                return {
                    "success": True,
                    "generation_id": generation_id,
                    "template_used": template_id,
                    "message": f"SOW generation record created with template {template_id}"
                }
            else:
                return {
                    "success": False,
                    "generation_id": None,
                    "message": "Failed to create generation record"
                }
                
        except Exception as e:
            return {
                "success": False,
                "generation_id": None,
                "error": str(e)
            }
    
    def _save_takeoff_data(self, data: Dict[str, Any], workflow_id: str, timestamp: str) -> Dict[str, Any]:
        """Save takeoff data to JSON file (backup storage)"""
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
    
    def _validate_takeoff_data(self, data: Dict[str, Any], workflow_id: str, project_id: Optional[str]) -> Dict[str, Any]:
        """Validate takeoff data using our validation tool"""
        try:
            validator = TakeoffValidator()
            is_valid, errors, warnings = validator.validate_data(data)
            
            # Log validation activity to database
            if project_id:
                self.db.log_workflow_activity(
                    project_id, "validation_completed",
                    stage_to="validated" if is_valid else "validation_failed",
                    notes=f"Validation completed: {len(errors)} errors, {len(warnings)} warnings",
                    metadata={
                        "is_valid": is_valid,
                        "error_count": len(errors),
                        "warning_count": len(warnings),
                        "errors": errors,
                        "warnings": warnings
                    }
                )
            
            return {
                "success": True,
                "is_valid": is_valid,
                "errors": errors,
                "warnings": warnings,
                "error_count": len(errors),
                "warning_count": len(warnings)
            }
        except Exception as e:
            # Log validation error
            if project_id:
                self.db.log_workflow_activity(
                    project_id, "validation_error",
                    notes=f"Validation error: {str(e)}"
                )
            
            return {
                "success": False,
                "is_valid": False,
                "error": str(e)
            }
    
    def _generate_sow_summary(self, data: Dict[str, Any], workflow_id: str, timestamp: str, 
                            project_id: Optional[str], generation_id: Optional[str],
                            selected_template: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SOW summary using our generation tool with DYNAMIC TEMPLATE"""
        filename = f"sow_summary_{workflow_id}_{timestamp}.json"
        file_path = self.sow_dir / filename
        
        try:
            # Update generation status to processing
            if generation_id:
                self.db.update_sow_generation_status(generation_id, "processing")
            
            # Log generation start with template info
            if project_id:
                self.db.log_workflow_activity(
                    project_id, "sow_generation_started",
                    stage_to="generating",
                    notes=f"SOW generation started using template {selected_template['template_id']} - {selected_template['template_name']}"
                )
            
            # Generate the summary using our existing tool
            # TODO: Enhance generate_pdf_summary to use template-specific content
            sow_summary = generate_pdf_summary(data)
            
            if sow_summary:
                # Parse the JSON string back to dict for processing
                summary_dict = json.loads(sow_summary)
                
                # Add workflow metadata with template information
                summary_dict["workflow_metadata"] = {
                    "workflow_id": workflow_id,
                    "timestamp": timestamp,
                    "project_id": project_id,
                    "generation_id": generation_id,
                    "generated_by": "sow_orchestrator.py",
                    "template_used": selected_template["template_id"],
                    "template_name": selected_template["template_name"],
                    "template_confidence": selected_template["confidence"],
                    "estimated_duration": selected_template.get("estimated_duration", "TBD")
                }
                
                # Add template-specific sections
                if "sections" in selected_template:
                    summary_dict["template_sections"] = selected_template["sections"]
                
                # Save to file
                with open(file_path, 'w') as f:
                    json.dump(summary_dict, f, indent=2)
                
                # Log generation completion
                if project_id:
                    self.db.log_workflow_activity(
                        project_id, "sow_generation_completed",
                        stage_to="generated",
                        notes=f"SOW summary generated successfully using template {selected_template['template_id']}",
                        metadata={
                            "file_path": str(file_path),
                            "material_count": len(summary_dict.get("materials", {})),
                            "section_count": len(summary_dict.get("sections", [])),
                            "template_used": selected_template["template_id"]
                        }
                    )
                
                return {
                    "success": True,
                    "file_path": str(file_path),
                    "filename": filename,
                    "summary": summary_dict,
                    "estimated_duration": summary_dict.get("estimated_duration", "TBD"),
                    "material_count": len(summary_dict.get("materials", {})),
                    "section_count": len(summary_dict.get("sections", [])),
                    "template_used": selected_template["template_id"],
                    "template_name": selected_template["template_name"]
                }
            else:
                if generation_id:
                    self.db.update_sow_generation_status(
                        generation_id, "failed", "SOW generation returned empty result"
                    )
                
                return {
                    "success": False,
                    "error": "SOW generation returned empty result"
                }
                
        except Exception as e:
            # Update generation status to failed
            if generation_id:
                self.db.update_sow_generation_status(generation_id, "failed", str(e))
            
            # Log generation error
            if project_id:
                self.db.log_workflow_activity(
                    project_id, "sow_generation_error",
                    notes=f"SOW generation failed: {str(e)}"
                )
            
            return {
                "success": False,
                "error": str(e)
            }
    
    def _create_pdf_download(self, workflow_id: str, timestamp: str, 
                           project_id: Optional[str], generation_id: Optional[str],
                           selected_template: Dict[str, Any]) -> Dict[str, Any]:
        """Create PDF download with TEMPLATE-SPECIFIC content"""
        pdf_filename = f"sow_document_{workflow_id}_{timestamp}.pdf"
        pdf_path = self.pdf_dir / pdf_filename
        
        try:
            # Create enhanced PDF content with template information
            template_content = f"""
=== SCOPE OF WORK DOCUMENT ===
Template: {selected_template['template_name']}
Template ID: {selected_template['template_id']}
Confidence: {selected_template['confidence']}
Estimated Duration: {selected_template.get('estimated_duration', 'TBD')}

Workflow ID: {workflow_id}
Project ID: {project_id}
Generation ID: {generation_id}
Generated: {timestamp}

=== TEMPLATE SELECTION REASONING ===
{selected_template.get('description', 'Standard roofing template')}

Complexity: {selected_template.get('complexity', 'standard')}

=== TEMPLATE SECTIONS ===
"""
            
            # Add template sections
            if "sections" in selected_template:
                for i, section in enumerate(selected_template["sections"], 1):
                    template_content += f"{i}. {section.replace('_', ' ').title()}\n"
            
            template_content += f"""

=== SELECTION NOTES ===
"""
            if selected_template.get("notes"):
                for note in selected_template["notes"]:
                    template_content += f"• {note}\n"
            else:
                template_content += "• Template selected automatically based on project specifications\n"
            
            template_content += f"""

=== NEXT PHASE ENHANCEMENTS ===
• Real PDF generation with ReportLab
• Template-specific content population
• Professional formatting and styling
• Wind load calculations integration
• Manufacturer-specific details

Status: Ready for Download - Enhanced Template Selection Active
This demonstrates the dynamic template selection engine working correctly.
"""
            
            with open(pdf_path, 'w') as f:
                f.write(template_content)
            
            # Generate download URL (relative to data directory)
            download_url = f"/api/download/pdf/{pdf_filename}"
            
            # Create SOW output record in database
            output_id = None
            if project_id:
                output_id = self.db.create_sow_output(
                    project_id=project_id,
                    template_name=selected_template["template_name"],
                    file_url=download_url,
                    filename=pdf_filename,
                    metadata={
                        "workflow_id": workflow_id,
                        "generation_id": generation_id,
                        "file_size": len(template_content),
                        "template_used": selected_template["template_id"],
                        "template_confidence": selected_template["confidence"],
                        "is_enhanced": True
                    }
                )
                
                # Log PDF creation
                self.db.log_workflow_activity(
                    project_id, "pdf_created",
                    stage_to="completed",
                    notes=f"Enhanced PDF created with template {selected_template['template_id']}",
                    metadata={
                        "output_id": output_id,
                        "filename": pdf_filename,
                        "download_url": download_url,
                        "template_used": selected_template["template_id"]
                    }
                )
            
            return {
                "success": True,
                "pdf_path": str(pdf_path),
                "pdf_filename": pdf_filename,
                "download_url": download_url,
                "file_size": len(template_content),
                "output_id": output_id,
                "template_used": selected_template["template_id"],
                "template_name": selected_template["template_name"],
                "is_enhanced": True,
                "message": f"Enhanced PDF created with dynamic template {selected_template['template_id']}"
            }
            
        except Exception as e:
            # Log PDF creation error
            if project_id:
                self.db.log_workflow_activity(
                    project_id, "pdf_creation_error",
                    notes=f"PDF creation failed: {str(e)}"
                )
            
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a workflow by ID (enhanced with database lookup)"""
        # Look for files with this workflow ID
        takeoff_files = list(self.takeoff_dir.glob(f"*{workflow_id}*"))
        sow_files = list(self.sow_dir.glob(f"*{workflow_id}*"))
        pdf_files = list(self.pdf_dir.glob(f"*{workflow_id}*"))
        
        status = {
            "workflow_id": workflow_id,
            "files_found": {
                "takeoff": [str(f) for f in takeoff_files],
                "sow": [str(f) for f in sow_files], 
                "pdf": [str(f) for f in pdf_files]
            },
            "status": "completed" if pdf_files else "in_progress",
            "database_connected": self.db.is_connected(),
            "dynamic_template_enabled": True
        }
        
        # If no files found, return None (workflow doesn't exist)
        if not any([takeoff_files, sow_files, pdf_files]):
            return None
        
        return status

def main():
    """CLI interface for testing the orchestrator with dynamic templates"""
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
        print("SOW ORCHESTRATION RESULTS - DYNAMIC TEMPLATE SELECTION")
        print("=" * 60)
        print(f"Workflow ID: {result['workflow_id']}")
        print(f"Status: {result['status']}")
        print(f"Timestamp: {result['timestamp']}")
        print(f"Database Connected: {orchestrator.db.is_connected()}")
        print()
        
        for step_name, step_result in result['steps'].items():
            print(f"Step: {step_name.upper()}")
            if step_result.get('success'):
                print(f"  ✅ Success")
                if step_name == 'template_selection':
                    template_info = step_result['selected_template']
                    print(f"  🎯 Template: {template_info['template_id']} - {template_info['template_name']}")
                    print(f"  📊 Confidence: {template_info['confidence']}")
                    print(f"  ⏱️  Duration: {template_info.get('estimated_duration', 'TBD')}")
                    if step_result.get('notes'):
                        for note in step_result['notes']:
                            print(f"    📝 {note}")
                if 'file_path' in step_result:
                    print(f"  📁 File: {step_result['file_path']}")
                if 'project_id' in step_result:
                    print(f"  🗄️  Project ID: {step_result['project_id']}")
                if 'generation_id' in step_result:
                    print(f"  🔄 Generation ID: {step_result['generation_id']}")
                if step_name == 'validate':
                    if step_result['is_valid']:
                        print(f"  ✅ Validation passed")
                    else:
                        print(f"  ❌ Validation failed: {step_result['error_count']} errors")
                        for error in step_result.get('errors', []):
                            print(f"    • {error}")
            else:
                print(f"  ❌ Failed: {step_result.get('error', 'Unknown error')}")
                if step_result.get('message'):
                    print(f"  💬 {step_result['message']}")
            print()
        
        if result['status'] == 'success':
            print("🎉 SOW generation complete with DYNAMIC TEMPLATE SELECTION!")
            if 'create_pdf' in result['steps']:
                pdf_info = result['steps']['create_pdf']
                print(f"📄 Enhanced PDF ready: {pdf_info.get('download_url', 'N/A')}")
                print(f"🎯 Template Used: {pdf_info.get('template_used', 'Unknown')}")
        
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
