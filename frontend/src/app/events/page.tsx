// frontend/src/app/events/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Eye,
  Clock,
  Filter,
  Download,
  Search,
  Calendar,
  MapPin,
  Video,
  User,
  Car,
  Activity,
  Shield,
  Bell,
  BellOff,
  Check,
  X,
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink,
  Archive,
  Trash2,
  Flag,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'motion' | 'person_detected' | 'vehicle_detected' | 'unauthorized_access' | 'system_alert' | 'ai_detection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  camera: {
    id: string;
    name: string;
    location: string;
  };
  timestamp: Date;
  duration?: number; // seconds
  thumbnailUrl?: string;
  videoUrl?: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'false_positive';
  confidence?: number;
  metadata?: {
    objectCount?: number;
    detectionBoxes?: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      confidence: number;
    }>;
    aiAnalysis?: string;
  };
  assignedTo?: string;
  notes?: string;
}

// Sample events data
const sampleEvents: SecurityEvent[] = [
  {
    id: 'evt_001',
    type: 'unauthorized_access',
    severity: 'critical',
    title: 'Unauthorized Access Attempt',
    description: 'Person detected attempting to access restricted area after hours',
    camera: { id: 'cam1', name: 'Front Entrance', location: 'Main Building' },
    timestamp: new Date(Date.now() - 15 * 60000),
    duration: 45,
    status: 'new',
    confidence: 92,
    metadata: {
      objectCount: 1,
      aiAnalysis: 'Individual wearing dark clothing attempted to access main entrance at 11:45 PM. No valid access card detected.'
    }
  },
  {
    id: 'evt_002',
    type: 'vehicle_detected',
    severity: 'medium',
    title: 'Vehicle in Restricted Zone',
    description: 'Delivery truck parked in no-parking zone',
    camera: { id: 'cam2', name: 'Parking Lot', location: 'Outdoor' },
    timestamp: new Date(Date.now() - 45 * 60000),
    duration: 180,
    status: 'acknowledged',
    confidence: 88,
    assignedTo: 'Security Team'
  },
  {
    id: 'evt_003',
    type: 'person_detected',
    severity: 'low',
    title: 'Person Detected',
    description: 'Normal pedestrian activity detected',
    camera: { id: 'cam4', name: 'Office Hallway', location: 'Floor 2' },
    timestamp: new Date(Date.now() - 90 * 60000),
    duration: 12,
    status: 'resolved',
    confidence: 95
  },
  {
    id: 'evt_004',
    type: 'motion',
    severity: 'low',
    title: 'Motion Detection',
    description: 'Movement detected in monitored area',
    camera: { id: 'cam6', name: 'Loading Dock', location: 'Building C' },
    timestamp: new Date(Date.now() - 120 * 60000),
    duration: 8,
    status: 'false_positive',
    confidence: 72,
    notes: 'Confirmed as tree branch movement due to wind'
  },
  {
    id: 'evt_005',
    type: 'ai_detection',
    severity: 'high',
    title: 'Suspicious Behavior',
    description: 'AI detected potentially suspicious loitering behavior',
    camera: { id: 'cam1', name: 'Front Entrance', location: 'Main Building' },
    timestamp: new Date(Date.now() - 180 * 60000),
    duration: 300,
    status: 'acknowledged',
    confidence: 84,
    metadata: {
      objectCount: 2,
      aiAnalysis: 'Two individuals observed lingering near entrance for extended period without clear purpose.'
    },
    assignedTo: 'Admin'
  }
];

