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
  },
  container: {
    flex: 1,
    backgroundColor: "#161622",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#161622",
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 156, 1, 0.2)',
  },
  headerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF9C01',
    letterSpacing: 0.5,
  },
  todayMoodContainer: {
    backgroundColor: 'rgba(45, 36, 59, 0.15)',
    padding: 16,
    borderRadius: 16,
    marginTop: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(157, 138, 176, 0.2)',
    alignItems: 'center',
  },
  todayMoodButton: {
    backgroundColor: '#FF9C01',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayMoodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161622',
    marginLeft: 8,
  },
  moodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9C01',
  },
  chartContainer: {
    backgroundColor: "rgba(36, 59, 45, 0.15)",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(138, 176, 157, 0.2)',
  },
  weekSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 36, 45, 0.15)',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(176, 138, 157, 0.2)',
  },
  weekText: {
    color: '#FF9C01',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  logMoodButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45, 36, 59, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(157, 138, 176, 0.3)',
  },
  insightsButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(36, 59, 45, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(138, 176, 157, 0.3)',
  },
  logMoodButtonText: {
    color: "#B8A5CC",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  insightsButtonText: {
    color: "#A5CCB8",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    backgroundColor: '#1F1F2E',
    width: '90%',
    alignSelf: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 1, 0.2)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 156, 1, 0.1)',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 156, 1, 0.1)',
  },
  modalTitle: {
    color: '#FF9C01',
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  modalContent: {
    padding: 16,
    maxHeight: 200,
    backgroundColor: '#1F1F2E',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  insightText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'left',
    padding: 8,
  },
  moodButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A3C',
    padding: 5,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 156, 1, 0.1)',
  },
  moodButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 156, 1, 0.05)',
  },
  selectedMoodButton: {
    backgroundColor: 'rgba(255, 156, 1, 0.2)',
    borderColor: '#FF9C01',
    transform: [{ scale: 1.1 }],
  },
  moodButtonEmoji: {
    fontSize: 28,
  },
  inputContainer: {
    padding: 2,
    paddingBottom: 12,
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#FF9C01',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalButtonText: {
    color: '#161622',
    fontSize: 16,
    fontWeight: '700',
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

const moodColors: { [key: string]: { bg: string; text: string; accent: string } } = {
  "Very Sad": {
    bg: "#2D243B",
    text: "#B8A5CC",
    accent: "#C4B5D5"
  },
  "Sad": {
    bg: "#243B3B",
    text: "#A5CCCC",
    accent: "#B5D5D5"
  },
  "Neutral": {
    bg: "#243B2D",
    text: "#A5CCB8",
    accent: "#B5D5C4"
  },
  "Happy": {
    bg: "#3B3B24",
    text: "#CCCCB8",
    accent: "#D5D5B5"
  },
  "Very Happy": {
    bg: "#3B2D24",
    text: "#CCB8A5",
    accent: "#D5C4B5"
  }
};

const getMoodColor = (mood: string) => {
  const moodEmoji = mood?.split(" ")[0] || "😐";
  const moodType = moodMap[moodEmoji] || "Neutral";
  return moodColors[moodType];
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
            <Text style={{ fontSize: 14, marginBottom: 6 }}>{moodEmoji}</Text>
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
      console.error("Error regenerating mood insights:", error);
      Alert.alert("Error", "Failed to regenerate mood insights");
      setIsLoading(false);
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
    } else {
      setInitialLoad(false);
    }
  }, [refreshMoods]);

  useEffect(() => {
    if (autoregenerate) {
      regenerateInsight(currentWeek);
      setAutoregenerate(false);
    }
  }, [autoregenerate]);

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

  const handleCloseLogModal = () => {
    setLogModalVisible(false);
    setDescription('');
    setSelectedMood('');
  };

  return (
    <View style={styles.androidSafeArea}>
      <SafeAreaView style={styles.container}>
        <Provider>
          <View className="bg-primary px-6 pt-2 pb-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-4xl font-pbold text-secondary">
                Mood Map
              </Text>
            </View>
          </View>
          <View style={styles.container}>
            <View style={styles.todayMoodContainer}>
              <Text style={styles.moodText}>Today's Mood</Text>
              {todayMood ? (
                <Text style={[styles.moodText, { color: getMoodColor(todayMood).text }]}>{todayMood}</Text>
              ) : (
                <TouchableOpacity
                  style={styles.todayMoodButton}
                  onPress={() => setLogModalVisible(true)}
                >
                  <MaterialIcons name="add-reaction" size={20} color="#161622" />
                  <Text style={styles.todayMoodButtonText}>Set Today's Mood</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.chartContainer}>
              <BarChart
                adjustToWidth
                parentWidth={Dimensions.get('window').width - 20}
                initialSpacing={11}
                yAxisThickness={0}
                xAxisThickness={0}
                backgroundColor={"rgba(36, 59, 45)"}
                frontColor={getMoodColor(todayMood).accent}
                yAxisLabelTexts={["😶", "😭", "😢", "😐", "😊", "😁", ""]}
                barBorderRadius={4}
                noOfSections={6}
                stepValue={1}
                stepHeight={38}
                data={loading ? [{value: 0, label: "Mon", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Tue", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Wed", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Thu", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Fri", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Sat", labelTextStyle: { color: '#FF9C01' }},
                  {value: 0, label: "Sun", labelTextStyle: { color: '#FF9C01' }},
                ] : moodData.map(item => ({
                  ...item,
                  labelTextStyle: { color: getMoodColor(todayMood).text }
                }))}
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.logMoodButton}
                onPress={() => setLogModalVisible(true)}
              >
                <MaterialIcons name="edit" size={20} color="#B8A5CC" />
                <Text style={styles.logMoodButtonText}>Log Mood</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.insightsButton}
                onPress={() => handleViewInsights(currentWeek)}
              >
                <MaterialIcons name="insights" size={20} color="#A5CCB8" />
                <Text style={styles.insightsButtonText}>View Insights</Text>
              </TouchableOpacity>
            </View>

            <Portal>
              <Modal
                visible={insightModalVisible}
                onDismiss={() => setInsightModalVisible(false)}
                contentContainerStyle={styles.modalContainer}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Mood Insights</Text>
                  <View style={styles.modalHeaderButtons}>
                    <TouchableOpacity 
                      style={styles.modalCloseButton}
                      onPress={() => regenerateInsight(currentWeek)}
                    >
                      <MaterialIcons name="refresh" size={24} color="#FF9C01" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.modalCloseButton}
                      onPress={() => setInsightModalVisible(false)}
                    >
                      <MaterialIcons name="close" size={24} color="#FF9C01" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ maxHeight: 300 }}>
                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Text style={styles.insightText}>
                      {isLoading ? "Loading..." : moodInsight}
                    </Text>
                  </ScrollView>
                </View>
              </Modal>

              <Modal
                visible={chartModalVisible}
                onDismiss={() => setChartModalVisible(false)}
                contentContainerStyle={styles.modalContainer}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Mood on {selectedDay}</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setChartModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#FF9C01" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <Text style={styles.modalText}>
                    {selectedDescription}
                  </Text>
                </View>
              </Modal>

              <Modal
                visible={logModalVisible}
                onDismiss={handleCloseLogModal}
                contentContainerStyle={styles.modalContainer}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>How are you feeling?</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={handleCloseLogModal}
                  >
                    <MaterialIcons name="close" size={24} color="#FF9C01" />
                  </TouchableOpacity>
                </View>
                <View style={{ maxHeight: 400 }}>
                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={styles.moodButtonsContainer}>
                      {["😭", "😢", "😐", "😊", "😁"].map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() => setSelectedMood(emoji)}
                          style={[
                            styles.moodButton,
                            selectedMood === emoji && styles.selectedMoodButton,
                          ]}
                        >
                          <Text style={styles.moodButtonEmoji}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.inputContainer}>
                      <TextInput
                        mode="outlined"
                        placeholder="How are you feeling today? (optional)"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={description}
                        onChangeText={(text: string) => setDescription(text)}
                        multiline
                        numberOfLines={4}
                        style={{
                          backgroundColor: '#2A2A3C',
                          color: '#FFFFFF',
                          fontSize: 16,
                          borderRadius: 12,
                          width: '100%',
                        }}
                        outlineStyle={{
                          borderRadius: 12,
                          borderColor: 'rgba(255, 156, 1, 0.2)',
                        }}
                        textColor="#FFFFFF"
                        theme={{
                          colors: {
                            primary: '#FF9C01',
                            text: '#FFFFFF',
                            placeholder: 'rgba(255, 255, 255, 0.4)',
                          },
                        }}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.modalButton, { marginBottom: 8 }]}
                      onPress={saveMoodToDatabase}
                    >
                      <Text style={styles.modalButtonText}>Save Mood</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </Modal>
            </Portal>
          </View>
        </Provider>
      </SafeAreaView>
    </View>
  );
};

export default Mood;