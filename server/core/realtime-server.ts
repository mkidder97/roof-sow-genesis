// Real-Time Collaboration Server for Multi-Role Workflow
// Handles WebSocket connections, room management, and event broadcasting

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! || process.env.SUPABASE_ANON_KEY!
);

// Real-time event types
export interface RealtimeEvent {
  type: string;
  payload: any;
  userId: string;
  userRole: string;
  projectId?: string;
  timestamp: string;
  metadata?: any;
}

export interface SocketUser {
  id: string;
  email: string;
  role: 'inspector' | 'consultant' | 'engineer' | 'admin';
  fullName: string;
  companyId?: string;
  connectedAt: string;
  lastSeen: string;
}

export interface ProjectRoom {
  projectId: string;
  users: Map<string, SocketUser>;
  activity: RealtimeEvent[];
  lastActivity: string;
}

export class RealtimeServer {
  private io: SocketIOServer;
  private projectRooms: Map<string, ProjectRoom> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, SocketUser> = new Map(); // socketId -> user
  
  // Rate limiting for socket events
  private rateLimiter = new RateLimiterMemory({
    keyGenerator: (socket) => socket.handshake.auth.userId || socket.id,
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
  });

  constructor(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          'http://localhost:5173',
          'https://roof-sow-genesis.lovable.app',
          'http://localhost:3000',
          'http://localhost:4173',
          process.env.FRONTEND_URL || 'http://localhost:5173'
        ],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startCleanupInterval();
    
