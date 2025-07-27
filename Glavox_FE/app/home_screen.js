import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  BackHandler,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const [animations, setAnimations] = useState({});
  const popUpAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const API_URL = "http://192.168.170.195:5000/api";
  console.log("user object", user);
  

  // ✅ Prevent going back from HomeScreen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true; // Prevent going back
      };

      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        backHandler.remove();
      };
    }, [])
  );

  useEffect(() => {
    Animated.timing(popUpAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const topics = [
    {
      title: "Relationships & Dating Culture",
      image: require("../assets/images/pexels-git-stephen-gitau-302905-1667849.jpg"),
    },
    {
      title: "Money and lifestyle",
      image: require("../assets/images/pexels-pixabay-210600.jpg"),
    },
    {
      title: "What do you like the most",
      image: require("../assets/images/pexels-karolina-grabowska-4467986.jpg"),
    },
    {
      title: "Mental health",
      image: require("../assets/images/meditation-7718089_1280.jpg"),
    },
    {
      title: "Travel and adventure",
      image: require("../assets/images/pexels-ninauhlikova-287240.jpg"),
    },
    {
      title: "Bgmi and Valorant",
      image: require("../assets/images/pikaso_text-to-image_Candid-image-photography-natural-textures-highly-r.png"),
    },
  ];

  const ITEM_HEIGHT = height * 0.25;

  const handlePress = (index) => {
    const animatedValue = new Animated.Value(1);
    setAnimations((prev) => ({ ...prev, [index]: animatedValue }));

    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => router.push("/Ai_page"));
  };

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome, {user?.name}!</Text>
        <ImageBackground
          source={require("../assets/images/Background.png")}
          style={styles.background}
        >
          {/* Updated Header matching AI screen */}
          <LinearGradient
            colors={['#FFFFFF', '#F0F9F0']}
            style={styles.header}
          >
            <View style={{width: 24}} /> {/* Empty space for balance */}
            
            <Image 
              source={require('../assets/images/LOGO.png')} 
              style={styles.logo} 
            />
            
            <TouchableOpacity onPress={() => router.push("/profile_screen")}>
              <Image 
                source={require('../assets/images/profile-icon.png')} 
                style={styles.icon} 
              />
            </TouchableOpacity>
          </LinearGradient>

          {/* Everything below remains EXACTLY the same as your original HomeScreen */}
          <Animated.View style={styles.randomTalkContainer}>
            <Image
              source={require("../assets/images/Button_container.png")}
              style={styles.randomTalkImage}
            />
            <View style={styles.textContainer}>
              <Text style={styles.heading}>Let's talk on a random topic!</Text>
              <TouchableOpacity
                style={styles.talkButton}
                onPress={async () => {
                  try {
                    const token = await AsyncStorage.getItem('token');
                    if (!token) return;

                    // Create a predefined message
                    const message = `Hi! My name is ${user.name}`;
                    
                    // Save the message to AsyncStorage for AI page to use
                    await AsyncStorage.setItem('predefinedMessage', message);
                    
                    // Navigate to AI page
                    router.push("/Ai_page");
                  } catch (error) {
                    console.error('LetsTalk error:', error);
                    // Still navigate to AI page even if there's an error
                    router.push("/Ai_page");
                  }
                }}
              >
                <Text style={styles.talkButtonText}>Let's Talk</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.FlatList
            data={topics}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => {
              const position = Animated.subtract(index * ITEM_HEIGHT, scrollY);

              const visibility = position.interpolate({
                inputRange: [-ITEM_HEIGHT / 1.5, 0, ITEM_HEIGHT, ITEM_HEIGHT * 1.5],
                outputRange: [0.2, 1, 1, 0.2],
                extrapolate: "clamp",
              });

              const scale = position.interpolate({
                inputRange: [-ITEM_HEIGHT / 1.5, 0, ITEM_HEIGHT, ITEM_HEIGHT * 1.5],
                outputRange: [0.95, 1, 1, 0.95],
                extrapolate: "clamp",
              });

              return (
                <TouchableOpacity 
                  onPress={async () => {
                    try {
                      const token = await AsyncStorage.getItem('token');
                      if (!token) return;

                      const message = `Hi! My name is ${user.name}. I want to talk on the topic ${item.title}.`;

                      await AsyncStorage.setItem('predefinedMessage', message);

                      router.push("/Ai_page");
                    } catch (error) {
                      console.error('Topic card error:', error);
                      router.push("/Ai_page");
                    }
                  }}
                >
                  <Animated.View
                    style={[
                      styles.verticalCard,
                      { opacity: visibility, transform: [{ scale }] },
                    ]}
                  >
                    <View style={styles.cardContent}>
                      <Image source={item.image} style={styles.topicImage} />
                      <View style={styles.textBox}>
                        <Text style={styles.topicTitle}>{item.title}</Text>
                      </View>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              );
            }}
          />
        </ImageBackground>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  // Updated Header Styles (only this changed)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F0E0',
    elevation: 3,
    width: '100%',
  },
  icon: {
    width: 24,
    height: 24,
  },
  logo: {
    height: 30,
    width: 120,
    resizeMode: 'contain',
  },
  
  // Below is ALL Your Original Styling - Unchanged
  randomTalkContainer: {
    flexDirection: "row",
    backgroundColor: "#0D8B3D",
    paddingVertical: Math.min(height * 0.04, 20), // 20 is max padding
    paddingHorizontal: 15,
    borderRadius: 20,
    marginVertical: 10,
    alignItems: "center",
    width: "93%",
    alignSelf: "center",
    minHeight: 130, // minimum height so it doesn't look too small
    maxHeight: 230, // max height to prevent overflowing on taller screens
  },
  randomTalkImage: {
    height: height * 0.18, // Responsive height
    width: height * 0.18,
    resizeMode: "contain",
  },
  
  textContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  heading: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#fff",
  },
  talkButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#fff",
  },
  talkButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  verticalCard: {
    width: width * 0.88,
    height: height * 0.22,
    backgroundColor: "white",
    justifyContent: "center",
    padding: 10,
    marginVertical: 15,
    alignSelf: "center",
    borderRadius: 20,
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: "100%",
  },
  topicImage: {
    width: "40%",
    height: "100%",
    borderRadius: 15,
    marginRight: 15,
    resizeMode: "cover",
  },
  textBox: {
    flex: 1,
    justifyContent: "center",
  },
  topicTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "black",
    flexWrap: "wrap",
  },
});