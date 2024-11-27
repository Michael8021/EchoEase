import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useCallback, useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { icons } from '../../constants'
import { getHistory, deleteHistory } from '../../lib/appwrite'
import HistoryItem from '../../components/HistoryItem'
import { History } from '../../lib/types'
import { Models } from 'react-native-appwrite'
import { useHistories } from '../../context/HistoriesContext'

const HistoryScreen = () => {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const { groupedHistories, setGroupedHistories, addHistory, updateHistoryItem, removeHistory } = useHistories()
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const groupHistoriesByDate = (histories: History[]) => {
    const sortedHistories = [...histories].sort((a, b) => 
      new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    )

    const groups = sortedHistories.reduce((acc: { [key: string]: History[] }, history) => {
      const date = new Date(history.$createdAt)
      const dateStr = date.toLocaleDateString(i18n.language === 'zh-TW' ? 'zh-TW' : 'en-US', { 
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...(i18n.language === 'zh-TW' ? {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        } : {})
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
      
      setGroupedHistories(groupHistoriesByDate(mappedHistories))
    } catch (error) {
      console.error(t('history.fetchError'), error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteHistory(id)
      removeHistory(id);
    } catch (error) {
      console.error(t('history.deleteError'), error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchHistories()
    setRefreshing(false)
  }

  useFocusEffect(
    useCallback(() => {
      if (!isInitialized) {
        fetchHistories()
        setIsInitialized(true)
      }
    }, [isInitialized])
  )

  useEffect(() => {
    if (isInitialized) {
      fetchHistories()
    }
  }, [i18n.language])

  return (
    <SafeAreaView 
      className="flex-1 bg-primary" 
      edges={['top', 'left', 'right']}
    >
      <View className="flex-row justify-between items-center px-4 py-6">
        <Text className="text-3xl font-psemibold text-secondary">{t('common.history')}</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Image
            source={icons.settings}
            className="w-7 h-7"
            tintColor="#CDCDE0"
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFA001" />
        </View>
      ) : groupedHistories.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-secondary text-lg">{t('history.noHistory')}</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFA001"
            />
          }
        >
          {groupedHistories.map((group, index) => (
            <View key={index} className="mb-4 px-3">
              <Text className="text-secondary text-lg font-psemibold px-4 mb-2">
                {group.date}
              </Text>
              {group.items.map((item) => (
                <HistoryItem
                  key={item.$id}
                  item={item}
                  onDelete={() => handleDelete(item.$id)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default HistoryScreen