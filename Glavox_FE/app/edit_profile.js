import React, { useState, useEffect } from 'react';
import { useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageBackground,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [bio, setBio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/profile/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await response.json();
      setName(data.name || '');
      setEmail(data.email || '');
      setContact(data.contact || '');
      setBio(data.bio || '');
      setLinkedin(data.linkedin || '');
      setGithub(data.github || '');
      setProfilePicture(data.profilePicture || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://192.168.170.195:5000/api/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          contact,
          bio,
          linkedin,
          github,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Profile updated!');
        router.back();
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Server error');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop();
      const fileType = filename.split('.').pop();

      const formData = new FormData();
      formData.append('profilePicture', {
        uri: localUri,
        name: filename,
        type: `image/${fileType}`,
      });

      try {
        const token = await AsyncStorage.getItem("token");

        const res = await fetch(`${API_URL}/profile/update-picture`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        const data = await res.json();
        if (res.ok) {
          setProfilePicture(data.user.profilePicture);
          Alert.alert('Success', 'Profile picture updated!');
        } else {
          Alert.alert('Error', data.message || 'Failed to upload image');
        }
      } catch (error) {
        console.error('Image upload error:', error);
        Alert.alert('Error', 'Image upload failed');
      }
    }
  };

  return (
    <ImageBackground source={require('../assets/images/Background.png')} style={styles.background}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/LOGO.png')} style={styles.logo} />
        <TouchableOpacity style={styles.backButton} onPress={() => router.navigate("profile_screen")}>
          <Image source={require('../assets/images/back-button.png')} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.scrollWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Text style={styles.title}>Edit Profile</Text>

            <View style={styles.profileContainer}>
              <Image
                source={profilePicture ? { uri: profilePicture } : require('../assets/images/metahuman.png')}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
                <Text style={styles.editText}>📷</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" />

            <Text style={styles.label}>Contact</Text>
            <TextInput style={styles.input} value={contact} onChangeText={setContact} placeholder="Enter your contact" keyboardType="phone-pad" />

            <Text style={styles.label}>Bio</Text>
            <TextInput style={styles.input} value={bio} onChangeText={setBio} placeholder="Short bio" multiline numberOfLines={3} />

            <Text style={styles.label}>LinkedIn</Text>
            <TextInput style={styles.input} value={linkedin} onChangeText={setLinkedin} placeholder="LinkedIn URL" />

            <Text style={styles.label}>GitHub</Text>
            <TextInput style={styles.input} value={github} onChangeText={setGithub} placeholder="GitHub URL" />

            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollWrapper: {
    flex: 1,
    marginTop: 120,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    height: 50,
    resizeMode: 'contain',
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  backIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  container: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  profileContainer: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  editText: {
    fontSize: 16,
    color: '#000',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});