import React from 'react';
import { Stack } from 'expo-router';
import Home from '../src/components/Home';

export default function HomePage() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <Home />
    </>
  );
}