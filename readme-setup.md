# Chat Matchmaker - Skateboard MVP

A prototype chat application that finds users with similar conversations using AI embeddings.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
Edit `config.js` and replace `'your-openai-api-key-here'` with your actual OpenAI API key:

```javascript
openai: {
  apiKey: 'sk-your-actual-openai-key-here',
  // ... rest of config
}
```

### 3. Generate Fake Chat Data
```bash
# Generate some sample conversations
node chat-generator.js "cooking tips"
node chat-generator.js "fitness advice" 
node chat-generator.js "travel planning"
node chat-generator.js "programming help"
node chat-generator.js "pet care"
node chat-generator.js "gardening tips"
node chat-generator.js "book recommendations"
node chat-generator.js "movie discussions"
node chat-generator.js "career advice"
node chat-generator.js "hobby photography"
```

### 4. Process the Chats
```bash
# Generate summaries for all chats
node chat-summarizer.js

# Generate embeddings for all summaries  
node summary-embedder.js
```

### 5. Run the App
Open `index.html` in your browser (preferably Chrome/Firefox for best compatibility).

## 📁 File Structure

### CLI Tools (Node.js)
- `chat-generator.js` - Generate fake conversations about specific topics
- `chat-summarizer.js` - Extract structured summaries from conversations
- `summary-embedder.js` - Generate embeddings for similarity matching

### Browser Application
- `index.html` - Main chat interface
- `chat-interface.js` - UI logic and event handling
- `chat-controller.js` - Chat state management and orchestration
- `chat-matcher.js` - Similarity calculation and match detection
- `llm-prompter.js` - OpenAI API wrapper for chat and embeddings

### Supporting Files
- `config.js` - Configuration (API keys, thresholds, etc.)
- `utils.js` - Shared utilities (SHA-256, cosine similarity, etc.)
- `styles.css` - UI styling
- `chats.json` - Generated chat data (created after running CLI tools)

## 🎯 How It Works

1. **Chat Generation**: Create fake conversations about different topics
2. **Summary Extraction**: Analyze conversations for topics, interests, personality traits
3. **Embedding Generation**: Convert summaries to numerical vectors for comparison
4. **Real-time Matching**: As users chat, find similar conversations and notify of matches
5. **Match Display**: Show compatible chats with similarity scores and reasons

## 🔧 Usage Examples

### Generate a new chat:
```bash
node chat-generator.js "digital art techniques"
```

### Test the matching system:
1. Open `index.html` in browser
2. Start chatting about any topic
3. Watch the matches appear in the right panel
4. Use debug tools to test with existing chats

### Debug and test:
- Click "Test Random Chat" to see how existing chats match each other
- Click "Show Debug Info" to see current chat status
- Check browser console for detailed logs

## ⚙️ Configuration

Edit `config.js` to adjust:

- **API Keys**: Your OpenAI API key
- **Models**: Chat model (gpt-3.5-turbo) and embedding model (text-embedding-3-small)
- **Matching**: Similarity threshold (0.7 = 70% similarity required)
- **Generation**: Max messages per generated chat

## 🧪 Testing the Concept

This skateboard MVP tests the core hypothesis: **"Can we match people based on their conversation patterns?"**

### Key metrics to observe:
1. Do conversations about similar topics actually get high similarity scores?
2. Do different conversation styles (curious vs. practical) cluster separately?
3. Are the match reasons meaningful and accurate?

### Expected behavior:
- Chats about cooking should match other cooking chats
- Technical discussions should cluster together
- Personality traits (curious, detail-oriented) should influence matching
- Different communication styles should be distinguishable

## 🚧 Limitations (Skateboard Phase)

- **No real users**: Uses pre-generated fake conversations
- **No persistent storage**: Chat state resets on page reload
- **No actual chat channels**: Just shows match notifications
- **API costs**: Every message calls OpenAI for response, summary, and embedding
- **No authentication**: Anyone can use the interface
- **Basic UI**: Functional but not polished

## 🛣️ Next Steps (Scooter → Car)

1. **Scooter Phase**: Add user accounts, real chat persistence
2. **Bike Phase**: Enable actual chat between matched users
3. **Motorcycle Phase**: Advanced matching algorithms, mobile app
4. **Car Phase**: Scale to thousands of users, recommendation engine

## 🐛 Troubleshooting

### Common Issues:

**"Failed to load chats"**
- Make sure you've run the chat generation and processing steps
- Check that `chats.json` exists and contains valid data

**"OpenAI API error"**
- Verify your API key is correct in `config.js`
- Check you have sufficient API credits
- Ensure you're not hitting rate limits

**"No matches found"**
- Try generating more diverse chat topics
- Lower the similarity threshold in `config.js`
- Check that embeddings were generated successfully

**Browser console errors**
- Make sure you're serving the files (not just opening file://)
- Use a local server: `python -m http.server 8000` or similar

## 📊 Expected API Costs

For the skateboard with 10 fake chats:
- Chat generation: ~$0.50
- Summarization: ~$0.20  
- Embeddings: ~$0.05
- Real-time usage: ~$0.02 per user message

Total: Under $1 for complete testing of the concept.

## 🤝 Contributing

This is a prototype for learning and validation. Feel free to:
- Experiment with different matching algorithms
- Try different summary extraction approaches
- Test with various conversation topics
- Suggest improvements to the architecture

Remember: The goal is to validate whether conversation-based matching works, not to build a production system yet!