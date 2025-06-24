#!/bin/bash

# MCP Tools Setup Script
# Installs dependencies for all MCP analysis tools

echo "🔧 Setting up MCP Analysis Tools..."
echo "================================="

# Function to setup a tool
setup_tool() {
    local tool_dir=$1
    local tool_name=$2
    
    echo "📦 Setting up $tool_name..."
    
    if [ -d "mcp-tools/$tool_dir" ]; then
        cd "mcp-tools/$tool_dir"
        
        # Create package.json if it doesn't exist
        if [ ! -f "package.json" ]; then
            echo "{
  \"name\": \"$tool_dir\",
  \"version\": \"1.0.0\",
  \"description\": \"$tool_name for SOW generation\",
  \"main\": \"index.ts\",
  \"scripts\": {
    \"start\": \"node index.ts\",
    \"build\": \"tsc\",
    \"dev\": \"ts-node index.ts\"
  },
  \"dependencies\": {
    \"@types/node\": \"^20.0.0\",
    \"typescript\": \"^5.0.0\",
    \"ts-node\": \"^10.0.0\"
  }
}" > package.json
        fi
        
        # Install dependencies
        npm install
        
        echo "   ✅ $tool_name setup complete"
        cd ../../
    else
        echo "   ⚠️ Directory mcp-tools/$tool_dir not found"
    fi
    
    echo ""
}

# Setup each MCP tool
setup_tool "analyze-pdf-output" "PDF Analysis Tool"
setup_tool "pdf-formatting-optimizer" "PDF Formatting Optimizer"
setup_tool "propose-fix-snippet" "Fix Proposal Tool"
setup_tool "write-fix-module" "Fix Module Writer"
setup_tool "log-fix-history" "Fix History Logger"
setup_tool "trigger-regeneration" "Regeneration Trigger"

echo "🎉 MCP Tools Setup Complete!"
echo ""
echo "📋 Available Tools:"
echo "   📄 analyze-pdf-output - Analyze generated PDFs for compliance"
echo "   🎨 pdf-formatting-optimizer - Optimize PDF formatting"
echo "   🔧 propose-fix-snippet - Suggest code fixes"
echo "   ✍️ write-fix-module - Write fix modules"
echo "   📝 log-fix-history - Log fix attempts"
echo "   🔄 trigger-regeneration - Trigger SOW regeneration"
echo ""
echo "🧪 Test PDF Analysis:"
echo "   cd mcp-tools/analyze-pdf-output"
echo "   echo '{\"projectName\": \"Test\"}' > test-input.json"
echo "   node index.ts /path/to/pdf test-input.json"
echo ""
echo "✅ Ready for enhanced SOW testing!"