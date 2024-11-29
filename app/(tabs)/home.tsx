import React from "react";
import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "../../constants";

interface ScheduleItem {
  time: string;
  task: string;
}

// Mock data
const mockSchedule = [
  { time: "08:00 AM", task: "Morning Jog" },
  { time: "10:00 AM", task: "Team Meeting" },
  { time: "02:00 PM", task: "Doctor Appointment" },
  { time: "05:00 PM", task: "Grocery Shopping" },
];

const Home: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-6 bg-black">
        <Text className="text-3xl font-semibold text-yellow-500">EchoEase</Text>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Image source={icons.settings} className="w-7 h-7" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 px-4">
        {/* Today's Schedule */}
        <View className="bg-gray-800 rounded-lg p-4 mb-4 shadow-lg">
          <Text className="text-lg font-bold text-yellow-400 mb-3">
            Today's Schedule
          </Text>
          <FlatList
            data={mockSchedule}
            // keyExtractor={(item, index) => `${index}`} // No need for any type casting here
            renderItem={({ item }: { item: ScheduleItem }) => (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-white">{item.time}</Text>
                <Text className="text-sm text-gray-300">{item.task}</Text>
              </View>
            )}
          />
        </View>

        {/* Today's Mood */}
        <View className="bg-gray-700 rounded-lg p-4 mb-4 shadow-lg">
          <Text className="text-lg font-bold text-yellow-400 mb-2">
            Today's Mood
          </Text>
          <Text className="text-white text-base">🙂 Feeling Productive</Text>
        </View>

        {/* Monthly Financial Data */}
        <View className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <Text className="text-lg font-bold text-yellow-400 mb-3">
            This Month's Financial Data
          </Text>
          <Text className="text-sm text-white">
            Total Spent: <Text className="text-yellow-500">$1200</Text>
          </Text>
          <Text className="text-sm text-white mt-1">
            Total Income: <Text className="text-yellow-500">$3000</Text>
          </Text>
          <View className="h-24 bg-gray-600 rounded-lg mt-4 flex items-center justify-center">
            <Text className="text-white text-sm">Chart Placeholder</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Home;
