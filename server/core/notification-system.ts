// Comprehensive Notification System for Multi-Role Workflow
// Handles email notifications, in-app notifications, and user preferences

import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! || process.env.SUPABASE_ANON_KEY!
);

// Notification types and templates
export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
  category: 'handoff' | 'update' | 'comment' | 'file' | 'system';
  defaultEnabled: boolean;
  roles: string[];
}

export interface NotificationData {
  userId: string;
  templateId: string;
  projectId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data: Record<string, any>;
  channels: ('email' | 'in_app' | 'push')[];
  scheduledFor?: string;
}

export interface UserNotificationPreferences {
  userId: string;
  email: boolean;
  inApp: boolean;
  push: boolean;
  handoffs: boolean;
  comments: boolean;
  fileUploads: boolean;
  statusUpdates: boolean;
  systemNotifications: boolean;
  emailFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
}

export class NotificationSystem {
  private emailTransporter: nodemailer.Transporter;
  private templates: Map<string, NotificationTemplate> = new Map();
  private defaultPreferences: UserNotificationPreferences;

  constructor() {
    this.setupEmailTransporter();
    this.loadNotificationTemplates();
    this.setupDefaultPreferences();
    console.log('📧 Notification system initialized');
  }

  private setupEmailTransporter() {
    // Configure email transporter based on environment
    if (process.env.EMAIL_SERVICE === 'smtp') {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!
        }
      });
    } else {
      // Default to SendGrid or similar service
      this.emailTransporter = nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY!
        }
      });
    }
    
    console.log('📬 Email transporter configured');
  }

  private loadNotificationTemplates() {
    const templates: NotificationTemplate[] = [
      {
        id: 'project_handoff',
        name: 'Project Handoff',
        subject: 'New project handoff: {{projectName}}',
        htmlTemplate: `
          <h2>Project Handoff Notification</h2>
          <p>You have received a new project handoff:</p>
          <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <strong>Project:</strong> {{projectName}}<br>
            <strong>From:</strong> {{fromUserName}} ({{fromRole}})<br>
            <strong>Stage:</strong> {{fromStage}} → {{toStage}}<br>
            <strong>Notes:</strong> {{notes}}
          </div>
          <p><a href="{{projectUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a></p>
        `,
        textTemplate: `
Project Handoff Notification

You have received a new project handoff:
Project: {{projectName}}
From: {{fromUserName}} ({{fromRole}})
Stage: {{fromStage}} → {{toStage}}
Notes: {{notes}}

View project: {{projectUrl}}
        `,
        category: 'handoff',
        defaultEnabled: true,
        roles: ['inspector', 'consultant', 'engineer']
      },
      {
        id: 'project_comment',
        name: 'New Comment',
        subject: 'New comment on {{projectName}}',
        htmlTemplate: `
          <h2>New Comment</h2>
          <p>{{userName}} added a comment to {{projectName}}:</p>
          <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff;">
            <em>"{{comment}}"</em>
          </div>
          <p><a href="{{projectUrl}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a></p>
        `,
        textTemplate: `
New Comment

{{userName}} added a comment to {{projectName}}:
"{{comment}}"

View project: {{projectUrl}}
        `,
        category: 'comment',
        defaultEnabled: true,
        roles: ['inspector', 'consultant', 'engineer']
      },
      {
        id: 'file_uploaded',
        name: 'File Uploaded',
        subject: 'New file uploaded to {{projectName}}',
        htmlTemplate: `
          <h2>File Upload Notification</h2>
          <p>{{userName}} uploaded a new file to {{projectName}}:</p>
          <div style="background: #e7f3ff; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <strong>File:</strong> {{fileName}}<br>
            <strong>Type:</strong> {{fileType}}<br>
            <strong>Stage:</strong> {{stage}}<br>
            <strong>Size:</strong> {{fileSize}}
          </div>
          <p><a href="{{projectUrl}}" style="background: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Files</a></p>
        `,
        textTemplate: `
File Upload Notification

{{userName}} uploaded a new file to {{projectName}}:
File: {{fileName}}
Type: {{fileType}}
Stage: {{stage}}
Size: {{fileSize}}

View files: {{projectUrl}}
        `,
        category: 'file',
        defaultEnabled: true,
        roles: ['inspector', 'consultant', 'engineer']
      },
      {
        id: 'project_status_update',
        name: 'Project Status Update',
        subject: 'Project status updated: {{projectName}}',
        htmlTemplate: `
          <h2>Project Status Update</h2>
          <p>{{projectName}} has been updated by {{userName}}:</p>
          <div style="background: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <strong>Stage:</strong> {{previousStage}} → {{currentStage}}<br>
            <strong>Status:</strong> {{status}}<br>
            {{#if notes}}<strong>Notes:</strong> {{notes}}{{/if}}
          </div>
          <p><a href="{{projectUrl}}" style="background: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a></p>
        `,
        textTemplate: `
Project Status Update

{{projectName}} has been updated by {{userName}}:
Stage: {{previousStage}} → {{currentStage}}
Status: {{status}}
{{#if notes}}Notes: {{notes}}{{/if}}

View project: {{projectUrl}}
        `,
        category: 'update',
        defaultEnabled: true,
        roles: ['inspector', 'consultant', 'engineer']
      },
      {
        id: 'sow_generated',
        name: 'SOW Generated',
        subject: 'SOW generated for {{projectName}}',
        htmlTemplate: `
          <h2>SOW Generated</h2>
          <p>A Scope of Work has been generated for {{projectName}}:</p>
          <div style="background: #d4edda; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <strong>Generated by:</strong> {{userName}}<br>
            <strong>Template:</strong> {{templateName}}<br>
            <strong>File size:</strong> {{fileSize}}<br>
            <strong>Generated at:</strong> {{generatedAt}}
          </div>
          <p><a href="{{sowUrl}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download SOW</a></p>
        `,
        textTemplate: `
SOW Generated

A Scope of Work has been generated for {{projectName}}:
Generated by: {{userName}}
Template: {{templateName}}
File size: {{fileSize}}
Generated at: {{generatedAt}}

Download SOW: {{sowUrl}}
        `,
        category: 'update',
        defaultEnabled: true,
        roles: ['consultant', 'engineer']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    console.log(`📝 Loaded ${templates.length} notification templates`);
  }

  private setupDefaultPreferences() {
    this.defaultPreferences = {
      userId: '',
      email: true,
      inApp: true,
      push: false,
      handoffs: true,
      comments: true,
      fileUploads: true,
      statusUpdates: true,
      systemNotifications: true,
      emailFrequency: 'immediate',
      timezone: 'America/New_York'
    };
  }

  // Main notification sending method
  public async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      console.log(`📤 Sending notification: ${notification.templateId} to user ${notification.userId}`);
      
      // Get user preferences
      const preferences = await this.getUserPreferences(notification.userId);
      if (!preferences) {
        console.warn(`No preferences found for user ${notification.userId}`);
        return false;
      }

      // Get template
      const template = this.templates.get(notification.templateId);
      if (!template) {
        console.error(`Template not found: ${notification.templateId}`);
        return false;
      }

      // Check if user wants this type of notification
      if (!this.shouldSendNotification(template, preferences)) {
        console.log(`User preferences disable notification: ${notification.templateId}`);
        return false;
      }

      // Check quiet hours
      if (this.isQuietHours(preferences)) {
        console.log('User is in quiet hours, scheduling for later');
        await this.scheduleNotification(notification, preferences);
        return true;
      }

      const results = await Promise.allSettled([
        // Send email if enabled
        notification.channels.includes('email') && preferences.email
          ? this.sendEmailNotification(notification, template, preferences)
          : Promise.resolve(true),
        
        // Send in-app notification if enabled
        notification.channels.includes('in_app') && preferences.inApp
          ? this.sendInAppNotification(notification, template)
          : Promise.resolve(true),
        
        // Send push notification if enabled (placeholder)
        notification.channels.includes('push') && preferences.push
          ? this.sendPushNotification(notification, template)
          : Promise.resolve(true)
      ]);

      const success = results.some(result => result.status === 'fulfilled');
      
      // Log notification to database
      await this.logNotification(notification, template, success);
      
      return success;
      
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  private async sendEmailNotification(
    notification: NotificationData, 
    template: NotificationTemplate,
    preferences: UserNotificationPreferences
  ): Promise<boolean> {
    try {
      // Get user email
      const { data: user } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', notification.userId)
        .single();

      if (!user?.email) {
        console.warn(`No email found for user ${notification.userId}`);
        return false;
      }

      // Render template
      const subject = this.renderTemplate(template.subject, notification.data);
      const htmlBody = this.renderTemplate(template.htmlTemplate, notification.data);
      const textBody = this.renderTemplate(template.textTemplate, notification.data);

      // Send email
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@roofing-system.com',
        to: user.email,
        subject,
        html: htmlBody,
        text: textBody,
        headers: {
          'X-Priority': this.getPriorityHeader(notification.priority),
          'X-Notification-Type': template.category,
          'X-Project-ID': notification.projectId
        }
      });

      console.log(`✅ Email sent to ${user.email}: ${subject}`);
      return true;
      
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  private async sendInAppNotification(
    notification: NotificationData,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      // Store in-app notification in database
      const { error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: notification.userId,
          title: this.renderTemplate(template.subject, notification.data),
          message: this.renderTemplate(template.textTemplate, notification.data),
          type: template.category,
          priority: notification.priority,
          project_id: notification.projectId,
          data: notification.data,
          read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log(`✅ In-app notification created for user ${notification.userId}`);
      return true;
      
    } catch (error) {
      console.error('Error creating in-app notification:', error);
      return false;
    }
  }

  private async sendPushNotification(
    notification: NotificationData,
    template: NotificationTemplate
  ): Promise<boolean> {
    // Placeholder for push notification implementation
    // Would integrate with FCM, APNs, or web push
    console.log(`📱 Push notification placeholder for user ${notification.userId}`);
    return true;
  }

  // Convenience methods for common notifications
  public async notifyHandoff(data: {
    toUserId: string;
    fromUserId: string;
    projectId: string;
    projectName: string;
    fromStage: string;
    toStage: string;
    notes?: string;
  }): Promise<boolean> {
    // Get from user details
    const { data: fromUser } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', data.fromUserId)
      .single();

    return this.sendNotification({
      userId: data.toUserId,
      templateId: 'project_handoff',
      projectId: data.projectId,
      priority: 'high',
      data: {
        ...data,
        fromUserName: fromUser?.full_name || 'Unknown User',
        fromRole: fromUser?.role || 'unknown',
        projectUrl: `${process.env.FRONTEND_URL}/projects/${data.projectId}`
      },
      channels: ['email', 'in_app']
    });
  }

  public async notifyComment(data: {
    projectId: string;
    projectName: string;
    comment: string;
    commentUserId: string;
    recipientUserIds: string[];
  }): Promise<boolean[]> {
    // Get commenter details
    const { data: commenter } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', data.commentUserId)
      .single();

    const notifications = data.recipientUserIds
      .filter(userId => userId !== data.commentUserId) // Don't notify the commenter
      .map(userId => this.sendNotification({
        userId,
        templateId: 'project_comment',
        projectId: data.projectId,
        priority: 'normal',
        data: {
          ...data,
          userName: commenter?.full_name || 'Unknown User',
          projectUrl: `${process.env.FRONTEND_URL}/projects/${data.projectId}`
        },
        channels: ['email', 'in_app']
      }));

    return Promise.all(notifications);
  }

  public async notifyFileUpload(data: {
    projectId: string;
    projectName: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    stage: string;
    uploaderUserId: string;
    recipientUserIds: string[];
  }): Promise<boolean[]> {
    // Get uploader details
    const { data: uploader } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', data.uploaderUserId)
      .single();

    const notifications = data.recipientUserIds
      .filter(userId => userId !== data.uploaderUserId) // Don't notify the uploader
      .map(userId => this.sendNotification({
        userId,
        templateId: 'file_uploaded',
        projectId: data.projectId,
        priority: 'normal',
        data: {
          ...data,
          userName: uploader?.full_name || 'Unknown User',
          projectUrl: `${process.env.FRONTEND_URL}/projects/${data.projectId}`
        },
        channels: ['email', 'in_app']
      }));

    return Promise.all(notifications);
  }

  public async notifyStatusUpdate(data: {
    projectId: string;
    projectName: string;
    previousStage: string;
    currentStage: string;
    status: string;
    notes?: string;
    updaterUserId: string;
    recipientUserIds: string[];
  }): Promise<boolean[]> {
    // Get updater details
    const { data: updater } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', data.updaterUserId)
      .single();

    const notifications = data.recipientUserIds
      .filter(userId => userId !== data.updaterUserId) // Don't notify the updater
      .map(userId => this.sendNotification({
        userId,
        templateId: 'project_status_update',
        projectId: data.projectId,
        priority: 'normal',
        data: {
          ...data,
          userName: updater?.full_name || 'Unknown User',
          projectUrl: `${process.env.FRONTEND_URL}/projects/${data.projectId}`
        },
        channels: ['email', 'in_app']
      }));

    return Promise.all(notifications);
  }

  // User preference management
  public async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      const { data: preferences } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!preferences) {
        // Create default preferences
        const defaultPrefs = { ...this.defaultPreferences, userId };
        await this.updateUserPreferences(userId, defaultPrefs);
        return defaultPrefs;
      }

      return preferences as UserNotificationPreferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  public async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log(`✅ Updated notification preferences for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  // Utility methods
  private shouldSendNotification(
    template: NotificationTemplate, 
    preferences: UserNotificationPreferences
  ): boolean {
    switch (template.category) {
      case 'handoff':
        return preferences.handoffs;
      case 'comment':
        return preferences.comments;
      case 'file':
        return preferences.fileUploads;
      case 'update':
        return preferences.statusUpdates;
      case 'system':
        return preferences.systemNotifications;
      default:
        return true;
    }
  }

  private isQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: preferences.timezone 
    });
    
    return currentTime >= preferences.quietHoursStart && 
           currentTime <= preferences.quietHoursEnd;
  }

  private async scheduleNotification(
    notification: NotificationData,
    preferences: UserNotificationPreferences
  ): Promise<void> {
    // Schedule notification after quiet hours
    // Implementation would use a job queue like Bull or simple setTimeout
    console.log(`⏰ Scheduling notification for after quiet hours`);
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;
    
    // Simple template replacement (could use handlebars for more complex templates)
    Object.keys(data).forEach(key => {
      const value = data[key] || '';
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    // Handle conditional blocks (simple implementation)
    rendered = rendered.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
      return data[condition] ? content : '';
    });
    
    return rendered;
  }

  private getPriorityHeader(priority: string): string {
    switch (priority) {
      case 'urgent':
        return '1 (Highest)';
      case 'high':
        return '2 (High)';
      case 'normal':
        return '3 (Normal)';
      case 'low':
        return '5 (Lowest)';
      default:
        return '3 (Normal)';
    }
  }

  private async logNotification(
    notification: NotificationData,
    template: NotificationTemplate,
    success: boolean
  ): Promise<void> {
    try {
      await supabase
        .from('notification_logs')
        .insert({
          user_id: notification.userId,
          template_id: notification.templateId,
          project_id: notification.projectId,
          priority: notification.priority,
          channels: notification.channels,
          success,
          sent_at: new Date().toISOString(),
          data: notification.data
        });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Public API methods
  public getAvailableTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  public async getNotificationHistory(
    userId: string, 
    limit: number = 50
  ): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  public async markInAppNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  public async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false);

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export default NotificationSystem;