#!/bin/bash
# Real Beacon Scanning Setup Script

echo "🔧 Setting up Real Beacon Scanning for Student App..."

# Navigate to student app directory
cd frontend/student-app

echo "📦 Installing React Native Beacon Manager..."
npm install react-native-beacons-manager@^3.2.1

echo "📱 Installing additional dependencies..."
npm install @react-native-async-storage/async-storage@^1.19.0

# Check if we're on iOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Setting up iOS dependencies..."
    cd ios
    pod install
    cd ..
    
    echo "⚙️ iOS Info.plist permissions needed:"
    echo "Add these keys to ios/StudentApp/Info.plist:"
    echo "<key>NSLocationWhenInUseUsageDescription</key>"
    echo "<string>This app needs location access to detect classroom beacons for attendance</string>"
    echo "<key>NSBluetoothAlwaysUsageDescription</key>"
    echo "<string>This app needs Bluetooth to scan for classroom beacons</string>"
fi

echo "🤖 Android permissions already configured in AndroidManifest.xml"

echo "✅ Beacon scanning setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Replace Classroom.jsx with ClassroomEnhanced.jsx"
echo "2. Test beacon scanning on physical device (not simulator)"
echo "3. Use iPad beacon app to broadcast test beacon"
echo "4. Ensure Bluetooth and Location permissions are enabled"
echo ""
echo "🎯 Real beacon attendance is ready to use!"