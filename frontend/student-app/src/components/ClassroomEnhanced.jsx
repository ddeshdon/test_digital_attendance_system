import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  DeviceEventEmitter,
  PermissionsAndroid,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { attendanceAPI } from "../services/api-action-based";

// Import beacon manager (install: npm install react-native-beacons-manager)
let Beacons;
try {
  Beacons = require('react-native-beacons-manager');
} catch (error) {
  console.log('Beacon manager not available, using simulation mode');
}

// Web-safe alert function
const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function Classroom() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [checkInHistory, setCheckInHistory] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("6522781713");
  const [beaconUUID, setBeaconUUID] = useState("");
  const [detectedBeacons, setDetectedBeacons] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [permissions, setPermissions] = useState(false);
  const [beaconSupported, setBeaconSupported] = useState(false);

  // Course details from navigation params
  const courseCode = params.code || "N/A";
  const courseName = params.name || "Course Name";
  const courseDay = params.day || "N/A";
  const courseTime = params.time || "N/A";
  const courseRoom = params.room || "N/A";

  useEffect(() => {
    // Check if beacon scanning is supported
    setBeaconSupported(!!Beacons && Platform.OS !== 'web');
    
    if (beaconSupported) {
      requestPermissions();
    }
    
    // Cleanup beacons when component unmounts
    return () => {
      if (Beacons && beaconSupported) {
        try {
          Beacons.stopRangingBeaconsInRegion('CLASSROOM_BEACONS');
          Beacons.stopMonitoringForRegion('CLASSROOM_BEACONS');
        } catch (error) {
          console.log('Beacon cleanup error:', error);
        }
      }
    };
  }, [beaconSupported]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        // Add Bluetooth permissions for Android 12+
        if (Platform.Version >= 31) {
          permissions.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          );
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
        setPermissions(allGranted);
        
        if (!allGranted) {
          showAlert(
            'Permissions Required',
            'Please enable Location and Bluetooth permissions for beacon scanning to work.'
          );
        }
      } catch (err) {
        console.error('Permission request failed:', err);
      }
    } else {
      // iOS permissions handled through Info.plist and runtime requests
      setPermissions(true);
    }
  };

  const startBeaconScanning = async () => {
    if (!beaconSupported) {
      // Fallback to simulation for web/unsupported platforms
      handleScanBeaconSimulation();
      return;
    }

    if (!permissions) {
      showAlert(
        'Permissions Required', 
        'Please enable location and Bluetooth permissions to scan for classroom beacons.'
      );
      await requestPermissions();
      return;
    }

    setScanning(true);
    setDetectedBeacons([]);

    try {
      showAlert('Scanning...', 'Looking for classroom beacons nearby...');

      // Request location permission for iOS
      if (Platform.OS === 'ios') {
        await Beacons.requestWhenInUseAuthorization();
      }
      
      // Define the region to scan for beacons (scan all UUIDs)
      const region = {
        identifier: 'CLASSROOM_BEACONS',
        uuid: null, // Scan for all beacon UUIDs
      };

      // Start ranging (detecting nearby beacons)
      await Beacons.startRangingBeaconsInRegion(region);

      // Listen for beacon detection events
      const subscription = DeviceEventEmitter.addListener(
        'beaconsDidRange',
        (data) => {
          console.log('Beacons detected:', data.beacons);
          
          if (data.beacons && data.beacons.length > 0) {
            // Filter beacons within reasonable distance (10 meters)
            const nearbyBeacons = data.beacons
              .filter(beacon => beacon.distance <= 10 && beacon.distance > 0)
              .sort((a, b) => a.distance - b.distance); // Closest first
              
            setDetectedBeacons(nearbyBeacons);
            
            // Auto-select the closest beacon if found
            if (nearbyBeacons.length > 0) {
              const closestBeacon = nearbyBeacons[0];
              setBeaconUUID(closestBeacon.uuid.toUpperCase());
              
              showAlert(
                '📡 Beacon Found!',
                `Found classroom beacon!\\n\\n` +
                `UUID: ${closestBeacon.uuid.substring(0, 8)}...\\n` +
                `Distance: ${closestBeacon.distance.toFixed(1)} meters\\n` +
                `Signal: ${closestBeacon.rssi} dBm\\n\\n` +
                `You can now check in for attendance!`
              );
            }
          }
        }
      );

      // Stop scanning after 15 seconds
      setTimeout(() => {
        setScanning(false);
        
        try {
          Beacons.stopRangingBeaconsInRegion('CLASSROOM_BEACONS');
          subscription.remove();
        } catch (error) {
          console.log('Error stopping beacon scan:', error);
        }
        
        if (detectedBeacons.length === 0) {
          showAlert(
            'No Beacons Found',
            'Could not find any classroom beacons nearby.\\n\\n' +
            'Make sure:\\n' +
            '• You are within 10 meters of the classroom beacon\\n' +
            '• Bluetooth is enabled on your device\\n' +
            '• The instructor has started the beacon\\n\\n' +
            'You can also enter the UUID manually.'
          );
        }
      }, 15000); // 15 second scan timeout

    } catch (error) {
      console.error('Beacon scanning error:', error);
      setScanning(false);
      showAlert(
        'Scanning Failed', 
        'Unable to scan for beacons. Please check Bluetooth is enabled and try again, or enter the UUID manually.'
      );
    }
  };

  // Fallback simulation for web/unsupported platforms
  const handleScanBeaconSimulation = async () => {
    setScanning(true);
    try {
      showAlert(
        "Scanning for Beacons...",
        "Looking for nearby classroom beacons..."
      );
      
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate finding a beacon
      const simulatedBeacon = {
        uuid: "D001A2B6-AA1F-4860-9E43-FC83C418FC58",
        distance: 2.5,
        rssi: -65
      };
      
      setDetectedBeacons([simulatedBeacon]);
      setBeaconUUID(simulatedBeacon.uuid);
      
      showAlert(
        "📡 Beacon Found! (Simulated)",
        `Found classroom beacon!\\n\\n` +
        `UUID: ${simulatedBeacon.uuid.substring(0, 8)}...\\n` +
        `Distance: ${simulatedBeacon.distance} meters\\n` +
        `Signal: ${simulatedBeacon.rssi} dBm\\n\\n` +
        `You can now check in!`
      );
    } catch (error) {
      showAlert("Scan Failed", "Could not scan for beacons. Please enter UUID manually.");
    } finally {
      setScanning(false);
    }
  };

  const selectBeacon = (beacon) => {
    setBeaconUUID(beacon.uuid.toUpperCase());
    showAlert(
      'Beacon Selected',
      `Selected beacon at ${beacon.distance.toFixed(1)}m distance.\\n\\nYou can now check in!`
    );
  };

  const handleCheckIn = async () => {
    // Validate inputs
    if (!studentId) {
      showAlert("Error", "Please enter your Student ID");
      return;
    }

    if (!beaconUUID) {
      showAlert("Error", "Please scan for beacon or enter the Beacon UUID from your instructor");
      return;
    }

    // Validate proximity if we have detected beacon info
    const selectedBeacon = detectedBeacons.find(b => b.uuid.toUpperCase() === beaconUUID.toUpperCase());
    if (selectedBeacon && selectedBeacon.distance > 5.0) {
      showAlert(
        "Too Far Away",
        `You must be within 5 meters of the classroom beacon.\\n\\n` +
        `Current distance: ${selectedBeacon.distance.toFixed(1)} meters\\n\\n` +
        `Please move closer to the instructor's beacon device.`
      );
      return;
    }

    setLoading(true);

    try {
      // Call backend API
      const response = await attendanceAPI.checkIn({
        student_id: studentId,
        beacon_uuid: beaconUUID.trim(),
      });

      if (response.message === 'attendance recorded') {
        // Add to local history
        const now = new Date();
        const date = now.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const time = now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit", 
          second: "2-digit",
          hour12: false,
        });

        const newRecord = {
          date,
          time,
          id: Date.now(),
          className: response.session?.class_id || courseCode,
          room: response.session?.room_id || courseRoom,
          status: response.attendance?.status || 'Present'
        };

        setCheckInHistory([newRecord, ...checkInHistory]);
        setIsCheckedIn(true);

        const proximityInfo = selectedBeacon 
          ? `\\nDistance: ${selectedBeacon.distance.toFixed(1)}m` 
          : '';

        showAlert(
          "✅ Check-in Successful!",
          `Attendance marked successfully!\\n\\n` +
          `Class: ${response.session?.class_id}\\n` +
          `Room: ${response.session?.room_id}\\n` +
          `Time: ${time}\\n` +
          `Status: ${response.attendance?.status || 'Present'}${proximityInfo}`
        );

        // Reset check-in status after 30 seconds
        setTimeout(() => {
          setIsCheckedIn(false);
        }, 30000);
      } else {
        showAlert(
          "Check-in Failed",
          response.message || response.error || "Unable to mark attendance. Please try again."
        );
      }
    } catch (error) {
      console.error("Check-in error:", error);
      showAlert(
        "Network Error",
        "Could not connect to attendance system. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          {Platform.OS !== "web" && (
            <Image
              source={require("../assets/siitlogo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{courseCode}</Text>
            <Text style={styles.headerSubtitle}>{courseName}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Course Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Course Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Course Code:</Text>
            <Text style={styles.infoValue}>{courseCode}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Course Name:</Text>
            <Text style={styles.infoValue}>{courseName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Day:</Text>
            <Text style={styles.infoValue}>{courseDay}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time:</Text>
            <Text style={styles.infoValue}>{courseTime}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Room:</Text>
            <Text style={styles.infoValue}>{courseRoom}</Text>
          </View>
        </View>

        {/* Check-in Form */}
        <View style={styles.checkInCard}>
          <Text style={styles.sectionTitle}>Check-in</Text>

          {/* Student ID Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Student ID"
              placeholderTextColor="#999"
              value={studentId}
              onChangeText={setStudentId}
              keyboardType="numeric"
              maxLength={10}
              editable={!loading && !isCheckedIn}
            />
          </View>

          {/* Beacon Scanning Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Classroom Beacon {beaconSupported ? '(Real Scanning)' : '(Simulation)'}
            </Text>
            
            {/* Scan Button */}
            <TouchableOpacity
              style={[
                styles.scanButton,
                (scanning || loading || isCheckedIn) && styles.buttonDisabled,
              ]}
              onPress={startBeaconScanning}
              disabled={scanning || loading || isCheckedIn}
            >
              {scanning ? (
                <View style={styles.scanningContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.scanButtonText}>Scanning...</Text>
                </View>
              ) : (
                <Text style={styles.scanButtonText}>
                  📡 Scan for Classroom Beacon
                </Text>
              )}
            </TouchableOpacity>

            {/* Detected Beacons List */}
            {detectedBeacons.length > 0 && (
              <View style={styles.beaconList}>
                <Text style={styles.beaconListTitle}>Detected Beacons:</Text>
                {detectedBeacons.map((beacon, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.beaconItem,
                      beacon.uuid.toUpperCase() === beaconUUID.toUpperCase() && styles.beaconItemSelected
                    ]}
                    onPress={() => selectBeacon(beacon)}
                  >
                    <Text style={styles.beaconUUID}>
                      📡 {beacon.uuid.substring(0, 8)}...{beacon.uuid.substring(beacon.uuid.length - 4)}
                    </Text>
                    <Text style={styles.beaconDetails}>
                      📏 {beacon.distance.toFixed(1)}m • 📶 {beacon.rssi} dBm
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Manual UUID Input */}
            <Text style={styles.label}>Or Enter Beacon UUID Manually:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter Beacon UUID from instructor (e.g., D001A2B6-AA1F-4860-9E43-FC83C418FC58)"
              placeholderTextColor="#999"
              value={beaconUUID}
              onChangeText={setBeaconUUID}
              multiline
              numberOfLines={2}
              editable={!loading && !isCheckedIn}
            />
          </View>

          {/* Check-in Button */}
          <TouchableOpacity
            style={[
              styles.checkInButton,
              (loading || isCheckedIn) && styles.checkInButtonDisabled,
            ]}
            onPress={handleCheckIn}
            disabled={loading || isCheckedIn}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.checkInButtonText}>
                {isCheckedIn ? "✓ Checked In" : "Check In"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Check-in History */}
        {checkInHistory.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.sectionTitle}>Check-in History</Text>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.dateColumn]}>
                  Date
                </Text>
                <Text style={[styles.tableHeaderText, styles.timeColumn]}>
                  Time
                </Text>
                <Text style={[styles.tableHeaderText, styles.statusColumn]}>
                  Status
                </Text>
              </View>

              {/* Table Rows */}
              {checkInHistory.map((record) => (
                <View key={record.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.dateColumn]}>
                    {record.date}
                  </Text>
                  <Text style={[styles.tableCell, styles.timeColumn]}>
                    {record.time}
                  </Text>
                  <Text style={[styles.tableCell, styles.statusColumn, 
                    record.status === 'Present' ? styles.statusPresent : 
                    record.status === 'Late' ? styles.statusLate : styles.statusAbsent
                  ]}>
                    {record.status || 'Present'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {checkInHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No check-ins yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Scan for the classroom beacon or enter the UUID from your instructor, then check in
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(114, 47, 135, 0.4)",
  },
  header: {
    backgroundColor: "rgba(108, 42, 129, 0.5)",
    padding: 16,
    paddingTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.12)",
  },
  backButton: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerLogo: {
    width: 56,
    height: 56,
    marginRight: 12,
  },
  headerText: {
    flexDirection: "column",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    backgroundColor: "rgba(114, 47, 135, 0.7)",
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkInCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#722F87",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#722F87",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
  },
  scanButton: {
    backgroundColor: "#722F87",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  beaconList: {
    marginTop: 12,
    marginBottom: 16,
  },
  beaconListTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#722F87",
    marginBottom: 8,
  },
  beaconItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  beaconItemSelected: {
    backgroundColor: "#e7f3ff",
    borderColor: "#007bff",
  },
  beaconUUID: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  beaconDetails: {
    fontSize: 12,
    color: "#666",
  },
  checkInButton: {
    backgroundColor: "#BE1E2D",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkInButtonDisabled: {
    backgroundColor: "#4CAF50",
    opacity: 0.8,
  },
  checkInButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  historyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#722F87",
    padding: 12,
  },
  tableHeaderText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#FFFFFF",
  },
  tableCell: {
    fontSize: 14,
    color: "#333",
  },
  dateColumn: {
    flex: 2,
  },
  timeColumn: {
    flex: 1,
    textAlign: "center",
  },
  statusColumn: {
    flex: 1,
    textAlign: "right",
    fontWeight: "600",
  },
  statusPresent: {
    color: "#28a745",
  },
  statusLate: {
    color: "#ffc107",
  },
  statusAbsent: {
    color: "#dc3545",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});