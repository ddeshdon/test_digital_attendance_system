import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import Classroom from '../src/components/Classroom';

export default function ClassroomPage() {
  const params = useLocalSearchParams();
  return <Classroom route={{ params }} />;
}