import React from 'react';
import { StyleSheet, View, StatusBar } from "react-native";
import AttendanceScanner from '../src/components/AttendanceScanner';

export default function Page() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <AttendanceScanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
