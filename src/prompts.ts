export const systemPrompt = `
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
