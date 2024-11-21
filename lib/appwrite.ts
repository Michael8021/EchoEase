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
    moodCollectionId: '672ce11300183b1fd08f',
}


const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

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

export async function addMood(username: string, date: string, mood: string, notes: string) {
  try {
    const existingMoods = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.moodCollectionId,
      [
        Query.equal("username", username),
        Query.equal("date", date)
      ]
    );

    if (existingMoods.total > 0) {
      const moodId = existingMoods.documents[0].$id;
      const updatedMood = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.moodCollectionId,
        moodId,
        {
          mood: mood,
          notes: notes
        }
      );
      return updatedMood;
    } else {
      const newMood = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.moodCollectionId,
        ID.unique(),
        {
          username: username,
          date: date,
          mood: mood,
          notes: notes
        }
      );
      return newMood;
    }
  } catch (error) {
    throw new Error(String(error));
  }
}

export async function getMoodsForWeek(username: string) {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const moods = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.moodCollectionId,
    [
      Query.equal("username", username),
      Query.greaterThanEqual("date", monday.toISOString().split('T')[0]),
      Query.lessThanEqual("date", sunday.toISOString().split('T')[0])
    ]
  );

  // Create a map of dates to mood documents
  const moodMap = new Map(moods.documents.map(mood => [new Date(mood.date).toISOString().split('T')[0], mood]));

  // Initialize an array to hold the results
  const result = [];

  // Iterate through each day of the week
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    const dateString = currentDate.toISOString().split('T')[0];

    if (moodMap.has(dateString)) {
      result.push(moodMap.get(dateString));
    } else {
      result.push({ date: dateString, mood: null });
    }
  }

  return result;
}
