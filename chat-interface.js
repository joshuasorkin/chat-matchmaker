import { ChatController } from './chat-controller.js';

export class ChatInterface {
  constructor() {
    this.chatController = new ChatController();
    this.elements = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Get DOM elements
      this.elements = {
        chatWindow: document.getElementById('chat-window'),
        messageInput: document.getElementById('message-input'),
        sendButton: document.getElementById('send-button'),
        matchesContainer: document.getElementById('matches-container'),
        statusIndicator: document.getElementById('status-indicator'),
        chatInfo: document.getElementById('chat-info'),
        resetButton: document.getElementById('reset-button')
      };

      // Validate required elements
      const required = ['chatWindow', 'messageInput', 'sendButton', 'matchesContainer'];
      for (const elementName of required) {
        if (!this.elements[elementName]) {
          throw new Error(`Required element not found: ${elementName}`);
        }
      }

      // Initialize chat controller
      const success = await this.chatController.initialize();
      if (!success) {
        throw new Error('Failed to initialize chat controller');
      }

      // Set up event listeners
      this.setupEventListeners();

      // Set up callbacks
      this.chatController.setMatchFoundCallback(matches => this.displayMatches(matches));
      this.chatController.setMessageReceivedCallback(data => this.onMessageReceived(data));

      // Initialize UI
      this.updateStatus('Ready to chat!');
      this.displayWelcomeMessage();
      this.displayChatStats();

      this.isInitialized = true;
      console.log('Chat interface initialized successfully');

    } catch (error) {
      console.error('Failed to initialize chat interface:', error);
      this.updateStatus('Failed to initialize. Check console for details.', 'error');
    }
  }

  setupEventListeners() {
    // Send button click
    this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());

    // Enter key in input
    this.elements.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Reset button (if present)
    if (this.elements.resetButton) {
      this.elements.resetButton.addEventListener('click', () => this.handleReset());
    }

    // Auto-resize textarea
    this.elements.messageInput.addEventListener('input', () => {
      this.elements.messageInput.style.height = 'auto';
      this.elements.messageInput.style.height = this.elements.messageInput.scrollHeight + 'px';
    });
  }

  async handleSendMessage() {
    const message = this.elements.messageInput.value.trim();
    
    if (!message) return;

    // Disable input during processing
    this.setInputEnabled(false);
    this.updateStatus('Sending message...');

    // Add user message to chat window immediately
    this.addMessageToChat('user', message);
    this.elements.messageInput.value = '';
    this.elements.messageInput.style.height = 'auto';

    try {
      const result = await this.chatController.sendMessage(message);
      
      // Add assistant response to chat window
      this.addMessageToChat('assistant', result.response);
      
      this.updateStatus('Ready to chat!');

    } catch (error) {
      console.error('Error sending message:', error);
      this.addMessageToChat('system', `Error: ${error.message}`);
      this.updateStatus('Error occurred. Try again.', 'error');
    } finally {
      this.setInputEnabled(true);
      this.elements.messageInput.focus();
      this.scrollToBottom();
    }
  }

  addMessageToChat(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const roleSpan = document.createElement('span');
    roleSpan.className = 'message-role';
    roleSpan.textContent = role === 'user' ? 'You' : 
                          role === 'assistant' ? 'Assistant' : 
                          'System';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString();

    messageDiv.appendChild(roleSpan);
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeSpan);

    this.elements.chatWindow.appendChild(messageDiv);
    this.scrollToBottom();
  }

  displayMatches(matches) {
    this.elements.matchesContainer.innerHTML = '';

    if (matches.length === 0) {
      this.elements.matchesContainer.innerHTML = '<p class="no-matches">No matches found yet.</p>';
      return;
    }

    const matchesTitle = document.createElement('h3');
    matchesTitle.textContent = `🎉 You have ${matches.length} match${matches.length > 1 ? 'es' : ''}!`;
    matchesTitle.className = 'matches-title';
    this.elements.matchesContainer.appendChild(matchesTitle);

    matches.forEach((match, index) => {
      const matchDiv = document.createElement('div');
      matchDiv.className = 'match-item';

      matchDiv.innerHTML = `
        <div class="match-header">
          <span class="match-id">Chat ${match.chatId}</span>
          <span class="match-similarity">${Math.round(match.similarity * 100)}%</span>
        </div>
        <div class="match-topic">${match.topic}</div>
        <div class="match-reason">${match.matchReason}</div>
        <div class="match-summary">${match.summary?.one_sentence_summary || 'No summary available'}</div>
      `;

      this.elements.matchesContainer.appendChild(matchDiv);
    });

    // Show animation or highlight
    this.elements.matchesContainer.classList.add('new-matches');
    setTimeout(() => {
      this.elements.matchesContainer.classList.remove('new-matches');
    }, 2000);
  }

  displayWelcomeMessage() {
    this.addMessageToChat('system', 'Welcome! Start chatting and I\'ll find others with similar conversations. What would you like to talk about?');
  }

  displayChatStats() {
    if (!this.elements.chatInfo) return;

    const stats = this.chatController.getMatcherStats();
    this.elements.chatInfo.innerHTML = `
      <div class="chat-stats">
        <span>Available chats: ${stats.totalChats}</span>
        <span>Topics: ${stats.uniqueTopics}</span>
        <span>Styles: ${stats.uniqueStyles}</span>
      </div>
    `;
  }

  onMessageReceived(data) {
    // Update chat info or stats if needed
    if (this.elements.chatInfo) {
      const currentChat = this.chatController.getCurrentChat();
      const messageCount = currentChat.messageCount;
      
      const chatStatsDiv = this.elements.chatInfo.querySelector('.current-chat-stats');
      if (chatStatsDiv) {
        chatStatsDiv.textContent = `Messages in this chat: ${messageCount}`;
      } else {
        const statsDiv = document.createElement('div');
        statsDiv.className = 'current-chat-stats';
        statsDiv.textContent = `Messages in this chat: ${messageCount}`;
        this.elements.chatInfo.appendChild(statsDiv);
      }
    }
  }

  handleReset() {
    if (confirm('Start a new chat? This will clear the current conversation.')) {
      this.chatController.reset();
      this.elements.chatWindow.innerHTML = '';
      this.elements.matchesContainer.innerHTML = '<p class="no-matches">No matches found yet.</p>';
      this.displayWelcomeMessage();
      this.updateStatus('New chat started!');
      
      // Remove current chat stats
      const currentChatStats = this.elements.chatInfo?.querySelector('.current-chat-stats');
      if (currentChatStats) {
        currentChatStats.remove();
      }
    }
  }

  setInputEnabled(enabled) {
    this.elements.messageInput.disabled = !enabled;
    this.elements.sendButton.disabled = !enabled;
    
    if (enabled) {
      this.elements.sendButton.textContent = 'Send';
    } else {
      this.elements.sendButton.textContent = 'Sending...';
    }
  }

  updateStatus(message, type = 'info') {
    if (!this.elements.statusIndicator) return;

    this.elements.statusIndicator.textContent = message;
    this.elements.statusIndicator.className = `status ${type}`;
  }

  scrollToBottom() {
    this.elements.chatWindow.scrollTop = this.elements.chatWindow.scrollHeight;
  }

  // Public method to test with existing chats
  async testExistingChat(chatId) {
    try {
      const result = await this.chatController.testWithExistingChat(chatId);
      
      this.addMessageToChat('system', `Testing with existing chat ${chatId} about "${result.topic}"`);
      
      if (result.matches.length > 0) {
        this.displayMatches(result.matches);
      } else {
        this.addMessageToChat('system', 'No matches found for this chat.');
      }
      
      return result;
    } catch (error) {
      this.addMessageToChat('system', `Error testing chat: ${error.message}`);
      throw error;
    }
  }
}