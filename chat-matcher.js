import { cosineSimilarity } from './utils.js';
import { config } from './config.js';

export class ChatMatcher {
  constructor() {
    this.chats = [];
    this.threshold = config.matching.similarityThreshold;
    this.maxMatches = config.matching.maxMatches;
  }

  async loadChats() {
    try {
      const response = await fetch('./chats.json');
      if (!response.ok) {
        throw new Error(`Failed to load chats: ${response.status}`);
      }
      const data = await response.json();
      this.chats = data.filter(chat => chat.embedding); // Only include chats with embeddings
      console.log(`Loaded ${this.chats.length} chats with embeddings`);
      return this.chats;
    } catch (error) {
      console.error('Error loading chats:', error);
      this.chats = [];
      return [];
    }
  }

  findMatches(currentEmbedding, excludeChatId = null) {
    if (!currentEmbedding || !Array.isArray(currentEmbedding)) {
      console.warn('Invalid embedding provided to findMatches');
      return [];
    }

    const similarities = [];

    for (const chat of this.chats) {
      // Skip the current chat if excludeChatId is provided
      if (excludeChatId && chat.id === excludeChatId) {
        continue;
      }

      if (!chat.embedding || !Array.isArray(chat.embedding)) {
        console.warn(`Chat ${chat.id} has invalid embedding`);
        continue;
      }

      try {
        const similarity = cosineSimilarity(currentEmbedding, chat.embedding);
        
        if (similarity >= this.threshold) {
          similarities.push({
            chatId: chat.id,
            similarity: similarity,
            summary: chat.summary,
            topic: chat.topic,
            matchReason: this.generateMatchReason(chat.summary, similarity)
          });
        }
      } catch (error) {
        console.warn(`Error calculating similarity for chat ${chat.id}:`, error);
      }
    }

    // Sort by similarity (highest first) and limit results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.maxMatches);
  }

  generateMatchReason(summary, similarity) {
    const reasons = [];
    const simPercent = Math.round(similarity * 100);

    if (summary.topics && summary.topics.length > 0) {
      reasons.push(`shared interest in ${summary.topics.slice(0, 2).join(' and ')}`);
    }

    if (summary.communication_style) {
      reasons.push(`similar ${summary.communication_style} communication style`);
    }

    if (summary.personality_traits && summary.personality_traits.length > 0) {
      const traits = summary.personality_traits.slice(0, 2).join(' and ');
      reasons.push(`both ${traits}`);
    }

    const reasonText = reasons.length > 0 
      ? reasons.slice(0, 2).join(' and ')
      : 'similar conversation patterns';

    return `${simPercent}% match - ${reasonText}`;
  }

  // Get chat details by ID (useful for displaying match information)
  getChatById(chatId) {
    return this.chats.find(chat => chat.id === chatId);
  }

  // Get summary statistics about the loaded chats
  getStats() {
    const totalChats = this.chats.length;
    const topics = new Set();
    const styles = new Set();

    for (const chat of this.chats) {
      if (chat.summary) {
        if (chat.summary.topics) {
          chat.summary.topics.forEach(topic => topics.add(topic));
        }
        if (chat.summary.communication_style) {
          styles.add(chat.summary.communication_style);
        }
      }
    }

    return {
      totalChats,
      uniqueTopics: topics.size,
      uniqueStyles: styles.size,
      topics: Array.from(topics),
      styles: Array.from(styles)
    };
  }

  // Update similarity threshold
  setThreshold(newThreshold) {
    if (newThreshold >= 0 && newThreshold <= 1) {
      this.threshold = newThreshold;
      console.log(`Similarity threshold updated to ${newThreshold}`);
    } else {
      console.warn('Threshold must be between 0 and 1');
    }
  }

  // Test matching with two specific chat IDs
  testMatch(chatId1, chatId2) {
    const chat1 = this.getChatById(chatId1);
    const chat2 = this.getChatById(chatId2);

    if (!chat1 || !chat2) {
      return null;
    }

    if (!chat1.embedding || !chat2.embedding) {
      return null;
    }

    try {
      const similarity = cosineSimilarity(chat1.embedding, chat2.embedding);
      return {
        chatId1,
        chatId2,
        similarity,
        isMatch: similarity >= this.threshold,
        reason: this.generateMatchReason(chat2.summary, similarity)
      };
    } catch (error) {
      console.error('Error testing match:', error);
      return null;
    }
  }
}