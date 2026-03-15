import "@/global.css";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 justify-center items-center gap-4">
        <MaterialIcons name="report-gmailerrorred" size={80} color="white" />
        <Text className="text-white text-2xl font-bold">Page not found</Text>
        <Link href="/" className="bg-white p-4 rounded-lg w-full">
          <Text className="text-black text-lg font-bold">Go back Home</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
