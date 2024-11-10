import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useCallback, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { icons } from '../../constants'
import { getHistory, deleteHistory } from '../../lib/appwrite'
import HistoryItem from '../../components/HistoryItem'
import { History } from '../../lib/types'
import { Models } from 'react-native-appwrite'

interface GroupedHistories {
  date: string;
  items: History[];
}

const HistoryScreen = () => {
  const router = useRouter()
  const [groupedHistories, setGroupedHistories] = useState<GroupedHistories[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const groupHistoriesByDate = (histories: History[]) => {
    const sortedHistories = [...histories].sort((a, b) => 
      new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    )

    const groups = sortedHistories.reduce((acc: { [key: string]: History[] }, history) => {
      const date = new Date(history.$createdAt)
      const dateStr = date.toLocaleDateString('zh-CN', { 
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      if (!acc[dateStr]) {
        acc[dateStr] = []
      }
      acc[dateStr].push(history)
      return acc
    }, {})

    return Object.entries(groups).map(([date, items]) => ({
      date,
      items
    }))
  }

  const fetchHistories = async () => {
    if (!refreshing) {
      setIsLoading(true)
    }
    try {
      const data = await getHistory()
      const mappedHistories = data.map((doc: Models.Document) => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        transcribed_text: doc.transcribed_text,
        userId: doc.userId,
      })) as History[]
      
      const grouped = groupHistoriesByDate(mappedHistories)
      setGroupedHistories(grouped)
    } catch (error) {
      console.error('Error fetching histories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteHistory(id)
      setGroupedHistories(prevGroups => {
        const newGroups = prevGroups.map(group => ({
          ...group,
          items: group.items.filter(item => item.$id !== id)
        }))
        return newGroups.filter(group => group.items.length > 0)
      })
    } catch (error) {
      console.error('Error deleting history:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchHistories()
    setRefreshing(false)
  }

  // Load data when it is initialized
  useFocusEffect(
    useCallback(() => {
      if (!isInitialized) {
        fetchHistories()
        setIsInitialized(true)
      }
    }, [isInitialized])
  )

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-row justify-between items-center px-4 py-6">
        <Text className="text-3xl font-psemibold text-secondary">History</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Image 
            source={icons.settings}
            className="w-7 h-7"
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading && !refreshing ? (
          <View className="flex-1 justify-center items-center mt-10">
            <ActivityIndicator size="large" color="#FF9C01" />
          </View>
        ) : groupedHistories.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-10">
            <Text className="text-gray-100 text-lg font-pmedium">
              No history found
            </Text>
          </View>
        ) : (
          groupedHistories.map((group) => (
            <View key={group.date}>
              <Text className="text-gray-100 text-lg font-pmedium mt-4 mb-2">
                {group.date}
              </Text>
              {group.items.map((history) => (
                <HistoryItem
                  key={history.$id}
                  id={history.$id}
                  text={history.transcribed_text}
                  onDelete={() => handleDelete(history.$id)}
                  createdAt={history.$createdAt}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default HistoryScreen