// AI Chat Widget - BlackSheep Assistant
document.addEventListener('DOMContentLoaded', function() {
    // Create and append the chat widget HTML
    const widgetHTML = `
        <div class="ai-chat-widget">
            <div class="chat-toggle">
                <div class="chat-icon">
                    <img src="images/sheep-svgrepo-com.svg" alt="BlackSheep AI" class="sheep-icon">
                </div>
                <div class="notification-badge hidden">1</div>
            </div>
            <div class="chat-container">
                <div class="chat-header">
                    <div class="chat-title">
                        <div class="chat-avatar">
                            <img src="images/sheep-svgrepo-com.svg" alt="BlackSheep AI" class="sheep-icon">
                        </div>
                        <div>
                            <h3>BlackSheep AI</h3>
                            <span class="status">Online</span>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button class="minimize-btn" title="Minimize">−</button>
                        <button class="clear-btn" title="Clear Chat">🗑️</button>
                        <button class="close-btn" title="Close">×</button>
                    </div>
                </div>
                <div class="chat-messages">
                    <div class="message ai-message">
                        <div class="message-content">
                            <p>Hello! I'm BlackSheep AI, your personal IT assistant. How can I help you today?</p>
                        </div>
                        <div class="message-time">Just now</div>
                    </div>
                </div>
                <div class="suggestion-chips">
                    <button class="suggestion-chip" data-category="performance">System Performance</button>
                    <button class="suggestion-chip" data-category="security">Security Status</button>
                    <button class="suggestion-chip" data-category="network">Network Issues</button>
                    <button class="suggestion-chip" data-category="updates">Available Updates</button>
                </div>
                <div class="chat-input-container">
                    <textarea class="chat-input" placeholder="Type your message..." rows="1"></textarea>
                    <button class="voice-input-btn" title="Voice Input">🎤</button>
                    <button class="send-button" title="Send Message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Create a container for the widget
    const widgetContainer = document.createElement('div');
    widgetContainer.classList.add('ai-chat-widget-container');
    widgetContainer.innerHTML = widgetHTML;
    document.body.appendChild(widgetContainer);
    
    // Initialize widget elements
    const chatWidget = document.querySelector('.ai-chat-widget');
    const chatToggle = document.querySelector('.chat-toggle');
    const chatContainer = document.querySelector('.chat-container');
    const minimizeBtn = document.querySelector('.minimize-btn');
    const clearBtn = document.querySelector('.clear-btn');
    const closeBtn = document.querySelector('.close-btn');
    const chatInput = document.querySelector('.chat-input');
    const voiceInputBtn = document.querySelector('.voice-input-btn');
    const sendButton = document.querySelector('.send-button');
    const chatMessages = document.querySelector('.chat-messages');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    const notificationBadge = document.querySelector('.notification-badge');
    
    // Widget state management
    let isWidgetOpen = false;
    let chatHistory = [];
    let userContext = {
        lastCategory: null,
        lastQuery: null,
        issuesDiscussed: [],
        userName: getUserName(),
        systemInfo: getSystemInfo()
    };
    let isListening = false;
    let recognition = null;
    
    // Try to set up speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            isListening = false;
            voiceInputBtn.classList.remove('listening');
            sendMessage();
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            voiceInputBtn.classList.remove('listening');
        };
        
        recognition.onend = function() {
            isListening = false;
            voiceInputBtn.classList.remove('listening');
        };
    } else {
        voiceInputBtn.style.display = 'none';
    }
    
    // Helper function to get user name from localStorage or page
    function getUserName() {
        // First try localStorage
        const storedName = localStorage.getItem('userEmail') || localStorage.getItem('userName');
        if (storedName) {
            return storedName.split('@')[0].split('.')[0];
        }
        
        // Then try to find it on the page
        const userNameElement = document.getElementById('userName');
        if (userNameElement && userNameElement.textContent) {
            return userNameElement.textContent;
        }
        
        return 'User';
    }
    
    // Helper function to get system info
    function getSystemInfo() {
        // Get system info from various elements if available
        const cpuUsage = document.querySelector('.performance-item:nth-child(1) .performance-value');
        const memoryUsage = document.querySelector('.performance-item:nth-child(2) .performance-value');
        const diskSpace = document.querySelector('.performance-item:nth-child(3) .performance-value');
        
        return {
            cpu: cpuUsage ? cpuUsage.textContent : '35%',
            memory: memoryUsage ? memoryUsage.textContent : '68%',
            disk: diskSpace ? diskSpace.textContent : '72%',
            browser: navigator.userAgent,
            os: navigator.platform
        };
    }
    
    // Load chat history from local storage if available
    if (localStorage.getItem('chatHistory')) {
        try {
            chatHistory = JSON.parse(localStorage.getItem('chatHistory'));
            
            // Render chat history
            if (chatHistory.length > 0) {
                chatMessages.innerHTML = '';
                chatHistory.forEach(message => {
                    addMessageToChat(message.text, message.type);
                });
            }
        } catch (e) {
            console.error('Error loading chat history:', e);
            chatHistory = [];
        }
    }
    
    // Initialize widget closed state
    chatContainer.style.display = 'none';
    
    // Toggle chat widget
    chatToggle.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event propagation
        
        isWidgetOpen = !isWidgetOpen;
        chatContainer.style.display = isWidgetOpen ? 'flex' : 'none';
        chatToggle.classList.toggle('active', isWidgetOpen);
        
        if (isWidgetOpen) {
            chatInput.focus();
            notificationBadge.classList.add('hidden');
        }
        
        return false; // Prevent default and bubbling
    });
    
    // Minimize chat
    minimizeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isWidgetOpen = false;
        chatContainer.style.display = 'none';
        chatToggle.classList.remove('active');
        
        return false;
    });
    
    // Clear chat history
    clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Ask for confirmation
        if (confirm('Are you sure you want to clear the chat history?')) {
            chatHistory = [];
            localStorage.removeItem('chatHistory');
            chatMessages.innerHTML = '';
            
            // Add welcome message
            const welcomeMessage = `Hello ${userContext.userName}! I'm BlackSheep AI, your personal IT assistant. How can I help you today?`;
            addMessageToChat(welcomeMessage, 'ai');
            
            // Add to history
            chatHistory.push({
                text: welcomeMessage,
                type: 'ai',
                timestamp: new Date().toISOString()
            });
            
            // Save to localStorage
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        }
        
        return false;
    });
    
    // Close chat
    closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isWidgetOpen = false;
        chatContainer.style.display = 'none';
        chatToggle.classList.remove('active');
        
        return false;
    });
    
    // Voice input button
    voiceInputBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!recognition) return false;
        
        if (!isListening) {
            isListening = true;
            this.classList.add('listening');
            recognition.start();
        } else {
            isListening = false;
            this.classList.remove('listening');
            recognition.stop();
        }
        
        return false;
    });
    
    // Auto-resize input field
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Limit to 5 rows max
        if (this.scrollHeight > (20 * 5)) {
            this.style.overflowY = 'auto';
        } else {
            this.style.overflowY = 'hidden';
        }
    });
    
    // Send message on Enter (but allow shift+enter for new line)
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Handle suggestion chip clicks
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const category = this.dataset.category;
            handleSuggestionClick(category);
            
            return false;
        });
    });
    
    // Send message function
    function sendMessage() {
        const message = chatInput.value.trim();
        
        if (message) {
            // Add user message
            addMessageToChat(message, 'user');
            
            // Store in chat history
            chatHistory.push({
                text: message,
                type: 'user',
                timestamp: new Date().toISOString()
            });
            
            // Update user context
            userContext.lastQuery = message;
            
            // Clear input
            chatInput.value = '';
            chatInput.style.height = 'auto';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Process message and generate response with a more natural delay
            const responseTime = Math.floor(Math.random() * 1000) + 500; // Random delay between 500ms and 1500ms
            setTimeout(() => {
                hideTypingIndicator();
                generateResponse(message);
            }, responseTime);
            
            // Save chat history to local storage
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        }
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'ai-message', 'typing-indicator');
        
        typingIndicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Add message to chat
    function addMessageToChat(message, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(type + '-message');
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${formatMessage(message)}</p>
            </div>
            <div class="message-time">${time}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Format message to handle URLs, code, etc.
    function formatMessage(text) {
        // Create a safe version of the text
        let safeText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Convert URLs to links
        safeText = safeText.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // Handle simple markdown
        // Bold
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code blocks
        safeText = safeText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Inline code
        safeText = safeText.replace(/`(.*?)`/g, '<code>$1</code>');
        
        return safeText;
    }
    
    // Handle suggestion click
    function handleSuggestionClick(category) {
        let message = "";
        
        switch(category) {
            case 'performance':
                message = "I need help with system performance issues";
                break;
            case 'security':
                message = "Tell me about my security status";
                break;
            case 'network':
                message = "I am having network connection problems";
                break;
            case 'updates':
                message = "Are there any available updates?";
                break;
            case 'help':
                message = "What can you help me with?";
                break;
        }
        
        if (message) {
            // Add user message
            addMessageToChat(message, 'user');
            
            // Store in chat history
            chatHistory.push({
                text: message,
                type: 'user',
                timestamp: new Date().toISOString()
            });
            
            // Update user context
            userContext.lastCategory = category;
            userContext.lastQuery = message;
            
            // Show typing indicator
            showTypingIndicator();
            
            // Process message and generate response with a random delay
            const responseTime = Math.floor(Math.random() * 1000) + 500;
            setTimeout(() => {
                hideTypingIndicator();
                generateResponse(message, category);
            }, responseTime);
            
            // Save chat history to local storage
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        }
    }
    
    // Generate AI response based on message
    function generateResponse(message, category) {
        let response = "";
        let suggestions = [];
        
        // Personalize the response with user name if available
        const personalizedGreeting = userContext.userName !== 'User' ? `${userContext.userName}, ` : "";
        
        // Performance responses
        if (category === 'performance' || message.toLowerCase().includes('performance') || 
            message.toLowerCase().includes('slow') || message.toLowerCase().includes('speed')) {
            
            // Use actual system data if available
            const cpuUsage = userContext.systemInfo.cpu;
            const memoryUsage = userContext.systemInfo.memory;
            
            response = `${personalizedGreeting}I've analyzed your system performance. Your CPU usage is at ${cpuUsage} and memory usage is at ${memoryUsage}. There are 3 background processes that could be optimized.`;
            userContext.lastCategory = 'performance';
            
            suggestions = [
                { text: "Optimize startup applications", category: 'performance' },
                { text: "Run disk cleanup", category: 'performance' },
                { text: "View detailed performance report", category: 'performance' }
            ];
        } 
        // Security responses
        else if (category === 'security' || message.toLowerCase().includes('security') || 
                message.toLowerCase().includes('vulnerability') || message.toLowerCase().includes('protect')) {
            response = `${personalizedGreeting}your security status is good. Antivirus is active and up to date. Last scan completed 2 days ago with no issues found. Your firewall is active.`;
            userContext.lastCategory = 'security';
            
            suggestions = [
                { text: "Run security scan now", category: 'security' },
                { text: "Update security settings", category: 'security' },
                { text: "Show security history", category: 'security' }
            ];
        }
        // Network responses
        else if (category === 'network' || message.toLowerCase().includes('network') || 
                message.toLowerCase().includes('internet') || message.toLowerCase().includes('connection')) {
            response = `${personalizedGreeting}I detected some network issues. Your current download speed is 24.6 Mbps and upload is 5.2 Mbps. There was a brief connectivity interruption 30 minutes ago.`;
            userContext.lastCategory = 'network';
            
            suggestions = [
                { text: "Run network diagnostics", category: 'network' },
                { text: "View network history", category: 'network' },
                { text: "Optimize network settings", category: 'network' }
            ];
        }
        // Update responses
        else if (category === 'updates' || message.toLowerCase().includes('update') || 
                message.toLowerCase().includes('upgrade') || message.toLowerCase().includes('latest')) {
            response = `${personalizedGreeting}you have 3 software updates available: System firmware update, Adobe Creative Cloud, and system drivers update. Would you like to install them now?`;
            userContext.lastCategory = 'updates';
            
            suggestions = [
                { text: "Install all updates", category: 'updates' },
                { text: "Show update details", category: 'updates' },
                { text: "Schedule updates later", category: 'updates' }
            ];
        }
        // Help response
        else if (category === 'help' || message.toLowerCase().includes('help') || 
                message.toLowerCase().includes('assist') || message.toLowerCase().includes('what can you do')) {
            response = `${personalizedGreeting}I can help you with various IT-related tasks such as:
            
- Monitoring system performance
- Checking security status
- Diagnosing network issues
- Managing software updates
- Providing technical support

You can type your question or click on one of the suggestion chips below.`;
            
            suggestions = [
                { text: "System Performance", category: 'performance' },
                { text: "Security Status", category: 'security' },
                { text: "Network Issues", category: 'network' },
                { text: "Available Updates", category: 'updates' }
            ];
        }
        // Default response with context awareness
        else {
            // If we have context from previous messages
            if (userContext.lastCategory) {
                switch(userContext.lastCategory) {
                    case 'performance':
                        response = `${personalizedGreeting}regarding your system performance, I notice that memory usage has increased by 5% since our last check. Would you like me to suggest some optimization steps?`;
                        break;
                    case 'security':
                        response = `${personalizedGreeting}about your security inquiry, I recommend running a full system scan since it's been more than a week since the last one.`;
                        break;
                    case 'network':
                        response = `${personalizedGreeting}following up on your network concerns, have you tried restarting your router or checking for WiFi interference?`;
                        break;
                    case 'updates':
                        response = `${personalizedGreeting}regarding the system updates we discussed, installing them during non-working hours would minimize disruption.`;
                        break;
                    default:
                        response = `${personalizedGreeting}I understand you need assistance. Is your question related to system performance, security, network issues, or software updates?`;
                }
            } else {
                response = `${personalizedGreeting}I understand you need assistance. Is your question related to system performance, security, network issues, or software updates?`;
            }
            
            suggestions = [
                { text: "System Performance", category: 'performance' },
                { text: "Security Status", category: 'security' },
                { text: "Network Issues", category: 'network' },
                { text: "Available Updates", category: 'updates' },
                { text: "Help", category: 'help' }
            ];
        }
        
        // Add AI response
        addMessageToChat(response, 'ai');
        
        // Store in chat history
        chatHistory.push({
            text: response,
            type: 'ai',
            timestamp: new Date().toISOString()
        });
        
        // Add contextual suggestions to UI
        if (suggestions.length > 0) {
            addSuggestions(suggestions);
        }
        
        // Save chat history to local storage
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
    
    // Generate an action-based response
    function generateActionResponse(action, category) {
        let response = "";
        let suggestions = [];
        const personalizedGreeting = userContext.userName !== 'User' ? `${userContext.userName}, ` : "";
        
        if (category === 'performance') {
            if (action.includes('startup')) {
                response = `${personalizedGreeting}I've analyzed your startup applications. You can safely disable 4 items to improve startup time by approximately 30%.`;
                suggestions = [
                    { text: "Disable startup applications", category: 'performance', isPrimary: true },
                    { text: "Show me which ones to disable", category: 'performance' },
                    { text: "I'll do it later", category: 'performance' }
                ];
            } else if (action.includes('disk cleanup')) {
                response = `${personalizedGreeting}disk cleanup completed. I freed up 1.2GB of disk space by removing temporary files and clearing caches.`;
                suggestions = [
                    { text: "Optimize registry now", category: 'performance', isPrimary: true },
                    { text: "Run advanced cleanup", category: 'performance' },
                    { text: "Schedule regular cleanups", category: 'performance' }
                ];
            } else {
                const cpuUsage = userContext.systemInfo.cpu;
                const memoryUsage = userContext.systemInfo.memory;
                const diskUsage = userContext.systemInfo.disk;
                
                response = `${personalizedGreeting}here's your detailed performance report: CPU: ${cpuUsage} usage, Memory: ${memoryUsage} usage, Disk: ${diskUsage} usage. Most resource-intensive app: Chrome (4 instances).`;
                suggestions = [
                    { text: "Close unnecessary apps", category: 'performance', isPrimary: true },
                    { text: "Optimize startup applications", category: 'performance' },
                    { text: "Back to performance menu", category: 'performance' }
                ];
            }
        } else if (category === 'security') {
            if (action.includes('scan now')) {
                response = `${personalizedGreeting}security scan complete. No threats detected. Your system is secure.`;
                suggestions = [
                    { text: "Schedule regular scans", category: 'security', isPrimary: true },
                    { text: "Check firewall settings", category: 'security' },
                    { text: "Update virus definitions", category: 'security' }
                ];
            } else if (action.includes('settings')) {
                response = `${personalizedGreeting}security settings updated. Enhanced protection enabled for web browsing and email.`;
                suggestions = [
                    { text: "Apply additional protections", category: 'security', isPrimary: true },
                    { text: "Configure advanced settings", category: 'security' },
                    { text: "Back to security menu", category: 'security' }
                ];
            } else {
                response = `${personalizedGreeting}security history: Last 3 scans completed with no threats. 2 suspicious emails were blocked last week.`;
                suggestions = [
                    { text: "Run deep scan now", category: 'security', isPrimary: true },
                    { text: "View quarantined items", category: 'security' },
                    { text: "Configure email protection", category: 'security' }
                ];
            }
        } else if (category === 'network') {
            if (action.includes('diagnostics')) {
                response = `${personalizedGreeting}network diagnostics complete. I detected packet loss on your WiFi connection. Try moving closer to your router or switching to a wired connection.`;
                suggestions = [
                    { text: "Try to fix automatically", category: 'network', isPrimary: true },
                    { text: "View detailed report", category: 'network' },
                    { text: "Restart router", category: 'network' }
                ];
            } else if (action.includes('history')) {
                response = `${personalizedGreeting}network history: 3 connection drops in the past 24 hours. Average speed has decreased by 15% compared to last week.`;
                suggestions = [
                    { text: "Optimize WiFi settings", category: 'network', isPrimary: true },
                    { text: "Run speed test", category: 'network' },
                    { text: "Check for interference", category: 'network' }
                ];
            } else {
                response = `${personalizedGreeting}network settings optimized. I've prioritized bandwidth for your active applications and configured DNS for faster lookups.`;
                suggestions = [
                    { text: "Test connection speed", category: 'network', isPrimary: true },
                    { text: "Check devices on network", category: 'network' },
                    { text: "More network options", category: 'network' }
                ];
            }
        } else if (category === 'updates') {
            if (action.includes('Install all')) {
                response = `${personalizedGreeting}installing all updates. This will take approximately 15 minutes. You can continue using your computer during this time.`;
                suggestions = [
                    { text: "Show installation progress", category: 'updates', isPrimary: true },
                    { text: "Pause updates", category: 'updates' },
                    { text: "Schedule future updates", category: 'updates' }
                ];
            } else if (action.includes('details')) {
                response = `${personalizedGreeting}update details: 
                
- System firmware (23MB) - Security improvements
- Adobe Creative Cloud (156MB) - New features 
- System drivers (45MB) - Hardware compatibility enhancements`;
                suggestions = [
                    { text: "Install all updates now", category: 'updates', isPrimary: true },
                    { text: "Install only security updates", category: 'updates' },
                    { text: "Skip Creative Cloud update", category: 'updates' }
                ];
            } else {
                response = `${personalizedGreeting}updates scheduled for tonight at 2:00 AM when you're not using your computer.`;
                suggestions = [
                    { text: "Change schedule", category: 'updates', isPrimary: true },
                    { text: "Install now instead", category: 'updates' },
                    { text: "Notify me when complete", category: 'updates' }
                ];
            }
        }
        
        // Add AI response
        addMessageToChat(response, 'ai');
        
        // Store in chat history
        chatHistory.push({
            text: response,
            type: 'ai',
            timestamp: new Date().toISOString()
        });
        
        // Update user context to maintain the current category
        userContext.lastCategory = category;
        
        // Add contextual suggestions to UI
        if (suggestions.length > 0) {
            addSuggestions(suggestions);
        }
        
        // Save chat history to local storage
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
    
    // Add contextual suggestions
    function addSuggestions(suggestions) {
        const suggestionsContainer = document.querySelector('.suggestion-chips');
        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const chip = document.createElement('button');
            chip.classList.add('suggestion-chip');
            
            // Add primary class if this is a primary action
            if (suggestion.isPrimary) {
                chip.classList.add('primary');
            }
            
            chip.dataset.category = suggestion.category;
            chip.textContent = suggestion.text;
            
            chip.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Add user message with the suggestion text
                addMessageToChat(suggestion.text, 'user');
                
                // Store in chat history
                chatHistory.push({
                    text: suggestion.text,
                    type: 'user',
                    timestamp: new Date().toISOString()
                });
                
                // Update user context
                userContext.lastQuery = suggestion.text;
                
                // Show typing indicator
                showTypingIndicator();
                
                // Generate response with a short delay
                const responseTime = Math.floor(Math.random() * 1000) + 500;
                setTimeout(() => {
                    hideTypingIndicator();
                    generateActionResponse(suggestion.text, suggestion.category);
                }, responseTime);
                
                // Save chat history to local storage
                localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
                
                return false;
            });
            
            suggestionsContainer.appendChild(chip);
        });
    }
    
    // Show notification in the chat icon
    function showNotification() {
        if (!isWidgetOpen) {
            notificationBadge.classList.remove('hidden');
        }
    }
    
    // Prevent clicks inside the chat container from bubbling up
    chatContainer.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Schedule a welcome notification if the user hasn't interacted in a while
    setTimeout(() => {
        if (!isWidgetOpen && chatHistory.length === 0) {
            showNotification();
        }
    }, 30000); // 30 seconds
}); 