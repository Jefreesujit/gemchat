import { fileFunctionDeclarations } from './tools';
import * as fs from 'fs';
import * as path from 'path';

/* -----------------Types--------------- */
export interface ChatHistory {
  role: 'system' | 'user' | 'tool' | 'assistant';
  name?: string;
  content: string;
  timestamp?: number;
}

/* -----------------Constants--------------- */
// Add local fallback directory
export const LOCAL_HISTORY_DIR = path.join(process.cwd(), '.gemchat', 'history');
export const HISTORY_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.gemchat', 'history');

/* -----------------Tool Call Validation--------------- */
export const validateToolCall = (funcCall: any, params: any): boolean => {
  // Validate required parameters
  const declaration = fileFunctionDeclarations.find(decl => decl.name === funcCall.name);
  if (declaration?.parameters?.required) {
    const missingParams = declaration.parameters.required.filter(param => !params[param]);
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters for ${funcCall.name}: ${missingParams.join(', ')}`);
    }
  }

  // For file creation/update operations, ensure content is not empty
  if ((funcCall.name === 'createFile' || funcCall.name === 'updateFile') &&
      (!params.content || (typeof params.content === 'string' && params.content.trim() === ''))) {
    throw new Error(`Empty content provided for ${funcCall.name} operation`);
  }

  return true;
};

export const processResponse = (response: any): string => {
  // Get the response parts with type checking
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No response candidates received');
  }

  const content = candidates[0].content;
  if (!content || !content.parts) {
    throw new Error('Invalid response content structure');
  }

  const responseParts = content.parts;
  let textResponse = '';

  // Process each part of the response
  for (const part of responseParts) {
    if (part?.text) {
      textResponse += part.text;
    }
  }

  return textResponse;
};


/* -----------------History Functions--------------- */
export async function ensureHistoryDir() {
  try {
    // Try global directory first
    await fs.promises.mkdir(HISTORY_DIR, { recursive: true });
    return HISTORY_DIR;
  } catch (error: any) {
    // If permission error, try local directory
    if (error.code === 'EACCES') {
      try {
        await fs.promises.mkdir(LOCAL_HISTORY_DIR, { recursive: true });
        console.log('\nNote: Using local directory for chat history due to permission restrictions');
        return LOCAL_HISTORY_DIR;
      } catch (localError) {
        console.error('\nFailed to create history directory:', localError);
        process.exit(1);
      }
    } else {
      console.error('\nFailed to create history directory:', error);
      process.exit(1);
    }
  }
}

export function formatChatHistory(history: ChatHistory[]): string {
  return history
    .filter(msg => msg.role !== 'system') // Filter out system messages
    .map(msg => {
      const timestamp = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString()
        : '';
      const role = msg.role.toUpperCase();
      return `[${timestamp}] ${role}: ${msg.content}\n`;
    })
    .join('\n');
}

export async function saveChatHistory(history: ChatHistory[]) {
  // Get local date and time components
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Format as YYYY-MM-DDTHH-mm-ss
  const timestamp = `${year}-${month}-${day}T${hours}-${minutes}-${seconds}`;
  const filename = `gemchat-${timestamp}.txt`;

  try {
    const historyDir = await ensureHistoryDir();
    const filepath = path.join(historyDir, filename);
    const formattedHistory = formatChatHistory(history);
    await fs.promises.writeFile(filepath, formattedHistory);
    console.log(`\nChat history saved to ${filepath}`);
  } catch (error) {
    console.error('\nFailed to save chat history:', error);
  }
}

export async function loadChatHistory(filename: string): Promise<ChatHistory[]> {
  try {
    const historyDir = await ensureHistoryDir();
    const filepath = path.join(historyDir, filename);
    const content = await fs.promises.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('\nFailed to load chat history:', error);
    return [];
  }
}
