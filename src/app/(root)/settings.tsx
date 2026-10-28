import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "PGFinders member";
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "No email address";

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Could not sign out:", error);
      Alert.alert("Unable to sign out", "Please check your connection and try again.");
    } finally {
      setSigningOut(false);
    }
  };

  const openSupport = async () => {
    const url = "mailto:aniruddhsharma669@gmail.com?subject=PGFinders%20Support";
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Contact support", "Email aniruddhsharma669@gmail.com for help with PGFinders.");
    }
  };

  if (!isUserLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-5">
          <Ionicons name="chevron-back" size={22} color="#2563EB" />
          <Text className="text-blue-600 font-semibold text-base">Back</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-extrabold text-gray-900">Settings</Text>
        <Text className="text-sm text-gray-500 mt-2 mb-6">Manage your account and find important information.</Text>

        <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl p-4 mb-6">
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} className="w-14 h-14 rounded-full" />
          ) : (
            <View className="w-14 h-14 rounded-full bg-blue-50 items-center justify-center">
              <Ionicons name="person-outline" size={26} color="#2563EB" />
            </View>
          )}
          <View className="flex-1 ml-3">
            <Text className="text-base font-bold text-gray-900">{name}</Text>
            <Text className="text-sm text-gray-500 mt-1">{email}</Text>
            <Text className="text-xs text-gray-400 mt-1">Account securely managed by Clerk</Text>
          </View>
        </View>

        <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Your PGFinders</Text>
        <View className="bg-white border border-gray-100 rounded-2xl px-4 mb-6">
          <SettingsRow
            icon="heart-outline"
            title="Saved places"
            description="Review the PGs you bookmarked."
            onPress={() => router.push("/(root)/(tabs)/saved")}
          />
        </View>

        <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Privacy & information</Text>
        <View className="bg-white border border-gray-100 rounded-2xl px-4 mb-6">
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            description="Learn how account and app information is handled."
            onPress={() => router.push("/privacy-policy")}
          />
          <View className="h-px bg-gray-100 ml-11" />
          <SettingsRow
            icon="document-text-outline"
            title="Terms of Use"
            description="Read the rules for using PGFinders."
            onPress={() => router.push("/terms-of-use")}
          />
          <View className="h-px bg-gray-100 ml-11" />
          <SettingsRow
            icon="help-circle-outline"
            title="Help & support"
            description="Contact the PGFinders team."
            onPress={openSupport}
          />
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          disabled={signingOut}
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-4"
          style={{ opacity: signingOut ? 0.7 : 1 }}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          )}
          <Text className="text-red-600 font-semibold">{signingOut ? "Signing out…" : "Sign out"}</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-400 mt-6">PGFinders · Making the PG search process clearer.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center py-4">
      <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
        <Ionicons name={icon} size={20} color="#2563EB" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-gray-900">{title}</Text>
        <Text className="text-xs text-gray-500 mt-1 leading-5">{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}
