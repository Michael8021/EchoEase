import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "../../constants";
import { getMoodByDate, client, appwriteConfig } from "../../lib/appwrite";

interface ScheduleItem {
  time: string;
  task: string;
}

const moodMap: { [key: string]: { value: number; emoji: string } } = {
  "Very Sad": { value: 1, emoji: "😭" },
  Sad: { value: 2, emoji: "😢" },
  Neutral: { value: 3, emoji: "😐" },
  Happy: { value: 4, emoji: "😊" },
  "Very Happy": { value: 5, emoji: "😁" },
};

// Mock data
const mockSchedule = [
  { time: "08:00 AM", task: "Morning Jog" },
  { time: "10:00 AM", task: "Team Meeting" },
  { time: "02:00 PM", task: "Doctor Appointment" },
  { time: "05:00 PM", task: "Grocery Shopping" },
];

const getFormattedDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString(undefined, options); // Use system locale
};
const formatTime = (datetime: string) => {
  const date = new Date(datetime);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

const Home = () => {
  const router = useRouter();
  const currentdate = new Date();
  const formatDate = getFormattedDate(currentdate);

  const [mooddata, setMooddata] = useState<any[]>([]);
  const fetchMMoods = async (currentDate: Date) => {
    try {
      const moods = await getMoodByDate(currentDate);
      const formattedMoods = moods.map((mood: any) => ({
        mood_type: mood.mood_type,
        description: mood.description,
        datetime: mood.datetime,
      }));
      setMooddata(formattedMoods);
    } catch (error) {
      console.error("Error fetching mooddata:", error);
    }
  };

  useEffect(() => {
    fetchMMoods(currentdate);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-6 bg-black">
        <Text className="text-3xl font-semibold text-secondary">EchoEase</Text>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Image source={icons.settings} className="w-7 h-7" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 px-4">
        {/* Display today's date */}
        <View className="bg-gray-800 rounded-lg p-3 mb-4 shadow-lg">
          <Text className="text-base text-yellow-400 font-semibold text-center">
            {formatDate}
          </Text>
        </View>

        {/* Today's Schedule */}
        <View className="bg-gray-800 rounded-lg p-4 mb-4 shadow-lg">
          <Text className="text-lg font-bold text-yellow-400 mb-3">
            Today's Schedule
          </Text>
          <FlatList
            data={mockSchedule}
            keyExtractor={(item: any, index: any) => `${index}`}
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
          {mooddata.length > 0 ? (
            mooddata.map((mood, index) => {
              const moodDetails = moodMap[mood.mood_type]; // Fetch mood details from moodMap
              return (
                <View
                  key={index}
                  className="flex-row items-center justify-between border-b border-gray-500 pb-2 mb-2"
                >
                  {/* Time on the left */}
                  <Text className="text-gray-400 text-sm">
                    {formatTime(mood.datetime)}
                  </Text>

                  {/* Mood type and emoji on the left */}
                  <View className="flex-row items-center ml-2">
                    <Text className="text-white text-base">
                      {moodDetails?.emoji || "❓"} {mood.mood_type}
                    </Text>
                  </View>

                  {/* Description at the end, aligned to the right */}
                  <View className="ml-2 flex-1 items-end">
                    <Text className="text-gray-300 text-sm">
                      {mood.description}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-gray-400">
              No mood data available for today.
            </Text>
          )}
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
