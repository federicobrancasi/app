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
  Download,
  Bell,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Settings
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  action?: string;
  suggestions?: string[];
}

interface Suggestion {
  text: string;
  icon: React.ReactNode;
  category: string;
}

interface MonitoringAlert {
  id: string;
  type: 'monitoring_alert';
  task_id: string;
  user_request: string;
  event: any;
  message: string;
  timestamp: string;
}

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    text: "Monitor for package deliveries at the front door",
    icon: <Camera className="w-4 h-4" />,
    category: "Monitoring Setup"
  },
  {
    text: "What happened today?",
    icon: <Activity className="w-4 h-4" />,
    category: "Event Analysis"
  },
  {
    text: "Show me what's happening now",
    icon: <Eye className="w-4 h-4" />,
    category: "Live Analysis"
  },
  {
    text: "Are all my cameras working properly?",
    icon: <Shield className="w-4 h-4" />,
    category: "System Status"
  },
  {
    text: "Alert me if anyone approaches the back entrance",
    icon: <Bell className="w-4 h-4" />,
    category: "Security Monitoring"
  },
  {
    text: "What security events occurred this week?",
    icon: <AlertTriangle className="w-4 h-4" />,
    category: "Weekly Summary"
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [activeMonitoringTasks, setActiveMonitoringTasks] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      content: "👋 Hello! I'm Claude, your VisionGuard AI assistant. I can help you monitor your cameras, analyze security events, and set up intelligent alerts. What would you like me to help you with today?",
      sender: 'ai',
      timestamp: new Date(),
      status: 'sent'
    };
    setMessages([welcomeMessage]);

    // Initialize WebSocket connection
    initializeWebSocket();

    // Fetch active monitoring tasks
    fetchMonitoringTasks();

    return () => {
      if (webSocket) {
        webSocket.close();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    try {
      const ws = new WebSocket(`ws://localhost:8000/ws/chat_client_${Date.now()}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 5 seconds
        setTimeout(initializeWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setWebSocket(ws);
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'monitoring_alert') {
      const alert = data as MonitoringAlert;
      
      // Add alert as AI message
      const alertMessage: Message = {
        id: `alert_${Date.now()}`,
        content: `🚨 **Monitoring Alert**\n\n${alert.message}\n\n**Event Details:**\n• Camera: ${alert.event.camera_id}\n• Type: ${alert.event.event_type}\n• Time: ${new Date(alert.event.timestamp).toLocaleString()}\n• Confidence: ${(alert.event.confidence * 100).toFixed(1)}%`,
        sender: 'ai',
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, alertMessage]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('VisionGuard Alert', {
          body: alert.message,
          icon: '/icons/logo.png'
        });
      }
    }
  };

  const fetchMonitoringTasks = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/monitoring-tasks');
      if (response.ok) {
        const data = await response.json();
        setActiveMonitoringTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring tasks:', error);
    }
  };

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
    const messageContent = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          context: {
            timestamp: new Date().toISOString(),
            user_id: 'chat_user',
            client_type: 'web_chat'
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
          status: 'sent',
          action: data.action,
          suggestions: data.suggestions
        };

        setMessages(prev => [...prev, aiResponse]);

        // If a monitoring task was set up, refresh the tasks
        if (data.action === 'setup_monitoring') {
          setTimeout(fetchMonitoringTasks, 1000);
        }

        setIsConnected(true);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ **Connection Error**\n\nI'm having trouble connecting to the AI service. This could be because:\n\n• The backend server is not running\n• The AI service is temporarily unavailable\n• There's a network connectivity issue\n\nPlease check that the backend is running on port 8000 and try again.`,
        sender: 'ai',
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsConnected(false);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
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

  const removeMonitoringTask = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/monitoring-tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setActiveMonitoringTasks(prev => prev.filter(task => task.id !== taskId));
        
        // Add success message
        const successMessage: Message = {
          id: Date.now().toString(),
          content: "✅ Monitoring task removed successfully.",
          sender: 'ai',
          timestamp: new Date(),
          status: 'sent'
        };
        setMessages(prev => [...prev, successMessage]);
      }
    } catch (error) {
      console.error('Failed to remove monitoring task:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Container */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-2xl bg-white overflow-hidden">
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
                        : message.status === 'error'
                        ? 'bg-red-500'
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
                          : message.status === 'error'
                          ? 'bg-red-50 text-red-900 border border-red-200'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap"
                             dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                      </div>
                      
                      {/* Show suggestions if available */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.suggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="block w-full text-left px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      
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
                      placeholder="Ask me to monitor cameras, analyze events, or check system status..."
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
        </div>

        {/* Monitoring Tasks Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-2xl bg-white">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Active Monitoring
              </h3>
              <p className="text-sm text-gray-600 mt-1">Current AI monitoring tasks</p>
            </div>
            
            <div className="p-4 space-y-3">
              {activeMonitoringTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No active monitoring tasks</p>
                  <p className="text-gray-400 text-xs mt-1">Ask me to monitor something!</p>
                </div>
              ) : (
                activeMonitoringTasks.map((task) => (
                  <div key={task.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          {task.user_request}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Clock className="w-3 h-3" />
                          <span>Since {new Date(task.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.camera_ids.map((cameraId: string) => (
                            <span key={cameraId} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                              {cameraId}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removeMonitoringTask(task.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {activeMonitoringTasks.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <Button
                  onClick={fetchMonitoringTasks}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh Tasks
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}