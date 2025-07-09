import { FunctionDeclaration, Type } from '@google/genai';

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

export {
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
