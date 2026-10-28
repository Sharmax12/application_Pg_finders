import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Link, Redirect, useRouter } from "expo-router";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-between px-6 pb-7 pt-10">
        <View className="items-center">
          <Image
            source={require("../../assets/images/kribb.png")}
            style={{ width: 150, height: 58 }}
            resizeMode="contain"
          />
          <View className="mt-12 h-24 w-24 items-center justify-center rounded-[28px] bg-blue-50">
            <Ionicons name="home-outline" size={46} color="#2563EB" />
          </View>
          <Text className="mt-8 text-center text-4xl font-bold leading-10 text-slate-900">
            Find a place{ "\n" }that feels like home.
          </Text>
          <Text className="mt-4 max-w-sm text-center text-base leading-7 text-slate-500">
            Discover PGs, compare the details that matter, and save your favourites for later.
          </Text>
        </View>

        <View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/sign-up")}
            className="flex-row items-center justify-center rounded-2xl bg-blue-600 py-4"
          >
            <Text className="text-base font-bold text-white">Create your account</Text>
            <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <View className="mt-5 flex-row items-center justify-center">
            <Text className="text-sm text-slate-500">Already have an account? </Text>
            <Link href="/sign-in">
              <Text className="text-sm font-bold text-blue-600">Sign in</Text>
            </Link>
          </View>
          <Text className="mt-7 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to our{" "}
            <Link href="/terms-of-use">
              <Text className="font-semibold text-slate-600">Terms of Use</Text>
            </Link>
            {" "}and{" "}
            <Link href="/privacy-policy">
              <Text className="font-semibold text-slate-600">Privacy Policy</Text>
            </Link>
            .
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
