// src/app/chat/page.tsx
'use client'
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  Send, 
  Brain, 
  User, 
  Camera, 
  Shield, 
  AlertTriangle,
  Clock,
  Sparkles,
  Mic,
  Paperclip,
  MoreVertical,
  Trash2,
  Download
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface Suggestion {
  text: string;
  icon: React.ReactNode;
  category: string;
}

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    text: "Show me what happened in Camera 1 today",
    icon: <Camera className="w-4 h-4" />,
    category: "Camera Analysis"
  },
  {
    text: "Are all my cameras online and working?",
    icon: <Shield className="w-4 h-4" />,
    category: "System Status"
  },
  {
    text: "What security events occurred this week?",
    icon: <AlertTriangle className="w-4 h-4" />,
    category: "Security Events"
  },
  {
    text: "Optimize camera settings for night vision",
    icon: <Sparkles className="w-4 h-4" />,
    category: "Optimization"
  }
];

const MOCK_RESPONSES = [
  "I've analyzed your camera feeds. Currently, all 4 cameras are online and functioning normally. Camera 1 (Front Entrance) detected 23 events today, mostly involving regular visitor activity.",
  "Based on my analysis, your security system is performing optimally. I've identified 3 minor configuration improvements that could enhance detection accuracy by 15%.",
  "I found 2 significant events this week: An unknown person was detected near Camera 3 on Tuesday at 2:14 AM, and there was unusual motion detected in the parking area yesterday evening.",
  "Your night vision settings look good! However, I recommend adjusting Camera 2's IR sensitivity to reduce false positives from shadows. Would you like me to apply this optimization?",
  "Let me check the recent activity across all your cameras. I'm processing the video feeds now and will provide a comprehensive summary of detected events.",
  "Great question! I can help you analyze patterns in your security data. What specific time period or type of activity would you like me to focus on?"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      content: "👋 Hello! I'm Claude, your VisionGuard AI assistant. I can help you monitor your cameras, analyze security events, and optimize your system. What would you like to know?",
      sender: 'ai',
      timestamp: new Date(),
      status: 'sent'
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Try to use real API first
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            timestamp: new Date().toISOString(),
            user_id: 'demo_user'
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: 'ai',
          timestamp: new Date(),
          status: 'sent'
        };

        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Fallback to mock responses if API fails
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)],
        sender: 'ai',
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Show connection warning
      setIsConnected(false);
      setTimeout(() => setIsConnected(true), 5000);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const clearChat = () => {
    setMessages(messages.slice(0, 1)); // Keep welcome message
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Assistant</h1>
          <p className="text-xl text-gray-600">Chat with Claude about your security system and get intelligent insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
            isConnected 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          
          <Button
            onClick={clearChat}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="border-0 shadow-2xl bg-white overflow-hidden">
        {/* Chat Messages */}
        <div className="h-[600px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user'
                    ? 'bg-blue-500'
                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Brain className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 max-w-[80%] ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } ${message.status === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : ''}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(message.timestamp)}</span>
                    {message.status === 'sending' && <span>Sending...</span>}
                    {message.status === 'error' && <span className="text-red-500">Failed</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (show when no messages except welcome) */}
          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {INITIAL_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                        {suggestion.category}
                      </div>
                      <div className="text-sm text-gray-900 font-medium">
                        {suggestion.text}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your cameras, security events, or system optimization..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={isTyping}
                />
                
                {/* Input Actions */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{inputValue.length}/1000</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Camera Status</div>
              <div className="text-sm text-gray-600">Check all cameras</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <AlertTriangle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Recent Events</div>
              <div className="text-sm text-gray-600">View latest alerts</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Optimize System</div>
              <div className="text-sm text-gray-600">AI recommendations</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}