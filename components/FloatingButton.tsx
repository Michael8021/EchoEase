import React, { useState, useRef } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../context/GlobalProvider';
import { transcribeAudio, sendTextToChatbot } from '../lib/aiService';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { ScheduleResponse } from '../lib/types';

const FloatingButton = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [promptText, setPromptText] = useState('');
    const { user } = useGlobalContext();

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
                    const transcribedText = await transcribeAudio(uri);
                    console.log('Transcribed Text:', transcribedText);
                    await handleChatbotResponse(transcribedText);
                } catch (transcriptionError) {
                    throw transcriptionError;
                }
            }
        } catch (err) {
            throw err;
        }
    };


    const handleChatbotResponse = async (text: string) => {
        try {
            const schedule: ScheduleResponse = await sendTextToChatbot(text);
            console.log('Schedule:', schedule);
            // TODO: Handle the schedule response (e.g., update state or navigate)
        } catch (error) {
            console.error('Error handling chatbot response:', error);
        }
    };

    const handleSubmitPrompt = async () => {
        if (promptText.trim() === '') {
            alert('Please enter a prompt');
            return;
        }
        setModalVisible(false);
        setPromptText('');
        try {
            const schedule: ScheduleResponse = await sendTextToChatbot(promptText);
            console.log('Schedule:', schedule);
            // TODO: Handle the schedule response (e.g., update state or navigate)
            
        } catch (error) {
            console.error('Error handling chatbot response:', error);
        }
    };

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
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitPrompt}>
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity
                style={styles.button}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.7}
            >
                <Ionicons name={recording ? 'mic-off' : 'mic'} size={24} color="#000" />
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
});

export default FloatingButton;