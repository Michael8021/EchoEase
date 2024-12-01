import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalContext } from "../context/GlobalProvider";
import { categorizeAndExtractData, transcribeAudio } from "../lib/aiService";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { createHistory, createSchedule, createMood } from "../lib/appwrite";
import { Schedule, History } from "../lib/types";
import { useHistories } from "../context/HistoriesContext";
import { CategorizedData } from "../lib/types";
import { testScheduleOperations } from "../lib/test/scheduleTest";
import { useMoodContext } from "../context/MoodContext";
import {
  getCurrentUser,
  getExpenseTypes,
  addSpending,
  addExpenseType,
} from "../lib/appwrite";

const FloatingButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useGlobalContext();
  const { addHistory } = useHistories();
  const { refreshMoods } = useMoodContext();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<View>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [submit, setSubmit] = useState(false);
  const fetchCategories = async () => {
    try {
      const expenses = await getExpenseTypes();
      const formattedExpenses = expenses.map((expense: any) => ({
        category: expense.category,
      }));
      setCategories(formattedExpenses);
    } catch (error) {
      console.error("Error fetching expenses types:", error);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, [submit]);

  function getBeautifulColor() {
    const colors = [
      "#D57B7B", // Dark Red
      "#D08561", // Dark Peach
      "#C0C06A", // Dark Yellow
      "#7BBF7F", // Dark Mint Green
      "#66B3D2", // Dark Sky Blue
      "#5A7DFF", // Dark Light Blue
      "#8F82D8", // Dark Lavender
      "#D080D3", // Dark Pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const handlePressIn = () => {
    longPressTimeout.current = setTimeout(() => {
      setIsLongPress(true);
      startRecording();
    }, 100);
  };

  const handlePressOut = async () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    if (isLongPress) {
      await stopRecording();
      setIsLongPress(false);
    } else {
      setModalVisible(true);
    }
  };

  const startRecording = async () => {
    try {
      if (!permissionResponse || permissionResponse.status !== "granted") {
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
    } catch (err) {
      throw err;
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        return;
      }

      await recording.stopAndUnloadAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();

      if (uri) {
        try {
          await FileSystem.getInfoAsync(uri);
        } catch {
          // Handle error silently
        }

        setRecording(null);

        try {
          setIsProcessing(true);
          const transcribedText = await transcribeAudio(uri);
          if (transcribedText.trim() === "") {
            alert("Please try again");
            return;
          }
          console.log("Transcribed Text:", transcribedText);
          await handleTextToWidget(transcribedText, categories);
        } catch (transcriptionError) {
          alert("Failed to process audio. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error("Recording error:", err);
      alert("Failed to process recording. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleSubmitPrompt = async () => {
    if (promptText.trim() === "") {
      alert("Please enter a prompt");
      return;
    }
    setIsProcessing(true);
    setModalVisible(false);
    try {
      await handleTextToWidget(promptText, categories);
    } catch (error) {
      console.error("Error handling chatbot response:", error);
    } finally {
      setIsProcessing(false);
      setPromptText("");
    }
  };

  const handleTextToWidget = async (text: string, categories: any) => {
    try {
      setSubmit(true);
      const createdHistory = await createHistory(text);
      const history: History = {
        $id: createdHistory.$id,
        $createdAt: createdHistory.$createdAt,
        $updatedAt: createdHistory.$updatedAt,
        transcribed_text: createdHistory.transcribed_text,
        userId: createdHistory.userId,
      };
      addHistory(history);

      const contentData: CategorizedData = await categorizeAndExtractData(
        text,
        history.$id,
        categories
      );
      console.log("Content Data:", contentData);

      if (contentData.schedule) {
        Promise.all(contentData.schedule.map((item) => createSchedule(item)))
          .then(() => {
            if (typeof global.fetchSchedules === "function") {
              global.fetchSchedules();
            }
          })
          .catch((error) => console.error("Error creating schedules:", error));
      }
      if (contentData.mood) {
        contentData.mood.forEach(async (item) => {
          await createMood(item);
          refreshMoods();
        });
      }

      if (contentData.finance) {
        if (contentData.finance[0].create_type) {
          addExpenseType(contentData.finance[0].category, getBeautifulColor());
        }
        const transformedSpending = {
          id: contentData.finance[0].historyId,
          name: contentData.finance[0].description,
          amount: contentData.finance[0].amount.toString(),
          date: contentData.finance[0].date,
          category: contentData.finance[0].category,
          historyId: contentData.finance[0].historyId,
        };
        addSpending(transformedSpending);
      }
      return;
    } catch (error) {
      console.error("Error handling text to widget:", error);
      throw error;
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setPromptText("");
  };

  return (
    <View style={styles.container} pointerEvents="box-none" ref={buttonRef}>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Text Prompt</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Type your prompt here..."
              placeholderTextColor="#7B7B8B"
              value={promptText}
              onChangeText={setPromptText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                isProcessing && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitPrompt}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[
          styles.button,
          isLongPress && styles.recording,
          isProcessing && styles.processing,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Ionicons
            name={recording ? "mic-off" : "mic"}
            size={24}
            color="#000"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const TAB_BAR_HEIGHT = 84;
const BOTTOM_SPACING = 14;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: TAB_BAR_HEIGHT + BOTTOM_SPACING,
    right: 14,
    zIndex: 100,
  },
  button: {
    backgroundColor: "rgba(255, 160, 1, 0.75)",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  recording: {
    backgroundColor: "rgba(255, 68, 68, 0.75)",
    transform: [{ scale: 1.1 }],
  },
  processing: {
    backgroundColor: "rgba(255, 68, 68, 0.75)",
    transform: [{ scale: 1 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#232533",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    color: "#FF9001",
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
  textInput: {
    height: 100,
    borderColor: "#CDCDE0",
    borderWidth: 1,
    borderRadius: 10,
    color: "#fff",
    padding: 10,
    textAlignVertical: "top",
    fontFamily: "Poppins-Regular",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#FFA001",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default FloatingButton;
