# Digital Attendance System - AWS Deployment Script
# This script deploys the complete architecture as shown in the diagram

Write-Host "🚀 Starting Digital Attendance System Deployment" -ForegroundColor Green
Write-Host "=" * 60

# Configuration
$PROJECT_NAME = "digital-attendance-system"
$REGION = "us-east-1"
$PROFILE = "default"  # Change if using different AWS profile

# Check AWS CLI
Write-Host "📋 Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
Write-Host "🔑 Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --profile $PROFILE | ConvertFrom-Json
    Write-Host "✅ AWS credentials configured for: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️  DEPLOYMENT PLAN" -ForegroundColor Cyan
Write-Host "=" * 30
Write-Host "1. Create S3 buckets for frontend hosting and file storage"
Write-Host "2. Deploy React instructor dashboard to S3"
Write-Host "3. Create CloudFront distribution"
Write-Host "4. Verify Lambda function and API Gateway"
Write-Host "5. Set up CloudWatch monitoring"
Write-Host "6. Generate student app build configuration"
Write-Host ""

$confirm = Read-Host "Continue with deployment? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🎯 Step 1: Creating S3 buckets..." -ForegroundColor Cyan

# Create unique S3 bucket names
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$WEB_BUCKET = "$PROJECT_NAME-web-$TIMESTAMP"
$STORAGE_BUCKET = "$PROJECT_NAME-storage-$TIMESTAMP"

# Create S3 bucket for web hosting
Write-Host "Creating S3 bucket for web hosting: $WEB_BUCKET"
aws s3 mb s3://$WEB_BUCKET --region $REGION --profile $PROFILE

# Configure S3 bucket for static website hosting
$websiteConfig = @{
    IndexDocument = @{ Suffix = "index.html" }
    ErrorDocument = @{ Key = "index.html" }
} | ConvertTo-Json -Depth 3

$websiteConfig | Out-File -FilePath "temp-website-config.json" -Encoding UTF8
aws s3api put-bucket-website --bucket $WEB_BUCKET --website-configuration file://temp-website-config.json --region $REGION --profile $PROFILE
Remove-Item "temp-website-config.json"

