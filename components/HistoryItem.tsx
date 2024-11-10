import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { updateHistory } from '../lib/appwrite';

interface HistoryItemProps {
  id: string;
  text: string;
  onDelete: () => void;
  createdAt: string;
}

const HistoryItem = ({ id, text, onDelete, createdAt }: HistoryItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleUpdate = async () => {
    try {
      await updateHistory(id, { transcribed_text: editedText } as any);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update history');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity 
      onPress={() => setIsEditing(true)}
      className="bg-black-100 rounded-xl p-4 mb-3"
    >
      <View className="flex-row justify-between items-start">
        {isEditing ? (
          <TextInput
            value={editedText}
            onChangeText={setEditedText}
            onBlur={handleUpdate}
            autoFocus
            multiline
            className="flex-1 text-white font-pregular text-base mr-2"
          />
        ) : (
          <Text className="flex-1 text-white font-pregular text-base mr-2">
            {text}
          </Text>
        )}
        
        <View className="flex-row items-center gap-3">
          <Text className="text-gray-100 text-xs">
            {formatDate(createdAt)}
          </Text>
          <TouchableOpacity onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color="#FF4B4B" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default HistoryItem;
