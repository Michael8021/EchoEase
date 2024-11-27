import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { updateHistory } from '../lib/appwrite';
import { History } from '../lib/types';

interface HistoryItemProps {
  item: History;
  onDelete: () => void;
}

const HistoryItem = ({ item, onDelete }: HistoryItemProps) => {
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(item.transcribed_text);

  const handleUpdate = async () => {
    try {
      if (editedText.trim() === '') return;
      await updateHistory(item.$id, { transcribed_text: editedText } as any);
      setIsEditing(false);
    } catch (error) {
      Alert.alert(t('alerts.error'), t('history.updateError'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(i18n.language === 'zh-TW' ? 'zh-TW' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: i18n.language !== 'zh-TW'
    });
  };

  return (
    <View className="bg-black-100 rounded-xl p-4 mb-2">
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
              {item.transcribed_text}
            </Text>
          )}
        </TouchableOpacity>
        
        <View className="flex-row items-center gap-3">
          <Text className="text-gray-100 text-xs">
            {formatDate(item.$createdAt)}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                t('common.delete'),
                t('history.deleteConfirm'),
                [
                  {
                    text: t('common.cancel'),
                    style: 'cancel'
                  },
                  {
                    text: t('common.delete'),
                    onPress: onDelete,
                    style: 'destructive'
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF4B4B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default HistoryItem;
