import { View, Text, TouchableOpacity, Image, Alert, TextInput, Modal } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { icons } from '../constants';
import { useGlobalContext } from '../context/GlobalProvider';
import { signOut, deleteUserAccount, changePassword, updateUsername } from '../lib/appwrite';

const Settings = () => {
  const router = useRouter();
  const { setUser, setIsLogged } = useGlobalContext();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);
    router.replace('/sign-in');
  };

  const handleChangePassword = async () => {
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert("Success", "Password changed successfully");
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      Alert.alert("Error", "Failed to change password");
      console.error(error);
    }
  };

  const handleUpdateUsername = async () => {
    try {
      await updateUsername(newUsername);
      Alert.alert("Success", "Username updated successfully");
      setShowChangeUsername(false);
      setNewUsername('');
    } catch (error) {
      Alert.alert("Error", "Failed to update username");
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUserAccount("");
              setUser(null);
              setIsLogged(false);
              router.replace('/sign-in');
            } catch (error) {
              Alert.alert("Error", "Failed to delete account. Please try again.");
              console.error(error);
            }
          }
        }
      ]
    );
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
      
      <View className="flex-1 px-4 py-6">
        <View className="space-y-6">
          {/* Change Username Button */} 
          <TouchableOpacity
            onPress={() => setShowChangeUsername(true)}
            className="flex flex-row items-center p-4 bg-black-100 rounded-lg mb-4"
          >
            <Image
              source={icons.user}
              className="w-6 h-6 mr-3"
              resizeMode="contain"
            />
            <Text className="font-pmedium text-lg text-white">Change Username</Text>
          </TouchableOpacity>

          {/* Change Password Button */}
          <TouchableOpacity
            onPress={() => setShowChangePassword(true)}
            className="flex flex-row items-center p-4 bg-black-100 rounded-lg mb-4"
          >
            <Image
              source={icons.lock}
              className="w-6 h-6 mr-3"
              resizeMode="contain"
            />
            <Text className="font-pmedium text-lg text-white">Change Password</Text>
          </TouchableOpacity>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="flex flex-row items-center p-4 bg-black-100 rounded-lg mb-4"
          >
            <Image
              source={icons.logout}
              className="w-6 h-6 mr-3"
              resizeMode="contain"
            />
            <Text className="font-pmedium text-lg text-white">Sign Out</Text>
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="flex flex-row items-center p-4 bg-red-500 rounded-lg"
          >
            <Image
              source={icons.deleteIcon}
              className="w-6 h-6 mr-3"
              resizeMode="contain"
            />
            <Text className="font-pmedium text-lg text-white">Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Change Username Modal */}
        <Modal
          visible={showChangeUsername}
          transparent={true}
          animationType="fade"
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-black-100 p-6 rounded-2xl w-[90%] max-w-[400px]">
              <Text className="text-xl font-psemibold mb-4 text-white">Change Username</Text>
              <TextInput
                placeholder="New Username"
                placeholderTextColor="#9CA3AF"
                value={newUsername}
                onChangeText={setNewUsername}
                className="p-3 border border-gray-100 rounded-lg mb-4 text-white"
              />
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowChangeUsername(false);
                    setNewUsername('');
                  }}
                  className="flex-1 p-3 bg-black-200 rounded-lg"
                >
                  <Text className="text-center font-pmedium text-white">Cancel</Text>
                </TouchableOpacity>
                
                <View style={{ width: 10 }} />

                <TouchableOpacity
                  onPress={handleUpdateUsername}
                  className="flex-1 p-3 bg-secondary rounded-lg"
                >
                  <Text className="text-center text-white font-pmedium">Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={showChangePassword}
          transparent={true}
          animationType="fade"
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-black-100 p-6 rounded-2xl w-[90%] max-w-[400px]">
              <Text className="text-xl font-psemibold mb-4 text-white">Change Password</Text>
              <TextInput
                placeholder="Current Password"
                placeholderTextColor="#9CA3AF"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                className="p-3 border border-gray-100 rounded-lg mb-3 text-white"
              />
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                className="p-3 border border-gray-100 rounded-lg mb-4 text-white"
              />
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowChangePassword(false);
                    setOldPassword('');
                    setNewPassword('');
                  }}
                  className="flex-1 p-3 bg-black-200 rounded-lg"
                >
                  <Text className="text-center font-pmedium text-white">Cancel</Text>
                </TouchableOpacity>

                <View style={{ width: 10 }} />
                
                <TouchableOpacity
                  onPress={handleChangePassword}
                  className="flex-1 p-3 bg-secondary rounded-lg"
                >
                  <Text className="text-center text-white font-pmedium">Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Settings;