#!/usr/bin/env osascript

-- 🎬 Enhanced CI Quality Gates Demo Script
-- Tests the new type-check and unit-test jobs along with existing quality gates

on run
    set demoResults to ""
    set demoResults to demoResults & "🎬 ENHANCED CI QUALITY GATES DEMO\n"
    set demoResults to demoResults & "===================================\n\n"
    
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
    display dialog "Choose your enhanced CI demo scenario:" buttons {"🔴 TypeScript Error Demo", "🧪 Unit Test Failure Demo", "🟢 All Quality Gates Pass", "Cancel"} default button "🟢 All Quality Gates Pass"
    set demoChoice to button returned of result
    
    if demoChoice is "Cancel" then
        return
    end if
    
    if demoChoice is "🔴 TypeScript Error Demo" then
        my runTypeScriptErrorDemo()
    else if demoChoice is "🧪 Unit Test Failure Demo" then
        my runUnitTestFailureDemo()
    else if demoChoice is "🟢 All Quality Gates Pass" then
        my runAllQualityGatesPassDemo()
    end if
    
end run

-- Demo scenario: Introduce TypeScript error to show type-check job failure
on runTypeScriptErrorDemo()
    set demoResults to ""
    set demoResults to demoResults & "🔴 DEMONSTRATING TYPE-CHECK FAILURE\n"
    set demoResults to demoResults & "===================================\n\n"
    
    -- Create a TypeScript error
    set demoResults to demoResults & "Step 1: Introducing a TypeScript type error...\n"
    try
        -- Add type error to a TypeScript file
        do shell script "echo '\n// Demo TypeScript error\nconst badVariable: string = 42; // Type error: number assigned to string' >> src/main.tsx"
        set demoResults to demoResults & "✅ Added TypeScript error to src/main.tsx\n"
    on error errorMsg
        set demoResults to demoResults & "❌ Failed to create TypeScript error: " & errorMsg & "\n"
        display dialog demoResults
        return
    end try
    
    -- Commit and push the breaking change
    set demoResults to demoResults & "\nStep 2: Committing and pushing the TypeScript error...\n"
    try
        do shell script "git add src/main.tsx"
        do shell script "git commit -m 'demo: introduce TypeScript error to test type-check job'"
        
        set demoResults to demoResults & "✅ Committed TypeScript error\n"
        set demoResults to demoResults & "🚀 Pushing to trigger CI...\n"
        
        do shell script "git push origin " & (do shell script "git branch --show-current")
        set demoResults to demoResults & "✅ Pushed to trigger enhanced CI\n"
        
    on error pushError
        set demoResults to demoResults & "❌ Failed to push: " & pushError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Show where to watch the CI
    set demoResults to demoResults & "\nStep 3: Watch the type-check job fail!\n"
    set demoResults to demoResults & "👀 Go to: https://github.com/mkidder97/roof-sow-genesis/actions\n"
    set demoResults to demoResults & "📺 You'll see:\n"
    set demoResults to demoResults & "   🔍 Type Check job turns RED ❌\n"
    set demoResults to demoResults & "   🛑 Frontend/Backend builds are BLOCKED\n"
    set demoResults to demoResults & "   📋 Clear error message about TypeScript compilation\n\n"
    
    set demoResults to demoResults & "Step 4: Click 'Fix & Show Green' to revert and show success\n"
    
    display dialog demoResults with title "🔴 Type-Check Failure Demo" buttons {"Fix & Show Green", "Open GitHub Actions", "Done"} default button "Fix & Show Green"
    set nextAction to button returned of result
    
    if nextAction is "Fix & Show Green" then
        my fixTypeScriptErrorAndShowGreen()
    else if nextAction is "Open GitHub Actions" then
        do shell script "open https://github.com/mkidder97/roof-sow-genesis/actions"
    end if
    
end runTypeScriptErrorDemo

