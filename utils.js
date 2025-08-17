#!/usr/bin/env node

import fs from 'fs/promises';
import fetch from 'node-fetch';
import { config } from './config.js';
import { generateChatId, formatMessagesForDisplay } from './utils.js';

async function generateFakeChat(topic) {
  const messages = [
    {
      role: 'system',
      content: `Generate a realistic conversation between a user and an AI assistant about "${topic}". The user should ask questions and share thoughts naturally, and you should respond helpfully. Make it feel like a real conversation someone might have.`
    },
    {
      role: 'user',
      content: `Hi! I'm interested in learning about ${topic}. Can you help me with that?`
    }
  ];

  console.log(`Generating chat about: ${topic}`);

  // Generate conversation exchanges
  for (let i = 0; i < config.chatGeneration.maxMessages - 1; i++) {
    try {
      const response = await fetch(config.openai.apiUrl.chat, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.openai.chatModel,
          messages: messages,
          max_tokens: 200,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Add assistant response
      messages.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Generate a follow-up user message (except for the last iteration)
      if (i < config.chatGeneration.maxMessages - 2) {
        const followUpPrompts = [
          "That's interesting! Can you tell me more?",
          "I have a follow-up question about that.",
          "Can you give me a specific example?",
          "What would you recommend for a beginner?",
          "Are there any common mistakes to avoid?",
          "How long does it usually take to get good at this?",
          "What tools or resources would you suggest?"
        ];
        
        const randomPrompt = followUpPrompts[Math.floor(Math.random() * followUpPrompts.length)];
        messages.push({
          role: 'user',
          content: randomPrompt
        });
      }

      // Add small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Error generating conversation:', error);
      break;
    }
  }

  // Remove system message and create chat object
  const conversationMessages = messages.slice(1);
  const chatText = formatMessagesForDisplay(conversationMessages);
  const chatId = generateChatId(chatText);

  return {
    id: chatId,
    topic: topic,
    messages: conversationMessages,
    createdAt: new Date().toISOString()
  };
}

async function saveChat(chat) {
  let chats = [];
  
  try {
    const data = await fs.readFile(config.files.chatsJson, 'utf-8');
    chats = JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, start with empty array
    console.log('Creating new chats.json file');
  }

  // Check if chat with this ID already exists
  const existingIndex = chats.findIndex(c => c.id === chat.id);
  if (existingIndex !== -1) {
    console.log(`Updating existing chat ${chat.id}`);
    chats[existingIndex] = chat;
  } else {
    console.log(`Adding new chat ${chat.id}`);
    chats.push(chat);
  }

  await fs.writeFile(config.files.chatsJson, JSON.stringify(chats, null, 2));
  console.log(`Chat saved to ${config.files.chatsJson}`);
}

// Main execution
async function main() {
  const topic = process.argv[2];
  
  if (!topic) {
    console.error('Usage: node chat-generator.js "topic name"');
    console.error('Example: node chat-generator.js "cooking tips"');
    process.exit(1);
  }

  if (!config.openai.apiKey || config.openai.apiKey === 'your-openai-api-key-here') {
    console.error('Please set your OpenAI API key in config.js');
    process.exit(1);
  }

  try {
    const chat = await generateFakeChat(topic);
    await saveChat(chat);
    
    console.log('\n--- Generated Chat ---');
    console.log(`ID: ${chat.id}`);
    console.log(`Topic: ${chat.topic}`);
    console.log(`Messages: ${chat.messages.length}`);
    console.log('\nPreview:');
    console.log(formatMessagesForDisplay(chat.messages.slice(0, 4)));
    if (chat.messages.length > 4) {
      console.log('\n... (truncated)');
    }
    
  } catch (error) {
    console.error('Error generating chat:', error);
    process.exit(1);
  }
}

main();