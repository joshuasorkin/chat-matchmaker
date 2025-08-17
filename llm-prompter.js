import { config } from './config.js';

export class LLMPrompter {
  constructor() {
    this.apiKey = config.openai.apiKey;
    this.model = config.openai.chatModel;
    this.apiUrl = config.openai.apiUrl.chat;
  }

  async sendMessage(messages, options = {}) {
    const {
      maxTokens = 300,
      temperature = 0.7,
      systemPrompt = config.chatGeneration.systemPrompt
    } = options;

    // Prepare messages with system prompt
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: fullMessages,
          max_tokens: maxTokens,
          temperature: temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        model: data.model
      };

    } catch (error) {
      console.error('Error in LLM request:', error);
      throw error;
    }
  }

  async generateSummary(messages) {
    const conversation = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n\n');

    const summaryPrompt = `Analyze this conversation and extract a structured summary for matching similar conversations.

CONVERSATION:
${conversation}

Respond with ONLY a valid JSON object containing:
{
  "topics": ["list of main topics discussed"],
  "interests": ["specific interests mentioned"], 
  "personality_traits": ["communication style traits"],
  "communication_style": "brief description",
  "values": ["values that come through"],
  "conversation_depth": "surface/medium/detailed",
  "question_types": ["types of questions asked"],
  "one_sentence_summary": "Brief description"
}`;

    try {
      const response = await this.sendMessage([
        { role: 'user', content: summaryPrompt }
      ], { temperature: 0.3, maxTokens: 400 });

      return JSON.parse(response.content);
    } catch (parseError) {
      console.warn('Failed to parse summary JSON, using fallback');
      return {
        topics: ["general conversation"],
        interests: [],
        personality_traits: ["conversational"],
        communication_style: "friendly",
        values: [],
        conversation_depth: "medium",
        question_types: ["general"],
        one_sentence_summary: "General conversation",
        parse_error: parseError.message
      };
    }
  }

  async generateEmbedding(text) {
    try {
      const response = await fetch(config.openai.apiUrl.embeddings, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.openai.embeddingModel,
          input: text
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;

    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  // Helper method to create embedding text from summary
  createEmbeddingText(summary) {
    const parts = [];
    
    if (summary.topics) parts.push(`Topics: ${summary.topics.join(', ')}`);
    if (summary.interests) parts.push(`Interests: ${summary.interests.join(', ')}`);
    if (summary.personality_traits) parts.push(`Traits: ${summary.personality_traits.join(', ')}`);
    if (summary.communication_style) parts.push(`Style: ${summary.communication_style}`);
    if (summary.values) parts.push(`Values: ${summary.values.join(', ')}`);
    if (summary.one_sentence_summary) parts.push(`Summary: ${summary.one_sentence_summary}`);
    
    return parts.join('. ');
  }
}