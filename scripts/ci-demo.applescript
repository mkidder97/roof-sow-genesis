#!/usr/bin/env osascript

-- 🎬 CI Demo Script for Roof SOW Genesis
-- This script demonstrates the enforced CI pipeline with red/green scenarios

on run
    set demoResults to ""
    set demoResults to demoResults & "🎬 CI ENFORCEMENT DEMO\n"
    set demoResults to demoResults & "====================\n\n"
    
    -- Check current setup
    set currentDir to do shell script "pwd"
    if currentDir does not contain "roof-sow-genesis" then
        display dialog "❌ Please run this from the roof-sow-genesis directory"
        return
    end if
    
    -- Show current status
    try
        set currentBranch to do shell script "git branch --show-current"
        set demoResults to demoResults & "📍 Current branch: " & currentBranch & "\n"
        set demoResults to demoResults & "📍 Current directory: " & currentDir & "\n\n"
    on error
        display dialog "❌ Not in a git repository"
        return
    end try
    
    -- Demo options
    display dialog "Choose your demo scenario:" buttons {"🔴 Show Failing CI", "🟢 Show Passing CI", "Cancel"} default button "🟢 Show Passing CI"
    set demoChoice to button returned of result
    
    if demoChoice is "Cancel" then
        return
    end if
    
    if demoChoice is "🔴 Show Failing CI" then
        my runFailingDemo()
    else if demoChoice is "🟢 Show Passing CI" then
        my runPassingDemo()
    end if
    
end run

-- Demo scenario: Introduce breaking change to show CI failure
on runFailingDemo()
    set demoResults to ""
    set demoResults to demoResults & "🔴 DEMONSTRATING FAILING CI\n"
    set demoResults to demoResults & "===========================\n\n"
    
    -- Create a breaking change
    set demoResults to demoResults & "Step 1: Introducing a deliberate syntax error...\n"
    try
        -- Add syntax error to a TypeScript file
        do shell script "echo 'const broken = syntax error without semicolon or quotes' >> src/main.tsx"
        set demoResults to demoResults & "✅ Added syntax error to src/main.tsx\n"
    on error errorMsg
        set demoResults to demoResults & "❌ Failed to create breaking change: " & errorMsg & "\n"
        display dialog demoResults
        return
    end try
    
    -- Commit and push the breaking change
    set demoResults to demoResults & "\nStep 2: Committing and pushing the broken code...\n"
    try
        do shell script "git add src/main.tsx"
        do shell script "git commit -m 'demo: introduce syntax error to test CI failure'"
        
        set demoResults to demoResults & "✅ Committed breaking change\n"
        set demoResults to demoResults & "🚀 Pushing to trigger CI...\n"
        
        do shell script "git push origin main"
        set demoResults to demoResults & "✅ Pushed to main branch\n"
        
    on error pushError
        set demoResults to demoResults & "❌ Failed to push: " & pushError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Show where to watch the CI
    set demoResults to demoResults & "\nStep 3: Watch CI fail in real-time!\n"
    set demoResults to demoResults & "👀 Go to: https://github.com/mkidder97/roof-sow-genesis/actions\n"
    set demoResults to demoResults & "📺 You'll see the workflow turn RED ❌\n"
    set demoResults to demoResults & "🔍 The frontend build will fail on the syntax error\n"
    set demoResults to demoResults & "🛑 CI will prevent this from being deployable\n\n"
    
    set demoResults to demoResults & "Step 4: Click 'Fix & Show Green' to revert and demonstrate success\n"
    
    display dialog demoResults with title "🔴 CI Failure Demo" buttons {"Fix & Show Green", "Open GitHub Actions", "Done"} default button "Fix & Show Green"
    set nextAction to button returned of result
    
    if nextAction is "Fix & Show Green" then
        my fixAndShowGreen()
    else if nextAction is "Open GitHub Actions" then
        do shell script "open https://github.com/mkidder97/roof-sow-genesis/actions"
    end if
    
end runFailingDemo

-- Demo scenario: Fix the breaking change and show CI success
on fixAndShowGreen()
    set demoResults to ""
    set demoResults to demoResults & "🟢 DEMONSTRATING PASSING CI\n"
    set demoResults to demoResults & "============================\n\n"
    
    -- Revert the breaking change
    set demoResults to demoResults & "Step 1: Reverting the breaking change...\n"
    try
        do shell script "git revert HEAD --no-edit"
        set demoResults to demoResults & "✅ Reverted the syntax error\n"
    on error revertError
        set demoResults to demoResults & "❌ Failed to revert: " & revertError & "\n"
        
        -- Try manual fix as backup
        try
            do shell script "git checkout HEAD~1 -- src/main.tsx"
            do shell script "git add src/main.tsx"
            do shell script "git commit -m 'demo: fix syntax error to show CI success'"
            set demoResults to demoResults & "✅ Manually fixed the syntax error\n"
        on error manualError
            set demoResults to demoResults & "❌ Manual fix failed: " & manualError & "\n"
            display dialog demoResults
            return
        end try
    end try
    
    -- Push the fix
    set demoResults to demoResults & "\nStep 2: Pushing the fix...\n"
    try
        do shell script "git push origin main"
        set demoResults to demoResults & "✅ Pushed fix to main branch\n"
    on error pushError
        set demoResults to demoResults & "❌ Failed to push fix: " & pushError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Show success
    set demoResults to demoResults & "\nStep 3: Watch CI succeed! 🎉\n"
    set demoResults to demoResults & "👀 Go to: https://github.com/mkidder97/roof-sow-genesis/actions\n"
    set demoResults to demoResults & "📺 You'll see the workflow turn GREEN ✅\n"
    set demoResults to demoResults & "🧪 All quality gates will pass:\n"
    set demoResults to demoResults & "   • Frontend build ✅\n"
    set demoResults to demoResults & "   • Backend build ✅\n"
    set demoResults to demoResults & "   • Unit tests ✅\n"
    set demoResults to demoResults & "   • Smoke tests ✅\n\n"
    
    set demoResults to demoResults & "🎯 DEMO COMPLETE!\n"
    set demoResults to demoResults & "Your CI now enforces quality and catches issues before deployment.\n"
    
    display dialog demoResults with title "🟢 CI Success Demo" buttons {"Open GitHub Actions", "Run Local Smoke Test", "Done"} default button "Open GitHub Actions"
    set finalAction to button returned of result
    
    if finalAction is "Open GitHub Actions" then
        do shell script "open https://github.com/mkidder97/roof-sow-genesis/actions"
    else if finalAction is "Run Local Smoke Test" then
        my runLocalSmokeTest()
    end if
    
