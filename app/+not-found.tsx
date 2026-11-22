import "@/global.css";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

export default function NotFoundScreen(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-primary-black">
      <View className="flex-1 justify-center items-center gap-4">
        <MaterialIcons
          name="report-gmailerrorred"
          size={80}
          color={COLORS.white}
        />

        <Text className="text-white text-xl font-bold text-center">
          This page does not exist
        </Text>

        <Link
          href="/"
          className="bg-primary-green p-4 rounded-lg w-2/3 items-center justify-center"
        >
          <Text className="text-white text-xl font-bold text-center">
            Go back Home
          </Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