-- Demo scenario: Introduce unit test failure
on runUnitTestFailureDemo()
    set demoResults to ""
    set demoResults to demoResults & "🧪 DEMONSTRATING UNIT TEST FAILURE\n"
    set demoResults to demoResults & "===================================\n\n"
    
    -- Create a failing test
    set demoResults to demoResults & "Step 1: Creating a failing unit test...\n"
    try
        -- Create a test file that will fail
        set testContent to "// Demo failing test\nimport { describe, it, expect } from 'vitest';\n\ndescribe('Demo Failing Test', () => {\n  it('should fail to demonstrate unit-test job', () => {\n    // This will always fail\n    expect(1 + 1).toBe(3);\n  });\n});"
        
        do shell script "echo '" & testContent & "' > src/demo-failing.test.ts"
        set demoResults to demoResults & "✅ Created failing test in src/demo-failing.test.ts\n"
    on error errorMsg
        set demoResults to demoResults & "❌ Failed to create failing test: " & errorMsg & "\n"
        display dialog demoResults
        return
    end try
    
    -- Commit and push the failing test
    set demoResults to demoResults & "\nStep 2: Committing and pushing the failing test...\n"
    try
        do shell script "git add src/demo-failing.test.ts"
        do shell script "git commit -m 'demo: add failing test to demonstrate unit-test job failure'"
        
        set demoResults to demoResults & "✅ Committed failing test\n"
        set demoResults to demoResults & "🚀 Pushing to trigger CI...\n"
        
        do shell script "git push origin " & (do shell script "git branch --show-current")
        set demoResults to demoResults & "✅ Pushed to trigger enhanced CI\n"
        
    on error pushError
        set demoResults to demoResults & "❌ Failed to push: " & pushError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Show where to watch the CI
    set demoResults to demoResults & "\nStep 3: Watch the unit-test job fail!\n"
    set demoResults to demoResults & "👀 Go to: https://github.com/mkidder97/roof-sow-genesis/actions\n"
    set demoResults to demoResults & "📺 You'll see:\n"
    set demoResults to demoResults & "   🧪 Unit Test job turns RED ❌\n"
    set demoResults to demoResults & "   🛑 Smoke tests are BLOCKED\n"
    set demoResults to demoResults & "   📋 Clear error message about test failure\n\n"
    
    set demoResults to demoResults & "Step 4: Click 'Fix & Show Green' to remove test and show success\n"
    
    display dialog demoResults with title "🧪 Unit Test Failure Demo" buttons {"Fix & Show Green", "Open GitHub Actions", "Done"} default button "Fix & Show Green"
    set nextAction to button returned of result
    
    if nextAction is "Fix & Show Green" then
        my fixUnitTestAndShowGreen()
    else if nextAction is "Open GitHub Actions" then
        do shell script "open https://github.com/mkidder97/roof-sow-genesis/actions"
    end if
    
end runUnitTestFailureDemo

-- Demo scenario: Show all quality gates passing
on runAllQualityGatesPassDemo()
    set demoResults to ""
    set demoResults to demoResults & "🟢 DEMONSTRATING ALL QUALITY GATES PASS\n"
    set demoResults to demoResults & "======================================\n\n"
    
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
    set demoResults to demoResults & "\nStep 2: Making a safe change to trigger enhanced CI...\n"
    try
        set currentTime to do shell script "date"
        do shell script "echo '\n<!-- Enhanced CI demo run at " & currentTime & " -->' >> README.md"
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
        do shell script "git commit -m 'demo: trigger enhanced CI with all quality gates passing'"
        do shell script "git push origin " & (do shell script "git branch --show-current")
        set demoResults to demoResults & "✅ Pushed to trigger enhanced CI\n"
    on error pushError
        set demoResults to demoResults & "❌ Failed to push: " & pushError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Show where to watch success
    set demoResults to demoResults & "\nStep 4: Watch all enhanced quality gates succeed! 🎉\n"
    set demoResults to demoResults & "👀 Go to: https://github.com/mkidder97/roof-sow-genesis/actions\n"
    set demoResults to demoResults & "📺 You'll see all quality gates turn GREEN ✅:\n"
    set demoResults to demoResults & "   🔍 Type Check (TypeScript validation)\n"
    set demoResults to demoResults & "   🧪 Unit Test (Test suite validation)\n"
    set demoResults to demoResults & "   🎨 Frontend (Build & lint)\n"
    set demoResults to demoResults & "   🖥️ Backend (Build)\n"
    set demoResults to demoResults & "   🔥 Smoke Test (End-to-end validation)\n\n"
    
    set demoResults to demoResults & "🎯 Enhanced Quality Gates:\n"
    set demoResults to demoResults & "• **Parallel Execution**: Type-check + Unit-test run simultaneously\n"
    set demoResults to demoResults & "• **Faster Feedback**: Issues caught in ~2-3 minutes\n"
    set demoResults to demoResults & "• **Better Isolation**: Clear separation of concerns\n"
    set demoResults to demoResults & "• **Stronger Enforcement**: 5 independent quality gates\n\n"
    
    set demoResults to demoResults & "Want to see specific failures? Choose from menu.\n"
    
    display dialog demoResults with title "🟢 All Quality Gates Pass Demo" buttons {"Show TypeScript Error", "Show Test Failure", "Open GitHub Actions"} default button "Open GitHub Actions"
    set nextAction to button returned of result
    
    if nextAction is "Show TypeScript Error" then
        my runTypeScriptErrorDemo()
    else if nextAction is "Show Test Failure" then
        my runUnitTestFailureDemo()
    else if nextAction is "Open GitHub Actions" then
        do shell script "open https://github.com/mkidder97/roof-sow-genesis/actions"
    end if
    