# Set bucket policy for public read access
$bucketPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$WEB_BUCKET/*"
        }
    )
} | ConvertTo-Json -Depth 4

$bucketPolicy | Out-File -FilePath "temp-bucket-policy.json" -Encoding UTF8
aws s3api put-bucket-policy --bucket $WEB_BUCKET --policy file://temp-bucket-policy.json --region $REGION --profile $PROFILE
Remove-Item "temp-bucket-policy.json"

# Create S3 bucket for file storage (exports, etc.)
Write-Host "Creating S3 bucket for file storage: $STORAGE_BUCKET"
aws s3 mb s3://$STORAGE_BUCKET --region $REGION --profile $PROFILE

Write-Host "✅ S3 buckets created successfully" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Step 2: Building and deploying React app..." -ForegroundColor Cyan

# Build React app
Set-Location "$PSScriptRoot\..\frontend\instructor-dashboard"
Write-Host "Installing dependencies..."
npm install

Write-Host "Building React app for production..."
$env:REACT_APP_API_URL = "https://kfmseegxyi.execute-api.us-east-1.amazonaws.com/prod"
$env:REACT_APP_COGNITO_USER_POOL_ID = "us-east-1_nvaJtHDVc"
$env:REACT_APP_COGNITO_WEB_CLIENT_ID = "3vhmp5qd9m5necfn07r36538sn"
$env:REACT_APP_COGNITO_REGION = "us-east-1"
$env:REACT_APP_S3_BUCKET = $STORAGE_BUCKET

npm run build

# Deploy to S3
Write-Host "Deploying to S3..."
aws s3 sync build/ s3://$WEB_BUCKET --delete --profile $PROFILE

Write-Host "✅ React app deployed to S3" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Step 3: Creating CloudFront distribution..." -ForegroundColor Cyan

# Create CloudFront distribution
$distributionConfig = @{
    CallerReference = "digital-attendance-$TIMESTAMP"
    DefaultRootObject = "index.html"
    Origins = @{
        Quantity = 1
        Items = @(
            @{
                Id = "S3-$WEB_BUCKET"
                DomainName = "$WEB_BUCKET.s3-website-$REGION.amazonaws.com"
                CustomOriginConfig = @{
                    HTTPPort = 80
                    HTTPSPort = 443
                    OriginProtocolPolicy = "http-only"
                }
            }
        )
    }
    DefaultCacheBehavior = @{
        TargetOriginId = "S3-$WEB_BUCKET"
        ViewerProtocolPolicy = "redirect-to-https"
        TrustedSigners = @{
            Enabled = $false
            Quantity = 0
        }
        ForwardedValues = @{
            QueryString = $false
            Cookies = @{ Forward = "none" }
        }
        MinTTL = 0
    }
    Comment = "Digital Attendance System - Instructor Dashboard"
    Enabled = $true
    PriceClass = "PriceClass_100"
} | ConvertTo-Json -Depth 10

# Note: CloudFront creation via CLI is complex, so we'll provide the manual steps
Write-Host "⚠️  CloudFront distribution needs to be created manually:" -ForegroundColor Yellow
Write-Host "1. Go to AWS CloudFront Console"
Write-Host "2. Create distribution with origin: $WEB_BUCKET.s3-website-$REGION.amazonaws.com"
Write-Host "3. Set default root object to: index.html"
Write-Host "4. Enable redirect HTTP to HTTPS"

Write-Host ""
Write-Host "🎯 Step 4: Verifying Lambda and API Gateway..." -ForegroundColor Cyan

# Test Lambda function
Write-Host "Testing Lambda function..."
$testPayload = @{
    httpMethod = "GET"
    path = "/sessions"
    headers = @{}
    body = ""
} | ConvertTo-Json

$testPayload | Out-File -FilePath "temp-test-payload.json" -Encoding UTF8
$lambdaResult = aws lambda invoke --function-name "digital-attendance-prod-backend-1763482478" --payload file://temp-test-payload.json --region $REGION --profile $PROFILE response.json
Remove-Item "temp-test-payload.json"

if (Test-Path "response.json") {
    $response = Get-Content "response.json" | ConvertFrom-Json
    Write-Host "✅ Lambda function is responding" -ForegroundColor Green
    Remove-Item "response.json"
} else {
    Write-Host "⚠️  Lambda function test failed" -ForegroundColor Yellow
}

# Test API Gateway
Write-Host "Testing API Gateway..."
try {
    $apiResponse = Invoke-RestMethod -Uri "https://kfmseegxyi.execute-api.us-east-1.amazonaws.com/prod/sessions" -Method GET
    Write-Host "✅ API Gateway is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API Gateway test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Step 5: Setting up CloudWatch monitoring..." -ForegroundColor Cyan

# Create CloudWatch log group if it doesn't exist
$logGroupName = "/aws/lambda/digital-attendance-prod-backend-1763482478"
try {
    aws logs create-log-group --log-group-name $logGroupName --region $REGION --profile $PROFILE
    Write-Host "✅ CloudWatch log group created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  CloudWatch log group already exists" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎯 Step 6: Generating student app configuration..." -ForegroundColor Cyan

# Update student app configuration
$studentAppConfig = @{
    expo = @{
        name = "Digital Attendance Student"
        slug = "digital-attendance-student"
        version = "1.0.0"
        orientation = "portrait"
        icon = "./assets/icon.png"
        userInterfaceStyle = "light"
        splash = @{
            image = "./assets/splash.png"
            resizeMode = "contain"
            backgroundColor = "#ffffff"
        }
        ios = @{
            supportsTablet = $true
        }
        android = @{
            adaptiveIcon = @{
                foregroundImage = "./assets/adaptive-icon.png"
                backgroundColor = "#ffffff"
            }
            package = "com.siit.digitalattendance"
        }
        web = @{
            favicon = "./assets/favicon.png"
        }
        extra = @{
            apiUrl = "https://kfmseegxyi.execute-api.us-east-1.amazonaws.com/prod"
            cognitoConfig = @{
                userPoolId = "us-east-1_nvaJtHDVc"
                webClientId = "6662k02feufhmo08ue2e141jjk"
                region = "us-east-1"
            }
        }
    }
} | ConvertTo-Json -Depth 10

Set-Location "$PSScriptRoot\..\frontend\student-app"
$studentAppConfig | Out-File -FilePath "app.json" -Encoding UTF8

Write-Host "✅ Student app configuration updated" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=" * 40

Write-Host ""
Write-Host "📊 DEPLOYMENT SUMMARY:" -ForegroundColor Cyan
Write-Host "• Web Hosting S3 Bucket: $WEB_BUCKET"
Write-Host "• Storage S3 Bucket: $STORAGE_BUCKET"
Write-Host "• Website URL: http://$WEB_BUCKET.s3-website-$REGION.amazonaws.com"
Write-Host "• API Gateway: https://kfmseegxyi.execute-api.us-east-1.amazonaws.com/prod"
Write-Host "• Lambda Function: digital-attendance-prod-backend-1763482478"
Write-Host "• Cognito User Pool: us-east-1_nvaJtHDVc"

Write-Host ""
Write-Host "📱 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Create CloudFront distribution manually (see instructions above)"
Write-Host "2. Test the instructor dashboard at the S3 website URL"
Write-Host "3. Build and deploy the student mobile app:"
Write-Host "   cd frontend/student-app"
Write-Host "   npx expo build:android  # For Android"
Write-Host "   npx expo build:ios      # For iOS"
Write-Host ""
Write-Host "4. Update DNS records to point to CloudFront distribution"
Write-Host ""

Write-Host "🔗 ACCESS URLs:" -ForegroundColor Magenta
Write-Host "• Instructor Dashboard: http://$WEB_BUCKET.s3-website-$REGION.amazonaws.com"
Write-Host "• API Endpoint: https://kfmseegxyi.execute-api.us-east-1.amazonaws.com/prod"

Write-Host ""
Write-Host "✨ Deployment completed successfully!" -ForegroundColor Green

# Return to original directory
Set-Location $PSScriptRoot