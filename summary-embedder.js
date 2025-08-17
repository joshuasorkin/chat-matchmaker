#!/usr/bin/env node

import fs from 'fs/promises';
import fetch from 'node-fetch';
import { config } from './config.js';

async function generateEmbedding(text) {
  try {
    const response = await fetch(config.openai.apiUrl.embeddings, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.openai.embeddingModel,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;

  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

function createEmbeddingText(summary) {
  // Combine different aspects of the summary into a single text for embedding
  const parts = [];
  
  if (summary.topics) {
    parts.push(`Topics: ${summary.topics.join(', ')}`);
  }
  
  if (summary.interests) {
    parts.push(`Interests: ${summary.interests.join(', ')}`);
  }
  
  if (summary.personality_traits) {
    parts.push(`Traits: ${summary.personality_traits.join(', ')}`);
  }
  
  if (summary.communication_style) {
    parts.push(`Style: ${summary.communication_style}`);
  }
  
  if (summary.values) {
    parts.push(`Values: ${summary.values.join(', ')}`);
  }
  
  if (summary.one_sentence_summary) {
    parts.push(`Summary: ${summary.one_sentence_summary}`);
  }
  
  return parts.join('. ');
}

async function processChats() {
  try {
    const data = await fs.readFile(config.files.chatsJson, 'utf-8');
    const chats = JSON.parse(data);

    console.log(`Processing ${chats.length} chats for embedding generation...`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i];
      
      // Skip if no summary
      if (!chat.summary) {
        console.log(`Chat ${chat.id} has no summary, skipping`);
        skipped++;
        continue;
      }

      // Skip if already has embedding
      if (chat.embedding) {
        console.log(`Chat ${chat.id} already has embedding, skipping`);
        skipped++;
        continue;
      }

      console.log(`Generating embedding for chat ${chat.id} (${i + 1}/${chats.length})...`);
      
      try {
        const embeddingText = createEmbeddingText(chat.summary);
        const embedding = await generateEmbedding(embeddingText);
        
        chat.embedding = embedding;
        chat.embeddingText = embeddingText; // Store for debugging
        
        console.log(`✓ Embedding generated for ${chat.id} (${embedding.length} dimensions)`);
        processed++;
        
        // Add delay between API calls
        if (i < chats.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`✗ Failed to generate embedding for ${chat.id}:`, error);
        errors++;
      }
    }

    // Save updated chats
    await fs.writeFile(config.files.chatsJson, JSON.stringify(chats, null, 2));
    console.log(`\nEmbeddings saved to ${config.files.chatsJson}`);
    
    // Print embedding report
    console.log(`\nEmbedding Report:`);
    console.log(`- Total chats: ${chats.length}`);
    console.log(`- Processed: ${processed}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Errors: ${errors}`);
    
    const withEmbeddings = chats.filter(c => c.embedding).length;
    console.log(`- With embeddings: ${withEmbeddings}`);

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