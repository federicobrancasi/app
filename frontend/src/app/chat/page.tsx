// frontend/src/app/chat/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  Camera,
  Calendar,
  Settings,
  Trash2,
  Download,
  AlertTriangle,
  Eye,
  Zap,
  Clock,
  Bot,
  User,
  Image as ImageIcon,
  FileText,
  Activity,
  Shield,
  TrendingUp
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: {
    type: 'image' | 'video' | 'report';
    url: string;
    name: string;
  }[];
  metadata?: {
    cameraId?: string;
    eventId?: string;
    confidence?: number;
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  category: 'monitoring' | 'analysis' | 'reports' | 'configuration';
}

const quickActions: QuickAction[] = [
  {
    id: 'status',
    label: 'System Status',
    icon: Shield,
    prompt: "What's the current status of all my cameras and any recent alerts?",
    category: 'monitoring'
  },
  {
    id: 'today-summary',
    label: "Today's Summary",
    icon: Calendar,
    prompt: "Give me a summary of all activities detected today across all cameras.",
    category: 'analysis'
  },
  {
    id: 'suspicious',
    label: 'Find Suspicious Activity',
    icon: Eye,
    prompt: "Show me any suspicious or unusual activities from the past 24 hours.",
    category: 'analysis'
  },
  {
    id: 'camera-health',
    label: 'Camera Health Check',
    icon: Activity,
    prompt: "Check the health and performance of all my cameras.",
    category: 'monitoring'
  },
  {
    id: 'traffic-analysis',
    label: 'Traffic Analysis',
    icon: TrendingUp,
    prompt: "Analyze foot traffic patterns in the main entrance over the past week.",
    category: 'analysis'
  },
  {
    id: 'weekly-report',
    label: 'Weekly Report',
    icon: FileText,
    prompt: "Generate a comprehensive security report for this week.",
    category: 'reports'
  }
];

const sampleMessages: Message[] = [
  {
    id: '1',
    type: 'assistant',
    content: "Hello! I'm Claude, your AI security assistant. I can help you monitor your cameras, analyze footage, generate reports, and answer questions about your surveillance system. What would you like to know?",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '2',
    type: 'user',
    content: "What happened at the front entrance this morning?",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: '3',
    type: 'assistant',
    content: "I analyzed the front entrance footage from this morning. Here's what I found:\n\n**7:45 AM** - Delivery truck arrived (UPS)\n**8:15 AM** - First employees arriving (5 people detected)\n**8:30 AM** - Suspicious person lingering near entrance for 3 minutes\n**9:00 AM** - Normal foot traffic resumed\n\nThe suspicious activity at 8:30 AM showed someone in a dark hoodie who appeared to be checking door handles. I've flagged this for your review. Would you like me to show you the specific footage?",
    timestamp: new Date(Date.now() - 180000),
    metadata: {
      cameraId: 'cam1',
      confidence: 85
    }
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I've analyzed the footage you requested. Based on the camera feeds, I can see normal activity levels with no security concerns detected in the specified timeframe.",
        "Looking at the data from your cameras, I notice increased activity in the parking lot area. This appears to be related to the scheduled maintenance work. I'll continue monitoring for any unusual patterns.",
        "I've processed the recent footage and generated a security summary. There were 3 motion detection events today, all appearing to be routine activities. The system is operating normally with all cameras online.",
        "Based on your request, I've examined the specified camera feed. I detected 2 people entering the building, 1 delivery, and normal operational activities. No security alerts were triggered.",
        "I've completed the analysis of today's surveillance data. Key findings: 15 people detected, 3 vehicles, 0 security incidents. All cameras are functioning optimally with clear footage quality."
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        metadata: {
          confidence: Math.floor(Math.random() * 20 + 80)
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500 + Math.random() * 2000);
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // Implement speech recognition here
  };

  const clearChat = () => {
    setMessages(sampleMessages.slice(0, 1)); // Keep welcome message
  };

  const exportChat = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      messages: messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }))
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionguard-chat-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const filteredQuickActions = selectedCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === selectedCategory);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportChat}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Export Chat"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={clearChat}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* AI Status */}
          <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400 font-medium">Claude AI Online</span>
            <Zap className="h-4 w-4 text-green-400" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['all', 'monitoring', 'analysis', 'reports', 'configuration'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-400 border-gray-600 hover:border-gray-500 hover:text-gray-300'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              {filteredQuickActions.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickAction(action)}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <action.icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-300 font-medium">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Context */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">System Context</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Camera className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">Cameras</span>
                </div>
                <p className="text-xs text-gray-400">8/10 online, 2 offline</p>
              </div>
              
              <div className="p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">Alerts</span>
                </div>
                <p className="text-xs text-gray-400">3 today, 1 unresolved</p>
              </div>
              
              <div className="p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Activity className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Activity</span>
                </div>
                <p className="text-xs text-gray-400">24 events today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-gray-700">
          <button className="w-full flex items-center space-x-3 p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors">
            <Settings className="h-4 w-4" />
            <span className="text-sm">AI Settings</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Claude AI Assistant</h3>
                <p className="text-sm text-gray-400">Security monitoring and analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-400">
                {messages.length - 1} messages
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-br from-purple-500 to-blue-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex flex-col space-y-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-md ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100 border border-gray-700'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Metadata */}
                      {message.metadata && (
                        <div className="mt-2 pt-2 border-t border-gray-600/50">
                          <div className="flex items-center space-x-4 text-xs">
                            {message.metadata.cameraId && (
                              <span className="text-gray-400">
                                Camera: {message.metadata.cameraId}
                              </span>
                            )}
                            {message.metadata.confidence && (
                              <span className="text-green-400">
                                Confidence: {message.metadata.confidence}%
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex space-x-3 max-w-3xl">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="p-4 bg-gray-800 border border-gray-700 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-end space-x-3">
            {/* Attachment Button */}
            <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
              <ImageIcon className="h-5 w-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your cameras, events, or security system..."
                rows={1}
                className="w-full p-4 bg-gray-700 border border-gray-600 rounded-2xl text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                style={{
                  minHeight: '52px',
                  maxHeight: '120px',
                }}
              />
            </div>

            {/* Voice Input */}
            <button
              onClick={toggleVoiceInput}
              className={`p-3 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          {/* Input Footer */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>{inputValue.length}/2000</span>
          </div>
        </div>
      </div>
    </div>
  );
}