    console.log('🚀 Real-time collaboration server initialized');
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          return next(new Error('Invalid authentication token'));
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          return next(new Error('User profile not found'));
        }

        // Store user data in socket
        socket.data.user = {
          id: user.id,
          email: user.email!,
          role: profile.role,
          fullName: profile.full_name || user.email!,
          companyId: profile.company_id,
          connectedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        };

        console.log(`🔌 User connected: ${profile.full_name} (${profile.role})`);
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use(async (socket, next) => {
      try {
        await this.rateLimiter.consume(socket.id);
        next();
      } catch (rejRes) {
        console.warn(`Rate limit exceeded for socket ${socket.id}`);
        socket.emit('rate_limit_exceeded', {
          message: 'Too many requests, please slow down',
          retryAfter: Math.round(rejRes.msBeforeNext) || 1000
        });
        next(new Error('Rate limit exceeded'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user as SocketUser;
      
      // Store socket mapping
      this.userSockets.set(user.id, socket.id);
      this.socketUsers.set(socket.id, user);

      // Join user to their projects
      this.joinUserProjects(socket, user);

      // Handle project-specific events
      this.handleProjectEvents(socket, user);
      
      // Handle collaboration events
      this.handleCollaborationEvents(socket, user);
      
      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket, user);
      });

      // Send initial connection confirmation
      socket.emit('connected', {
        message: 'Connected to real-time collaboration server',
        user: {
          id: user.id,
          role: user.role,
          fullName: user.fullName
        },
        serverTime: new Date().toISOString()
      });
    });
  }

  private async joinUserProjects(socket: any, user: SocketUser) {
    try {
      // Get projects where user is assigned
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, current_stage')
        .or(`user_id.eq.${user.id},assigned_inspector.eq.${user.id},assigned_consultant.eq.${user.id},assigned_engineer.eq.${user.id}`);

      if (projects) {
        for (const project of projects) {
          const roomName = `project:${project.id}`;
          
          // Join socket to project room
          socket.join(roomName);
          
          // Initialize or update project room
          if (!this.projectRooms.has(project.id)) {
            this.projectRooms.set(project.id, {
              projectId: project.id,
              users: new Map(),
              activity: [],
              lastActivity: new Date().toISOString()
            });
          }
          
          const room = this.projectRooms.get(project.id)!;
          room.users.set(user.id, user);
          
          console.log(`👤 ${user.fullName} joined project room: ${project.name}`);
          
          // Notify others in the room
          socket.to(roomName).emit('user_joined_project', {
            projectId: project.id,
            user: {
              id: user.id,
              fullName: user.fullName,
              role: user.role
            },
            timestamp: new Date().toISOString()
          });
          
          // Send current room status to new user
          socket.emit('project_room_status', {
            projectId: project.id,
            projectName: project.name,
            currentStage: project.current_stage,
            activeUsers: Array.from(room.users.values()).map(u => ({
              id: u.id,
              fullName: u.fullName,
              role: u.role,
              lastSeen: u.lastSeen
            })),
            recentActivity: room.activity.slice(-10) // Last 10 activities
          });
        }
      }
    } catch (error) {
      console.error('Error joining user projects:', error);
      socket.emit('error', { message: 'Failed to join project rooms' });
    }
  }

  private handleProjectEvents(socket: any, user: SocketUser) {
    // Project status updates
    socket.on('project_status_update', async (data) => {
      try {
        const { projectId, status, stage, notes } = data;
        
        if (!await this.verifyUserProjectAccess(user.id, projectId)) {
          socket.emit('error', { message: 'Access denied to project' });
          return;
        }

        const event: RealtimeEvent = {
          type: 'project_status_update',
          payload: { status, stage, notes },
          userId: user.id,
          userRole: user.role,
          projectId,
          timestamp: new Date().toISOString(),
          metadata: {
            userName: user.fullName,
            previousStage: data.previousStage
          }
        };

        // Broadcast to project room
        this.broadcastToProject(projectId, 'project_status_updated', event);
        
        // Log activity
        await this.logWorkflowActivity(projectId, user.id, 'status_update', event.payload, notes);
        
        console.log(`📊 Project ${projectId} status updated by ${user.fullName}`);
        
      } catch (error) {
        console.error('Error handling project status update:', error);
        socket.emit('error', { message: 'Failed to update project status' });
      }
    });

    // Handoff events
    socket.on('project_handoff', async (data) => {
      try {
        const { projectId, fromStage, toStage, toUserId, handoffData, notes } = data;
        
        if (!await this.verifyUserProjectAccess(user.id, projectId)) {
          socket.emit('error', { message: 'Access denied to project' });
          return;
        }

        const event: RealtimeEvent = {
          type: 'project_handoff',
          payload: {
            fromStage,
            toStage,
            toUserId,
            handoffData,
            notes
          },
          userId: user.id,
          userRole: user.role,
          projectId,
          timestamp: new Date().toISOString(),
          metadata: {
            userName: user.fullName,
            handoffType: `${fromStage}_to_${toStage}`
          }
        };

        // Broadcast to project room
        this.broadcastToProject(projectId, 'project_handoff_initiated', event);
        
        // Send specific notification to recipient
        if (toUserId) {
          this.sendToUser(toUserId, 'handoff_received', {
            ...event,
            isRecipient: true
          });
        }
        
        // Log handoff activity
        await this.logWorkflowActivity(projectId, user.id, 'handoff', event.payload, notes);
        
        console.log(`🔄 Project ${projectId} handoff: ${fromStage} → ${toStage} by ${user.fullName}`);
        
      } catch (error) {
        console.error('Error handling project handoff:', error);
        socket.emit('error', { message: 'Failed to process handoff' });
      }
    });

    // File upload notifications
    socket.on('file_uploaded', async (data) => {
      try {
        const { projectId, fileId, fileName, fileType, stage } = data;
        
        if (!await this.verifyUserProjectAccess(user.id, projectId)) {
          socket.emit('error', { message: 'Access denied to project' });
          return;
        }

        const event: RealtimeEvent = {
          type: 'file_uploaded',
          payload: {
            fileId,
            fileName,
            fileType,
            stage
          },
          userId: user.id,
          userRole: user.role,
          projectId,
          timestamp: new Date().toISOString(),
          metadata: {
            userName: user.fullName
          }
        };

        // Broadcast to project room
        this.broadcastToProject(projectId, 'file_uploaded', event);
        
        console.log(`📁 File uploaded to project ${projectId}: ${fileName} by ${user.fullName}`);
        
      } catch (error) {
        console.error('Error handling file upload notification:', error);
      }
    });
  }

  private handleCollaborationEvents(socket: any, user: SocketUser) {
    // Real-time comments
    socket.on('project_comment', async (data) => {
      try {
        const { projectId, comment, commentType, stage, metadata } = data;
        
        if (!await this.verifyUserProjectAccess(user.id, projectId)) {
          socket.emit('error', { message: 'Access denied to project' });
          return;
        }

        // Save comment to database
        const { data: savedComment, error } = await supabase
          .from('project_comments')
          .insert({
            project_id: projectId,
            user_id: user.id,
            comment,
            comment_type: commentType,
            stage,
            metadata
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        const event: RealtimeEvent = {
          type: 'project_comment',
          payload: {
            ...savedComment,
            userName: user.fullName,
            userRole: user.role
          },
          userId: user.id,
          userRole: user.role,
          projectId,
          timestamp: new Date().toISOString(),
          metadata: {
            userName: user.fullName
          }
        };

        // Broadcast to project room
        this.broadcastToProject(projectId, 'new_comment', event);
        
        console.log(`💬 Comment added to project ${projectId} by ${user.fullName}`);
        
      } catch (error) {
        console.error('Error handling project comment:', error);
        socket.emit('error', { message: 'Failed to save comment' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { projectId, location } = data;
      socket.to(`project:${projectId}`).emit('user_typing', {
        userId: user.id,
        userName: user.fullName,
        location,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('typing_stop', (data) => {
      const { projectId } = data;
      socket.to(`project:${projectId}`).emit('user_stopped_typing', {
        userId: user.id
      });
    });

    // User presence updates
    socket.on('presence_update', (data) => {
      const { projectId, status, location } = data;
      
      // Update user's last seen
      user.lastSeen = new Date().toISOString();
      
      socket.to(`project:${projectId}`).emit('user_presence_update', {
        userId: user.id,
        userName: user.fullName,
        status,
        location,
        lastSeen: user.lastSeen
      });
    });
  }

  private handleDisconnect(socket: any, user: SocketUser) {
    console.log(`🔌 User disconnected: ${user.fullName}`);
    
    // Remove from mappings
    this.userSockets.delete(user.id);
    this.socketUsers.delete(socket.id);
    
    // Remove from project rooms and notify
    for (const [projectId, room] of this.projectRooms.entries()) {
      if (room.users.has(user.id)) {
        room.users.delete(user.id);
        
        // Notify others in the room
        socket.to(`project:${projectId}`).emit('user_left_project', {
          projectId,
          user: {
            id: user.id,
            fullName: user.fullName,
            role: user.role
          },
          timestamp: new Date().toISOString()
        });
        
        // Clean up empty rooms
        if (room.users.size === 0) {
          this.projectRooms.delete(projectId);
          console.log(`🧹 Cleaned up empty project room: ${projectId}`);
        }
      }
    }
  }

  // Utility methods
  public broadcastToProject(projectId: string, event: string, data: any) {
    const room = this.projectRooms.get(projectId);
    if (room) {
      // Add to room activity
      if (data.type) {
        room.activity.push(data);
        room.lastActivity = new Date().toISOString();
        
        // Keep only last 100 activities
        if (room.activity.length > 100) {
          room.activity = room.activity.slice(-100);
        }
      }
    }
    
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  public broadcastToRole(role: string, event: string, data: any) {
    for (const [socketId, user] of this.socketUsers.entries()) {
      if (user.role === role) {
        this.io.to(socketId).emit(event, data);
      }
    }
  }

  public getProjectUsers(projectId: string): SocketUser[] {
    const room = this.projectRooms.get(projectId);
    return room ? Array.from(room.users.values()) : [];
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.socketUsers.values());
  }

  public getProjectActivity(projectId: string, limit: number = 50): RealtimeEvent[] {
    const room = this.projectRooms.get(projectId);
    return room ? room.activity.slice(-limit) : [];
  }

  private async verifyUserProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('user_id, assigned_inspector, assigned_consultant, assigned_engineer')
        .eq('id', projectId)
        .single();

      if (!project) return false;

      return project.user_id === userId ||
             project.assigned_inspector === userId ||
             project.assigned_consultant === userId ||
             project.assigned_engineer === userId;
    } catch (error) {
      console.error('Error verifying project access:', error);
      return false;
    }
  }

  private async logWorkflowActivity(
    projectId: string,
    userId: string,
    activityType: string,
    payload: any,
    notes?: string
  ) {
    try {
      await supabase
        .from('workflow_activities')
        .insert({
          project_id: projectId,
          user_id: userId,
          activity_type: activityType,
          data_changes: payload,
          notes,
          metadata: {
            source: 'realtime_collaboration',
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Error logging workflow activity:', error);
    }
  }

  private startCleanupInterval() {
    // Clean up old activity data every hour
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      for (const [projectId, room] of this.projectRooms.entries()) {
        room.activity = room.activity.filter(
          activity => activity.timestamp > oneHourAgo
        );
        
        if (room.activity.length === 0 && room.users.size === 0) {
          this.projectRooms.delete(projectId);
        }
      }
      
      console.log(`🧹 Cleaned up old activity data. Active rooms: ${this.projectRooms.size}`);
    }, 60 * 60 * 1000); // Every hour
  }

  // Public API for external modules
  public notifyProjectUpdate(projectId: string, updateType: string, data: any) {
    this.broadcastToProject(projectId, updateType, {
      type: updateType,
      payload: data,
      timestamp: new Date().toISOString(),
      source: 'system'
    });
  }

  public notifyUserDirectly(userId: string, notification: any) {
    return this.sendToUser(userId, 'direct_notification', notification);
  }

  public getRoomStatistics() {
    return {
      activeRooms: this.projectRooms.size,
      connectedUsers: this.socketUsers.size,
      roomDetails: Array.from(this.projectRooms.entries()).map(([projectId, room]) => ({
        projectId,
        userCount: room.users.size,
        activityCount: room.activity.length,
        lastActivity: room.lastActivity
      }))
    };
  }
}

export default RealtimeServer;