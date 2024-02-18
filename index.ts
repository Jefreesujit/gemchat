import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
  parts: 'You are an helpful AI assistant.',
}, {
  role: 'model',
  parts: '',
}];

const fetchChatHistory = (): ChatHistory[] => (chatHistory);

const updateChatHistory = (userMessage: string, modelResponse: string): void => {
  chatHistory.push({ role: 'user', parts: userMessage });
  chatHistory.push({ role: 'model', parts: modelResponse });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });

const sendMessage = async (message: string): Promise<string> => {
  const userHistory = fetchChatHistory();
  const chat = model.startChat({
    history: userHistory || [],
    generationConfig: {
      maxOutputTokens: 100,
    },
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  const text = response.text();
  updateChatHistory(message, text);
  return text;
};

const askQuestion = (): void => {
  rl.question("You: ", async (input: string) => {
    if (input.toLowerCase() === "quit") {
      console.log("Exiting chat...");
      rl.close();
      return;
    }
    const response = await sendMessage(input);
    console.log("AI: " + response);
    askQuestion();
  });
};

console.log("Start chatting with the AI (type 'quit' to exit)...");
askQuestion();
