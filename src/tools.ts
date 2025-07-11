/* -----------------Globals--------------- */
import * as fs from 'fs';
import * as path from 'path';
import { traceable } from 'langsmith/traceable';

/* -----------------Tools--------------- */

function searchSimilarFiles(inputName: string): string[] {
  const directory = process.cwd();
  const files = fs.readdirSync(directory);
  // Simple fuzzy matching: case-insensitive substring match
  const lowerInput = inputName.toLowerCase();
  return files.filter(file => file.toLowerCase().includes(lowerInput));
}

const listDirectoryTool = traceable((params: any = {}): any => {
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
});

const readFileTool = traceable((params: any = {}): any => {
  // Validate parameters
  if (!params || typeof params !== 'object') {
    return { success: false, error: 'Invalid parameters: expected an object' };
  }
  const fileName = params.fileName;
  if (!fileName || typeof fileName !== 'string') {
    return { success: false, error: 'Invalid or missing fileName parameter' };
  }
  const fullPath = path.join(process.cwd(), fileName);
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
});

const createFileTool = traceable((params: any = {}): any => {
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
});

const updateFileTool = traceable((params: any = {}): any => {
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
});

const createFolderTool = traceable((params: any = {}): any => {
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
});

const deleteFolderTool = traceable((params: any = {}): any => {
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
});

const renameFolderTool = traceable((params: any = {}): any => {
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
});

const searchFilesTool = traceable((params: any = {}): any => {
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
});

const moveFileTool = traceable((params: any = {}): any => {
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
});

const copyFileTool = traceable((params: any = {}): any => {
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
});

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

export {
  listDirectoryTool,
  readFileTool,
  createFileTool,
  updateFileTool,
  createFolderTool,
  deleteFolderTool,
  renameFolderTool,
  searchFilesTool,
  moveFileTool,
  copyFileTool,
};
