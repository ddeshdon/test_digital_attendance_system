import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image, ImageBackground } from 'react-native';
import { Amplify, Auth } from 'aws-amplify';
import { router } from 'expo-router';
import awsConfig from '../aws-config';

// Initialize Amplify (reads configuration from src/aws-config.js)
Amplify.configure(awsConfig);

export default function Login() {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
  });

  React.useEffect(() => {
    handleSignInResponse();
  }, [response]);

  const handleSignInResponse = async () => {
    if (response?.type === 'success') {
      setLoading(true);
      try {
        const { authentication } = response;
        
        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        });
        
        const userInfo = await userInfoResponse.json();
        
        // Check if email is from SIIT
        if (userInfo.email.endsWith('@g.siit.tu.ac.th')) {
          // TODO: Handle successful login - store token, navigate to main screen, etc.
          router.replace('/home');
        } else {
          Alert.alert(
            'Invalid Email',
            'Please use SIIT email to Login',
            [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
          );
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred during sign in.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ImageBackground
      source={require('../assets/SIIT_Main_Building.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.headerContainer}>
          <Image
            source={require('../assets/siitlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Digital Attendance</Text>
          <Text style={styles.subtitle}>Student Login</Text>
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(114, 47, 135, 0.7)', // SIIT Purple color with opacity
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 30,
    borderRadius: 15,
    marginBottom: 50,
  },
  logo: {
    width: 280,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#722F87', // SIIT Purple color
  },
  subtitle: {
    fontSize: 18,
    color: '#722F87', // SIIT Purple color
    opacity: 0.8,
  },
  googleButton: {
    backgroundColor: '#BE1E2D', // SIIT Red color
    padding: 15,
    borderRadius: 10,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
