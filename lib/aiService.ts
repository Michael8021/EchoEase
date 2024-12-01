import * as FileSystem from 'expo-file-system';
import * as Localization from 'expo-localization';
import { CategorizedData, MoodInsight } from './types';
import { getCurrentUser} from '../lib/appwrite';

export const transcribeAudio = async (audioUri: string): Promise<string> => {

  try {
    const deviceLanguage = Localization.getLocales()[0].languageCode;
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any);
    formData.append('model', 'whisper-1');
    formData.append('prompt', `Transcribe this audio in ${deviceLanguage} language`);

    const response = await fetch(`${process.env.EXPO_PUBLIC_OPENAI_API_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Transcription API Error:', errorText);
      throw new Error(`Failed to transcribe audio: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Audio transcription error:', error);
    throw error;
  } finally {
    try {
      await FileSystem.deleteAsync(audioUri);
    } catch (deleteError) {
      console.error('Error deleting audio file:', deleteError);
    }
  }
};

type Category = {
  id: string;
  category: string;
};

// Main function to categorize and extract information
export const categorizeAndExtractData = async (
  text: string,
  historyId: string,
  categories:any
): Promise<CategorizedData> => {
  try {
    // Define the chat request
    const instructions = 
    `Please classify this expense into one of these existing categories: ${categories.map((c: Category) => c.category).join(', ')}
    If you can not find a proper one. Please suggest an appropriate category name for this expense. Use a general category name (like food, school, home, transport, utilities) that could group similar expenses together and
    and please set 'create_type' to true.`;



    const chatRequest = {
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that categorizes and extracts information from user input. Categorize the input into the following types: schedule, finance, mood, or other. For each category, extract relevant details as specified below.

**Categories and Required Fields**:

1. **Schedule**:
    - Can include both events and reminders.
    - **Event**:
        - type: "event"
        - title: string
        - description: string
        - start_time: ISO 8601 string
        - end_time: ISO 8601 string (optional)
        - status: leave blank
        - notify_at: leave blank
        - due_date: leave blank
    - **Reminder**:
        - type: "reminder"
        - title: string
        - description: string
        - notify_at: ISO 8601 string (optional)
        - due_date: ISO 8601 string
        - status: "pending" or "completed"
        - start_time: leave blank
        - end_time: leave blank

2. **Finance**:
    - Here is the instruction:${instructions}
    - transaction_type: "expense"
    - amount: number
    - currency: string (e.g., "USD")
    - category: string (e.g., "rent", "salary")
    - date: ISO 8601 string
    - description: string (make it concise)
    - create_type: boolean (default value is false)

3. **Mood**:
    - mood_type: string (e.g., "Very Sad", "Sad", "Neutral", "Happy", "Very Happy")
    - description: string
    - datetime: ISO 8601 string

4. **Other**:
    - title: string
    - description: string
    - datetime: ISO 8601 string

    **Instructions**:
    - You should be aware of the current time is ${new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'long', // Full month name
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Use 24-hour format
    }).format(new Date())}.
    - The timezone of the user is ${Intl.DateTimeFormat().resolvedOptions().timeZone}.
    - Analyze the input text.
    - Categorize each relevant part into one or more of the above categories.
    - Extract the required fields for each categorized entry.
    - Multiple entries can exist for each category.
    - An input can belong to multiple categories.
    
    **Final Output**:
    Return a JSON object with the following structure:

\`\`\`json
{
    "schedule": [ ... ],
    "finance": [ ... ],
    "mood": [ ... ],
    "other": [ ... ]
}
\`\`\`
`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'categorized_data',
          schema: {
            type: 'object',
            properties: {
              schedule: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    due_date: { type: 'string' },
                    end_time: { type: 'string' },
                    notify_at: { type: 'string' },
                    start_time: { type: 'string' },
                    status: { type: 'string', enum: ['pending', 'completed'] },
                    title: { type: 'string' },
                    type: { type: 'string', enum: ['event', 'reminder'] },
                  },
                  required: [
                    'description',
                    'due_date',
                    'end_time',
                    'notify_at',
                    'start_time',
                    'status',
                    'title',
                    'type',
                  ],
                  additionalProperties: false,
                },
              },
              finance: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    transaction_type: { type: 'string', enum: ['expense', 'income'] },
                    amount: { type: 'number' },
                    currency: { type: 'string' },
                    category: { type: 'string' },
                    date: { type: 'string' },
                    description: { type: 'string' },
                    create_type: {type: 'boolean'}
                  },
                  required: [
                    'transaction_type',
                    'amount',
                    'currency',
                    'category',
                    'date',
                    'description',
                    'create_type',
                  ],
                  additionalProperties: false,
                },
              },
              mood: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    datetime: { type: 'string' },
                    mood_type: { type: 'string' },
                    description: { type: 'string' },
                  },
                  required: ['datetime', 'mood_type', 'description'],
                  additionalProperties: false,
                },
              },
              other: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    datetime: { type: 'string' },
                  },
                  required: ['title', 'description', 'datetime'],
                  additionalProperties: false,
                },
              },
            },
            required: ['schedule', 'finance', 'mood', 'other'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    };

    // Send the request to OpenAI API
    const response = await fetch(`${process.env.EXPO_PUBLIC_OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
    });

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to categorize and extract data: ${response.status}`);
    }

    // Parse the response
    const data = await response.json();
    const categorizedData: CategorizedData = JSON.parse(data.choices[0].message.content);

    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    // Process Schedule
    categorizedData.schedule = categorizedData.schedule.map((item) => ({
      ...item,
      historyId: historyId,
      userId: currentUser.$id,
    }));
    // Process Mood
    categorizedData.mood = categorizedData.mood.map((item) => ({
      ...item,
      historyId: historyId,
      userId: currentUser.$id,
    }));
    // Process Finance
    categorizedData.finance = categorizedData.finance.map((item) => ({
      ...item,
      historyId: historyId,
      userId: currentUser.$id,
    }));

    // Process Other
    categorizedData.other = categorizedData.other.map((item) => ({
      ...item,
      historyId: historyId,
      userId: currentUser.$id,
    }));

    return categorizedData;
  } catch (error) {
    console.error('Categorization and Extraction Error:', error);
    throw error;
  }
};

