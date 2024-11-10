

// Define the target JSON structure using TypeScript interfaces
interface Schedule {
  description: string;
  due_date: string;
  end_time: string;
  historyId: string;
  notify_at: string;
  start_time: string;
  status: 'pending' | 'completed';
  title: string;
  type: 'event' | 'reminder';
}

interface Finance {
  transaction_type: 'expense' | 'income';
  amount: number;
  currency: string;
  category: string;
  date: string;
  description: string;
}

interface Mood {
  mood_type: string;
  description: string;
  datetime: string;
}

interface Other {
  title: string;
  description: string;
  datetime: string;
}

interface CategorizedData {
  schedule: Schedule[];
  finance: Finance[];
  mood: Mood[];
  other: Other[];
}

// Utility function to get the current user (placeholder)
const getCurrentUser = async () => {
  // Implement your logic to get the current user
  return { id: '67303984002fee2c27b5' };
};

// Main function to categorize and extract information
export const categorizeAndExtractData = async (
  text: string
): Promise<CategorizedData> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('User not found');

    // Define the chat request
    const chatRequest = {
      model: 'gpt-4o-mini', // Replace with your actual model name
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
        - notify_at: ISO 8601 string
        - due_date: ISO 8601 string
        - status: "pending" or "completed"
        - start_time: leave blank
        - end_time: leave blank

2. **Finance**:
    - transaction_type: "expense" or "income"
    - amount: number
    - currency: string (e.g., "USD")
    - category: string (e.g., "rent", "salary")
    - date: ISO 8601 string
    - description: string

3. **Mood**:
    - mood_type: string (e.g., "happy", "sad")
    - description: string
    - datetime: ISO 8601 string

4. **Other**:
    - title: string
    - description: string
    - datetime: ISO 8601 string

**Instructions**:
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
                    historyId: { type: 'string' },
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
                    'historyId',
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
                  },
                  required: [
                    'transaction_type',
                    'amount',
                    'currency',
                    'category',
                    'date',
                    'description',
                  ],
                  additionalProperties: false,
                },
              },
              mood: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    mood_type: { type: 'string' },
                    description: { type: 'string' },
                    datetime: { type: 'string' },
                  },
                  required: ['mood_type', 'description', 'datetime'],
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
    console.log('Categorized Data:', categorizedData);

    // Post-process to add historyId and datetime if needed
    // (Assuming currentUser.id is to be used as historyId)
    // And datetime is the current timestamp for simplicity

    const currentDatetime = new Date().toISOString();

    // Process Schedule
    categorizedData.schedule = categorizedData.schedule.map((item) => ({
      ...item,
      historyId: currentUser.id,
      datetime: currentDatetime, // Adding datetime if needed
    }));

    // Process Other
    categorizedData.other = categorizedData.other.map((item) => ({
      ...item,
      datetime: currentDatetime,
    }));

    return categorizedData;
  } catch (error) {
    console.error('Categorization and Extraction Error:', error);
    throw error;
  }
};
