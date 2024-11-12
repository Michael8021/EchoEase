import { View, Text, TouchableOpacity, Alert, Dimensions } from "react-native";
import React, { useState, useEffect } from "react";
import { Portal, Modal, TextInput, Provider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";
import { addMood, getMoodsForWeek } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

const moodMap: { [key: string]: { description: string, value: number } } = {
  "😭": { description: "Very Sad", value: 0 },
  "😢": { description: "Sad", value: 1 },
  "😐": { description: "Neutral", value: 2 },
  "😊": { description: "Happy", value: 3 },
  "😁": { description: "Very Happy", value: 4 },
};

const descriptionToValueMap: { [key: string]: number } = Object.keys(moodMap).reduce((acc, key) => {
  acc[moodMap[key].description] = moodMap[key].value;
  return acc;
}, {} as { [key: string]: number });

const Mood = () => {
  const { user } = useGlobalContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [moodData, setMoodData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [moods, setMoods] = useState<any[]>([]); // Add moods to state

  const fetchMoodData = async () => {
    if (!user) return;
    try {
      const fetchedMoods = await getMoodsForWeek(user.username);
      const data = new Array(7).fill(0);
      fetchedMoods.forEach((mood: any, index) => {
          data[index] = Object.keys(descriptionToValueMap).indexOf(mood.mood);
      });
      setMoods(fetchedMoods); // Update moods state
      setMoodData(data);
    } catch (error) {
      console.error("Error fetching mood data:", error);
    }
  };

  useEffect(() => {
    fetchMoodData();
  }, [user]);

  const saveMoodToDatabase = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to save a mood");
      return;
    }

    if (selectedMood) {
      const date = new Date().toISOString().split("T")[0];
      const mood = moodMap[selectedMood].description;
      try {
        await addMood(user.username, date, mood, notes);
        Alert.alert("Success", "Mood saved successfully");
        fetchMoodData();
      } catch (error) {
        Alert.alert("Error", "Failed to save mood");
      }
      setModalVisible(false);
      setSelectedMood("");
      setNotes("");
    } else {
      Alert.alert("Error", "Please select a mood");
    }
  };

  const renderMoodButton = (emoji: string) => (
    <TouchableOpacity
      key={emoji}
      onPress={() => setSelectedMood(emoji)}
      className={`p-2 ${
        selectedMood === emoji ? "border-2 border-secondary rounded-full" : ""
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

  return (
    <Provider>
      <View className="flex-1 p-5 bg-primary">
        {/* Header */}
        <Text className="text-3xl font-psemibold text-white mb-5">
          Mood Tracking
        </Text>

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
            propsForBackgroundLines: {
              stroke: "#161622",
            },
            formatYLabel: formatYLabel,
          }}
          style={{ marginVertical: 8, borderRadius: 16 }}
        />

        {/* Button Box */}
        <View
          style={{
            backgroundColor: "#1F1F2E",
            padding: 16,
            borderRadius: 12,
            marginTop: 16,
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

        {/* Debug */}
        <View
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: "#2E2E3A",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white" }}>Debug Mood Data:</Text>
          {moods.map((mood, index) => (
            <View key={index} style={{ marginBottom: 8 }}>
              <Text style={{ color: "white" }}>Date: {mood.date}</Text>
              <Text style={{ color: "white" }}>Mood: {mood.mood}</Text>
              <Text style={{ color: "white" }}>Notes: {mood.notes}</Text>
            </View>
          ))}
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

            {/* Optional Notes Input */}
            <TextInput
              label="Add a note (optional)"
              value={notes}
              onChangeText={(text) => setNotes(text)}
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
  );
};

export default Mood;
