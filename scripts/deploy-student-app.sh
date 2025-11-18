#!/bin/bash

# Deploy Student Mobile App using Expo EAS
# Run this script from the frontend/student-app directory

set -e  # Exit on any error

echo "📱 Starting deployment of Digital Attendance Student Mobile App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "app.json" ] && [ ! -f "app.config.js" ]; then
    echo -e "${RED}❌ Not in the student-app directory. Please navigate there first.${NC}"
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Expo CLI...${NC}"
    npm install -g @expo/cli
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}📦 Installing EAS CLI...${NC}"
    npm install -g @expo/cli
fi

echo -e "${GREEN}✅ Expo CLI is available${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Login to Expo (if not already logged in)
if ! expo whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Please login to your Expo account:${NC}"
    expo login
fi

echo -e "${GREEN}✅ Logged into Expo${NC}"

# Configure EAS Build
echo -e "${YELLOW}⚙️  Configuring EAS Build...${NC}"
if [ ! -f "eas.json" ]; then
    eas build:configure
    echo -e "${GREEN}✅ EAS Build configured${NC}"
else
    echo -e "${GREEN}✅ EAS Build already configured${NC}"
fi

# Show deployment options
echo ""
echo -e "${YELLOW}📱 Choose deployment option:${NC}"
echo "1. Build for development (Expo Go)"
echo "2. Build for internal distribution (APK/IPA)"
echo "3. Build for app stores (Google Play + App Store)"
echo "4. Build web version (PWA)"
echo "5. All of the above"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}🔨 Building development version...${NC}"
        expo publish
        echo -e "${GREEN}✅ Development build published to Expo Go${NC}"
        echo -e "${GREEN}📱 Test with Expo Go app using QR code${NC}"
        ;;
    2)
        echo -e "${YELLOW}🔨 Building internal distribution...${NC}"
        eas build --platform all --profile development
        echo -e "${GREEN}✅ Internal builds created${NC}"
        echo -e "${GREEN}📱 Download builds from Expo dashboard${NC}"
        ;;
    3)
        echo -e "${YELLOW}🔨 Building for app stores...${NC}"
        eas build --platform all --profile production
        echo ""
        echo -e "${YELLOW}📤 Do you want to submit to app stores? (y/n):${NC}"
        read -p "" submit
        if [ "$submit" = "y" ]; then
            echo -e "${YELLOW}📤 Submitting to App Store...${NC}"
            eas submit --platform ios
            echo -e "${YELLOW}📤 Submitting to Google Play...${NC}"
            eas submit --platform android
            echo -e "${GREEN}✅ Submitted to app stores${NC}"
        fi
        ;;
    4)
        echo -e "${YELLOW}🔨 Building web version...${NC}"
        expo export:web
        
        # Deploy web build to S3
        S3_BUCKET="digital-attendance-student-app"
        AWS_REGION="us-east-1"
        
        echo -e "${YELLOW}🪣 Deploying web version to S3...${NC}"
        
        # Create S3 bucket if it doesn't exist
        if ! aws s3 ls "s3://$S3_BUCKET" 2>&1 | grep -q 'NoSuchBucket'; then
            echo "Bucket already exists"
        else
            echo "Creating S3 bucket..."
            aws s3 mb "s3://$S3_BUCKET" --region $AWS_REGION
        fi
        
        # Enable static website hosting
        aws s3 website "s3://$S3_BUCKET" \
            --index-document index.html \
            --error-document index.html
        
        # Upload web build
        aws s3 sync web-build/ "s3://$S3_BUCKET" --delete
        
        # Set bucket policy
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
        
        WEB_URL="http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
        echo -e "${GREEN}✅ Web version deployed to: $WEB_URL${NC}"
        ;;
    5)
        echo -e "${YELLOW}🔨 Building all versions...${NC}"
        
        # Development
        echo -e "${YELLOW}📱 Publishing to Expo Go...${NC}"
        expo publish
        
        # Internal distribution
        echo -e "${YELLOW}📱 Building internal distribution...${NC}"
        eas build --platform all --profile development
        
        # Production
        echo -e "${YELLOW}📱 Building for app stores...${NC}"
        eas build --platform all --profile production
        
        # Web
        echo -e "${YELLOW}🌐 Building web version...${NC}"
        expo export:web
        
        echo -e "${GREEN}✅ All builds completed${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Mobile app deployment completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Test the app on physical devices"
echo "2. Configure push notifications (if needed)"
echo "3. Set up analytics tracking"
echo "4. Update API endpoints after backend deployment"
echo "5. Test beacon functionality in real classroom environment"

# Show deployment summary
echo ""
echo -e "${YELLOW}📊 Deployment Summary:${NC}"
echo "- App Name: SIIT Digital Attendance"
echo "- Version: 1.0.0"
echo "- Platform: React Native (Expo)"
echo "- Deployment Time: $(date)"
echo "- Expo Project: $(expo whoami) / siit-digital-attendance"

echo ""
echo -e "${YELLOW}🔗 Useful Links:${NC}"
echo "- Expo Dashboard: https://expo.dev/"
echo "- Build Status: https://expo.dev/accounts/$(expo whoami)/projects/siit-digital-attendance/builds"
echo "- App Store Connect: https://appstoreconnect.apple.com/"
echo "- Google Play Console: https://play.google.com/console/"