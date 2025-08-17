import { LLMPrompter } from './llm-prompter.js';
import { ChatMatcher } from './chat-matcher.js';
import { generateChatId } from './utils.js';

export class ChatController {
  constructor() {
    this.currentChat = {
      id: null,
      messages: [],
      summary: null,
      embedding: null
    };
    
    this.llmPrompter = new LLMPrompter();
    this.chatMatcher = new ChatMatcher();
    this.isProcessing = false;
    this.onMatchFound = null; // Callback for when matches are found
    this.onMessageReceived = null; // Callback for new messages
  }

  async initialize() {
    try {
      await this.chatMatcher.loadChats();
      this.startNewChat();
      console.log('ChatController initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize ChatController:', error);
      return false;
    }
  }

  startNewChat() {
    const chatId = generateChatId(`chat_${Date.now()}_${Math.random()}`);
    this.currentChat = {
      id: chatId,
      messages: [],
      summary: null,
      embedding: null
    };
    console.log(`Started new chat: ${chatId}`);
  }

  async sendMessage(userMessage) {
    if (this.isProcessing) {
      throw new Error('Already processing a message. Please wait.');
    }

    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    this.isProcessing = true;

    try {
      // Add user message to current chat
      this.currentChat.messages.push({
        role: 'user',
        content: userMessage.trim(),
        timestamp: new Date().toISOString()
      });

      // Get response from LLM
      const response = await this.llmPrompter.sendMessage(
        this.currentChat.messages.map(m => ({ role: m.role, content: m.content }))
      );

      // Add assistant response to current chat
      this.currentChat.messages.push({
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      });

      // Trigger callback for new message
      if (this.onMessageReceived) {
        this.onMessageReceived({
          userMessage,
          assistantResponse: response.content,
          messageCount: this.currentChat.messages.length
        });
      }

      // Generate summary and check for matches after each exchange
      await this.updateSummaryAndCheckMatches();

      return {
        response: response.content,
        messageCount: this.currentChat.messages.length,
        usage: response.usage
      };

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async updateSummaryAndCheckMatches() {
    try {
      // Generate summary from current conversation
      console.log('Generating summary for current chat...');
      const summary = await this.llmPrompter.generateSummary(this.currentChat.messages);
      this.currentChat.summary = summary;

      // Generate embedding from summary
      console.log('Generating embedding for current chat...');
      const embeddingText = this.llmPrompter.createEmbeddingText(summary);
      const embedding = await this.llmPrompter.generateEmbedding(embeddingText);
      this.currentChat.embedding = embedding;

      // Find matches
      console.log('Checking for matches...');
      const matches = this.chatMatcher.findMatches(embedding, this.currentChat.id);

      if (matches.length > 0) {
        console.log(`Found ${matches.length} matches for current chat`);
        
        // Trigger callback for matches
        if (this.onMatchFound) {
          this.onMatchFound(matches);
        }
      }

      return {
        summary,
        matches,
        embedding: embedding.slice(0, 5) // Only return first 5 dimensions for logging
      };

    } catch (error) {
      console.error('Error updating summary and checking matches:', error);
      throw error;
    }
  }

  // Get current chat state
  getCurrentChat() {
    return {
      id: this.currentChat.id,
      messages: [...this.currentChat.messages],
      messageCount: this.currentChat.messages.length,
      summary: this.currentChat.summary,
      hasEmbedding: !!this.currentChat.embedding
    };
  }

  // Get formatted conversation for display
  getFormattedConversation() {
    return this.currentChat.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      displayRole: msg.role === 'user' ? 'You' : 'Assistant'
    }));
  }

  // Set callback functions
  setMatchFoundCallback(callback) {
    this.onMatchFound = callback;
  }

  setMessageReceivedCallback(callback) {
    this.onMessageReceived = callback;
  }

  // Get stats about the matcher
  getMatcherStats() {
    return this.chatMatcher.getStats();
  }

  // Test functionality with existing chats
  async testWithExistingChat(chatId) {
    const existingChat = this.chatMatcher.getChatById(chatId);
    if (!existingChat) {
      throw new Error(`Chat ${chatId} not found`);
    }

    const matches = this.chatMatcher.findMatches(existingChat.embedding, chatId);
    return {
      chatId,
      topic: existingChat.topic,
      summary: existingChat.summary,
      matches
    };
  }

  // Reset to start over
  reset() {
    this.startNewChat();
    console.log('Chat controller reset');
  }
}