/* -----------------Globals--------------- */
import { FunctionDeclaration, Type } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

export const listDirectoryDeclaration: FunctionDeclaration = {
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

export const readFileDeclaration: FunctionDeclaration = {
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

export const createFileDeclaration: FunctionDeclaration = {
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

export const updateFileDeclaration: FunctionDeclaration = {
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

export const fileFunctionDeclarations = [
  listDirectoryDeclaration,
  readFileDeclaration,
  createFileDeclaration,
  updateFileDeclaration,
];

function searchSimilarFiles(inputName: string): string[] {
  const directory = process.cwd();
  const files = fs.readdirSync(directory);
  const lowerInput = inputName.toLowerCase();
  return files.filter(file => file.toLowerCase().includes(lowerInput));
}

export function listDirectoryTool(params: any = {}): any {
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

export function readFileTool(params: any = {}): any {
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

export function createFileTool(params: any = {}): any {
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

export function updateFileTool(params: any = {}): any {
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

export async function executeTool(genAI: any, functionName: string, params: any): Promise<any> {
  switch (functionName) {
    case 'listDirectory':
      return listDirectoryTool(params);
    case 'readFile':
      return readFileTool(params);
    case 'createFile':
      return createFileTool(params);
    case 'updateFile':
      return updateFileTool(params);
    default:
      return { success: false, error: 'Unknown function call.' };
  }
}
