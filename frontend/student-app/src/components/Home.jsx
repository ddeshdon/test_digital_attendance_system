import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

const classes = [
  {
    code: 'CSS322',
    name: 'Scientific Computing',
    day: 'Thursday',
    time: '13:00 - 16:00'
  },
  {
    code: 'DES201',
    name: 'Discrete Mathematics',
    day: 'Thursday',
    time: '9:00 - 12:00'
  },
  {
    code: 'TU100',
    name: 'Civic Engagement',
    day: 'Friday',
    time: '13:00 - 16:00'
  },
  {
    code: 'DES424',
    name: 'Cloud-based Application Development',
    day: 'Wednesday',
    time: '9:00 - 12:00'
  },
  {
    code: 'TU109',
    name: 'Innovation and Entrepreneurial mindset',
    day: 'Tuesday',
    time: '9:00 - 12:00'
  },
  {
    code: 'DES423',
    name: 'Applied Machine Learning and AI',
    day: 'Monday',
    time: '13:00 - 16:00'
  },
  {
    code: 'DES427',
    name: 'Mobile Application Programming',
    day: 'Monday',
    time: '13:00 - 16:00'
  }
];

const ClassCard = ({ code, name, day, time, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.codeContainer}>
      <Text style={styles.courseCode}>{code}</Text>
    </View>
    <Text style={styles.courseName}>{name}</Text>
    <View style={styles.timeContainer}>
      <Text style={styles.dayTime}>{day}</Text>
      <Text style={styles.dayTime}>{time}</Text>
    </View>
  </TouchableOpacity>
);

export default function Home() {
  const router = useRouter();

  const handleClassPress = (classItem) => {
    router.push({
      pathname: "/classroom",
      params: {
        code: classItem.code,
        name: classItem.name,
        day: classItem.day,
        time: classItem.time,
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../assets/siitlogo.png')} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>My Classes</Text>
            <Text style={styles.headerSubtitle}>Fall Semester 2025</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>Student</Text>
        </View>
      </View>

      <View style={styles.classesSection}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.classesContainer}>
          {classes.map((classItem, index) => (
            <ClassCard 
              key={index} 
              {...classItem} 
              onPress={() => handleClassPress(classItem)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(114, 47, 135, 0.4)', // page background (changeable)
  },
  header: {
    backgroundColor: 'rgba(108, 42, 129, 0.5)', // header background (change this independently)
    padding: 16,
    paddingTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerRight: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  classesContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classesSection: {
    flex: 1,
    paddingTop: 16,
    backgroundColor: 'rgba(114, 47, 135, 0.7)',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: 8,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    padding: 12,
    width: '48%',
    aspectRatio: 1, // make card square
    justifyContent: 'flex-start',
  },
  codeContainer: {
    marginBottom: 8,
  },
  courseCode: {
    color: '#BE1E2D',
    fontWeight: 'bold',
    fontSize: 18,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  timeContainer: {
    marginTop: 6,
  },
  dayTime: {
    color: '#666666',
    fontSize: 14,
    opacity: 0.8,
  },
});
