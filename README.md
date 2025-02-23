# GemChat

GemChat is a simple CLI-based chatbot powered by Google's Gemini AI. It's built using TypeScript and provides an interactive interface for users to communicate with the Gemini AI model.

> **Disclaimer**: This project is not affiliated with, endorsed by, or associated with Google or the Gemini AI team. It is an independent project created for development and testing purposes only.

## Prerequisites

- Node.js v18 or higher
- npm v8 or higher
- A Gemini API key (Get one for free at https://makersuite.google.com/app/apikey)

## Usage

1. Set up your Gemini API key by either:
   - Adding it to your .bashrc or .zshrc file:
     ```bash
     echo 'export GEMINI_API_KEY=your-api-key' >> ~/.bashrc
     source ~/.bashrc
     ```
   - Or running it directly in your terminal:
     ```bash
     export GEMINI_API_KEY=your-api-key
     ```

2. Run GemChat using npx:
   ```bash
   npx gemchat
   ```

## Local Development

To set up and run the project locally:

1. Clone the repository to your local machine
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory:
   ```
   GEMINI_API_KEY=your-api-key
   ```
5. Start the development server:
   ```bash
   npm run start
   ```

## Contributing

We welcome contributions from the community. Here's how you can contribute:

- **Reporting bugs**: If you find a bug, please create an issue in the GitHub repository detailing the problem.

- **Submitting fixes**: If you've fixed a bug or made an improvement, please create a pull request. Make sure your code follows the existing style and all tests pass.

- **Improving documentation**: If you see an area where the documentation could be improved, feel free to make updates and submit a pull request.

Before contributing, please make sure to read and follow our Code of Conduct.

Thank you for your interest in contributing to GemChat!
