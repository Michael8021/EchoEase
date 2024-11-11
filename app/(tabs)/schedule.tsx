import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import {Card, Avatar} from 'react-native-paper';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import React, { useEffect, useState } from 'react'
import { getSchedules } from '@/lib/appwrite';

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

  type ScheduleItem = {
    name: string;
    start_time: string | null;
  };

  type ScheduleItems = {
    [key: string]: ScheduleItem[];
  };
  
  const initialItems: ScheduleItems  = ({
    '2024-11-15': [{name: 'example item 1', start_time: '09:00AM'}],
    '2024-11-25': [{name: 'item 2 - any js object', start_time: null}],
    '2024-11-27': [],
    '2024-11-28': [{name: 'item 3 - any js object', start_time: null}, {name: 'any js object', start_time: null}]
  });

  const [items, setItems] = useState<ScheduleItems>(initialItems);

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'No time available';

    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const schedules = await getSchedules();

        const formattedItems = { ...initialItems }; // Start with initial items

        schedules.forEach(schedule => {
          const date = schedule.start_time.split('T')[0]; // Extract date
          const formattedTime = formatTime(schedule.start_time); // Format time

          if (!formattedItems[date]) {
            formattedItems[date] = []; // Initialize the array if it doesn't exist
          }
          formattedItems[date].push({
            name: schedule.title,
            start_time: formattedTime // Store the formatted time
          });
        });

        setItems(formattedItems);

      } catch (error) {
        console.error('Failed to fetch schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);



  const renderItem = (item: ScheduleItem) => {
    return (
      <TouchableOpacity style={{marginRight: 10, marginTop: 17}}>
        <Card>
          <Card.Content>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text>{item.name}</Text>
              <Text>{item.start_time}</Text>
              <Avatar.Text label="J" />
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyData = () => {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No events for this day</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Agenda 
        items={items}
        renderEmptyData={renderEmptyData}
        renderItem={renderItem}

      />
    </View>
  )
};





const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    marginTop: 100,
  },
});

export default Schedule