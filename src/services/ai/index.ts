import { OpenAIService } from './openAIService';

// Export a singleton instance of the OpenAI service
export const openAIService = new OpenAIService();

// Export the class for direct imports
export { OpenAIService }; 