// ollama implementation
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENDPOINT_KEY = 'ollama_endpoint';
const MODEL_KEY = 'ollama_model';

export const DEFAULT_ENDPOINT = 'http://localhost:11434';
export const DEFAULT_MODEL = 'llama3'; // Popular default

export async function getOllamaSettings() {
  try {
    const url = await AsyncStorage.getItem(ENDPOINT_KEY);
    const model = await AsyncStorage.getItem(MODEL_KEY);
    return {
      endpoint: url || DEFAULT_ENDPOINT,
      model: model || DEFAULT_MODEL,
    };
  } catch (e) {
    console.error('Error getting Ollama settings', e);
    return { endpoint: DEFAULT_ENDPOINT, model: DEFAULT_MODEL };
  }
}

export async function saveOllamaSettings(endpoint: string, model: string) {
  try {
    await AsyncStorage.setItem(ENDPOINT_KEY, endpoint.trim());
    await AsyncStorage.setItem(MODEL_KEY, model.trim());
    return true;
  } catch (e) {
    console.error('Error saving Ollama settings', e);
    return false;
  }
}

export async function fetchAvailableModels(endpoint: string): Promise<string[]> {
  try {
    const baseUrl = endpoint.trim().replace(/\/$/, '');
    const url = `${baseUrl}/api/tags`;
    
    // Add a reasonable timeout for checking local instances
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && Array.isArray(data.models)) {
      return data.models.map((m: any) => m.name);
    }
    return [];
  } catch (e) {
    console.error('Error fetching Ollama models:', e);
    throw e;
  }
}

// ollama implementation
export async function generateSummary(
  transcript: string,
  notes?: string
): Promise<string> {
  const { endpoint, model } = await getOllamaSettings();
  const baseUrl = endpoint.trim().replace(/\/$/, '');
  const url = `${baseUrl}/api/generate`;

  const prompt = `You are an AI assistant specialized in summarizing meetings. Below is the transcription of a meeting and optionally some supplementary notes.
Please provide a concise and clear summary of the meeting, including:
1. A brief overview of what was discussed.
2. Key action items and decisions made.

Format the summary nicely using clean markdown. Do not include introductory text like "Here is the summary" or "Sure, I can summarize that for you". Just return the summary itself.

Meeting Transcript:
${transcript || '(No transcript available)'}

Supplementary Notes:
${notes || '(No supplementary notes available)'}

Summary:`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  if (data && data.response) {
    return data.response.trim();
  }
  throw new Error('Invalid response format from Ollama');
}
