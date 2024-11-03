import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { icons } from '../../constants'

const Home = () => {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-row justify-between items-center px-4 py-6 bg-primary">
        <Text className="text-3xl font-psemibold text-secondary">EchoEase</Text>

        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Image 
            source={icons.settings}
            className="w-7 h-7"
          />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4">
        <Text className="text-white">Home Content</Text>
      </View>
    </SafeAreaView>
  )
}

export default Home