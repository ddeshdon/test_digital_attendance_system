# Step 1: Deploy React App to S3
Write-Host "🚀 Step 1: Setting up S3 for Frontend Hosting" -ForegroundColor Green
Write-Host "=" * 50

$REGION = "us-east-1"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$BUCKET_NAME = "digital-attendance-web-$TIMESTAMP"

Write-Host "📦 Creating S3 bucket: $BUCKET_NAME" -ForegroundColor Yellow

# Create S3 bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Configure for static website hosting
$websiteConfig = @"
{
    "IndexDocument": {
        "Suffix": "index.html"
    },
    "ErrorDocument": {
        "Key": "index.html"
    }
}
"@

$websiteConfig | Out-File -FilePath "website-config.json" -Encoding UTF8
aws s3api put-bucket-website --bucket $BUCKET_NAME --website-configuration file://website-config.json --region $REGION
Remove-Item "website-config.json"

# Set public read policy
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
"@

$bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding UTF8
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json --region $REGION
Remove-Item "bucket-policy.json"

Write-Host "✅ S3 bucket created and configured" -ForegroundColor Green
Write-Host "🌐 Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com" -ForegroundColor Cyan

# Build React app
Write-Host ""
Write-Host "🔨 Building React application..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\frontend\instructor-dashboard"

# Install dependencies
npm install

# Build for production
$env:REACT_APP_API_URL = "https://kfmseegxyi.execute-api.us-east-1.amazonaws.com/prod"
$env:REACT_APP_COGNITO_USER_POOL_ID = "us-east-1_nvaJtHDVc"
$env:REACT_APP_COGNITO_WEB_CLIENT_ID = "3vhmp5qd9m5necfn07r36538sn"
$env:REACT_APP_COGNITO_REGION = "us-east-1"
$env:NODE_ENV = "production"

npm run build

# Deploy to S3
Write-Host "📤 Deploying to S3..." -ForegroundColor Yellow
aws s3 sync build/ s3://$BUCKET_NAME --delete

Write-Host ""
Write-Host "🎉 Step 1 Complete!" -ForegroundColor Green
Write-Host "🔗 Access your app at: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com" -ForegroundColor Magenta

# Save bucket name for next steps
$BUCKET_NAME | Out-File -FilePath "$PSScriptRoot\bucket-name.txt" -Encoding UTF8

Set-Location $PSScriptRoot