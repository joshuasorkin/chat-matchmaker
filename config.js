// Configuration for the chat matchmaker skateboard
import 'dotenv/config';

export const config = {
  // OpenAI API configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here', // Set in .env file
    chatModel: process.env.CHAT_MODEL || 'gpt-3.5-turbo',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    apiUrl: {
      chat: 'https://api.openai.com/v1/chat/completions',
      embeddings: 'https://api.openai.com/v1/embeddings'
    }
  },

  // Matching configuration
  matching: {
    similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.7, // Minimum cosine similarity for a match
    maxMatches: parseInt(process.env.MAX_MATCHES) || 5 // Maximum number of matches to show
  },

  // Chat generation configuration
  chatGeneration: {
    maxMessages: parseInt(process.env.MAX_MESSAGES) || 10, // Maximum messages per generated chat
    systemPrompt: process.env.SYSTEM_PROMPT || 'You are a helpful, conversational AI assistant. Engage naturally with the user about their topic of interest.'
  },

  // File paths
  files: {
    chatsJson: './chats.json'
  }
};