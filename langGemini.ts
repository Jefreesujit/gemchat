import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { HumanMessage, AIMessage, BaseMessage, MessageContent } from "@langchain/core/messages";
import { MessagesPlaceholder, ChatPromptTemplate, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const pageContext = "Sun shines in the sky. Birds are chirping. The weather is warm.";

const promptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate("You are GemChat, a helpful AI assistant. You will be answering questions based on the context provided: {context}. Just answer to the questions asked. Do not provide any additional information."),
  new MessagesPlaceholder("history"),
]);

let ChatHistory: BaseMessage[] = [
  new HumanMessage("Hey"),
  new AIMessage("Hello! How can I assist you today?"),
];

const content: BaseMessage[] = ChatHistory;

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
  content.push(new HumanMessage(message));

  const chain = promptTemplate.pipe(model);
  // console.log("promptTemplate", promptTemplate);
  const result = await chain.invoke({ context: pageContext, history: content });
  content.push(new AIMessage(result.content.toString()));
  return result.content;
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
