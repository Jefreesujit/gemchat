import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { HumanMessage, MessageContent, MessageContentComplex } from "@langchain/core/messages";
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

let content: MessageContentComplex[] = [{ type: 'text', text: 'You are GemChat, a helpful AI assistant.' }];

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  modelName: "gemini-pro",
  maxOutputTokens: 2048,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
  ],
});

const sendMessage = async (message: string): Promise<MessageContent> => {
  content.push({ type: 'text', text: message });
  const questions = [
    new HumanMessage({
      content: content,
    })
  ];

  const response = await model.chain(questions);
  console.log(response);
  return response.content;
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
