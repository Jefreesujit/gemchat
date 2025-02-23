#!/usr/bin/env node

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let apiKey: string | undefined = process.env.GEMINI_API_KEY;

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

interface ChatHistory {
  role: 'user' | 'model';
  parts: string;
}

let chatHistory: ChatHistory[] = [{
  role: 'user',
  parts: 'You are GemChat, a friendly and helpful AI assistant. You are designed to run on the command line and answer questions. So respond in a way that is easy to read and understand. Do not use markdown or any other formatting.',
}, {
  role: 'model',
  parts: 'Hello! How can I assist you today?',
}];

const fetchChatHistory = (): ChatHistory[] => (chatHistory);

const updateChatHistory = (userMessage: string, modelResponse: string): void => {
  chatHistory.push({ role: 'user', parts: userMessage });
  chatHistory.push({ role: 'model', parts: modelResponse });
}

const genAI = new GoogleGenerativeAI(apiKey || '');

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });

const sendMessage = async (message: string): Promise<string> => {
  const userHistory = fetchChatHistory();
  const chat = model.startChat({
    history: userHistory || [],
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });

  const result = await chat.sendMessageStream(message);
  let fullResponse = '';
  process.stdout.write("AI: ");

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    process.stdout.write(chunkText);
    fullResponse += chunkText;
  }
  process.stdout.write("\n");

  updateChatHistory(message, fullResponse);
  return fullResponse;
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
