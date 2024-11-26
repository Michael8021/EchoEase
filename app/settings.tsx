import { View, Text, TouchableOpacity, Image, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { icons } from '../constants';
import { useGlobalContext } from '../context/GlobalProvider';
import { signOut, deleteUserAccount, changePassword, updateUsername, updateAvatar } from '../lib/appwrite';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const Settings = () => {
  const router = useRouter();
  const { setUser, setIsLogged, user } = useGlobalContext();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to change profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        try {
          const updatedUser = await updateAvatar(result.assets[0].uri);
          if (updatedUser) {
            setUser(updatedUser);
          }
        } catch (error) {
          console.error(error);
          Alert.alert("Error", "Failed to update profile picture");
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to launch image picker");
      setUploading(false);
    }
  };

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
        {/* Profile Section */}
        <View className="items-center mb-8">
          <TouchableOpacity 
            onPress={handleImageUpload}
            disabled={uploading}
            className="relative"
          >
            <Image
              source={{ 
                uri: user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=FF9C01&color=fff&size=200`
              }}
              className="w-32 h-32 rounded-full mb-4"
            />
            <View className="absolute bottom-5 right-0 bg-secondary p-2 rounded-full">
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-2xl font-psemibold text-white mb-2">{user?.username || 'User'}</Text>
            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <Text className="text-gray-100 ml-2">{user?.email}</Text>
            </View>
          </View>
        </View>

        <View className="space-y-4">
          {/* Change Username Button */} 
          <TouchableOpacity
            onPress={() => setShowChangeUsername(true)}
            className="flex flex-row items-center p-4 bg-black-100 rounded-lg"
          >
            <Ionicons name="person-outline" size={24} color="#FFFFFF" className="mr-3" />
            <Text className="font-pmedium text-lg text-white">Change Username</Text>
          </TouchableOpacity>

          {/* Change Password Button */}
          <TouchableOpacity
            onPress={() => setShowChangePassword(true)}
            className="flex flex-row items-center p-4 bg-black-100 rounded-lg"
          >
            <Ionicons name="lock-closed-outline" size={24} color="#FFFFFF" className="mr-3" />
            <Text className="font-pmedium text-lg text-white">Change Password</Text>
          </TouchableOpacity>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="flex flex-row items-center p-4 bg-black-100 rounded-lg"
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" className="mr-3" />
            <Text className="font-pmedium text-lg text-white">Sign Out</Text>
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="flex flex-row items-center p-4 bg-red-500 rounded-lg"
          >
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" className="mr-3" />
            <Text className="font-pmedium text-lg text-white">Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Change Username Modal */}
        <Modal
          visible={showChangeUsername}
          transparent={true}
          animationType="fade"
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4">
            <View className="bg-black-100 p-6 rounded-2xl w-full">
              <Text className="text-2xl font-psemibold mb-6 text-white text-center">Change Username</Text>
              <TextInput
                placeholder="New Username"
                placeholderTextColor="#9CA3AF"
                value={newUsername}
                onChangeText={setNewUsername}
                className="p-4 border border-gray-100 rounded-lg mb-6 text-white text-lg text-center font-pmedium"
              />
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => {
                    setShowChangeUsername(false);
                    setNewUsername('');
                  }}
                  className="flex-1 p-4 bg-black-200 rounded-lg"
                >
                  <Text className="text-center font-pmedium text-white text-lg">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleUpdateUsername}
                  className="flex-1 p-4 bg-secondary rounded-lg"
                >
                  <Text className="text-center text-white font-pmedium text-lg">Update</Text>
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
          <View className="flex-1 bg-black/50 justify-center items-center px-4">
            <View className="bg-black-100 p-6 rounded-2xl w-full">
              <Text className="text-2xl font-psemibold mb-6 text-white text-center">Change Password</Text>
              <TextInput
                placeholder="Current Password"
                placeholderTextColor="#9CA3AF"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                className="p-4 border border-gray-100 rounded-lg mb-4 text-white text-lg text-center font-pmedium"
              />
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                className="p-4 border border-gray-100 rounded-lg mb-6 text-white text-lg text-center font-pmedium"
              />
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => {
                    setShowChangePassword(false);
                    setOldPassword('');
                    setNewPassword('');
                  }}
                  className="flex-1 p-4 bg-black-200 rounded-lg"
                >
                  <Text className="text-center font-pmedium text-white text-lg">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleChangePassword}
                  className="flex-1 p-4 bg-secondary rounded-lg"
                >
                  <Text className="text-center text-white font-pmedium text-lg">Update</Text>
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