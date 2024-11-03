import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { icons } from '../constants';
import { useGlobalContext } from '../context/GlobalProvider';
import { signOut } from '../lib/appwrite';

const Settings = () => {
  const router = useRouter();
  const { setUser, setIsLogged } = useGlobalContext();

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);
    router.replace('/sign-in');
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-row items-center px-4 py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -mr-2">
          <Image 
            source={icons.leftArrow}
            className="w-7 h-7"
          />
        </TouchableOpacity>
        <Text className="text-2xl font-psemibold text-white ml-4">Settings</Text>
      </View>
      
      <View className="flex-1 p-4">
        <TouchableOpacity
          onPress={handleSignOut}
          className="flex flex-row items-center p-4 bg-secondary rounded-lg"
        >
          <Image
            source={icons.logout}
            className="w-6 h-6 mr-3"
            resizeMode="contain"
          />
          <Text className="font-pmedium text-lg">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Settings;