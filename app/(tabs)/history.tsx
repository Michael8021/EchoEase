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
    <SafeAreaView className="flex-1 bg-primary" edges={['top', 'left', 'right']}>
      {/* Fixed Header */}
      <View className="bg-primary px-6 pt-2 pb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-4xl font-pbold text-secondary">{t('common.history')}</Text>
          <TouchableOpacity 
            onPress={() => router.push("/settings")}
            className="bg-black-100/50 p-2 rounded-full border border-gray-100/10"
          >
            <Image source={icons.settings} className="w-6 h-6 opacity-85" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 20
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFA001"
          />
        }
      >
        <View className="flex-1 px-6">
          {/* History List */}
          <View 
            style={{
              backgroundColor: 'rgba(45, 36, 59, 0.15)',
              borderColor: 'rgba(157, 138, 176, 0.2)',
            }}
            className="rounded-2xl p-4 mb-6 shadow-lg border"
          >
            <View className="flex-row items-center mb-4">
              <View className="w-1 h-6 bg-component-schedule-accent rounded-full mr-3" />
              <Text className="text-xl font-psemibold text-component-schedule-text">
                Recent Activities
              </Text>
            </View>

            {isLoading ? (
              <View className="flex-1 justify-center items-center py-6">
                <ActivityIndicator size="large" color="#FFA001" />
              </View>
            ) : groupedHistories.length === 0 ? (
              <View className="flex-1 justify-center items-center py-5 bg-black-400/30 rounded-xl">
                <Text className="text-component-schedule-text/70 font-plight">
                  {t('history.noHistory')}
                </Text>
              </View>
            ) : (
              groupedHistories.map((group, index) => (
                <View key={index} className="mb-6 last:mb-3">
                  <Text className="text-secondary-light text-lg font-psemibold mb-3 px-1">
                    {group.date}
                  </Text>
                  <View className="space-y-2.5">
                    {group.items.map((item) => (
                      <View 
                        key={item.$id} 
                        className="bg-black-400/30 rounded-xl p-3 border border-gray-100/10 mb-1.5"
                      >
                        <View className="flex-row justify-between items-start">
                          <Text className="text-gray-100 font-pmedium flex-1 mr-3">
                            {item.transcribed_text}
                          </Text>
                          <View className="flex-row items-center shrink-0">
                            <Text className="text-gray-300 text-xs font-plight">
                              {new Date(item.$createdAt).toLocaleTimeString(i18n.language === 'zh-TW' ? 'zh-TW' : 'en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </Text>
                            <TouchableOpacity 
                              onPress={() => handleDelete(item.$id)}
                              className="ml-2 p-1"
                            >
                              <Image 
                                source={icons.deleteIcon}
                                className="w-5 h-5 opacity-70"
                                tintColor="#FF6B6B"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>

          <View className="flex-row justify-center mt-4 mb-8">
            <Text className="text-sm text-gray-200 font-plight">
              Track your daily activities and progress
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default HistoryScreen