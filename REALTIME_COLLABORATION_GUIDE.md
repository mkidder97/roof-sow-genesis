# Real-Time Collaboration Integration Guide

## Overview

This guide provides complete implementation instructions for the real-time collaboration features integrated into the roof-sow-genesis project. The system provides live WebSocket connections, push notifications, activity feeds, status synchronization, and collaborative commenting across Inspector, Consultant, and Engineer roles.

## Architecture

### Backend Components

1. **Real-Time Server** (`server/core/realtime-server.ts`)
   - Socket.io server with authentication and rate limiting
   - Role-based project room management
   - Event broadcasting and user presence tracking

2. **Notification System** (`server/core/notification-system.ts`)
   - Email and in-app notification delivery
   - Template-based notifications with customization
   - User preference management

3. **Activity Feed System** (`server/core/activity-feed.ts`)
   - Real-time activity logging and retrieval
   - Project timeline generation
   - Activity filtering and categorization

4. **Collaboration Routes** (`server/routes/realtime-collaboration.ts`)
   - REST API endpoints for notifications and activities
   - Authentication middleware and user verification
   - Real-time system initialization

### Frontend Components

1. **React Hook** (`src/hooks/useRealtimeCollaboration.ts`)
   - Complete WebSocket integration
   - State management for real-time features
   - Action dispatchers for collaboration events

2. **UI Components** (`src/components/RealtimeCollaboration.tsx`)
   - Notification center with unread count
   - Live activity feed with real-time updates
   - Connected users panel with presence indicators
   - Comment input with typing indicators

## Quick Start

### 1. Install Dependencies

The backend already includes all necessary dependencies in `server/package.json`:

```json
{
  "socket.io": "^4.7.5",
  "nodemailer": "^6.9.8",
  "jsonwebtoken": "^9.0.2",
  "rate-limiter-flexible": "^4.0.1"
}
```

For the frontend, add these dependencies:

```bash
npm install socket.io-client lucide-react
```

### 2. Start the Real-Time Server

```bash
cd server
npm run start:realtime
```

This starts the integrated real-time collaboration server at `http://localhost:3001`.

### 3. Frontend Integration

```tsx
import React from 'react';
import RealtimeCollaborationDashboard from '../components/RealtimeCollaboration';

const ProjectPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const authToken = useAuthToken(); // Your auth implementation
  
  return (
    <div>
      <h1>Project Collaboration</h1>
      <RealtimeCollaborationDashboard 
        projectId={projectId}
        authToken={authToken}
      />
    </div>
  );
};
```

## Features Implemented

### ✅ WebSocket Integration
- Socket.io server with Express.js integration
- Role-based authentication and room management
- Automatic reconnection with exponential backoff
- Rate limiting (100 requests/minute per user)

### ✅ Push Notification System
- Email notifications for handoffs and critical events
- In-app notifications with unread count tracking
- Customizable notification preferences per user
- Template-based notification system

### ✅ Live Activity Feeds
- Real-time workflow activity display
- User action tracking and attribution
- Project timeline visualization
- Activity filtering by category, priority, and date

### ✅ Status Synchronization
- Multi-user project status updates
- Conflict resolution for concurrent edits
- Optimistic UI updates with fallback
- Cross-role data synchronization

### ✅ Mobile-Optimized Features
- Touch-friendly interface components
- Battery-optimized connection management
- Responsive design for field work
- Smart notification batching

## Environment Configuration

### Backend Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for notification links)
FRONTEND_URL=http://localhost:5173

# JWT Secret (for token verification)
JWT_SECRET=your_jwt_secret
```

### Frontend Environment Variables

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=http://localhost:3001
```

## API Endpoints

### Real-Time Collaboration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/realtime/status` | GET | Real-time server status |
| `/api/realtime/notifications/inbox` | GET | User notifications |
| `/api/realtime/notifications/preferences` | PUT | Update preferences |
| `/api/realtime/activity/project/:id` | GET | Project activity feed |
| `/api/realtime/activity/live` | GET | Live activity stream |

