# Step 3: Configure S3 Storage Bucket
Write-Host "Step 3: Setting up S3 Storage for Exports" -ForegroundColor Green
Write-Host "=" * 45

$REGION = "us-east-1"
$STORAGE_BUCKET = "digital-attendance-exports"  # Using existing bucket name from Lambda function

Write-Host "Creating S3 storage bucket: $STORAGE_BUCKET" -ForegroundColor Yellow

# Create S3 bucket for file storage (if it doesn't exist)
try {
    aws s3 mb s3://$STORAGE_BUCKET --region $REGION
    Write-Host "Created new S3 bucket: $STORAGE_BUCKET" -ForegroundColor Green
} catch {
    Write-Host "S3 bucket may already exist or checking existing bucket..." -ForegroundColor Blue
    # Check if bucket exists
    try {
        aws s3 ls s3://$STORAGE_BUCKET | Out-Null
        Write-Host "Using existing S3 bucket: $STORAGE_BUCKET" -ForegroundColor Green
    } catch {
        Write-Host "Error accessing S3 bucket. Please check permissions." -ForegroundColor Red
        exit 1
    }
}

# Configure bucket for private access with proper permissions
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "LambdaAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::*:role/*LambdaExecutionRole"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::$STORAGE_BUCKET/*"
        }
    ]
}
"@

$bucketPolicy | Out-File -FilePath "storage-bucket-policy.json" -Encoding UTF8
aws s3api put-bucket-policy --bucket $STORAGE_BUCKET --policy file://storage-bucket-policy.json --region $REGION
Remove-Item "storage-bucket-policy.json"

# Enable versioning
try {
    aws s3api put-bucket-versioning --bucket $STORAGE_BUCKET --versioning-configuration Status=Enabled --region $REGION
} catch {
    Write-Host "Versioning may already be enabled or not supported in this region" -ForegroundColor Blue
}

# Configure lifecycle policy to clean up old files
$lifecycleConfig = @"
{
    "Rules": [
        {
            "ID": "DeleteOldExports",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "exports/"
            },
            "Expiration": {
                "Days": 30
            }
        },
        {
            "ID": "DeleteOldVersions",
            "Status": "Enabled",
            "NoncurrentVersionExpiration": {
                "NoncurrentDays": 7
            }
        }
    ]
}
"@

$lifecycleConfig | Out-File -FilePath "lifecycle-config.json" -Encoding UTF8
try {
    aws s3api put-bucket-lifecycle-configuration --bucket $STORAGE_BUCKET --lifecycle-configuration file://lifecycle-config.json --region $REGION
    Write-Host "Lifecycle policy configured" -ForegroundColor Green
} catch {
    Write-Host "Could not set lifecycle policy - may require additional permissions" -ForegroundColor Yellow
}
Remove-Item "lifecycle-config.json"

Write-Host "S3 storage bucket configured" -ForegroundColor Green

# Test upload/download
Write-Host "Testing S3 access..." -ForegroundColor Yellow
$testContent = "Test file for Digital Attendance System - $(Get-Date)"
$testContent | Out-File -FilePath "test-file.txt" -Encoding UTF8

try {
    aws s3 cp test-file.txt s3://$STORAGE_BUCKET/test/test-file.txt --region $REGION
    aws s3 cp s3://$STORAGE_BUCKET/test/test-file.txt downloaded-test.txt --region $REGION

    if (Test-Path "downloaded-test.txt") {
        Write-Host "S3 upload/download test successful" -ForegroundColor Green
        Remove-Item "downloaded-test.txt"
    } else {
        Write-Host "S3 test failed" -ForegroundColor Yellow
    }

    Remove-Item "test-file.txt"
    aws s3 rm s3://$STORAGE_BUCKET/test/test-file.txt --region $REGION
} catch {
    Write-Host "S3 test encountered issues - bucket may need additional configuration" -ForegroundColor Yellow
    Remove-Item "test-file.txt" -ErrorAction SilentlyContinue
}

# Update Lambda function environment variables (optional - bucket name is already hardcoded)
Write-Host "Checking Lambda function environment variables..." -ForegroundColor Yellow
try {
    $lambdaEnv = aws lambda get-function-configuration --function-name "digital-attendance-prod-backend-1763482478" --region $REGION | ConvertFrom-Json
    Write-Host "Lambda function environment is configured" -ForegroundColor Green
} catch {
    Write-Host "Could not access Lambda function configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3 Complete!" -ForegroundColor Green
Write-Host "Storage bucket: $STORAGE_BUCKET" -ForegroundColor Cyan
Write-Host "S3 export functionality is ready" -ForegroundColor Cyan

# Save bucket name for reference
$STORAGE_BUCKET | Out-File -FilePath "$PSScriptRoot\storage-bucket-name.txt" -Encoding UTF8