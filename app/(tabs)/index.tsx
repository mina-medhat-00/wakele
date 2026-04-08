import "@/global.css";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-primary-black">
      <View className="flex-1 items-center justify-center">
        <Text className="text-3xl font-bold text-white">Home</Text>
      </View>
    </SafeAreaView>
  );
}
