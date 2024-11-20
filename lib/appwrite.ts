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

export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.platform.echoease',
    projectId: '6728739400249b29108d',
    databaseId: '672874b7001bef17e4d6',
    userCollectionId: '672874c60003d32a2491',
    expense_typeId: '673833fe0036fd646922',
}


export const client = new Client()
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

//save expense type
export const handleSaveExpenseType = async (expenseCategory:string,selectedColor:string) => {
  try {
    await databases.createDocument(
      appwriteConfig.databaseId, 
      appwriteConfig.expense_typeId, 
      ID.unique(), 
      {
        category: expenseCategory,
        amount:"0.0", 
        color: selectedColor,
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
    const ExpenseTypes = await databases.listDocuments(
      appwriteConfig.databaseId, 
      appwriteConfig.expense_typeId
    );
    return ExpenseTypes.documents;
  } catch (error) {
    console.error('Error retrieving expense types:', error);
    alert('Failed to retrieve expense types. Please try again.');
    return [];
  }
};