### Enhanced Workflow (with Real-Time)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/workflow/projects/realtime` | POST | Create project with notifications |
| `/api/workflow/projects/:id/handoff-to-consultant/realtime` | POST | Enhanced consultant handoff |
| `/api/workflow/projects/:id/handoff-to-engineer/realtime` | POST | Enhanced engineer handoff |
| `/api/files/upload-realtime` | POST | File upload with notifications |
| `/api/sow/generate-enhanced-realtime` | POST | SOW generation with live updates |

## WebSocket Events

### Client Events
- `project_status_update` - Update project status
- `project_handoff` - Initiate workflow handoff
- `project_comment` - Add real-time comment
- `typing_start/stop` - Typing indicators
- `presence_update` - User presence updates

### Server Events
- `project_status_updated` - Status change notifications
- `project_handoff_initiated` - Handoff notifications
- `file_uploaded` - File upload notifications
- `sow_generation_started/completed/failed` - SOW status updates
- `new_comment` - New comment notifications
- `user_typing` - Typing indicators

## Usage Example

```tsx
import { useRealtimeCollaboration } from '../hooks/useRealtimeCollaboration';
import RealtimeCollaborationDashboard from '../components/RealtimeCollaboration';

const ProjectPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const authToken = useAuth();
  
  const {
    isConnected,
    connectedUsers,
    activities,
    notifications,
    sendComment,
    sendProjectUpdate
  } = useRealtimeCollaboration(authToken, { projectId });

  return (
    <div>
      <RealtimeCollaborationDashboard 
        projectId={projectId}
        authToken={authToken}
      />
    </div>
  );
};
```

## Database Schema

The system uses existing Supabase schema with these additional tables:

```sql
-- User Notifications
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Activities
CREATE TABLE workflow_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT,
  metadata JSONB,
  priority TEXT DEFAULT 'normal',
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Comments
CREATE TABLE project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general',
  stage TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Features

- JWT token validation for WebSocket connections
- Role-based access control for project rooms
- Rate limiting (100 requests/minute per user)
- Project-specific room isolation
- Secure data transmission

## Performance Optimizations

- Connection pooling for multiple projects
- Activity feed pagination (50 items per load)
- Real-time activity buffer (50 most recent items)
- Automatic cleanup of old data (1 hour retention)
- Battery-optimized mobile connections

## Monitoring

### Debug Mode
```tsx
const collaboration = useRealtimeCollaboration(authToken, {
  projectId,
  enableDebugLogging: true // Enable in development
});
```

### Health Check
```bash
curl http://localhost:3001/api/test/realtime-collaboration
```

## System Status

The real-time collaboration system is **FULLY IMPLEMENTED** and includes:

✅ **Complete WebSocket Integration** - Socket.io server with authentication  
✅ **Push Notification System** - Email + in-app notifications  
✅ **Live Activity Feeds** - Real-time workflow activity tracking  
✅ **Status Synchronization** - Multi-user project updates  
✅ **Collaborative Comments** - Real-time commenting with typing indicators  
✅ **User Presence** - Live user tracking and presence awareness  
✅ **Mobile Optimization** - Touch-friendly, battery-optimized features  
✅ **Role-Based Access** - Inspector/Consultant/Engineer permissions  
✅ **Production Ready** - Rate limiting, error handling, reconnection logic  

## Next Steps

1. **Start the integrated server**: `npm run start:realtime`
2. **Add frontend dependencies**: `npm install socket.io-client`
3. **Import components**: Use `RealtimeCollaborationDashboard` in your project pages
4. **Configure environment**: Set up SMTP and WebSocket URLs
5. **Test integration**: Use the health check endpoints to verify functionality

The system is ready for immediate use in your multi-role roofing workflow!
