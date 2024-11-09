import * as FileSystem from 'expo-file-system';
import { ScheduleResponse } from './types';

interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  response_format: object;
}

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any);
    formData.append('model', 'whisper-1');

    console.log('API URL:', process.env.EXPO_PUBLIC_OPENAI_API_URL);
    console.log('API Key:', process.env.EXPO_PUBLIC_OPENAI_API_KEY);
    
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

export const sendTextToChatbot = async (text: string): Promise<ScheduleResponse> => {
  try {
    const chatRequest = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful scheduling assistant. Convert user input into structured schedule data.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'schedule_response',
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              date: { type: 'string' },
              time: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              status: { type: 'string', enum: ['pending', 'completed'] },
            },
            required: ['title', 'description', 'date', 'time', 'priority', 'status'],
            additionalProperties: false
          },
          strict: true
        },
      },
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
      throw new Error(`Failed to get chatbot response: ${response.status}`);
    }

    const data = await response.json();
    // console.log('API Response:', data);
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Chatbot processing error:', error);
    throw error;
  }
};