import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import * as readline from 'readline';

/* -----------------Local Imports--------------- */
import { systemPrompt, followUpPrompt } from './src/prompts';
import { fileFunctionDeclarations, executeTool } from './src/tools';

/* -----------------Types--------------- */
interface ChatHistory {
  role: 'system' | 'user' | 'tool' | 'assistant';
  name?: string;
  content: string;
}

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

const validateToolCall = (funcCall: any, params: any): boolean => {
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

const processResponse = (response: any): string => {
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

async function processInput(input: string) {
  chatHistory.push({ role: 'user', content: input });

  try {
    console.log('[DEBUG] Sending request to AI with input:', input);
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n'),
      config: {
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: fileFunctionDeclarations.map((decl) => decl.name!),
          },
        },
        tools: [{ functionDeclarations: fileFunctionDeclarations }],
      },
    });

    console.log('[DEBUG] AI Response:', JSON.stringify(response.candidates, null, 2));
    console.log('[DEBUG] Function Calls:', JSON.stringify(response.functionCalls, null, 2));

    const textResponse = processResponse(response);

    // Handle all function calls in sequence
    if (response.functionCalls && response.functionCalls.length > 0) {
      // Show initial explanation
      if (textResponse) {
        console.log('AI:', textResponse);
        chatHistory.push({ role: 'assistant', content: textResponse });
      }

      // Execute each function call in sequence
      for (const funcCall of response.functionCalls) {
        console.log('[DEBUG] Function Call:', JSON.stringify(funcCall, null, 2));

        // Extract parameters from any of the possible properties
        const params = funcCall.args || {};

        validateToolCall(funcCall, params);

        console.log(`[LOG] Executing tool: ${funcCall.name} with parameters:`, JSON.stringify(params, null, 2));
        const toolResult = await executeTool(funcCall.name!, params);
        console.log('[LOG] Tool result:', toolResult);

        if (!toolResult.success) {
          throw new Error(`Tool execution failed: ${toolResult.error}`);
        }

        // Append tool result to chat history
        chatHistory.push({
          role: 'tool',
          name: funcCall.name,
          content: JSON.stringify(toolResult),
        });

        chatHistory.push({
          role: 'system',
          content: followUpPrompt
        });

        const followUpResponse = await genAI.models.generateContent({
          model: 'gemini-2.0-flash-001',
          contents: chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n'),
          config: {
            tools: [{ functionDeclarations: fileFunctionDeclarations }],
          },
        });

        const followUpText = processResponse(followUpResponse);

        if (followUpText) {
          console.log('AI:', followUpText);
          chatHistory.push({ role: 'assistant', content: followUpText });
        }
      }
    } else {
      console.log('AI:', textResponse);
      chatHistory.push({ role: 'assistant', content: textResponse });
    }
  } catch (error: any) {
    console.error('Error processing request:', error.message);
  }
}

console.log('Welcome to the GemChat CLI Chatbot with file system tools.');
rl.prompt();

rl.on('line', async (line) => {
  await processInput(line.trim());
  rl.prompt();
}).on('close', () => {
  console.log('Exiting chatbot. Goodbye!');
  process.exit(0);
});
