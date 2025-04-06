/* -----------------Globals--------------- */
import { FunctionDeclaration, Type } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

/* -----------------Declarations--------------- */
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

const createFolderDeclaration: FunctionDeclaration = {
  name: 'createFolder',
  parameters: {
    type: Type.OBJECT,
    description: 'Create a new folder in the specified path.',
    properties: {
      folderPath: {
        type: Type.STRING,
        description: 'The path where the folder should be created.',
      },
    },
    required: ['folderPath'],
  },
};

const deleteFolderDeclaration: FunctionDeclaration = {
  name: 'deleteFolder',
  parameters: {
    type: Type.OBJECT,
    description: 'Delete a folder and its contents.',
    properties: {
      folderPath: {
        type: Type.STRING,
        description: 'The path of the folder to delete.',
      },
      recursive: {
        type: Type.BOOLEAN,
        description: 'Whether to recursively delete the folder contents.',
      },
    },
    required: ['folderPath'],
  },
};

const renameFolderDeclaration: FunctionDeclaration = {
  name: 'renameFolder',
  parameters: {
    type: Type.OBJECT,
    description: 'Rename a folder.',
    properties: {
      oldPath: {
        type: Type.STRING,
        description: 'The current path of the folder.',
      },
      newPath: {
        type: Type.STRING,
        description: 'The new path/name for the folder.',
      },
    },
    required: ['oldPath', 'newPath'],
  },
};

const searchFilesDeclaration: FunctionDeclaration = {
  name: 'searchFiles',
  parameters: {
    type: Type.OBJECT,
    description: 'Search for files in a directory matching a pattern.',
    properties: {
      directory: {
        type: Type.STRING,
        description: 'The directory to search in. If omitted, searches in current directory.',
      },
      pattern: {
        type: Type.STRING,
        description: 'The search pattern (glob pattern or text to search for).',
      },
      recursive: {
        type: Type.BOOLEAN,
        description: 'Whether to search recursively in subdirectories.',
      },
    },
    required: ['pattern'],
  },
};

const moveFileDeclaration: FunctionDeclaration = {
  name: 'moveFile',
  parameters: {
    type: Type.OBJECT,
    description: 'Move a file from one location to another.',
    properties: {
      sourcePath: {
        type: Type.STRING,
        description: 'The current path of the file.',
      },
      destinationPath: {
        type: Type.STRING,
        description: 'The destination path for the file.',
      },
    },
    required: ['sourcePath', 'destinationPath'],
  },
};

const copyFileDeclaration: FunctionDeclaration = {
  name: 'copyFile',
  parameters: {
    type: Type.OBJECT,
    description: 'Copy a file from one location to another.',
    properties: {
      sourcePath: {
        type: Type.STRING,
        description: 'The path of the file to copy.',
      },
      destinationPath: {
        type: Type.STRING,
        description: 'The destination path for the copy.',
      },
    },
    required: ['sourcePath', 'destinationPath'],
  },
};

export const fileFunctionDeclarations = [
  listDirectoryDeclaration,
  readFileDeclaration,
  createFileDeclaration,
  updateFileDeclaration,
  createFolderDeclaration,
  deleteFolderDeclaration,
  renameFolderDeclaration,
  searchFilesDeclaration,
  moveFileDeclaration,
  copyFileDeclaration,
];

/* -----------------Tools--------------- */

