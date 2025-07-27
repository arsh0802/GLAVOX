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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useLocalSearchParams(); // token from reset link (optional)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://192.168.170.195:5000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: newPassword,
          token: token // token should be passed from the reset email link
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", data.message || "Password has been reset.");
        router.push("/login_page");
      } else {
        Alert.alert("Error", data.error || "Unable to reset password.");
      }
    } catch (error) {
      console.error("Reset Error:", error);
      Alert.alert("Server Error", "Please try again later.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/Background.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <Image
          source={require("../assets/images/LOGO.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password</Text>

        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="black"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="black"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login_page")}>
          <Text style={styles.signupText}>
            Back to <Text style={styles.signupLink}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    color: "black",
  },
  button: {
    width: "100%",
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupText: {
    color: "black",
    marginTop: 15,
    fontSize: 14,
  },
  signupLink: {
    color: "blue",
    fontWeight: "bold",
  },
});
