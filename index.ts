import { GoogleGenAI, FunctionDeclaration, FunctionCallingConfigMode, Type } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

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

interface ChatHistory {
  role: 'system' | 'user' | 'tool' | 'assistant';
  name?: string;
  content: string;
}

const systemPrompt = `
### EXAMPLE

User: Hello
[Tool: listDirectory is executed in the background]
Tool result: { ... directory listing ... }
AI: Hey, What would you like me to do? I can read, create, or update files.

User: Summarize the contents of toolcontext.md in 5 points.
[Tool: readFile is executed with parameters: { "fileName": "toolContext.md" }]
Tool result: { error: "File 'toolcontext.md' not found. Did you mean one of these: toolContext.md, ..." }
AI: I couldn't find the file, the name might be misspelled. Did you mean one of these: toolContext.md, ..?

### EXAMPLE 2: Creating a File with Provided Content
User: Create a file named hello.js which logs "Hello, world!".
[Tool: createFile is executed with parameters: { "fileName": "hello.js", "content": "console.log('Hello, world!');" }]
Tool result: { success: true, message: "File 'hello.js' created successfully." }
AI: The file hello.js has been created.

### EXAMPLE 3: Chaining Content Generation for File Creation
User: No, I want you to generate the code for the file and then use it to write to the file hello.js.
[Tool: generateContent is executed with parameters: { "prompt": "Generate JavaScript code that logs 'Hello, world!'" } ]
Tool result: { success: true, content: "console.log('Hello, world!');" }
[Tool: createFile is executed with parameters: { "fileName": "hello.js", "content": "console.log('Hello, world!');" } ]
Tool result: { success: true, message: "File 'hello.js' created successfully." }
AI: The file hello.js has been created with the generated code.
`;

const chatHistory: ChatHistory[] = [{ role: 'system', content: systemPrompt }];

const listDirectoryDeclaration: FunctionDeclaration = {
  name: 'listDirectory',
  parameters: {
    type: Type.OBJECT,
    description: 'List files and directories in the current working directory with basic metadata.',
    properties: {
      directory: {
        type: Type.STRING,
        description: 'The directory to list. If omitted, the current working directory is used.',
      },
    },
  },
};

const readFileDeclaration: FunctionDeclaration = {
  name: 'readFile',
  parameters: {
    type: Type.OBJECT,
    description: 'Read the contents of a specified file.',
    properties: {
      fileName: {
        type: Type.STRING,
        description: 'The name or path of the file to be read.',
      },
    },
    required: ['fileName'],
  },
};

const createFileDeclaration: FunctionDeclaration = {
  name: 'createFile',
  parameters: {
    type: Type.OBJECT,
    description: 'Create a file with the specified content.',
    properties: {
      fileName: {
        type: Type.STRING,
        description: 'The name or path for the new file.',
      },
      content: {
        type: Type.STRING,
        description: 'The content to write into the file.',
      },
    },
    required: ['fileName', 'content'],
  },
};

const updateFileDeclaration: FunctionDeclaration = {
  name: 'updateFile',
  parameters: {
    type: Type.OBJECT,
    description: 'Update an existing file with new content (overwrites existing content).',
    properties: {
      fileName: {
        type: Type.STRING,
        description: 'The name or path of the file to be updated.',
      },
      content: {
        type: Type.STRING,
        description: 'The new content to write into the file.',
      },
    },
    required: ['fileName', 'content'],
  },
};

const generateContentDeclaration: FunctionDeclaration = {
  name: 'generateContent',
  parameters: {
    type: Type.OBJECT,
    description: 'Generate text content using the AI model, given a prompt.',
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'The prompt for generating content.',
      },
    },
    required: ['prompt'],
  },
};

const fileFunctionDeclarations = [
  listDirectoryDeclaration,
  readFileDeclaration,
  createFileDeclaration,
  updateFileDeclaration,
  generateContentDeclaration,
];


function searchSimilarFiles(inputName: string): string[] {
  const directory = process.cwd();
  const files = fs.readdirSync(directory);
  const lowerInput = inputName.toLowerCase();
  return files.filter(file => file.toLowerCase().includes(lowerInput));
}

function listDirectoryTool(params: any = {}): any {
  const directory = params?.directory || process.cwd();
  try {
    const items = fs.readdirSync(directory).map((item) => {
      const itemPath = path.join(directory, item);
      const stats = fs.statSync(itemPath);
      return {
        name: item,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
      };
    });
    return { success: true, items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function readFileTool(params: any = {}): any {
  console.log('[LOG] Reading file with parameters:', params);
  const fileName = params.fileName;
  if (!fileName) {
    return { success: false, error: 'No file path provided.' };
  }
  const fullPath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(fullPath)) {
    const similar = searchSimilarFiles(fileName);
    return {
      success: false,
      error: `File '${fileName}' not found. Did you mean: ${similar.join(', ')}?`
    };
  }
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function createFileTool(params: any = {}): any {
  const { fileName, content } = params;
  if (!fileName || content === undefined) {
    return { success: false, error: 'Missing fileName or content.' };
  }
  const fullPath = path.join(process.cwd(), fileName);
  try {
    fs.writeFileSync(fullPath, content, 'utf-8');
    return { success: true, message: `File '${fileName}' created successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function updateFileTool(params: any = {}): any {
  const { fileName, content } = params;
  if (!fileName || content === undefined) {
    return { success: false, error: 'Missing fileName or content.' };
  }
  const fullPath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(fullPath)) {
    return { success: false, error: `File '${fileName}' does not exist.` };
  }
  try {
    fs.writeFileSync(fullPath, content, 'utf-8');
    return { success: true, message: `File '${fileName}' updated successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function generateContentTool(params: any = {}): Promise<any> {
  const prompt = params.prompt;
  if (!prompt) {
    return { success: false, error: 'No prompt provided.' };
  }
  try {
    const genResponse = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    });
    return { success: true, content: genResponse.text };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function executeTool(functionName: string, params: any): Promise<any> {
  switch (functionName) {
    case 'listDirectory':
      return listDirectoryTool(params);
    case 'readFile':
      return readFileTool(params);
    case 'createFile':
      return createFileTool(params);
    case 'updateFile':
      return updateFileTool(params);
    case 'generateContent':
      return generateContentTool(params);
    default:
      return { success: false, error: 'Unknown function call.' };
  }
}

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
      const toolResult = await executeTool(funcCall.name!, params);
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
