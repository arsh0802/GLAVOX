import { useRouter } from "expo-router";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Alert,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useEffect } from "react";

export default function index() {
  const router = useRouter();

  // prevent going back to Profile/Home screen
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Hold on!", "Are you sure you want to exit the app?", [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        { text: "YES", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/Background.png")}
        style={styles.backgroundImage}
      />

      <Animatable.View
        animation="fadeInDown"
        duration={1500}
        delay={500}
        style={styles.logoContainer}
      >
        <Animatable.Image
          animation={{
            0: { opacity: 0, scale: 0.5, translateY: -100 },
            0.5: { opacity: 1, scale: 1.1 },
            1: { scale: 1, translateY: 0 },
          }}
          duration={2000}
          delay={800}
          source={require("../assets/images/LOGO.png")}
          style={styles.logo}
        />
        <Animatable.Text
          animation="fadeInUp"
          delay={1500}
          style={styles.subtitle}
        >
          where hesitation leaves the chat
        </Animatable.Text>
      </Animatable.View>

      <Animatable.View
        animation="fadeInUp"
        delay={2500}
        style={styles.buttonContainer}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/login_page")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

// [styles] same as your previous code


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f3f3",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  logo: {
    width: 280,
    height: 180,
    resizeMode: "contain",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0D0C0C",
    letterSpacing: 1.2,
    textAlign: "center",
    marginTop: 10,
  },
  buttonContainer: {
    justifyContent: "flex-end",
    width: "100%",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#0D8B3D",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    alignSelf: "center",
  },
  buttonText: {
    fontSize: 20,
    color: "white",
    fontWeight: "500",
  },
});
