// frontend/src/components/layout/MainLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Video,
  MessageSquare,
  Settings,
  Bell,
  Shield,
  Activity,
  Menu,
  X,
  Search,
  User,
  BarChart3,
  Camera,
  Zap,
  ChevronDown,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: Home,
    description: 'Overview and quick stats'
  },
  { 
    name: 'Live Monitor', 
    href: '/monitor', 
    icon: Video,
    description: 'Real-time camera feeds'
  },
  { 
    name: 'AI Assistant', 
    href: '/chat', 
    icon: MessageSquare,
    description: 'Chat with AI about your security'
  },
  { 
    name: 'Events & Alerts', 
    href: '/events', 
    icon: Bell,
    description: 'Security events and notifications'
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: BarChart3,
    description: 'Reports and insights'
  },
  { 
    name: 'Camera Management', 
    href: '/cameras', 
    icon: Camera,
    description: 'Configure cameras and zones'
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    description: 'System configuration'
  },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'
      }`}>
        <SidebarContent 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
          >
            <SidebarContent mobile onClose={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'
      } flex flex-col min-h-screen`}>
        {/* Top navigation */}
        <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Search */}
              <div className="flex-1 flex justify-center lg:justify-start lg:ml-8">
                <div className="max-w-lg w-full lg:max-w-xs">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-2 border border-gray-600/50 rounded-xl leading-5 bg-gray-700/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-gray-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 sm:text-sm transition-all"
                      placeholder="Search cameras, events..."
                      type="search"
                    />
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Theme toggle */}
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all"
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all">
                  <Bell className="h-6 w-6" />
                  {notifications > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                    >
                      {notifications}
                    </motion.span>
                  )}
                </button>

                {/* AI Status */}
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <Zap className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">AI Active</span>
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white hover:bg-gray-700/50 px-3 py-2 rounded-xl transition-all"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">Admin</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* User dropdown */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-700">
                          <p className="text-sm font-medium text-white">Admin User</p>
                          <p className="text-xs text-gray-400">admin@visionguard.ai</p>
                        </div>
                        <div className="py-1">
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                            Profile Settings
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                            Preferences
                          </button>
                          <div className="border-t border-gray-700 mt-1 pt-1">
                            <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors flex items-center space-x-2">
                              <LogOut className="h-4 w-4" />
                              <span>Sign out</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  mobile?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

function SidebarContent({ 
  mobile = false, 
  collapsed = false, 
  onClose, 
  onToggleCollapse 
}: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 bg-gray-900/50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Shield className="h-6 w-6 text-white" />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <span className="text-xl font-bold text-white">VisionGuard</span>
              <div className="text-xs text-blue-400 font-medium">AI Security</div>
            </div>
          )}
        </div>
        
        {mobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {!mobile && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <item.icon
                className={`flex-shrink-0 h-5 w-5 transition-colors ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}
              />
              {(!collapsed || mobile) && (
                <div className="ml-3 flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs mt-0.5 ${
                    isActive ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-400'
                  }`}>
                    {item.description}
                  </div>
                </div>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute right-0 w-1 h-8 bg-white rounded-l-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status indicator */}
      <div className="p-4 border-t border-gray-700/50">
        {(!collapsed || mobile) ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">System Online</span>
            </div>
            <div className="text-xs text-gray-500">99.8% uptime</div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}