import React, { useState, useCallback, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.170.195:5000/";

export default function ProfileScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(require("../assets/images/metahuman.png"));

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");
  
      const response = await fetch(`${BASE_URL}api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const data = await response.json();
  
      if (!response.ok) throw new Error(data.message || "Failed to fetch profile");
  
      setProfileData(data);
  
      // Check if the profile picture exists and use it
      if (data.profilePicture) {
        // Add a cache-busting parameter (timestamp) to force reload
        setProfileImage({ uri: `${BASE_URL}${data.profilePicture}?t=${new Date().getTime()}` });
      } else {
        setProfileImage(require("../assets/images/metahuman.png"));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };
  

  const pickAndUploadImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
  
      if (!result.canceled) {
        const localUri = result.assets[0].uri;
  
        // Compress the image
        const compressedImage = await ImageManipulator.manipulateAsync(
          localUri,
          [],
          {
            compress: 0.4,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
  
        const filename = compressedImage.uri.split("/").pop();
        const fileType = filename.split(".").pop();
  
        const formData = new FormData();
        formData.append("profilePicture", {
          uri: compressedImage.uri,
          name: filename,
          type: `image/${fileType}`,
        });
  
        setUploading(true);
        const token = await AsyncStorage.getItem("token");
  
        const response = await fetch(`${BASE_URL}api/profile/update-picture`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });
  
        const data = await response.json();
  
        if (response.ok) {
          setProfileImage({ uri: `${BASE_URL}${data.updatedUser.profilePicture}?t=${new Date().getTime()}` });
          Alert.alert("Success", "Profile picture updated!");
  
          // Fetch profile again to reflect the new profile image
          fetchProfile();
        } else {
          throw new Error(data.message || "Upload failed");
        }
      }
    } catch (err) {
      console.error("Upload Error:", err);
      Alert.alert("Error", err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };
  
  

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  useEffect(() => {
    // Fetch profile on component mount
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.background, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/Background.png")}
      style={styles.background}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => router.replace("/home_screen")}
        >
          <Image
            source={require("../assets/images/back-button.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <Image
          source={require("../assets/images/LOGO.png")}
          style={styles.logo}
        />

        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() =>
            Alert.alert("Logout", "Are you sure you want to logout?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "OK",
                onPress: async () => {
                  await AsyncStorage.removeItem("token");
                  router.replace("/");
                },
              },
            ])
          }
        >
          <Image
            source={require("../assets/images/logout-icon.png")}
            style={styles.logoutIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.profileContainer}>
        <Text style={styles.heading}>Profile</Text>

        <TouchableOpacity style={styles.profileImageContainer} onPress={pickAndUploadImage}>
          <Image source={profileImage} style={styles.profileImage} />
          {uploading && <ActivityIndicator style={styles.uploadSpinner} size="small" color="#000" />}
        </TouchableOpacity>

        <Text style={styles.userName}>{profileData?.name || "N/A"}</Text>
        <Text style={styles.email}>{profileData?.email || "N/A"}</Text>

        <Text style={styles.subHeading}>Contact</Text>
        <Text style={styles.details}>{profileData?.contact || "N/A"}</Text>

        <Text style={styles.subHeading}>Bio</Text>
        <Text style={styles.details}>{profileData?.bio || "N/A"}</Text>

        <Text style={styles.subHeading}>LinkedIn</Text>
        <Text style={styles.details}>{profileData?.linkedin || "N/A"}</Text>

        <Text style={styles.subHeading}>GitHub</Text>
        <Text style={styles.details}>{profileData?.github || "N/A"}</Text>

        <Text style={styles.subHeading}>Topics Covered</Text>
        <Text style={styles.details}>{profileData?.topicsCovered || "N/A"}</Text>

        <Text style={styles.subHeading}>Feedback</Text>
        <Text style={styles.details}>{profileData?.feedback || "N/A"}</Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push("/edit_profile")}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: "center",
  },
  headerContainer: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  headerIcon: {
    width: 30,
    height: 30,
  },
  backIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  logoutIcon: {
    width: 20,
    height: 28,
    resizeMode: "contain",
  },
  logo: {
    width: 150,
    height: 40,
    resizeMode: "contain",
  },
  profileContainer: {
    marginTop: 120,
    width: "85%",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  profileImageContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: "#ddd", // optional: gives fallback color
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  
  uploadSpinner: {
    position: "absolute",
    top: 45,
    left: 45,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: "black",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "500",
    color: "black",
    marginTop: 10,
  },
  details: {
    fontSize: 16,
    color: "black",
  },
  editButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "black",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  editButtonText: {
    fontSize: 18,
    color: "white",
  },
  profileImageContainer: {
    marginTop: 20,
    alignItems: "center",
    width: 120, // Set fixed width
    height: 120, // Set fixed height
    borderRadius: 60, // Make it round
    overflow: "hidden",
  },
  
  profileImage: {
    width: "100%", // Make it cover the container
    height: "100%", // Cover the full container size
    resizeMode: "cover", // Ensure it fits within the container
  },
  
});
