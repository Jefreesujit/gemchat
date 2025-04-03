import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import * as readline from 'readline';

/* -----------------Local Imports--------------- */
import { systemPrompt } from './src/prompts';
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

async function processInput(input: string) {
  chatHistory.push({ role: 'user', content: input });

  try {
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

    // Check if the AI returned a function call.
    if (response.functionCalls && response.functionCalls.length > 0) {
      // TODO: Trying with single function call for testing. Will revert back to multiple function calls.
      const funcCall = response.functionCalls[0];
      // @ts-ignore
      const params = funcCall.parameters || funcCall.arguments || {};
      console.log(`[LOG] Executing tool: ${funcCall.name} with parameters: ${JSON.stringify(params)}`);
      const toolResult = await executeTool(genAI, funcCall.name!, params);
      console.log('[LOG] Tool result:', toolResult);

      chatHistory.push({
        role: 'tool',
        name: funcCall.name,
        content: JSON.stringify(toolResult),
      });

      // Send tool response back to the AI for a follow-up.
      const followUpResponse = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n'),
        config: {
          tools: [{ functionDeclarations: fileFunctionDeclarations }],
        },
      });
      console.log('AI:', followUpResponse.text);
      chatHistory.push({ role: 'assistant', content: followUpResponse.text! });
    } else {
      console.log('AI:', response.text);
      chatHistory.push({ role: 'assistant', content: response.text! });
    }
  } catch (error: any) {
    console.error('Error communicating with AI:', error);
  }
}

console.log('Welcome to the CLI AI Chatbot with file system tools.');
rl.prompt();

rl.on('line', async (line) => {
  await processInput(line.trim());
  rl.prompt();
}).on('close', () => {
  console.log('Exiting chatbot. Goodbye!');
  process.exit(0);
});
