#!/bin/bash

# Deploy Instructor Dashboard to AWS S3 + CloudFront
# Run this script from the frontend/instructor-dashboard directory

set -e  # Exit on any error

echo "🚀 Starting deployment of Digital Attendance Instructor Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
S3_BUCKET="digital-attendance-instructor-dashboard"
CLOUDFRONT_DISTRIBUTION_ID=""  # Update after CloudFront creation
AWS_REGION="us-east-1"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in the instructor-dashboard directory. Please navigate there first.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Create production build
echo -e "${YELLOW}🔨 Building production version...${NC}"
npm run build

if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build failed - no build directory created${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Create S3 bucket if it doesn't exist
echo -e "${YELLOW}🪣 Setting up S3 bucket...${NC}"
if ! aws s3 ls "s3://$S3_BUCKET" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Bucket already exists"
else
    echo "Creating S3 bucket..."
    aws s3 mb "s3://$S3_BUCKET" --region $AWS_REGION
fi

# Enable static website hosting
echo -e "${YELLOW}🌐 Configuring static website hosting...${NC}"
aws s3 website "s3://$S3_BUCKET" \
    --index-document index.html \
    --error-document index.html

# Upload files to S3
echo -e "${YELLOW}📤 Uploading files to S3...${NC}"
aws s3 sync build/ "s3://$S3_BUCKET" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "service-worker.js"

# Upload HTML files with shorter cache
aws s3 sync build/ "s3://$S3_BUCKET" \
    --delete \
    --cache-control "public, max-age=0, must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --include "service-worker.js"

echo -e "${GREEN}✅ Files uploaded to S3${NC}"

# Set bucket policy
echo -e "${YELLOW}🔐 Setting bucket policy...${NC}"
BUCKET_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$S3_BUCKET'/*"
    }
  ]
}'

echo "$BUCKET_POLICY" | aws s3api put-bucket-policy \
    --bucket "$S3_BUCKET" \
    --policy file:///dev/stdin

echo -e "${GREEN}✅ Bucket policy applied${NC}"

# Get S3 website URL
S3_WEBSITE_URL="http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
echo -e "${GREEN}📍 S3 Website URL: $S3_WEBSITE_URL${NC}"

# Invalidate CloudFront cache if distribution ID is provided
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*"
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}⚠️  No CloudFront distribution ID provided. Skipping cache invalidation.${NC}"
    echo -e "${YELLOW}💡 To set up CloudFront:${NC}"
    echo "1. Create a CloudFront distribution pointing to your S3 bucket"
    echo "2. Update CLOUDFRONT_DISTRIBUTION_ID in this script"
    echo "3. Run the script again to enable CDN caching"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is now available at:${NC}"
echo -e "${GREEN}   S3 Direct: $S3_WEBSITE_URL${NC}"

if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${GREEN}   CloudFront: https://your-cloudfront-domain.cloudfront.net${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Set up CloudFront distribution (if not done already)"
echo "2. Configure custom domain name (optional)"
echo "3. Set up SSL certificate (optional)"
echo "4. Update API endpoints in your environment variables"
echo "5. Test the deployed application"

# Show deployment summary
echo ""
echo -e "${YELLOW}📊 Deployment Summary:${NC}"
echo "- Build Size: $(du -sh build | cut -f1)"
echo "- Files Uploaded: $(find build -type f | wc -l)"
echo "- S3 Bucket: $S3_BUCKET"
echo "- AWS Region: $AWS_REGION"
echo "- Deployment Time: $(date)"