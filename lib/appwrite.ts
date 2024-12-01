import {
    Account,
    Avatars,
    Client,
    Databases,
    ID,
    Query,
    Storage,
    Permission, 
    Role
  } from "react-native-appwrite";
import { SpendingItem,ExpenseItem } from "../type";
import { Schedule, Mood, MoodInsight } from "./types";

export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.platform.echoease',
    projectId: '6728739400249b29108d',
    databaseId: '672874b7001bef17e4d6',
    userCollectionId: '672874c60003d32a2491',
    expense_typeId: '673833fe0036fd646922',
    spendingCollectionId:'674c4b7e001858ebb772',
    scheduleCollectionId: '672878b6000297694b47',
    historyCollectionId: '672eeced0003474523e6',
    moodCollectionId: '672ce11300183b1fd08f',
    mood_insightCollectionId: '6745a21d0014178b09e2',
    bucketId: '6745e535000b2448cd22'
}


export const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

// ======================== User Management ========================

//----------------------------------------------account---------------------------------------------------------
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
      },
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
    let response; try { response = await fetch(uri); } catch (error) { console.log('Error fetching avatar:', error); return null; }
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
//----------------------------------------------history---------------------------------------------------------

//----------------------------------------------schedule---------------------------------------------------------
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
//----------------------------------------------schedule---------------------------------------------------------
//----------------------------------------------Home---------------------------------------------------------
export async function getMoodByDate(date: Date) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not authenticated");

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const moodData = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.moodCollectionId,
      [
        Query.equal("userId", currentUser.$id),
        Query.greaterThanEqual("datetime", startOfDay.toISOString()),
        Query.lessThanEqual("datetime", endOfDay.toISOString()),
      ]
    );

    return moodData.documents; 
  } catch (error) {
    console.error("Error retrieving mood data:", error);
    alert("Failed to retrieve the mood of today. Please try again.");
    return []; 
  }
}

export const getSpendingByMonth = async (currentDate: Date) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(); 
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString(); 

    // Query the spending documents from the Appwrite database
    const spending = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.spendingCollectionId,
      [
        Query.equal("userId", currentUser.$id), 
        Query.greaterThanEqual("date", startOfMonth), 
        Query.lessThanEqual("date", endOfMonth)       
      ]
    );
    return spending.documents;
  } catch (error) {
    console.error('Error retrieving spending by month:', error);
    alert('Failed to retrieve spending by month. Please try again.');
    return [];
  }
};

export async function getRemindersByDate(date: Date) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not authenticated");

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const reminders = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.scheduleCollectionId,
      [
        Query.equal("userId", currentUser.$id),
        Query.equal("type", "reminder"),
        Query.greaterThanEqual("due_date", startOfDay.toISOString()),
        Query.lessThanEqual("due_date", endOfDay.toISOString()),

      ]
    );

    return reminders.documents;
  } catch (error) {
    console.error(`Error fetching reminders: ${error}`);
    alert('Failed to retrieve reminders. Please try again.');
    return [];
  }
}

export async function getEventsByDate(date: Date) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not authenticated");

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const events= await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.scheduleCollectionId,
      [
        Query.equal("userId", currentUser.$id),
        Query.equal("type", "event"),
        Query.greaterThanEqual("start_time", startOfDay.toISOString()),
        Query.lessThanEqual("start_time", endOfDay.toISOString()),

      ]
    );
    return events.documents;
  } catch (error) {
    console.error(`Error fetching events: ${error}`);
    alert('Failed to retrieve events. Please try again.');
    return [];
  }
}

//----------------------------------------------Home---------------------------------------------------------
//----------------------------------------------Mood---------------------------------------------------------
export async function createMood(mood: Mood) {
  try {
    // Set the start and end of the day for the given date
    const date = new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const existing = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.moodCollectionId,
      [
        Query.equal("userId", mood.userId),
        Query.greaterThanEqual("datetime", startOfDay.toISOString()),
        Query.lessThanEqual("datetime", endOfDay.toISOString())
      ]
    );

    if (existing.total > 0) {
      const moodId = existing.documents[0].$id;
      const updatedMood = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.moodCollectionId,
        moodId,
        {
          datetime: mood.datetime,
          mood_type: mood.mood_type,
          description: mood.description,
          historyId: mood.historyId
        }
      );
      return updatedMood;
    } else {
      const newMood = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.moodCollectionId,
        ID.unique(),
        {
          userId: mood.userId,
          datetime: mood.datetime,
          mood_type: mood.mood_type,
          description: mood.description,
          historyId: mood.historyId
        }
      );
      return newMood;
    }
  } catch (error) {
    throw new Error(String(error));
  }
}

export async function getMoods(userId: string, weekStart: Date) {
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(weekStart.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  // Set monday to the start of the day (00:00:00)
  monday.setHours(0, 0, 0, 0);
  // Set sunday to the end of the day (23:59:59)
  sunday.setHours(23, 59, 59, 999);
  const moods = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.moodCollectionId,
    [
      Query.equal("userId", userId),
      Query.greaterThanEqual("datetime", monday.toISOString()),
      Query.lessThanEqual("datetime", sunday.toISOString())
    ]
  );
  // Create a map of dates to mood documents
  const moodMap = new Map(moods.documents.map(mood => [new Date(mood.datetime).toLocaleDateString().split('T')[0], mood]));

  // Initialize an array to hold the results
  const result = [];

  // Iterate through each day of the week
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    const dateString = currentDate.toLocaleDateString().split('T')[0];
    if (moodMap.has(dateString)) {
      result.push(moodMap.get(dateString));
    } else {
      result.push({ datetime: dateString, mood_type: null, description: null });
    }
  }
  return result;
}

