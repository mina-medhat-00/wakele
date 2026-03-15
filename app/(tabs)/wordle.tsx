import Keyboard from "@/components/wordle/Keyboard";
import "@/global.css";
import { Text, View } from "react-native";

export default function AboutScreen() {
  return (
    <View className="flex-1 bg-black justify-center items-center">
      <Text className="text-white">About screen</Text>
      <Keyboard />
    </View>
  );
}
