import { Configuration, OpenAIApi, ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum, ResponseTypes } from 'openai-edge';
import * as readline from "readline";
import dotenv from 'dotenv';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const {
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_API_VERSION,
  AZURE_OPENAI_RESOURCE_NAME
} = process.env;

const config = new Configuration({
  apiKey: AZURE_OPENAI_API_KEY as string,
  baseOptions: {
    headers: {
      "api-key": AZURE_OPENAI_API_KEY as string,
    },
  },
  basePath: `https://${AZURE_OPENAI_RESOURCE_NAME as string}.openai.azure.com/openai/deployments/gpt-35-turbo`,
  defaultQueryParams: new URLSearchParams({
    "api-version": AZURE_OPENAI_API_VERSION as string || "2023-03-15-preview",
  }),
})

const openai = new OpenAIApi(config);

let chatMessages: ChatCompletionRequestMessage[] = [{
  role: ChatCompletionRequestMessageRoleEnum.System,
  content: 'You are OpenChat, a helpful AI assistant.',
}];

const chatFunction = async (input: string): Promise<string> => {
  chatMessages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: input });
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: chatMessages,
    temperature: 0,
  });

  const data = await (completion.json()) as ResponseTypes["createChatCompletion"];
  const response = data.choices[0].message?.content;
  chatMessages.push({ role: ChatCompletionRequestMessageRoleEnum.System, content: response });
  return response as string;
}

const askQuestion = (): void => {
  rl.question("You: ", async (input: string) => {
    if (input.toLowerCase() === "quit") {
      rl.close();
      return;
    }
    const response = await chatFunction(input);
    console.log("AI: " + response);
    askQuestion();
  });
};

console.log("Start chatting with the AI (type 'quit' to exit)...");
askQuestion();
