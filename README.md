# GemChat

GemChat is a AI powered CLI assistant with file system capabilities. Built with TypeScript, it provides an interactive interface for communicating with the Gemini AI model and includes tools to perform file system operations.

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

1. Set up your Gemini API key using one of these methods:

   **Option 1: Environment file**
   ```bash
   # Create a .env file in the project root
   echo "GEMINI_API_KEY=your-api-key" > .env
   ```

   **Option 2: Shell configuration**
   ```bash
   # Add to .bashrc or .zshrc
   echo 'export GEMINI_API_KEY=your-api-key' >> ~/.bashrc
   source ~/.bashrc
   ```

   **Option 3: Direct export**
   ```bash
   export GEMINI_API_KEY=your-api-key
   ```

   **Optional Environment Variables**
   ```bash
   # Enable Langchain tracing (default: false)
   export LANGCHAIN_TRACING=true

   # Set Gemini model (default: 'gemini-2.0-flash')
   # Options: 'gemini-2.0-flash', 'gemini-2.5-pro-exp-03-25', 'gemini-2.0-flash-thinking-exp-01-21'
   export GEMINI_MODEL=gemini-2.0-flash
   ```

2. Run GemChat:
   ```bash
   npx gemchat
   ```

## Usage Examples

GemChat supports various file system operations through natural language commands:

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
   git clone https://github.com/jefreesujit/gemchat.git
   cd gemchat
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

Thank you for your interest in contributing to GemChat!
