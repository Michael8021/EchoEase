import { View, Text, TouchableOpacity, Image, Alert, Dimensions, StyleSheet, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { icons } from '../../constants'
import { Portal, Modal, TextInput, Provider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";
import { createMood, getMoods, getCurrentUser, getHistory } from "../../lib/appwrite";

const styles = StyleSheet.create({
  androidSafeArea: {
    flex: 1,
    backgroundColor: "#161622",
    paddingTop: Platform.OS === "android" ? 35 : 0,
  },
});

const moodMap: { [key: string]: { description: string, value: number } } = {
  "😭": { description: "Very Sad", value: 0 },
  "😢": { description: "Sad", value: 1 },
  "😐": { description: "Neutral", value: 2 },
  "😊": { description: "Happy", value: 3 },
  "😁": { description: "Very Happy", value: 4 },
};

const moodMap2: { [key: string]: number } = {
  "Very Sad": 0,
  "Sad": 1,
  "Neutral": 2,
  "Happy": 3,
  "Very Happy": 4,
};

async function getUserId() {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw Error;
  return currentUser;
};

async function getHistoryId() {
  const histories = await getHistory();
  if (!histories || histories.length === 0) {
    return null;
  }
  return histories;
};


const Mood = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [moodData, setMoodData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const router = useRouter()

  const fetchMoodData = async () => {
    const currentUser = await getUserId();
    setUserId(currentUser.$id);
    if (!currentUser) return;
    try {
      const fetchedMoods = await getMoods(currentUser.$id);
      const data = new Array(7).fill(0);
      fetchedMoods.forEach((mood: any, index) => {
        let moodValue = moodMap2[mood.mood_type];
        console.log("Mood Value: ", moodValue);
        if (moodValue === undefined) 
          moodValue = 0;
        data[index] = moodValue;
      });
      setMoodData(data);
    } catch (error) {
      console.error("Error fetching mood data:", error);
    }
  };

  useEffect(() => {
    fetchMoodData();
  }, []);

  const saveMoodToDatabase = async () => {
    if (selectedMood) {
      const datetime = new Date().toISOString();
      console.log(datetime);
      const mood_type = moodMap[selectedMood].description;
      const newMood = {
        userId: userId!,
        datetime: datetime,
        mood_type: mood_type,
        description: description,
        historyId: historyId
      }
      try {
        await createMood(newMood);
        Alert.alert("Success", "Mood saved successfully");
        fetchMoodData();
      } catch (error) {
        Alert.alert("Error", "Failed to save mood");
      }
      setModalVisible(false);
      setSelectedMood("");
      setDescription("");
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

  const screenWidth = Dimensions.get("window").width;

  const formatYLabel = (value: string) => {
    const index = parseInt(value, 10);
    return ["😭", "😢", "😐", "😊", "😁"][index];
  };
  console.log(moodData);

  return (
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
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            {/* Mood Chart */}
            <BarChart
              data={{
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                datasets: [
                  {
                    data: moodData,
                  },
                ],
              }}
              width={screenWidth - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: "#161622",
                backgroundGradientFrom: "#161622",
                backgroundGradientTo: "#161622",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 156, 1, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#ffa726",
                },
                barPercentage: 0.7,
                formatYLabel: formatYLabel,
              }}
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>

          {/* Button Box */}
          <View
            style={{
              backgroundColor: "#1F1F2E",
              padding: 16,
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            {/* Log Mood Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#4A90E2", // Light blue
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
              }}
              onPress={() => setModalVisible(true)}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name="edit" size={18} color="white" />
                <Text style={{ color: "white", marginLeft: 8, fontSize: 16 }}>
                  Log Mood
                </Text>
              </View>
            </TouchableOpacity>

            {/* View Insights Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#B27CD0", // Light purple
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
              }}
              onPress={() => Alert.alert("Insights", "View insights pressed")}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name="insights" size={18} color="white" />
                <Text style={{ color: "white", marginLeft: 8, fontSize: 16 }}>
                  View Insights
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Mood Logging Modal */}
          <Portal>
            <Modal
              visible={modalVisible}
              onDismiss={() => setModalVisible(false)}
              contentContainerStyle={{
                backgroundColor: "white",
                padding: 20,
                marginHorizontal: 20,
                borderRadius: 10,
              }}
            >
              <Text className="text-lg font-psemibold mb-5">Record Mood</Text>

              {/* Emoji Selection Row */}
              <View className="flex-row justify-around my-5">
                {["😭", "😢", "😐", "😊", "😁"].map((emoji) =>
                  renderMoodButton(emoji)
                )}
              </View>

              {/* Optional description Input */}
              <TextInput
                label="Add a note (optional)"
                value={description}
                onChangeText={(text) => setDescription(text)}
                className="mb-5"
              />

              {/* Save Button */}
              <TouchableOpacity
                className="bg-black p-2 rounded-lg items-center"
                onPress={saveMoodToDatabase}
              >
                <Text className="text-white text-lg">Save Mood</Text>
              </TouchableOpacity>
            </Modal>
          </Portal>
        </View>
      </Provider>
    </SafeAreaView>
  );
};

export default Mood;
