import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
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
} from './src/tools';

const server = new McpServer({
  name: 'gemchat-tools',
  version: '1.0.0',
});

// Register tools
server.registerTool(
  'listDirectory',
  {
    title: 'List Directory',
    description: 'List files and directories in a directory with basic metadata.',
    inputSchema: {
      directory: z.string().optional(),
    },
  },
  async ({ directory }) => {
    const result = listDirectoryTool({ directory });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  'readFile',
  {
    title: 'Read File',
    description: 'Read the contents of a specified file.',
    inputSchema: {
      fileName: z.string(),
    },
  },
  async ({ fileName }) => {
    const result = readFileTool({ fileName });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  'createFile',
  {
    title: 'Create File',
    description: 'Create a file with the specified content.',
    inputSchema: {
      fileName: z.string(),
      content: z.string(),
    },
  },
  async ({ fileName, content }) => {
    const result = createFileTool({ fileName, content });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  'updateFile',
  {
    title: 'Update File',
    description: 'Update an existing file with new content.',
    inputSchema: {
      fileName: z.string(),
      content: z.string(),
    },
  },
  async ({ fileName, content }) => {
    const result = updateFileTool({ fileName, content });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  'createFolder',
  {
    title: 'Create Folder',
    description: 'Create a new folder in the specified path.',
    inputSchema: {
      folderPath: z.string(),
    },
  },
  async ({ folderPath }) => {
    const result = createFolderTool({ folderPath });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  'deleteFolder',
  {
    title: 'Delete Folder',
    description: 'Delete a folder and its contents.',
    inputSchema: {
      folderPath: z.string(),
      recursive: z.boolean().optional(),
    },
  },
  async ({ folderPath, recursive }) => {
    const result = deleteFolderTool({ folderPath, recursive });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  'renameFolder',
  {
    title: 'Rename Folder',
    description: 'Rename a folder.',
    inputSchema: {
      oldPath: z.string(),
      newPath: z.string(),
    },
  },
  async ({ oldPath, newPath }) => {
    const result = renameFolderTool({ oldPath, newPath });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  'searchFiles',
  {
    title: 'Search Files',
    description: 'Search for files in a directory matching a pattern.',
    inputSchema: {
      directory: z.string().optional(),
      pattern: z.string(),
      recursive: z.boolean().optional(),
    },
  },
  async ({ directory, pattern, recursive }) => {
    const result = searchFilesTool({ directory, pattern, recursive });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  'moveFile',
  {
    title: 'Move File',
    description: 'Move a file from one location to another.',
    inputSchema: {
      sourcePath: z.string(),
      destinationPath: z.string(),
    },
  },
  async ({ sourcePath, destinationPath }) => {
    const result = moveFileTool({ sourcePath, destinationPath });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.registerTool(
  'copyFile',
  {
    title: 'Copy File',
    description: 'Copy a file from one location to another.',
    inputSchema: {
      sourcePath: z.string(),
      destinationPath: z.string(),
    },
  },
  async ({ sourcePath, destinationPath }) => {
    const result = copyFileTool({ sourcePath, destinationPath });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// Start the MCP server on stdio
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.log('MCP server started (stdio)');
});
