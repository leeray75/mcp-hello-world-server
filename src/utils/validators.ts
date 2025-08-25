/**
 * @fileoverview Input validation utilities for the MCP Hello World Server
 * @module utils/validators
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { GREETING_STYLES, AUDIENCE_TYPES, RESOURCE_URIS, TOOL_NAMES, PROMPT_NAMES } from './constants.js';

/**
 * Validation result structure
 * @description Contains validation outcome and error details
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Tool arguments validation interface
 * @description Type-safe structure for tool arguments
 */
export interface ToolArguments {
  /** Generic argument container */
  [key: string]: unknown;
}

/**
 * Prompt arguments validation interface
 * @description Type-safe structure for prompt arguments
 */
export interface PromptArguments {
  /** Generic argument container */
  [key: string]: unknown;
}

/**
 * Validate a string parameter
 * @param value - The value to validate
 * @param paramName - The parameter name for error messages
 * @param required - Whether the parameter is required
 * @param minLength - Minimum length requirement
 * @param maxLength - Maximum length requirement
 * @returns Validation result
 * @example
 * ```typescript
 * const result = validateString('Alice', 'name', true, 1, 50);
 * if (!result.isValid) {
 *   throw new Error(result.error);
 * }
 * ```
 */
export function validateString(
  value: unknown,
  paramName: string,
  required: boolean = true,
  minLength: number = 0,
  maxLength: number = Number.MAX_SAFE_INTEGER
): ValidationResult {
  // Check if value exists when required
  if (required && (value === undefined || value === null)) {
    return {
      isValid: false,
      error: `Parameter '${paramName}' is required`,
    };
  }

  // Allow undefined/null for optional parameters
  if (!required && (value === undefined || value === null)) {
    return { isValid: true };
  }

  // Check type
  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: `Parameter '${paramName}' must be a string`,
    };
  }

  // Check length constraints
  if (value.length < minLength) {
    return {
      isValid: false,
      error: `Parameter '${paramName}' must be at least ${minLength} characters long`,
    };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `Parameter '${paramName}' must be no more than ${maxLength} characters long`,
    };
  }

  return { isValid: true };
}

