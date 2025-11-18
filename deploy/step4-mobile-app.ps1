# Step 4: Configure Student App for Mobile Deployment
Write-Host "Step 4: Preparing Student Mobile App (Configuration Only)" -ForegroundColor Green
Write-Host "=" * 55

$REGION = "us-east-1"

Write-Host "Configuring React Native Student App for production..." -ForegroundColor Yellow
Write-Host "Note: This step configures the app - actual deployment to app stores is separate" -ForegroundColor Cyan

# Navigate to student app directory
Set-Location "$PSScriptRoot\..\frontend\student-app"

# Check if Expo CLI is installed
try {
    $expoVersion = npx expo --version
    Write-Host "Expo CLI available: $expoVersion" -ForegroundColor Green
} catch {
    Write-Host "Expo CLI not found. Please install with: npm install -g @expo/cli" -ForegroundColor Yellow
}

# Update app.json with production configuration
Write-Host "Updating app.json configuration..." -ForegroundColor Yellow

$appConfig = @{
    expo = @{
        name = "SIIT Attendance"
        slug = "siit-digital-attendance"
        version = "1.0.0"
        orientation = "portrait"
        icon = "./assets/icon.png"
        userInterfaceStyle = "light"
        splash = @{
            image = "./assets/splash.png"
            resizeMode = "contain"
            backgroundColor = "#7c3aed"
        }
        assetBundlePatterns = @(
            "**/*"
        )
        ios = @{
            supportsTablet = $true
            bundleIdentifier = "com.siit.digitalattendance"
        }
        android = @{
            adaptiveIcon = @{
                foregroundImage = "./assets/adaptive-icon.png"
                backgroundColor = "#7c3aed"
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
                clientSecret = "a7n3tncn1eg2av08pgtqbv0ga8r290ftbuqsfiqm45d384dibi2"
                region = "us-east-1"
            }
        }
        plugins = @(
            "@react-native-async-storage/async-storage"
        )
    }
} | ConvertTo-Json -Depth 10

$appConfig | Out-File -FilePath "app.json" -Encoding UTF8

# Update config.js for production
Write-Host "Updating production config..." -ForegroundColor Yellow

$configContent = @"
// Production configuration for AWS deployment
const CONFIG = {
  API_URL: 'https://kfmseegxyi.execute-api.us-east-1.amazonaws.com/prod',
  
  COGNITO_CONFIG: {
    userPoolId: 'us-east-1_nvaJtHDVc',
    webClientId: '6662k02feufhmo08ue2e141jjk',
    clientSecret: 'a7n3tncn1eg2av08pgtqbv0ga8r290ftbuqsfiqm45d384dibi2',
    region: 'us-east-1',
  },
  
  // Beacon scanning configuration
  BEACON_CONFIG: {
    proximityUUID: '550e8400-e29b-41d4-a716-446655440000',
    identifier: 'SIITBeacons',
    scanDuration: 10000, // 10 seconds
    rssiThreshold: -70, // Minimum signal strength
  },
  
  // Debug mode - set to false for production
  DEBUG: false,
};

export default CONFIG;
"@

$configContent | Out-File -FilePath "src\services\config.js" -Encoding UTF8

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Pre-build checks
Write-Host "Running pre-build checks..." -ForegroundColor Yellow

# Check for required assets
$requiredAssets = @("icon.png", "splash.png", "adaptive-icon.png")
foreach ($asset in $requiredAssets) {
    if (Test-Path "assets\$asset") {
        Write-Host "Found: assets\$asset" -ForegroundColor Green
    } else {
        Write-Host "Missing: assets\$asset" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "BUILD INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "For Development Testing:" -ForegroundColor White
Write-Host "  npx expo start" -ForegroundColor Gray
Write-Host ""
Write-Host "For Production Builds (requires separate setup):" -ForegroundColor White
Write-Host "  # Android APK" -ForegroundColor Gray
Write-Host "  npx eas build --platform android --profile production" -ForegroundColor Gray
Write-Host ""
Write-Host "  # iOS (requires Apple Developer account)" -ForegroundColor Gray
Write-Host "  npx eas build --platform ios --profile production" -ForegroundColor Gray
Write-Host ""
Write-Host "For App Store Distribution (requires developer accounts):" -ForegroundColor White
Write-Host "  # Set up EAS Build service" -ForegroundColor Gray
Write-Host "  npx eas build:configure" -ForegroundColor Gray
Write-Host "  npx eas submit --platform android" -ForegroundColor Gray
Write-Host "  npx eas submit --platform ios" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "- Production builds require Expo EAS Build service setup" -ForegroundColor White
Write-Host "- App store deployment requires developer accounts" -ForegroundColor White
Write-Host "- This step only configures the app for production" -ForegroundColor White

Write-Host ""
Write-Host "Step 4 Complete!" -ForegroundColor Green
Write-Host "Student app is configured for production" -ForegroundColor Cyan
Write-Host "App can be tested locally with 'npx expo start'" -ForegroundColor Cyan

Set-Location $PSScriptRoot