import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native'
import {Card, Avatar, Checkbox} from 'react-native-paper';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

import React, { useEffect, useState, useCallback } from 'react'
import { getSchedules, updateSchedule } from '@/lib/appwrite';
import tailwind from 'tailwindcss';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

// thing that will fetch from database
// ------------------------------------------
//
// [{"$collectionId": "672878b6000297694b47", 
//   "$createdAt": "2024-11-11T04:52:54.201+00:00", 
//   "$databaseId": "672874b7001bef17e4d6", 
//   "$id": "67318da6000ee07583c6", 
//   "$permissions": [], 
//   "$updatedAt": "2024-11-11T05:00:50.461+00:00", 
//   "description": "testing desc", 
//   "due_date": null, 
//   "end_time": "2024-11-11T15:52:30.000+00:00", 
//   "historyId": null, 
//   "notify_at": null, 
//   "start_time": "2024-11-11T11:11:11.000+00:00", 
//   "status": "pending", 
//   "title": "testing title", 
//   "type": "reminder", 
//   "userId": {"$collectionId": "672874c60003d32a2491", 
//     "$createdAt": "2024-11-08T14:24:26.281+00:00", 
//     "$databaseId": "672874b7001bef17e4d6", 
//     "$id": "672e1f1900152977cd3c", 
//     "$permissions": [Array], 
//     "$updatedAt": "2024-11-08T14:24:26.281+00:00", 
//     "accountId": "672e1f17002c786b114c", 
//     "avatar": "https://cloud.appwrite.io/v1/avatars/initials?name=Marco&project=6728739400249b29108d", 
//     "email": "Marco@gmail.com", 
//     "username": "Marco"}}]

