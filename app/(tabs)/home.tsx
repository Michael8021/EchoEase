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
  getSchedulesByDate,
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
const formatTime = (datetime: string): string => {
  const date = new Date(datetime);
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

const Home = () => {
  const router = useRouter();
  const currentdate = new Date();
  const formatDate = getFormattedDate(currentdate);

  //schedule
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);

  const fetchSchedules = async (current: Date) => {
    try {
      const schedules = await getSchedulesByDate(current);
      const formattedSchedules = schedules.map((schedule: any) => ({
        time: schedule.start_time,
        task: schedule.title,
      }));
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
        datetime: mood.datetime,
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
    const unsubscribeMoods = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.moodCollectionId}.documents`,
      ],
      (response) => {
        const { events, payload } = response;
        const mood = payload as any;

        if (events.some((event) => event.includes(".create"))) {
          const newMood = {
            mood_type: mood.mood_type,
            description: mood.description,
            datetime: mood.datetime,
          };
          setMooddata((prevData) => [...prevData, newMood]);
        }

        if (events.some((event) => event.includes(".delete"))) {
          setMooddata((prevData) =>
            prevData.filter(
              (existingMood) => existingMood.datetime !== mood.datetime
            )
          );
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
        const spending = payload as any;

        if (events.some((event) => event.includes(".create"))) {
          const newSpendingAmount = parseFloat(spending.amount);
          const newSpendingCategory = spending.category;

          // If the amount is valid, update total and category spending
          if (!isNaN(newSpendingAmount)) {
            // Update totalSpent
            setTotalSpent((prevTotal) => prevTotal + newSpendingAmount);

            // Update categorySpending
            setCategorySpending((prevCategorySpending) => {
              const updatedCategorySpending = { ...prevCategorySpending };
              updatedCategorySpending[newSpendingCategory] =
                (updatedCategorySpending[newSpendingCategory] || 0) +
                newSpendingAmount;
              return updatedCategorySpending;
            });
          }
        }

        if (events.some((event) => event.includes(".delete"))) {
          const deletedSpendingAmount = parseFloat(spending.amount);
          const deletedSpendingCategory = spending.category;

          // If the amount is valid, update total and category spending
          if (!isNaN(deletedSpendingAmount)) {
            // Update totalSpent
            setTotalSpent((prevTotal) => prevTotal - deletedSpendingAmount);

            // Update categorySpending
            setCategorySpending((prevCategorySpending) => {
              const updatedCategorySpending = { ...prevCategorySpending };
              updatedCategorySpending[deletedSpendingCategory] =
                (updatedCategorySpending[deletedSpendingCategory] || 0) -
                deletedSpendingAmount;

              // Remove the category if its spending amount becomes 0
              if (updatedCategorySpending[deletedSpendingCategory] <= 0) {
                delete updatedCategorySpending[deletedSpendingCategory];
              }

              return updatedCategorySpending;
            });
          }
        }

        if (events.some((event) => event.includes(".update"))) {
          const updatedSpendingAmount = parseFloat(spending.amount);
          const updatedSpendingCategory = spending.category;
          const oldSpendingAmount = parseFloat(spending.oldAmount); // Assuming oldAmount is available

          // If the amount is valid and the spending category exists, update total and category spending
          if (!isNaN(updatedSpendingAmount)) {
            setTotalSpent((prevTotal) => {
              // Calculate the updated total by subtracting old amount and adding the new one
              const newTotal =
                prevTotal - oldSpendingAmount + updatedSpendingAmount;
              return newTotal;
            });

            // Update categorySpending
            setCategorySpending((prevCategorySpending) => {
              const updatedCategorySpending = { ...prevCategorySpending };

              // Subtract the old amount for the category
              updatedCategorySpending[updatedSpendingCategory] =
                (updatedCategorySpending[updatedSpendingCategory] || 0) -
                oldSpendingAmount;

              // Add the new amount for the category
              updatedCategorySpending[updatedSpendingCategory] =
                (updatedCategorySpending[updatedSpendingCategory] || 0) +
                updatedSpendingAmount;

              // If the spending for the category becomes zero, remove it
              if (updatedCategorySpending[updatedSpendingCategory] <= 0) {
                delete updatedCategorySpending[updatedSpendingCategory];
              }

              return updatedCategorySpending;
            });
          }
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
        const expense = payload as any;

        if (events.some((event) => event.includes(".create"))) {
          const newExpense = {
            id: expense.$id,
            category: expense.category,
            amount: expense.amount,
            color: expense.color,
          };
          setExpensedata((prevData) => [...prevData, newExpense]);
        }

        if (events.some((event) => event.includes(".delete"))) {
          setExpensedata((prevData) =>
            prevData.filter(
              (existingExpense) => existingExpense.category !== expense.category
            )
          );
        }
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeMoods();
      unsubscribeSpending();
      unsubscribeExpenses();
    };
  }, []);

  useEffect(() => {
    console.log(scheduleData);
  }, [scheduleData]);

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
            {mockSchedule && mockSchedule.length > 0 ? (
              mockSchedule.map((item: ScheduleItem, index: number) => (
                <View key={index} className="flex-row justify-between mb-2">
                  <Text className="text-gray-400 text-sm">{item.time}</Text>
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
