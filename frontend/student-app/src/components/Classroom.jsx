import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { beaconService } from '../services/beaconService';
import { attendanceAPI } from '../services/api';

export default function Classroom({ route }) {
  const { params } = route;
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [studentId, setStudentId] = useState('');
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const courseData = {
    code: params.code,
    name: params.name,
    date: currentDate,
    time: params.time,
    day: params.day,
    room: params.room,
    uuid: params.uuid
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const id = await attendanceAPI.getStoredStudentId();
      setStudentId(id);
      // Load attendance history for this student and course
      loadAttendanceHistory(id);
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const loadAttendanceHistory = (id) => {
    // Mock attendance history - replace with actual API call
    const mockHistory = [
      { studentId: id, date: 'November 6, 2025', time: '09:15 AM' },
      { studentId: id, date: 'November 8, 2025', time: '09:12 AM' },
      { studentId: id, date: 'October 30, 2025', time: '09:18 AM' }
    ];
    setAttendanceHistory(mockHistory);
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      // Scan for beacon
      const beaconResult = await beaconService.simulateBeaconScan();
      
      if (!beaconResult.success) {
        Alert.alert(
          'Beacon Not Found',
          'No classroom beacon detected. Please make sure you are in the classroom.',
          [{ text: 'OK' }]
        );
        setIsCheckingIn(false);
        return;
      }

      // Check if UUID matches
      const scannedUUID = beaconResult.beacon.uuid;
      if (scannedUUID !== courseData.uuid) {
        const wrongClassroom = beaconResult.beacon.classroom;
        Alert.alert(
          'Wrong Classroom',
          `Please attend ${courseData.name} at ${courseData.room}`,
          [{ text: 'OK' }]
        );
        setIsCheckingIn(false);
        return;
      }

      // Perform check-in
      const checkInResult = await attendanceAPI.checkIn({
        student_id: studentId,
        beacon_uuid: scannedUUID
      });

      if (checkInResult.success) {
        Alert.alert(
          'Success',
          'Check-in Complete',
          [{ text: 'OK' }]
        );
        setIsCheckedIn(true);
        // Add new attendance record
        const newRecord = {
          studentId: studentId,
          date: currentDate,
          time: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
        setAttendanceHistory([newRecord, ...attendanceHistory]);
      } else {
        Alert.alert(
          'Check-in Failed',
          checkInResult.message || 'Unable to complete check-in',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert(
        'Error',
        'An error occurred during check-in. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../assets/siitlogo.png')} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{courseData.code}</Text>
            <Text style={styles.headerSubtitle}>{courseData.name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.classSection}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Course Code:</Text>
            <Text style={styles.value}>{courseData.code}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Course Name:</Text>
            <Text style={styles.value}>{courseData.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{courseData.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{courseData.time}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.checkInButton, isCheckingIn && styles.checkInButtonDisabled]} 
          onPress={handleCheckIn}
          disabled={isCheckingIn}
        >
          {isCheckingIn ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.checkInButtonText}>Scanning for Beacon...</Text>
            </View>
          ) : (
            <Text style={styles.checkInButtonText}>Check In</Text>
          )}
        </TouchableOpacity>

        {attendanceHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Attendance History</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableColStudent]}>Student ID</Text>
                <Text style={[styles.tableHeaderText, styles.tableColDate]}>Date</Text>
              </View>
              {attendanceHistory.map((record, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableColStudent]}>{record.studentId}</Text>
                  <Text style={[styles.tableCell, styles.tableColDate]}>{record.date}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(114, 47, 135, 0.4)',
  },
  header: {
    backgroundColor: 'rgba(108, 42, 129, 0.5)',
    padding: 16,
    paddingTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerText: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  classSection: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 16,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  label: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: '#722f87',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  checkInButtonDisabled: {
    opacity: 0.6,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historySection: {
    marginTop: 32,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#722f87',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  tableColStudent: {
    flex: 1,
  },
  tableColDate: {
    flex: 1.5,
  },
});
