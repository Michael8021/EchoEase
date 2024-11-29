import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "../../constants";
import {
  getMoodByDate,
  getSpendingByMonth,
  getExpenseTypes,
  getRemindersByDate,
  getEventsByDate,
  client,
  appwriteConfig,
} from "../../lib/appwrite";
import { ExpenseItem } from "../../type";
import { BarChart } from "react-native-gifted-charts";

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
  { time: "08:00 AM", task: "Morning Jog", type: "" },
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
  return date.toLocaleDateString(undefined, options);
};
function formatScheduleTime(dateString: string): string {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${hours}:${formattedMinutes} ${ampm}`;
}

const Home = () => {
  const router = useRouter();
  const currentdate = new Date();
  const formatDate = getFormattedDate(currentdate);

  //schedule
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const fetchSchedules = async (current: Date) => {
    try {
      const reminders = await getRemindersByDate(current);
      const events = await getEventsByDate(current);
      const formattedReminders = reminders.map((schedule: any) => ({
        type: "reminder",
        time: schedule.due_date,
        task: schedule.title,
      }));

      // Format events
      const formattedEvents = events.map((event: any) => ({
        type: "event",
        time: event.start_time,
        task: event.title,
      }));

      const formattedSchedules = [...formattedReminders, ...formattedEvents];
      setScheduleData(formattedSchedules);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    }
  };

  //mood
  const [mooddata, setMooddata] = useState<any[]>([]);
  const fetchMoods = async (current: Date) => {
    try {
      const moods = await getMoodByDate(current);
      const formattedMoods = moods.map((mood: any) => ({
        mood_type: mood.mood_type,
        description: mood.description,
      }));
      setMooddata(formattedMoods);
    } catch (error) {
      console.error("Error fetching mooddata:", error);
    }
  };

  //spending
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [categorySpending, setCategorySpending] = useState<{
    [category: string]: number;
  }>({});
  const fetchSpending = async (current: Date) => {
    try {
      const spending = await getSpendingByMonth(currentdate);
      const totalAmount = spending.reduce((total: number, item: any) => {
        const amount = parseFloat(item.amount);
        if (!isNaN(amount)) {
          return total + amount;
        }
        return total;
      }, 0);

      setTotalSpent(totalAmount);
      const spendingByCategory = spending.reduce(
        (acc: { [category: string]: number }, item: any) => {
          const amount = parseFloat(item.amount);
          const category = item.category;

          if (!isNaN(amount)) {
            if (acc[category]) {
              acc[category] += amount;
            } else {
              acc[category] = amount;
            }
          }
          return acc;
        },
        {}
      );

      setCategorySpending(spendingByCategory);
    } catch (error) {
      console.error("Error fetching spending data:", error);
    }
  };

  //expense type
  const [expensedata, setExpensedata] = useState<ExpenseItem[]>([]);
  const fetchExpensesType = async () => {
    try {
      const expensesTypes = await getExpenseTypes();
      const formattedExpensesType = expensesTypes.map((expenseType: any) => ({
        id: expenseType.$id,
        category: expenseType.category,
        amount: expenseType.amount,
        color: expenseType.color,
      }));
      setExpensedata(formattedExpensesType);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const barData = expensedata.map((expense) => {
    const amount = categorySpending[expense.category] || 0;
    return {
      value: amount,
      label: expense.category,
      frontColor: expense.color || "#4ABFF4",
    };
  });

  useEffect(() => {
    fetchMoods(currentdate);
    fetchSpending(currentdate);
    fetchSchedules(currentdate);
    fetchExpensesType();

    // Subscribe to real-time updates for mood data
    const unsubscribeSchedules = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.scheduleCollectionId}.documents`,
      ],
      (response) => {
        const { events, payload } = response;
        if (events.some((event) => event.includes(".create"))) {
          fetchSchedules(currentdate);
        }
        if (events.some((event) => event.includes(".delete"))) {
          fetchSchedules(currentdate);
        }
      }
    );

    // Subscribe to real-time updates for mood data
    const unsubscribeMoods = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.moodCollectionId}.documents`,
      ],
      (response) => {
        const { events, payload } = response;
        if (events.some((event) => event.includes(".create"))) {
          fetchMoods(currentdate);
        }
        if (events.some((event) => event.includes(".delete"))) {
          fetchMoods(currentdate);
        }
      }
    );
    // Subscribe to real-time updates for spending data
    const unsubscribeSpending = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.spendingId}.documents`,
      ],
      (response) => {
        const { events, payload } = response;
        if (events.some((event) => event.includes(".create"))) {
          fetchSpending(currentdate);
        }
        if (events.some((event) => event.includes(".delete"))) {
          fetchSpending(currentdate);
        }
        if (events.some((event) => event.includes(".update"))) {
          fetchSpending(currentdate);
        }
      }
    );

    // Subscribe to real-time updates for expense types
    const unsubscribeExpenses = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.expense_typeId}.documents`,
      ],
      (response) => {
        const { events, payload } = response;

        if (events.some((event) => event.includes(".create"))) {
          fetchExpensesType();
        }
        if (events.some((event) => event.includes(".delete"))) {
          fetchExpensesType();
        }
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeSchedules();
      unsubscribeMoods();
      unsubscribeSpending();
      unsubscribeExpenses();
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-6 bg-black">
          <Text className="text-3xl font-semibold text-secondary">
            EchoEase
          </Text>
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

            {/* Check if scheduleData is null or empty */}
            {scheduleData && scheduleData.length > 0 ? (
              scheduleData.map((item: ScheduleItem, index: number) => (
                <View key={index} className="flex-row justify-between mb-2">
                  <Text className="text-gray-400 text-sm">
                    {formatScheduleTime(item.time)}
                  </Text>
                  <Text className="text-sm text-gray-300">{item.task}</Text>
                </View>
              ))
            ) : (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-400">No schedule for today.</Text>
              </View>
            )}
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
                    className="flex-row items-center justify-between"
                  >
                    {/* Mood type and emoji on the left */}
                    <Text className="text-white text-base">
                      {moodDetails?.emoji || "❓"} {mood.mood_type}
                    </Text>

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
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-400">
                  No mood data available for today.
                </Text>
              </View>
            )}
          </View>

          {/* Monthly Financial Data */}
          <View className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <Text className="text-lg font-bold text-yellow-400 mb-3">
              This Month's Financial Data
            </Text>
            <Text className="text-sm text-white mb-5">
              Total Spent:{" "}
              <Text className="text-yellow-500">${totalSpent.toFixed(2)}</Text>
            </Text>
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <BarChart
                showFractionalValues
                showYAxisIndices
                noOfSections={4}
                data={barData}
                isAnimated
                xAxisLabelTextStyle={{
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
                yAxisTextStyle={{
                  color: "#FFEE58",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              />
            </View>
          </View>

          <View className="flex-row justify-center mt-4">
            <Text className="text-sm text-gray-300">
              Track your spending and stay within your budget.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
