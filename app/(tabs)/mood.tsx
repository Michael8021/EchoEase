import { View, Text, TouchableOpacity, Image, Alert, Dimensions, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { icons } from '../../constants'
import { Portal, Modal, TextInput, Provider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-gifted-charts";
import { createMood, getMoods, getCurrentUser, createMoodInsight, getMoodInsight } from "../../lib/appwrite";
import { useMoodContext } from '../../context/MoodContext';
import { genMoodInsight } from '../../lib/aiService';
import DateTimePicker from '@react-native-community/datetimepicker';
const styles = StyleSheet.create({
  androidSafeArea: {
    flex: 1,
    backgroundColor: "#161622",
    paddingTop: 0,
  },
  weekSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1F1F2E',
  },
  weekText: {
    color: '#FF9C01',
    fontSize: 16,
  },
});

const moodMap: { [key: string]: string } = {
  "😭": "Very Sad",
  "😢": "Sad",
  "😐": "Neutral",
  "😊": "Happy",
  "😁": "Very Happy",
};

const moodMap2: { [key: string]: { value: number, emoji: string } } = {
  "Very Sad": { value: 1, emoji: "😭" },
  "Sad": { value: 2, emoji: "😢" },
  "Neutral": { value: 3, emoji: "😐" },
  "Happy": { value: 4, emoji: "😊" },
  "Very Happy": { value: 5, emoji: "😁" },
};

async function getUserId() {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw Error;
  return currentUser;
};

const Mood = () => {
  const [initialLoad, setInitialLoad] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [insightModalVisible, setInsightModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [descriptionData, setDescriptionData] = useState<{ label: string; description: string }[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedDescription, setSelectedDescription] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [moodData, setMoodData] = useState<{ value: number; label: string; labelTextStyle: { color: string; }; topLabelComponent: () => JSX.Element; }[]>([]);
  const [moodTypes, setMoodType] = useState<string[]>(Array(7).fill("No Data"));
  const [todayMood, setTodayMood] = useState("");
  const [moodInsight, setmoodInsight] = useState<string>("");
  const router = useRouter()
  const { refreshMoods } = useMoodContext();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoregenerate, setAutoregenerate] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchMoodData = async (weekStart: Date) => {
    setLoading(true);
    const currentUser = await getUserId();
    setUserId(currentUser.$id);
    if (!currentUser) return;
    try {
      const fetchedMoods = await getMoods(currentUser.$id, weekStart);
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const days = new Date().getDay();
      const moodTypes = Array(currentWeek < new Date() ? 7 : days).fill("No Data");
      const data = labels.map((label, index) => {
        let moodValue = 0;
        let moodEmoji = "";
        let moodType = "No Data";
        if (moodMap2[fetchedMoods[index]!.mood_type]) {
          moodValue = moodMap2[fetchedMoods[index]!.mood_type].value || 0;
          moodEmoji = moodMap2[fetchedMoods[index]!.mood_type].emoji || "";
          moodType = fetchedMoods[index]!.mood_type;
        }
        if (index < (weekStart < new Date() ? 7 : days)) {
          moodTypes[index] = moodType;
        }
        if (new Date(fetchedMoods[index]!.datetime).toLocaleDateString().slice(0, 10) == new Date().toLocaleDateString().slice(0, 10)) {
          setTodayMood(moodEmoji + " " + fetchedMoods[index]!.mood_type);
        }
        return {
          value: moodValue, label, labelTextStyle: { color: '#FF9C01' }, topLabelComponent: () => (
            <Text style={{ fontSize: 18, marginBottom: 6 }}>{moodEmoji}</Text>
          ),
        };
      });
      const data2 = labels.map((label, index) => {
        return { label, description: fetchedMoods[index]!.description }
      });
      setMoodData(data);
      setMoodType(moodTypes);
      setDescriptionData(data2);
    } catch (error) {
      console.error("Error fetching mood data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInsights = async (weekStart: Date) => {
    try {
      setInsightModalVisible(true)
      if (weekStart > new Date()) {
        return;
      }
      const fetchMoodInsight = await getMoodInsight(userId!, weekStart);
      if (fetchMoodInsight.documents.length > 0) {
        setmoodInsight(fetchMoodInsight.documents[0].mood_insight);
        return;
      }
      const descriptions = descriptionData.map(desc => desc.description);
      const moodInsightResult = await genMoodInsight(moodTypes, descriptions);
      setmoodInsight(moodInsightResult);

      const datetime = new Date().toISOString();
      const newMoodInsight = {
        userId: userId!,
        datetime: datetime,
        mood_insight: moodInsightResult
      }

      await createMoodInsight(newMoodInsight, weekStart);
    } catch (error) {
      console.error("Error fetching mood insights:", error);
      Alert.alert("Error", "Failed to fetch mood insights");
    }
  };

  const regenerateInsight = async (weekStart: Date) => {
    try {
      if (weekStart > new Date()) {
        return;
      }
      setIsLoading(true);
      const descriptions = descriptionData.map(desc => desc.description);
      const moodInsightResult = await genMoodInsight(moodTypes, descriptions);
      setmoodInsight(moodInsightResult);

      const newMoodInsight = {
        userId: userId!,
        datetime: weekStart.toISOString(),
        mood_insight: moodInsightResult
      }

      await createMoodInsight(newMoodInsight, weekStart);

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching mood insights:", error);
      Alert.alert("Error", "Failed to fetch mood insights");
    }
  };

  const handlePreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
    fetchMoodData(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
    fetchMoodData(newWeek);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || currentWeek;
    setShowDatePicker(false);
    setCurrentWeek(currentDate);
    fetchMoodData(currentDate);
  };

  useEffect(() => {
    fetchMoodData(currentWeek);
    if (!initialLoad) {
      setAutoregenerate(true);
    }
    else {
      setInitialLoad(false);
    }
  }, [refreshMoods]);

  if (autoregenerate) {
    regenerateInsight(currentWeek);
    setAutoregenerate(false);
  }

  const saveMoodToDatabase = async () => {
    if (selectedMood) {
      const datetime = new Date().toISOString();
      const mood_type = moodMap[selectedMood];
      const newMood = {
        userId: userId!,
        datetime: datetime,
        mood_type: mood_type,
        description: description,
        historyId: null
      }
      try {
        await createMood(newMood);
        Alert.alert("Success", "Mood saved successfully");
        fetchMoodData(currentWeek);
      } catch (error) {
        Alert.alert("Error", "Failed to save mood");
      }
      setLogModalVisible(false);
      setSelectedMood("");
      setDescription("");
      regenerateInsight(currentWeek);
    } else {
      Alert.alert("Error", "Please select a mood");
    }
  };

  const renderMoodButton = (emoji: string) => (
    <TouchableOpacity
      key={emoji}
      onPress={() => setSelectedMood(emoji)}
      className={`p-2 ${selectedMood === emoji ? "border-2 border-secondary rounded-full" : ""
        }`}
    >
      <Text className="text-2xl">{emoji}</Text>
    </TouchableOpacity>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMoodData(currentWeek).then(() => setRefreshing(false));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.androidSafeArea}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <SafeAreaView style={styles.androidSafeArea}>
        <Provider>
          <View className="flex-row justify-between items-center px-4 py-6 bg-primary">
            {/* Header */}
            <Text className="text-3xl font-psemibold text-secondary">
              Mood Tracking
            </Text>

            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Image
                source={icons.settings}
                className="w-7 h-7"
              />
            </TouchableOpacity>
          </View>
          <View>
            <View
              style={{
                backgroundColor: "#1F1F2E",
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#FF9C01",
              }}
            >
              <Text className="text-1xl font-psemibold text-secondary">Today's Mood:</Text>
              <Text className="text-1xl font-psemibold text-secondary">{todayMood}</Text>
            </View>
            <View
              style={{
                backgroundColor: "#1F1F2E",
                flexDirection: "row",
                justifyContent: "space-around",
                paddingLeft: 28,
              }}
            >
              <BarChart
                adjustToWidth
                parentWidth={Dimensions.get('window').width}
                initialSpacing={10}
                yAxisThickness={0}
                xAxisThickness={0}
                backgroundColor={'#1F1F2E'}
                frontColor={'#FF9C01'}
                yAxisLabelTexts={["😶", "😭", "😢", "😐", "😊", "😁", ""]}
                barBorderRadius={4}
                noOfSections={6}
                stepValue={1}
                stepHeight={50}
                data={loading ? [{value: 0, label: "Mon", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Tue", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Wed", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Thu", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Fri", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Sat", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Sun", labelTextStyle: { color: '#FF9C01' }},
                ] : moodData}
                hideRules
                isAnimated
                onPress={(item: any, index: any) => {
                  const description = descriptionData.find((entry: any) => entry.label === item.label)?.description || "No description"
                  setSelectedDay(item.label);
                  setSelectedDescription(description);
                  setChartModalVisible(true);
                }}
              />
            </View>
            <View style={styles.weekSwitcher}>
            <TouchableOpacity onPress={handlePreviousWeek}>
              <MaterialIcons name="arrow-back" size={24} color="#FF9C01" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={styles.weekText}>
                {currentWeek.toLocaleDateString()} - {new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextWeek}>
              <MaterialIcons name="arrow-forward" size={24} color="#FF9C01" />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={currentWeek}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
            <View
              style={{
                backgroundColor: "#1F1F2E",
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-around",
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#4A90E2",
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                }}
                onPress={() => setLogModalVisible(true)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name="edit" size={18} color="white" />
                  <Text style={{ color: "white", marginLeft: 8, fontSize: 16 }}>
                    Log Mood
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#B27CD0",
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                }}
                onPress={() => handleViewInsights(currentWeek)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name="insights" size={18} color="white" />
                  <Text style={{ color: "white", marginLeft: 8, fontSize: 16 }}>
                    View Insights
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <Portal>
              <Modal
                visible={chartModalVisible}
                onDismiss={() => setChartModalVisible(false)}
                contentContainerStyle={{
                  backgroundColor: "white",
                  padding: 20,
                  marginHorizontal: 20,
                  borderRadius: 10,
                }}
              >
                <Text className="text-lg font-psemibold mb-5">Mood Description on {selectedDay}</Text>
                <View
                  style={{
                    backgroundColor: "#f0f0f0",
                    padding: 15,
                    borderRadius: 10,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#333",
                      textAlign: "center",
                    }}
                  >
                    {selectedDescription}
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-black p-2 rounded-lg items-center"
                  onPress={() => setChartModalVisible(false)}
                >
                  <Text className="text-white text-lg">Close</Text>
                </TouchableOpacity>
              </Modal>
              <Modal
                visible={logModalVisible}
                onDismiss={() => setLogModalVisible(false)}
                contentContainerStyle={{
                  backgroundColor: "white",
                  padding: 20,
                  marginHorizontal: 20,
                  borderRadius: 10,
                }}
              >
                <Text className="text-lg font-psemibold mb-5">Record Mood</Text>
                <View className="flex-row justify-around my-5">
                  {["😭", "😢", "😐", "😊", "😁"].map((emoji) =>
                    renderMoodButton(emoji)
                  )}
                </View>
                <TextInput
                  label="Add a description (optional)"
                  value={description}
                  onChangeText={(text: string) => setDescription(text)}
                  className="mb-5"
                  maxLength={255}
                  multiline={true}
                />
                <TouchableOpacity
                  className="bg-black p-2 rounded-lg items-center"
                  onPress={saveMoodToDatabase}
                >
                  <Text className="text-white text-lg">Save Mood</Text>
                </TouchableOpacity>
              </Modal>
              <Modal
                visible={insightModalVisible}
                onDismiss={() => setInsightModalVisible(false)}
                contentContainerStyle={{
                  backgroundColor: "white",
                  padding: 20,
                  marginHorizontal: 20,
                  borderRadius: 10,
                }}
              >
                <View
                  style={{
                    padding: 16,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}>
                  <Text className="text-lg font-psemibold mb-5">Mood Insight</Text>
                  <TouchableOpacity onPress={() => regenerateInsight(currentWeek)}>
                    <MaterialIcons name="refresh" size={22} />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    backgroundColor: "#f0f0f0",
                    padding: 15,
                    borderRadius: 10,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#333",
                      textAlign: "center",
                    }}
                  >
                    {isLoading ? "Loading..." : moodInsight}
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-black p-2 rounded-lg items-center"
                  onPress={() => setInsightModalVisible(false)}
                >
                  <Text className="text-white text-lg">Close</Text>
                </TouchableOpacity>
              </Modal>
            </Portal>
          </View>
        </Provider>
      </SafeAreaView >
    </ScrollView >
  );
};

export default Mood;