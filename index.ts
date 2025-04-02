#!/usr/bin/env node

import { GoogleGenAI } from '@google/genai';
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let apiKey: string | undefined = process.env.GEMINI_API_KEY;

interface ChatHistory {
  role: 'user' | 'model' | 'tool';
  parts: [{
    text: string;
  }];
}

let chatHistory: ChatHistory[] = [{
  role: 'user',
  parts: [{
    text: 'You are GemChat, a friendly and helpful AI assistant. You are designed to run on the command line and answer questions. So respond in a way that is easy to read and understand. Do not use markdown or any other formatting.'
    }],
}, {
  role: 'model',
  parts: [{
    text: 'Hello! How can I assist you today?'
  }]
}];

const fetchChatHistory = (): ChatHistory[] => (chatHistory);

const updateChatHistory = (userMessage: string, modelResponse: string): void => {
  chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
  chatHistory.push({ role: 'model', parts: [{ text: modelResponse }] });
}
const genAI = new GoogleGenAI({ apiKey: apiKey || '' });

const loggerFunctionDeclaration = {
  name: "logger",
  description: "Logs a message to the console",
  parameters: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The message to log to the console"
      }
    }
  }
}

const loggerFunction = ({ message }: { message: string }): void => {
  console.log(`[LOG] ${new Date().toISOString()}]: ${message}`);
}

// Define a type for the function map
type FunctionMap = {
  [key: string]: (loggerArgs: any) => void;
};

const funcCallMap: FunctionMap = {
  logger: loggerFunction
};

const sendMessage = async (message: string) => {
  const userHistory = fetchChatHistory();
  userHistory.push({ role: 'user', parts: [{ text: message }] });
  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: chatHistory.map((msg) => `${msg.role}: ${msg.parts[0].text}`).join('\n'),
    config: {
      tools: [{
        // @ts-ignore
        functionDeclarations: [loggerFunctionDeclaration]
      }],
    },
  });

  if (response.functionCalls && response.functionCalls.length > 0) {
    for (const funcCall of response.functionCalls) {
      if (funcCall.name && funcCall.name in funcCallMap) {
        funcCallMap[funcCall.name](funcCall.args);
      }
    }
    chatHistory.push({ role: 'tool', parts: [{ text: response.functionCalls.map((call) => `${call.name}: ${call.args}`).join('\n') }] });
  } else {
    process.stdout.write("AI: ");
    process.stdout.write(response.text || '');
    chatHistory.push({ role: 'model', parts: [{ text: response.text || '' }] });
  }
};

const askQuestion = (): void => {
  rl.question("You: ", async (input: string) => {
    if (input.toLowerCase() === "quit") {
      console.log("Exiting chat...");
      rl.close();
      return;
    }
    await sendMessage(input);
    askQuestion();
  });
};

console.log("Start chatting with the AI (type 'quit' to exit)...");

const start = async () => {
  if (!apiKey) {
    rl.question("API Key not found. Please export the API key as an environment variable in bashrc/zshrc file~. \nOr run `export GEMINI_API_KEY=<your-api-key>` in your terminal. \nPress Enter to exit.", () => {
      rl.close();
      return;
    });
  } else {
    askQuestion();
  }
}

// start the chat
start();
