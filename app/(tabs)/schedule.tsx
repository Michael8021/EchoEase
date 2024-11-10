import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import {Card, Avatar} from 'react-native-paper';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import React, { useState } from 'react'

const Schedule = () => {
  const databaseItem = {}

  const [items, setItems] = useState({
    '2024-11-15': [{name: 'example item 1', start_time: '09:00AM'}],
    '2024-11-25': [{name: 'item 2 - any js object', height: 80}],
    '2024-11-27': [],
    '2024-11-28': [{name: 'item 3 - any js object'}, {name: 'any js object'}]
  });

  return (
    <View style={styles.container}>
      <Agenda 
        items={items}
        renderEmptyData={renderEmptyData}
        
        // Specify how each item should be rendered in agenda
        renderItem={renderItem}

      />
    </View>
  )
};

const renderItem = (item:any) => {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    marginTop: 100,
  },
});

export default Schedule