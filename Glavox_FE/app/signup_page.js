import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

// Use your computer's IP address here
const API_URL = "http://192.168.170.195:5000/api";  // Replace with your actual IP address

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const isLengthValid = password.length >= 8;
    const hasCapitalLetter = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!isLengthValid || !hasCapitalLetter || !hasSpecialChar) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 8 characters long, contain at least one capital letter, and one special character."
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting to sign up with:", { name, email });
      const response = await axios.post(
        `${API_URL}/auth/signup`,
        {
          name,
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("Signup response:", response.data);

      if (response.data.token) {
        await AsyncStorage.setItem("token", response.data.token);
        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        Alert.alert("Success", "Account created successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/home_screen"),
          },
        ]);
      }
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      if (error.code === 'ECONNABORTED') {
        Alert.alert("Connection Error", "Server is not responding. Please check your internet connection and try again.");
      } else if (error.response?.status === 401) {
        Alert.alert(
          "Authentication Error",
          "Please check your credentials and try again."
        );
      } else if (error.response?.status === 409) {
        Alert.alert(
          "Account Exists",
          "An account with this email already exists. Please try logging in instead."
        );
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.error ||
            "Failed to create account. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/Background.png")}
      style={styles.background}
    >
      <Animatable.View
        animation="slideInUp"
        duration={2000}
        style={styles.container}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace("/login_page")}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Image
          source={require("../assets/images/LOGO.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>
          Provide details to create an account and verify your email.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="black"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="black"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="black"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={24}
              color="black"
              style={styles.toggleIcon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login_page")}>
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </Animatable.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    width: "90%",
  },
  logo: {
    height: 85,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  subtitle: {
    fontSize: 14,
    color: "black",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: "black",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    color: "black",
  },
  toggleIcon: {
    marginLeft: 10,
  },
  button: {
    width: "100%",
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    color: "black",
    marginTop: 15,
    fontSize: 14,
  },
  loginLink: {
    color: "blue",
    fontWeight: "bold",
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
  },
});
