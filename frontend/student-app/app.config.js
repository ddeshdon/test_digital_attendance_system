export default {
  expo: {
    name: "SIIT Digital Attendance",
    slug: "siit-digital-attendance",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#8B5CF6"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.siit.digitalattendance",
      buildNumber: "1.0.0"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#8B5CF6"
      },
      package: "com.siit.digitalattendance",
      versionCode: 1
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    extra: {
      // Production API Configuration (Update after deployment)
      apiBaseUrl: "https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod",
      awsRegion: "us-east-1",
      environment: "production",
      
      // Beacon Configuration
      beaconUUID: "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
      beaconMajor: 1,
      beaconMinor: 1,
      
      // Feature Flags
      enableRealTimeUpdates: true,
      enableAnalytics: true,
      enableOfflineMode: true,
      
      // App Configuration
      appVersion: "1.0.0",
      appName: "SIIT Digital Attendance"
    },
    plugins: [
      "expo-location",
      "expo-notifications",
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them with your attendance records."
        }
      ]
    ]
  }
};