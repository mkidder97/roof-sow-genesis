#!/usr/bin/env python3
"""
api_server.py
FastAPI server for SOW generation API endpoints
Handles form submissions and file downloads
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

# Import our orchestrator
from sow_orchestrator import SOWOrchestrator

# Create FastAPI app
app = FastAPI(
    title="SOW Generation API",
    description="API for roof SOW takeoff validation and document generation",
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

# Initialize orchestrator
orchestrator = SOWOrchestrator(data_dir="../../data")

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
    """Response model for workflow results"""
    workflow_id: str
    status: str
    timestamp: str
    validation_passed: bool
    download_url: Optional[str] = None
    error_message: Optional[str] = None
    validation_errors: List[str] = []
    validation_warnings: List[str] = []

# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "SOW Generation API is running", "status": "healthy"}

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "sow-generation-api",
        "version": "1.0.0",
        "endpoints": {
            "submit_takeoff": "/api/submit-takeoff",
            "validate_only": "/api/validate-only",
            "workflow_status": "/api/workflow/{workflow_id}",
            "download_pdf": "/api/download/pdf/{filename}",
            "recent_workflows": "/api/recent-workflows"
        }
    }

@app.post("/api/submit-takeoff", response_model=WorkflowResponse)
async def submit_takeoff(form_data: TakeoffFormData, background_tasks: BackgroundTasks):
    """
    Submit takeoff form data for SOW generation
    
    This endpoint:
    1. Validates the form data
    2. Runs the SOW generation workflow
    3. Returns workflow ID and status
    4. Provides download link when complete
    """
    try:
        # Convert Pydantic model to dict
        takeoff_data = form_data.dict(exclude_none=True)
        
        # Process through orchestrator
        result = orchestrator.process_takeoff_submission(takeoff_data)
        
        # Extract validation results
        validation_step = result.get("steps", {}).get("validate", {})
        validation_passed = validation_step.get("is_valid", False)
        validation_errors = validation_step.get("errors", [])
        validation_warnings = validation_step.get("warnings", [])
        
        # Extract download URL if PDF was created
        download_url = None
        if result["status"] == "success":
            pdf_step = result.get("steps", {}).get("create_pdf", {})
            if pdf_step.get("success"):
                download_url = pdf_step.get("download_url")
        
        return WorkflowResponse(
            workflow_id=result["workflow_id"],
            status=result["status"],
            timestamp=result["timestamp"],
            validation_passed=validation_passed,
            download_url=download_url,
            error_message=result.get("error", {}).get("message") if "error" in result else None,
            validation_errors=validation_errors,
            validation_warnings=validation_warnings
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/validate-only")
async def validate_takeoff_only(form_data: TakeoffFormData):
    """Validate takeoff data without generating SOW (for real-time validation)"""
    try:
        from validate_takeoff_data import TakeoffValidator
        
        takeoff_data = form_data.dict(exclude_none=True)
        validator = TakeoffValidator()
        is_valid, errors, warnings = validator.validate_data(takeoff_data)
        
        return {
            "is_valid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "error_count": len(errors),
            "warning_count": len(warnings)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

@app.get("/api/workflow/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """Get status of a specific workflow"""
    try:
        status = orchestrator.get_workflow_status(workflow_id)
        if not status:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving workflow: {str(e)}")

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
    """Get list of recent workflows"""
    try:
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
                
                workflows.append({
                    "workflow_id": workflow_id,
                    "project_name": data.get("project_name", "Unknown"),
                    "created": file_path.stat().st_mtime,
                    "roof_area": data.get("roof_area", 0),
                    "membrane_type": data.get("membrane_type", "Unknown")
                })
            except Exception:
                continue
        
        return {"workflows": workflows}
        
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