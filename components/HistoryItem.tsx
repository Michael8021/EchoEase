import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { updateHistory } from '../lib/appwrite';

interface HistoryItemProps {
  id: string;
  text: string;
  onDelete: () => void;
  createdAt: string;
  onUpdate: (updatedText: string) => void;
}

const HistoryItem = ({ id, text, onDelete, createdAt, onUpdate }: HistoryItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleUpdate = async () => {
    try {
      if (editedText.trim() === '') return;
      await updateHistory(id, { transcribed_text: editedText } as any);
      setIsEditing(false);
      onUpdate(editedText);
    } catch (error) {
      Alert.alert('Error', 'Failed to update history');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View className="bg-black-100 rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start">
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => setIsEditing(true)}
          className="flex-1 mr-2"
        >
          {isEditing ? (
            <TextInput
              value={editedText}
              onChangeText={setEditedText}
              multiline
              autoFocus
              className="text-white font-pregular text-base"
              onSubmitEditing={handleUpdate}
              onBlur={handleUpdate}
              blurOnSubmit={true}
            />
          ) : (
            <Text className="text-white font-pregular text-base">
              {text}
            </Text>
          )}
        </TouchableOpacity>
        
        <View className="flex-row items-center gap-3">
          <Text className="text-gray-100 text-xs">
            {formatDate(createdAt)}
          </Text>
          <TouchableOpacity onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color="#FF4B4B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default HistoryItem;
