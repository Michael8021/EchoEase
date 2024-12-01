import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Alert,
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
  createMood,
  getCurrentUser,
} from "../../lib/appwrite";
import { ExpenseItem } from "../../type";
import { BarChart } from "react-native-gifted-charts";
import { useMoodContext } from '../../context/MoodContext';

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
    weekday: "short",
    year: "numeric",
    month: "short",
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
  const [userId, setUserId] = useState<string | null>(null);
  const { refreshMoods } = useMoodContext();

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
      const sortedSchedules = formattedSchedules.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeA - timeB;
      });
      setScheduleData(sortedSchedules);
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
          const category = item.category.category;
          // console.log('Processing item:', { category, amount, raw: item });

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

      // console.log('Final categorySpending:', spendingByCategory);
      // console.log('Number of categories:', Object.keys(spendingByCategory).length);
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

  const saveMoodToDatabase = async (moodType: string) => {
    if (!userId) {
      Alert.alert("Error", "Please log in first");
      return;
    }
    
    const datetime = new Date().toISOString();
    const newMood = {
      userId: userId,
      datetime: datetime,
      mood_type: moodType,
      description: "Quick mood set from home screen",
      historyId: null
    };
    
    try {
      await createMood(newMood);
      fetchMoods(currentdate);
      refreshMoods(); // Trigger refresh in mood.tsx
    } catch (error) {
      Alert.alert("Error", "Failed to save mood");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUserId(currentUser.$id);
        }
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    };
    init();
    
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
        const { events } = response;
        if (events.some((event) => [".create", ".delete", ".update"].some((type) => event.includes(type)))) {
          fetchMoods(currentdate);
        }
      }
    );
    // Subscribe to real-time updates for spending data
    const unsubscribeSpending = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.spendingCollectionId}.documents`,
      ],
      (response) => {
        const { events } = response;
        if (events.some((event) => [".create", ".delete", ".update"].some((type) => event.includes(type)))) {
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
        const { events } = response;
        if (events.some((event) => [".create", ".delete", ".update"].some((type) => event.includes(type)))) {
          fetchExpensesType();
          fetchSpending(currentdate);
        }
      }
    );

    // Subscribe to real-time updates for schedule data
    const unsubscribeSchedules = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.scheduleCollectionId}.documents`,
      ],
      (response) => {
        const { events } = response;
        if (events.some((event) => [".create", ".delete", ".update"].some((type) => event.includes(type)))) {
          fetchSchedules(currentdate);
        }
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeMoods();
      unsubscribeSpending();
      unsubscribeExpenses();
      unsubscribeSchedules();
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-primary"
    edges={['top', 'left', 'right']}
    >
      {/* Fixed Header */}
      <View className="bg-primary px-6 pt-2 pb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-4xl font-pbold text-secondary">
            EchoEase
          </Text>
          <TouchableOpacity 
            onPress={() => router.push("/settings")}
            className="bg-black-100/50 p-2 rounded-full border border-gray-100/10"
          >
            <Image source={icons.settings} className="w-6 h-6 opacity-85" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 20
        }}
      >
        <View className="flex-1 px-6">
          {/* Display today's date */}
          <View className="mb-8">
            <Text className="text-3xl font-pbold text-component-schedule-accent text-center mb-2">
              {formatDate}
            </Text>
            <View className="flex-row items-center justify-center">
              <View className="w-1 h-1 rounded-full bg-component-schedule-text/20 mx-2" />
              <Text className="text-sm font-plight text-component-schedule-text/60">
                Your daily overview
              </Text>
              <View className="w-1 h-1 rounded-full bg-component-schedule-text/20 mx-2" />
            </View>
          </View>

          {/* Today's Schedule */}
          <View 
            style={{
              backgroundColor: 'rgba(45, 36, 59, 0.15)',
              borderColor: 'rgba(157, 138, 176, 0.2)',
            }}
            className="rounded-2xl p-5 mb-6 shadow-lg border"
          >
            <View className="flex-row items-center mb-4">
              <View className="w-1 h-6 bg-component-schedule-accent rounded-full mr-3" />
              <Text className="text-xl font-psemibold text-component-schedule-text">
                Today's Schedule
              </Text>
            </View>

            {scheduleData && scheduleData.length > 0 ? (
              scheduleData.map((item: ScheduleItem, index: number) => (
                <View key={index} className="flex-row justify-between items-center mb-3 last:mb-0 bg-black-400/30 rounded-xl p-3 border border-component-schedule-accent/10">
                  <Text className="text-component-schedule-text text-sm font-pmedium">
                    {formatScheduleTime(item.time)}
                  </Text>
                  <Text className="text-sm text-component-schedule-text/85 font-pregular flex-1 text-right ml-4">{item.task}</Text>
                </View>
              ))
            ) : (
              <View className="flex-row justify-center items-center py-6 bg-black-400/30 rounded-xl border border-component-schedule-accent/10">
                <Text className="text-component-schedule-text/70 font-plight text-base">No schedule for today</Text>
              </View>
            )}
          </View>

          {/* Today's Mood */}
          <View 
            style={{
              backgroundColor: 'rgba(36, 59, 45, 0.15)',
              borderColor: 'rgba(138, 176, 157, 0.2)',
            }}
            className="rounded-2xl p-5 mb-6 shadow-lg border"
          >
            <View className="flex-row items-center mb-4">
              <View className="w-1 h-6 bg-component-mood-accent rounded-full mr-3" />
              <Text className="text-xl font-psemibold text-component-mood-text">
                Today's Mood
              </Text>
            </View>

            {mooddata.length > 0 ? (
              mooddata.map((mood, index) => {
                const moodDetails = moodMap[mood.mood_type];
                return (
                  <View
                    key={index}
                    className="flex-row items-center justify-between bg-black-400/30 rounded-xl p-3 mb-3 last:mb-0 border border-component-mood-accent/10"
                  >
                    <Text className="text-component-mood-text text-base font-pmedium">
                      {moodDetails?.emoji || "❓"} {mood.mood_type}
                    </Text>
                    <View className="ml-4 flex-1 items-end">
                      <Text className="text-component-mood-text/85 text-sm font-plight">
                        {mood.description}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="flex-1">
                <View className="justify-center items-center py-4 bg-black-400/30 rounded-xl mb-4">
                  <Text className="text-component-mood-text/70 font-plight mb-2">
                    How are you feeling today?
                  </Text>
                </View>
                <View className="flex-row justify-around bg-black-400/30 rounded-xl p-4">
                  {Object.entries(moodMap).map(([moodType, details]) => (
                    <TouchableOpacity
                      key={moodType}
                      onPress={() => saveMoodToDatabase(moodType)}
                      className="items-center"
                    >
                      <Text className="text-2xl mb-1">{details.emoji}</Text>
                      <Text className="text-component-mood-text/70 text-xs font-plight">
                        {moodType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Monthly Financial Data */}
          <View 
            style={{
              backgroundColor: 'rgba(36, 59, 59, 0.15)',
              borderColor: 'rgba(138, 157, 176, 0.2)',
            }}
            className="rounded-2xl p-5 shadow-lg border"
          >
            <View className="flex-row items-center mb-6">
              <View className="w-1 h-6 bg-component-finance-accent rounded-full mr-3" />
              <Text className="text-xl font-psemibold text-component-finance-text">
                This Month's Financial Data
              </Text>
            </View>
            
            {/* Financial Overview Cards */}
            <View className="flex-row justify-between mb-6">
              <View className="flex-1 bg-black-400/30 rounded-xl p-4 mr-2 border border-component-finance-accent/10">
                <Text className="text-sm text-component-finance-text/85 font-pmedium mb-1">
                  Total Spent
                </Text>
                <Text className="text-2xl font-pbold text-component-finance-text">
                  ${totalSpent.toFixed(2)}
                </Text>
              </View>
              <View className="flex-1 bg-black-400/30 rounded-xl p-4 ml-2 border border-component-finance-accent/10">
                <Text className="text-sm text-component-finance-text/85 font-pmedium mb-1">
                  Categories
                </Text>
                <Text className="text-2xl font-pbold text-component-finance-text">
                  {Object.keys(categorySpending).length}
                </Text>
              </View>
            </View>

            {/* Category Breakdown */}
            <View className="bg-black-400/30 rounded-xl p-4 border border-component-finance-accent/10">
              <Text className="text-sm text-component-finance-text/85 font-pmedium mb-4">
                Spending by Category
              </Text>
              <View className="flex-1 justify-center items-center">
                <BarChart
                  showFractionalValues
                  showYAxisIndices
                  noOfSections={4}
                  data={barData}
                  isAnimated
                  width={280}
                  barBorderRadius={4}
                  spacing={40}
                  xAxisLabelTextStyle={{
                    color: "#A5CCCC",
                    fontSize: 11,
                    fontFamily: "Poppins-Medium",
                    rotation: 45
                  }}
                  yAxisTextStyle={{
                    color: "#A5CCCC",
                    fontSize: 11,
                    fontFamily: "Poppins-Medium"
                  }}
                  dashWidth={0}
                  yAxisIndicesColor="rgba(165, 204, 204, 0.1)"
                  yAxisThickness={0}
                  xAxisThickness={0}
                />
              </View>
            </View>
          </View>

          <View className="flex-row justify-center mt-6 mb-8">
            <Text className="text-sm text-gray-200 font-plight">
              Track your spending and stay within your budget.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