const Schedule = () => {
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return t('schedule.noTimeAvailable');

    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // const initialItems: ScheduleItems = {
  //   '2024-11-15': [{ name: 'example item 1', start_time: '09:00AM', end_time: '11:00AM', notify_at: '08:30AM', description: 'No description', type: 'event', status: 'pending' }],
  //   '2024-11-25': [{ name: 'item 2 - any js object', start_time: null, end_time: null, notify_at: null, description: 'No description', type: 'reminder', status: 'completed' }],
  //   '2024-11-27': [],
  //   '2024-11-28': [
  //     { name: 'item 3 - any js object', start_time: null, end_time: null, notify_at: '10:00AM', description: 'No description', type: 'reminder', status: 'pending' },
  //     { name: 'any js object', start_time: null, end_time: null, notify_at: null, description: 'No description', type: 'reminder', status: 'completed' }
  //   ]
  // };

  // const [items, setItems] = useState<ScheduleItems>(initialItems);
  const [items, setItems] = useState<ScheduleItems>({});

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const schedules = await getSchedules();
      const formattedItems: ScheduleItems = {};

      schedules.forEach(schedule => {
        // Handle null start_time and end_time
        const startTime = schedule.start_time;
        const endTime =schedule.end_time;
        const dueDate = schedule.due_date;
        const notifyAt = schedule.notify_at;
        const type = schedule.type;

        let date = null;
        if (type === 'event' && startTime) {
          date = startTime.split('T')[0]; 
        } else if (type === 'reminder' && dueDate) {
          date = dueDate.split('T')[0]; 
        }  
        const formattedTime = startTime ? formatTime(startTime) : null; 
        const formattedEndTime = endTime ? formatTime(endTime) : null; 
        const formattedDueDate = dueDate ? formatTime(dueDate) : null;

        if (date) {
          if (!formattedItems[date]) {
            formattedItems[date] = []; 
          }
          formattedItems[date].push({
            name: schedule.title,
            start_time: formattedTime,
            end_time: formattedEndTime,
            description: schedule.description,
            type: schedule.type,
            status: schedule.status,
            notify_at: notifyAt ? formatTime(notifyAt) : null,
            $id: schedule.$id,
            due_date: formattedDueDate
          });
        }
      });
      setItems(formattedItems);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use useFocusEffect instead of useEffect with interval
  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  // Export fetchSchedules for use by FloatingButton
  useEffect(() => {
    global.fetchSchedules = fetchSchedules;
    return () => {
      global.fetchSchedules = undefined;
    };
  }, [fetchSchedules]);


  const renderEmptyData = () => {
    return (
      <View className='flex-1 justify-center items-center bg-primary'>
        <Text className='text-gray-100'>{t('schedule.noEvents')}</Text>
      </View>
    );
  };

  const renderItem = (item: ScheduleItem) => {
    const isEvent = item.type === 'event';
    const bgColor = isEvent 
      ? 'rgba(36, 59, 45, 0.15)' 
      : 'rgba(255, 249, 219, 0.05)'; 
    const borderColor = isEvent 
      ? 'rgba(138, 176, 157, 0.2)' 
      : 'rgba(255, 236, 153, 0.2)'; 
    const accentColor = isEvent ? '#A5CCB8' : '#FFE082'; 
    const statusColor = item.status === 'completed' ? '#34D399' : '#F87171';
    const showStatus = !isEvent && item.status;

    const handleStatusChange = async (item: ScheduleItem) => {
      try {
        if (!item.$id || isEvent) return;
        item.status = item.status === 'completed' ? 'pending' : 'completed';
        setItems({ ...items });
        
        await updateSchedule(item.$id, { status: item.status });
      } catch (error) {
        console.error('Error updating schedule status:', error);
      }
    };
    // console.log(item.type, item.status);
    return (
      <View className="px-2 mb-3">
        <View 
          style={{
            backgroundColor: bgColor,
            borderColor: borderColor,
          }}
          className="rounded-xl p-4 border shadow-lg"
        >
          <View className="flex-row relative">
            <View className="flex-1">
              {/* Header with type indicator */}
              <View className="flex-row items-center mb-2">
                <View className={`w-1 h-5 rounded-full mr-3`} style={{ backgroundColor: accentColor }} />
                <Text className="text-base font-psemibold" style={{ color: accentColor }}>
                  {t(`schedule.${item.type}`)}
                </Text>
              </View>

              {/* Title */}
              <Text className="text-lg font-pmedium text-gray-100 mb-1">
                {item.name}
              </Text>

              {/* Time */}
              {(item.start_time || item.end_time) && (
                <View className="flex-row items-center mb-1">
                  <Text className="text-sm font-plight text-gray-300">
                    {item.start_time} {item.end_time ? `- ${item.end_time}` : ''}
                  </Text>
                </View>
              )}

              {/* Description */}
              {item.description && (
                <Text className="text-sm font-plight text-gray-300/80">
                  {item.description}
                </Text>
              )}

              {/* Notification time if exists */}
              {item.notify_at && (
                <View className="mt-2 flex-row items-center">
                  <View className="w-1 h-3 rounded-full mr-2" style={{ backgroundColor: `${accentColor}40` }} />
                  <Text className="text-xs font-plight text-gray-400">
                    {t('schedule.reminderAt')} {item.notify_at}
                  </Text>
                </View>
              )}
            </View>

            {item.type === 'reminder' && (
              <View className="absolute right-0 top-0 bottom-0 justify-center">
                <TouchableOpacity 
                  onPress={() => handleStatusChange(item)}
                  className="flex items-center justify-center"
                >
                  <View 
                    className="w-8 h-8 rounded border flex items-center justify-center"
                    style={{ 
                      borderColor: accentColor,
                      backgroundColor: item.status === 'completed' ? accentColor : 'transparent'
                    }}
                  >
                    {item.status === 'completed' && (
                      <Ionicons name="checkmark" size={22} color="#161622" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.androidSafeArea} >
      <View className="bg-primary px-6 pt-2 pb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-4xl font-pbold text-secondary">
            {t('schedule.title')}
          </Text>
        </View>
      </View>

      <View className='flex-1'>
        <Agenda 
          items={items}
          renderEmptyData={renderEmptyData}
          renderItem={renderItem}
          style={{backgroundColor: '#161622'}}
          theme={{
            backgroundColor: '#161622',
            calendarBackground: '#161622',
            reservationsBackgroundColor: '#161622',

            textSectionTitleColor: '#FF9C01',

            todayTextColor: '#FF8E01',
            selectedDayBackgroundColor: '#FF9C01',
            selectedDayTextColor: '#FFFFFF',
            
            dayTextColor: '#FFFFFF',
            monthTextColor : '#FF9C01',
            textDisabledColor: '#374151',
            agendaDayTextColor: '#FF9C01',

            agendaTodayColor: '#FF0000', 
            agendaKnobColor: '#FF9C01', 
          }}
        />
      </View>
    </SafeAreaView>
  )
};

type ScheduleItem = {
  name: string;
  start_time: string | null;
  end_time: string | null;
  notify_at: string | null;
  description: string;
  type: string;
  status: 'completed' | 'pending' | null;
  $id: string | null;
  due_date: string | null
};

type ScheduleItems = {
  [key: string]: ScheduleItem[];
};

const styles = StyleSheet.create({
  androidSafeArea: {
    flex: 1,
    backgroundColor: "#161622",
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  }});


export default Schedule