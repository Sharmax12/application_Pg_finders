import { useAuth } from "@clerk/expo";
import { Link, Redirect } from "expo-router";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const benefits = [
  {
    icon: "₹",
    title: "Know the monthly cost",
    description: "Compare rent, deposits and important details before you decide.",
  },
  {
    icon: "⌂",
    title: "Find a place that fits",
    description: "Explore PG listings by location, room type and amenities.",
  },
  {
    icon: "♡",
    title: "Shortlist your favourites",
    description: "Save places and come back to compare them later.",
  },
];

export default function HomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-xl self-center">
          <View className="items-center mb-8">
            <Image
              source={require("../../assets/images/kribb.png")}
              className="w-36 h-16 mb-5"
              resizeMode="contain"
            />
            <Text className="text-sm font-bold tracking-widest text-blue-600 uppercase">
              PGFinders
            </Text>
            <Text className="text-3xl font-extrabold text-gray-900 text-center mt-3 leading-10">
              Find a place{"\n"}to feel at home.
            </Text>
            <Text className="text-base text-gray-500 text-center mt-3 leading-6">
              Search PG accommodation with clearer pricing, useful details and a shortlist you can trust.
            </Text>
          </View>

          <View className="gap-3 mb-8">
            <Link href="/sign-up" asChild>
              <TouchableOpacity className="w-full bg-blue-600 py-4 rounded-2xl items-center">
                <Text className="text-white font-bold text-base">Create your account</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/sign-in" asChild>
              <TouchableOpacity className="w-full bg-white border border-gray-200 py-4 rounded-2xl items-center">
                <Text className="text-gray-800 font-semibold text-base">Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View className="gap-4 mb-8">
            {benefits.map((benefit) => (
              <View key={benefit.title} className="flex-row items-start gap-3">
                <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                  <Text className="text-xl font-semibold text-blue-600">{benefit.icon}</Text>
                </View>
                <View className="flex-1 pt-0.5">
                  <Text className="text-sm font-bold text-gray-900">{benefit.title}</Text>
                  <Text className="text-sm text-gray-500 mt-1 leading-5">{benefit.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap justify-center items-center border-t border-gray-100 pt-5 px-2">
            <Text className="text-xs text-gray-400">Continuing means you accept our </Text>
            <Link href="/terms-of-use">
              <Text className="text-xs text-blue-600 font-semibold">Terms of Use</Text>
            </Link>
            <Text className="text-xs text-gray-400"> and </Text>
            <Link href="/privacy-policy">
              <Text className="text-xs text-blue-600 font-semibold">Privacy Policy</Text>
            </Link>
            <Text className="text-xs text-gray-400">.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
