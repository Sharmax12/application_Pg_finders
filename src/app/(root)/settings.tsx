import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "aniruddhsharma669@gmail.com";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const confirmSignOut = () => {
    Alert.alert("Sign out of PGFinders?", "You can sign back in at any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
            router.replace("/");
          } catch (error) {
            console.error("Sign out failed:", error);
            Alert.alert("Unable to sign out", "Please try again.");
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "PGFinders member";
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "No email address";

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 }}
      >
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="arrow-back" size={21} color="#0F172A" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-900">Settings</Text>
            <Text className="mt-1 text-sm text-slate-500">Manage your account and app information.</Text>
          </View>
        </View>

        <View className="mb-7 flex-row items-center rounded-3xl border border-slate-100 bg-white p-4">
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} className="h-14 w-14 rounded-full" />
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="person-outline" size={24} color="#2563EB" />
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-slate-900">{fullName}</Text>
            <Text numberOfLines={2} className="mt-1 text-sm text-slate-500">{email}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push("/(root)/(tabs)/profile")}
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-50"
          >
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        <SettingsSection title="Your account">
          <SettingsRow
            icon="person-circle-outline"
            title="Profile"
            description="View your account and profile photo"
            onPress={() => router.push("/(root)/(tabs)/profile")}
          />
          <SettingsRow
            icon="heart-outline"
            title="Saved places"
            description="Return to properties you bookmarked"
            onPress={() => router.push("/(root)/(tabs)/saved")}
          />
        </SettingsSection>

        <SettingsSection title="Help and support">
          <SettingsRow
            icon="mail-outline"
            title="Contact support"
            description={SUPPORT_EMAIL}
            onPress={() =>
              Linking.openURL(
                `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("PGFinders support")}`
              )
            }
          />
        </SettingsSection>

        <SettingsSection title="Privacy and legal">
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            description="How account and app information is handled"
            onPress={() => router.push("/privacy-policy")}
          />
          <SettingsRow
            icon="document-text-outline"
            title="Terms of Use"
            description="Rules for using PGFinders"
            onPress={() => router.push("/terms-of-use")}
          />
        </SettingsSection>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={confirmSignOut}
          disabled={signingOut}
          className="mt-2 flex-row items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-4"
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Ionicons name="log-out-outline" size={19} color="#DC2626" />
          )}
          <Text className="ml-2 text-base font-semibold text-red-600">
            {signingOut ? "Signing out…" : "Sign out"}
          </Text>
        </TouchableOpacity>

        <Text className="mt-6 text-center text-xs text-slate-400">PGFinders · Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-widest text-slate-500">{title}</Text>
      <View className="overflow-hidden rounded-2xl border border-slate-100 bg-white px-4">
        {children}
      </View>
    </View>
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
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center border-b border-slate-100 py-4 last:border-b-0"
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
        <Ionicons name={icon} size={20} color="#475569" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-slate-900">{title}</Text>
        <Text className="mt-1 text-xs leading-5 text-slate-500">{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
    </TouchableOpacity>
  );
}
