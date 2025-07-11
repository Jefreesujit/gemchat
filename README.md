# Cliffer

Cliffer is a AI powered CLI assistant with file system capabilities. Built with TypeScript, it provides an interactive interface for communicating with the Gemini AI model and includes tools to perform file system operations.

> **Disclaimer**: This project is not affiliated with, endorsed by, or associated with Google or the Gemini AI team. It is an independent project created for development and testing purposes only.

## Features

- Interactive CLI-based chat interface
- File system operations through natural language
- Smart context handling
- Error recovery and graceful degradation

## Prerequisites

- Node.js v18 or higher
- npm v8 or higher
- A Gemini API key (Get one for free at https://makersuite.google.com/app/apikey)

## Installation & Setup

1. Install Cliffer globally:
```bash
npm install -g cliffer
```

2. Set up your Gemini API key using one of these methods:

**Option 1: Shell configuration**
```bash
# Add to .bashrc or .zshrc
echo 'export GEMINI_API_KEY=your-api-key' >> ~/.bashrc
source ~/.zshrc
```

**Option 2: Direct export**
```bash
export GEMINI_API_KEY=your-api-key
```

3. Run Cliffer with available options:
   ```bash
   cliffer [options]
   ```

   Alternatively, you can run without installing globally using npx:
   ```bash
   npx cliffer [options]
   ```

   **Available Options:**
   ```bash
   Options:
     -V, --version            output version number
     -k, --key <key>         Gemini API key (can also use GEMINI_API_KEY env var)
     -m, --model <name>      Gemini model to use (default: "gemini-2.0-flash")
     -l, --langsmith-key <key>  LangSmith API key for tracing (can also use LANGSMITH_API_KEY env var)
     -t, --tracing           Enable tracing with LangSmith (default: false)
     -h, --no-history        Disable chat history saving
     --help                  display help for command
   ```

   **Examples:**
   ```bash
   # Using global installation
   cliffer --key your-api-key
   cliffer --model gemini-2.5-pro-exp-03-25

   # Using npx
   npx cliffer --key your-api-key
   npx cliffer --tracing --langsmith-key your-langsmith-key
   ```

---

## Cliffer File System MCP Server

Cliffer includes a File System MCP (Model Context Protocol) server that exposes file and folder operations as MCP tools. This allows any MCP-compatible client to connect and interact with your local file system securely through the Cliffer server.

### Starting the MCP Server

To start the Cliffer MCP server (for file system operations):

```bash
npx cliffer mcp
# or, if installed globally
cliffer mcp
```

This will launch the server on standard input/output (stdio) and register all available file system tools (list, read, create, update, move, copy, delete, etc.).

---

### Connecting from Editors & Desktop Apps (VSCode, Cursor, Claude Desktop)

Many modern editors and AI desktop apps now support the Model Context Protocol (MCP) for native tool integration. You can connect Cliffer's MCP server to these apps by providing a simple `mcp.json` configuration file.

#### Example `mcp.json` for stdio (recommended for local Cliffer):

```json
{
   "mcpServers": {
      "cliffer": {
         "command": "npx",
         "args": ["cliffer", "mcp"],
         "env": {}
      }
   }
}
```

- Place this file where your editor/AI app expects MCP configs (see its documentation).
- For VSCode (with MCP extension), open the MCP panel, click "Add MCP Server", and select or paste this config.
- For Cursor/Claude Desktop, use their "Connect MCP Tool" or similar menu and provide this config.
- You can use `npx cliffer mcp` in the `command` field if not installed globally.

> **Tip:** You can run multiple MCP servers for different projects or scopes by customizing the `cwd` or `args`.

---

### Available MCP Tools

- listDirectory
- readFile
- createFile
- updateFile
- createFolder
- deleteFolder
- renameFolder
- searchFiles
- moveFile
- copyFile

Each tool is fully typed and described in the server for easy client discovery.

### Connecting from a MCP Client

To connect to the Cliffer MCP server from an MCP-compatible client:

1. **Ensure the server is running** (see above).
2. **Configure your client** to connect via stdio, or use a compatible MCP client library that supports stdio transport.

#### Example using @modelcontextprotocol/sdk (Node.js):

```js
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['cliffer', 'mcp'], // or ['node', 'dist/mcp-server.js'] if running locally
});
const client = new McpClient(transport);
await client.connect();

// List directory
const response = await client.callTool('listDirectory', { directory: '.' });
console.log(response);
```

See the [Model Context Protocol documentation](https://modelcontext.org/) for more details and client libraries.

#### Example using CLI (if available):

Some MCP clients provide a CLI interface to connect to an MCP server. Refer to your client's documentation for details.

### Security Note

- The Cliffer MCP server exposes your local file system via tools. **Run it only in trusted environments.**
- Only the directory where the server is started (and its subdirectories) are accessible.

---

## Usage Examples

Cliffer supports various file system operations through natural language commands:

1. **File Operations**
   ```bash
   # Read files
   > Show me the contents of config.json

   # Create files
   > Create a new file called hello.js with a simple Hello World program

   # Update files
   > Add error handling to the main function in index.js

   # Get file/directory info
   > What's the size of the images directory?
   ```

2. **Folder Operations**
   ```bash
   # Create new folders
   > Create a folder called src/components

   # Move folders
   > Move the utils folder into src

   # Rename folders
   > Rename the helpers folder to utils

   # Delete folders
   > Delete the temp directory
   ```

3. **Search Operations**
   ```bash
   # Find files by pattern
   > Find all JavaScript files in the src directory

   # Search with recursive option
   > Search for files containing "test" in all directories
   ```

4. **File Management**
   ```bash
   # Copy files
   > Copy config.dev.json to config.prod.json

   # Move files
   > Move old-readme.md to docs/archive.md

   # List directory contents
   > Show me what's in the src folder
   ```

5. **Common Use Cases**
   ```bash
   # Setting up a new project structure
   > Create a new React project structure with components, styles, and utils folders

   # Bulk file operations
   > Move all test files into the __tests__ directory

   # Project cleanup
   > Delete all temporary files ending with .tmp
   ```

## Local Development

To set up the project for local development:

1. Clone the repository:
   ```bash
   git clone https://github.com/jefreesujit/cliffer.git
   cd cliffer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   GEMINI_API_KEY=your-api-key
   ```

4. Start in development mode:
   ```bash
   npm run start
   ```

5. For debugging, use the DEBUG environment variable:
   ```bash
   DEBUG=true npm run start
   ```

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

- Use the GitHub issue tracker
- Include steps to reproduce
- Attach relevant logs or screenshots
- Specify your environment details

### Making Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Follow the existing TypeScript conventions
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

## License

This project is licensed under the MIT License - see the LICENSE file for details.



Before contributing, please make sure to read and follow our Code of Conduct.

Thank you for your interest in contributing to Cliffer!
