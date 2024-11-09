import * as FileSystem from 'expo-file-system';
import * as Localization from 'expo-localization';
import { ContentType, Schedule } from './types';
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
    formData.append('model', 'whisper-large-v3');
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

export const determineContentType = async (text: string): Promise<ContentType> => {
  try {
    const chatRequest = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze user input to identify content types. Look for these specific patterns:

                    SCHEDULE type 
                    - Any related to events or reminders
                    - no matter its personal event or public event
                    - reminders like business meetings, appointments, buying groceries, homeworks, etc.

                    FINANCE type - Examples:
                    - "Spent $50 on groceries"
                    - "Paid $1200 for rent"
                    - "Earned $2000 from freelance work"
                    - "Need to pay electricity bill $80"
                    - "Monthly budget is $3000"

                    MOOD type - Examples:
                    - "I'm feeling happy today"
                    - "Feeling stressed about work"
                    - "Had a great day"
                    - "Feeling anxious about presentation"
                    - "Today was exhausting"

                    OTHER type - Use for any input that doesn't clearly fit the above categories.

                    For each input, identify ALL applicable categories. Many inputs might fit multiple categories.
                    Example: "Feeling stressed about paying rent tomorrow" would be both MOOD and FINANCE types.

                    Return the categories as an array of types.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'content_types',
          schema: {
            type: 'object',
            properties: {
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['schedule', 'finance', 'mood', 'other'] }
                  },
                  required: ['type'],
                  additionalProperties: false
                }
              }
            },
            required: ['categories'],
            additionalProperties: false
          },
          strict: true
        }
      }
    };

    const response = await fetch(`${process.env.EXPO_PUBLIC_OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to determine content type: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Content type determination error:', error);
    throw error;
  }
};

// Text to Schedule
export const sendTextToSchedule = async (text: string, historyId: string): Promise<Schedule> => {
  try {
    const chatRequest = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that extracts event/reminder details from user input. Current time is ${new Date().toLocaleString()}.

            For EVENT type:
            - Required fields: title, description, type (must be "event"), start_time (ISO string)
            - Optional: end_time (ISO string)
            - status, notify_at and due_date should leave blank

            For REMINDER type:
            - Required fields: title, description, type (must be "reminder"), notify_at (ISO string for reminder time), due_date (ISO string for due date)
            - Status must be either "pending" or "completed"
            - start_time and end_time should leave blank`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'schedule',
          schema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['event', 'reminder'] },
              title: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'completed'] },
              start_time: { type: 'string' },
              end_time: { type: 'string' },
              notify_at: { type: 'string' },
              due_date: { type: 'string' },
            },
            required: ['type', 'title', 'description', 'status', 'start_time', 'end_time', 'notify_at', 'due_date'],
            additionalProperties: false
          },
          strict: true
        }
      }
    };

    const response = await fetch(`${process.env.EXPO_PUBLIC_OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to determine content type: ${response.status}`);
    }

    const data = await response.json();
    const scheduleData = JSON.parse(data.choices[0].message.content);

    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error('User not found');

    return {
      ...scheduleData,
      historyId: historyId
    };
  } catch (error) {
    console.error('Schedule response error:', error);
    throw error;
  }
};