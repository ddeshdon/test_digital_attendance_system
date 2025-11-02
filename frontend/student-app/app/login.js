import React from 'react';
import { Stack } from 'expo-router';
import Login from '../src/components/Login';

export default function LoginPage() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <Login />
    </>
  );
}