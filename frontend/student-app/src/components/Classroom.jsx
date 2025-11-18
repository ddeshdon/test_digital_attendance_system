import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Web-safe alert function
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
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

  // Course details from navigation params
  const courseCode = params.code || 'N/A';
  const courseName = params.name || 'Course Name';
  const courseDay = params.day || 'N/A';
  const courseTime = params.time || 'N/A';
  const courseRoom = params.room || 'N/A';

  const handleCheckIn = () => {
    const now = new Date();
    const date = now.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Add new check-in record
    const newRecord = {
      date,
      time,
      id: Date.now()
    };

    setCheckInHistory([newRecord, ...checkInHistory]);
    setIsCheckedIn(true);

    showAlert('Success', 'Check-in completed successfully!');

    // Reset check-in status after 5 seconds
    setTimeout(() => {
      setIsCheckedIn(false);
    }, 5000);
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
          {Platform.OS !== 'web' && (
            <Image source={require('../assets/siitlogo.png')} style={styles.headerLogo} resizeMode="contain" />
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

        {/* Check-in Button */}
        <TouchableOpacity
          style={[styles.checkInButton, isCheckedIn && styles.checkInButtonDisabled]}
          onPress={handleCheckIn}
          disabled={isCheckedIn}
        >
          <Text style={styles.checkInButtonText}>
            {isCheckedIn ? '✓ Checked In' : 'Check In'}
          </Text>
        </TouchableOpacity>

        {/* Check-in History Table */}
        {checkInHistory.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.sectionTitle}>Check-in History</Text>
            
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
                <Text style={[styles.tableHeaderText, styles.timeColumn]}>Time</Text>
              </View>

              {/* Table Rows */}
              {checkInHistory.map((record) => (
                <View key={record.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.dateColumn]}>{record.date}</Text>
                  <Text style={[styles.tableCell, styles.timeColumn]}>{record.time}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {checkInHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No check-ins yet</Text>
            <Text style={styles.emptyStateSubtext}>Press the Check In button above to record your attendance</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  backButton: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerLogo: {
    width: 56,
    height: 56,
    marginRight: 12,
  },
  headerText: {
    flexDirection: 'column',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(114, 47, 135, 0.7)',
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#722F87',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  checkInButton: {
    backgroundColor: '#BE1E2D',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkInButtonDisabled: {
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#722F87',
    padding: 12,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  dateColumn: {
    flex: 2,
  },
  timeColumn: {
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
