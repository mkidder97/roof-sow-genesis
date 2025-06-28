# 🚨 CRITICAL SUPABASE FIXES REQUIRED FOR PHASE 1 DEMO

## ⚠️ **Issue: Configuration Mismatch**

The system currently has **TWO DIFFERENT** Supabase URLs configured:

- **Docker Compose:** `https://tcxtdwfbifklgbvzjomn.supabase.co`
- **Frontend Client:** `https://dlnoitbisrpwnmdmbrwy.supabase.co`

**This will break the demo!**

## 🔧 **Required Immediate Fixes**

### **1. Fix Frontend Client URL**
File: `src/integrations/supabase/client.ts`

```typescript
// CURRENT (WRONG):
const SUPABASE_URL = "https://dlnoitbisrpwnmdmbrwy.supabase.co";

// FIX TO MATCH DOCKER-COMPOSE:
const SUPABASE_URL = "https://tcxtdwfbifklgbvzjomn.supabase.co";
```

### **2. Add Supabase Integration to MCP Orchestrator**
File: `mcp/tools/sow_orchestrator.py`

Add database writes for:
- Creating project records
- Logging SOW generation
- Storing workflow activities
- Saving generated outputs

### **3. Update API Server**
File: `mcp/tools/api_server.py`

Add:
- Database persistence for workflows
- Project creation on form submission
- SOW generation tracking

## 📊 **Database Schema Confirmed**

✅ All required tables exist:
- `projects` (41 columns) - Ready for takeoff data
- `sow_generations` - Ready for workflow tracking
- `sow_outputs` - Ready for generated SOW metadata
- `workflow_activities` - Ready for activity logging

## 🎯 **Phase 1 Integration Scope**

**What SHOULD work after fixes:**
1. Frontend form submission → Database project record
2. MCP tools process data → Database SOW generation record
3. PDF creation → Database SOW output record
4. Workflow tracking → Database activity logs

**Database Operations Needed:**
```sql
-- 1. Create project from takeoff form
INSERT INTO projects (project_name, address, square_footage, ...)

-- 2. Log SOW generation start
INSERT INTO sow_generations (template_type, input_data, generation_status)

-- 3. Record workflow steps
INSERT INTO workflow_activities (project_id, activity_type, stage_to)

-- 4. Save final output
INSERT INTO sow_outputs (project_id, template_name, file_url, ...)
```

## 🚫 **Current Phase 1 Limitations**

**What's NOT integrated (but tables exist):**
- User authentication (development mode only)
- Construction management workflow
- Multi-user collaboration
- Real-time updates
- Advanced file management

## ✅ **Post-Fix Demo Flow**

1. **Frontend form submission** → Creates project in `projects` table
2. **API processes data** → Creates record in `sow_generations` table  
3. **MCP tools generate SOW** → Updates generation status
4. **PDF created** → Saves metadata in `sow_outputs` table
5. **Workflow complete** → Activity logged in `workflow_activities`

---

## 🎯 **Action Required**

**These fixes are REQUIRED before the Phase 1 demo can work properly with Supabase integration.**

Without these fixes, the demo will work but will NOT use the database, making it essentially a disconnected prototype rather than a proper integrated system.