/**
 * Validate tool arguments for the say_hello tool
 * @param args - The tool arguments to validate
 * @returns Validation result
 * @example
 * ```typescript
 * const result = validateSayHelloArgs({ name: 'Alice', message: 'Hi there' });
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateSayHelloArgs(args: ToolArguments): ValidationResult {
  // Validate name parameter (required)
  const nameValidation = validateString(args.name, 'name', true, 1, 100);
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  // Validate message parameter (optional)
  if (args.message !== undefined) {
    const messageValidation = validateString(args.message, 'message', false, 0, 500);
    if (!messageValidation.isValid) {
      return messageValidation;
    }
  }

  return { isValid: true };
}

/**
 * Validate tool arguments for the get_time tool
 * @param args - The tool arguments to validate
 * @returns Validation result
 * @example
 * ```typescript
 * const result = validateGetTimeArgs({});
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateGetTimeArgs(args: ToolArguments): ValidationResult {
  // get_time tool doesn't require any arguments
  return { isValid: true };
}

/**
 * Validate prompt arguments for the greeting prompt
 * @param args - The prompt arguments to validate
 * @returns Validation result
 * @example
 * ```typescript
 * const result = validateGreetingArgs({ name: 'Alice', style: 'formal' });
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateGreetingArgs(args: PromptArguments): ValidationResult {
  // Validate name parameter (required)
  const nameValidation = validateString(args.name, 'name', true, 1, 100);
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  // Validate style parameter (optional)
  if (args.style !== undefined) {
    const styleValidation = validateString(args.style, 'style', false);
    if (!styleValidation.isValid) {
      return styleValidation;
    }

    // Check if style is a valid option
    const validStyles = Object.values(GREETING_STYLES);
    if (!validStyles.includes(args.style as typeof validStyles[number])) {
      return {
        isValid: false,
        error: `Parameter 'style' must be one of: ${validStyles.join(', ')}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate prompt arguments for the introduction prompt
 * @param args - The prompt arguments to validate
 * @returns Validation result
 * @example
 * ```typescript
 * const result = validateIntroductionArgs({ audience: 'developer' });
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateIntroductionArgs(args: PromptArguments): ValidationResult {
  // Validate audience parameter (optional)
  if (args.audience !== undefined) {
    const audienceValidation = validateString(args.audience, 'audience', false);
    if (!audienceValidation.isValid) {
      return audienceValidation;
    }

    // Check if audience is a valid option
    const validAudiences = Object.values(AUDIENCE_TYPES);
    if (!validAudiences.includes(args.audience as typeof validAudiences[number])) {
      return {
        isValid: false,
        error: `Parameter 'audience' must be one of: ${validAudiences.join(', ')}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate a resource URI
 * @param uri - The URI to validate
 * @returns Validation result
 * @example
 * ```typescript
 * const result = validateResourceUri('data://users');
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateResourceUri(uri: string): ValidationResult {
  const validUris = Object.values(RESOURCE_URIS);
  
  if (!validUris.includes(uri as typeof validUris[number])) {
    return {
      isValid: false,
      error: `Unknown resource URI: ${uri}. Valid URIs are: ${validUris.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate a tool name
 * @param toolName - The tool name to validate
 * @returns Validation result
 * @example
 * ```typescript
 * const result = validateToolName('say_hello');
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateToolName(toolName: string): ValidationResult {
  const validTools = Object.values(TOOL_NAMES);
  
  if (!validTools.includes(toolName as typeof validTools[number])) {
    return {
      isValid: false,
      error: `Unknown tool: ${toolName}. Valid tools are: ${validTools.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate a prompt name
 * @param promptName - The prompt name to validate
 * @returns Validation result
 * @example
 * ```typescript
 * const result = validatePromptName('greeting');
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validatePromptName(promptName: string): ValidationResult {
  const validPrompts = Object.values(PROMPT_NAMES);
  
  if (!validPrompts.includes(promptName as typeof validPrompts[number])) {
    return {
      isValid: false,
      error: `Unknown prompt: ${promptName}. Valid prompts are: ${validPrompts.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate tool arguments based on tool name
 * @param toolName - The name of the tool
 * @param args - The arguments to validate
 * @returns Validation result
 * @throws Error if tool name is invalid
 * @example
 * ```typescript
 * const result = validateToolArguments('say_hello', { name: 'Alice' });
 * if (!result.isValid) {
 *   throw new Error(result.error);
 * }
 * ```
 */
export function validateToolArguments(toolName: string, args: ToolArguments): ValidationResult {
  // First validate the tool name
  const toolNameValidation = validateToolName(toolName);
  if (!toolNameValidation.isValid) {
    return toolNameValidation;
  }

  // Validate arguments based on tool
  switch (toolName) {
    case TOOL_NAMES.SAY_HELLO:
      return validateSayHelloArgs(args);
    case TOOL_NAMES.GET_TIME:
      return validateGetTimeArgs(args);
    default:
      return {
        isValid: false,
        error: `No validation defined for tool: ${toolName}`,
      };
  }
}

/**
 * Validate prompt arguments based on prompt name
 * @param promptName - The name of the prompt
 * @param args - The arguments to validate
 * @returns Validation result
 * @throws Error if prompt name is invalid
 * @example
 * ```typescript
 * const result = validatePromptArguments('greeting', { name: 'Alice' });
 * if (!result.isValid) {
 *   throw new Error(result.error);
 * }
 * ```
 */
export function validatePromptArguments(promptName: string, args: PromptArguments): ValidationResult {
  // First validate the prompt name
  const promptNameValidation = validatePromptName(promptName);
  if (!promptNameValidation.isValid) {
    return promptNameValidation;
  }

  // Validate arguments based on prompt
  switch (promptName) {
    case PROMPT_NAMES.GREETING:
      return validateGreetingArgs(args);
    case PROMPT_NAMES.INTRODUCTION:
      return validateIntroductionArgs(args);
    default:
      return {
        isValid: false,
        error: `No validation defined for prompt: ${promptName}`,
      };
  }
}
