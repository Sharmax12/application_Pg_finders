import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";
import { useUserStore } from "../../../../store/userStore";

function AndroidTabs() {
  const isAdmin = useUserStore((state) => state.isAdmin);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#fff" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <SymbolView name="home" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <SymbolView name="search" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: isAdmin ? undefined : null,
          title: "Create Property",
          tabBarIcon: ({ color }) => (
            <SymbolView name="add_circle" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color }) => (
            <SymbolView name="favorite" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <SymbolView name="person" tintColor={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

function IosTabBar() {
  const isAdmin = useUserStore((state) => state.isAdmin);

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      {isAdmin && (
        <NativeTabs.Trigger name="create">
          <NativeTabs.Trigger.Label>Create Property</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add" />
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="heart.fill" md="favorite" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabsLayout() {
  return Platform.OS === "ios" ? <IosTabBar /> : <AndroidTabs />;
}