export const genMoodInsight = async (
  moodData: string[],
  descriptions: string[],
  language: string = 'en'
): Promise<string> => {
  try {
    // Define the chat request
    const chatRequest = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that analyzes mood data for insights. Analyze the following mood data for the week: ${JSON.stringify(moodData)}. Provide a brief summary of mood patterns and trends. 
          
Note: 'No data' means mood not logged for future days. The number of mood entries indicates today's day (e.g., 3 entries mean today is Wednesday), so avoid mentioning missing moods after today, as they pertain to the future. Please keep your insights concise.

Important: Please provide the analysis in ${language === 'zh-TW' ? 'Traditional Chinese (繁體中文)' : 'English'}.
          
**Final Output**:
Return a string with the mood pattern analysis and insights in the specified language.`,
        },
        {
          role: 'user',
          content: JSON.stringify({ moodData, descriptions }),
        },
      ],
    };

    // Send the request to OpenAI API
    const response = await fetch(`${process.env.EXPO_PUBLIC_OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
    });

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to analyze mood data: ${response.status}`);
    }

    // Parse the response
    const data = await response.json();
    const moodInsight: string = data.choices[0].message.content;

    return moodInsight;
  } catch (error) {
    console.error('Mood Analysis Error:', error);
    throw error;
  }
};

export const recognizeReceipt = async (
  imageBase64Array: string[],
  expenseTypes: { category: string }[]
): Promise<{ name: string; amount: number; category: string; date: string }[]> => {
  try {
    const categories = expenseTypes.map(type => type.category).join(', ');

    const response = await fetch(`${process.env.EXPO_PUBLIC_OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze these receipt images and extract the following information in a structured format for each receipt. Available expense categories are: ${categories}. 
                    Choose the most appropriate category for each receipt. Return an array of objects.   
                   **Instructions**:
                    - The date return should be in ISO 8601 string format(YYYY-MM-DDThh:mm:ss±hh:mm).
                    - You should be aware of the current time is ${new Intl.DateTimeFormat('en-US', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }).format(new Date())}.
                 - The timezone of the user is ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`,
              },
              ...imageBase64Array.map(base64 => ({
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              }))
            ]
          }
        ],
        max_tokens: 1000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'categorized_data',
            schema: {
              type: 'object',
              properties: {
                finance: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      amount: { type: 'number' },
                      category: { type: 'string' },
                      date: { type: 'string' },
                      name: { type: 'string' },
                    },
                    required: [
                      'amount',
                      'category',
                      'date',
                      'name',
                    ],
                    additionalProperties: false,
                  },
                }
              },
              required: ['finance'],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // console.log('API Response:', data);

    const result = data.choices[0].message.content;
    // console.log('Parsed Receipt Data:', result);

    const parsedResult = JSON.parse(result);
    return parsedResult.finance;
  } catch (error: any) {
    console.error('Receipt recognition error:', error);
    console.error('Error details:', {
      name: error?.name || 'Unknown',
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace'
    });
    throw error;
  }
};