end runAllQualityGatesPassDemo

-- Fix TypeScript error and show green CI
on fixTypeScriptErrorAndShowGreen()
    set demoResults to ""
    set demoResults to demoResults & "🟢 FIXING TYPESCRIPT ERROR\n"
    set demoResults to demoResults & "===========================\n\n"
    
    -- Revert the TypeScript error
    set demoResults to demoResults & "Step 1: Reverting the TypeScript error...\n"
    try
        do shell script "git revert HEAD --no-edit"
        set demoResults to demoResults & "✅ Reverted the TypeScript error\n"
    on error revertError
        set demoResults to demoResults & "⚠️ Revert failed, trying manual fix: " & revertError & "\n"
        
        -- Try manual fix as backup
        try
            do shell script "git checkout HEAD~1 -- src/main.tsx"
            do shell script "git add src/main.tsx"
            do shell script "git commit -m 'demo: fix TypeScript error to show quality gates passing'"
            set demoResults to demoResults & "✅ Manually fixed the TypeScript error\n"
        on error manualError
            set demoResults to demoResults & "❌ Manual fix failed: " & manualError & "\n"
            display dialog demoResults
            return
        end try
    end try
    
    -- Push the fix
    set demoResults to demoResults & "\nStep 2: Pushing the fix...\n"
    try
        do shell script "git push origin " & (do shell script "git branch --show-current")
        set demoResults to demoResults & "✅ Pushed fix\n"
    on error pushError
        set demoResults to demoResults & "❌ Failed to push fix: " & pushError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Show success
    set demoResults to demoResults & "\nStep 3: Watch enhanced CI succeed! 🎉\n"
    set demoResults to demoResults & "👀 Go to: https://github.com/mkidder97/roof-sow-genesis/actions\n"
    set demoResults to demoResults & "📺 You'll see the type-check job turn GREEN ✅\n"
    set demoResults to demoResults & "🎯 All quality gates now pass!\n"
    
    display dialog demoResults with title "🟢 TypeScript Fix Demo" buttons {"Open GitHub Actions", "Done"} default button "Open GitHub Actions"
    
    if button returned of result is "Open GitHub Actions" then
        do shell script "open https://github.com/mkidder97/roof-sow-genesis/actions"
    end if
    
end fixTypeScriptErrorAndShowGreen

-- Fix unit test failure and show green CI  
on fixUnitTestAndShowGreen()
    set demoResults to ""
    set demoResults to demoResults & "🟢 FIXING UNIT TEST FAILURE\n"
    set demoResults to demoResults & "============================\n\n"
    
    -- Remove the failing test
    set demoResults to demoResults & "Step 1: Removing the failing test...\n"
    try
        do shell script "rm -f src/demo-failing.test.ts"
        do shell script "git add src/demo-failing.test.ts"
        do shell script "git commit -m 'demo: remove failing test to show unit-test job passing'"
        set demoResults to demoResults & "✅ Removed failing test\n"
    on error removeError
        set demoResults to demoResults & "❌ Failed to remove test: " & removeError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Push the fix
    set demoResults to demoResults & "\nStep 2: Pushing the fix...\n"
    try
        do shell script "git push origin " & (do shell script "git branch --show-current")
        set demoResults to demoResults & "✅ Pushed fix\n"
    on error pushError
        set demoResults to demoResults & "❌ Failed to push fix: " & pushError & "\n"
        display dialog demoResults
        return
    end try
    
    -- Show success
    set demoResults to demoResults & "\nStep 3: Watch enhanced CI succeed! 🎉\n"
    set demoResults to demoResults & "👀 Go to: https://github.com/mkidder97/roof-sow-genesis/actions\n"
    set demoResults to demoResults & "📺 You'll see the unit-test job turn GREEN ✅\n"
    set demoResults to demoResults & "🎯 All quality gates now pass!\n"
    
    display dialog demoResults with title "🟢 Unit Test Fix Demo" buttons {"Open GitHub Actions", "Done"} default button "Open GitHub Actions"
    
    if button returned of result is "Open GitHub Actions" then
        do shell script "open https://github.com/mkidder97/roof-sow-genesis/actions"
    end if
    
end fixUnitTestAndShowGreen