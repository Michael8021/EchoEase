import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native'
import {Card, Avatar} from 'react-native-paper';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import React, { useEffect, useState } from 'react'
import { getSchedules } from '@/lib/appwrite';
import tailwind from 'tailwindcss';

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

  useEffect(() => {
    fetchSchedules(); // Initial fetch

    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchSchedules, 10000); // Adjust the interval as needed

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const fetchSchedules = async () => {
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
          date = startTime.split('T')[0]; // Use start_time for events
        } else if (type === 'reminder' && dueDate) {
            date = dueDate.split('T')[0]; // Use end_time for reminders
        }  
        const formattedTime = startTime ? formatTime(startTime) : null; // Format time
        const formattedEndTime = endTime ? formatTime(endTime) : null; // Format

        console.log(schedule.due_date);

        if (date) {
          if (!formattedItems[date]) {
            formattedItems[date] = []; // Initialize the array if it doesn't exist
          }
          formattedItems[date].push({
            name: schedule.title,
            start_time: formattedTime,
            end_time: formattedEndTime,
            description: schedule.description,
            type: schedule.type,
            status: schedule.status,
            notify_at: notifyAt ? formatTime(notifyAt) : null,
          });
        }


      });

      
      setItems(formattedItems);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // update Schedules when float button pressed
  // const forceUpdateSchedules = () => {
  //   fetchSchedules(); 
  // };

  const renderEmptyData = () => {
    return (
      <View className='flex-1 justify-center items-center bg-primary'>
        <Text className='text-gray-100'>No events for this day</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" >
      <View className="flex-row justify-between items-center px-4 py-6 bg-primary">
        <Text className="text-3xl font-psemibold text-secondary">Schedule</Text>
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

            agendaTodayColor: '#FF0000', // Today's color in the agenda
            agendaKnobColor: '#FF9C01', // Knob color for the agenda
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
};

type ScheduleItems = {
  [key: string]: ScheduleItem[];
};

const renderItem = (item: ScheduleItem) => {
  const avatarLabel = item.status === 'completed' ? '✔️' : item.status === 'pending' ? '⏳' : null;
  const avatarColor = item.status === 'completed' ? 'bg-green-500' : item.status === 'pending' ? 'bg-red-500' : '';

  const formattedStartTime = item.start_time;
  const formattedEndTime = item.end_time;

  return (
    <TouchableOpacity className='bg-primary mr-2 mt-4 p-2'>
      <Card>
        <Card.Content className='bg-stone-600 rounded-md relative pb-14'>
          <View>
            <View className='flex-row justify-between items-center'>
              <Text className="text-xl text-gray-100">{item.name}</Text>
              <Text className="text-xl text-gray-400">{item.type}</Text>
            </View>

            {(formattedStartTime || formattedEndTime) && (
              <Text className="text-slate-50">
                {formattedStartTime} {formattedEndTime ? `- ${formattedEndTime}` : ''}
              </Text>
            )}
            <Text className="text-gray-100">{item.description}</Text>
            
          </View>
          {item.status && avatarLabel && ( 
            <Avatar.Text 
              label={avatarLabel} 
              className={`absolute bottom-2 right-2 ${avatarColor} text-white w-9 h-9`} 
              style={{ backgroundColor: item.status === 'completed' ? '#34D399' : '#F87171' }} 
            />
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const formatTime = (dateString: string | null): string => {
  if (!dateString) return 'No time available';

  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};



// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000000",
//     marginTop: 100,
//   },
// });

export default Schedule