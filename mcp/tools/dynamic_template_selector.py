#!/usr/bin/env python3
"""
dynamic_template_selector.py
Intelligent template selection engine based on project specifications
Maps user inputs to appropriate SOW templates dynamically
"""

from typing import Dict, Any, Optional, List, Tuple
import json

class DynamicTemplateSelector:
    """
    Dynamic template selection engine that intelligently maps user inputs
    to appropriate SOW templates based on roofing specifications
    """
    
    def __init__(self):
        """Initialize with template mapping rules"""
        self.template_mapping = {
            # Key: (work_type, membrane_type, attachment_method, deck_type)
            # Value: (template_id, template_name, description)
            
            # RECOVER TEMPLATES
            ("recover", "TPO", "mechanically_attached", "steel"): (
                "T2", "T2-Recover-TPO(MA)-cvr-bd-BUR-lwc-steel",
                "TPO recover over BUR on lightweight concrete and steel deck"
            ),
            ("recover", "TPO", "mechanically_attached", "concrete"): (
                "T2", "T2-Recover-TPO(MA)-cvr-bd-BUR-lwc-steel", 
                "TPO recover over existing membrane on concrete"
            ),
            ("recover", "TPO_fleece", "mechanically_attached", "steel"): (
                "T4", "T4-Recover-TPOfleece(MA)-BUR-lwc-steel",
                "TPO fleeceback recover over BUR on steel (Note: Not for Prologis)"
            ),
            ("recover", "TPO", "rhino_bond", "steel"): (
                "T5", "T5-Recover-TPO(Rhino)-iso-EPS-flute-fill-SSR",
                "TPO with Rhino Bond over structural standing seam roof"
            ),
            
            # TEAROFF TEMPLATES  
            ("tearoff", "TPO", "mechanically_attached", "steel"): (
                "T6", "T6-Tearoff-TPO(MA)-insul-steel",
                "TPO tearoff and replacement with insulation on steel deck"
            ),
            ("tearoff", "TPO", "mechanically_attached", "lightweight_concrete"): (
                "T7", "T7-Tearoff-TPO(MA)-insul-lwc-steel", 
                "TPO tearoff over lightweight concrete on steel deck"
            ),
            ("tearoff", "TPO", "fully_adhered", "gypsum"): (
                "T8", "T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum",
                "Fully adhered TPO tearoff and replacement on gypsum deck"
            ),
            
            # DEFAULT FALLBACKS
            ("recover", "TPO", "mechanically_attached", None): (
                "T2", "T2-Recover-TPO(MA)-cvr-bd-BUR-lwc-steel",
                "Standard TPO recover (deck type to be determined)"
            ),
            ("tearoff", "TPO", "mechanically_attached", None): (
                "T6", "T6-Tearoff-TPO(MA)-insul-steel", 
                "Standard TPO tearoff (deck type to be determined)"
            ),
        }
        
        # Template metadata for database integration
        self.template_metadata = {
            "T2": {
                "work_type": "recover",
                "membrane_types": ["TPO"],
                "attachment_methods": ["mechanically_attached"],
                "deck_types": ["steel", "concrete", "lightweight_concrete"],
                "sections": ["project_overview", "existing_conditions", "scope_of_work", 
                           "materials", "installation", "fastening_requirements", 
                           "flashing_details", "warranty"],
                "complexity": "standard",
                "estimated_duration": "5-7 days per 10,000 sf"
            },
            "T4": {
                "work_type": "recover", 
                "membrane_types": ["TPO_fleece"],
                "attachment_methods": ["mechanically_attached"],
                "deck_types": ["steel"],
                "sections": ["project_overview", "scope_of_work", "materials", 
                           "installation", "fleeceback_requirements"],
                "complexity": "standard",
                "estimated_duration": "4-6 days per 10,000 sf",
                "restrictions": ["Not approved for Prologis projects"]
            },
            "T5": {
                "work_type": "recover",
                "membrane_types": ["TPO"],
                "attachment_methods": ["rhino_bond", "induction_welded"],
                "deck_types": ["structural_standing_seam"],
                "sections": ["project_overview", "scope_of_work", "materials",
                           "installation", "rhino_bond_requirements", "EPS_flute_fill"],
                "complexity": "complex",
                "estimated_duration": "6-8 days per 10,000 sf"
            },
            "T6": {
                "work_type": "tearoff",
                "membrane_types": ["TPO"],
                "attachment_methods": ["mechanically_attached"],
                "deck_types": ["steel"],
                "sections": ["project_overview", "tearoff_requirements", "scope_of_work",
                           "materials", "insulation", "installation", "fastening", "warranty"],
                "complexity": "standard", 
                "estimated_duration": "7-10 days per 10,000 sf"
            },
            "T7": {
                "work_type": "tearoff",
                "membrane_types": ["TPO"],
                "attachment_methods": ["mechanically_attached"], 
                "deck_types": ["lightweight_concrete", "steel"],
                "sections": ["project_overview", "tearoff_requirements", "scope_of_work",
                           "materials", "insulation", "installation", "lwc_considerations"],
                "complexity": "standard",
                "estimated_duration": "8-11 days per 10,000 sf"
            },
            "T8": {
                "work_type": "tearoff",
                "membrane_types": ["TPO"],
                "attachment_methods": ["fully_adhered"],
                "deck_types": ["gypsum"],
                "sections": ["project_overview", "tearoff_requirements", "scope_of_work",
                           "materials", "adhered_insulation", "adhered_membrane", "gypsum_requirements"],
                "complexity": "complex",
                "estimated_duration": "9-12 days per 10,000 sf"
            }
        }
    
    def select_template(self, project_data: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """
        Intelligently select the best template based on project specifications
        
        Args:
            project_data: Dictionary containing project specifications
            
        Returns:
            Tuple of (template_id, template_info_dict)
        """
        
        # Extract and normalize key specifications
        work_type = self._normalize_work_type(project_data.get("project_type", ""))
        membrane_type = self._normalize_membrane_type(project_data.get("membrane_type", ""))
        attachment_method = self._normalize_attachment_method(project_data.get("fastening_pattern", ""))
        deck_type = self._normalize_deck_type(project_data.get("deck_type", ""))
        
        # Create lookup key
        lookup_key = (work_type, membrane_type, attachment_method, deck_type)
        
        # Try exact match first
        if lookup_key in self.template_mapping:
            template_id, template_name, description = self.template_mapping[lookup_key]
            return self._build_template_response(template_id, template_name, description, project_data)
        
        # Try with None deck_type for partial match
        fallback_key = (work_type, membrane_type, attachment_method, None)
        if fallback_key in self.template_mapping:
            template_id, template_name, description = self.template_mapping[fallback_key]
            return self._build_template_response(template_id, template_name, description, project_data, 
                                                notes=["Deck type needs verification for optimal template selection"])
        
        # Ultimate fallback - return most common template with warnings
        return self._build_fallback_response(project_data)
    
    def _normalize_work_type(self, work_type: str) -> str:
        """Normalize work type input"""
        work_type = work_type.lower().strip()
        if "recover" in work_type or "re-cover" in work_type:
            return "recover"
        elif "tearoff" in work_type or "tear-off" in work_type or "replacement" in work_type:
            return "tearoff"
        else:
            return "recover"  # Default to recover
    
    def _normalize_membrane_type(self, membrane_type: str) -> str:
        """Normalize membrane type input"""
        membrane_type = membrane_type.upper().strip()
        if "FLEECE" in membrane_type or "FLEECEBACK" in membrane_type:
            return "TPO_fleece"
        elif "TPO" in membrane_type:
            return "TPO"
        elif "EPDM" in membrane_type:
            return "EPDM"
        elif "PVC" in membrane_type:
            return "PVC"
        else:
            return "TPO"  # Default to TPO
    
    def _normalize_attachment_method(self, fastening_pattern: str) -> str:
        """Normalize attachment method input"""
        fastening_pattern = fastening_pattern.lower().strip()
        if "mechanical" in fastening_pattern or "attached" in fastening_pattern:
            return "mechanically_attached"
        elif "adhered" in fastening_pattern or "fully" in fastening_pattern:
            return "fully_adhered"
        elif "rhino" in fastening_pattern or "induction" in fastening_pattern:
            return "rhino_bond"
        elif "ballasted" in fastening_pattern:
            return "ballasted"
        else:
            return "mechanically_attached"  # Default to MA
    
    def _normalize_deck_type(self, deck_type: str) -> Optional[str]:
        """Normalize deck type input"""
        if not deck_type:
            return None
            
        deck_type = deck_type.lower().strip()
        if "steel" in deck_type:
            return "steel"
        elif "concrete" in deck_type:
            if "lightweight" in deck_type or "lwc" in deck_type:
                return "lightweight_concrete"
            else:
                return "concrete"
        elif "gypsum" in deck_type:
            return "gypsum"
        elif "wood" in deck_type:
            return "wood"
        elif "standing" in deck_type and "seam" in deck_type:
            return "structural_standing_seam"
        else:
            return None
    
    def _build_template_response(self, template_id: str, template_name: str, 
                               description: str, project_data: Dict[str, Any], 
                               notes: Optional[List[str]] = None) -> Tuple[str, Dict[str, Any]]:
        """Build comprehensive template response"""
        
        metadata = self.template_metadata.get(template_id, {})
        
        template_info = {
            "template_id": template_id,
            "template_name": template_name,
            "description": description,
            "metadata": metadata,
            "selection_logic": {
                "work_type": self._normalize_work_type(project_data.get("project_type", "")),
                "membrane_type": self._normalize_membrane_type(project_data.get("membrane_type", "")),
                "attachment_method": self._normalize_attachment_method(project_data.get("fastening_pattern", "")),
                "deck_type": self._normalize_deck_type(project_data.get("deck_type", ""))
            },
            "confidence": "high",
            "notes": notes or [],
            "estimated_duration": metadata.get("estimated_duration", "To be determined"),
            "complexity": metadata.get("complexity", "standard"),
            "sections": metadata.get("sections", [])
        }
        
        return template_id, template_info
    
    def _build_fallback_response(self, project_data: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """Build fallback response when no template matches"""
        
        template_info = {
            "template_id": "T2",  # Safe fallback
            "template_name": "T2-Recover-TPO(MA)-cvr-bd-BUR-lwc-steel",
            "description": "Default TPO template - requires manual review",
            "metadata": self.template_metadata.get("T2", {}),
            "selection_logic": {
                "work_type": self._normalize_work_type(project_data.get("project_type", "")),
                "membrane_type": self._normalize_membrane_type(project_data.get("membrane_type", "")),
                "attachment_method": self._normalize_attachment_method(project_data.get("fastening_pattern", "")),
                "deck_type": self._normalize_deck_type(project_data.get("deck_type", ""))
            },
            "confidence": "low",
            "notes": [
                "No exact template match found for specified parameters",
                "Using default TPO recover template",
                "Manual review recommended for template selection"
            ],
            "estimated_duration": "To be determined based on final specifications",
            "complexity": "requires_review"
        }
        
        return "T2", template_info
    
    def get_available_templates(self, work_type: Optional[str] = None, 
                              membrane_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get list of available templates, optionally filtered"""
        
        templates = []
        for template_id, metadata in self.template_metadata.items():
            # Apply filters if provided
            if work_type and metadata.get("work_type") != self._normalize_work_type(work_type):
                continue
            if membrane_type and self._normalize_membrane_type(membrane_type) not in metadata.get("membrane_types", []):
                continue
                
            templates.append({
                "template_id": template_id,
                "template_name": f"{template_id}-{metadata.get('work_type', '')}-{'-'.join(metadata.get('membrane_types', []))}",
                "work_type": metadata.get("work_type"),
                "membrane_types": metadata.get("membrane_types", []),
                "attachment_methods": metadata.get("attachment_methods", []),
                "deck_types": metadata.get("deck_types", []),
                "complexity": metadata.get("complexity"),
                "estimated_duration": metadata.get("estimated_duration")
            })
        
        return sorted(templates, key=lambda x: x["template_id"])
    
    def validate_template_compatibility(self, template_id: str, 
                                      project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate if selected template is compatible with project data"""
        
        if template_id not in self.template_metadata:
            return {
                "compatible": False,
                "errors": [f"Template {template_id} not found"],
                "warnings": [],
                "recommendations": ["Please select a valid template"]
            }
        
        metadata = self.template_metadata[template_id]
        errors = []
        warnings = []
        recommendations = []
        
        # Check work type compatibility
        work_type = self._normalize_work_type(project_data.get("project_type", ""))
        if work_type != metadata.get("work_type"):
            errors.append(f"Work type mismatch: Template is for {metadata.get('work_type')}, project is {work_type}")
        
        # Check membrane type compatibility  
        membrane_type = self._normalize_membrane_type(project_data.get("membrane_type", ""))
        if membrane_type not in metadata.get("membrane_types", []):
            errors.append(f"Membrane type '{membrane_type}' not supported by this template")
        
        # Check deck type compatibility
        deck_type = self._normalize_deck_type(project_data.get("deck_type", ""))
        if deck_type and deck_type not in metadata.get("deck_types", []):
            warnings.append(f"Deck type '{deck_type}' may not be optimal for this template")
        
        # Check for restrictions
        if "restrictions" in metadata:
            for restriction in metadata["restrictions"]:
                warnings.append(f"Template restriction: {restriction}")
        
        return {
            "compatible": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "recommendations": recommendations,
            "confidence": "high" if len(errors) == 0 and len(warnings) == 0 else "medium" if len(errors) == 0 else "low"
        }

# Example usage and testing
if __name__ == "__main__":
    selector = DynamicTemplateSelector()
    
    # Test cases
    test_projects = [
        {
            "project_type": "recover",
            "membrane_type": "TPO",
            "fastening_pattern": "Mechanically Attached",
            "deck_type": "Steel"
        },
        {
            "project_type": "tearoff", 
            "membrane_type": "TPO",
            "fastening_pattern": "Fully Adhered",
            "deck_type": "Gypsum"
        },
        {
            "project_type": "recover",
            "membrane_type": "TPO",
            "fastening_pattern": "Rhino Bond", 
            "deck_type": "Structural Standing Seam"
        }
    ]
    
    print("=== DYNAMIC TEMPLATE SELECTION TESTING ===")
    for i, project in enumerate(test_projects, 1):
        print(f"\nTest Case {i}:")
        print(f"Input: {project}")
        
        template_id, template_info = selector.select_template(project)
        print(f"Selected Template: {template_id}")
        print(f"Template Name: {template_info['template_name']}")
        print(f"Confidence: {template_info['confidence']}")
        print(f"Estimated Duration: {template_info['estimated_duration']}")
        if template_info['notes']:
            print(f"Notes: {', '.join(template_info['notes'])}")
