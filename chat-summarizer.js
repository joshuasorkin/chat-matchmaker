#!/usr/bin/env node

import fs from 'fs/promises';
import fetch from 'node-fetch';
import { config } from './config.js';

// Local utility function to avoid import issues
function formatMessagesForDisplay(messages) {
  return messages.map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n\n');
}

async function generateSummary(chat) {
  const conversation = formatMessagesForDisplay(chat.messages);
  
  const summaryPrompt = `Analyze this conversation and extract a structured summary for matching similar conversations.

CONVERSATION:
${conversation}

Respond with ONLY a valid JSON object (no other text) containing:
{
  "topics": ["list of main topics discussed"],
  "interests": ["specific interests or hobbies mentioned"], 
  "personality_traits": ["communication style traits like curious, detailed, practical, etc."],
  "communication_style": "brief description of how the person communicates",
  "values": ["any values or priorities that come through"],
  "conversation_depth": "surface/medium/detailed",
  "question_types": ["types of questions asked like practical, theoretical, personal"],
  "one_sentence_summary": "Brief description of what this conversation was about"
}`;

  try {
    const response = await fetch(config.openai.apiUrl.chat, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.openai.chatModel,
        messages: [
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const summaryText = data.choices[0].message.content.trim();
    
    // Try to parse as JSON
    try {
      return JSON.parse(summaryText);
    } catch (parseError) {
      console.warn(`Failed to parse JSON for chat ${chat.id}, using fallback`);
      return {
        topics: [chat.topic],
        interests: [],
        personality_traits: ["conversational"],
        communication_style: "friendly",
        values: [],
        conversation_depth: "medium",
        question_types: ["general"],
        one_sentence_summary: `Conversation about ${chat.topic}`,
        raw_summary: summaryText
      };
    }

  } catch (error) {
    console.error(`Error generating summary for chat ${chat.id}:`, error);
    return {
      topics: [chat.topic],
      interests: [],
      personality_traits: [],
      communication_style: "unknown",
      values: [],
      conversation_depth: "unknown",
      question_types: [],
      one_sentence_summary: `Conversation about ${chat.topic}`,
      error: error.message
    };
  }
}

async function processChats() {
  try {
    const data = await fs.readFile(config.files.chatsJson, 'utf-8');
    const chats = JSON.parse(data);

    console.log(`Processing ${chats.length} chats for summarization...`);

    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i];
      
      // Skip if already has summary
      if (chat.summary) {
        console.log(`Chat ${chat.id} already has summary, skipping`);
        continue;
      }

      console.log(`Generating summary for chat ${chat.id} (${i + 1}/${chats.length})...`);
      
      try {
        const summary = await generateSummary(chat);
        chat.summary = summary;
        
        console.log(`✓ Summary generated for ${chat.id}: ${summary.one_sentence_summary}`);
        
        // Add delay between API calls
        if (i < chats.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`✗ Failed to generate summary for ${chat.id}:`, error);
      }
    }

    // Save updated chats
    await fs.writeFile(config.files.chatsJson, JSON.stringify(chats, null, 2));
    console.log(`\nSummaries saved to ${config.files.chatsJson}`);
    
    // Print summary report
    const withSummaries = chats.filter(c => c.summary).length;
    console.log(`\nSummary Report:`);
    console.log(`- Total chats: ${chats.length}`);
    console.log(`- With summaries: ${withSummaries}`);
    console.log(`- Remaining: ${chats.length - withSummaries}`);

  } catch (error) {
    console.error('Error processing chats:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  if (!config.openai.apiKey || config.openai.apiKey === 'your-openai-api-key-here') {
    console.error('Please set your OpenAI API key in config.js');
    process.exit(1);
  }

  try {
    await processChats();
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main();