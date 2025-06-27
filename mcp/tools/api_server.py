#!/usr/bin/env python3
"""
api_server.py
FastAPI server for SOW generation API endpoints
Enhanced with Supabase database integration for Phase 1
Handles form submissions, database persistence, and file downloads
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import uvicorn
import json
import os
from pathlib import Path
from datetime import datetime

# Import our orchestrator and database client
from sow_orchestrator import SOWOrchestrator
from supabase_client import get_supabase_client

# Create FastAPI app
app = FastAPI(
    title="SOW Generation API",
    description="API for roof SOW takeoff validation and document generation with database integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize orchestrator and database client
orchestrator = SOWOrchestrator(data_dir="../../data")
db_client = get_supabase_client()

# Pydantic models for request/response
class TakeoffFormData(BaseModel):
    """Takeoff form data from frontend"""
    project_name: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=10, max_length=200)
    roof_area: float = Field(..., gt=0, le=1000000)
    membrane_type: str = Field(..., regex="^(TPO|EPDM|PVC|Modified Bitumen|Built-Up)$")
    fastening_pattern: str = Field(..., regex="^(Mechanically Attached|Fully Adhered|Ballasted)$")
    
    # Optional fields
    insulation_type: Optional[str] = Field(None, regex="^(Polyiso|XPS|EPS|Mineral Wool|None)$")
    insulation_thickness: Optional[float] = Field(None, ge=0, le=12)
    deck_type: Optional[str] = Field(None, regex="^(Steel|Concrete|Wood|Lightweight Concrete)$")
    building_height: Optional[float] = Field(None, ge=8, le=500)
    wind_zone: Optional[str] = Field(None, regex="^(I|II|III|IV)$")
    hvhz_zone: Optional[bool] = None
    county: Optional[str] = Field(None, min_length=2, max_length=50)
    state: Optional[str] = Field(None, regex="^[A-Z]{2}$")
    building_code: Optional[str] = Field(None, regex="^(IBC2021|IBC2018|FBC2020|FBC2023)$")
    asce_version: Optional[str] = Field(None, regex="^(7-16|7-22|7-10)$")

class WorkflowResponse(BaseModel):
    """Enhanced response model for workflow results with database info"""
    workflow_id: str
    project_id: Optional[str] = None
    generation_id: Optional[str] = None
    status: str
    timestamp: str
    validation_passed: bool
    download_url: Optional[str] = None
    error_message: Optional[str] = None
    validation_errors: List[str] = []
    validation_warnings: List[str] = []
    database_connected: bool = False
    database_operations: Dict[str, Any] = {}

class DatabaseProjectInfo(BaseModel):
    """Project information from database"""
    id: str
    project_name: str
    address: str
    roof_area: float
    membrane_type: str
    current_stage: str
    created_at: str
    updated_at: str

# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "SOW Generation API is running", "status": "healthy"}

@app.get("/api/health")
async def health_check():
    """Detailed health check with database status"""
    db_connected = db_client.is_connected()
    
    return {
        "status": "healthy",
        "service": "sow-generation-api",
        "version": "1.0.0",
        "database": {
            "connected": db_connected,
            "url": db_client.url if db_connected else "Not connected"
        },
        "endpoints": {
            "submit_takeoff": "/api/submit-takeoff",
            "validate_only": "/api/validate-only",
            "workflow_status": "/api/workflow/{workflow_id}",
            "download_pdf": "/api/download/pdf/{filename}",
            "recent_workflows": "/api/recent-workflows",
            "database_projects": "/api/database/projects"
        }
    }

@app.post("/api/submit-takeoff", response_model=WorkflowResponse)
async def submit_takeoff(form_data: TakeoffFormData, background_tasks: BackgroundTasks):
    """
    Submit takeoff form data for SOW generation with database integration
    
    This endpoint:
    1. Validates the form data
    2. Creates project record in database
    3. Runs the SOW generation workflow
    4. Tracks all steps in database
    5. Returns workflow ID and status with database info
    """
    try:
        # Convert Pydantic model to dict
        takeoff_data = form_data.dict(exclude_none=True)
        
        # Process through orchestrator (now includes database operations)
        result = orchestrator.process_takeoff_submission(takeoff_data)
        
        # Extract validation results
        validation_step = result.get("steps", {}).get("validate", {})
        validation_passed = validation_step.get("is_valid", False)
        validation_errors = validation_step.get("errors", [])
        validation_warnings = validation_step.get("warnings", [])
        
        # Extract database operation results
        project_step = result.get("steps", {}).get("create_project", {})
        generation_step = result.get("steps", {}).get("create_generation", {})
        
        project_id = project_step.get("project_id")
        generation_id = generation_step.get("generation_id")
        
        # Extract download URL if PDF was created
        download_url = None
        if result["status"] == "success":
            pdf_step = result.get("steps", {}).get("create_pdf", {})
            if pdf_step.get("success"):
                download_url = pdf_step.get("download_url")
        
        # Collect database operation summaries
        database_operations = {}
        for step_name, step_data in result.get("steps", {}).items():
            if step_name in ["create_project", "create_generation"]:
                database_operations[step_name] = {
                    "success": step_data.get("success", False),
                    "id": step_data.get("project_id") or step_data.get("generation_id"),
                    "message": step_data.get("message", "")
                }
        
        return WorkflowResponse(
            workflow_id=result["workflow_id"],
            project_id=project_id,
            generation_id=generation_id,
            status=result["status"],
            timestamp=result["timestamp"],
            validation_passed=validation_passed,
            download_url=download_url,
            error_message=result.get("error", {}).get("message") if "error" in result else None,
            validation_errors=validation_errors,
            validation_warnings=validation_warnings,
            database_connected=db_client.is_connected(),
            database_operations=database_operations
        )
        
    except Exception as e:
        # Log error to database if possible
        try:
            db_client.log_workflow_activity(
                "unknown", "api_error",
                notes=f"API endpoint error: {str(e)}"
            )
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/validate-only")
async def validate_takeoff_only(form_data: TakeoffFormData):
    """Validate takeoff data without generating SOW (for real-time validation)"""
    try:
        from validate_takeoff_data import TakeoffValidator
        
        takeoff_data = form_data.dict(exclude_none=True)
        
        # Initialize validator with database client for enhanced validation
        validator = TakeoffValidator(db_client=db_client if db_client.is_connected() else None)
        is_valid, errors, warnings = validator.validate_data(takeoff_data)
        
        return {
            "is_valid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "error_count": len(errors),
            "warning_count": len(warnings),
            "database_connected": db_client.is_connected()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

@app.get("/api/workflow/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """Get status of a specific workflow (enhanced with database lookup)"""
    try:
        # Get file-based status
        file_status = orchestrator.get_workflow_status(workflow_id)
        if not file_status:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Try to enhance with database information
        enhanced_status = file_status.copy()
        enhanced_status["database_connected"] = db_client.is_connected()
        
        if db_client.is_connected():
            try:
                # This would require additional database queries to lookup by workflow_id
                # For now, we'll include database connection status
                enhanced_status["database_info"] = "Database lookup available but not implemented in this endpoint"
            except Exception as e:
                enhanced_status["database_error"] = str(e)
        
        return enhanced_status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving workflow: {str(e)}")

@app.get("/api/database/projects")
async def get_database_projects(limit: int = 10, offset: int = 0):
    """Get recent projects from database (new endpoint for database integration)"""
    if not db_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        # Query projects from database
        result = db_client.client.table("projects")\
            .select("id,project_name,address,square_footage,membrane_thickness,current_stage,created_at,updated_at")\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        if result.data:
            projects = []
            for project in result.data:
                projects.append({
                    "id": project["id"],
                    "project_name": project["project_name"],
                    "address": project["address"],
                    "roof_area": project.get("square_footage", 0),
                    "membrane_type": project.get("membrane_thickness", "Unknown"),
                    "current_stage": project.get("current_stage", "unknown"),
                    "created_at": project["created_at"],
                    "updated_at": project.get("updated_at", project["created_at"])
                })
            
            return {
                "projects": projects,
                "total_retrieved": len(projects),
                "offset": offset,
                "limit": limit,
                "database_connected": True
            }
        else:
            return {
                "projects": [],
                "total_retrieved": 0,
                "offset": offset,
                "limit": limit,
                "database_connected": True,
                "message": "No projects found in database"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")

@app.get("/api/database/sow-generations")
async def get_sow_generations(limit: int = 10, offset: int = 0):
    """Get recent SOW generations from database"""
    if not db_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        result = db_client.client.table("sow_generations")\
            .select("id,inspection_id,template_type,generation_status,generation_started_at,generation_completed_at")\
            .order("generation_started_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        if result.data:
            generations = []
            for gen in result.data:
                generations.append({
                    "id": gen["id"],
                    "project_id": gen["inspection_id"],
                    "template_type": gen["template_type"],
                    "status": gen["generation_status"],
                    "started_at": gen["generation_started_at"],
                    "completed_at": gen.get("generation_completed_at"),
                })
            
            return {
                "generations": generations,
                "total_retrieved": len(generations),
                "offset": offset,
                "limit": limit,
                "database_connected": True
            }
        else:
            return {
                "generations": [],
                "total_retrieved": 0,
                "message": "No SOW generations found in database"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")

@app.get("/api/download/pdf/{filename}")
async def download_pdf(filename: str):
    """Download generated PDF file"""
    try:
        pdf_path = orchestrator.pdf_dir / filename
        
        if not pdf_path.exists():
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        return FileResponse(
            path=str(pdf_path),
            filename=filename,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="PDF file not found")
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")

@app.get("/api/recent-workflows")
async def get_recent_workflows(limit: int = 10):
    """Get list of recent workflows (enhanced with database info when available)"""
    try:
        # Get file-based workflows
        takeoff_files = list(orchestrator.takeoff_dir.glob("takeoff_*.json"))
        takeoff_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        workflows = []
        for file_path in takeoff_files[:limit]:
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                # Extract workflow ID from filename
                filename = file_path.name
                workflow_id = filename.split('_')[1] if '_' in filename else "unknown"
                
                workflow_info = {
                    "workflow_id": workflow_id,
                    "project_name": data.get("project_name", "Unknown"),
                    "created": file_path.stat().st_mtime,
                    "roof_area": data.get("roof_area", 0),
                    "membrane_type": data.get("membrane_type", "Unknown"),
                    "source": "file_system"
                }
                
                workflows.append(workflow_info)
            except Exception:
                continue
        
        response = {
            "workflows": workflows,
            "total_found": len(workflows),
            "database_connected": db_client.is_connected(),
            "source": "file_system"
        }
        
        # Add database information if available
        if db_client.is_connected():
            try:
                # Get recent projects from database as well
                db_result = db_client.client.table("projects")\
                    .select("id,project_name,created_at,square_footage")\
                    .order("created_at", desc=True)\
                    .limit(5)\
                    .execute()
                
                if db_result.data:
                    response["recent_database_projects"] = len(db_result.data)
                    response["database_status"] = "active"
                else:
                    response["database_status"] = "empty"
            except Exception as e:
                response["database_error"] = str(e)
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving workflows: {str(e)}")

# Mount static files for data directory (for downloads)
data_path = Path(__file__).parent / "../../data"
if data_path.exists():
    app.mount("/data", StaticFiles(directory=str(data_path)), name="data")

def start_server(host: str = "0.0.0.0", port: int = 8001, reload: bool = True):
    """Start the FastAPI server"""
    print(f"🚀 Starting SOW Generation API server...")
    print(f"📡 Server URL: http://{host}:{port}")
    print(f"📖 API Docs: http://{host}:{port}/docs")
    print(f"🔧 Health Check: http://{host}:{port}/api/health")
    print(f"🗄️  Database Connected: {db_client.is_connected()}")
    
    uvicorn.run(
        "api_server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="SOW Generation API Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8001, help="Port to bind to")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto-reload")
    
    args = parser.parse_args()
    
    start_server(
        host=args.host,
        port=args.port,
        reload=not args.no_reload
    )
