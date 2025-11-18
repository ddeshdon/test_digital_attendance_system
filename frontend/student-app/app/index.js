import React from 'react';
import { Redirect } from 'expo-router';

// Redirect to login page as the first view
export default function Index() {
  return <Redirect href="/login" />;
}
