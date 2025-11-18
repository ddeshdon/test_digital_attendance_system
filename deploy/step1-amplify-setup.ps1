# Step 1: Deploy Instructor Dashboard via AWS Amplify (Classic)
Write-Host "Step 1: Setting up AWS Amplify for Instructor Dashboard" -ForegroundColor Green
Write-Host "=" * 60

$REGION = "us-east-1"
$APP_NAME = "digital-attendance-instructor"

Write-Host "Prerequisites Check..." -ForegroundColor Yellow

# Check if Amplify CLI is installed
try {
    $amplifyVersion = amplify --version
    Write-Host "Amplify CLI found: $amplifyVersion" -ForegroundColor Green
} catch {
    Write-Host "Amplify CLI not found. Installing..." -ForegroundColor Red
    npm install -g @aws-amplify/cli
}

# Check AWS credentials
try {
    aws sts get-caller-identity | Out-Null
    $identity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "AWS credentials configured for: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up Amplify Application..." -ForegroundColor Cyan

# Navigate to instructor dashboard
Set-Location "$PSScriptRoot\..\frontend\instructor-dashboard"

# Clean up any Gen 2 files if they exist
if (Test-Path "amplify\backend.ts") {
    Write-Host "Cleaning up Amplify Gen 2 files..." -ForegroundColor Yellow
    Remove-Item "amplify" -Recurse -Force -ErrorAction SilentlyContinue
}

# Initialize Amplify (if not already done)
if (-not (Test-Path "amplify")) {
    Write-Host "Initializing Amplify project..." -ForegroundColor Yellow
    Write-Host "When prompted, use these settings:" -ForegroundColor Cyan
    Write-Host "- Project name: $APP_NAME" -ForegroundColor White
    Write-Host "- Environment name: prod" -ForegroundColor White
    Write-Host "- Default editor: Visual Studio Code" -ForegroundColor White
    Write-Host "- App type: javascript" -ForegroundColor White
    Write-Host "- Framework: react" -ForegroundColor White
    Write-Host "- Source directory: src" -ForegroundColor White
    Write-Host "- Distribution directory: build" -ForegroundColor White
    Write-Host "- Build command: npm run build" -ForegroundColor White
    Write-Host "- Start command: npm start" -ForegroundColor White
    
    # Run amplify init
    amplify init
} else {
    Write-Host "Amplify project already initialized" -ForegroundColor Green
}

# Add hosting
Write-Host ""
Write-Host "Setting up Amplify hosting..." -ForegroundColor Yellow
try {
    # Check if hosting is already added
    $amplifyStatus = amplify status
    if ($amplifyStatus -notlike "*Hosting*") {
        Write-Host "Adding hosting..." -ForegroundColor Yellow
        amplify add hosting
        Write-Host "When prompted:" -ForegroundColor Cyan
        Write-Host "- Select hosting service: Amazon CloudFront and S3" -ForegroundColor White
        Write-Host "- Select environment: prod" -ForegroundColor White
    } else {
        Write-Host "Hosting already configured" -ForegroundColor Green
    }
} catch {
    Write-Host "Note: You may need to add hosting manually with 'amplify add hosting'" -ForegroundColor Yellow
}

# Configure environment variables
Write-Host ""
Write-Host "Setting up environment variables..." -ForegroundColor Yellow

$envContent = @"
REACT_APP_API_URL=https://kfmseegxyi.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_nvaJtHDVc
REACT_APP_COGNITO_WEB_CLIENT_ID=3vhmp5qd9m5necfn07r36538sn
REACT_APP_COGNITO_REGION=us-east-1
REACT_APP_S3_BUCKET=digital-attendance-exports
GENERATE_SOURCEMAP=false
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Host "Environment variables configured" -ForegroundColor Green

# Install AWS Amplify dependencies
Write-Host ""
Write-Host "Installing Amplify dependencies..." -ForegroundColor Yellow
npm install aws-amplify

Write-Host ""
Write-Host "DEPLOYMENT OPTIONS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1 - Build and Deploy:" -ForegroundColor White
Write-Host "  amplify publish" -ForegroundColor Gray
Write-Host "  (Builds and deploys to CloudFront + S3)" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2 - Just Deploy (if already built):" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor Gray
Write-Host "  amplify publish --yes" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3 - Add Custom Domain:" -ForegroundColor White
Write-Host "  1. amplify add hosting" -ForegroundColor Gray
Write-Host "  2. Select 'Amazon CloudFront and S3'" -ForegroundColor Gray
Write-Host "  3. amplify publish" -ForegroundColor Gray

Write-Host ""
Write-Host "Step 1 Complete!" -ForegroundColor Green
Write-Host "Amplify Classic configuration ready" -ForegroundColor Cyan
Write-Host "Run 'amplify publish' to deploy your app" -ForegroundColor Cyan

Set-Location $PSScriptRoot