export default function EventsAlertsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>(sampleEvents);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>(sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    type: 'all',
    camera: 'all',
    dateRange: 'today'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  // Apply filters
  useEffect(() => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.camera.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(event => event.severity === filters.severity);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.type === filters.type);
    }

    // Date range filter
    const now = new Date();
    if (filters.dateRange === 'today') {
      const today = new Date(now.setHours(0, 0, 0, 0));
      filtered = filtered.filter(event => event.timestamp >= today);
    } else if (filters.dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(event => event.timestamp >= weekAgo);
    }

    setFilteredEvents(filtered);
  }, [events, filters, searchTerm]);

  const handleEventAction = (eventId: string, action: 'acknowledge' | 'resolve' | 'mark_false_positive' | 'delete') => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        switch (action) {
          case 'acknowledge':
            return { ...event, status: 'acknowledged', assignedTo: 'Current User' };
          case 'resolve':
            return { ...event, status: 'resolved' };
          case 'mark_false_positive':
            return { ...event, status: 'false_positive' };
          default:
            return event;
        }
      }
      return event;
    }));

    if (action === 'delete') {
      setEvents(prev => prev.filter(event => event.id !== eventId));
    }
  };

  const getSeverityIcon = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-400" />;
      case 'low': return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getTypeIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'person_detected': return <User className="h-4 w-4" />;
      case 'vehicle_detected': return <Car className="h-4 w-4" />;
      case 'motion': return <Activity className="h-4 w-4" />;
      case 'unauthorized_access': return <Shield className="h-4 w-4" />;
      case 'ai_detection': return <Eye className="h-4 w-4" />;
      case 'system_alert': return <Bell className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'new': return <Bell className="h-3 w-3 text-red-400" />;
      case 'acknowledged': return <Check className="h-3 w-3 text-yellow-400" />;
      case 'resolved': return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'false_positive': return <XCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Events & Alerts</h1>
          <p className="text-gray-400 mt-1">
            Monitor and manage security events from your surveillance system
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          <div className="flex bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Events"
          value={events.length.toString()}
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Critical Alerts"
          value={events.filter(e => e.severity === 'critical').length.toString()}
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Unresolved"
          value={events.filter(e => e.status === 'new' || e.status === 'acknowledged').length.toString()}
          icon={Bell}
          color="orange"
        />
        <StatsCard
          title="Resolved Today"
          value={events.filter(e => e.status === 'resolved' && 
            e.timestamp >= new Date(new Date().setHours(0, 0, 0, 0))).length.toString()}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Severity Filter */}
          <select
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Types</option>
            <option value="motion">Motion</option>
            <option value="person_detected">Person</option>
            <option value="vehicle_detected">Vehicle</option>
            <option value="unauthorized_access">Unauthorized Access</option>
            <option value="ai_detection">AI Detection</option>
            <option value="system_alert">System Alert</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setFilters({
                severity: 'all',
                status: 'all',
                type: 'all',
                camera: 'all',
                dateRange: 'today'
              });
              setSearchTerm('');
            }}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Events List/Timeline */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Events Found</h3>
            <p className="text-gray-400">
              No events match your current filter criteria. Try adjusting your filters.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-gray-700">
            {filteredEvents.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                onSelect={() => setSelectedEvent(event)}
                onAction={(action) => handleEventAction(event.id, action)}
              />
            ))}
          </div>
        ) : (
          <TimelineView events={filteredEvents} onSelectEvent={setSelectedEvent} />
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onAction={(action) => {
              handleEventAction(selectedEvent.id, action);
              if (action === 'delete') {
                setSelectedEvent(null);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'orange';
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
    orange: 'text-orange-400 bg-orange-500/10'
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].split(' ')[0]}`} />
        </div>
      </div>
    </div>
  );
}

// Event List Item Component
interface EventListItemProps {
  event: SecurityEvent;
  onSelect: () => void;
  onAction: (action: 'acknowledge' | 'resolve' | 'mark_false_positive' | 'delete') => void;
}

function EventListItem({ event, onSelect, onAction }: EventListItemProps) {
  const [showActions, setShowActions] = useState(false);

  const getSeverityIcon = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-400" />;
      case 'low': return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getTypeIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'person_detected': return <User className="h-4 w-4" />;
      case 'vehicle_detected': return <Car className="h-4 w-4" />;
      case 'motion': return <Activity className="h-4 w-4" />;
      case 'unauthorized_access': return <Shield className="h-4 w-4" />;
      case 'ai_detection': return <Eye className="h-4 w-4" />;
      case 'system_alert': return <Bell className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'new': return <Bell className="h-3 w-3 text-red-400" />;
      case 'acknowledged': return <Check className="h-3 w-3 text-yellow-400" />;
      case 'resolved': return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'false_positive': return <XCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 hover:bg-gray-700/30 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Event Type Icon */}
          <div className="p-2 bg-gray-700 rounded-lg">
            {getTypeIcon(event.type)}
          </div>

          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-white truncate">{event.title}</h3>
              <div className="flex items-center space-x-2">
                {getSeverityIcon(event.severity)}
                <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(event.severity)}`}>
                  {event.severity.toUpperCase()}
                </span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(event.status)}
                  <span className="text-xs text-gray-400 capitalize">{event.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <p className="text-gray-400 mb-3">{event.description}</p>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{event.camera.name} • {event.camera.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{event.timestamp.toLocaleString()}</span>
              </div>
              {event.confidence && (
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{event.confidence}% confidence</span>
                </div>
              )}
              {event.duration && (
                <div className="flex items-center space-x-2">
                  <Video className="h-4 w-4" />
                  <span>{event.duration}s duration</span>
                </div>
              )}
            </div>

            {event.assignedTo && (
              <div className="mt-2">
                <span className="text-xs text-blue-400">Assigned to: {event.assignedTo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {event.status === 'new' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('acknowledge');
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                {(event.status === 'new' || event.status === 'acknowledged') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('resolve');
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('mark_false_positive');
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  Mark False Positive
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('delete');
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Timeline View Component
interface TimelineViewProps {
  events: SecurityEvent[];
  onSelectEvent: (event: SecurityEvent) => void;
}

function TimelineView({ events, onSelectEvent }: TimelineViewProps) {
  const groupedEvents = events.reduce((groups, event) => {
    const date = event.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, SecurityEvent[]>);

  return (
    <div className="p-6">
      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date} className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => onSelectEvent(event)}
                >
                  <div className="text-sm text-gray-400 w-16">
                    {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    event.severity === 'critical' ? 'bg-red-400' :
                    event.severity === 'high' ? 'bg-orange-400' :
                    event.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1">
                    <div className="text-white font-medium">{event.title}</div>
                    <div className="text-sm text-gray-400">{event.camera.name}</div>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded ${
                    event.status === 'new' ? 'bg-red-500/20 text-red-400' :
                    event.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-400' :
                    event.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {event.status.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Event Detail Modal Component
interface EventDetailModalProps {
  event: SecurityEvent;
  onClose: () => void;
  onAction: (action: 'acknowledge' | 'resolve' | 'mark_false_positive' | 'delete') => void;
}

function EventDetailModal({ event, onClose, onAction }: EventDetailModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h3 className="text-xl font-semibold text-white">{event.title}</h3>
            <p className="text-gray-400 mt-1">{event.camera.name} • {event.camera.location}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Event Type</label>
                <p className="text-white capitalize">{event.type.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Severity</label>
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getSeverityColor(event.severity)}`}>
                  {getSeverityIcon(event.severity)}
                  <span className="capitalize">{event.severity}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <p className="text-white capitalize">{event.status.replace('_', ' ')}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Timestamp</label>
                <p className="text-white">{event.timestamp.toLocaleString()}</p>
              </div>
              {event.confidence && (
                <div>
                  <label className="text-sm text-gray-400">Confidence</label>
                  <p className="text-white">{event.confidence}%</p>
                </div>
              )}
              {event.duration && (
                <div>
                  <label className="text-sm text-gray-400">Duration</label>
                  <p className="text-white">{event.duration} seconds</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-400">Description</label>
            <p className="text-white mt-1">{event.description}</p>
          </div>

          {/* AI Analysis */}
          {event.metadata?.aiAnalysis && (
            <div>
              <label className="text-sm text-gray-400">AI Analysis</label>
              <p className="text-white mt-1 p-4 bg-gray-700/50 rounded-lg">
                {event.metadata.aiAnalysis}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
            {event.status === 'new' && (
              <button
                onClick={() => onAction('acknowledge')}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>Acknowledge</span>
              </button>
            )}
            {(event.status === 'new' || event.status === 'acknowledged') && (
              <button
                onClick={() => onAction('resolve')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Resolve</span>
              </button>
            )}
            <button
              onClick={() => onAction('mark_false_positive')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Flag className="h-4 w-4" />
              <span>False Positive</span>
            </button>
            <button
              onClick={() => onAction('delete')}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getSeverityIcon(severity: SecurityEvent['severity']) {
  switch (severity) {
    case 'critical': return <AlertTriangle className="h-4 w-4 text-red-400" />;
    case 'high': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    case 'medium': return <Info className="h-4 w-4 text-yellow-400" />;
    case 'low': return <Info className="h-4 w-4 text-blue-400" />;
  }
}

function getSeverityColor(severity: SecurityEvent['severity']) {
  switch (severity) {
    case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  }
}