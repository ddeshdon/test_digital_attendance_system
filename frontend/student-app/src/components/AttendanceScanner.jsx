import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal
} from 'react-native';
import { attendanceAPI } from '../services/api';
import { beaconService } from '../services/beaconService';

const AttendanceScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [detectedUUID, setDetectedUUID] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [studentId, setStudentId] = useState('6522781713');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualUUID, setManualUUID] = useState('');

  useEffect(() => {
    loadStoredStudentId();
  }, []);

  const loadStoredStudentId = async () => {
    try {
      const storedId = await attendanceAPI.getStoredStudentId();
      if (storedId) {
        setStudentId(storedId);
      }
    } catch (error) {
      console.error('Error loading student ID:', error);
    }
  };

  const saveStudentId = async (newStudentId) => {
    try {
      await attendanceAPI.setStoredStudentId(newStudentId);
      setStudentId(newStudentId);
    } catch (error) {
      console.error('Error saving student ID:', error);
    }
  };

  const simulateBeaconScan = async () => {
    setScanning(true);
    setDetectedUUID(null);
    
    try {
      console.log('Starting beacon scan simulation...');
      const result = await beaconService.simulateBeaconScan();
      
      if (result.success) {
        setDetectedUUID(result.beacon.uuid);
        
        Alert.alert(
          '📡 Beacon Detected!',
          `Found classroom beacon:\n${result.beacon.uuid.substring(0, 8)}...\n\nDistance: ${result.beacon.distance.toFixed(1)}m\nClassroom: ${result.beacon.classroom}\n\nReady to check in?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Check In', 
              onPress: () => handleCheckIn(result.beacon.uuid)
            }
          ]
        );
      } else {
        Alert.alert(
          'No Beacon Found',
          'Could not detect any classroom beacons nearby.\n\nMake sure you are close to the instructor\'s beacon or try manual entry.',
          [
            { text: 'Try Again', onPress: simulateBeaconScan },
            { text: 'Manual Entry', onPress: () => setShowManualModal(true) }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Scanning Error', 'Could not scan for beacons: ' + error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleCheckIn = async (beaconUUID) => {
    if (!studentId.trim()) {
      Alert.alert('Error', 'Please enter your Student ID first');
      return;
    }

    setCheckingIn(true);
    
    try {
      const checkInData = {
        student_id: studentId.trim(),
        beacon_uuid: beaconUUID
      };

      console.log('Sending check-in data:', checkInData);
      
      const response = await attendanceAPI.checkIn(checkInData);
      
      if (response.success) {
        Alert.alert(
          '✅ Attendance Marked!',
          `Successfully checked in!\n\nClass: ${response.session.class_id}\nRoom: ${response.session.room_id}\nTime: ${new Date().toLocaleTimeString()}`,
          [{ 
            text: 'Great!',
            onPress: () => {
              setDetectedUUID(null);
              setShowManualModal(false);
              setManualUUID('');
            }
          }]
        );
      } else {
        Alert.alert(
          '❌ Check-in Failed',
          response.message || 'Could not mark attendance.\n\nPlease make sure:\n• You are in the correct classroom\n• The session is still active\n• You have the correct UUID'
        );
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        'Could not connect to attendance system.\n\nPlease check your internet connection and try again.'
      );
      console.error('Check-in error:', error);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleManualCheckIn = () => {
    if (!manualUUID.trim()) {
      Alert.alert('Error', 'Please enter a valid UUID');
      return;
    }

    // Validate UUID format
    const uuidPattern = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
    if (!uuidPattern.test(manualUUID.trim())) {
      Alert.alert('Invalid Format', 'Please enter a valid UUID format\n(e.g., D001A2B6-AA1F-4860-9E43-FC83C418FC58)');
      return;
    }

    handleCheckIn(manualUUID.trim());
  };

  const testWithKnownUUID = () => {
    const knownUUID = 'D001A2B6-AA1F-4860-9E43-FC83C418FC58';
    setManualUUID(knownUUID);
    Alert.alert(
      'Test UUID Loaded',
      `Loaded test UUID for DES424 class.\n\nThis will simulate a successful check-in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Use Test UUID', onPress: () => handleCheckIn(knownUUID) }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📱 Student Attendance</Text>
        <Text style={styles.subtitle}>Digital Check-in System</Text>
      </View>

      {/* Student ID Input */}
      <View style={styles.studentIdContainer}>
        <Text style={styles.label}>Student ID:</Text>
        <TextInput
          style={styles.studentIdInput}
          value={studentId}
          onChangeText={(text) => {
            setStudentId(text);
            saveStudentId(text);
          }}
          placeholder="Enter your Student ID"
          keyboardType="numeric"
        />
      </View>
      
      {/* Detected Beacon Display */}
      {detectedUUID && (
        <View style={styles.detectedBeacon}>
          <Text style={styles.detectedTitle}>🎯 Detected Beacon:</Text>
          <Text style={styles.detectedUUID}>
            {detectedUUID.substring(0, 8)}...{detectedUUID.substring(28)}
          </Text>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => handleCheckIn(detectedUUID)}
            disabled={checkingIn}
          >
            {checkingIn ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.checkInButtonText}>✅ Check In Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.scanButton]}
          onPress={simulateBeaconScan}
          disabled={scanning || checkingIn}
        >
          <Text style={styles.buttonText}>
            {scanning ? '🔍 Scanning...' : '📡 Scan for Beacon'}
          </Text>
          {scanning && <ActivityIndicator color="white" style={styles.spinner} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.manualButton]}
          onPress={() => setShowManualModal(true)}
          disabled={checkingIn}
        >
          <Text style={styles.buttonText}>✏️ Manual Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testWithKnownUUID}
          disabled={checkingIn}
        >
          <Text style={styles.buttonText}>🧪 Test with Demo UUID</Text>
        </TouchableOpacity>
      </View>

      {/* Help Text */}
      <Text style={styles.helpText}>
        💡 Make sure you're near the instructor's beacon when scanning.{'\n'}
        If scanning doesn't work, ask your instructor for the session UUID.
      </Text>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manual UUID Entry</Text>
            <Text style={styles.modalSubtitle}>
              Enter the session UUID provided by your instructor:
            </Text>
            
            <TextInput
              style={styles.uuidInput}
              value={manualUUID}
              onChangeText={setManualUUID}
              placeholder="D001A2B6-AA1F-4860-9E43-FC83C418FC58"
              autoCapitalize="characters"
              multiline={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowManualModal(false);
                  setManualUUID('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleManualCheckIn}
                disabled={checkingIn}
              >
                {checkingIn ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Check In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  studentIdContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  studentIdInput: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    backgroundColor: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  detectedBeacon: {
    backgroundColor: '#d4edda',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  detectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 10,
  },
  detectedUUID: {
    fontSize: 14,
    fontFamily: 'Courier',
    color: '#155724',
    backgroundColor: '#c3e6cb',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
    textAlign: 'center',
  },
  checkInButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
  },
  manualButton: {
    backgroundColor: '#6c757d',
  },
  testButton: {
    backgroundColor: '#17a2b8',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinner: {
    marginLeft: 10,
  },
  helpText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 20,
  },
  uuidInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 12,
    fontFamily: 'Courier',
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
    minHeight: 60,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AttendanceScanner;