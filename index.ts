import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import * as readline from 'readline';

/* -----------------Local Imports--------------- */
import { systemPrompt, followUpPrompt, errorHandlingPrompt } from './src/prompts';
import { fileFunctionDeclarations, executeTool } from './src/tools';
import {
  processResponse,
  validateToolCall,
  ChatHistory,
  saveChatHistory
} from './src/utils';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Please set the GEMINI_API_KEY environment variable.");
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

const chatHistory: ChatHistory[] = [{ role: 'system', content: systemPrompt }];

function addChatMessage(role: ChatHistory['role'], content: string, name?: string) {
  chatHistory.push({
    role,
    name,
    content,
    timestamp: Date.now()
  });
}

const generateContent = async ({ toolCalling = false }: { toolCalling?: boolean } = {}) => {
  const generateConfig = {
    model: 'gemini-2.0-flash-001',
    contents: chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n'),
    config: {}
  }

  if (toolCalling) {
    generateConfig.config = {
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: fileFunctionDeclarations.map((decl) => decl.name!),
        },
      },
      tools: [{ functionDeclarations: fileFunctionDeclarations }],
    };
  }

  return await genAI.models.generateContent(generateConfig);
};

async function processInput(input: string) {
  addChatMessage('user', input);

  try {
    // console.log('[DEBUG] Sending request to AI with input:', input);
    const response = await generateContent({ toolCalling: true });

    // console.log('[DEBUG] AI Response:', JSON.stringify(response.candidates, null, 2));
    // console.log('[DEBUG] Function Calls:', JSON.stringify(response.functionCalls, null, 2));

    const textResponse = processResponse(response);

    // Handle all function calls in sequence
    if (response.functionCalls && response.functionCalls.length > 0) {
      // Show initial explanation
      if (textResponse) {
        console.log('AI:', textResponse);
        addChatMessage('assistant', textResponse);
      }

      // Execute each function call in sequence
      for (const funcCall of response.functionCalls) {
        // console.log('[DEBUG] Function Call:', JSON.stringify(funcCall, null, 2));
        const { args = {} } = funcCall;

        validateToolCall(funcCall, args);

        // console.log(`[LOG] Executing tool: ${funcCall.name} with parameters:`, JSON.stringify(args, null, 2));
        const toolResult = await executeTool(funcCall.name!, args);
        // console.log('[LOG] Tool result:', toolResult);

        if (!toolResult.success) {
          throw new Error(`Tool execution failed: ${toolResult.error}`);
        }
        addChatMessage('tool', JSON.stringify(toolResult), funcCall.name);
        addChatMessage('system', followUpPrompt);

        const followUpResponse = await generateContent({ toolCalling: false });
        const followUpText = processResponse(followUpResponse);
        if (followUpText) {
          console.log('AI:', followUpText);
          addChatMessage('assistant', followUpText);
        }
      }
    } else {
      console.log('AI:', textResponse);
      addChatMessage('assistant', textResponse);
    }
  } catch (error: any) {
    console.error('Error processing request:', error.message);
    addChatMessage('assistant', `${errorHandlingPrompt}\n${error.message}`);
    const errorResponse = await generateContent({ toolCalling: false });
    const errorText = processResponse(errorResponse);
    if (errorText) {
      console.log('AI:', errorText);
      addChatMessage('assistant', errorText);
    }
  }
}

console.log('Welcome to the GemChat, AI powered CLI Chatbot with file system capabilities.');
rl.prompt();

rl.on('line', async (line) => {
  await processInput(line.trim());
  rl.prompt();
}).on('close', async () => {
  console.log('\nSaving chat history before exit...');
  await saveChatHistory(chatHistory);
  console.log('Exiting GemChat. Goodbye!');
  process.exit(0);
});
