#!/usr/bin/env node

/* -----------------Globals--------------- */
import { Command } from 'commander';
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import * as readline from 'readline';
import { traceable } from 'langsmith/traceable';
import { wrapSDK } from 'langsmith/wrappers';

/* -----------------Local Imports--------------- */
import { systemPrompt, followUpPrompt, errorHandlingPrompt } from './src/prompts';
import { fileFunctionDeclarations, executeTool } from './src/tools';
import {
  processResponse,
  validateToolCall,
  ChatHistory,
  saveChatHistory
} from './src/utils';

// Initialize commander
const program = new Command();

program
  .name('gemchat')
  .description('AI powered CLI assistant with file system capabilities')
  .version('2.0.3')
  .option('-k, --key <key>', 'Gemini API key (can also use GEMINI_API_KEY env var)')
  .option('-m, --model <name>', 'Gemini model to use', 'gemini-2.0-flash')
  .option('-l, --langsmith-key <key>', 'LangSmith API key for tracing (can also use LANGSMITH_API_KEY env var)')
  .option('-t, --tracing', 'Enable tracing with LangSmith', false)
  .option('-h, --no-history', 'Disable chat history saving')
  .parse();

const options = program.opts();

// Get API key from command line or environment
const GEMINI_API_KEY = options.key || process.env.GEMINI_API_KEY;
const LANGSMITH_API_KEY = options.langsmithKey || process.env.LANGSMITH_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Please provide Gemini API key via --key option or GEMINI_API_KEY environment variable");
  process.exit(1);
}

let genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Setup LangSmith if enabled
if (options.tracing && LANGSMITH_API_KEY) {
  genAI = wrapSDK(genAI);
} else if (options.tracing && !LANGSMITH_API_KEY) {
  console.warn("Tracing enabled but no LangSmith API key provided. Tracing will be disabled.");
}

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

const generateContent = traceable(async ({ toolCalling = false }: { toolCalling?: boolean } = {}) => {
  let defaultModel  = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const generateConfig = {
    model: options.model || defaultModel,
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
});

async function processInput(input: string) {
  addChatMessage('user', input);

  try {
    const response = await generateContent({ toolCalling: true });
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
        const { args = {} } = funcCall;

        validateToolCall(funcCall, args);

        const toolResult = await executeTool(funcCall.name!, args);

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

console.log('Welcome to GemChat, AI powered CLI assistant with file system capabilities.');
console.log(`Using model: ${options.model}`);
if (options.tracing) console.log('LangSmith tracing enabled');
if (!options.history) console.log('Chat history saving disabled');

rl.prompt();

rl.on('line', async (line) => {
  await processInput(line.trim());
  rl.prompt();
}).on('close', async () => {
  if (options.history) {
    console.log('\nSaving chat history before exit...');
    await saveChatHistory(chatHistory);
  }
  console.log('Exiting GemChat. Goodbye!');
  process.exit(0);
});
