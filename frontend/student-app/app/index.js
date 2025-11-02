import React from 'react';
import { Redirect } from 'expo-router';

// Temporary: redirect to /home so the app opens the Home page directly.
// Change this back to "/login" when you want the login screen to be the first view.
export default function Index() {
  return <Redirect href="/login" />;
}