export async function createMoodInsight(moodInsight: MoodInsight, weekStart: Date) {
  try {
    // Set the start and end of the day for the given date
    const startOfWeek = new Date(weekStart);
    startOfWeek.setDate(weekStart.getDate() - weekStart.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const existing = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.mood_insightCollectionId,
      [
        Query.equal("userId", moodInsight.userId),
        Query.greaterThanEqual("datetime", startOfWeek.toISOString()),
        Query.lessThanEqual("datetime", today.toISOString())
      ]
    );

    if (existing.total > 0) {
      const moodInsightId = existing.documents[0].$id;
      const updatedMoodInsight = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.mood_insightCollectionId,
        moodInsightId,
        {
          datetime: moodInsight.datetime,
          mood_insight: moodInsight.mood_insight,
        }
      );
      return updatedMoodInsight;
    } else {
      const newMoodInsight = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.mood_insightCollectionId,
        ID.unique(),
        {
          userId: moodInsight.userId,
          datetime: moodInsight.datetime,
          mood_insight: moodInsight.mood_insight,
        }
      );
      return newMoodInsight;
    }
  } catch (error) {
    throw new Error(String(error));
  }
}

export async function getMoodInsight(userId: string, weekStart: Date) {
  const startOfWeek = new Date(weekStart);
  startOfWeek.setDate(weekStart.getDate() - weekStart.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const moodInsight = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.mood_insightCollectionId,
    [
      Query.equal("userId", userId),
      Query.greaterThanEqual("datetime", startOfWeek.toISOString()),
      Query.lessThanEqual("datetime", today.toISOString())
    ]
  );
  return moodInsight;
}
//----------------------------------------------Mood---------------------------------------------------------
export const addExpenseType = async (expenseCategory:string,selectedColor:string) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    await databases.createDocument(
      appwriteConfig.databaseId, 
      appwriteConfig.expense_typeId, 
      ID.unique(), 
      {
        category: expenseCategory,
        amount:"0.0", 
        color: selectedColor,
        userId: currentUser.$id,
      },
    );
  } catch (error) {
    console.error('Error saving document:', error);
    alert('Failed to save expense. Please try again.');
  }
};

//get expense type
export const getExpenseTypes = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    const ExpenseTypes = await databases.listDocuments(
      appwriteConfig.databaseId, 
      appwriteConfig.expense_typeId,
      [Query.equal("userId", currentUser.$id)]
    );
    return ExpenseTypes.documents;
  } catch (error) {
    console.error('Error retrieving expense types:', error);
    alert('Failed to retrieve expense types. Please try again.');
    return [];
  }
};

//delete expense type
export const deleteExpenseTypes = async (expenseTypeId: string) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    if (!expenseTypeId) throw new Error("ExpenseType ID is required");

    await databases.deleteDocument(
      appwriteConfig.databaseId, 
      appwriteConfig.expense_typeId,
      expenseTypeId
    );
  } catch (error) {
    console.error('Error deleting expense type:', error);
    alert('Failed to delete expense type. Please try again.');
  }
};

//add spending
export const addSpending = async (newSpending: SpendingItem) => {
  try {
    console.log("add");
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    const expenseTypes = await getExpenseTypes();
    if (!expenseTypes || expenseTypes.length === 0) {
      alert('No valid expense categories found. Please create one first.');
      return;
    }

    const categoryDoc = expenseTypes.find((type: any) => type.category === newSpending.category);
    if (!categoryDoc) {
      alert(`Invalid category: ${newSpending.category}. Please select a valid category.`);
      return;
    }

    await databases.createDocument(
      appwriteConfig.databaseId, 
      appwriteConfig.spendingCollectionId, 
      ID.unique(), 
      {
        category: categoryDoc.$id, 
        name: newSpending.name,
        amount: newSpending.amount,
        date: newSpending.date,
        userId: currentUser.$id,
        historyId: newSpending.historyId,
      },
    );

  } catch (error) {
    console.error('Error saving document:', error);
    alert('Failed to save spending. Please try again.');
    return [];
  }
};


//get spending
export const getSpending = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    const spending = await databases.listDocuments(
      appwriteConfig.databaseId, 
      appwriteConfig.spendingCollectionId,
      [Query.equal("userId", currentUser.$id)]
    );

    return spending.documents;
  } catch (error) {
    console.error('Error retrieving spending:', error);
    alert('Failed to retrieve spending. Please try again.');
    return [];
  }
};

//update spending
export const updateSpending = async (spending: SpendingItem) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    if (!spending.id) throw new Error("Spending ID is required");

    const expenseTypes = await getExpenseTypes();
    if (!expenseTypes || expenseTypes.length === 0) {
      alert('No valid expense categories found. Please create one first.');
      return;
    }

    const matchingCategory = expenseTypes.find((type: any) => type.category === spending.category);
    if (!matchingCategory) {
      alert(`Invalid category: ${spending.category}. Please select a valid category.`);
      return;
    }

    await databases.updateDocument(
      appwriteConfig.databaseId, 
      appwriteConfig.spendingCollectionId, 
      spending.id, 
      {
        category: matchingCategory.$id, 
        name: spending.name,
        amount: spending.amount,
        date: spending.date,
        userId: currentUser.$id,
      }
    );

  } catch (error) {
    console.error('Error updating spending:', error);
    alert('Failed to update spending. Please try again.');
    return [];
  }
};


// delete spending
export const deleteSpending = async (spending: SpendingItem) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    if (!spending.id) throw new Error("Spending ID is required");

    await databases.deleteDocument(
      appwriteConfig.databaseId, 
      appwriteConfig.spendingCollectionId, 
      spending.id
    );
  } catch (error) {
    console.error('Error deleting spending:', error);
    alert('Failed to delete spending. Please try again.');
  }
};
//----------------------------------------------finance---------------------------------------------------------
