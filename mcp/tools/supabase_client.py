#!/usr/bin/env python3
"""
supabase_client.py
Shared Supabase database client for MCP tools
Handles database operations for projects, SOW generations, and workflow tracking
"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from supabase import create_client, Client
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseClient:
    """Supabase database client for SOW generation workflow"""
    
    def __init__(self):
        """Initialize Supabase client with environment variables"""
        self.url = os.getenv("SUPABASE_URL", "https://tcxtdwfbifklgbvzjomn.supabase.co")
        self.key = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjeHRkd2ZiaWZrbGdidnpqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzM0ODYsImV4cCI6MjA1MjU0OTQ4Nn0.RJbvfH3j_qMjIj8jWz1jv_cOJf2J-gMqgJdU8Q6fHoM")
        
        try:
            self.client: Client = create_client(self.url, self.key)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            self.client = None
    
    def is_connected(self) -> bool:
        """Check if Supabase client is properly connected"""
        return self.client is not None
    
    def create_project(self, takeoff_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new project record from takeoff form data
        
        Args:
            takeoff_data: Dictionary containing takeoff form data
            
        Returns:
            Project ID if successful, None if failed
        """
        if not self.is_connected():
            logger.warning("Supabase not connected, skipping project creation")
            return None
            
        try:
            # Generate project ID
            project_id = str(uuid.uuid4())
            
            # Map takeoff data to projects table schema
            project_record = {
                "id": project_id,
                "user_id": str(uuid.uuid4()),  # Demo user for Phase 1
                "project_name": takeoff_data.get("project_name", ""),
                "address": takeoff_data.get("address", ""),
                "company_name": takeoff_data.get("company_name", "SRC Demo"),
                "square_footage": int(takeoff_data.get("roof_area", 0)),
                "building_height": int(takeoff_data.get("building_height", 0)),
                "project_type": "recover",
                "membrane_thickness": "60",
                "membrane_color": "White",
                "elevation": 0,
                "deck_type": takeoff_data.get("deck_type", "Steel"),
                "exposure_category": takeoff_data.get("wind_zone", "II"),
                "roof_slope": 0.0,
                "insulation_type": takeoff_data.get("insulation_type", "Polyisocyanurate"),
                "insulation_thickness": float(takeoff_data.get("insulation_thickness", 2.0)),
                "insulation_r_value": 12.0,
                "cover_board_type": "Gypsum",
                "cover_board_thickness": 0.625,
                "has_existing_insulation": False,
                "existing_insulation_condition": "good",
                "number_of_drains": 0,
                "drain_types": [],
                "number_of_penetrations": 0,
                "penetration_types": [],
                "skylights": 0,
                "roof_hatches": 0,
                "hvac_units": 0,
                "walkway_pad_requested": False,
                "gutter_type": "None",
                "downspouts": 0,
                "expansion_joints": 0,
                "parapet_height": 0,
                "roof_configuration": "Single Level",
                "current_stage": "inspection",
                "workflow_status": {},
                "stage_data": takeoff_data
            }
            
            # Insert project record
            result = self.client.table("projects").insert(project_record).execute()
            
            if result.data:
                logger.info(f"Project created successfully: {project_id}")
                return project_id
            else:
                logger.error(f"Failed to create project: {result}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating project: {e}")
            return None
    
    def create_sow_generation(self, project_id: str, template_type: str, input_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new SOW generation record
        
        Args:
            project_id: ID of the associated project
            template_type: Type of SOW template being generated
            input_data: Input data for SOW generation
            
        Returns:
            SOW generation ID if successful, None if failed
        """
        if not self.is_connected():
            logger.warning("Supabase not connected, skipping SOW generation creation")
            return None
            
        try:
            generation_id = str(uuid.uuid4())
            
            generation_record = {
                "id": generation_id,
                "inspection_id": project_id,
                "user_id": None,  # Demo mode
                "template_type": template_type,
                "generation_status": "pending",
                "input_data": input_data,
                "generation_started_at": datetime.now().isoformat()
            }
            
            result = self.client.table("sow_generations").insert(generation_record).execute()
            
            if result.data:
                logger.info(f"SOW generation created: {generation_id}")
                return generation_id
            else:
                logger.error(f"Failed to create SOW generation: {result}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating SOW generation: {e}")
            return None
    
    def update_sow_generation_status(self, generation_id: str, status: str, error_message: Optional[str] = None) -> bool:
        """
        Update SOW generation status
        
        Args:
            generation_id: ID of the SOW generation
            status: New status (pending, processing, completed, failed)
            error_message: Error message if status is failed
            
        Returns:
            True if successful, False if failed
        """
        if not self.is_connected():
            logger.warning("Supabase not connected, skipping status update")
            return False
            
        try:
            update_data = {
                "generation_status": status,
                "updated_at": datetime.now().isoformat()
            }
            
            if status == "completed":
                update_data["generation_completed_at"] = datetime.now().isoformat()
            elif status == "failed" and error_message:
                update_data["error_message"] = error_message
                
            result = self.client.table("sow_generations").update(update_data).eq("id", generation_id).execute()
            
            if result.data:
                logger.info(f"SOW generation status updated: {generation_id} -> {status}")
                return True
            else:
                logger.error(f"Failed to update SOW generation status: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating SOW generation status: {e}")
            return False
    
    def log_workflow_activity(self, project_id: str, activity_type: str, stage_from: Optional[str] = None, 
                            stage_to: Optional[str] = None, notes: Optional[str] = None, 
                            metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Log a workflow activity
        
        Args:
            project_id: ID of the associated project
            activity_type: Type of activity (validation, generation, etc.)
            stage_from: Previous stage
            stage_to: New stage
            notes: Additional notes
            metadata: Additional metadata
            
        Returns:
            True if successful, False if failed
        """
        if not self.is_connected():
            logger.warning("Supabase not connected, skipping activity log")
            return False
            
        try:
            activity_record = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "user_id": None,  # Demo mode
                "activity_type": activity_type,
                "stage_from": stage_from,
                "stage_to": stage_to,
                "notes": notes,
                "metadata": metadata or {},
                "data_changes": {}
            }
            
            result = self.client.table("workflow_activities").insert(activity_record).execute()
            
            if result.data:
                logger.info(f"Workflow activity logged: {activity_type}")
                return True
            else:
                logger.error(f"Failed to log workflow activity: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Error logging workflow activity: {e}")
            return False
    
    def create_sow_output(self, project_id: str, template_name: str, file_url: Optional[str] = None, 
                         filename: Optional[str] = None, engineering_summary: Optional[Dict[str, Any]] = None,
                         metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Create SOW output record
        
        Args:
            project_id: ID of the associated project
            template_name: Name of the template used
            file_url: URL to the generated file
            filename: Name of the generated file
            engineering_summary: Engineering calculation summary
            metadata: Additional metadata
            
        Returns:
            SOW output ID if successful, None if failed
        """
        if not self.is_connected():
            logger.warning("Supabase not connected, skipping SOW output creation")
            return None
            
        try:
            output_id = str(uuid.uuid4())
            
            output_record = {
                "id": output_id,
                "project_id": project_id,
                "template_name": template_name,
                "file_url": file_url,
                "filename": filename,
                "engineering_summary": engineering_summary,
                "metadata": metadata or {}
            }
            
            result = self.client.table("sow_outputs").insert(output_record).execute()
            
            if result.data:
                logger.info(f"SOW output created: {output_id}")
                return output_id
            else:
                logger.error(f"Failed to create SOW output: {result}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating SOW output: {e}")
            return None

# Global instance
_supabase_client = None

def get_supabase_client() -> SupabaseClient:
    """Get singleton Supabase client instance"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client