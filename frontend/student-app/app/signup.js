import React from 'react';
import { Stack } from 'expo-router';
import Signup from '../src/components/Signup';

export default function SignupPage() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <Signup />
    </>
  );
}
