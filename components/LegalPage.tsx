import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type LegalSection = {
  heading: string;
  body: string;
};

type LegalPageProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export default function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Link href="/">
          <Text className="text-blue-600 font-semibold text-base mb-7">‹  Back to PGFinders</Text>
        </Link>

        <View className="rounded-3xl bg-white border border-gray-100 p-6 mb-6">
          <Text className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
            PGFinders · Legal
          </Text>
          <Text className="text-3xl font-extrabold text-gray-900 leading-9">{title}</Text>
          <Text className="text-sm text-gray-400 mt-3">Last updated: October 28, 2026</Text>
          <Text className="text-base text-gray-600 leading-7 mt-5">{intro}</Text>
        </View>

        {sections.map((section, index) => (
          <View key={section.heading} className="rounded-2xl bg-white border border-gray-100 p-5 mb-3">
            <Text className="text-base font-bold text-gray-900 mb-2">
              {index + 1}. {section.heading}
            </Text>
            <Text className="text-sm text-gray-600 leading-6">{section.body}</Text>
          </View>
        ))}

        <View className="px-1 pt-4">
          <Text className="text-sm text-gray-500 leading-6">
            Questions? Contact PGFinders support at aniruddhsharma669@gmail.com.
          </Text>
          <Link href="/">
            <Text className="text-blue-600 font-semibold mt-4">Return to the app</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
