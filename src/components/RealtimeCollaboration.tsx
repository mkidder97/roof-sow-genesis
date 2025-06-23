// Real-Time Collaboration Components for Multi-Role Workflow
// Provides UI components for notifications, activity feeds, and live updates

import React, { useState } from 'react';
import { Bell, MessageCircle, Users, Activity, Settings, CheckCircle, AlertCircle, Clock, Eye } from 'lucide-react';
import { useRealtimeCollaboration, ActivityItem, NotificationItem, RealtimeUser } from '../hooks/useRealtimeCollaboration';

// Helper component for displaying time
const TimeAgo: React.FC<{ timestamp: string }> = ({ timestamp }) => {
  const timeAgo = React.useMemo(() => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }, [timestamp]);

  return <span className="text-xs text-gray-500">{timeAgo}</span>;
};

// Connection Status Indicator
export const ConnectionStatus: React.FC<{ 
  isConnected: boolean; 
  isReconnecting: boolean; 
  connectedUsers: RealtimeUser[];
}> = ({ isConnected, isReconnecting, connectedUsers }) => {
  if (isReconnecting) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
        <Clock className="w-4 h-4 animate-spin" />
        <span className="text-sm">Reconnecting...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Disconnected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm">
        Live - {connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} online
      </span>
    </div>
  );
};

// Notification Center
export const NotificationCenter: React.FC<{
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ notifications, unreadCount, onMarkRead, onMarkAllRead, isOpen, onToggle }) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.read && onMarkRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <TimeAgo timestamp={notification.createdAt} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Live Activity Feed
export const ActivityFeed: React.FC<{
  activities: ActivityItem[];
  liveActivities: ActivityItem[];
  onLoadMore: () => void;
  loading: boolean;
}> = ({ activities, liveActivities, onLoadMore, loading }) => {
  const allActivities = [...liveActivities, ...activities];

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'project_created': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'handoff_to_consultant':
      case 'handoff_to_engineer': return <Users className="w-4 h-4 text-blue-500" />;
      case 'file_uploaded': return <Activity className="w-4 h-4 text-purple-500" />;
      case 'sow_generation_started':
      case 'sow_generation_completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sow_generation_failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'project_comment': return <MessageCircle className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'normal': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-300';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Live Activity Feed
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {allActivities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No activity yet
          </div>
        ) : (
          <>
            {allActivities.map((activity, index) => (
              <div
                key={`${activity.id}-${index}`}
                className={`p-4 border-l-4 border-b border-gray-100 hover:bg-gray-50 ${getPriorityColor(activity.priority)}`}
              >
                <div className="flex items-start gap-3">
                  {getActivityIcon(activity.activityType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <TimeAgo timestamp={activity.createdAt} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    {activity.stage && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {activity.stage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {activities.length > 0 && (
              <div className="p-4 text-center">
                <button
                  onClick={onLoadMore}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Connected Users Panel
export const ConnectedUsers: React.FC<{
  users: RealtimeUser[];
  typingUsers: { userId: string; userName: string; location?: string }[];
  currentUser: RealtimeUser | null;
}> = ({ users, typingUsers, currentUser }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'inspector': return 'bg-green-100 text-green-800';
      case 'consultant': return 'bg-blue-100 text-blue-800';
      case 'engineer': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Connected Users ({users.length})
        </h3>
      </div>

      <div className="p-4">
        {users.length === 0 ? (
          <div className="text-center text-gray-500">
            No other users online
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.fullName}
                      {user.id === currentUser?.id && ' (You)'}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                {typingUsers.find(t => t.userId === user.id) && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs">typing...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Comment Input with Typing Indicators
export const CommentInput: React.FC<{
  onSendComment: (comment: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  placeholder?: string;
}> = ({ onSendComment, onStartTyping, onStopTyping, placeholder = "Add a comment..." }) => {
  const [comment, setComment] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      onStartTyping();
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
      onStopTyping();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSendComment(comment.trim());
      setComment('');
      if (isTyping) {
        setIsTyping(false);
        onStopTyping();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={comment}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={3}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </span>
        <button
          type="submit"
          disabled={!comment.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </form>
  );
};

// Complete Real-Time Collaboration Dashboard
export const RealtimeCollaborationDashboard: React.FC<{
  projectId: string;
  authToken: string;
}> = ({ projectId, authToken }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const {
    isConnected,
    isReconnecting,
    connectedUsers,
    currentUser,
    typingUsers,
    activities,
    liveActivities,
    loadingActivities,
    notifications,
    unreadCount,
    sendComment,
    startTyping,
    stopTyping,
    markNotificationRead,
    markAllNotificationsRead,
    loadMoreActivities
  } = useRealtimeCollaboration(authToken, {
    projectId,
    enableDebugLogging: process.env.NODE_ENV === 'development'
  });

  return (
    <div className="space-y-6">
      {/* Header with Connection Status and Notifications */}
      <div className="flex items-center justify-between">
        <ConnectionStatus 
          isConnected={isConnected}
          isReconnecting={isReconnecting}
          connectedUsers={connectedUsers}
        />
        
        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={markNotificationRead}
          onMarkAllRead={markAllNotificationsRead}
          isOpen={notificationsOpen}
          onToggle={() => setNotificationsOpen(!notificationsOpen)}
        />
      </div>

      {/* Main Collaboration Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ActivityFeed
            activities={activities}
            liveActivities={liveActivities}
            onLoadMore={loadMoreActivities}
            loading={loadingActivities}
          />
          
          {/* Comment Input */}
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Add Comment</h4>
            <CommentInput
              onSendComment={(comment) => sendComment(comment)}
              onStartTyping={startTyping}
              onStopTyping={stopTyping}
              placeholder="Share an update with the team..."
            />
          </div>
        </div>

        {/* Connected Users - Takes 1 column */}
        <div className="lg:col-span-1">
          <ConnectedUsers
            users={connectedUsers}
            typingUsers={typingUsers}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
};

export default RealtimeCollaborationDashboard;
