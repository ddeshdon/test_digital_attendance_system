import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { userAPI } from "../services/api-action-based";
import cognitoAuth from "../services/cognitoAuth";

// Web-safe alert function
const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validate inputs
    if (!email || !password) {
      showAlert("Error", "Please enter both email and password");
      return;
    }

    // Validate SIIT email
    if (
      !email.endsWith("@g.siit.tu.ac.th") &&
      !email.endsWith("@siit.tu.ac.th")
    ) {
      showAlert("Invalid Email", "Please use your SIIT email address");
      return;
    }

    setLoading(true);

    try {
      // Try Cognito authentication first
      try {
        const result = await cognitoAuth.signIn(email, password);
        
        if (result.success && result.user) {
          console.log("Cognito login successful:", result.user);
          showAlert("Welcome", `Hello, ${result.user.name || 'Student'}!`);
          
          // Store user data for later use
          global.currentUser = result.user;
          
          router.replace("/home");
          return;
        }
      } catch (cognitoError) {
        console.log('Cognito auth failed, trying fallback:', cognitoError);
      }

      // Fallback to old API if Cognito fails
      const studentId = email.split("@")[0];
      const data = await userAPI.login(studentId);
      
      if (data.user) {
        console.log("API login successful:", data.user);
        showAlert("Welcome", `Hello, ${data.user.name}!`);
        
        // Store user data for later use
        global.currentUser = data.user;
        
        router.replace("/home");
      } else {
        showAlert("Login Failed", "Invalid credentials. Please check your email and password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      showAlert(
        "Login Failed",
        "Invalid credentials. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignupPress = () => {
    router.push("/signup");
  };

  // For web compatibility - check if assets exist
  const hasAssets = Platform.OS !== "web";

  // Safe image loader
  let backgroundImage, logoImage;
  try {
    if (hasAssets) {
      backgroundImage = require("../assets/SIIT_Main_Building.jpg");
      logoImage = require("../assets/siitlogo.png");
    }
  } catch (error) {
    console.log("Error loading images:", error);
  }

  const renderContent = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          {hasAssets && logoImage && (
            <Image
              source={logoImage}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <Text style={styles.title}>Digital Attendance</Text>
          <Text style={styles.subtitle}>Student Login</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="student123@siit.tu.ac.th"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Signing in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>No account? </Text>
            <TouchableOpacity onPress={handleSignupPress} disabled={loading}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      {hasAssets && backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>{renderContent()}</View>
        </ImageBackground>
      ) : (
        <View style={[styles.overlay, styles.webBackground]}>
          {renderContent()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(114, 47, 135, 0.7)", // SIIT Purple color with opacity
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  webBackground: {
    backgroundColor: "#722F87", // SIIT Purple color (solid for web)
  },
  keyboardView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 30,
    borderRadius: 15,
    marginBottom: 30,
    width: "100%",
    maxWidth: 400,
  },
  logo: {
    width: 280,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#722F87", // SIIT Purple color
  },
  subtitle: {
    fontSize: 18,
    color: "#722F87", // SIIT Purple color
    opacity: 0.8,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 30,
    borderRadius: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#722F87",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  loginButton: {
    backgroundColor: "#BE1E2D", // SIIT Red color
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: "#722F87",
  },
  signupLink: {
    fontSize: 14,
    color: "#BE1E2D",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