function searchSimilarFiles(inputName: string): string[] {
  const directory = process.cwd();
  const files = fs.readdirSync(directory);
  // Simple fuzzy matching: case-insensitive substring match
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
  // console.log('[DEBUG] readFileTool called with params:', JSON.stringify(params, null, 2));

  // Validate parameters
  if (!params || typeof params !== 'object') {
    return { success: false, error: 'Invalid parameters: expected an object' };
  }

  const fileName = params.fileName;
  // console.log('[DEBUG] Extracted fileName:', fileName);

  if (!fileName || typeof fileName !== 'string') {
    return { success: false, error: 'Invalid or missing fileName parameter' };
  }

  const fullPath = path.join(process.cwd(), fileName);
  // console.log('[DEBUG] Attempting to read file:', fullPath);

  if (!fs.existsSync(fullPath)) {
    const similar = searchSimilarFiles(fileName);
    return {
      success: false,
      error: `File '${fileName}' not found. Similar files: ${similar.join(', ')}`
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

function createFolderTool(params: any = {}): any {
  const { folderPath } = params;
  if (!folderPath) {
    return { success: false, error: 'Missing folderPath parameter.' };
  }
  const fullPath = path.join(process.cwd(), folderPath);
  try {
    fs.mkdirSync(fullPath, { recursive: true });
    return { success: true, message: `Folder '${folderPath}' created successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function deleteFolderTool(params: any = {}): any {
  const { folderPath, recursive = true } = params;
  if (!folderPath) {
    return { success: false, error: 'Missing folderPath parameter.' };
  }
  const fullPath = path.join(process.cwd(), folderPath);
  try {
    fs.rmSync(fullPath, { recursive, force: true });
    return { success: true, message: `Folder '${folderPath}' deleted successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function renameFolderTool(params: any = {}): any {
  const { oldPath, newPath } = params;
  if (!oldPath || !newPath) {
    return { success: false, error: 'Missing oldPath or newPath parameter.' };
  }
  const fullOldPath = path.join(process.cwd(), oldPath);
  const fullNewPath = path.join(process.cwd(), newPath);
  try {
    fs.renameSync(fullOldPath, fullNewPath);
    return { success: true, message: `Folder renamed from '${oldPath}' to '${newPath}' successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function searchFilesTool(params: any = {}): any {
  const { directory = '.', pattern, recursive = true } = params;
  if (!pattern) {
    return { success: false, error: 'Missing pattern parameter.' };
  }
  const fullPath = path.join(process.cwd(), directory);
  try {
    const results: string[] = [];
    function searchInDir(dir: string) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullItemPath = path.join(dir, item);
        const stat = fs.statSync(fullItemPath);
        if (stat.isFile() && item.toLowerCase().includes(pattern.toLowerCase())) {
          results.push(path.relative(process.cwd(), fullItemPath));
        } else if (stat.isDirectory() && recursive) {
          searchInDir(fullItemPath);
        }
      }
    }
    searchInDir(fullPath);
    return {
      success: true,
      results,
      message: `Found ${results.length} files matching pattern '${pattern}'`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function moveFileTool(params: any = {}): any {
  const { sourcePath, destinationPath } = params;
  if (!sourcePath || !destinationPath) {
    return { success: false, error: 'Missing sourcePath or destinationPath parameter.' };
  }
  const fullSourcePath = path.join(process.cwd(), sourcePath);
  const fullDestPath = path.join(process.cwd(), destinationPath);
  try {
    fs.renameSync(fullSourcePath, fullDestPath);
    return { success: true, message: `File moved from '${sourcePath}' to '${destinationPath}' successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function copyFileTool(params: any = {}): any {
  const { sourcePath, destinationPath } = params;
  if (!sourcePath || !destinationPath) {
    return { success: false, error: 'Missing sourcePath or destinationPath parameter.' };
  }
  const fullSourcePath = path.join(process.cwd(), sourcePath);
  const fullDestPath = path.join(process.cwd(), destinationPath);
  try {
    fs.copyFileSync(fullSourcePath, fullDestPath);
    return { success: true, message: `File copied from '${sourcePath}' to '${destinationPath}' successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeTool(functionName: string, params: any): Promise<any> {
  switch (functionName) {
    case 'listDirectory':
      return listDirectoryTool(params);
    case 'readFile':
      return readFileTool(params);
    case 'createFile':
      return createFileTool(params);
    case 'updateFile':
      return updateFileTool(params);
    case 'createFolder':
      return createFolderTool(params);
    case 'deleteFolder':
      return deleteFolderTool(params);
    case 'renameFolder':
      return renameFolderTool(params);
    case 'searchFiles':
      return searchFilesTool(params);
    case 'moveFile':
      return moveFileTool(params);
    case 'copyFile':
      return copyFileTool(params);
    default:
      return { success: false, error: 'Unknown function call.' };
  }
}
