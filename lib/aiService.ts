import * as FileSystem from 'expo-file-system';
import * as Localization from 'expo-localization';
import {  CategorizedData } from './types';
import { getCurrentUser } from './appwrite';


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

// Main function to categorize and extract information
export const categorizeAndExtractData = async (
  text: string,
  historyId: string
): Promise<CategorizedData> => {
  try {
    // Define the chat request
    const chatRequest = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that categorizes and extracts information from user input. Categorize the input into the following types: schedule, expense types, spending, mood, or other. For each category, extract relevant details as specified below.

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

2. **Expense types**:
    - color: string (e.g., "white")
    - category: string (e.g., "rent", "salary")
    - date: ISO 8601 string
    - category:string (e.g., should appear in the expense types, otherwise create an expense types first)

3. **Mood**:
    - mood_type: string (e.g., "Very Sad", "Sad", "Neutral", "Happy", "Very Happy")
    - description: string
    - datetime: ISO 8601 string

5. **Other**:
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
              expense_types: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    color: { type: 'string' },
                    category: { type: 'string' }, 
                  },
                  required: ['color', 'category'],
                  additionalProperties: false,
                },
              },
              spending: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    amount: { type: 'number' },
                    date: { type: 'string', format: 'date-time' }, 
                    category: { 
                      type: 'string', 
                      description: 'Must match an existing expense type category. If not found, create the category first.' 
                    },
                  },
                  required: [
                    'name',
                    'amount',
                    'date',
                    'category',
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