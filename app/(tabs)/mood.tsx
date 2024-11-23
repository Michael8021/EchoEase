import { View, Text, TouchableOpacity, Image, Alert, Dimensions, StyleSheet, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { icons } from '../../constants'
import { Portal, Modal, TextInput, Provider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-gifted-charts";
import { createMood, getMoods, getCurrentUser, getHistory } from "../../lib/appwrite";

const styles = StyleSheet.create({
  androidSafeArea: {
    flex: 1,
    backgroundColor: "#161622",
    paddingTop: Platform.OS === "android" ? 35 : 0,
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
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [descriptionData, setDescriptionData] = useState([]);
  const [selectedDescription, setSelectedDescription] = useState<string>("");
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
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const data = labels.map((label, index) => {
        let moodValue = 0;
        let moodEmoji = "";
        if (moodMap2[fetchedMoods[index]!.mood_type]) {
          moodValue = moodMap2[fetchedMoods[index]!.mood_type].value || 0;
          moodEmoji = moodMap2[fetchedMoods[index]!.mood_type].emoji || "";
        }
        return {
          value: moodValue, label, labelTextStyle: { color: '#FF9C01' }, topLabelComponent: () => (
            <Text style={{ fontSize: 18, marginBottom: 6 }}>{moodEmoji}</Text>
          ),
        };
      });
      const data2 = labels.map((label, index) => {
        return {label, description: fetchedMoods[index]!.description}
      });
      setMoodData(data);
      setDescriptionData(data2);
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
      const mood_type = moodMap[selectedMood];
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
              showYAxisIndices
              hideRules
              backgroundColor={'#232533'}
              frontColor={'#FF9C01'}
              showGradient
              gradientColor={'#FFEEFE'}
              yAxisLabelTexts={["😶", "😭", "😢", "😐", "😊", "😁", ""]}
              maxValue={6}
              stepValue={1}
              stepHeight={50}
              data={moodData}
              autoShiftLabels
              isAnimated
              onPress={(item: any, index: any) => {
                const description = descriptionData.find((entry: any) => entry.label === item.label)?.description || "No description"
                setSelectedDescription(description);
                setChartModalVisible(true);
              }}
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
                label="Add a description (optional)"
                value={description}
                onChangeText={(text: string) => setDescription(text)}
                className="mb-5"
                maxLength={255}
                multiline={true}
              />

              {/* Save Button */}
              <TouchableOpacity
                className="bg-black p-2 rounded-lg items-center"
                onPress={saveMoodToDatabase}
              >
                <Text className="text-white text-lg">Save Mood</Text>
              </TouchableOpacity>
            </Modal>
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
              <Text className="text-lg font-psemibold mb-5">Mood Description</Text>
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
                    { selectedDescription }
                  </Text>
                </View>
              <TouchableOpacity
                className="bg-black p-2 rounded-lg items-center"
                onPress={() => setChartModalVisible(false)}
              >
                <Text className="text-white text-lg">Close</Text>
              </TouchableOpacity>
            </Modal>
          </Portal>
        </View>
      </Provider>
    </SafeAreaView>
  );
};

export default Mood;
