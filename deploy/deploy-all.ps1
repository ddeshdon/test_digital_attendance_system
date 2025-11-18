# Master Deployment Script - Run All Steps
Write-Host "Digital Attendance System - Complete Deployment" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "DEPLOYMENT ARCHITECTURE" -ForegroundColor Cyan
Write-Host "Instructor Dashboard:" -ForegroundColor White
Write-Host "  Route 53 → CloudFront → AWS Amplify → API Gateway → Lambda → DynamoDB/S3" -ForegroundColor Gray
Write-Host ""
Write-Host "Student Mobile App:" -ForegroundColor White
Write-Host "  Mobile App → API Gateway → Lambda → DynamoDB" -ForegroundColor Gray
Write-Host ""

$steps = @(
    @{
        name = "Step 1: AWS Amplify Setup"
        script = "step1-amplify-setup.ps1"
        description = "Deploy instructor dashboard via Amplify with CloudFront"
    },
    @{
        name = "Step 2: API Gateway Verification"
        script = "step2-verify-api.ps1"
        description = "Verify Lambda and API Gateway configuration"
    },
    @{
        name = "Step 3: S3 Storage Setup"
        script = "step3-setup-storage.ps1"
        description = "Configure S3 bucket for file exports"
    },
    @{
        name = "Step 4: Mobile App Configuration"
        script = "step4-mobile-app.ps1"
        description = "Configure React Native student app for production (not actual deployment)"
    }
)

Write-Host "DEPLOYMENT STEPS:" -ForegroundColor Yellow
for ($i = 0; $i -lt $steps.Count; $i++) {
    Write-Host "  $($i+1). $($steps[$i].name)" -ForegroundColor White
    Write-Host "     $($steps[$i].description)" -ForegroundColor Gray
}

Write-Host ""
$runAll = Read-Host "Run all steps automatically? (y/N)"

if ($runAll -eq "y" -or $runAll -eq "Y") {
    foreach ($step in $steps) {
        Write-Host ""
        Write-Host "Executing: $($step.name)" -ForegroundColor Magenta
        Write-Host "=" * 50
        
        try {
            & "$PSScriptRoot\$($step.script)"
            Write-Host "$($step.name) completed" -ForegroundColor Green
        } catch {
            Write-Host "$($step.name) failed: $($_.Exception.Message)" -ForegroundColor Red
            $continue = Read-Host "Continue with next step? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Host "Deployment stopped." -ForegroundColor Yellow
                exit 1
            }
        }
        
        Write-Host ""
        Read-Host "Press Enter to continue to next step..."
    }
} else {
    Write-Host ""
    Write-Host "Manual Deployment Mode" -ForegroundColor Cyan
    Write-Host "Run individual steps as needed:" -ForegroundColor White
    
    foreach ($step in $steps) {
        Write-Host "  .\$($step.script)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=" * 30

Write-Host ""
Write-Host "INFRASTRUCTURE SUMMARY:" -ForegroundColor Cyan
Write-Host "- AWS Amplify: Instructor dashboard hosting" -ForegroundColor White
Write-Host "- CloudFront: CDN (automatically configured by Amplify)" -ForegroundColor White
Write-Host "- API Gateway: https://kfmseegxyi.execute-api.us-east-1.amazonaws.com/prod" -ForegroundColor White
Write-Host "- Lambda Function: digital-attendance-prod-backend-1763482478" -ForegroundColor White
Write-Host "- DynamoDB: Users, Sessions, AttendanceRecords tables" -ForegroundColor White
Write-Host "- S3: digital-attendance-exports (for file exports)" -ForegroundColor White
Write-Host "- Cognito: User authentication (us-east-1_nvaJtHDVc)" -ForegroundColor White

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test instructor dashboard on Amplify URL" -ForegroundColor White
Write-Host "2. Configure mobile app for production builds (requires developer accounts)" -ForegroundColor White
Write-Host "3. Configure Route 53 for custom domain (optional)" -ForegroundColor White
Write-Host "4. Set up monitoring and alerts in CloudWatch" -ForegroundColor White

Write-Host ""
Write-Host "Your digital attendance system is ready for deployment!" -ForegroundColor Green