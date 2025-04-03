import { fileFunctionDeclarations } from './tools';

export const validateToolCall = (funcCall: any, params: any): boolean => {
  // Validate required parameters
  const declaration = fileFunctionDeclarations.find(decl => decl.name === funcCall.name);
  if (declaration?.parameters?.required) {
    const missingParams = declaration.parameters.required.filter(param => !params[param]);
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters for ${funcCall.name}: ${missingParams.join(', ')}`);
    }
  }

  // For file creation/update operations, ensure content is not empty
  if ((funcCall.name === 'createFile' || funcCall.name === 'updateFile') &&
      (!params.content || (typeof params.content === 'string' && params.content.trim() === ''))) {
    throw new Error(`Empty content provided for ${funcCall.name} operation`);
  }

  return true;
};

export const processResponse = (response: any): string => {
  // Get the response parts with type checking
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No response candidates received');
  }

  const content = candidates[0].content;
  if (!content || !content.parts) {
    throw new Error('Invalid response content structure');
  }

  const responseParts = content.parts;
  let textResponse = '';

  // Process each part of the response
  for (const part of responseParts) {
    if (part?.text) {
      textResponse += part.text;
    }
  }

  return textResponse;
};
