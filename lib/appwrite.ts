import {
    Account,
    Avatars,
    Client,
    Databases,
    ID,
    Query,
    Storage,
  } from "react-native-appwrite";

import { Schedule } from "./types";

export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.platform.echoease',
    projectId: '6728739400249b29108d',
    databaseId: '672874b7001bef17e4d6',
    userCollectionId: '672874c60003d32a2491',
    scheduleCollectionId: '672878b6000297694b47',
    historyCollectionId: '672eeced0003474523e6',
    bucketId: '6745e535000b2448cd22'
}


const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

// ======================== User Management ========================

// Register user
export async function createUser(email: string, password: string, username: string) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    throw new Error(String(error));
  }
}

// Sign In
export async function signIn(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession(email, password);

    return session;
  } catch (error) {
    throw new Error(String(error));
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(String(error));
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(String(error));
  }
}


// Change Password
export async function changePassword(oldPassword: string, newPassword: string) {
  try {
    const result = await account.updatePassword(newPassword, oldPassword);
    if (!result) throw Error;
    
    return result;
  } catch (error) {
    throw new Error(String(error));
  }
}

// Delete User Account
export async function deleteUserAccount(password: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("No user found");

    const accountId = currentUser.accountId;
    const documentId = currentUser.$id;

    await signOut();

    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      documentId
    );

    const response = await fetch(
      'https://673dd58be61f61385d3d.appwrite.global/delete-user',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: accountId,
        }),
      }
    );

    if (response.status !== 204 && !response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to delete user account');
    }

    return true;
  } catch (error) {
    console.error("Delete account error:", error);
    throw error;
  }
}

// Update Username
export async function updateUsername(newUsername: string) {
  try {
    // Update Appwrite account name
    const updatedAccount = await account.updateName(newUsername);
    if (!updatedAccount) throw Error;

    // Get and update user document
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    // Update avatar with new username
    const avatarUrl = avatars.getInitials(newUsername);

    // Update user document
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      currentUser.$id,
      {
        username: newUsername,
        avatar: avatarUrl,
      }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(String(error));
  }
}

// Update Avatar
export async function updateAvatar(uri: string) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const file = {
      name: 'profile.jpg',
      type: 'image/jpeg',
      size: blob.size,
      uri: uri
    };

    // Get current user to find existing avatar
    const currentAccount = await account.get();
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser.documents[0]) throw new Error("User not found");

    // Delete old avatar if it exists
    const currentAvatar = currentUser.documents[0].avatar;
    if (currentAvatar && currentAvatar.includes(appwriteConfig.bucketId)) {
      try {
        // Extract file ID from the URL using regex
        const fileIdMatch = currentAvatar.match(/files\/([^/]+)\/view/);
        const fileId = fileIdMatch ? fileIdMatch[1] : null;
        
        if (fileId) {
          try {
            await storage.deleteFile(appwriteConfig.bucketId, fileId);
          } catch (deleteError: any) {
            // Only log the error if it's not a "file not found" error
            if (deleteError?.code !== 404) {
              console.log("Error deleting old avatar:", deleteError);
            }
          }
        }
      } catch (error) {
        // If there's an error parsing the URL, just log it and continue
        console.log("Error parsing avatar URL:", error);
      }
    }

    // Upload new avatar
    const fileId = ID.unique();
    const uploadedFile = await storage.createFile(
      appwriteConfig.bucketId,
      fileId,
      file
    );

    if (!uploadedFile) throw Error;

    const fileUrl = storage.getFileView(
      appwriteConfig.bucketId,
      uploadedFile.$id
    );

    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      currentUser.documents[0].$id,
      {
        avatar: fileUrl.href
      }
    );

    return updatedUser;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ======================== History Management ========================

// Create History
export async function createHistory(transcribed_text: string,) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    const newHistory = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.historyCollectionId,
      ID.unique(),
      {
        transcribed_text: transcribed_text,
        userId: currentUser.$id,
      }
    );

    if (!newHistory) throw Error;

    return newHistory;
  } catch (error) {
    throw new Error(String(error));
  }
}

// Get History
export async function getHistory() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    const histories = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.historyCollectionId,
      [Query.equal("userId", currentUser.$id)]
    );

    if (!histories) throw Error;

    return histories.documents;
  } catch (error) {
    throw new Error(String(error));
  }
}

// Delete History
export async function deleteHistory(documentId: string) {
  try {
    const deletedHistory = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.historyCollectionId,
      documentId
    );

    if (!deletedHistory) throw Error;

    return deletedHistory;
  } catch (error) {
    throw new Error(String(error));
  }
}

// ======================== Schedule Management ========================

// Update History
export async function updateHistory(documentId: string, data: Partial<Schedule>) {
  try {
    const updatedHistory = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.historyCollectionId,
      documentId,
      data
    );

    if (!updatedHistory) throw Error;

    return updatedHistory;
  } catch (error) {
    throw new Error(String(error));
  }
}

// Create Schedule
export async function createSchedule(schedule: Omit<Schedule, '$id'>) {
  try {

    // Clean up date fields
    const cleanedSchedule = {
      ...schedule,
      status: schedule.status || null,
      start_time: schedule.start_time || null,
      end_time: schedule.end_time || null,
      notify_at: schedule.notify_at || null,
      due_date: schedule.due_date || null,
      userId: schedule.userId
    };

    const newSchedule = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.scheduleCollectionId,
      ID.unique(),
      cleanedSchedule
    );

    if (!newSchedule) throw Error;

    return newSchedule as unknown as Schedule;
  } catch (error) {
    console.log('Schedule creation error:', schedule);
    throw new Error(String(error));
  }
}

// Get Schedules
export async function getSchedules() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    const schedules = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.scheduleCollectionId,
      [Query.equal("userId", currentUser.$id)]
    );

    if (!schedules) throw Error;

    return schedules.documents as unknown as Schedule[];
  } catch (error) {
    throw new Error(String(error));
  }
}

// Update Schedule
export async function updateSchedule(
  documentId: string,
  schedule: Partial<Omit<Schedule, '$id'>>
) {
  try {
    const updatedSchedule = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.scheduleCollectionId,
      documentId,
      schedule
    );

    if (!updatedSchedule) throw Error;

    return updatedSchedule as unknown as Schedule;
  } catch (error) {
    throw new Error(String(error));
  }
}

// Delete Schedule
export async function deleteSchedule(documentId: string) {
  try {
    const deletedSchedule = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.scheduleCollectionId,
      documentId
    );

    if (!deletedSchedule) throw Error;

    return deletedSchedule as Schedule;
  } catch (error) {
    throw new Error(String(error));
  }
}

