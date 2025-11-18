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

// Web-safe alert function
const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Validate inputs
    if (!fullName || !studentId || !email || !password || !confirmPassword) {
      showAlert("Error", "Please fill in all fields");
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

    // Validate student ID format (10 digits)
    if (!/^\d{10}$/.test(studentId)) {
      showAlert("Invalid Student ID", "Student ID must be 10 digits");
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      showAlert("Error", "Passwords do not match");
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      showAlert("Weak Password", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      // ========== REAL API CALL TO BACKEND ==========
      const response = await fetch(
        "http://192.168.1.154:5000/api/user/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: studentId,
            name: fullName,
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showAlert(
          "Success",
          "Account created successfully! You can now login."
        );
        router.replace("/login");
      } else {
        showAlert(
          "Registration Failed",
          data.message || "Unable to create account"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      showAlert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.back();
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={styles.input}
              placeholder="6522781234"
              placeholderTextColor="#999"
              value={studentId}
              onChangeText={setStudentId}
              keyboardType="numeric"
              maxLength={10}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="student@g.siit.tu.ac.th"
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.signupButton,
              loading && styles.signupButtonDisabled,
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLoginPress} disabled={loading}>
              <Text style={styles.loginLink}>Login</Text>
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
    paddingVertical: 20,
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
    marginBottom: 16,
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
  signupButton: {
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
  signupButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: "#722F87",
  },
  loginLink: {
    fontSize: 14,
    color: "#BE1E2D",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
