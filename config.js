// Configuration for the chat matchmaker skateboard
export const config = {
  // OpenAI API configuration
  openai: {
    apiKey: 'your-openai-api-key-here', // Replace with your actual API key
    chatModel: 'gpt-3.5-turbo',
    embeddingModel: 'text-embedding-3-small',
    apiUrl: {
      chat: 'https://api.openai.com/v1/chat/completions',
      embeddings: 'https://api.openai.com/v1/embeddings'
    }
  },

  // Matching configuration
  matching: {
    similarityThreshold: 0.7, // Minimum cosine similarity for a match
    maxMatches: 5 // Maximum number of matches to show
  },

  // Chat generation configuration
  chatGeneration: {
    maxMessages: 10, // Maximum messages per generated chat
    systemPrompt: 'You are a helpful, conversational AI assistant. Engage naturally with the user about their topic of interest.'
  },

  // File paths
  files: {
    chatsJson: './chats.json'
  }
};