end fixAndShowGreen

-- Demo scenario: Start with clean code and show CI success
on runPassingDemo()
    set demoResults to ""
    set demoResults to demoResults & "🟢 DEMONSTRATING PASSING CI\n"
    set demoResults to demoResults & "============================\n\n"
    
    -- Check current status
    set demoResults to demoResults & "Step 1: Verifying clean code state...\n"
    try
        set gitStatus to do shell script "git status --porcelain"
        if gitStatus is "" then
            set demoResults to demoResults & "✅ Working directory is clean\n"
        else
            set demoResults to demoResults & "⚠️ Working directory has changes:\n" & gitStatus & "\n"
        end if
    on error statusError
        set demoResults to demoResults & "❌ Git status error: " & statusError & "\n"
    end try
    
    -- Make a small, safe change to trigger CI
    set demoResults to demoResults & "\nStep 2: Making a safe change to trigger CI...\n"
    try
        set currentTime to do shell script "date"
        do shell script "echo '// Demo run at " & currentTime & "' >> README.md"
        set demoResults to demoResults & "✅ Added timestamp to README.md\n"
    on error changeError
        set demoResults to demoResults & "❌ Failed to make change: " & changeError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Commit and push
    set demoResults to demoResults & "\nStep 3: Committing and pushing...\n"
    try
        do shell script "git add README.md"
        do shell script "git commit -m 'demo: trigger CI with safe documentation update'"
        do shell script "git push origin main"
        set demoResults to demoResults & "✅ Pushed to trigger CI\n"
    on error pushError
        set demoResults to demoResults & "❌ Failed to push: " & pushError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Show where to watch success
    set demoResults to demoResults & "\nStep 4: Watch CI succeed! 🎉\n"
    set demoResults to demoResults & "👀 Go to: https://github.com/mkidder97/roof-sow-genesis/actions\n"
    set demoResults to demoResults & "📺 You'll see the workflow turn GREEN ✅\n"
    set demoResults to demoResults & "🧪 All quality gates will pass:\n"
    set demoResults to demoResults & "   • Frontend build & lint ✅\n"
    set demoResults to demoResults & "   • Backend build & TypeScript ✅\n"
    set demoResults to demoResults & "   • Unit tests ✅\n"
    set demoResults to demoResults & "   • Smoke tests (server startup + health checks) ✅\n\n"
    
    set demoResults to demoResults & "Want to see it fail? Click 'Show Failing CI'\n"
    
    display dialog demoResults with title "🟢 CI Success Demo" buttons {"Show Failing CI", "Open GitHub Actions", "Done"} default button "Open GitHub Actions"
    set nextAction to button returned of result
    
    if nextAction is "Show Failing CI" then
        my runFailingDemo()
    else if nextAction is "Open GitHub Actions" then
        do shell script "open https://github.com/mkidder97/roof-sow-genesis/actions"
    end if
    
end runPassingDemo

-- Run local smoke test to verify everything works
on runLocalSmokeTest()
    set testResults to ""
    set testResults to testResults & "🧪 LOCAL SMOKE TEST\n"
    set testResults to testResults & "===================\n\n"
    
    -- Kill any existing processes
    try
        do shell script "pkill -f 'tsx index.ts' || true"
        delay 2
    on error
        -- No existing processes
    end try
    
    -- Start server
    set testResults to testResults & "🚀 Starting server...\n"
    try
        do shell script "cd server && tsx index.ts > /tmp/demo_server.log 2>&1 & echo $! > /tmp/demo_server.pid"
        set serverPID to do shell script "cat /tmp/demo_server.pid"
        set testResults to testResults & "✅ Server started (PID: " & serverPID & ")\n"
        
        -- Wait for startup
        set serverReady to false
        repeat with i from 1 to 10
            delay 2
            try
                set healthCheck to do shell script "curl -s http://localhost:3001/health"
                if healthCheck contains "status" then
                    set serverReady to true
                    set testResults to testResults & "✅ Health check passed\n"
                    exit repeat
                end if
            on error
                -- Continue waiting
            end try
        end repeat
        
        if serverReady then
            set testResults to testResults & "🎉 Local smoke test PASSED!\n"
            set testResults to testResults & "Your server is working correctly.\n"
        else
            set testResults to testResults & "❌ Server failed to respond to health checks\n"
        end if
        
        -- Cleanup
        do shell script "kill " & serverPID & " 2>/dev/null || true"
        do shell script "rm -f /tmp/demo_server.pid /tmp/demo_server.log"
        
    on error serverError
        set testResults to testResults & "❌ Server error: " & serverError & "\n"
    end try
    
    display dialog testResults with title "🧪 Local Smoke Test Results"
    
end runLocalSmokeTest