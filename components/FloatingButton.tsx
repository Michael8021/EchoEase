import React, { useState, useRef } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../context/GlobalProvider';
import { categorizeAndExtractData, transcribeAudio } from '../lib/aiService';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { createHistory, createSchedule, createMood } from '../lib/appwrite';
import { Schedule, History } from '../lib/types';
import { useHistories } from '../context/HistoriesContext';
import { CategorizedData } from '../lib/types';
import { testScheduleOperations } from '../lib/test/scheduleTest';

import { useMoodContext } from '../context/MoodContext';


const FloatingButton = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [promptText, setPromptText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { user } = useGlobalContext();
    const { addHistory } = useHistories();
    const { refreshMoods } = useMoodContext();

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    const startRecording = async () => {
        try {
            if (!permissionResponse || permissionResponse.status !== 'granted') {
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
                    // Handle error silently or with minimal logging if necessary
                }

                setRecording(null);

                try {
                    setIsProcessing(true);
                    const transcribedText = await transcribeAudio(uri);
                    if (transcribedText.trim() === '') {
                        alert('Please try again');
                        return;
                    }
                    console.log('Transcribed Text:', transcribedText);
                    await handleTextToWidget(transcribedText);
                } catch (transcriptionError) {
                    alert('Failed to process audio. Please try again.');
                } finally {
                    setIsProcessing(false);
                }
            }
        } catch (err) {
            console.error('Recording error:', err);
            alert('Failed to process recording. Please try again.');
            setIsProcessing(false);
        }
    };

    const handleSubmitPrompt = async () => {
        if (promptText.trim() === '') {
            alert('Please enter a prompt');
            return;
        }
        setIsProcessing(true);
        setModalVisible(false);
        try {
            await handleTextToWidget(promptText);
        } catch (error) {
            console.error('Error handling chatbot response:', error);
        } finally {
            setIsProcessing(false);
            setPromptText('');
        }
    };

    const handleTextToWidget = async (text: string) => {
        try {
            const createdHistory = await createHistory(text);
            const history: History = {
                $id: createdHistory.$id,
                $createdAt: createdHistory.$createdAt,
                $updatedAt: createdHistory.$updatedAt,
                transcribed_text: createdHistory.transcribed_text,
                userId: createdHistory.userId,
            };
            addHistory(history);
            
            const contentData: CategorizedData = await categorizeAndExtractData(text, history.$id);
            console.log('Content Data:', contentData);

            if (contentData.schedule) {
                Promise.all(contentData.schedule.map(item => createSchedule(item)))
                    .then(() => {
                        if (typeof global.fetchSchedules === 'function') {
                            global.fetchSchedules();
                        }
                    })
                    .catch(error => console.error('Error creating schedules:', error));
            }


            return;
        } catch (error) {
            console.error('Error handling text to widget:', error);
            throw error;
        }
    }

    const closeModal = () => {
        setModalVisible(false);
        setPromptText('');
    };

    // Track if we're in a long press
    const [isLongPress, setIsLongPress] = useState(false);
    const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

    const handlePressIn = () => {
        // Start a timeout to detect long press
        longPressTimeout.current = setTimeout(() => {
            setIsLongPress(true);
            startRecording();
        }, 100); // 100ms delay for long press detection
    };

    const handlePressOut = async () => {
        // Clear the timeout if press is released before long press is detected
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }

        if (isLongPress) {
            // If this was a long press, stop recording
            await stopRecording();
            setIsLongPress(false);
        } else {
            // If this was a short press, show modal
            setModalVisible(true);
        }
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
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
                            style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
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
                style={[styles.button, isProcessing && styles.buttonDisabled]}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.7}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Ionicons name={recording ? 'mic-off' : 'mic'} size={24} color="#000" />
                )}
            </TouchableOpacity>
        </View>
    );
};

const TAB_BAR_HEIGHT = 84; // Match the height from the tab bar configuration
const BOTTOM_SPACING = 16;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: TAB_BAR_HEIGHT + BOTTOM_SPACING, // Position above tab bar with some spacing
        right: 20,
        zIndex: 100,
    },
    button: {
        backgroundColor: '#FFA001',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#232533',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        color: '#FF9001',
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
    },
    textInput: {
        height: 100,
        borderColor: '#CDCDE0',
        borderWidth: 1,
        borderRadius: 10,
        color: '#fff',
        padding: 10,
        textAlignVertical: 'top',
        fontFamily: 'Poppins-Regular',
        marginBottom: 20,
    },
    submitButton: {
        backgroundColor: '#FFA001',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#000',
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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