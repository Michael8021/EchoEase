import { View, Text, TouchableOpacity, Image, Alert, TextInput, Modal, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
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
                className="w-32 h-32 rounded-full mb-4 border-4 border-secondary"
              />
              <View className="absolute bottom-5 right-0 bg-secondary p-2 rounded-full shadow-lg">
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
            <View className="items-center">
              <Text className="text-2xl font-psemibold text-white mb-2">{user?.username || 'User'}</Text>
              <View className="flex-row items-center bg-black-100 px-4 py-2 rounded-full">
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
                <Text className="text-gray-300 ml-2 font-pmedium">{user?.email}</Text>
              </View>
            </View>
          </View>

          {/* Settings Sections */}
          <View className="space-y-16 pb-10">
            {/* Account Settings Section */}
            <View>
              <Text className="text-gray-400 text-sm mb-4 font-pmedium uppercase ml-1">Account Settings</Text>
              <View className="space-y-8">
                {/* Change Username Button */} 
                <TouchableOpacity
                  onPress={() => setShowChangeUsername(true)}
                  className="flex flex-row items-center p-4 bg-black-100 rounded-xl border border-gray-800 active:opacity-80 mb-2"
                >
                  <View className="w-10 h-10 bg-secondary/20 rounded-full items-center justify-center">
                    <Ionicons name="person-outline" size={22} color="#FF9C01" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-pmedium text-lg text-white">Change Username</Text>
                    <Text className="text-gray-400 text-sm">Update your display name</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Change Password Button */}
                <TouchableOpacity
                  onPress={() => setShowChangePassword(true)}
                  className="flex flex-row items-center p-4 bg-black-100 rounded-xl border border-gray-800 active:opacity-80 mb-5"
                >
                  <View className="w-10 h-10 bg-secondary/20 rounded-full items-center justify-center">
                    <Ionicons name="lock-closed-outline" size={22} color="#FF9C01" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-pmedium text-lg text-white">Change Password</Text>
                    <Text className="text-gray-400 text-sm">Update your security credentials</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* App Settings Section */}
            <View>
              <Text className="text-gray-400 text-sm mb-4 font-pmedium uppercase ml-1">App Settings</Text>
              <View className="space-y-8">
                {/* Notifications Settings */}
                <TouchableOpacity
                  onPress={() => Alert.alert("Coming Soon", "Notification settings will be available in the next update!")}
                  className="flex flex-row items-center p-4 bg-black-100 rounded-xl border border-gray-800 active:opacity-80 mb-2"
                >
                  <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center">
                    <Ionicons name="notifications-outline" size={22} color="#A855F7" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-pmedium text-lg text-white">Notifications</Text>
                    <Text className="text-gray-400 text-sm">Manage your notifications</Text>
                  </View>
                  <View className="bg-gray-800 px-3 py-1 rounded-full">
                    <Text className="text-gray-400 text-xs">SOON</Text>
                  </View>
                </TouchableOpacity>

                {/* Language Settings */}
                <TouchableOpacity
                  onPress={() => Alert.alert("Coming Soon", "Language settings will be available in the next update!")}
                  className="flex flex-row items-center p-4 bg-black-100 rounded-xl border border-gray-800 active:opacity-80 mb-5"
                >
                  <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center">
                    <Ionicons name="language-outline" size={22} color="#3B82F6" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-pmedium text-lg text-white">Language</Text>
                    <Text className="text-gray-400 text-sm">Change app language</Text>
                  </View>
                  <View className="bg-gray-800 px-3 py-1 rounded-full">
                    <Text className="text-gray-400 text-xs">SOON</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Account Actions Section */}
            <View>
              <Text className="text-gray-400 text-sm mb-4 font-pmedium uppercase ml-1">Account Actions</Text>
              <View className="space-y-8">
                {/* Sign Out Button */}
                <TouchableOpacity
                  onPress={handleSignOut}
                  className="flex flex-row items-center p-4 bg-black-100 rounded-xl border border-gray-800 active:opacity-80 mb-2"
                >
                  <View className="w-10 h-10 bg-orange-500/20 rounded-full items-center justify-center">
                    <Ionicons name="log-out-outline" size={22} color="#F97316" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-pmedium text-lg text-white">Sign Out</Text>
                    <Text className="text-gray-400 text-sm">Log out of your account</Text>
                  </View>
                </TouchableOpacity>

                {/* Delete Account Button */}
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  className="flex flex-row items-center p-4 bg-red-950/30 rounded-xl border border-red-900 active:opacity-80 mb-5"
                >
                  <View className="w-10 h-10 bg-red-500/20 rounded-full items-center justify-center">
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-pmedium text-lg text-red-500">Delete Account</Text>
                    <Text className="text-red-400/70 text-sm">Permanently delete your account</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Change Username Modal */}
          <Modal
            visible={showChangeUsername}
            transparent={true}
            animationType="fade"
            statusBarTranslucent
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
            >
              <View className="flex-1 bg-black/80 justify-center items-center px-4">
                <View className="bg-black-100 p-6 rounded-2xl w-full border border-gray-800 shadow-2xl">
                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-psemibold text-white">Change Username</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setShowChangeUsername(false);
                        setNewUsername('');
                      }}
                      className="p-2"
                    >
                      <Ionicons name="close" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <View className="mb-6">
                    <Text className="text-gray-400 text-sm mb-2 font-pmedium">New Username</Text>
                    <View className="relative">
                      <View className="absolute left-4 top-4">
                        <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        placeholder="Enter new username"
                        placeholderTextColor="#9CA3AF"
                        value={newUsername}
                        onChangeText={setNewUsername}
                        className="p-4 pl-12 bg-black-200 border border-gray-800 rounded-xl text-white text-lg font-pmedium"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleUpdateUsername}
                    className="p-4 bg-secondary rounded-xl"
                  >
                    <Text className="text-center text-white font-pmedium text-lg">Update Username</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Change Password Modal */}
          <Modal
            visible={showChangePassword}
            transparent={true}
            animationType="fade"
            statusBarTranslucent
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
            >
              <View className="flex-1 bg-black/80 justify-center items-center px-4">
                <View className="bg-black-100 p-6 rounded-2xl w-full border border-gray-800 shadow-2xl">
                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-psemibold text-white">Change Password</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setShowChangePassword(false);
                        setOldPassword('');
                        setNewPassword('');
                      }}
                      className="p-2"
                    >
                      <Ionicons name="close" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <View className="space-y-4 mb-6">
                    <View>
                      <Text className="text-gray-400 text-sm mb-2 font-pmedium">Current Password</Text>
                      <View className="relative">
                        <View className="absolute left-4 top-4">
                          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                        </View>
                        <TextInput
                          placeholder="Enter current password"
                          placeholderTextColor="#9CA3AF"
                          value={oldPassword}
                          onChangeText={setOldPassword}
                          secureTextEntry
                          className="p-4 pl-12 bg-black-200 border border-gray-800 rounded-xl text-white text-lg font-pmedium"
                        />
                      </View>
                    </View>

                    <View>
                      <Text className="text-gray-400 text-sm mb-2 font-pmedium">New Password</Text>
                      <View className="relative">
                        <View className="absolute left-4 top-4">
                          <Ionicons name="key-outline" size={20} color="#9CA3AF" />
                        </View>
                        <TextInput
                          placeholder="Enter new password"
                          placeholderTextColor="#9CA3AF"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry
                          className="p-4 pl-12 bg-black-200 border border-gray-800 rounded-xl text-white text-lg font-pmedium"
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleChangePassword}
                    className="p-4 bg-secondary rounded-xl"
                  >
                    <Text className="text-center text-white font-pmedium text-lg">Update Password</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;